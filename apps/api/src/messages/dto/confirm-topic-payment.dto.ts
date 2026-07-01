import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmTopicPaymentDto {
  @ApiProperty({ description: 'Stripe PaymentIntent ID to confirm' })
  @IsString()
  paymentIntentId: string;
}
