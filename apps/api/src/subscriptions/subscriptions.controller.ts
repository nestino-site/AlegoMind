import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my active subscription' })
  getMySubscription(@CurrentUser() user: User) {
    return this.subscriptionsService.getMySubscription(user.id);
  }

  @Post('create')
  @ApiOperation({
    summary: 'Subscribe to Health Plus',
    description:
      'Creates a Stripe Subscription and returns a clientSecret for the frontend to collect ' +
      'the payment method and confirm the first invoice. ' +
      'Pass clientSecret to stripe.confirmCardPayment() or stripe.confirmPayment().',
  })
  @ApiResponse({ status: 201, description: 'Returns { subscription, clientSecret, subscriptionId }' })
  create(@CurrentUser() user: User) {
    return this.subscriptionsService.createPlusSubscription(user.id);
  }

  @Post('cancel')
  @ApiOperation({
    summary: 'Cancel subscription at end of current billing period',
    description:
      'Sets cancel_at_period_end on the Stripe subscription. ' +
      'Access remains active until currentPeriodEnd, then the webhook downgrades the account to FREE.',
  })
  cancel(@CurrentUser() user: User) {
    return this.subscriptionsService.cancelSubscription(user.id);
  }
}
