import { Controller, Get, Query } from '@nestjs/common';
import { AnalyzeService } from './analyze.service';

@Controller()
export class AppController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Get('/analyze')
  analyzeProfile(
    @Query('githubUsername') githubUsername: string,
    @Query('jobDescription') jobDescription: string,
  ): Promise<string> {
    return this.analyzeService.analyzeProfile(githubUsername, jobDescription);
  }
}
