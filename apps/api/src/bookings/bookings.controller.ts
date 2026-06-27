import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AccountType, User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountTypeGuard } from '../common/guards/account-type.guard';
import { RequireAccountType } from '../common/decorators/require-account-type.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'bookings', version: '1' })
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  // ── Static paths first ────────────────────────────────────────────────────────

  @Get('my')
  @ApiOperation({ summary: "Seeker's own bookings" })
  findMine(@CurrentUser() user: User) {
    return this.bookingsService.findMyBookings(user.id);
  }

  @Get('professional')
  @UseGuards(AccountTypeGuard)
  @RequireAccountType(AccountType.PROFESSIONAL)
  @ApiOperation({ summary: "Professional's incoming bookings (PROFESSIONAL accounts only)" })
  findProfessional(@CurrentUser() user: User) {
    return this.bookingsService.findProfessionalBookings(user.id);
  }

  // ── Non-parameterized actions ─────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create booking + Stripe PaymentIntent' })
  @ApiResponse({ status: 201, description: 'Returns { booking, clientSecret }' })
  create(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  // ── Parameterized paths last ──────────────────────────────────────────────────

  @Post(':id/confirm')
  @ApiOperation({
    summary: 'Confirm booking after Stripe payment succeeds on the client',
    description:
      'Verifies the PaymentIntent with Stripe and transitions the booking to CONFIRMED. ' +
      'Safe to call multiple times — idempotent if booking is already confirmed. ' +
      'The webhook also confirms automatically; this is a frontend fallback.',
  })
  confirm(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.confirm(id, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel a booking',
    description: 'Free cancellation up to 24 hours before the session. Cancels the Stripe PaymentIntent if not yet captured.',
  })
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.cancel(id, user.id);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a pending or confirmed booking to a new datetime' })
  reschedule(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: RescheduleBookingDto,
  ) {
    return this.bookingsService.reschedule(id, user.id, dto);
  }
}
