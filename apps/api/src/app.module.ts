import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { CharactersModule } from './characters/characters.module.js';
import { ApiExceptionFilter } from './common/filters/api-exception.filter.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { AppConfigModule } from './config/config.module.js';
import { CoachingModule } from './coaching/coaching.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { IdentityModule } from './identity/identity.module.js';
import { MediaModule } from './media/media.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { NutritionModule } from './nutrition/nutrition.module.js';
import { OnboardingModule } from './onboarding/onboarding.module.js';
import { PrivacyModule } from './privacy/privacy.module.js';
import { ProfilesModule } from './profiles/profiles.module.js';
import { ProgressionModule } from './progression/progression.module.js';
import { TrainingModule } from './training/training.module.js';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 20,
      },
    ]),
    ProfilesModule,
    IdentityModule,
    OnboardingModule,
    CharactersModule,
    TrainingModule,
    NutritionModule,
    ProgressionModule,
    MediaModule,
    NotificationsModule,
    CoachingModule,
    PrivacyModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
