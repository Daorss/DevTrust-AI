# DevTrust AI Backend

Backend service for GitHub analysis, trust scoring, anomaly detection, job-description matching, and Gemini-powered report generation.

## Responsibilities

- Fetch public GitHub profile/repository data
- Analyze commits and repository metadata
- Calculate DevTrust Score
- Detect anomaly patterns
- Compare GitHub evidence against job descriptions
- Generate AI summaries using Gemini / Vertex AI

## Tech Stack

- Node.js / Express or FastAPI
- GitHub REST / GraphQL API
- Google Gemini / Vertex AI
- Google Cloud Run
- Firestore
- Secret Manager

## Environment Variables

Please use your own environment variables.

```env
GITHUB_TOKEN=
GEMINI_API_KEY=
```
