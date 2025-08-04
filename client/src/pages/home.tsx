import { useState } from "react";
import { Bot } from "lucide-react";
import VideoUploadSection from "@/components/video-upload-section";
import SyntheticDataSection from "@/components/synthetic-data-section";
import VlaConversionSection from "@/components/vla-conversion-section";
import WorkflowProgress from "@/components/workflow-progress";
import ProcessingQueue from "@/components/processing-queue";
import AIPromptBox from "@/components/ai-prompt-box";
import SkillsetMarketplace from "@/components/skillset-marketplace";

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("upload");

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 gradient-mesh opacity-30"></div>
      <div className="relative z-10">
      {/* Header */}
      <header className="glass border-b border-purple-500/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg glow-purple">
                <span className="font-bold text-lg text-white">C</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
                CosmicBrain AI
              </h1>
              <span className="bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 text-xs px-3 py-1 rounded-full font-medium border border-purple-500/30 glow-purple">
                Beta
              </span>
            </div>
            <nav className="flex space-x-8">
              <button
                onClick={() => scrollToSection("platform")}
                className={`font-medium transition-all duration-300 px-4 py-2 rounded-lg ${
                  activeSection === "platform" 
                    ? "text-purple-300 bg-purple-500/20 glow-purple border border-purple-500/30" 
                    : "text-foreground hover:text-purple-300 hover:bg-purple-500/10"
                }`}
              >
                Platform
              </button>
              <button
                onClick={() => scrollToSection("marketplace")}
                className={`font-medium transition-all duration-300 px-4 py-2 rounded-lg ${
                  activeSection === "marketplace" 
                    ? "text-purple-300 bg-purple-500/20 glow-purple border border-purple-500/30" 
                    : "text-foreground hover:text-purple-300 hover:bg-purple-500/10"
                }`}
              >
                Marketplace
              </button>
              <a href="#enterprise" className="text-foreground hover:text-purple-300 transition-all duration-300 hover:bg-purple-500/10 px-4 py-2 rounded-lg font-medium">Enterprise VLA</a>
              <a href="#profile" className="text-foreground hover:text-purple-300 transition-all duration-300 hover:bg-purple-500/10 px-4 py-2 rounded-lg font-medium">Profile</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
        {/* AI Prompt Box */}
        <AIPromptBox />

        {/* Workflow Progress */}
        <WorkflowProgress />

        {/* Platform Section - Three Main Processing Steps */}
        <div id="platform" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <VideoUploadSection />
          <SyntheticDataSection />
          <VlaConversionSection />
        </div>

        {/* Processing Queue */}
        <ProcessingQueue />

        {/* Skillset Marketplace */}
        <div id="marketplace">
          <SkillsetMarketplace />
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-purple-500/20 mt-16 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent font-semibold">CosmicBrain AI</span>
              <span className="text-muted-foreground text-sm">© 2025 CosmicBrain AI</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#docs" className="hover:text-purple-400 transition-colors">Documentation</a>
              <a href="#api" className="hover:text-purple-400 transition-colors">API</a>
              <a href="#support" className="hover:text-purple-400 transition-colors">Support</a>
              <a href="#status" className="hover:text-purple-400 transition-colors">System Status</a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
