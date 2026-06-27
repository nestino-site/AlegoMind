import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { StripeModule } from './stripe/stripe.module';
import { BookingsModule } from './bookings/bookings.module';
import { MessagesModule } from './messages/messages.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AiModule } from './ai/ai.module';
import appConfig from './config/app.config';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    ProfessionalsModule,
    StripeModule,
    BookingsModule,
    MessagesModule,
    ReviewsModule,
    SubscriptionsModule,
    AiModule,
  ],
})
export class AppModule {}
