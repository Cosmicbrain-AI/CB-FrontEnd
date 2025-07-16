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
    <Card className="overflow-hidden" id="upload">
      <CardHeader className="bg-primary/5 border-b border-gray-200">
        <CardTitle className="flex items-center text-gray-900">
          <CloudUpload className="text-primary mr-2" size={20} />
          Video Upload
        </CardTitle>
        <p className="text-sm text-gray-600">Upload your source video for processing</p>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileVideo className="text-4xl text-gray-400 mb-4 mx-auto" size={64} />
          <p className="text-lg font-medium text-gray-900 mb-2">Drop video files here</p>
          <p className="text-sm text-gray-600 mb-4">or click to browse</p>
          <Button>Select Files</Button>
          <p className="text-xs text-gray-500 mt-3">Supports MP4, AVI, MOV up to 500MB</p>
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
            <h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Files</h4>
            <div className="space-y-2">
              {videos.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileVideo className="text-primary" size={20} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{video.originalName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(video.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-accent/10 text-accent text-xs px-2 py-1 rounded-full flex items-center">
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
