import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import ResultPage from "./components/ResultPage";
import HeroSection from "./components/HeroSection";
import SponsorBar from "./components/SponsorBar";
import FeaturesGrid from "./components/FeaturesGrid";
import Footer from "./components/Footer";
import WorkflowSection from "./components/WorkflowSection";

interface AnalysisInput {
  url: string;
  jobDescription?: string;
  cvFile?: File;
}

export default function App() {
  const [input, setInput] = useState<AnalysisInput | null>(null);

  if (input !== null) {
    return (
      <ResultPage
        input={input.url}
        jobDescription={input.jobDescription}
        cvFile={input.cvFile}
        onBack={() => setInput(null)}
      />
    );
  }

  return (
    <>
      <Navbar />
      <main className="translate-y-[-40px]">
        <HeroSection
          onAnalyze={(url, jobDescription, cvFile) =>
            setInput({ url, jobDescription, cvFile })
          }
        />
        <SponsorBar />
        <FeaturesGrid />
        <WorkflowSection />
      </main>
      <Footer />
    </>
  );
}
