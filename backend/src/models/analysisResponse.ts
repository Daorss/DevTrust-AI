interface AnalysisInfoResponse {
  type: 'info';
  message: string;
}

interface AnalysisResultResponse {
  type: 'result';
  match_score?: number;
  matching_skills?: string[];
  missing_skills?: string[];
  experience_evidence?: string;
  seniority_verdict?: string;
  verdict?: string;
}

interface AnalysisErrorResponse {
  type: 'error';
  message: string;
}

export type AnalysisResponse =
  | AnalysisInfoResponse
  | AnalysisResultResponse
  | AnalysisErrorResponse;

export type MessageResult = {
  data: AnalysisResponse;
};
