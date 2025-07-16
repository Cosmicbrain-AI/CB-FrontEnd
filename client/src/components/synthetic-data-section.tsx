import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Video, ProcessingJob, SyntheticVariation } from "@shared/schema";

export default function SyntheticDataSection() {
  const [prompt, setPrompt] = useState("");
  const [variationCount, setVariationCount] = useState([3]);
  const [intensity, setIntensity] = useState("moderate");
  const [focusAreas, setFocusAreas] = useState({
    lighting: false,
    motion: false,
    background: false,
    objects: false,
  });
  const { toast } = useToast();

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: jobs = [] } = useQuery<ProcessingJob[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: 2000, // Poll every 2 seconds for updates
  });

  const { data: variations = [] } = useQuery<SyntheticVariation[]>({
    queryKey: ["/api/variations"],
    queryFn: async () => {
      const syntheticJobs = jobs.filter(job => job.type === "synthetic" && job.status === "completed");
      const allVariations = await Promise.all(
        syntheticJobs.map(async (job) => {
          const response = await fetch(`/api/jobs/${job.id}/variations`);
          return response.json();
        })
      );
      return allVariations.flat();
    },
    enabled: jobs.some(job => job.type === "synthetic" && job.status === "completed"),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (videos.length === 0) {
        throw new Error("No videos available for processing");
      }

      const parameters = {
        prompt,
        variationCount: variationCount[0],
        intensity,
        focusAreas,
      };

      const response = await apiRequest("POST", "/api/jobs/synthetic", {
        videoId: videos[0].id, // Use first video for demo
        parameters,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Generation started",
        description: "Synthetic data generation has begun.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentSyntheticJob = jobs.find(job => 
    job.type === "synthetic" && 
    (job.status === "processing" || job.status === "pending")
  );

  const completedSyntheticJobs = jobs.filter(job => 
    job.type === "synthetic" && job.status === "completed"
  );

  const handleFocusAreaChange = (area: keyof typeof focusAreas, checked: boolean) => {
    setFocusAreas(prev => ({ ...prev, [area]: checked }));
  };

  return (
    <Card className="overflow-hidden" id="synthetic">
      <CardHeader className="bg-secondary/5 border-b border-gray-200">
        <CardTitle className="flex items-center text-gray-900">
          <Wand2 className="text-secondary mr-2" size={20} />
          Synthetic Data Generation
        </CardTitle>
        <p className="text-sm text-gray-600">Generate synthetic variations using AI</p>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Prompt Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Generation Prompt
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Describe the synthetic variations you want to generate. For example: 'Add different lighting conditions', 'Change camera angles', 'Vary robot movement speed'..."
            className="resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Be specific about the variations you want to create
          </p>
        </div>

        {/* Generation Parameters */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Number of Variations
            </label>
            <Slider
              value={variationCount}
              onValueChange={setVariationCount}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>{variationCount[0]}</span>
              <span>10</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Variation Intensity
            </label>
            <Select value={intensity} onValueChange={setIntensity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="subtle">Subtle Changes</SelectItem>
                <SelectItem value="moderate">Moderate Changes</SelectItem>
                <SelectItem value="significant">Significant Changes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Focus Areas
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(focusAreas).map(([area, checked]) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={area}
                    checked={checked}
                    onCheckedChange={(checked) => 
                      handleFocusAreaChange(area as keyof typeof focusAreas, checked === true)
                    }
                  />
                  <label htmlFor={area} className="text-sm text-gray-700 capitalize">
                    {area}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || videos.length === 0 || !prompt.trim()}
          className="w-full bg-secondary hover:bg-secondary/90"
        >
          {generateMutation.isPending ? (
            <Loader2 className="mr-2" size={16} />
          ) : (
            <Wand2 className="mr-2" size={16} />
          )}
          Generate Synthetic Data
        </Button>

        {/* Processing Status */}
        {currentSyntheticJob && (
          <div className="mt-6 bg-secondary/5 border border-secondary/20 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Loader2 className="animate-spin text-secondary mr-2" size={16} />
              <span className="text-sm font-medium text-secondary">
                Generating synthetic variations...
              </span>
            </div>
            <Progress value={currentSyntheticJob.progress || 0} className="mb-2" />
            <p className="text-xs text-gray-600">
              Processing variation {Math.floor(((currentSyntheticJob.progress || 0) / 100) * variationCount[0]) + 1} of {variationCount[0]}...
            </p>
          </div>
        )}

        {/* Generated Results */}
        {variations.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Generated Variations</h4>
            <div className="space-y-3">
              {variations.map((variation) => (
                <div key={variation.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{variation.name}</span>
                    <span className="bg-accent/10 text-accent text-xs px-2 py-1 rounded-full">
                      Ready
                    </span>
                  </div>
                  {variation.description && (
                    <p className="text-xs text-gray-600 mb-2">{variation.description}</p>
                  )}
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
