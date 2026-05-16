import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AnalyzeService } from './analyze.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 120_000, limit: 3 }]),
  ],
  controllers: [AppController],
  providers: [
    AnalyzeService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
