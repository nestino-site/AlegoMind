import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { AccountTypeGuard } from '../common/guards/account-type.guard';
import { RequireAccountType } from '../common/decorators/require-account-type.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccountType, User } from '@prisma/client';
import { ListProfessionalsDto } from './dto/list-professionals.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';

@ApiTags('professionals')
@Controller({ path: 'professionals', version: '1' })
export class ProfessionalsController {
  constructor(private professionalsService: ProfessionalsService) {}

  // ── Static paths first (NestJS resolves :id params after these) ──────────────

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Personalized recommendations based on seeker preferences',
    description:
      'Scores professionals by: specialization overlap (40%) → format match (30%) → price fit (20%) → rating (10%). Falls back to top-rated if no preferences are set.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 20)' })
  getRecommended(@CurrentUser() user: User, @Query('limit') limit?: string) {
    return this.professionalsService.getRecommended(user.id, limit ? Math.min(Number(limit), 50) : 20);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, AccountTypeGuard)
  @RequireAccountType(AccountType.PROFESSIONAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current professional's own profile" })
  getMyProfile(@CurrentUser() user: User) {
    return this.professionalsService.findMyProfile(user.id);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard, AccountTypeGuard)
  @RequireAccountType(AccountType.PROFESSIONAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create professional profile (PROFESSIONAL accounts only)' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  createProfile(@CurrentUser() user: User, @Body() dto: CreateProfileDto) {
    return this.professionalsService.createProfile(user.id, user.accountType, dto);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, AccountTypeGuard)
  @RequireAccountType(AccountType.PROFESSIONAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update professional profile (PROFESSIONAL accounts only)' })
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.professionalsService.updateProfile(user.id, user.accountType, dto);
  }

  @Post('availability')
  @UseGuards(JwtAuthGuard, AccountTypeGuard)
  @RequireAccountType(AccountType.PROFESSIONAL)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Replace weekly availability slots (PROFESSIONAL accounts only)',
    description: 'Sends the complete new schedule — all existing slots are deleted and replaced.',
  })
  setAvailability(@CurrentUser() user: User, @Body() dto: SetAvailabilityDto) {
    return this.professionalsService.setAvailability(user.id, user.accountType, dto);
  }

  // ── Chat services (professional's configurable menu) ─────────────────────────

  @Get('chat-services/mine')
  @UseGuards(JwtAuthGuard, AccountTypeGuard)
  @RequireAccountType(AccountType.PROFESSIONAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my chat services (all, including inactive)' })
  getMyChatServices(@CurrentUser() user: User) {
    return this.professionalsService.getMyChatServices(user.id);
  }

  @Post('chat-services')
  @UseGuards(JwtAuthGuard, AccountTypeGuard)
  @RequireAccountType(AccountType.PROFESSIONAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a chat service option' })
  createChatService(
    @CurrentUser() user: User,
    @Body() dto: { name: string; description?: string; price: number; isActive?: boolean },
  ) {
    return this.professionalsService.createChatService(user.id, dto);
  }

  @Patch('chat-services/:serviceId')
  @UseGuards(JwtAuthGuard, AccountTypeGuard)
  @RequireAccountType(AccountType.PROFESSIONAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a chat service option' })
  updateChatService(
    @CurrentUser() user: User,
    @Param('serviceId') serviceId: string,
    @Body() dto: { name?: string; description?: string; price?: number; isActive?: boolean; sortOrder?: number },
  ) {
    return this.professionalsService.updateChatService(user.id, serviceId, dto);
  }

  @Delete('chat-services/:serviceId')
  @UseGuards(JwtAuthGuard, AccountTypeGuard)
  @RequireAccountType(AccountType.PROFESSIONAL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a chat service option' })
  deleteChatService(@CurrentUser() user: User, @Param('serviceId') serviceId: string) {
    return this.professionalsService.deleteChatService(user.id, serviceId);
  }

  // ── List ─────────────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'List professionals with filters' })
  findAll(@Query() filter: ListProfessionalsDto) {
    return this.professionalsService.findAll(filter);
  }

  // ── Parameterized paths last ──────────────────────────────────────────────────

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Get professional full profile' })
  findOne(@Param('id') id: string) {
    return this.professionalsService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({
    summary: 'Get available time windows for a professional within a date range',
    description:
      'Returns day-by-day availability windows from weekly schedule, with any already-booked periods marked. Date range max 60 days.',
  })
  getAvailability(@Param('id') id: string, @Query() query: AvailabilityQueryDto) {
    return this.professionalsService.getAvailability(id, query.from, query.to);
  }
  @Get(':id/chat-services')
  @ApiOperation({ summary: "Get a professional's active chat services" })
  getChatServices(@Param('id') id: string) {
    return this.professionalsService.getChatServices(id);
  }
}
