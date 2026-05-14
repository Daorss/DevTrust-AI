# DevTrust AI

> AI-Powered GitHub Trust & Developer Authenticity Intelligence Platform

DevTrust AI is a cloud-native platform that analyzes public GitHub profiles and repositories to evaluate how trustworthy, authentic, and technically relevant a developer’s contribution history appears to be.

The platform combines GitHub metadata analysis, behavioral trust signals, anomaly detection, AI-powered explanations, and job-role matching to generate readable trust reports for recruiters, open-source maintainers, hackathon judges, and security-focused teams.

---

# 🚀 Overview

GitHub contribution history is commonly used as proof of:

- developer experience
- technical credibility
- open-source involvement
- project ownership
- engineering capability

However, Git commit metadata alone is not always strong proof of authenticity.

GitHub commits can contain:

- unsigned commits
- unverified authors
- inconsistent contribution patterns
- repetitive or low-quality commit behavior
- misleading attribution signals

Because of this, recruiters and teams may struggle to evaluate whether a GitHub profile reflects real, meaningful, and verifiable developer activity.

DevTrust AI solves this problem by combining:

- GitHub repository intelligence
- behavioral analysis
- anomaly detection
- AI-generated explanations
- cloud-native infrastructure
- job-description matching

---

# ✨ Features

## 🔐 DevTrust Score

A weighted trust score (0–100) generated from multiple authenticity and quality signals.

The score evaluates:

- verified commit ratio
- activity consistency
- repository quality
- contribution depth
- commit quality
- anomaly detection
- contribution authenticity

---

## 🤖 AI-Powered Analysis

Powered by Google Gemini / Vertex AI.

DevTrust AI transforms raw GitHub metadata into:

- human-readable summaries
- recruiter-friendly insights
- technical trust explanations
- actionable recommendations

### Example AI Insight

> “This profile demonstrates consistent long-term contribution behavior across multiple repositories. Most commits appear meaningful and naturally distributed over time. However, a lower percentage of signed commits slightly reduces authenticity confidence.”

---

## 🧠 GitHub Intelligence Engine

Analyzes:

- public repositories
- commit history
- commit metadata
- timestamps
- commit verification status
- file changes
- contribution patterns
- repository maturity
- commit message quality

---

## 🚨 Anomaly Detection

Detects suspicious or unusual activity patterns such as:

- sudden contribution spikes
- repetitive commit behavior
- unrealistic commit timing
- noisy/non-meaningful changes
- excessive generic commit messages
- unusual contribution bursts

---

# 💼 Job Description Match Analysis

DevTrust AI allows recruiters and teams to paste a job description and compare it against a developer’s public GitHub profile.

The platform analyzes:

- required technologies
- frameworks
- engineering skills
- cloud tools
- backend/frontend experience
- repository evidence
- project complexity

Then it generates an AI-powered summary explaining how well the developer’s GitHub activity aligns with the role requirements.

---

## 📋 How It Works

1. User enters a GitHub username or repository URL
2. User pastes a job description
3. DevTrust AI extracts role requirements
4. GitHub repositories are analyzed for matching evidence
5. Gemini generates a readable compatibility summary

---

## 🧾 Example Output

> “The job description requests React, Node.js, API development, and cloud deployment experience. This GitHub profile demonstrates strong evidence of React applications and backend API development, moderate cloud deployment experience, and consistent open-source activity.”

---

## 📊 Match Signals

The system evaluates:

- programming languages
- frameworks & libraries
- API/backend implementation
- deployment infrastructure
- CI/CD setup
- testing practices
- repository complexity
- documentation quality
- recent relevant contributions

---

# 🖥️ Dashboard Features

The DevTrust AI dashboard includes:

- trust score visualization
- AI-generated explanations
- contribution heatmaps
- repository quality metrics
- anomaly indicators
- activity timelines
- recruiter-focused summaries
- downloadable reports

---

# ⚙️ User Flow

1. User enters GitHub username or repository URL
2. DevTrust AI fetches public GitHub data
3. Backend analyzes contribution patterns and metadata
4. Trust metrics and anomaly indicators are calculated
5. Gemini generates an AI-powered explanation
6. User receives a structured trust analysis report

