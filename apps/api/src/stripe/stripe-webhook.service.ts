import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, SubscriptionTier } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(private prisma: PrismaService) {}

  async handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
    const booking = await this.prisma.booking.findFirst({
      where: { stripePaymentIntentId: pi.id },
    });
    if (!booking || booking.status !== BookingStatus.PENDING) return;

    const user = await this.prisma.user.findUnique({ where: { id: booking.seekerId } });
    const multiplier = user?.subscriptionTier === SubscriptionTier.PLUS ? 2 : 1;
    const points = Math.floor(booking.price) * multiplier;

    await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CONFIRMED },
      }),
      this.prisma.user.update({
        where: { id: booking.seekerId },
        data: { points: { increment: points } },
      }),
    ]);

    this.logger.log(`Booking ${booking.id} confirmed via webhook — +${points} points to seeker ${booking.seekerId}`);
  }

  async handlePaymentIntentFailed(pi: Stripe.PaymentIntent): Promise<void> {
    const booking = await this.prisma.booking.findFirst({
      where: { stripePaymentIntentId: pi.id, status: BookingStatus.PENDING },
    });
    if (!booking) return;

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CANCELLED },
    });

    this.logger.warn(`Booking ${booking.id} cancelled due to payment failure`);
  }

  async handleSubscriptionUpdated(sub: Stripe.Subscription): Promise<void> {
    const dbSub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: sub.id },
    });
    if (!dbSub) return;

    const isActive = sub.status === 'active' || sub.status === 'trialing';

    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      }),
      this.prisma.user.update({
        where: { id: dbSub.userId },
        data: { subscriptionTier: isActive ? SubscriptionTier.PLUS : SubscriptionTier.FREE },
      }),
    ]);
  }

  async handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
    const dbSub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: sub.id },
    });
    if (!dbSub) return;

    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { stripeSubscriptionId: sub.id },
        data: { status: 'canceled' },
      }),
      this.prisma.user.update({
        where: { id: dbSub.userId },
        data: { subscriptionTier: SubscriptionTier.FREE },
      }),
    ]);

    this.logger.log(`Subscription ${sub.id} deleted — user ${dbSub.userId} downgraded to FREE`);
  }
}
