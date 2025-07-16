import { useQuery, useMutation } from "@tanstack/react-query";
import { List, FileVideo, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProcessingJob, Video } from "@shared/schema";

export default function ProcessingQueue() {
  const { toast } = useToast();

  const { data: jobs = [] } = useQuery<ProcessingJob[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: 2000,
  });

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const getVideoName = (videoId: number) => {
    const video = videos.find(v => v.id === videoId);
    return video?.originalName || `Video ${videoId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-accent/10 text-accent";
      case "processing":
        return "bg-warning/10 text-warning";
      case "failed":
        return "bg-error/10 text-error";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "synthetic":
        return "bg-secondary/10 text-secondary";
      case "vla":
        return "bg-accent/10 text-accent";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const getETA = (progress: number, status: string) => {
    if (status === "completed") return "Complete";
    if (status === "failed") return "Failed";
    if (progress === 0) return "Starting...";
    
    const remainingTime = Math.ceil((100 - progress) / 10); // Rough estimate
    return `${remainingTime} min`;
  };

  const formatJobType = (type: string) => {
    switch (type) {
      case "synthetic":
        return "Synthetic Gen";
      case "vla":
        return "VLA Convert";
      default:
        return type;
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="mt-8">
        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="flex items-center text-gray-900">
              <List className="text-gray-600 mr-2" size={20} />
              Processing Queue
            </CardTitle>
            <p className="text-sm text-gray-600">Monitor your video processing jobs</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <p>No processing jobs in queue</p>
              <p className="text-sm mt-1">Upload a video and start processing to see jobs here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="flex items-center text-gray-900">
            <List className="text-gray-600 mr-2" size={20} />
            Processing Queue
          </CardTitle>
          <p className="text-sm text-gray-600">Monitor your video processing jobs</p>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-900">File</th>
                  <th className="text-left py-2 font-medium text-gray-900">Type</th>
                  <th className="text-left py-2 font-medium text-gray-900">Status</th>
                  <th className="text-left py-2 font-medium text-gray-900">Progress</th>
                  <th className="text-left py-2 font-medium text-gray-900">ETA</th>
                  <th className="text-left py-2 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <FileVideo className="text-primary" size={16} />
                        <span>{getVideoName(job.videoId)}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(job.type)}`}>
                        {formatJobType(job.type)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(job.status)}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="w-20">
                        <Progress value={job.progress || 0} className="h-2" />
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">
                      {getETA(job.progress || 0, job.status)}
                    </td>
                    <td className="py-3">
                      {job.status === "processing" || job.status === "pending" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error hover:text-error/80 text-xs p-1"
                        >
                          <X size={14} />
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
