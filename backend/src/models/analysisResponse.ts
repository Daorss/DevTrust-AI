export interface AnalysisInfoResponse {
  type: 'info';
  message: string;
}

export interface AnalysisErrorResponse {
  type: 'error';
  message: string;
}

export interface ScoreBreakdown {
  score: number;
  max: number;
  label: string;
  detail: string;
}

export interface JobFitResult {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  experienceEvidence: string;
  seniorityVerdict: 'Junior' | 'Mid' | 'Senior';
  verdict: string;
}

export interface AnalysisResultResponse {
  type: 'result';
  totalScore: number;
  verdict: 'Legitimate' | 'Suspicious' | 'Likely Bot';
  aiSummary: string;
  meta: {
    username: string;
    avatarUrl: string;
    displayName: string;
    accountCreated: string;
    publicRepos: number;
    followers: number;
    following: number;
  };
  breakdown: {
    accountAge: ScoreBreakdown;
    profileCompleteness: ScoreBreakdown;
    followerCredibility: ScoreBreakdown;
    repoQuality: ScoreBreakdown;
    activityPattern: ScoreBreakdown;
    originalContent: ScoreBreakdown;
  };
  jobFit?: JobFitResult;
}

export type AnalysisResponse =
  | AnalysisInfoResponse
  | AnalysisResultResponse
  | AnalysisErrorResponse;

export type MessageResult = {
  data: AnalysisResponse;
};
