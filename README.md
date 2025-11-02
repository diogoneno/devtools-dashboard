# DevTools Dashboard - Enterprise Edition

A comprehensive web application with **60+ tools** for developers, security researchers, AI engineers, and enterprise teams. Features include developer utilities, productivity tools, misinformation research, e-portfolio management, cyber resilience monitoring, and AI safety testing.

## 🚀 Live Demo

**Frontend:** http://localhost:5173
**Network Access:** http://192.168.0.8:5173

## 📋 Features

### Core Developer Tools (43 tools)
- JSON Formatter, Base64 Encoder/Decoder, Regex Tester
- JWT Decoder, Hash Generator, QR Code Generator
- Calculator, Unit Converter, Timer/Stopwatch
- Chart Builder, CSV Converter, UUID Generator
- Weather API, Currency Converter, GitHub Stats
- DNS Lookup, HTTP Headers Analyzer, Security Checker
- SQL Injection Tester, XSS Tester, SSL/TLS Checker

### AI Engineering Tools (7 tools)
- Token Counter (GPT-4, Claude support)
- Prompt Template Builder
- Model Cost Calculator (13 LLM models)
- JSON Schema Generator
- System Prompt Builder
- Few-Shot Learning Manager
- Model Parameter Calculator

### 🛡️ Misinformation Lab (7 tools)
Research platform for studying misinformation using public data:
- Open News Ingest (GDELT, RSS feeds)
- Claim & Fact-Check Explorer
- Propagation & Community Graphs
- Stance & Toxicity Analysis
- Media Forensics Workbench
- Source Controls & Policies
- Reproducible Dataset Builder

**Ethics:** Public data only, offline-first, respects robots.txt, transparent provenance

### 🎓 E-Portfolio System (2 tools)
Academic portfolio with GitHub auto-discovery:
- Module Discovery (single-repo & org-wide modes)
- Outcomes & Evidence Tracking
- Reflections & Feedback Management
- Offline-first after sync

### 🛡️ Cyber Resilience & Data Protection (3 tools)
Enterprise backup and security monitoring:
- **Backup Resilience Center** - KPIs, success rates, immutability coverage
- **Ransomware Early Warning** - Canary monitoring, entropy detection
- **Compliance Evidence Packs** - ISO 27001, NIST 800-53 mappings

### 🔒 AI Safety & LLM Security (4 tools)
Defensive security for AI systems:
- **Prompt Safety Monitor** - Injection/jailbreak detection
- **LLM Red Team Harness** - Safe adversarial testing
- **Model Robustness Lab** - Text perturbation testing
- **Agent Tool Access Gate** - Tool capability controls

## 🏗️ Architecture

### Frontend
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **Styling:** Custom CSS (no frameworks)
- **Charts:** vis-network
- **HTTP:** Axios

### Backend Services (14 microservices)

**Core Backend (Flask):**
- Port 5000 - Main API server

**Misinformation Lab (Node.js/Express):**
- Port 5001 - News Ingest API (GDELT, RSS)
- Port 5002 - Fact Check API
- Port 5003 - NLP Analysis API
- Port 5004 - Media Forensics API

**E-Portfolio (Node.js/Express):**
- Port 5005 - GitHub Indexer
- Port 5006 - Portfolio API

**Cyber Resilience (Node.js/Express):**
- Port 5007 - Backup API
- Port 5008 - Ransomware Detection API
- Port 5009 - Logs & Alerts API
- Port 5010 - Compliance API

**AI Safety (Node.js/Express):**
- Port 5011 - Prompt Monitor API
- Port 5012 - Red Team API
- Port 5013 - Robustness Testing API
- Port 5014 - Tool Access Gate API

### Databases
- **SQLite:** Offline-first OLTP storage
  - `misinfo.db` - News items, claims, fact-checks
  - `portfolio.db` - Modules, artifacts, reflections
  - `resilience.db` - Backups, restores, canaries, logs
  - `ai-safety.db` - Prompt scores, attacks, robustness tests

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd 1stproject
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

3. **Install Backend Dependencies**
```bash
# Flask backend
cd backend
pip install -r requirements.txt

# Microservices
cd ../services/misinfo && npm install
cd ../services/portfolio && npm install
cd ../services/resilience && npm install
cd ../services/ai-safety && npm install
```

4. **Initialize Databases**
```bash
cd services/misinfo && npm run init-db
cd ../portfolio && npm run init-db
cd ../resilience && npm run init-db
cd ../ai-safety && npm run init-db
```

5. **Configure Environment Variables** (optional)
```bash
# Copy example files
cp backend/.env.example backend/.env
cp services/misinfo/.env.example services/misinfo/.env
cp services/portfolio/.env.example services/portfolio/.env

# Edit with your API keys (optional for most features)
```

