import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  readonly client: Stripe;

  constructor(private config: ConfigService) {
    this.client = new Stripe(
      this.config.get<string>('app.stripeSecretKey') ?? 'sk_test_placeholder',
      { apiVersion: '2023-10-16' },
    );
  }

  async createPaymentIntent(
    amountRon: number,
    metadata: Record<string, string> = {},
  ): Promise<Stripe.PaymentIntent> {
    return this.client.paymentIntents.create({
      amount: Math.round(amountRon * 100),
      currency: 'ron',
      metadata,
    });
  }

  async retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    return this.client.paymentIntents.retrieve(id);
  }

  async cancelPaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    return this.client.paymentIntents.cancel(id);
  }

  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    return this.client.customers.create({ email, name });
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    metadata: Record<string, string> = {},
  ): Promise<Stripe.Subscription> {
    return this.client.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata,
    });
  }

  async cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.client.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
  }

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = this.config.get<string>('app.stripeWebhookSecret') ?? '';
    return this.client.webhooks.constructEvent(rawBody, signature, secret);
  }
}
