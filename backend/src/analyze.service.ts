import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { runCli } from 'repomix';
import { Repository } from './models/repository';
import 'dotenv/config';
import {
  AnalysisResultResponse,
  JobFitResult,
  MessageResult,
} from './models/analysisResponse';
import { BehaviorSubject, Observable } from 'rxjs';

interface GeminiJobFitResponse {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  experience_evidence: string;
  seniority_verdict: 'Junior' | 'Mid' | 'Senior';
  verdict: string;
}

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
  created_at: string;
  public_repos: number;
  followers: number;
  following: number;
  bio: string | null;
  email: string | null;
  location: string | null;
  blog: string | null;
}

interface GitHubRepo {
  fork: boolean;
  description: string | null;
  stargazers_count: number;
  pushed_at: string | null;
  language: string | null;
  name: string;
  clone_url: string;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

console.log(
  process.env.GEMINI_API_KEY
    ? 'Gemini API key loaded successfully'
    : 'Gemini API key not found.',
);

@Injectable()
export class AnalyzeService {
  private model: GenerativeModel;
  private progress$: BehaviorSubject<MessageResult> | undefined;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  analyzeProfile(
    githubUsername: string,
    jobDescription: string,
  ): Observable<MessageResult> {
    this.progress$ = new BehaviorSubject<MessageResult>({
      data: { type: 'info', message: '👤 Fetching GitHub profile...' },
    });

    void this.runAnalysingPipeline(githubUsername, jobDescription);

    return this.progress$.asObservable();
  }

  private emit(message: string) {
    this.progress$?.next({ data: { type: 'info', message } });
  }

  private async runAnalysingPipeline(
    githubUsername: string,
    jobDescription: string,
  ) {
    try {
      // Step 1: Fetch profile + all repos in one call
      this.emit('👤 Fetching GitHub profile...');
      let profile: GitHubUser;
      let allRepos: GitHubRepo[];

      try {
        const result = await this.fetchProfile(githubUsername);
        profile = result.profile;
        allRepos = result.repos;
      } catch {
        this.progress$?.next({
          data: { type: 'error', message: '❌ GitHub user not found.' },
        });
        this.progress$?.complete();
        return;
      }

      // Step 2: Compute trust score from profile + repo metadata
      this.emit('🔍 Computing trust score...');
      const { breakdown, totalScore, verdict } = this.computeTrustScore(
        profile,
        allRepos,
      );

      // Step 3: AI summary
      this.emit('🧠 Generating AI summary...');
      const aiSummary = await this.generateAiSummary(
        profile,
        breakdown,
        totalScore,
        verdict,
      );

      const meta = {
        username: profile.login,
        avatarUrl: profile.avatar_url,
        displayName: profile.name || profile.login,
        accountCreated: profile.created_at,
        publicRepos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
      };

      // No JD — emit trust result and finish
      if (!jobDescription?.trim()) {
        this.progress$?.next({
          data: {
            type: 'result',
            totalScore,
            verdict,
            aiSummary,
            meta,
            breakdown,
          },
        });
        this.progress$?.complete();
        return;
      }

      // Step 4: Extract languages from JD
      this.emit('🔍 Analyzing Job Description...');
      const languages = await this.extractRequiredLanguages(jobDescription);
      console.log(`Identified languages: ${languages.join(', ')}`);

      // Step 5: Filter already-fetched repos by language (no extra API call)
      this.emit('🕵️‍♂️ Matching repositories to job requirements...');
      const matchingRepos = this.filterReposByLanguage(allRepos, languages);

      let jobFit: JobFitResult | undefined;

      if (matchingRepos.length === 0) {
        this.emit('🫤 No matching repositories found for the required stack.');
      } else {
        jobFit = await this.analyzeReposForJobFit(
          matchingRepos,
          jobDescription,
        );
      }

      this.progress$?.next({
        data: {
          type: 'result',
          totalScore,
          verdict,
          aiSummary,
          meta,
          breakdown,
          jobFit,
        },
      });
      this.progress$?.complete();
    } catch (error) {
      console.error('Pipeline error:', error);
      this.progress$?.next({
        data: {
          type: 'error',
          message: '❌ Analysis failed. Please try again.',
        },
      });
      this.progress$?.complete();
    }
  }

  private async fetchProfile(
    username: string,
  ): Promise<{ profile: GitHubUser; repos: GitHubRepo[] }> {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const [userRes, reposRes] = await Promise.all([
      octokit.rest.users.getByUsername({ username }),
      octokit.rest.repos.listForUser({
        username,
        sort: 'updated',
        per_page: 100,
        type: 'owner',
      }),
    ]);
    return {
      profile: userRes.data as unknown as GitHubUser,
      repos: reposRes.data as unknown as GitHubRepo[],
    };
  }

