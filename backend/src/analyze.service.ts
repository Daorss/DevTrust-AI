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
import { BehaviorSubject, Observable, Subject } from 'rxjs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

console.log(
  process.env.GEMINI_API_KEY
    ? 'Gemini API key loaded successfully'
    : 'Gemini API key not found. Please set GEMINI_API_KEY in your environment variables.',
);

@Injectable()
export class AnalyzeService {
  private model: GenerativeModel;
  private progress$: Subject<MessageResult> | undefined;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0,
      },
    });
  }

  async extractCvText(file: Express.Multer.File): Promise<string> {
    const ext = file.originalname.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(file.buffer);
      return (data.text as string).trim();
    }

    if (ext === 'docx') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return (result.value as string).trim();
    }

    throw new Error(`Unsupported CV file type: .${ext}. Use PDF or DOCX.`);
  }

  analyzeProfile(
    githubUsername: string,
    jobDescription: string,
    cvText?: string,
  ): Observable<MessageResult> {
    this.progress$ = new BehaviorSubject<MessageResult>({
      data: {
        type: 'info',
        message: '🔍 Fetching GitHub profile...',
      },
    });

    this.runAnalysingPipeline(githubUsername, jobDescription, cvText);

    return this.progress$.asObservable();
  }

  private async runAnalysingPipeline(
    githubUsername: string,
    jobDescription: string,
    cvText?: string,
  ) {
    try {
      // --- Trust Analysis ---
      this.progress$?.next({
        data: { type: 'info', message: '🔍 Fetching GitHub profile...' },
      });

      const { user, repos } = await this.fetchGitHubProfile(githubUsername);
      const { breakdown, totalScore, verdict } = this.computeTrustBreakdown(
        user,
        repos,
      );

      this.progress$?.next({
        data: { type: 'info', message: '🧠 Generating trust analysis...' },
      });

      const aiSummary = await this.generateAiSummary(
        user,
        totalScore,
        verdict,
      );

      const meta: AnalysisResultResponse['meta'] = {
        username: user.login,
        avatarUrl: user.avatar_url,
        displayName: user.name || user.login,
        accountCreated: user.created_at,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
      };

      // --- Job Fit Analysis (only when JD is provided) ---
      let jobFit: JobFitResult | undefined;

      if (jobDescription) {
        this.progress$?.next({
          data: { type: 'info', message: '🔍 Analyzing job description...' },
        });

        const languages = await this.extractRequiredLanguages(jobDescription);
        console.log(
          `\n Identified required languages: ${languages.join(', ')}`,
        );

        this.progress$?.next({
          data: {
            type: 'info',
            message: '🕵️‍♂️ Fetching relevant repositories...',
          },
        });

        const relevantRepos = await this.getRelevantRepos(
          githubUsername,
          languages,
        );

        if (relevantRepos.length === 0) {
          console.log(
            '\n No matching repositories found for the required stack.',
          );
          this.progress$?.next({
            data: {
              type: 'info',
              message:
                '🫤 No matching repositories found for the required stack.',
            },
          });
        } else {
          console.log(`\n Found ${relevantRepos.length} repositories.`);
          jobFit = await this.analyzeRepos(relevantRepos, jobDescription, cvText);
        }
      }

      // --- Emit combined result ---
      const result: AnalysisResultResponse = {
        type: 'result',
        totalScore,
        verdict,
        aiSummary,
        meta,
        breakdown,
        jobFit,
      };

      this.progress$?.next({ data: result });
      this.progress$?.complete();
    } catch (error) {
      console.error('Pipeline error:', error);
      this.progress$?.next({
        data: { type: 'error', message: '❌ Analysis failed. Please try again.' },
      });
      this.progress$?.complete();
    }
  }

  private async fetchGitHubProfile(username: string) {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const [userRes, reposRes] = await Promise.all([
      octokit.rest.users.getByUsername({ username }),
      octokit.rest.repos.listForUser({
        username,
        per_page: 100,
        type: 'owner',
        sort: 'updated',
      }),
    ]);
    return { user: userRes.data, repos: reposRes.data };
  }

  private computeTrustBreakdown(user: any, repos: any[]) {
    // Account Age (max: 20)
    const ageDays =
      (Date.now() - new Date(user.created_at).getTime()) / 86400000;
    const ageYears = Math.floor(ageDays / 365);
    let accountAgeScore: number;
    let accountAgeDetail: string;
    if (ageDays < 30) {
      accountAgeScore = 2;
      accountAgeDetail = 'Very new account (< 1 month)';
    } else if (ageDays < 180) {
      accountAgeScore = 5;
      accountAgeDetail = 'New account (< 6 months)';
    } else if (ageDays < 365) {
      accountAgeScore = 10;
      accountAgeDetail = 'Account under 1 year old';
    } else if (ageDays < 730) {
      accountAgeScore = 15;
      accountAgeDetail = 'Account about 1 year old';
    } else if (ageDays < 1825) {
      accountAgeScore = 18;
      accountAgeDetail = `Account ${ageYears} years old`;
    } else {
      accountAgeScore = 20;
      accountAgeDetail = `Account ${ageYears} years old`;
    }

    // Profile Completeness (max: 15)
    let profileScore = 0;
    if (user.name) profileScore += 3;
    if (user.bio) profileScore += 4;
    if (user.email) profileScore += 3;
    if (user.blog) profileScore += 2;
    if (user.location) profileScore += 3;
    const profileFields = [
      user.name && 'Name',
      user.bio && 'Bio',
      user.email && 'Email',
      user.blog && 'Website',
      user.location && 'Location',
    ].filter(Boolean);
    const profileDetail =
      profileFields.length > 0 ? profileFields.join(', ') : 'Minimal profile';

    // Follower Credibility (max: 20)
    const { followers, following } = user;
    let followerScore = 0;
    if (followers >= 500) followerScore += 12;
    else if (followers >= 100) followerScore += 9;
    else if (followers >= 50) followerScore += 7;
    else if (followers >= 10) followerScore += 4;
    else if (followers >= 1) followerScore += 2;
    const ratio =
      following > 0 ? followers / following : followers > 0 ? 5 : 0;
    if (ratio >= 2) followerScore += 8;
    else if (ratio >= 1) followerScore += 6;
    else if (ratio >= 0.5) followerScore += 3;
    else if (ratio >= 0.1) followerScore += 1;
    followerScore = Math.min(followerScore, 20);
    const followerDetail = `${followers} followers, ${following} following`;

    // Repo Quality (max: 20)
    const nonForkRepos = repos.filter((r) => !r.fork);
    const totalStars = repos.reduce(
      (sum, r) => sum + (r.stargazers_count || 0),
      0,
    );
    const reposWithDesc = repos.filter((r) => r.description?.trim()).length;
    const repoScore = Math.min(
      Math.min(nonForkRepos.length, 8) +
        Math.min(Math.floor(totalStars / 5), 8) +
        Math.min(reposWithDesc, 4),
      20,
    );
    const repoDetail = `${nonForkRepos.length} original repos, ${totalStars} total stars`;

    // Activity Pattern (max: 15)
    const sixMonthsAgo = new Date(Date.now() - 180 * 86400000);
    const recentlyUpdated = repos.filter(
      (r) => new Date(r.updated_at) > sixMonthsAgo,
    ).length;
    let activityScore = 0;
    if (recentlyUpdated >= 10) activityScore = 15;
    else if (recentlyUpdated >= 5) activityScore = 11;
    else if (recentlyUpdated >= 3) activityScore = 7;
    else if (recentlyUpdated >= 1) activityScore = 3;
    const activityDetail = `${recentlyUpdated} repos updated in last 6 months`;

    // Original Content (max: 10)
    const originalRatio =
      repos.length > 0 ? nonForkRepos.length / repos.length : 0;
    const originalScore =
      originalRatio >= 0.9
        ? 10
        : originalRatio >= 0.7
          ? 8
          : originalRatio >= 0.5
            ? 5
            : originalRatio >= 0.3
              ? 3
              : 1;
    const originalDetail = `${Math.round(originalRatio * 100)}% original content`;

    const breakdown: AnalysisResultResponse['breakdown'] = {
      accountAge: {
        score: accountAgeScore,
        max: 20,
        label: 'Account Age',
        detail: accountAgeDetail,
      },
      profileCompleteness: {
        score: profileScore,
        max: 15,
        label: 'Profile',
        detail: profileDetail,
      },
      followerCredibility: {
        score: followerScore,
        max: 20,
        label: 'Followers',
        detail: followerDetail,
      },
      repoQuality: {
        score: repoScore,
        max: 20,
        label: 'Repo Quality',
        detail: repoDetail,
      },
      activityPattern: {
        score: activityScore,
        max: 15,
        label: 'Activity',
        detail: activityDetail,
      },
      originalContent: {
        score: originalScore,
        max: 10,
        label: 'Original Content',
        detail: originalDetail,
      },
    };

    const totalScore = Object.values(breakdown).reduce(
      (sum, b) => sum + b.score,
      0,
    );
    const verdict: 'Legitimate' | 'Suspicious' | 'Likely Bot' =
      totalScore >= 70
        ? 'Legitimate'
        : totalScore >= 40
          ? 'Suspicious'
          : 'Likely Bot';

    return { breakdown, totalScore, verdict };
  }

  private async generateAiSummary(
    user: any,
    totalScore: number,
    verdict: string,
  ): Promise<string> {
    const ageYears = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) /
        (1000 * 60 * 60 * 24 * 365),
    );
    const prompt = `
      You are a developer profile analyst. Write exactly 2 sentences summarizing this GitHub developer profile's authenticity and engagement level based on these signals:

      - Account age: ${ageYears} year(s)
      - Public repositories: ${user.public_repos}
      - Followers: ${user.followers}, Following: ${user.following}
      - Has bio: ${!!user.bio}, Has website: ${!!user.blog}, Has location: ${!!user.location}
      - Trust score: ${totalScore}/100
      - Verdict: ${verdict}

      Be concise, professional, and factual. Do not start with "This developer". Return only the 2-sentence summary with no formatting or labels.
    `;
    const result = await this.model.generateContent(prompt);
    return result.response.text().trim();
  }

  private async analyzeRepos(
    repos: Repository[],
    jobDescription: string,
    cvText?: string,
  ): Promise<JobFitResult> {
    let repoContent = '';

    console.log(`\n 📦 Packing repos...`);

    this.progress$?.next({
      data: {
        type: 'info',
        message: '📦 Packing Repositories...',
      },
    });

    for (let i = 0; i < repos.length; i++) {
      const repo = repos[i];
      const tempOutput = `packed-${repo.name}.txt`;

      console.log(`\n 📦 Packing ${repo.name}...`);

      this.progress$?.next({
        data: {
          type: 'info',
          message: `📦 Packing ${repo.name} (${i + 1}/${repos.length})...`,
        },
      });

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

    this.progress$?.next({
      data: {
        type: 'info',
        message: '🧠 Analyzing with AI...',
      },
    });

    console.log('\n 🧠 Analyzing with AI...');

    const analysisPrompt = `
    You are a Senior Technical Lead. Compare the following provided Codebase with the Job Description.

    EVALUATION RULES:
    - Only evaluate based on what is present in the provided code and JD. Do not invent skills that have no trace in either.
    - Libraries, ORMs, adapters, and dependencies are valid evidence of underlying technology knowledge. For example: an ORM configured for MySQL counts as MySQL experience; a cloud storage SDK counts as cloud experience; a testing library counts as testing experience. Look in package.json and imports, not just business logic.
    - Be strict in your analysis. If the code only shows basic usage of a required skill, don't count it as a full match.
    - For seniority, look for patterns like: leadership in code (e.g. complex architecture, design patterns), breadth of technologies, and depth in required skills.
    - In evidence output, do not mention file names or line numbers, just describe the example in a way that shows you understand it.

    [JOB DESCRIPTION]
    ${jobDescription}
    ${cvText ? `\n    [CANDIDATE CV/RESUME]\n    The candidate has provided a CV. Use it as supplementary context — prioritize code evidence over CV claims. Cross-reference claimed skills against actual code.\n    ${cvText}\n` : ''}
    [DEVELOPER GITHUB CONTENT]
    ${repoContent}

    [RETURN ONLY RAW JSON]
    Follow these steps IN ORDER and return only the final JSON:

    STEP 1 — Extract all skills from the JD into two lists:
      - required_skills: skills explicitly required or strongly implied
      - nice_to_have_skills: skills listed as optional or preferred

    STEP 2 — For each skill in both lists, check whether the code evidences it (yes/no).
      - Skill names must be SHORT (1-4 words). Never copy full sentences from the JD.
      - Use these to populate matching_skills (found) and missing_skills (not found).
      - Only include required_skills in missing_skills. Nice-to-have gaps are not missing skills.

    STEP 3 — Compute match_score using this exact formula:
      - required_matched = number of required_skills found in code
      - required_total = total number of required_skills
      - nicetohave_matched = number of nice_to_have_skills found in code
      - nicetohave_total = total number of nice_to_have_skills (use 0 if none)
      - weighted_score = (required_matched * 5 + nicetohave_matched * 1) / (required_total * 5 + nicetohave_total * 1)
      - match_score = round(weighted_score * 100)

    Return this JSON shape:
    {
      "match_score": <computed number>,
      "matching_skills": [<short names of ALL matched skills, required + nice-to-have>],
      "missing_skills": [<short names of unmatched REQUIRED skills only>],
      "experience_evidence": "<for each matching skill, a specific example from the code proving competence. No file names, line numbers, or tech buzzwords. Repo name is fine for context.>",
      "seniority_verdict": "<Junior, Mid, or Senior based on code patterns>",
      "verdict": "<short summary of fit. Avoid tech buzzwords.>"
    }
  `;

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    });

    console.log('\n ✅ Analysis finished...');

    try {
      const sanitized = result.response
        .text()
        .replace(/```json|```/g, '')
        .trim();

      console.log(sanitized);

      const raw = JSON.parse(sanitized);
      return {
        matchScore: raw.match_score,
        matchingSkills: raw.matching_skills ?? [],
        missingSkills: raw.missing_skills ?? [],
        experienceEvidence: raw.experience_evidence ?? '',
        seniorityVerdict: raw.seniority_verdict,
        verdict: raw.verdict,
      };
    } catch {
      console.error('Failed to parse AI JSON:', result);
      this.progress$?.next({
        data: {
          type: 'error',
          message: '❌ Failed to parse AI JSON',
        },
      });
      throw new Error('AI returned malformed data. Please try again.');
    }
  }

  private async getRelevantRepos(
    username: string,
    targetLanguages: string[],
  ): Promise<Repository[]> {
    console.log(`\n🔍 Fetching repos for ${username}...`);

    try {
      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
      const repos = await octokit.rest.repos.listForUser({
        username,
        sort: 'updated',
        per_page: 20,
        type: 'owner',
      });

      const relevantRepos = repos.data
        .filter(
          (repo) =>
            !repo.fork &&
            repo.language &&
            targetLanguages.includes(repo.language),
        )
        .slice(0, 20);

      return relevantRepos.map((repo) => ({
        name: repo.name,
        url: repo.clone_url,
        description: repo.description,
        language: repo.language,
      }));
    } catch (error) {
      console.error('Failed to fetch repos:', error);
      this.progress$?.next({
        data: {
          type: 'error',
          message: '❌ Failed to fetch repos',
        },
      });
      return [];
    }
  }

  private async extractRequiredLanguages(jobDescription: string) {
    const prompt = `
      Analyze this Job Description and and return ONLY a comma-separated list of programming languages required.

      JD:
      ${jobDescription}

      Infer the programming languages from specific frameworks or libraries mentioned.
      For example,
      - If it mentions JavaScript-based frameworks like React or Vue or Angular, infer JavaScript and TypeScript.
      - If it mentions Django, infer Python.
      - If it mentions Spring Boot, infer Java.

      Only return the languages that are explicitly or implicitly required by the JD.
    `;

    const result = await this.model.generateContent(prompt);

    console.log(
      `\n 🛠️ Extracted languages/technologies: ${result.response.text()}`,
    );

    return result.response
      .text()
      .split(',')
      .map((s) => s.trim());
  }
}
