# EDTR - Modern Text Editor

## Overview

EDTR is a modern, compact text editor application built with React, TypeScript, and Express. It provides a distraction-free writing experience with rich text formatting capabilities, auto-save functionality, and dark/light theme support. The application features a clean, professional interface with a maximum width of 1200px, optimized for focused writing without file tree or complex navigation.

## System Architecture

The application follows a monorepo structure with clear separation between client and server components:

- **Frontend**: React + TypeScript + Vite for the client application
- **Backend**: Express.js + TypeScript for the REST API server
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **UI Framework**: shadcn/ui components with Tailwind CSS for styling
- **Rich Text Editor**: TipTap editor with extensible formatting capabilities

## Key Components

### Frontend Architecture
- **React SPA**: Single-page application using Wouter for client-side routing
- **Component System**: shadcn/ui component library providing consistent, accessible UI components
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **Rich Text Editing**: TipTap editor with extensions for formatting, alignment, colors, and typography
- **Theme System**: Custom theme provider supporting light/dark modes with system preference detection

### Backend Architecture
- **Express Server**: RESTful API server with TypeScript support
- **Storage Layer**: Abstracted storage interface with both in-memory and database implementations
- **Middleware**: Request logging, JSON parsing, and error handling
- **Development Setup**: Vite integration for hot module replacement during development

### Database Schema
The application uses a simple document-based schema:
```typescript
documents {
  id: serial (primary key)
  title: text (default: "Untitled Document")
  content: text (rich HTML content)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### API Endpoints
- `GET /api/documents` - Retrieve all documents
- `GET /api/documents/:id` - Get specific document by ID
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update existing document
- `DELETE /api/documents/:id` - Delete document

## Data Flow

1. **Document Creation**: Users create documents through the editor interface, which sends POST requests to the backend
2. **Auto-save**: The editor automatically saves changes every 2 seconds using a debounced update mechanism
3. **Real-time Editing**: TipTap editor provides rich text editing with immediate visual feedback
4. **State Synchronization**: React Query manages server state caching and synchronization
5. **Theme Persistence**: User theme preferences are stored in localStorage and applied on application load

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with hooks and modern patterns
- **Express**: Backend web server framework
- **TypeScript**: Type safety across the entire application
- **Vite**: Build tool and development server

### Database & ORM
- **Drizzle ORM**: Type-safe SQL database toolkit
- **@neondatabase/serverless**: PostgreSQL database driver
- **Drizzle Kit**: Database migration and schema management

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible UI primitives
- **Lucide React**: Icon library with consistent styling
- **Class Variance Authority**: Utility for creating variant-based component APIs

### Rich Text Editing
- **TipTap**: Modular rich text editor framework
- **TipTap Extensions**: Color, font family, text alignment, underline, and text style extensions

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit integration for development

## Deployment Strategy

The application is configured for deployment on Replit's autoscale infrastructure:

### Build Process
1. **Client Build**: Vite builds the React application to `dist/public`
2. **Server Build**: esbuild bundles the Express server to `dist/index.js`
3. **Database Setup**: Drizzle migrations are applied to PostgreSQL database

### Environment Configuration
- **Development**: Uses tsx for hot reloading and Vite dev server
- **Production**: Serves static files from Express with compiled bundles
- **Database**: PostgreSQL connection via DATABASE_URL environment variable

### Deployment Configuration
- **Port**: Application runs on port 5000 internally, exposed as port 80
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Database**: PostgreSQL 16 module enabled in Replit environment

## Changelog

```
Changelog:
- June 19, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```