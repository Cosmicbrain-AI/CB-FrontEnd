import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CloudUpload, FileVideo, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Video } from "@shared/schema";

export default function VideoUploadSection() {
  const [dragActive, setDragActive] = useState(false);
  const [quality, setQuality] = useState("original");
  const [autoProcess, setAutoProcess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("video", file);
      
      const response = await apiRequest("POST", "/api/videos/upload", formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Upload successful",
        description: "Your video has been uploaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/videos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Video deleted",
        description: "The video has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      if (file.type.startsWith("video/")) {
        if (file.size <= 500 * 1024 * 1024) { // 500MB limit
          uploadMutation.mutate(file);
        } else {
          toast({
            title: "File too large",
            description: "Please select a video file smaller than 500MB.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a video file (MP4, AVI, MOV).",
          variant: "destructive",
        });
      }
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="overflow-hidden card-enhanced glass border-purple-500/30 glow-purple" id="upload">
      <CardHeader className="border-b border-purple-500/20">
        <CardTitle className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-lg">
            <CloudUpload className="h-5 w-5 text-purple-400" />
          </div>
          <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">1. Upload Video</span>
        </CardTitle>
        <p className="text-sm text-white/70">Upload your source video for processing</p>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer glass ${
            dragActive ? "border-purple-400 bg-purple-500/10 glow-purple" : "border-purple-500/30 hover:border-purple-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileVideo className="text-purple-400 mb-4 mx-auto" size={64} />
          <p className="text-lg font-medium text-white mb-2">Drop video files here</p>
          <p className="text-sm text-white/70 mb-4">or click to browse</p>
          <Button className="neon-button bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700">Select Files</Button>
          <p className="text-xs text-white/60 mt-3">Supports MP4, AVI, MOV up to 500MB</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Uploaded Files List */}
        {videos.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-white mb-3">Uploaded Files</h4>
            <div className="space-y-3">
              {videos.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-4 glass border border-purple-500/20 rounded-xl hover:bg-purple-500/5 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <FileVideo className="text-purple-400" size={20} />
                    <div>
                      <p className="text-sm font-medium text-white">{video.originalName}</p>
                      <p className="text-xs text-white/60">{formatFileSize(video.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full flex items-center">
                      <CheckCircle size={12} className="mr-1" />
                      Ready
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(video.id)}
                      disabled={deleteMutation.isPending}
                      className="text-error hover:text-error/80"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Settings */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Upload Settings</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Video Quality</label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Original Quality</SelectItem>
                  <SelectItem value="720p">High (720p)</SelectItem>
                  <SelectItem value="480p">Medium (480p)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoProcess"
                checked={autoProcess}
                onCheckedChange={(checked) => setAutoProcess(checked === true)}
              />
              <label htmlFor="autoProcess" className="text-sm text-gray-700">
                Auto-process after upload
              </label>
            </div>
          </div>
        </div>

        {uploadMutation.isPending && (
          <div className="mt-4 text-sm text-primary">Uploading...</div>
        )}
      </CardContent>
    </Card>
  );
}
