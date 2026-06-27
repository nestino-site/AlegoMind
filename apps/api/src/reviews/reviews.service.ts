import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(seekerId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.seekerId !== seekerId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.COMPLETED) throw new ForbiddenException('Can only review completed sessions');

    const existing = await this.prisma.review.findUnique({ where: { bookingId: dto.bookingId } });
    if (existing) throw new ConflictException('Review already submitted for this booking');

    const review = await this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        seekerId,
        professionalId: booking.professionalId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    await this.recalculateProfessionalRating(booking.professionalId);

    return review;
  }

  private async recalculateProfessionalRating(professionalId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { professionalId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await this.prisma.professional.update({
      where: { id: professionalId },
      data: {
        rating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
        reviewCount: stats._count.id,
      },
    });
  }

  async findByProfessional(professionalId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { professionalId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { seeker: { select: { displayName: true, avatar: true } } },
      }),
      this.prisma.review.count({ where: { professionalId } }),
    ]);
    return { items, total, page, limit };
  }
}
