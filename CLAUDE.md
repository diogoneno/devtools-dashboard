# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevTools Dashboard - Enterprise Edition: A comprehensive web application with 60+ tools spanning developer utilities, AI engineering, misinformation research, e-portfolio management, cyber resilience monitoring, and AI safety testing.

## Architecture

### Technology Stack
- **Frontend**: React 19.1.1 + Vite 7.1.7 + React Router 7.9.5 (requires Node.js 20+)
- **Backend**: Flask 3.0.0 + Python 3.8+
- **Microservices**: Node.js 20+ + Express 4.x
- **Database**: better-sqlite3 11.x (synchronous SQLite operations)
- **State Management**: Zustand 5.0.8
- **HTTP Client**: Axios 1.13.1
- **Process Manager**: PM2 (production)
- **Reverse Proxy**: nginx (production)

### Monorepo Structure
- **Frontend**: React 19 + Vite 7 SPA (port 5173)
- **Backend**: Flask API server (port 5000)
- **Microservices**: 14 Node.js/Express services (ports 5001-5014)
  - Misinformation Lab: 4 services (ports 5001-5004)
  - E-Portfolio: 2 services (ports 5005-5006)
  - Cyber Resilience: 4 services (ports 5007-5010)
  - AI Safety: 4 services (ports 5011-5014)
- **Databases**: SQLite for offline-first OLTP storage (`misinfo.db`, `portfolio.db`, `resilience.db`, `ai-safety.db`)

### Frontend Architecture (60+ Components)
- **Routing**: React Router v7 with component-based routes in `src/App.jsx`
- **Component Organization**: 60+ tools organized by category in `src/components/`:
  - `DeveloperTools/` - JSON formatter, Base64, Regex tester, JWT decoder, Hash generator, QR code
  - `ProductivityTools/` - Calculator, unit converter, timer, password generator
  - `DataTools/` - CSV converter, chart builder, UUID generator, timestamp converter
  - `CreativeTools/` - Image placeholder, ASCII art, random user generator
  - `APITools/` - Weather, currency converter, GitHub stats, news feed
  - `RedTeamTools/` - DNS lookup, subdomain finder, security headers, SQL/XSS testers
  - `AITools/` - Token counter, prompt builder, model cost calculator (7 tools)
  - `MisinfoTools/` - News ingest, fact-checker, propagation graphs (7 tools)
  - `ResilienceTools/` - Backup monitoring, ransomware detection, compliance (3 tools)
  - `AISafetyTools/` - Prompt safety, red team harness, robustness, tool gate (4 tools)
  - `apps/portfolio/` - E-Portfolio application (module discovery, outcomes tracking)
- **State Management**: Zustand for global state (minimal usage)
- **HTTP Client**: Axios for API calls
- **Styling**: Custom CSS (no framework), shared `ToolLayout.css` for consistency
- **Charts**: vis-network 10.x for graph visualizations
- **Client-side SQL**: DuckDB 1.4.1 for local queries

### Backend Architecture
- **Flask API** (`backend/app.py`): Main API server for weather, currency, GitHub stats (proxies external APIs)
- **Microservices Pattern**: Each service is self-contained with its own Express server and SQLite database
- **Database Access**: better-sqlite3 with **singleton connection pattern** (FIXED: prevents EMFILE connection leaks)
- **Security Middleware**: Shared security module (`services/shared/security-middleware.js`) provides:
  - Rate limiting (100 req/15min general, 30 req/15min writes)
  - CORS with configurable allowed origins
  - Security headers (X-Frame-Options, CSP, HSTS, etc.)
  - Body size limits (1MB max)

### Security Improvements (2025-11)
**CRITICAL FIXES APPLIED:**
1. **Database Connection Leak Fixed** - All 4 service groups now use singleton pattern instead of creating new connections per request. Prevents EMFILE errors at ~70 concurrent requests.
2. **Rate Limiting Added** - All 14 microservices + Flask backend now have rate limiting to prevent DoS attacks.
3. **Security Headers Added** - All services now send X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, HSTS, and CSP headers.
4. **CORS Hardened** - Replaced wide-open CORS with configurable allowed origins (defaults to localhost for dev).
5. **Flask Threading Enabled** - Flask dev server now runs with `threaded=True` for better concurrency.

