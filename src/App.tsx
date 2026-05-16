import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import ResultPage, { type AnalysisResult } from "./components/ResultPage";
import HeroSection from "./components/HeroSection";
import SponsorBar from "./components/SponsorBar";
import FeaturesGrid from "./components/FeaturesGrid";
import Footer from "./components/Footer";
import WorkflowSection from "./components/WorkflowSection";
import { getHistory, type HistoryEntry } from "./lib/history";

interface AnalysisInput {
  url: string;
  jobDescription?: string;
}

export default function App() {
  const [input, setInput] = useState<AnalysisInput | null>(null);
  const [cachedResult, setCachedResult] = useState<AnalysisResult | undefined>(undefined);
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory());

  function handleBack() {
    setInput(null);
    setCachedResult(undefined);
    setHistory(getHistory());
  }

  if (input !== null) {
    return (
      <ResultPage
        input={input.url}
        jobDescription={input.jobDescription}
        cachedResult={cachedResult}
        onBack={handleBack}
      />
    );
  }

  return (
    <>
      <Navbar />
      <main className="translate-y-[-40px]">
        <HeroSection
          history={history}
          onAnalyze={(url, jobDescription) => {
            setCachedResult(undefined);
            setInput({ url, jobDescription });
          }}
          onSelectHistory={(entry: HistoryEntry) => {
            setCachedResult(entry.result);
            setInput({ url: entry.input, jobDescription: entry.jobDescription });
          }}
        />
        <SponsorBar />
        <FeaturesGrid />
        <WorkflowSection />
      </main>
      <Footer />
    </>
  );
}