Optional: 7. User submits a job description 8. DevTrust AI generates a role compatibility analysis

---

# ☁️ Google Cloud & AI Integration

This project is powered by Google AI and deployed on Google Cloud.

---

## 🔹 Google Technologies Used

### Gemini / Vertex AI

Used for:

- trust report generation
- anomaly explanation
- AI-generated summaries
- recruiter-friendly insights
- job-role compatibility analysis

### Cloud Run

Used to deploy:

- backend APIs
- analysis services
- AI orchestration pipelines

### Firestore

Used for:

- caching reports
- storing analysis data
- trust metric history

### Secret Manager

Used for securely managing:

- GitHub API tokens
- Gemini API keys

### Pub/Sub / Cloud Tasks

Used for:

- async analysis jobs
- queued report generation
- scalable background processing

---

# 🧮 DevTrust Score Formula

| Signal                 | Weight |
| ---------------------- | ------ |
| Verified Commit Ratio  | 25%    |
| Activity Consistency   | 20%    |
| Repository Quality     | 15%    |
| Contribution Depth     | 15%    |
| Commit Message Quality | 10%    |
| Account Maturity       | 10%    |
| Anomaly Penalties      | -15%   |

---

# 📈 Trust Signal Categories

## Positive Signals

- verified commits
- consistent long-term activity
- meaningful commit messages
- repository diversity
- documented projects
- active collaboration

## Risk Signals

- repetitive commits
- large suspicious activity spikes
- mostly unsigned commits
- generic/noisy commits
- unrealistic contribution timing
- low repository depth

---

# 🛡️ Responsible AI Principles

DevTrust AI is designed with responsible analysis principles.

The platform:

- does NOT accuse users of fraud
- does NOT teach commit spoofing
- uses probabilistic trust estimation
- focuses only on public GitHub data
- encourages better developer security practices

Recommendations may include:

- enabling signed commits
- improving commit clarity
- increasing repository transparency
- maintaining consistent contribution practices

---

# 👥 Potential Use Cases

## Recruiters

Evaluate developer portfolios more effectively.

## Open-Source Maintainers

Review contributor authenticity and consistency.

## Hackathon Judges

Understand real contribution activity behind submissions.

## Security Teams

Identify weak trust signals in engineering profiles.

## Developers

Improve GitHub credibility and contribution quality.

---

# 🛠️ Tech Stack

## Frontend

- Next.js
- Tailwind CSS
- Framer Motion

## Backend

- Node.js / FastAPI
- GitHub REST & GraphQL APIs

## AI Layer

- Google Gemini
- Vertex AI

## Cloud Infrastructure

- Google Cloud Run
- Firestore
- Pub/Sub
- Secret Manager

---

# 📂 Installation

```bash
git clone https://github.com/yourusername/devtrust-ai.git

cd devtrust-ai

npm install
```

---

# 🔑 Environment Variables

```env
GITHUB_TOKEN=
GEMINI_API_KEY=
GOOGLE_CLOUD_PROJECT=
FIRESTORE_DATABASE=
```

---

# ▶️ Run Locally

```bash
npm run dev
```

---

# 🚀 Deployment

Deploy backend services using Google Cloud Run:

```bash
gcloud run deploy
```

---

# 🧭 Future Roadmap

- browser extension integration
- organization-level trust scoring
- advanced behavioral anomaly detection
- repository reputation engine
- AI-generated hiring summaries
- trust timeline visualizations
- contribution authenticity graphs
- collaborative developer intelligence

---

# 🎯 Vision

DevTrust AI aims to make public developer contribution history:

- more understandable
- more transparent
- more trustworthy
- more accessible to technical and non-technical users

By combining GitHub intelligence with Google AI, DevTrust AI helps teams evaluate developer authenticity in a responsible and explainable way.

---

# ❤️ Built With

- Google Gemini
- Google Cloud
- GitHub APIs
- Nestjs
- Tailwind CSS

Built for the future of developer trust intelligence.
