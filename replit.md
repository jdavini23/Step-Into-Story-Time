# Step Into Storytime - AI-Powered Bedtime Stories

## Overview

Step Into Storytime is a full-stack web application that creates personalized bedtime stories for children using AI. The platform allows parents to generate custom stories featuring their child as the main character, with various themes, tones, and templates to choose from.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express session with PostgreSQL storage
- **API Design**: RESTful endpoints with proper error handling and rate limiting

### Database Layer
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Connection**: Connection pooling for optimal performance

## Key Components

### Authentication System
- Replit Auth integration for seamless user authentication
- Session-based authentication with secure session storage
- User profile management with Stripe customer integration
- CSRF protection for form submissions

### Story Generation Engine
- OpenAI GPT-4o integration for story creation
- Template-based story structure with customizable parameters
- Rate limiting and usage tracking per user tier
- Caching system for improved performance

### Subscription Management
- Three-tier system: Free, Premium, and Family
- Stripe integration for payment processing
- Usage tracking and tier-based feature restrictions
- Webhook handling for subscription status updates

### Content Management
- Story library with CRUD operations
- Favorites system for story bookmarking
- PDF generation for story downloads (premium feature)
- Content sanitization and validation
- Custom characters system for personalized storytelling (Pro feature)

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, creating session tokens
2. **Story Creation**: User inputs child details and preferences through multi-step wizard
3. **AI Generation**: OpenAI API generates story content based on templates and parameters
4. **Storage**: Stories are saved to PostgreSQL with proper user association
5. **Retrieval**: Stories are fetched with tier-based filtering and pagination
6. **Export**: Premium users can download stories as formatted PDFs

## External Dependencies

### Core Services
- **OpenAI API**: Story generation using GPT-4o model
- **Stripe**: Payment processing and subscription management
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Auth**: Authentication and user management

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast server-side bundling
- **Drizzle Kit**: Database migrations and schema management
- **Prettier**: Code formatting

## Deployment Strategy

### Platform
- **Hosting**: Replit with autoscale deployment
- **Environment**: Node.js 20 with PostgreSQL 16
- **Build Process**: Vite for client, ESBuild for server
- **Port Configuration**: Internal port 5000, external port 80

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `OPENAI_API_KEY`: OpenAI API access
- `STRIPE_SECRET_KEY`: Stripe payment processing
- `REPLIT_DOMAINS`: Allowed authentication domains

### Security Features
- Content Security Policy headers
- XSS protection and MIME type validation
- Input sanitization and validation
- Rate limiting on API endpoints
- CSRF token protection

## Changelog
```
Changelog:
- June 17, 2025. Initial setup
- June 17, 2025. Custom Characters Feature Implementation:
  * Added database schema for custom characters with personality traits
  * Created CRUD API endpoints with tier-based access control
  * Built character management interface for Storytime Pro users
  * Integrated custom characters into AI story generation
  * Added character selection component for story wizard
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```