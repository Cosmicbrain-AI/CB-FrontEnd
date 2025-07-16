# VLA Converter Application

## Overview

This is a full-stack web application for converting videos into Vision-Language-Action (VLA) training data. The application provides a three-stage pipeline: video upload, synthetic data generation, and VLA conversion. Built with React frontend, Express.js backend, and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **File Uploads**: Multer for handling video file uploads (up to 500MB)
- **Development**: tsx for TypeScript execution in development
- **Production**: esbuild for server bundling

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations
- **File Storage**: Local filesystem for uploaded videos and generated outputs
- **Session Storage**: In-memory storage implementation (MemStorage class)

## Key Components

### Database Schema
- **videos**: Stores uploaded video metadata (filename, size, mimetype, path)
- **processing_jobs**: Tracks processing tasks with status, progress, and parameters
- **synthetic_variations**: Stores generated synthetic video variations
- **vla_outputs**: Stores final VLA training data outputs

### API Structure
- **POST /api/videos/upload**: Handle video file uploads with validation
- **Processing Jobs**: CRUD operations for tracking processing status
- **Variations**: Endpoints for synthetic data generation results
- **VLA Outputs**: Endpoints for final conversion results

### UI Components
- **VideoUploadSection**: Drag-and-drop interface with file validation
- **SyntheticDataSection**: Configuration for synthetic data generation
- **VlaConversionSection**: Settings for VLA format conversion
- **ProcessingQueue**: Real-time job status monitoring
- **WorkflowProgress**: Visual pipeline progress indicator

## Data Flow

1. **Upload Phase**: Users upload videos through drag-and-drop interface
2. **Validation**: Server validates file type, size, and stores metadata
3. **Synthetic Generation**: Users configure and trigger synthetic variation creation
4. **VLA Conversion**: Users specify VLA parameters and convert processed videos
5. **Real-time Updates**: Client polls server every 2 seconds for job status updates
6. **Download**: Users can download generated VLA training data

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **multer**: File upload handling
- **wouter**: Lightweight routing

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives (20+ components)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette functionality

### Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Development Environment
- **Hot Reloading**: Vite dev server with React Fast Refresh
- **Database**: Neon serverless PostgreSQL
- **File Storage**: Local uploads directory
- **Environment**: NODE_ENV=development

### Production Build
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles server to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push`
4. **Assets**: Static files served from build output

### Environment Configuration
- **DATABASE_URL**: Required for Drizzle connection
- **File Uploads**: Configurable upload directory
- **CORS**: Express CORS configuration for API access
- **Session Management**: Ready for Redis/database session store

### Scalability Considerations
- **Database**: Serverless PostgreSQL auto-scales
- **File Storage**: Can be migrated to cloud storage (S3, etc.)
- **Processing**: Job queue system ready for background workers
- **Caching**: TanStack Query provides client-side caching