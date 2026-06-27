import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { BookingStatus, SubscriptionTier } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';

const PROFESSIONAL_SELECT = {
  include: { user: { select: { firstName: true, displayName: true, avatar: true } } },
} as const;

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private stripeService: StripeService,
  ) {}

  async create(seekerId: string, dto: CreateBookingDto) {
    const professional = await this.prisma.professional.findUnique({
      where: { id: dto.professionalId },
    });
    if (!professional) throw new NotFoundException('Professional not found');

    const price =
      dto.isTrial && professional.availableForTrial && professional.trialPrice
        ? professional.trialPrice
        : professional.pricePerSession;

    const feePercent = this.config.get<number>('app.platformFeePercent', 0.2);
    const platformFee = Math.round(price * feePercent * 100) / 100;
    const professionalEarning = Math.round((price - platformFee) * 100) / 100;

    const paymentIntent = await this.stripeService.createPaymentIntent(price, {
      seekerId,
      professionalId: dto.professionalId,
    });

    const booking = await this.prisma.booking.create({
      data: {
        seekerId,
        professionalId: dto.professionalId,
        sessionType: dto.sessionType,
        durationMinutes: dto.durationMinutes,
        scheduledAt: new Date(dto.scheduledAt),
        price,
        platformFee,
        professionalEarning,
        stripePaymentIntentId: paymentIntent.id,
        status: BookingStatus.PENDING,
      },
      include: { professional: PROFESSIONAL_SELECT },
    });

    return { booking, clientSecret: paymentIntent.client_secret };
  }

  // Called by the frontend after Stripe confirms payment on the client side.
  // The webhook also confirms automatically — this is a safe fallback (idempotent).
  async confirm(bookingId: string, seekerId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.seekerId !== seekerId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.PENDING) return booking;

    if (!booking.stripePaymentIntentId) {
      throw new BadRequestException('No payment intent associated with this booking');
    }

    const pi = await this.stripeService.retrievePaymentIntent(booking.stripePaymentIntentId);
    if (pi.status !== 'succeeded') {
      throw new BadRequestException(`Payment not completed (Stripe status: ${pi.status})`);
    }

    return this.confirmAndAwardPoints(booking);
  }

  async cancel(bookingId: string, seekerId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.seekerId !== seekerId) throw new ForbiddenException();

    if (booking.status === BookingStatus.COMPLETED) {
      throw new ForbiddenException('Cannot cancel a completed booking');
    }
    if (booking.status === BookingStatus.CANCELLED) return booking; // idempotent

    const hoursUntilSession = (booking.scheduledAt.getTime() - Date.now()) / 3_600_000;
    if (hoursUntilSession < 24) {
      throw new BadRequestException('Cancellation must be made at least 24 hours before the session');
    }

    if (booking.stripePaymentIntentId) {
      try {
        const pi = await this.stripeService.retrievePaymentIntent(booking.stripePaymentIntentId);
        if (!['succeeded', 'canceled'].includes(pi.status)) {
          await this.stripeService.cancelPaymentIntent(booking.stripePaymentIntentId);
        }
      } catch (_err) {
        // PaymentIntent may not exist yet; continue with DB-only cancellation
      }
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });
  }

  async reschedule(bookingId: string, seekerId: string, dto: RescheduleBookingDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.seekerId !== seekerId) throw new ForbiddenException();

    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only pending or confirmed bookings can be rescheduled');
    }

    const newDate = new Date(dto.scheduledAt);
    if (newDate <= new Date()) {
      throw new BadRequestException('New session time must be in the future');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { scheduledAt: newDate },
    });
  }

  async findMyBookings(seekerId: string) {
    return this.prisma.booking.findMany({
      where: { seekerId },
      orderBy: { scheduledAt: 'desc' },
      include: { professional: PROFESSIONAL_SELECT },
    });
  }

  async findProfessionalBookings(userId: string) {
    const professional = await this.prisma.professional.findUnique({ where: { userId } });
    if (!professional) throw new NotFoundException('Professional profile not found');

    return this.prisma.booking.findMany({
      where: { professionalId: professional.id },
      orderBy: { scheduledAt: 'desc' },
      include: {
        seeker: { select: { firstName: true, displayName: true, avatar: true } },
      },
    });
  }

  private async confirmAndAwardPoints(booking: { id: string; seekerId: string; price: number }) {
    const user = await this.prisma.user.findUnique({ where: { id: booking.seekerId } });
    const multiplier = user?.subscriptionTier === SubscriptionTier.PLUS ? 2 : 1;
    const points = Math.floor(booking.price) * multiplier;

    const [updatedBooking] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CONFIRMED },
      }),
      this.prisma.user.update({
        where: { id: booking.seekerId },
        data: { points: { increment: points } },
      }),
    ]);

    return updatedBooking;
  }
}