### Running the Application

**Option 1: Start Everything (Recommended)**
```bash
chmod +x start-all.sh
./start-all.sh
```

**Option 2: Start Services Manually**

```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Flask Backend
cd backend && python3 app.py

# Terminal 3: Misinformation Lab
cd services/misinfo
npm run dev

# Terminal 4: E-Portfolio
cd services/portfolio
npm run dev

# Terminal 5: Cyber Resilience
cd services/resilience
npm run dev

# Terminal 6: AI Safety
cd services/ai-safety
npm run dev
```

**Access the application:**
- Local: http://localhost:5173
- Network: http://<your-ip>:5173

## 📦 Project Structure

```
1stproject/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # Tool components by category
│   │   │   ├── DeveloperTools/
│   │   │   ├── ProductivityTools/
│   │   │   ├── AITools/
│   │   │   ├── RedTeamTools/
│   │   │   ├── MisinfoTools/
│   │   │   ├── ResilienceTools/
│   │   │   └── AISafetyTools/
│   │   ├── apps/             # Portfolio app
│   │   ├── Layout/           # Navigation & layout
│   │   └── App.jsx           # Main routes
│   └── package.json
├── backend/                  # Flask API server
│   ├── app.py
│   └── requirements.txt
├── services/                 # Microservices
│   ├── misinfo/             # Misinformation Lab (4 APIs)
│   ├── portfolio/           # E-Portfolio (2 APIs)
│   ├── resilience/          # Cyber Resilience (4 APIs)
│   └── ai-safety/           # AI Safety (4 APIs)
├── data/                    # SQLite databases
│   ├── misinfo.db
│   ├── portfolio.db
│   ├── resilience.db
│   └── ai-safety.db
├── docs/                    # Documentation
└── start-all.sh             # Startup script
```

## 🔑 Environment Variables

### Backend (.env)
```
OPENWEATHER_API_KEY=your_key_here  # Optional - for Weather tool
```

### Misinformation Lab (.env.misinfo)
```
FACTCHECK_API_KEY=          # Optional - falls back to mock data
PERSPECTIVE_API_KEY=        # Optional - uses keyword detection
```

### E-Portfolio (.env.portfolio)
```
GITHUB_MODE=single-repo     # or org-wide
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo
GITHUB_TOKEN=               # Optional for public repos
```

## 🛠️ Development

### Adding a New Tool

1. Create component in appropriate category folder
2. Import in `App.jsx`
3. Add route in `App.jsx`
4. Add navigation link in `Layout.jsx`
5. Use shared `ToolLayout.css` for styling

### Creating a New Microservice

1. Create service directory under `services/`
2. Add `package.json` with Express
3. Create database schema in `schema.sql`
4. Implement REST endpoints in `server.js`
5. Add init script and startup command

## 📊 API Documentation

### Backup API (Port 5007)
- `GET /api/kpis` - Get backup KPIs
- `POST /api/ingest/jobs` - Ingest backup jobs
- `GET /api/backups` - List backups
- `POST /api/dr/run` - Run DR simulation

### Prompt Monitor API (Port 5011)
- `POST /api/score` - Score prompt for risks
- `GET /api/history` - Get score history
- `GET /api/policies` - List policies
- `POST /api/policies` - Create policy

### Red Team API (Port 5012)
- `GET /api/recipes` - List attack recipes
- `POST /api/attack` - Execute attack
- `GET /api/history` - Attack history
- `GET /api/stats` - Statistics

[See full API docs in `/docs/api.md`]

## 🧪 Testing

```bash
# Run frontend tests (if configured)
cd frontend && npm test

# Test API health checks
curl http://localhost:5007/health  # Backup API
curl http://localhost:5011/health  # Prompt Monitor
curl http://localhost:5012/health  # Red Team API
```

## 🚢 Deployment

### Docker Deployment (Coming Soon)
```bash
docker-compose up -d
```

### Manual Deployment
1. Build frontend: `cd frontend && npm run build`
2. Serve static files from `frontend/dist`
3. Deploy backend services with PM2 or systemd
4. Configure reverse proxy (nginx/Apache)
5. Set up SSL certificates

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## ⚠️ Security & Ethics

- **Misinformation Lab:** Research only, public data, offline-first
- **Red Team Tools:** Only test YOUR OWN systems with authorization
- **AI Safety:** Defensive research, CTF challenges, penetration testing
- Never use against third-party services without consent

## 📧 Support

For issues, feature requests, or questions:
- GitHub Issues: [Create an issue]
- Documentation: See `/docs` folder

## 🙏 Acknowledgments

Built with:
- React, Vite, Express, Flask
- better-sqlite3, vis-network
- Open source community

---

**Note:** Some features require API keys (optional). Most tools work offline or with mock data.
