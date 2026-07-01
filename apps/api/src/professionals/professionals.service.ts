import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountType, BookingStatus, DayOfWeek } from '@prisma/client';
import { ListProfessionalsDto } from './dto/list-professionals.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { computeMatchScore, matchesGenderPreference } from './matching';

// ─── Day-of-week helper ───────────────────────────────────────────────────────

const JS_DAY_TO_DOW: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

const USER_INCLUDE = {
  select: { firstName: true, displayName: true, avatar: true, createdAt: true },
} as const;

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  // ── List ────────────────────────────────────────────────────────────────────

  async findAll(filter: ListProfessionalsDto) {
    const { page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where = this.buildListWhere(filter);

    const [items, total] = await Promise.all([
      this.prisma.professional.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
        include: { user: USER_INCLUDE },
      }),
      this.prisma.professional.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private buildListWhere(filter: ListProfessionalsDto) {
    const where: Record<string, unknown> = { isAvailable: true };

    if (filter.type) where.type = filter.type;
    if (filter.gender) where.gender = filter.gender;
    if (filter.isVerified !== undefined) where.isVerified = filter.isVerified;
    if (filter.availableForTrial) where.availableForTrial = true;
    if (filter.sessionFormat) where.sessionFormats = { has: filter.sessionFormat };
    if (filter.language) where.languages = { has: filter.language };
    if (filter.maxPrice !== undefined) {
      where.pricePerSession = { lte: filter.maxPrice };
    }
    if (filter.minRating !== undefined) {
      where.rating = { gte: filter.minRating };
    }
    if (filter.specialization) {
      // PostgreSQL: check if any element in the array contains the search term (case-insensitive)
      // We use hasSome with the exact value; for free-text search upgrade to $queryRaw later
      where.specializations = { has: filter.specialization };
    }
    if (filter.availableNow) {
      const now = new Date();
      const dayOfWeek = JS_DAY_TO_DOW[now.getUTCDay()];
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const mm = String(now.getUTCMinutes()).padStart(2, '0');
      const currentTime = `${hh}:${mm}`;

      where.availability = {
        some: {
          dayOfWeek,
          startTime: { lte: currentTime },
          endTime: { gt: currentTime },
        },
      };
    }

    return where;
  }

  // ── My profile ──────────────────────────────────────────────────────────────

  async findMyProfile(userId: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { userId },
      include: {
        user: USER_INCLUDE,
        availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { seeker: { select: { displayName: true, avatar: true } } },
        },
      },
    });
    if (!professional) throw new NotFoundException('Professional profile not found');
    return professional;
  }

  // ── Detail ──────────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
      include: {
        user: USER_INCLUDE,
        availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { seeker: { select: { displayName: true, avatar: true } } },
        },
      },
    });
    if (!professional) throw new NotFoundException('Professional not found');
    return professional;
  }

  // ── Recommended ─────────────────────────────────────────────────────────────

  async getRecommended(seekerId: string, limit = 20) {
    const prefs = await this.prisma.matchingPreference.findUnique({
      where: { userId: seekerId },
    });

    // No preferences yet — return top-rated as a sensible default
    if (!prefs) {
      const items = await this.prisma.professional.findMany({
        where: { isAvailable: true },
        take: limit,
        orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
        include: { user: USER_INCLUDE },
      });
      return { items, scored: false };
    }

    // Load all available professionals for in-memory scoring
    // (For large datasets, pre-filtering by hard constraints first is sufficient)
    const candidates = await this.prisma.professional.findMany({
      where: {
        isAvailable: true,
        ...(prefs.providerGender && prefs.providerGender !== 'any'
          ? { gender: prefs.providerGender }
          : {}),
        ...(prefs.communicationFormats.length > 0
          ? { sessionFormats: { hasSome: prefs.communicationFormats } }
          : {}),
        ...(prefs.preferredType ? { type: prefs.preferredType } : {}),
      },
      include: { user: USER_INCLUDE },
    });

    const scored = candidates
      .map(p => ({ ...p, _score: computeMatchScore(p, prefs) }))
      .filter(p => matchesGenderPreference(p, prefs.providerGender))
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);

    return { items: scored, scored: true };
  }

  // ── Profile management ───────────────────────────────────────────────────────

  async createProfile(userId: string, accountType: AccountType, dto: CreateProfileDto) {
    if (accountType !== AccountType.PROFESSIONAL) {
      throw new ForbiddenException('Only PROFESSIONAL accounts can create a profile');
    }

    const existing = await this.prisma.professional.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('A professional profile already exists for this account');

    return this.prisma.professional.create({
      data: {
        userId,
        type: dto.type,
        bio: dto.bio,
        specializations: dto.specializations,
        sessionFormats: dto.sessionFormats,
        languages: dto.languages,
        pricePerSession: dto.pricePerSession,
        trialPrice: dto.trialPrice,
        trialDuration: dto.trialDuration,
        availableForTrial: dto.availableForTrial ?? false,
        yearsExperience: dto.yearsExperience ?? 0,
        gender: dto.gender,
      },
      include: { user: USER_INCLUDE },
    });
  }

  async updateProfile(userId: string, accountType: AccountType, dto: UpdateProfileDto) {
    if (accountType !== AccountType.PROFESSIONAL) {
      throw new ForbiddenException('Only PROFESSIONAL accounts can update a profile');
    }

    const professional = await this.prisma.professional.findUnique({ where: { userId } });
    if (!professional) throw new NotFoundException('Professional profile not found. Create one first.');

    return this.prisma.professional.update({
      where: { userId },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.specializations && { specializations: dto.specializations }),
        ...(dto.sessionFormats && { sessionFormats: dto.sessionFormats }),
        ...(dto.languages && { languages: dto.languages }),
        ...(dto.pricePerSession !== undefined && { pricePerSession: dto.pricePerSession }),
        ...(dto.trialPrice !== undefined && { trialPrice: dto.trialPrice }),
        ...(dto.trialDuration !== undefined && { trialDuration: dto.trialDuration }),
        ...(dto.availableForTrial !== undefined && { availableForTrial: dto.availableForTrial }),
        ...(dto.yearsExperience !== undefined && { yearsExperience: dto.yearsExperience }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...('welcomeMessage' in dto && { welcomeMessage: (dto as any).welcomeMessage ?? null }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...('topicResponseTemplate' in dto && { topicResponseTemplate: (dto as any).topicResponseTemplate ?? null }),
      } as Parameters<typeof this.prisma.professional.update>[0]['data'],
      include: { user: USER_INCLUDE },
    });
  }

  // ── Availability management ─────────────────────────────────────────────────

  async setAvailability(userId: string, accountType: AccountType, dto: SetAvailabilityDto) {
    if (accountType !== AccountType.PROFESSIONAL) {
      throw new ForbiddenException('Only PROFESSIONAL accounts can set availability');
    }

    const professional = await this.prisma.professional.findUnique({ where: { userId } });
    if (!professional) throw new NotFoundException('Professional profile not found');

    // Validate: endTime > startTime for each slot
    for (const slot of dto.slots) {
      if (slot.endTime <= slot.startTime) {
        throw new BadRequestException(
          `Slot ${slot.dayOfWeek} ${slot.startTime}-${slot.endTime}: endTime must be after startTime`,
        );
      }
    }

    // Replace all existing slots atomically
    await this.prisma.$transaction([
      this.prisma.availability.deleteMany({ where: { professionalId: professional.id } }),
      this.prisma.availability.createMany({
        data: dto.slots.map(s => ({
          professionalId: professional.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      }),
    ]);

    return this.prisma.availability.findMany({
      where: { professionalId: professional.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  // ── Availability windows for date range ─────────────────────────────────────

  async getAvailability(professionalId: string, from: string, to: string) {
    const fromDate = new Date(`${from}T00:00:00Z`);
    const toDate = new Date(`${to}T23:59:59Z`);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    if (fromDate > toDate) {
      throw new BadRequestException('from must be before or equal to to');
    }
    const daysDiff = (toDate.getTime() - fromDate.getTime()) / 86_400_000;
    if (daysDiff > 60) {
      throw new BadRequestException('Date range cannot exceed 60 days');
    }

    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
    });
    if (!professional) throw new NotFoundException('Professional not found');

    const [weeklySlots, existingBookings] = await Promise.all([
      this.prisma.availability.findMany({ where: { professionalId } }),
      this.prisma.booking.findMany({
        where: {
          professionalId,
          scheduledAt: { gte: fromDate, lte: toDate },
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        },
        select: { scheduledAt: true, durationMinutes: true },
      }),
    ]);

    // Expand recurring slots into per-day windows
    const days: {
      date: string;
      dayOfWeek: DayOfWeek;
      windows: { startTime: string; endTime: string; bookedPeriods: { start: string; end: string }[] }[];
    }[] = [];

    const cursor = new Date(fromDate);
    while (cursor <= toDate) {
      const dow = JS_DAY_TO_DOW[cursor.getUTCDay()];
      const daySlots = weeklySlots.filter(s => s.dayOfWeek === dow);

      if (daySlots.length > 0) {
        const dateStr = cursor.toISOString().split('T')[0];

        // Find bookings on this date
        const dayBookings = existingBookings.filter(b => {
          return b.scheduledAt.toISOString().split('T')[0] === dateStr;
        });

        days.push({
          date: dateStr,
          dayOfWeek: dow,
          windows: daySlots.map(slot => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            bookedPeriods: dayBookings
              .filter(b => {
                const bookingTime = b.scheduledAt.toISOString().substring(11, 16);
                const bookingEnd = addMinutes(bookingTime, b.durationMinutes);
                // Booking overlaps window if it starts before window end and ends after window start
                return bookingTime < slot.endTime && bookingEnd > slot.startTime;
              })
              .map(b => ({
                start: b.scheduledAt.toISOString().substring(11, 16),
                end: addMinutes(b.scheduledAt.toISOString().substring(11, 16), b.durationMinutes),
              })),
          })),
        });
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return { professionalId, from, to, days };
  }

  async getChatServices(professionalId: string) {
    return this.prisma.chatService.findMany({
      where: { professionalId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getMyChatServices(userId: string) {
    const professional = await this.prisma.professional.findUnique({ where: { userId } });
    if (!professional) throw new NotFoundException('Professional profile not found');
    return this.prisma.chatService.findMany({
      where: { professionalId: professional.id },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createChatService(
    userId: string,
    dto: { name: string; description?: string; price: number; isActive?: boolean },
  ) {
    const professional = await this.prisma.professional.findUnique({ where: { userId } });
    if (!professional) throw new NotFoundException('Professional profile not found');

    const agg = await this.prisma.chatService.aggregate({
      _max: { sortOrder: true },
      where: { professionalId: professional.id },
    });

    return this.prisma.chatService.create({
      data: {
        professionalId: professional.id,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        isActive: dto.isActive ?? true,
        sortOrder: (agg._max.sortOrder ?? 0) + 1,
      },
    });
  }

  async updateChatService(
    userId: string,
    serviceId: string,
    dto: { name?: string; description?: string; price?: number; isActive?: boolean; sortOrder?: number },
  ) {
    const professional = await this.prisma.professional.findUnique({ where: { userId } });
    if (!professional) throw new NotFoundException('Professional profile not found');

    const service = await this.prisma.chatService.findUnique({ where: { id: serviceId } });
    if (!service || service.professionalId !== professional.id) {
      throw new NotFoundException('Chat service not found');
    }

    return this.prisma.chatService.update({
      where: { id: serviceId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deleteChatService(userId: string, serviceId: string) {
    const professional = await this.prisma.professional.findUnique({ where: { userId } });
    if (!professional) throw new NotFoundException('Professional profile not found');

    const service = await this.prisma.chatService.findUnique({ where: { id: serviceId } });
    if (!service || service.professionalId !== professional.id) {
      throw new NotFoundException('Chat service not found');
    }

    await this.prisma.chatService.delete({ where: { id: serviceId } });
    return { deleted: true };
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
