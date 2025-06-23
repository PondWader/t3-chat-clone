# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

T3 Chat Clone is an open source AI chat application built for snappy, smooth performance. It features client-side caching, device syncing, chat sharing, chat branching, and more. The application is built using Bun, Preact, and a custom sync engine.

## Development Commands

### Core Commands
- `bun i` - Install dependencies
- `bun run server:setup` - Interactive setup for Discord OAuth2 and API keys
- `bun run server:start` - Start the development server (listens on port 3000)

### Environment Setup
Set `NODE_ENV=development` to enable development mode for the web app.

### Environment Variables
- `PORT` - Web server port (default: 3000)
- `DB_URL` - Database URL (default: `sqlite://database.sqlite`)
- `CDN_DIRECTORY` - User uploads directory (default: `./user_content`)

## Architecture

This is a monorepo with 4 main packages in the `./packages` directory:

### Package Structure
- **`packages/app`** - The Preact web application frontend
- **`packages/db`** - Sync engine with two parts:
  - `./server` - Database connections and sync logic
  - `./client` - WebSocket client and IndexedDB sync engine
- **`packages/server`** - Application entrypoint, web server, authentication, CDN handling
- **`packages/stores`** - Sync engine stores used by both client and server

### Key Technologies
- **Runtime**: Bun (JavaScript/TypeScript runtime)
- **Frontend**: Preact with preact-iso for routing
- **Styling**: Tailwind CSS v4 with @tailwindcss/typography
- **Database**: SQLite (default) with custom sync engine
- **Authentication**: JWT with Discord OAuth2
- **AI Integration**: Vercel AI SDK with Groq and OpenRouter providers
- **WebSockets**: Custom implementation for real-time sync

### Database Architecture
The application uses a custom sync engine that:
- Stores data server-side in SQLite
- Syncs with client-side IndexedDB
- Supports real-time updates via WebSockets
- Handles offline-first functionality

### Authentication Flow
- Discord OAuth2 for user authentication
- Device syncing without accounts via QR codes/links
- JWT tokens for session management

## Key Files
- `packages/server/main.ts` - Main server entry point with routing
- `packages/server/setup.ts` - Interactive setup script
- `packages/server/instances.ts` - Shared service instances
- `packages/db/server/index.ts` - Database server logic
- `packages/db/client/index.ts` - Client sync engine
- `packages/app/src/index.tsx` - Frontend entry point

## Development Notes

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Uses ES2020 target with nodenext module resolution
- Project references for proper monorepo TypeScript support

### Build System
- Uses Bun's built-in bundler with Tailwind CSS plugin
- Static serving configured in `bunfig.toml`
- No separate build step required for development

### Database
- SQLite database file created at project root (`database.sqlite`)
- Custom drivers in `packages/db/server/drivers/`
- Sync events defined in `packages/db/shared/events.ts`