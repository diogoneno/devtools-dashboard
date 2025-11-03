# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevTools Dashboard - Enterprise Edition: A comprehensive web application with 60+ tools spanning developer utilities, AI engineering, misinformation research, e-portfolio management, cyber resilience monitoring, and AI safety testing.

## Architecture

### Monorepo Structure
- **Frontend**: React 18 + Vite SPA (port 5173)
- **Backend**: Flask API server (port 5000)
- **Microservices**: 14 Node.js/Express services (ports 5001-5014)
  - Misinformation Lab: 4 services (ports 5001-5004)
  - E-Portfolio: 2 services (ports 5005-5006)
  - Cyber Resilience: 4 services (ports 5007-5010)
  - AI Safety: 4 services (ports 5011-5014)
- **Databases**: SQLite for offline-first OLTP storage (`misinfo.db`, `portfolio.db`, `resilience.db`, `ai-safety.db`)

### Frontend Architecture
- **Routing**: React Router v6 with component-based routes in `src/App.jsx`
- **Component Organization**: Tools organized by category in `src/components/`:
  - `DeveloperTools/` - JSON formatter, Base64, Regex tester, JWT decoder, etc.
  - `ProductivityTools/` - Calculator, unit converter, timer, password generator
  - `AITools/` - Token counter, prompt builder, model cost calculator
  - `MisinfoTools/` - News ingest, fact-checker, propagation graphs
  - `ResilienceTools/` - Backup monitoring, ransomware detection, compliance
  - `AISafetyTools/` - Prompt safety, red team harness, robustness testing
  - `RedTeamTools/` - DNS lookup, subdomain finder, security headers checker
- **State Management**: Zustand for global state
- **HTTP Client**: Axios for API calls
- **Styling**: Custom CSS (no framework), shared `ToolLayout.css` for consistency
- **Charts**: vis-network for graph visualizations

### Backend Architecture
- **Flask API** (`backend/app.py`): Main API server for weather, currency, and basic utilities
- **Microservices Pattern**: Each service is self-contained with its own Express server and SQLite database
- **Database Access**: better-sqlite3 for synchronous SQLite operations

## Common Commands

### Starting the Application
```bash
# Start all services (recommended)
./start-all.sh

# Start individual services manually
cd frontend && npm run dev                    # Frontend (port 5173)
cd backend && python3 app.py                  # Flask backend (port 5000)
cd services/misinfo && npm run dev            # All 4 misinfo services
cd services/portfolio && npm run dev          # Both portfolio services
cd services/resilience && npm run dev         # All 4 resilience services
cd services/ai-safety && npm run dev          # All 4 AI safety services
```

### Development Workflow
```bash
# Frontend
cd frontend
npm install                                   # Install dependencies
npm run dev                                   # Start dev server with HMR
npm run build                                 # Production build
npm run preview                               # Preview production build
npm run lint                                  # Run ESLint

# Backend (Flask)
cd backend
pip install -r requirements.txt               # Install dependencies
python3 app.py                                # Start Flask server

# Microservices
cd services/<service-name>
npm install                                   # Install dependencies
npm run init-db                               # Initialize SQLite database
npm run dev                                   # Start all service APIs with concurrently
```

### Database Initialization
```bash
# Initialize databases (run once or after schema changes)
cd services/misinfo && npm run init-db
cd services/portfolio && npm run init-db
cd services/resilience && npm run init-db
cd services/ai-safety && npm run init-db
```

### Testing Services
```bash
# Health check endpoints
curl http://localhost:5000/api/health         # Flask API
curl http://localhost:5007/health             # Backup API
curl http://localhost:5011/health             # Prompt Monitor API
curl http://localhost:5012/health             # Red Team API
```

## Development Guidelines

### Adding a New Tool Component
1. Create component in appropriate category folder (e.g., `src/components/DeveloperTools/MyTool.jsx`)
2. Import in `src/App.jsx`
3. Add route in `<Routes>` section of `App.jsx`
4. Add navigation link in `src/components/Layout/Layout.jsx`
5. Use shared `ToolLayout.css` for consistent styling

### Creating a New Microservice
1. Create service directory under `services/<service-name>/`
2. Add `package.json` with Express and better-sqlite3
3. Create `schema.sql` for database schema
4. Create `init-db.js` to initialize SQLite database
5. Implement REST endpoints in `<api-name>/server.js`
6. Add startup script in `package.json`
7. Update `start-all.sh` to include new service

### Frontend API Calls
- Environment variables: Use `VITE_` prefix for client-exposed vars
- Development: APIs accessed directly via `http://localhost:5000-5014`
- Production: Configure `.env.production` with reverse proxy paths
- API client: Use Axios instances configured in components

### Database Schema Changes
1. Update `schema.sql` in the service directory
2. Run `npm run init-db` to recreate database (dev only)
3. For production, write migration scripts

## Key Files

### Frontend
- `src/App.jsx` - Main routing and component imports
- `src/components/Layout/Layout.jsx` - Navigation sidebar and layout
- `vite.config.js` - Vite configuration (ports, build settings)
- `package.json` - Dependencies and scripts

### Backend Services
- `backend/app.py` - Flask API server with weather, currency endpoints
- `services/*/package.json` - Service dependencies and startup scripts
- `services/*/schema.sql` - Database schemas
- `services/*/init-db.js` - Database initialization scripts
- `services/*/<api-name>/server.js` - Express API servers

### Infrastructure
- `start-all.sh` - Orchestrates startup of all 15 services
- `deploy-production.sh` - Production deployment script
- `.gitignore` - Excludes node_modules, .env, *.db files

## Environment Configuration

### Frontend (.env files)
- `.env.example` - Development defaults (localhost:5000-5014)
- `.env.production` - Production API URLs (customize for deployment)
- Variables prefixed with `VITE_` are exposed to client code

### Backend (.env files)
- `backend/.env` - Optional API keys (OPENWEATHER_API_KEY, etc.)
- Most tools work with mock data when API keys are absent

### Microservices
- Each service can have `.env` for configuration
- GitHub mode for portfolio: `GITHUB_MODE=single-repo` or `org-wide`

## Port Allocation

- 5000: Flask Backend
- 5001-5004: Misinformation Lab (ingest, facts, nlp, forensics)
- 5005-5006: E-Portfolio (GitHub indexer, portfolio API)
- 5007-5010: Cyber Resilience (backup, ransomware, logs, compliance)
- 5011-5014: AI Safety (prompt monitor, red team, robustness, tool gate)
- 5173: Frontend (Vite dev server)

## Deployment

### Production Build
```bash
cd frontend
npm run build                                 # Creates frontend/dist/
```

### Deployment Script
```bash
./deploy-production.sh                        # Automated production deployment
```

- Builds frontend to `dist/`
- Configure reverse proxy (nginx/Apache) to serve static files
- Point API routes to backend services (ports 5000-5014)
- Use PM2 or systemd for service management

## Security & Ethics

- **Misinformation Lab**: Research only, public data, respects robots.txt, offline-first
- **Red Team Tools**: Only test systems you own or have explicit authorization
- **AI Safety**: Defensive research, authorized penetration testing, CTF challenges
- Never use security tools against third-party services without consent
