# Step Into Storytime - AI-Powered Bedtime Stories

## Overview

Step Into Storytime is a web application that helps parents create personalized bedtime stories for their children using AI. Parents can generate stories where their child is the main character, choose tones and themes, save favorites, and build a repeatable bedtime ritual in under 2 minutes. The product is designed to be calm, simple, and focused on emotional connection at the end of the day.

## Problem Statement

Parents want bedtime to feel meaningful, but:
- They are tired and short on time
- They repeat the same books over and over
- Making up new stories feels hard at night
- Generic AI tools are not kid-safe or bedtime-appropriate

There is a gap between static books and overly complex apps. Parents need fast, safe, personalized stories designed specifically for bedtime.

## Product Vision

Make bedtime the most connected part of the day by helping parents create personalized, calming bedtime stories in under 2 minutes.

## Target Users

**Primary Users**
- Parents of children ages 2–8
- Busy evenings, limited mental energy
- Care deeply about routines and bonding

**Secondary Users**
- Parents with multiple children
- Grandparents and caregivers
- Families willing to pay for repeat nightly use

## Core Product Goals

**Product Goals**
- Generate high-quality personalized stories reliably
- Make the child the hero of each story
- Encourage repeat nightly or weekly use
- Keep the experience calm and low-stress

**Business Goals**
- Convert free users into paid subscribers
- Retain users through saved stories and characters
- Build a product families return to consistently

## Non-Goals

The product intentionally does not aim to:
- Be a social or community platform
- Allow public story feeds or comments
- Replace physical books
- Act as a learning curriculum
- Include heavy gamification or stimulation

## Core Features

### Story Creation
- Multi-step wizard collects: child's name, age, story tone (calming, adventurous, silly, educational), theme or template
- Optional custom characters (paid tiers)
- Simple, guided flow with minimal decisions

### Story Generation
- AI-generated stories using structured prompts
- Age-appropriate language
- Bedtime-safe pacing and tone
- No frightening or overly stimulating content

### Story Library
- Save generated stories
- View, re-read, and manage past stories
- Favorites system for bookmarking
- Pagination and filtering

### Custom Characters (Pro Feature)
- Create reusable characters with name and personality traits
- Characters persist across sessions
- Characters can be assigned to new stories

### Export & Sharing
- Download stories as formatted PDFs (paid feature)
- Layout optimized for reading aloud

### Authentication & Accounts
- User accounts with session-based authentication (Replit Auth)
- Accounts linked to subscription tiers
- Tier-based feature enforcement

## Subscription Tiers

| Tier | Stories | PDF Downloads | Custom Characters |
|------|---------|--------------|-------------------|
| Free | Limited | No | No |
| Premium | Higher limits | Yes | No |
| Family | Highest limits | Yes | Yes |

## User Flows

**First-Time User**
1. Lands on marketing page
2. Starts creating a story
3. Generates a personalized story
4. Prompted to sign up to save or export
5. Optional upgrade to paid tier

**Returning User**
1. Logs in
2. Sees story library
3. Creates a new story or re-reads an old one
4. Uses saved characters if available

## UX Principles

- Calm, bedtime-friendly design
- Simple language and clear actions
- Minimal cognitive load
- Mobile-first reading experience
- No dark patterns or pressure tactics

## Success Metrics

- Users complete stories
- Users return within 7 days
- Stories are saved and re-read
- Free users convert to paid tiers
- Subscribers retain month-over-month
- Revenue matters, but repeat usage matters more

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for fast development and optimized production builds

### Backend
- **Runtime**: Node.js with Express.js server
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express session with PostgreSQL storage
- **API Design**: RESTful endpoints with proper error handling and rate limiting

### Database
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
- Google Gemini (gemini-2.5-flash) via Replit AI Integrations for story creation
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

## External Dependencies

### Core Services
- **Google Gemini API**: Story generation using gemini-2.5-flash model (via Replit AI Integrations)
- **Stripe**: Payment processing and subscription management
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Auth**: Authentication and user management

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast server-side bundling
- **Drizzle Kit**: Database migrations and schema management
- **Prettier**: Code formatting

## Data Flow

1. Users authenticate via Replit Auth, creating session tokens
2. User inputs child details and preferences through multi-step wizard
3. Google Gemini API generates story content based on templates and parameters
4. Stories are saved to PostgreSQL with proper user association
5. Stories are fetched with tier-based filtering and pagination
6. Premium users can download stories as formatted PDFs

## Deployment

- **Hosting**: Replit with autoscale deployment
- **Environment**: Node.js 20 with PostgreSQL 16
- **Build Process**: Vite for client, ESBuild for server
- **Port Configuration**: Internal port 5000, external port 80

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `AI_INTEGRATIONS_GEMINI_API_KEY`: Gemini API access (via Replit AI Integrations)
- `AI_INTEGRATIONS_GEMINI_BASE_URL`: Gemini base URL (via Replit AI Integrations)
- `STRIPE_SECRET_KEY`: Stripe payment processing
- `REPLIT_DOMAINS`: Allowed authentication domains

### Security
- Content Security Policy headers
- XSS protection and MIME type validation
- Input sanitization and validation
- Rate limiting on API endpoints
- CSRF token protection

## Future Considerations (Not Committed)

- Text-to-speech narration
- Multiple child profiles
- Story collections or themes
- Night mode UI
- Weekly story prompts

## Changelog

```
- June 17, 2025: Initial setup
- June 17, 2025: Custom Characters Feature Implementation
  * Added database schema for custom characters with personality traits
  * Created CRUD API endpoints with tier-based access control
  * Built character management interface for Storytime Pro users
  * Integrated custom characters into AI story generation
  * Added character selection component for story wizard
- February 8, 2026: Switched from OpenAI to Google Gemini
  * Replaced OpenAI GPT-4o with Google Gemini 2.5 Flash via Replit AI Integrations
  * No API key needed - uses Replit's built-in Gemini access
  * All story generation features preserved (caching, rate limiting, templates, custom characters)
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
