import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertVideoSchema, insertProcessingJobSchema } from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, AVI, and MOV files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload video
  app.post("/api/videos/upload", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const videoData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path,
      };

      const result = insertVideoSchema.safeParse(videoData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid video data", errors: result.error.issues });
      }

      const video = await storage.createVideo(result.data);
      res.json(video);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload video", error: error.message });
    }
  });

  // Get all videos
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch videos", error: error.message });
    }
  });

  // Delete video
  app.delete("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      // Delete file from disk
      if (fs.existsSync(video.path)) {
        fs.unlinkSync(video.path);
      }

      await storage.deleteVideo(id);
      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete video", error: error.message });
    }
  });

  // Create processing job (synthetic generation)
  app.post("/api/jobs/synthetic", async (req, res) => {
    try {
      const jobData = {
        videoId: req.body.videoId,
        type: "synthetic",
        status: "pending",
        progress: 0,
        parameters: req.body.parameters,
      };

      const result = insertProcessingJobSchema.safeParse(jobData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid job data", errors: result.error.issues });
      }

      const job = await storage.createProcessingJob(result.data);
      
      // Start processing simulation
      setTimeout(async () => {
        await simulateSyntheticProcessing(job.id);
      }, 1000);

      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to create synthetic job", error: error.message });
    }
  });

  // Create processing job (VLA conversion)
  app.post("/api/jobs/vla", async (req, res) => {
    try {
      const jobData = {
        videoId: req.body.videoId,
        type: "vla",
        status: "pending",
        progress: 0,
        parameters: req.body.parameters,
      };

      const result = insertProcessingJobSchema.safeParse(jobData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid job data", errors: result.error.issues });
      }

      const job = await storage.createProcessingJob(result.data);
      
      // Start processing simulation
      setTimeout(async () => {
        await simulateVlaProcessing(job.id);
      }, 1000);

      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to create VLA job", error: error.message });
    }
  });

  // Get all processing jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllProcessingJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs", error: error.message });
    }
  });

  // Get synthetic variations by job ID
  app.get("/api/jobs/:id/variations", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const variations = await storage.getVariationsByJobId(jobId);
      res.json(variations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch variations", error: error.message });
    }
  });

  // Get VLA outputs by job ID
  app.get("/api/jobs/:id/vla-outputs", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const outputs = await storage.getVlaOutputsByJobId(jobId);
      res.json(outputs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch VLA outputs", error: error.message });
    }
  });

  // Simulate synthetic processing
  async function simulateSyntheticProcessing(jobId: number) {
    const intervals = [25, 50, 75, 100];
    
    for (const progress of intervals) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await storage.updateProcessingJob(jobId, {
        progress,
        status: progress === 100 ? "completed" : "processing"
      });

      if (progress === 100) {
        // Create some synthetic variations
        const variations = [
          {
            jobId,
            name: "Enhanced Lighting",
            description: "Improved lighting conditions with natural shadows",
            filename: `variation_lighting_${jobId}.mp4`,
            path: `/uploads/variation_lighting_${jobId}.mp4`,
            size: 15234567
          },
          {
            jobId,
            name: "Different Angles",
            description: "Multiple camera angles and perspectives",
            filename: `variation_angles_${jobId}.mp4`,
            path: `/uploads/variation_angles_${jobId}.mp4`,
            size: 18456789
          },
          {
            jobId,
            name: "Motion Variation",
            description: "Varied robot movement speeds and patterns",
            filename: `variation_motion_${jobId}.mp4`,
            path: `/uploads/variation_motion_${jobId}.mp4`,
            size: 16789123
          }
        ];

        for (const variation of variations) {
          await storage.createSyntheticVariation(variation);
        }
      }
    }
  }

  // Simulate VLA processing
  async function simulateVlaProcessing(jobId: number) {
    const intervals = [30, 60, 90, 100];
    
    for (const progress of intervals) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      await storage.updateProcessingJob(jobId, {
        progress,
        status: progress === 100 ? "completed" : "processing"
      });

      if (progress === 100) {
        // Create VLA output
        await storage.createVlaOutput({
          jobId,
          filename: `robot_demo_vla_${jobId}.tfrecord`,
          path: `/uploads/robot_demo_vla_${jobId}.tfrecord`,
          size: 130678901,
          format: "TensorFlow Dataset",
          episodes: 1247,
          actions: 8432,
          duration: "28.5 min"
        });
      }
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
