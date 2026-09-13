import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ProfilesModule } from '../profiles/profiles.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { MeController } from './me.controller.js';

@Module({
  imports: [JwtModule.register({}), ProfilesModule],
  controllers: [AuthController, MeController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class IdentityModule {}