  private computeTrustScore(
    profile: GitHubUser,
    repos: GitHubRepo[],
  ): {
    breakdown: AnalysisResultResponse['breakdown'];
    totalScore: number;
    verdict: 'Legitimate' | 'Suspicious' | 'Likely Bot';
  } {
    // Account Age — max 10
    const ageYears =
      (Date.now() - new Date(profile.created_at).getTime()) /
      (1000 * 60 * 60 * 24 * 365);
    const accountAgeScore = Math.min(10, Math.round(ageYears * 2));

    // Profile Completeness — max 10
    let completenessScore = 0;
    if (profile.name) completenessScore += 2;
    if (profile.bio) completenessScore += 3;
    if (profile.avatar_url && !profile.avatar_url.includes('/u/583231'))
      completenessScore += 2;
    if (profile.email) completenessScore += 2;
    if (profile.location || profile.blog) completenessScore += 1;

    // Follower Credibility — max 15
    const followers = profile.followers ?? 0;
    const following = profile.following ?? 0;
    let followerScore = Math.min(12, Math.floor(Math.log10(followers + 1) * 5));
    if (following > 500 && followers / (following || 1) < 0.1)
      followerScore = Math.max(0, followerScore - 5);
    followerScore = Math.min(15, followerScore);

    // Repo Quality — max 15
    const ownRepos = repos.filter((r) => !r.fork);
    const withDesc = ownRepos.filter((r) => r.description).length;
    const withStars = ownRepos.filter((r) => r.stargazers_count > 0).length;
    const repoQualityScore = Math.min(
      15,
      Math.round(ownRepos.length * 0.5 + withDesc * 1 + withStars * 1.5),
    );

    // Activity Pattern — max 20
    const twelveMonthsAgo = Date.now() - 1000 * 60 * 60 * 24 * 365;
    const recentRepos = repos.filter(
      (r) => r.pushed_at && new Date(r.pushed_at).getTime() > twelveMonthsAgo,
    );
    const activityScore = Math.min(
      20,
      recentRepos.length * 2 + Math.min(10, Math.floor(repos.length / 5)),
    );

    // Original Content — max 25
    const originalRatio = repos.length > 0 ? ownRepos.length / repos.length : 0;
    const originalContentScore = Math.round(originalRatio * 25);

    const totalScore =
      accountAgeScore +
      completenessScore +
      followerScore +
      repoQualityScore +
      activityScore +
      originalContentScore;

    const verdict: 'Legitimate' | 'Suspicious' | 'Likely Bot' =
      totalScore >= 70
        ? 'Legitimate'
        : totalScore >= 40
          ? 'Suspicious'
          : 'Likely Bot';

    const breakdown: AnalysisResultResponse['breakdown'] = {
      accountAge: {
        score: accountAgeScore,
        max: 10,
        label: 'Account Age',
        detail: `${Math.round(ageYears * 10) / 10} years old`,
      },
      profileCompleteness: {
        score: completenessScore,
        max: 10,
        label: 'Profile Completeness',
        detail: profile.bio ? profile.bio.slice(0, 80) : 'No bio provided',
      },
      followerCredibility: {
        score: followerScore,
        max: 15,
        label: 'Follower Credibility',
        detail: `${followers} followers · ${following} following`,
      },
      repoQuality: {
        score: repoQualityScore,
        max: 15,
        label: 'Repo Quality',
        detail: `${ownRepos.length} original repos, ${withDesc} with descriptions`,
      },
      activityPattern: {
        score: activityScore,
        max: 20,
        label: 'Activity Pattern',
        detail: `${recentRepos.length} repos active in last 12 months`,
      },
      originalContent: {
        score: originalContentScore,
        max: 25,
        label: 'Original Content',
        detail: `${Math.round(originalRatio * 100)}% non-forked repositories`,
      },
    };

    return { breakdown, totalScore, verdict };
  }

