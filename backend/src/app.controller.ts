import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  Sse,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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

  @Post('/analyze')
  @UseInterceptors(FileInterceptor('cvFile', { storage: memoryStorage() }))
  async analyzeProfileWithCv(
    @Req() req: any,
    @Res() res: any,
    @Body('githubUsername') githubUsername: string,
    @Body('jobDescription') jobDescription: string,
    @UploadedFile() cvFile?: Express.Multer.File,
  ): Promise<void> {
    let cvText: string | undefined;

    if (cvFile) {
      try {
        cvText = await this.analyzeService.extractCvText(cvFile);
      } catch (err: any) {
        res.status(400).json({ error: err.message });
        return;
      }
    }

    const stream$ = this.analyzeService.analyzeProfile(
      githubUsername,
      jobDescription,
      cvText,
    );

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const subscription = stream$.subscribe({
      next: (msg: MessageResult) => {
        res.write(`data: ${JSON.stringify(msg.data)}\n\n`);
      },
      complete: () => res.end(),
      error: (err: Error) => {
        res.write(
          `data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`,
        );
        res.end();
      },
    });

    req.on('close', () => subscription.unsubscribe());
  }
}
