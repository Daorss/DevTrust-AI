import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AnalyzeService } from './analyze.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AnalyzeService],
})
export class AppModule {}
