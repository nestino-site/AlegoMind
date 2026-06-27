import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { OnboardingPreferencesDto } from './dto/onboarding-preferences.dto';
import { User } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile (includes matchingPreference if SEEKER)' })
  getMe(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile (name, avatar, language, display name)' })
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  @Post('me/preferences')
  @ApiOperation({
    summary: 'Save seeker matching preferences (onboarding step)',
    description:
      'Sets topics, preferred session formats, provider gender, and age range. SEEKER accounts only.',
  })
  savePreferences(@CurrentUser() user: User, @Body() dto: OnboardingPreferencesDto) {
    return this.usersService.saveMatchingPreferences(user.id, dto);
  }
}
