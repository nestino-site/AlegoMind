import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AccountTypeGuard } from '../common/guards/account-type.guard';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [StripeModule],
  controllers: [BookingsController],
  providers: [BookingsService, AccountTypeGuard],
  exports: [BookingsService],
})
export class BookingsModule {}
