import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';

import { loadEnv } from './env.js';
import { ENV } from './tokens.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), '../../.env'),
      ],
      validate: (raw) => loadEnv(raw as NodeJS.ProcessEnv),
    }),
  ],
  providers: [
    {
      provide: ENV,
      useFactory: () => loadEnv(),
    },
  ],
  exports: [ENV],
})
export class AppConfigModule {}
