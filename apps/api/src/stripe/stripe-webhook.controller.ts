import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
  RawBodyRequest,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { StripeWebhookService } from './stripe-webhook.service';
import Stripe from 'stripe';

@ApiTags('stripe')
@SkipThrottle()
@Controller({ path: 'stripe', version: VERSION_NEUTRAL })
export class StripeWebhookController {
  constructor(
    private stripeService: StripeService,
    private webhookService: StripeWebhookService,
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook receiver — do not call manually' })
  async handleWebhook(
    @Headers('stripe-signature') sig: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructEvent(req.rawBody!, sig);
    } catch (err: any) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.webhookService.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case 'payment_intent.payment_failed':
        await this.webhookService.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case 'customer.subscription.updated':
        await this.webhookService.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        await this.webhookService.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
    }

    return { received: true };
  }
}