  private async generateAiSummary(
    profile: GitHubUser,
    breakdown: AnalysisResultResponse['breakdown'],
    totalScore: number,
    verdict: string,
  ): Promise<string> {
    const prompt = `You are a security analyst reviewing a GitHub profile for legitimacy. Write 2-3 plain-English sentences summarizing this profile's trust analysis. Be direct, specific, and avoid buzzwords.

Profile: ${profile.login} (${profile.name || 'No display name'})
Trust score: ${totalScore}/100 — ${verdict}
Account age: ${breakdown.accountAge.detail}
Followers: ${breakdown.followerCredibility.detail}
Repo quality: ${breakdown.repoQuality.detail}
Activity: ${breakdown.activityPattern.detail}
Original content: ${breakdown.originalContent.detail}

Return only the plain text summary, no JSON, no markdown.`;

    const result = await this.model.generateContent(prompt);
    return result.response.text().trim();
  }

  private filterReposByLanguage(
    repos: GitHubRepo[],
    targetLanguages: string[],
  ): Repository[] {
    return repos
      .filter(
        (repo) =>
          !repo.fork &&
          repo.language &&
          targetLanguages.includes(repo.language),
      )
      .slice(0, 20)
      .map((repo) => ({
        name: repo.name,
        url: repo.clone_url,
        description: repo.description,
        language: repo.language,
      }));
  }

  private async analyzeReposForJobFit(
    repos: Repository[],
    jobDescription: string,
  ): Promise<JobFitResult> {
    let repoContent = '';

    this.emit('📦 Packing Repositories...');

    for (const repo of repos) {
      const tempOutput = `packed-${repo.name}.txt`;
      console.log(`\n 📦 Packing ${repo.name}...`);
      await runCli(['.'], process.cwd(), {
        remote: repo.url,
        output: tempOutput,
        include: 'src/**/*, package.json',
        exclude: 'node_modules,dist,package-lock.json,**/*md',
        quiet: true,
        style: 'plain',
      });
      repoContent += fs.readFileSync(tempOutput, 'utf-8');
      fs.unlinkSync(tempOutput);
    }

    this.emit('🧠 Analyzing with AI...');

    const analysisPrompt = `
    You are a Senior Technical Lead. Compare the following provided Codebase with the Job Description.

    CRITICAL EVALUATION RULES:
    - Do not make assumptions beyond the provided code and JD.
    - Required skills matched must weight more than nice-to-have skills. 5/1 ratio.
    - Be strict. Basic usage of a required skill doesn't count as a full match.
    - Seniority: look for complex architecture, design patterns, breadth and depth.
    - In evidence, do not mention file names or line numbers.

    [JOB DESCRIPTION]
    ${jobDescription}

    [DEVELOPER GITHUB CONTENT]
    ${repoContent}

    [RETURN ONLY RAW JSON]
    {
      "match_score": (0-100),
      "matching_skills": [...],
      "missing_skills": [...],
      "experience_evidence": "...",
      "seniority_verdict": "Junior|Mid|Senior",
      "verdict": "..."
    }`;

    const result = await this.model.generateContent(analysisPrompt);
    const sanitized = result.response
      .text()
      .replace(/```json|```/g, '')
      .trim();
    const parsed = JSON.parse(sanitized) as GeminiJobFitResponse;

    return {
      matchScore: parsed.match_score,
      matchingSkills: parsed.matching_skills,
      missingSkills: parsed.missing_skills,
      experienceEvidence: parsed.experience_evidence,
      seniorityVerdict: parsed.seniority_verdict,
      verdict: parsed.verdict,
    };
  }

  private async extractRequiredLanguages(
    jobDescription: string,
  ): Promise<string[]> {
    const prompt = `Analyze this Job Description and return ONLY a comma-separated list of programming languages required.

JD: ${jobDescription}

Infer languages from frameworks and runtimes using these rules:
- React, Vue, Angular, Next.js, Nuxt, Svelte, Node.js, Express, NestJS, Bun, Deno → JavaScript, TypeScript
- Django, Flask, FastAPI, Celery → Python
- Spring Boot, Maven, Gradle, Hibernate → Java
- Ruby on Rails, Sinatra → Ruby
- Laravel, Symfony, WordPress → PHP
- ASP.NET, Blazor, Unity → C#
- Gin, Echo, Fiber → Go
- Rocket, Actix → Rust
- iOS, SwiftUI, UIKit → Swift
- Android, Jetpack Compose → Kotlin
- Flutter → Dart
- React Native → JavaScript, TypeScript
- Elixir/Phoenix → Elixir
- Scala/Play, Spark → Scala

Always include both JavaScript AND TypeScript when any JS runtime or framework is mentioned.
Return only language names, comma-separated, no explanations, no duplicates.`;

    const result = await this.model.generateContent(prompt);
    return result.response
      .text()
      .split(',')
      .map((s) => s.trim());
  }
}
