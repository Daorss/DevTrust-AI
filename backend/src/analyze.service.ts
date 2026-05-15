import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { runCli } from 'repomix';
import { Repository } from './models/repository';
import 'dotenv/config';
import { AnalysisResponse, MessageResult } from './models/analysisResponse';
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

  analyzeProfile(
    githubUsername: string,
    jobDescription: string,
  ): Observable<MessageResult> {
    this.progress$ = new BehaviorSubject<MessageResult>({
      data: {
        type: 'info',
        message: '🔍 Analyzing Job Description...',
      },
    });

    this.runAnalysingPipeline(githubUsername, jobDescription);

    return this.progress$.asObservable();
  }

  private async runAnalysingPipeline(
    githubUsername: string,
    jobDescription: string,
  ) {
    this.progress$?.next({
      data: {
        type: 'info',
        message: '🔍 Analyzing Job Description...',
      },
    });

    const languages = await this.extractRequiredLanguages(jobDescription);
    console.log(`\n Identified required languages: ${languages.join(', ')}`);

    this.progress$?.next({
      data: {
        type: 'info',
        message: '🕵️‍♂️ Querying Github for repositories...',
      },
    });
    const repos = await this.getRelevantRepos(githubUsername, languages);

    if (repos.length === 0) {
      console.log('\n No matching repositories found for the required stack.');

      this.progress$?.next({
        data: {
          type: 'info',
          message: '🫤 No matching repositories found for the required stack.',
        },
      });

      return;
    }

    console.log(`\n Found ${repos.length} repositories.`);

    const analysisResult = await this.analyzeRepos(repos, jobDescription);

    this.progress$?.next(analysisResult);
  }

  private async analyzeRepos(
    repos: Repository[],
    jobDescription: string,
  ): Promise<MessageResult> {
    let repoContent = '';

    console.log(`\n 📦 Packing repos...`);

    this.progress$?.next({
      data: {
        type: 'info',
        message: '📦 Packing Repositories...',
      },
    });

    for (const repo of repos) {
      const tempOutput = `packed-${repo.name}.txt`;

      console.log(`\n 📦 Packing ${repo.name}...`);

      // This clones the remote repo and packs it into a text file
      await runCli(['.'], process.cwd(), {
        remote: repo.url,
        output: tempOutput,
        include: 'src/**/*, package.json', // Focus on source code
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

    // Build the Comparison Prompt
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
      // Remove any potential markdown backticks if the model ignores generationConfig
      const sanitized = result.response
        .text()
        .replace(/```json|```/g, '')
        .trim();

      console.log(sanitized);

      const messageResult: MessageResult = {
        data: {
          type: 'result',
          ...JSON.parse(sanitized),
        } as AnalysisResponse,
      };
      return messageResult;
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

      // Filter for repos matching the languages in the JD
      const relevantRepos = repos.data
        .filter(
          (repo) =>
            !repo.fork &&
            repo.language &&
            targetLanguages.includes(repo.language),
        )
        .slice(0, 20); // Analyze top 20 matching repos to stay within token limits

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

  private async extractRequiredLanguages(jobDescription) {
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
