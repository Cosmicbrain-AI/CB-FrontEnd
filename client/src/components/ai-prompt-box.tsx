import { useState } from "react";
import { Sparkles, Send, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const SAMPLE_PROMPTS = [
  {
    title: "Train a robotic arm to sort packages by size and weight",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=200&fit=crop&crop=center",
    description: "Warehouse automation and logistics"
  },
  {
    title: "Teach a robot to fold laundry with different fabric types",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&crop=center",
    description: "Domestic assistance and care"
  },
  {
    title: "Create a cooking assistant robot for meal preparation",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop&crop=center",
    description: "Culinary automation"
  },
  {
    title: "Train a robot to clean and organize workspaces",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop&crop=center",
    description: "Office and facility management"
  },
  {
    title: "Develop navigation skills for warehouse robotics",
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=200&h=200&fit=crop&crop=center",
    description: "Autonomous navigation systems"
  }
];

export default function AIPromptBox() {
  const [prompt, setPrompt] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "AI Analysis Complete",
        description: "I've analyzed your skillset requirements and generated training recommendations.",
      });
      
      // Auto-populate relevant sections based on the prompt
      const syntheticPrompt = `Generate synthetic variations for: ${prompt}`;
      // This would integrate with the synthetic data section
      
    }, 2000);
  };

  const handleSamplePrompt = (samplePrompt: string) => {
    setPrompt(samplePrompt);
    setIsExpanded(true);
  };

  return (
    <div className="mb-8">
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Training Assistant</h3>
              <p className="text-sm text-gray-600">Describe the robotic skillset you want to train</p>
            </div>
          </div>

          {!isExpanded ? (
            <div>
              <div 
                className="w-full text-left p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setIsExpanded(true)}
              >
                <div className="flex items-center space-x-2">
                  <Lightbulb className="text-gray-400" size={16} />
                  <span className="text-gray-500">What skillset would you like to train your robot?</span>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-xs text-gray-600 mb-2">Popular training ideas:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SAMPLE_PROMPTS.slice(0, 3).map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => handleSamplePrompt(sample.title)}
                      className="flex items-center space-x-2 p-2 bg-white border border-gray-200 rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-colors text-left"
                    >
                      <img 
                        src={sample.image} 
                        alt={sample.description}
                        className="w-12 h-12 rounded-md object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 line-clamp-2">{sample.title}</p>
                        <p className="text-xs text-gray-500">{sample.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the robotic skillset in detail. For example: 'I want to train a robot to perform precision assembly tasks for electronic components, including picking up small screws, aligning circuit boards, and applying the right amount of pressure during assembly.'"
                  rows={4}
                  className="resize-none pr-12"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isProcessing}
                  size="sm"
                  className="absolute bottom-3 right-3"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-600">Try these examples:</span>
                {SAMPLE_PROMPTS.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(sample)}
                    className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Collapse
                </button>
                <div className="text-xs text-gray-500">
                  {prompt.length}/1000 characters
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}