**HIGH PRIORITY FIXES APPLIED (2025-11-05):**
6. **Structured Logging with Winston** - All 14 microservices now use Winston for structured JSON logging with automatic credential redaction (tokens, passwords, API keys). Logs include request tracing, error stack traces, and contextual metadata.
7. **Enhanced Health Checks** - All `/health` endpoints now verify database connectivity with `SELECT 1` queries and return 503 status on failure.
8. **Explicit Transactions** - All write operations (POST/PUT/DELETE/PATCH) now use explicit `db.transaction()` to prevent race conditions and ensure atomicity.

**Files Modified:**
- `services/portfolio/portfolio-api/init-db.js` - Singleton pattern
- `services/resilience/backup-api/init-db.js` - Singleton pattern
- `services/ai-safety/shared/init-db.js` - Singleton pattern
- `services/misinfo/init-db.js` - Singleton pattern
- `services/shared/security-middleware.js` - NEW: Shared security middleware
- `services/shared/logger.js` - NEW: Winston-based structured logging with credential sanitization
- All 14 `server.js` files - Security middleware, structured logging, enhanced health checks, explicit transactions
- `backend/app.py` - Security headers, hardened CORS, threading enabled

**Remaining Known Issues** (see `docs/API-SECURITY-AUDIT.md` for full details):
- No authentication/authorization (all endpoints publicly accessible)
- Event loop blocking (better-sqlite3 is synchronous)
- No input validation on POST endpoints
- No user context tracking (missing user_id columns)

### Database Architecture
**4 SQLite databases** (offline-first OLTP):
1. **`misinfo.db`** - News items, claims, fact-checks, NLP scores, propagation graphs
2. **`portfolio.db`** - GitHub modules, artifacts, reflections, outcomes, feedback
3. **`resilience.db`** - Backups, restores, canaries, logs, compliance evidence, DR scenarios
4. **`ai-safety.db`** - Prompt scores, attack recipes, robustness tests, tool access policies

**Pattern**: Each service group has `schema.sql` and `init-db.js` for database initialization.

## Common Commands

### Prerequisites
- **Node.js 20+** (required by Vite 7 and React Router 7)
- Python 3.8+
- npm or yarn

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
npm run lint                                  # Run ESLint with React hooks plugin

# Backend (Flask)
cd backend
pip install -r requirements.txt               # Install dependencies
python3 app.py                                # Start Flask server

# Microservices (per service group)
cd services/<service-name>
npm install                                   # Install dependencies
npm run init-db                               # Initialize SQLite database
npm run dev                                   # Start all service APIs with concurrently
npm test                                      # Syntax check on server files
```

### Database Initialization
```bash
# Initialize databases (run once or after schema changes)
cd services/misinfo && npm run init-db
cd services/portfolio && npm run init-db
cd services/resilience && npm run init-db
cd services/ai-safety && npm run init-db
```

### Testing
```bash
# Integration tests (requires all services running)
./scripts/test-integration.sh init           # Initialize test databases
./scripts/test-integration.sh run            # Run full test suite (23 tests)

# Health checks
./scripts/health-check.sh                    # Test all 15 services

# Check port availability
./scripts/check-ports.sh                     # Verify ports 5000-5014, 5173 are free

