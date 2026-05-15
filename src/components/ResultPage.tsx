import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Icon from "./Icon";

interface ScoreBreakdown {
  score: number;
  max: number;
  label: string;
  detail: string;
}

interface JobFitResult {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  experienceEvidence: string;
  seniorityVerdict: "Junior" | "Mid" | "Senior";
  verdict: string;
}

interface AnalysisResult {
  totalScore?: number;
  verdict?: "Legitimate" | "Suspicious" | "Likely Bot";
  aiSummary?: string;
  jobFit?: JobFitResult;
  breakdown?: {
    accountAge: ScoreBreakdown;
    profileCompleteness: ScoreBreakdown;
    followerCredibility: ScoreBreakdown;
    repoQuality: ScoreBreakdown;
    activityPattern: ScoreBreakdown;
    originalContent: ScoreBreakdown;
  };
  meta?: {
    username: string;
    avatarUrl: string;
    displayName: string;
    accountCreated: string;
    publicRepos: number;
    followers: number;
    following: number;
  };
}

interface ResultPageProps {
  input: string;
  jobDescription?: string;
  onBack: () => void;
}

function parseUsername(input: string): string {
  try {
    const url = new URL(input);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 1) return parts[0];
  } catch {
    // not a URL — treat as plain username
  }
  return input.replace("@", "").trim();
}

const VERDICT_COLOR: Record<"Legitimate" | "Suspicious" | "Likely Bot", string> = {
  Legitimate: "text-green-400",
  Suspicious: "text-yellow-400",
  "Likely Bot": "text-red-400",
};

const BREAKDOWN_ICONS: Record<string, string> = {
  accountAge: "schedule",
  profileCompleteness: "person",
  followerCredibility: "group",
  repoQuality: "folder",
  activityPattern: "show_chart",
  originalContent: "code",
};

const SENIORITY_COLOR = {
  Junior: "text-yellow-400",
  Mid: "text-blue-400",
  Senior: "text-green-400",
};

