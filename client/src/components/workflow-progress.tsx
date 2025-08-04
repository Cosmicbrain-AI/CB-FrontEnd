import { useQuery } from "@tanstack/react-query";
import { CloudUpload, Wand2, Cog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProcessingJob } from "@shared/schema";

export default function WorkflowProgress() {
  const { data: jobs = [] } = useQuery<ProcessingJob[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: 2000,
  });

  const hasUploads = jobs.length > 0;
  const hasSyntheticProgress = jobs.some(job => job.type === "synthetic" && job.status !== "pending");
  const hasVlaProgress = jobs.some(job => job.type === "vla" && job.status !== "pending");

  const syntheticProgress = jobs.find(job => job.type === "synthetic" && job.status === "processing")?.progress || 0;
  const vlaProgress = jobs.find(job => job.type === "vla" && job.status === "processing")?.progress || 0;

  return (
    <div className="mb-8">
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Processing Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {/* Upload Step */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#5129c4]">
                <CloudUpload className={`text-sm ${hasUploads ? "text-white" : "text-gray-400"}`} size={16} />
              </div>
              <span className={`text-sm font-medium ${hasUploads ? "text-primary" : "text-gray-400"}`}>
                Upload Video
              </span>
            </div>

            {/* Progress Bar 1 */}
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: hasUploads ? "100%" : "0%" }}
              />
            </div>

            {/* Synthetic Step */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                hasSyntheticProgress ? "bg-secondary" : "bg-gray-200"
              }`}>
                <Wand2 className={`text-sm ${hasSyntheticProgress ? "text-white" : "text-gray-400"}`} size={16} />
              </div>
              <span className={`text-sm ${hasSyntheticProgress ? "text-secondary" : "text-gray-400"}`}>
                Generate Synthetic
              </span>
            </div>

            {/* Progress Bar 2 */}
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div 
                className="h-full bg-secondary transition-all duration-300"
                style={{ width: `${syntheticProgress}%` }}
              />
            </div>

            {/* VLA Step */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                hasVlaProgress ? "bg-accent" : "bg-gray-200"
              }`}>
                <Cog className={`text-sm ${hasVlaProgress ? "text-white" : "text-gray-400"}`} size={16} />
              </div>
              <span className={`text-sm ${hasVlaProgress ? "text-accent" : "text-gray-400"}`}>
                Convert to VLA
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
