import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { SubscriptionTier } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private stripeService: StripeService,
  ) {}

  async getMySubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing', 'canceling'] } },
    });
  }

  async createPlusSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing'] } },
    });
    if (existing) throw new ConflictException('You already have an active Plus subscription');

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(
        user.email,
        user.displayName ?? user.firstName ?? undefined,
      );
      stripeCustomerId = customer.id;
      await this.prisma.user.update({ where: { id: userId }, data: { stripeCustomerId } });
    }

    const priceId = this.config.get<string>('app.stripeHealthPlusPriceId');
    if (!priceId) {
      throw new BadRequestException('Health Plus subscription is not configured on this server');
    }

    const stripeSub = await this.stripeService.createSubscription(stripeCustomerId, priceId, { userId });

    const periodEnd = new Date(stripeSub.current_period_end * 1000);
    const latestInvoice = stripeSub.latest_invoice as Stripe.Invoice | null;
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | null;

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        tier: SubscriptionTier.PLUS,
        stripeSubscriptionId: stripeSub.id,
        currentPeriodEnd: periodEnd,
        status: stripeSub.status,
      },
    });

    return {
      subscription,
      clientSecret: paymentIntent?.client_secret ?? null,
      subscriptionId: stripeSub.id,
    };
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing'] } },
    });
    if (!subscription) throw new NotFoundException('No active subscription found');

    // Stripe will send customer.subscription.updated when cancel_at_period_end is set,
    // and customer.subscription.deleted when it finally expires.
    await this.stripeService.cancelSubscriptionAtPeriodEnd(subscription.stripeSubscriptionId);

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'canceling' },
    });
  }
}
