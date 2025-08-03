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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-gray-900">CosmicBrain AI</h1>
              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">Beta</span>
            </div>
            <nav className="flex space-x-6">
              <button
                onClick={() => scrollToSection("platform")}
                className={`font-medium transition-colors ${
                  activeSection === "platform" ? "text-primary" : "text-gray-600 hover:text-primary"
                }`}
              >
                Platform
              </button>
              <button
                onClick={() => scrollToSection("marketplace")}
                className={`font-medium transition-colors ${
                  activeSection === "marketplace" ? "text-primary" : "text-gray-600 hover:text-primary"
                }`}
              >
                Marketplace
              </button>
              <a href="#enterprise" className="text-gray-600 hover:text-primary transition-colors font-medium">Enterprise VLA</a>
              <a href="#profile" className="text-gray-600 hover:text-primary transition-colors font-medium">Profile</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <footer className="bg-surface border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <span className="text-gray-900 font-semibold">CosmicBrain AI</span>
              <span className="text-gray-600 text-sm">© 2025 CosmicBrain AI</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <a href="#docs" className="hover:text-primary transition-colors">Documentation</a>
              <a href="#api" className="hover:text-primary transition-colors">API</a>
              <a href="#support" className="hover:text-primary transition-colors">Support</a>
              <a href="#status" className="hover:text-primary transition-colors">System Status</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
