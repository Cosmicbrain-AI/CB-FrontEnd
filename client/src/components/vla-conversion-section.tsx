import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Cog, Download, Loader2, Sparkles, Bot, Eye, FileText } from "lucide-react";
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
  const [robotRecommendations, setRobotRecommendations] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  const analyzeRobotRequirements = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const mockRecommendations = [
        {
          brand: "Universal Robots",
          model: "UR5e",
          confidence: 0.92,
          reasoning: "Ideal for precision tasks with excellent reach and payload capacity",
          specs: {
            payload: "5kg",
            reach: "850mm",
            repeatability: "±0.03mm"
          },
          price: "$35,000 - $50,000",
          availability: "In Stock",
          image: "https://images.unsplash.com/photo-1565344555327-d1adb1c6e5b4?w=300&h=150&fit=crop&crop=center&q=80"
        },
        {
          brand: "KUKA",
          model: "KR3 R540",
          confidence: 0.87,
          reasoning: "Compact design perfect for assembly tasks in confined spaces",
          specs: {
            payload: "3kg",
            reach: "541mm",
            repeatability: "±0.02mm"
          },
          price: "$25,000 - $35,000",
          availability: "2-3 weeks",
          image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=150&fit=crop&crop=center&q=80"
        },
        {
          brand: "ABB",
          model: "IRB120",
          confidence: 0.83,
          reasoning: "Cost-effective solution with reliable performance for repetitive tasks",
          specs: {
            payload: "3kg",
            reach: "580mm",
            repeatability: "±0.01mm"
          },
          price: "$20,000 - $30,000",
          availability: "In Stock",
          image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=150&fit=crop&crop=center&q=80"
        }
      ];
      
      setRobotRecommendations(mockRecommendations);
      setIsAnalyzing(false);
      
      toast({
        title: "AI Analysis Complete",
        description: "Found 3 robot recommendations based on your skillset requirements.",
      });
    }, 3000);
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

        {/* AI Robot Identification */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Sparkles className="text-accent mr-2" size={16} />
                AI Robot Recommendations
              </h4>
              <p className="text-xs text-gray-600">Get AI-powered robot suggestions for your skillset</p>
            </div>
            <Button
              onClick={analyzeRobotRequirements}
              disabled={isAnalyzing || selectedVideos.length === 0}
              variant="outline"
              size="sm"
            >
              {isAnalyzing ? (
                <Loader2 className="mr-2" size={14} />
              ) : (
                <Bot className="mr-2" size={14} />
              )}
              Analyze Requirements
            </Button>
          </div>

          {robotRecommendations.length > 0 && (
            <div className="space-y-4">
              {robotRecommendations.map((robot, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 via-white to-purple-50 border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="flex flex-col md:flex-row">
                    {/* Robot Image Section */}
                    <div className="md:w-1/3 relative">
                      <img 
                        src={robot.image || `https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop&crop=center&q=80`}
                        alt={`${robot.brand} ${robot.model}`}
                        className="w-full h-48 md:h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm px-3 py-1 rounded-full font-bold shadow-lg">
                          {Math.round(robot.confidence * 100)}% AI Match
                        </div>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                          {robot.availability}
                        </div>
                      </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="md:w-2/3 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h5 className="text-xl font-bold text-gray-900 mb-1">{robot.brand}</h5>
                          <p className="text-lg text-primary font-semibold">{robot.model}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{robot.price}</div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-4 leading-relaxed">{robot.reasoning}</p>
                      
                      {/* Technical Specs */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg text-center border border-blue-200">
                          <div className="font-bold text-blue-900 text-lg">{robot.specs.payload}</div>
                          <div className="text-blue-700 text-xs font-medium">Max Payload</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg text-center border border-green-200">
                          <div className="font-bold text-green-900 text-lg">{robot.specs.reach}</div>
                          <div className="text-green-700 text-xs font-medium">Working Reach</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg text-center border border-purple-200">
                          <div className="font-bold text-purple-900 text-lg">{robot.specs.repeatability}</div>
                          <div className="text-purple-700 text-xs font-medium">Precision</div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <Button variant="outline" size="sm" className="flex-1 border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 font-medium">
                          <Eye className="mr-2" size={14} />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 border-2 border-gray-300 hover:border-green-500 hover:text-green-600 font-medium">
                          <FileText className="mr-2" size={14} />
                          Get Quote
                        </Button>
                        <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg">
                          <Bot className="mr-2" size={14} />
                          Select Robot
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              {(currentVlaJob.progress || 0) < 30 && "Extracting visual features..."}
              {(currentVlaJob.progress || 0) >= 30 && (currentVlaJob.progress || 0) < 60 && "Processing language annotations..."}
              {(currentVlaJob.progress || 0) >= 60 && (currentVlaJob.progress || 0) < 90 && "Generating action sequences..."}
              {(currentVlaJob.progress || 0) >= 90 && "Finalizing VLA dataset..."}
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