const fadeUp = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function ResultPage({
  input,
  jobDescription,
  onBack,
}: ResultPageProps) {
  const username = parseUsername(input);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("Connecting...");

  useEffect(() => {
    const params = new URLSearchParams({ githubUsername: username });
    if (jobDescription) params.set("jobDescription", jobDescription);

    const es = new EventSource(
      `http://localhost:3000/analyze?${params.toString()}`,
    );

    es.onmessage = (event: MessageEvent<string>) => {
      const msg = JSON.parse(event.data) as {
        type: string;
        message?: string;
      } & Partial<AnalysisResult>;
      if (msg.type === "info") {
        setProgress(msg.message ?? "");
      } else if (msg.type === "result") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = msg as any;
        setData({
          totalScore: raw.totalScore,
          verdict: raw.verdict,
          aiSummary: raw.aiSummary,
          meta: raw.meta,
          breakdown: raw.breakdown,
          jobFit: raw.jobFit,
        });
        es.close();
      } else if (msg.type === "error") {
        setError(msg.message ?? "Analysis failed.");
        es.close();
      }
    };

    es.onerror = () => {
      if (!data) setError("Failed to reach the analysis server.");
      es.close();
    };

    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, jobDescription]);

  const scorePercent = data?.totalScore != null ? Math.round((data.totalScore / 100) * 100) : 0;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-xl px-gutter relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#6807ba]/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] bg-[#0070f3]/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 w-full max-w-[1280px] flex flex-col items-center gap-xl">
        {/* Header */}
        <motion.header
          className="flex flex-col items-center gap-xs"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex items-center gap-sm">
            <Icon name="security" className="text-primary" fill size="32px" />
            <h1
              className="font-sans text-headline-lg font-bold tracking-tight text-on-surface"
              style={{ letterSpacing: "-0.02em" }}
            >
              DevTrust AI
            </h1>
          </div>
          <p className="font-mono text-label-sm text-outline tracking-widest uppercase">
            Analysis Report
          </p>
        </motion.header>

        {/* Loading */}
        {!data && !error && (
          <motion.div
            className="flex flex-col items-center gap-md py-xxl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="font-mono text-label-sm text-outline">{progress}</p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            className="glass-surface rounded-xl p-xl text-center flex flex-col gap-md"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Icon name="error" className="text-red-400 mx-auto" size="40px" />
            <p className="font-sans text-body-lg text-on-surface">{error}</p>
            <button
              onClick={onBack}
              className="bg-primary text-on-primary px-xxl py-3 rounded-full font-bold hover:scale-[1.02] transition-all"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Results */}
        {data && (
          <motion.div
            className="w-full flex flex-col items-center gap-xl"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {/* Score ring */}
            {data.totalScore != null && data.verdict && (
              <motion.section
                variants={fadeUp}
                className="relative flex items-center justify-center"
              >
                <div className="relative w-72 h-72 flex items-center justify-center">
                  <svg
                    className="absolute inset-0 rotate-[-90deg]"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-surface-variant opacity-20"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-primary transition-all duration-1000"
                      strokeDasharray={circumference}
                      strokeDashoffset={
                        circumference - (scorePercent / 100) * circumference
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="relative z-10 flex flex-col items-center">
                    <span
                      className="font-sans text-display-lg text-on-surface"
                      style={{
                        fontWeight: 700,
                        letterSpacing: "-0.04em",
                        textShadow: "0 0 15px rgba(174,198,255,0.4)",
                      }}
                    >
                      {data.totalScore}
                    </span>
                    <span className="font-mono text-label-sm text-primary tracking-[0.2em] font-bold mt-xs">
                      TRUST SCORE
                    </span>
                    <span
                      className={`font-mono text-label-sm font-bold mt-xs ${VERDICT_COLOR[data.verdict]}`}
                    >
                      {data.verdict.toUpperCase()}
                    </span>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Profile card */}
            {data.meta && (
              <motion.section
                variants={fadeUp}
                className="glass-surface rounded-xl p-lg flex items-center gap-lg w-full max-w-4xl"
              >
                <img
                  src={data.meta.avatarUrl}
                  alt={data.meta.username}
                  className="w-16 h-16 rounded-full border-2 border-primary/30 flex-shrink-0"
                />
                <div className="flex flex-col gap-xs">
                  <span className="font-sans text-headline-sm text-on-surface font-semibold">
                    {data.meta.displayName}
                  </span>
                  <span className="font-mono text-label-sm text-outline">
                    @{data.meta.username}
                  </span>
                </div>
                <div className="ml-auto flex gap-xl text-center">
                  {[
                    { value: data.meta.followers, label: "Followers" },
                    { value: data.meta.following, label: "Following" },
                    { value: data.meta.publicRepos, label: "Repos" },
                  ].map(({ value, label }) => (
                    <div key={label}>
                      <div className="font-sans text-headline-sm text-on-surface">
                        {value}
                      </div>
                      <div className="font-mono text-label-sm text-outline">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Score breakdown */}
            {data.breakdown && (
              <motion.section
                variants={stagger}
                className="grid grid-cols-2 md:grid-cols-3 gap-lg w-full max-w-4xl"
              >
                {Object.entries(data.breakdown).map(([key, item]) => {
                  const pct = Math.round((item.score / item.max) * 100);
                  return (
                    <motion.div
                      key={key}
                      variants={fadeUp}
                      className="glass-surface rounded-xl p-lg flex flex-col gap-sm hover:bg-white/5 transition-all"
                    >
                      <div className="flex justify-between items-center text-outline">
                        <span className="font-mono text-label-sm uppercase tracking-wider">
                          {item.label}
                        </span>
                        <Icon
                          name={BREAKDOWN_ICONS[key] ?? "check"}
                          size="16px"
                        />
                      </div>
                      <div className="font-sans text-headline-md text-on-surface">
                        {item.score}
                        <span className="text-body-md text-outline">
                          /{item.max}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="font-mono text-code-md text-on-surface-variant">
                        {item.detail}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.section>
            )}

            {/* Gemini AI summary */}
            {data.aiSummary && (
              <motion.section variants={fadeUp} className="w-full max-w-4xl">
                <div className="glass-surface ai-border-glow rounded-xl p-xl flex flex-col gap-md">
                  <div className="flex items-center justify-between flex-wrap gap-md">
                    <div className="flex items-center gap-md">
                      <div className="bg-primary/10 p-base rounded-lg border border-primary/20">
                        <Icon name="psychology" className="text-primary" />
                      </div>
                      <h2 className="font-sans text-headline-md text-on-surface font-semibold">
                        Gemini AI Audit
                      </h2>
                    </div>
                    <div className="flex items-center gap-xs px-sm py-xs bg-surface-container-high rounded-full border border-outline-variant/30">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="font-mono text-label-sm text-on-surface-variant">
                        Live Intelligence
                      </span>
                    </div>
                  </div>
                  <p className="font-sans text-body-lg text-on-surface-variant leading-relaxed">
                    {data.aiSummary}
                  </p>
                </div>
              </motion.section>
            )}

            {/* Job fit */}
            {data.jobFit && (
              <motion.section
                variants={fadeUp}
                className="w-full max-w-4xl flex flex-col gap-lg"
              >
                <div className="flex items-center gap-sm">
                  <Icon name="work" className="text-primary" size="24px" />
                  <h2 className="font-sans text-headline-md text-on-surface font-semibold">
                    Job Fit Analysis
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-lg">
                  <div className="glass-surface rounded-xl p-lg flex flex-col gap-sm">
                    <span className="font-mono text-label-sm text-outline uppercase tracking-wider">
                      Match Score
                    </span>
                    <div
                      className="font-sans text-display-sm text-on-surface"
                      style={{ fontWeight: 700 }}
                    >
                      {data.jobFit.matchScore}
                      <span className="text-headline-sm text-outline">%</span>
                    </div>
                    <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${data.jobFit.matchScore}%`,
                          background:
                            data.jobFit.matchScore >= 70
                              ? "#4ade80"
                              : data.jobFit.matchScore >= 40
                                ? "#facc15"
                                : "#f87171",
                        }}
                      />
                    </div>
                  </div>
                  <div className="glass-surface rounded-xl p-lg flex flex-col gap-sm">
                    <span className="font-mono text-label-sm text-outline uppercase tracking-wider">
                      Seniority
                    </span>
                    <div
                      className={`font-sans text-display-sm font-bold ${SENIORITY_COLOR[data.jobFit.seniorityVerdict]}`}
                      style={{ fontWeight: 700 }}
                    >
                      {data.jobFit.seniorityVerdict}
                    </div>
                    <p className="font-mono text-code-md text-on-surface-variant">
                      Based on code patterns
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-lg">
                  {[
                    {
                      label: "Matching Skills",
                      skills: data.jobFit.matchingSkills,
                      color: "green",
                    },
                    {
                      label: "Missing Skills",
                      skills: data.jobFit.missingSkills,
                      color: "red",
                    },
                  ].map(({ label, skills, color }) => (
                    <div
                      key={label}
                      className="glass-surface rounded-xl p-lg flex flex-col gap-sm"
                    >
                      <span className="font-mono text-label-sm text-outline uppercase tracking-wider flex items-center gap-xs">
                        <span
                          className={`w-2 h-2 rounded-full bg-${color}-400`}
                        />
                        {label}
                      </span>
                      <div className="flex flex-wrap gap-xs">
                        {skills.map((s) => (
                          <span
                            key={s}
                            className={`px-sm py-xs bg-${color}-400/10 border border-${color}-400/30 rounded-full font-mono text-code-md text-${color}-400`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass-surface rounded-xl p-xl flex flex-col gap-md">
                  <div className="flex items-center gap-sm">
                    <Icon name="search" className="text-primary" size="20px" />
                    <span className="font-mono text-label-sm text-outline uppercase tracking-wider">
                      Code Evidence
                    </span>
                  </div>
                  <p className="font-mono text-code-md text-on-surface-variant leading-relaxed border-l-2 border-primary/40 pl-md">
                    {data.jobFit.experienceEvidence}
                  </p>
                  <div className="border-t border-outline-variant/20 pt-md">
                    <p className="font-sans text-body-lg text-on-surface-variant leading-relaxed">
                      {data.jobFit.verdict}
                    </p>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Footer */}
            <motion.footer
              variants={fadeUp}
              className="flex flex-wrap items-center justify-center gap-xl opacity-40 hover:opacity-100 transition-opacity"
            >
              {data.meta && (
                <div className="flex items-center gap-sm">
                  <Icon name="schedule" size="16px" />
                  <span className="font-mono text-label-sm">
                    Account created:{" "}
                    {new Date(data.meta.accountCreated).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-sm">
                <Icon name="cloud_done" size="16px" />
                <span className="font-mono text-label-sm">
                  GitHub API · Live
                </span>
              </div>
              <button
                onClick={onBack}
                className="flex items-center gap-sm hover:text-primary transition-colors"
              >
                <Icon name="arrow_back" size="16px" />
                <span className="font-mono text-label-sm">New Analysis</span>
              </button>
            </motion.footer>
          </motion.div>
        )}
      </main>
    </div>
  );
}
