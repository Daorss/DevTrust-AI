import { Controller, Get, Query, Sse } from '@nestjs/common';
import { AnalyzeService } from './analyze.service';
import { Observable } from 'rxjs';
import { MessageResult } from './models/analysisResponse';

@Controller()
export class AppController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Get('/analyze')
  @Sse('/analyze')
  analyzeProfile(
    @Query('githubUsername') githubUsername: string,
    @Query('jobDescription') jobDescription: string,
  ): Observable<MessageResult> {
    return this.analyzeService.analyzeProfile(githubUsername, jobDescription);
  }
}
