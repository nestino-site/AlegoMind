import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { OnboardingPreferencesDto } from './dto/onboarding-preferences.dto';
import { AccountType } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        accountType: true,
        firstName: true,
        displayName: true,
        avatar: true,
        preferredLanguage: true,
        isEmailVerified: true,
        isAnonymous: true,
        subscriptionTier: true,
        points: true,
        createdAt: true,
        matchingPreference: true,
        professional: {
          select: {
            id: true,
            type: true,
            isVerified: true,
            isAvailable: true,
            rating: true,
            reviewCount: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        username: true,
        accountType: true,
        firstName: true,
        displayName: true,
        avatar: true,
        preferredLanguage: true,
        isAnonymous: true,
        subscriptionTier: true,
        points: true,
      },
    });
  }

  async saveMatchingPreferences(userId: string, dto: OnboardingPreferencesDto) {
    // Only seekers have matching preferences
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.accountType !== AccountType.SEEKER) {
      throw new ForbiddenException('Matching preferences are only for SEEKER accounts');
    }

    const pref = await this.prisma.matchingPreference.upsert({
      where: { userId },
      create: {
        userId,
        topics: dto.topics,
        communicationFormats: dto.communicationFormats,
        providerGender: dto.providerGender,
        providerAgeMin: dto.providerAgeMin,
        providerAgeMax: dto.providerAgeMax,
        preferredType: dto.preferredType,
      },
      update: {
        topics: dto.topics,
        communicationFormats: dto.communicationFormats,
        providerGender: dto.providerGender ?? null,
        providerAgeMin: dto.providerAgeMin ?? null,
        providerAgeMax: dto.providerAgeMax ?? null,
        preferredType: dto.preferredType ?? null,
      },
    });

    return pref;
  }
}