# Individual service health checks
curl http://localhost:5000/health            # Flask API
curl http://localhost:5007/health            # Backup API
curl http://localhost:5011/health            # Prompt Monitor API
```

### CI/CD
See `docs/CI-CD.md` for complete pipeline documentation.
- Automatic testing on push to main
- 5-stage pipeline with parallel microservice testing
- Automatic deployment with rollback on failure
- Health checks validate deployments

## Development Guidelines

### Code Documentation Standards
All JavaScript/Node.js code must follow JSDoc standards in `docs/JSDOC-STYLE-GUIDE.md`:
- Document the **WHY**, not just the WHAT
- Include realistic examples that can be copy-pasted
- Document all error conditions with `@throws`
- Performance notes for slow operations
- API limitations (rate limits, quotas)
- See `services/*/init-db.js` for reference implementations

### Adding a New Tool Component
1. Create component in appropriate category folder (e.g., `src/components/DeveloperTools/MyTool.jsx`)
2. Import in `src/App.jsx`
3. Add route in `<Routes>` section of `App.jsx`
4. Add navigation link in `src/components/Layout/Layout.jsx`
5. Use shared `ToolLayout.css` for consistent styling
6. Document all exported functions with JSDoc

### Creating a New Microservice
1. Create service directory under `services/<service-name>/`
2. Add `package.json` with Express and better-sqlite3
3. Create `schema.sql` for database schema
4. Create `init-db.js` to initialize SQLite database (with JSDoc following style guide)
5. Implement REST endpoints in `<api-name>/server.js`
6. Add health check endpoint: `app.get('/health', ...)`
7. Add startup script in `package.json`
8. Update `start-all.sh` to include new service

### Frontend API Calls
- Environment variables: Use `VITE_` prefix for client-exposed vars
- Development: APIs accessed directly via `http://localhost:5000-5014`
- Production: Configure `.env.production` with reverse proxy paths
- API client: Use Axios instances configured in components

### Database Schema Changes
1. Update `schema.sql` in the service directory
2. Run `npm run init-db` to recreate database (dev only)
3. For production, write migration scripts (no automatic migrations)

### API Endpoint Conventions
All microservices follow this pattern:
```javascript
// Health check (required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'service-name' });
});

// REST endpoints under /api/
app.get('/api/resource', ...)
app.post('/api/resource', ...)

// Error handling pattern
try {
  // Database operation
  res.json({ success: true, data });
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: error.message });
}
```

## Key Files

### Frontend
- `src/App.jsx` - Main routing and component imports (183 lines, 60+ routes)
- `src/components/Layout/Layout.jsx` - Navigation sidebar and layout
- `vite.config.js` - Vite configuration (ports, build settings)
- `package.json` - Dependencies and scripts

### Backend Services
- `backend/app.py` - Flask API server with weather, currency endpoints
- `services/*/package.json` - Service dependencies and startup scripts
- `services/*/schema.sql` - Database schemas
- `services/*/init-db.js` - Database initialization scripts (see JSDoc style guide)
- `services/*/<api-name>/server.js` - Express API servers

### Infrastructure
- `start-all.sh` - Orchestrates startup of all 15 services (auto-init DBs, health checks)
- `deploy-production.sh` - Production deployment script (generates PM2 config)
- `.github/workflows/deploy.yml` - CI/CD pipeline (5 jobs, automatic rollback)
- `scripts/test-integration.sh` - Integration test suite (23 tests)
- `scripts/health-check.sh` - Health check script (15 services)
- `scripts/check-ports.sh` - Port availability checker
- `.gitignore` - Excludes node_modules, .env, *.db files

### Documentation
- `docs/JSDOC-STYLE-GUIDE.md` - **REQUIRED reading** for all contributors
- `docs/CI-CD.md` - GitHub Actions pipeline with automatic rollback (600+ lines)
- `docs/DEPLOYMENT.md` - Production deployment procedures with nginx setup

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
- Port configuration uses env vars with defaults (e.g., `PORT || 5001`)

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

**What it does:**
1. Install all frontend/backend/service dependencies
2. Build frontend (uses `.env.production`)
3. Initialize databases (if not exist)
4. Create PM2 `ecosystem.config.js` (15 processes)
5. Check port availability
6. Start all services with PM2
7. Run health checks

### PM2 Process Management
Production uses PM2 with 15 processes:
- `flask-backend` (port 5000)
- `misinfo-*` services (4 processes, ports 5001-5004)
- `portfolio-*` services (2 processes, ports 5005-5006)
- `resilience-*` services (4 processes, ports 5007-5010)
- `ai-safety-*` services (4 processes, ports 5011-5014)

### Nginx Reverse Proxy
Configure reverse proxy (nginx/Apache) to:
- Serve static files from `frontend/dist/`
- Proxy `/api/` to Flask backend (port 5000)
- Proxy `/api/misinfo/*` to ports 5001-5004
- Proxy `/api/portfolio/*` to ports 5005-5006
- Proxy `/api/resilience/*` to ports 5007-5010
- Proxy `/api/ai-safety/*` to ports 5011-5014

See `config/nginx/devtools.conf` for production nginx configuration.

## Troubleshooting

### Port Conflicts
```bash
./scripts/check-ports.sh                     # Check if ports are available
lsof -i :5000                                # Check what's using a port
```

### Service Not Starting
```bash
pm2 logs <service-name>                      # View PM2 logs
pm2 status                                   # Check service status
./scripts/health-check.sh                    # Test health endpoints
```

### Database Issues
```bash
cd services/<service-group>
npm run init-db                              # Reinitialize database
ls -la ../../data/*.db                       # Check database files exist
```

### Frontend Build Errors
- Ensure Node.js 20+ is installed (`node --version`)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check for ESLint errors: `npm run lint`

## Security & Ethics

- **Misinformation Lab**: Research only, public data, respects robots.txt, offline-first
- **Red Team Tools**: Only test systems you own or have explicit authorization
- **AI Safety**: Defensive research, authorized penetration testing, CTF challenges
- Never use security tools against third-party services without consent
