import { 
  videos, 
  processingJobs, 
  syntheticVariations, 
  vlaOutputs,
  type Video, 
  type InsertVideo,
  type ProcessingJob,
  type InsertProcessingJob,
  type SyntheticVariation,
  type InsertSyntheticVariation,
  type VlaOutput,
  type InsertVlaOutput
} from "@shared/schema";

export interface IStorage {
  // Video operations
  createVideo(video: InsertVideo): Promise<Video>;
  getVideo(id: number): Promise<Video | undefined>;
  getAllVideos(): Promise<Video[]>;
  deleteVideo(id: number): Promise<void>;

  // Processing job operations
  createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob>;
  getProcessingJob(id: number): Promise<ProcessingJob | undefined>;
  getAllProcessingJobs(): Promise<ProcessingJob[]>;
  updateProcessingJob(id: number, updates: Partial<ProcessingJob>): Promise<ProcessingJob | undefined>;
  getJobsByVideoId(videoId: number): Promise<ProcessingJob[]>;

  // Synthetic variation operations
  createSyntheticVariation(variation: InsertSyntheticVariation): Promise<SyntheticVariation>;
  getVariationsByJobId(jobId: number): Promise<SyntheticVariation[]>;

  // VLA output operations
  createVlaOutput(output: InsertVlaOutput): Promise<VlaOutput>;
  getVlaOutputsByJobId(jobId: number): Promise<VlaOutput[]>;
}

export class MemStorage implements IStorage {
  private videos: Map<number, Video>;
  private processingJobs: Map<number, ProcessingJob>;
  private syntheticVariations: Map<number, SyntheticVariation>;
  private vlaOutputs: Map<number, VlaOutput>;
  private currentVideoId: number;
  private currentJobId: number;
  private currentVariationId: number;
  private currentVlaOutputId: number;

  constructor() {
    this.videos = new Map();
    this.processingJobs = new Map();
    this.syntheticVariations = new Map();
    this.vlaOutputs = new Map();
    this.currentVideoId = 1;
    this.currentJobId = 1;
    this.currentVariationId = 1;
    this.currentVlaOutputId = 1;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = this.currentVideoId++;
    const video: Video = { 
      ...insertVideo, 
      id, 
      uploadedAt: new Date() 
    };
    this.videos.set(id, video);
    return video;
  }

  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async getAllVideos(): Promise<Video[]> {
    return Array.from(this.videos.values());
  }

  async deleteVideo(id: number): Promise<void> {
    this.videos.delete(id);
  }

  async createProcessingJob(insertJob: InsertProcessingJob): Promise<ProcessingJob> {
    const id = this.currentJobId++;
    const now = new Date();
    const job: ProcessingJob = { 
      ...insertJob, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.processingJobs.set(id, job);
    return job;
  }

  async getProcessingJob(id: number): Promise<ProcessingJob | undefined> {
    return this.processingJobs.get(id);
  }

  async getAllProcessingJobs(): Promise<ProcessingJob[]> {
    return Array.from(this.processingJobs.values());
  }

  async updateProcessingJob(id: number, updates: Partial<ProcessingJob>): Promise<ProcessingJob | undefined> {
    const job = this.processingJobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { 
      ...job, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.processingJobs.set(id, updatedJob);
    return updatedJob;
  }

  async getJobsByVideoId(videoId: number): Promise<ProcessingJob[]> {
    return Array.from(this.processingJobs.values()).filter(job => job.videoId === videoId);
  }

  async createSyntheticVariation(insertVariation: InsertSyntheticVariation): Promise<SyntheticVariation> {
    const id = this.currentVariationId++;
    const variation: SyntheticVariation = { 
      ...insertVariation, 
      id, 
      createdAt: new Date() 
    };
    this.syntheticVariations.set(id, variation);
    return variation;
  }

  async getVariationsByJobId(jobId: number): Promise<SyntheticVariation[]> {
    return Array.from(this.syntheticVariations.values()).filter(variation => variation.jobId === jobId);
  }

  async createVlaOutput(insertOutput: InsertVlaOutput): Promise<VlaOutput> {
    const id = this.currentVlaOutputId++;
    const output: VlaOutput = { 
      ...insertOutput, 
      id, 
      createdAt: new Date() 
    };
    this.vlaOutputs.set(id, output);
    return output;
  }

  async getVlaOutputsByJobId(jobId: number): Promise<VlaOutput[]> {
    return Array.from(this.vlaOutputs.values()).filter(output => output.jobId === jobId);
  }
}

export const storage = new MemStorage();
