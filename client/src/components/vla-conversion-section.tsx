import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Cog, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Video, ProcessingJob, SyntheticVariation, VlaOutput } from "@shared/schema";

export default function VlaConversionSection() {
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [modelType, setModelType] = useState("rt1");
  const [actionGranularity, setActionGranularity] = useState("5hz");
  const [languageAnnotations, setLanguageAnnotations] = useState("");
  const [outputFormat, setOutputFormat] = useState("tensorflow");
  const [compression, setCompression] = useState("none");
  const { toast } = useToast();

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: jobs = [] } = useQuery<ProcessingJob[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: 2000,
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

  const { data: vlaOutputs = [] } = useQuery<VlaOutput[]>({
    queryKey: ["/api/vla-outputs"],
    queryFn: async () => {
      const vlaJobs = jobs.filter(job => job.type === "vla" && job.status === "completed");
      const allOutputs = await Promise.all(
        vlaJobs.map(async (job) => {
          const response = await fetch(`/api/jobs/${job.id}/vla-outputs`);
          return response.json();
        })
      );
      return allOutputs.flat();
    },
    enabled: jobs.some(job => job.type === "vla" && job.status === "completed"),
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      if (selectedVideos.length === 0) {
        throw new Error("Please select at least one video for conversion");
      }

      const parameters = {
        selectedVideos,
        modelType,
        actionGranularity,
        languageAnnotations,
        outputFormat,
        compression,
      };

      const response = await apiRequest("POST", "/api/jobs/vla", {
        videoId: selectedVideos[0], // Use first selected video for demo
        parameters,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Conversion started",
        description: "VLA conversion has begun.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Conversion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentVlaJob = jobs.find(job => 
    job.type === "vla" && 
    (job.status === "processing" || job.status === "pending")
  );

  const handleVideoSelection = (videoId: number, checked: boolean) => {
    setSelectedVideos(prev => 
      checked 
        ? [...prev, videoId]
        : prev.filter(id => id !== videoId)
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const availableVideos = [
    ...videos.map(video => ({ ...video, type: "Original Video" })),
    ...variations.map(variation => ({ 
      id: variation.id + 1000, // Offset to avoid ID conflicts
      originalName: variation.name,
      type: "Synthetic Variation"
    }))
  ];

  return (
    <Card className="overflow-hidden" id="vla">
      <CardHeader className="bg-accent/5 border-b border-gray-200">
        <CardTitle className="flex items-center text-gray-900">
          <Cog className="text-accent mr-2" size={20} />
          VLA Conversion
        </CardTitle>
        <p className="text-sm text-gray-600">Convert to Vision-Language-Action format</p>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Source Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Source Videos</label>
          <div className="border border-gray-300 rounded-md max-h-32 overflow-y-auto">
            {availableVideos.map((video) => (
              <label
                key={video.id}
                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <Checkbox
                  checked={selectedVideos.includes(video.id)}
                  onCheckedChange={(checked) => 
                    handleVideoSelection(video.id, checked === true)
                  }
                />
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{video.originalName}</p>
                  <p className="text-xs text-gray-500">{video.type}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* VLA Configuration */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              VLA Model Type
            </label>
            <Select value={modelType} onValueChange={setModelType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rt1">RT-1 (Robotics Transformer)</SelectItem>
                <SelectItem value="palm-e">PALM-E (Visual Language Model)</SelectItem>
                <SelectItem value="custom">Custom VLA Model</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Action Granularity
            </label>
            <Select value={actionGranularity} onValueChange={setActionGranularity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10hz">Fine-grained (10Hz)</SelectItem>
                <SelectItem value="5hz">Standard (5Hz)</SelectItem>
                <SelectItem value="1hz">Coarse (1Hz)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Language Annotations
            </label>
            <Textarea
              value={languageAnnotations}
              onChange={(e) => setLanguageAnnotations(e.target.value)}
              rows={3}
              placeholder="Describe the actions in natural language, e.g., 'Pick up the red cube and place it on the shelf'"
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Output Format
              </label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tensorflow">TensorFlow Dataset</SelectItem>
                  <SelectItem value="pytorch">PyTorch Dataset</SelectItem>
                  <SelectItem value="json">JSON Format</SelectItem>
                  <SelectItem value="hdf5">HDF5 Format</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Compression
              </label>
              <Select value={compression} onValueChange={setCompression}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="gzip">GZIP</SelectItem>
                  <SelectItem value="lz4">LZ4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Convert Button */}
        <Button
          onClick={() => convertMutation.mutate()}
          disabled={convertMutation.isPending || selectedVideos.length === 0}
          className="w-full bg-accent hover:bg-accent/90"
        >
          {convertMutation.isPending ? (
            <Loader2 className="mr-2" size={16} />
          ) : (
            <Cog className="mr-2" size={16} />
          )}
          Convert to VLA Format
        </Button>

        {/* Conversion Status */}
        {currentVlaJob && (
          <div className="mt-6 bg-accent/5 border border-accent/20 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Loader2 className="animate-spin text-accent mr-2" size={16} />
              <span className="text-sm font-medium text-accent">
                Converting to VLA format...
              </span>
            </div>
            <Progress value={currentVlaJob.progress || 0} className="mb-2" />
            <p className="text-xs text-gray-600">
              {currentVlaJob.progress < 30 && "Extracting visual features..."}
              {currentVlaJob.progress >= 30 && currentVlaJob.progress < 60 && "Processing language annotations..."}
              {currentVlaJob.progress >= 60 && currentVlaJob.progress < 90 && "Generating action sequences..."}
              {currentVlaJob.progress >= 90 && "Finalizing VLA dataset..."}
            </p>
          </div>
        )}

        {/* VLA Output */}
        {vlaOutputs.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Generated VLA Datasets</h4>
            <div className="space-y-3">
              {vlaOutputs.map((output) => (
                <div key={output.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{output.filename}</span>
                    <span className="bg-accent/10 text-accent text-xs px-2 py-1 rounded-full">
                      Complete
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-2">
                    <div>Size: <span>{formatFileSize(output.size)}</span></div>
                    <div>Episodes: <span>{output.episodes?.toLocaleString()}</span></div>
                    <div>Actions: <span>{output.actions?.toLocaleString()}</span></div>
                    <div>Duration: <span>{output.duration}</span></div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="text-xs bg-accent hover:bg-accent/90">
                      <Download size={12} className="mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      Validate
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
