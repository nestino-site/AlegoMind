import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StripeWebhookController],
  providers: [StripeService, StripeWebhookService],
  exports: [StripeService],
})
export class StripeModule {}
