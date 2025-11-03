# CI/CD Pipeline Documentation

This document describes the automated Continuous Integration and Continuous Deployment (CI/CD) pipeline for DevTools Dashboard.

## Overview

The CI/CD pipeline automatically builds, tests, and deploys the application on every push to the `main` branch. It includes:

- ✅ Automated testing for frontend, backend, and all 14 microservices
- ✅ Integration tests with health checks
- ✅ Automatic deployment to production
- ✅ **Automated rollback on test failures**
- ✅ Deployment tagging and versioning

## Pipeline Architecture

```
┌─────────────────┐
│  Push to main   │
└────────┬────────┘
         │
         ├──────────────────────────────────┐
         │                                   │
    ┌────▼────┐                         ┌───▼────┐
    │  Test   │                         │  Test  │
    │Frontend │                         │Backend │
    └────┬────┘                         └───┬────┘
         │                                   │
         └─────────────┬─────────────────────┘
                       │
                  ┌────▼──────┐
                  │   Test    │
                  │Microservc.│
                  └────┬──────┘
                       │
                  ┌────▼──────────┐
                  │  Integration  │
                  │     Tests     │
                  └────┬──────────┘
                       │
                  ┌────▼──────────┐
                  │    Deploy     │
                  │  Production   │
                  └────┬──────────┘
                       │
                  ┌────▼──────────┐
                  │ Health Checks │
                  └────┬──────────┘
                       │
              ┌────────┴────────┐
              │                 │
         ┌────▼────┐       ┌────▼────────┐
         │ Success │       │   ROLLBACK  │
         │   ✓     │       │   (on fail) │
         └─────────┘       └─────────────┘
```

## Workflow Jobs

### 1. Test Frontend (`test-frontend`)

**Purpose:** Build and test the React frontend

**Steps:**
- Checkout code
- Setup Node.js 18 with npm cache
- Install dependencies (`npm ci`)
- Run ESLint
- Build production bundle
- Upload build artifact for deployment

**Exit Criteria:** All steps must pass

---

### 2. Test Backend (`test-backend`)

**Purpose:** Test the Flask backend API

**Steps:**
- Checkout code
- Setup Python 3.8 with pip cache
- Install dependencies
- Run pytest tests
- Check code style with flake8

**Exit Criteria:** All tests must pass

---

### 3. Test Microservices (`test-microservices`)

**Purpose:** Test all 4 microservice groups in parallel

**Matrix Strategy:**
```yaml
matrix:
  service: [misinfo, portfolio, resilience, ai-safety]
```

**Steps (for each service):**
- Checkout code
- Setup Node.js with npm cache
- Install dependencies
- Initialize SQLite database
- Run service tests (syntax checks)

**Exit Criteria:** All 4 services must pass

---

### 4. Integration Tests (`integration-tests`)

**Purpose:** Test all services running together

**Dependencies:** Requires frontend, backend, and microservices tests to pass

**Steps:**
- Install all dependencies
- Initialize all databases
- Start Flask backend (port 5000)
- Start all 14 microservices (ports 5001-5014)
- Wait 10 seconds for startup
- Run health checks on all 15 services
- Run API integration tests
- Stop all services (cleanup)

**Exit Criteria:** All health checks and integration tests must pass

---

### 5. Deploy to Production (`deploy`)

**Purpose:** Deploy to production server with automatic rollback

**Dependencies:** Integration tests must pass

**Triggers:** Only on push to `main` branch (not on PRs)

**Environment:** `production` (requires approval if configured)

**Steps:**

#### Pre-Deployment
1. Download frontend build artifact
2. Create deployment package (tar.gz with timestamp)
3. Setup SSH connection to production server

#### Backup
4. SSH to production server
5. Create timestamped backup of current deployment
6. Keep only last 5 backups

#### Deployment
7. Upload deployment package via SCP
8. Extract package on production server
9. Install/update all dependencies
10. Initialize databases (if missing)
11. Reload PM2 processes

#### Verification
12. Wait 15 seconds for services to stabilize
13. Run health checks on all 15 services

#### Rollback (if health checks fail)
14. Stop all PM2 services
15. Remove failed deployment
16. Restore from latest backup
17. Restart PM2 services
18. Re-run health checks

#### Finalization
19. Create deployment tag (e.g., `deploy-20250103_143022`)
20. Cleanup SSH keys and temporary files

**Exit Criteria:**
- ✅ Success: All health checks pass
- ❌ Failure: Automatic rollback executed

---

## Required GitHub Secrets

Configure these secrets in your GitHub repository:

### Production Server Access

```
SSH_PRIVATE_KEY         - Private SSH key for deployment user
DEPLOY_HOST            - Production server hostname or IP
DEPLOY_USER            - SSH username (e.g., 'deploy')
DEPLOY_PATH            - Deployment directory (e.g., '/var/www/devtools')
```

### Optional API Keys

```
OPENWEATHER_API_KEY    - For weather tool (optional)
GITHUB_TOKEN           - For E-Portfolio (optional, auto-provided by GitHub Actions)
```

## Setting Up Secrets

### 1. Generate SSH Key Pair

On your production server:

```bash
# Generate key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Add public key to authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Copy private key (this goes in GitHub secrets)
cat ~/.ssh/github_deploy
```

### 2. Add Secrets to GitHub

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret:
   - `SSH_PRIVATE_KEY`: Paste the entire private key (including `-----BEGIN` and `-----END`)
   - `DEPLOY_HOST`: Your server IP or domain
   - `DEPLOY_USER`: SSH username
   - `DEPLOY_PATH`: `/var/www/devtools`

### 3. Test SSH Connection

```bash
# Test from your local machine
ssh -i ~/.ssh/github_deploy deploy@your-server

# Verify deployment path exists
ls -la /var/www/devtools
```

## Local Testing

Before pushing to `main`, test locally:

### Run Unit Tests

```bash
# Frontend
cd frontend
npm install
npm run lint
npm run build

# Backend
cd backend
pip install -r requirements-dev.txt
pytest tests/

# Microservices
cd services/misinfo
npm install
npm test
```

### Run Integration Tests

```bash
# Start all services
./start-all.sh

# In another terminal, run integration tests
chmod +x scripts/test-integration.sh
./scripts/test-integration.sh run
```

### Test Health Checks

```bash
# After starting services
./scripts/health-check.sh
```

## Deployment Process

### Automatic Deployment

Every push to `main` triggers automatic deployment:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

GitHub Actions will:
1. Run all tests
2. Deploy to production
3. Verify health
4. Rollback if anything fails

### Manual Deployment

Trigger manual deployment via GitHub Actions:

1. Go to **Actions** tab
2. Select **Build, Test, and Deploy** workflow
3. Click **Run workflow**
4. Select branch and click **Run**

### Manual Rollback

If you need to manually rollback:

```bash
# SSH to production server
ssh deploy@your-server

# Run rollback script
cd /var/www/devtools
./scripts/deploy-remote.sh rollback

# Or manually restore from backup
cd /var/www/backups
ls -lt  # Find latest backup
tar -xzf backup-TIMESTAMP.tar.gz -C /var/www/devtools
cd /var/www/devtools
pm2 restart all
```

## Monitoring Deployments

### GitHub Actions UI

View deployment status:
- **Actions** tab → Select workflow run
- See real-time logs for each job
- View deployment environment status

### Production Server

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs

# Monitor in real-time
pm2 monit

# Check deployment history
ls -lt /var/www/backups/

# View deployment tags
git tag -l "deploy-*"
```

### Health Monitoring

```bash
# Manual health check
ssh deploy@your-server
cd /var/www/devtools
./scripts/health-check.sh

# Check individual service
curl http://your-server:5000/health
curl http://your-server:5011/health
```

## Rollback Scenarios

### Automatic Rollback Triggers

The pipeline automatically rolls back if:
- ❌ Health checks fail after deployment
- ❌ PM2 fails to start services
- ❌ Any service is unresponsive

### Rollback Process

1. **Stop all services** via PM2
2. **Remove failed deployment** files
3. **Extract latest backup** (from `/var/www/backups/`)
4. **Restart services** with PM2
5. **Verify health** of rolled-back version
6. **Exit with error** code (deployment marked as failed)

### Manual Rollback

If you need to rollback a successful deployment:

```bash
# View recent deployments
git tag -l "deploy-*" | tail -5

# Checkout previous version
git checkout deploy-20250102_140000

# Push to trigger redeployment
git push origin main --force
```

## Troubleshooting

### Deployment Fails on Health Checks

**Symptoms:** Deployment completes but rollback occurs

**Debug:**
```bash
ssh deploy@your-server
pm2 logs --err  # Check error logs
pm2 status      # Check service status
./scripts/health-check.sh  # Manual health check
```

**Common Causes:**
- Port conflicts
- Database not initialized
- Missing environment variables
- Dependency installation failures

### SSH Connection Fails

**Symptoms:** `Permission denied (publickey)`

**Fix:**
```bash
# Verify SSH key format in GitHub secrets
# Should include header/footer:
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----

# Test SSH connection
ssh -i ~/.ssh/deploy_key deploy@server

# Check authorized_keys on server
cat ~/.ssh/authorized_keys
```

### Tests Fail Locally But Pass in CI

**Cause:** Environment differences

**Fix:**
```bash
# Use same Node/Python versions as CI
nvm use 18
pyenv local 3.8

# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Clear caches
npm cache clean --force
pip cache purge
```

### Rollback Fails

**Symptoms:** "No backup found for rollback"

**Cause:** First deployment or backups deleted

**Fix:**
```bash
# Manual deployment
cd /var/www/devtools
git pull origin main
./deploy-production.sh
```

## Performance Optimization

### Cache Dependencies

The workflow uses GitHub Actions cache:
- npm dependencies cached by `package-lock.json`
- pip dependencies cached by `requirements.txt`

Average time savings: **2-3 minutes per run**

### Parallel Testing

Microservices tested in parallel (4 jobs):
- Reduces test time from **~8 minutes** to **~2 minutes**

### Artifact Management

- Frontend build uploaded as artifact (retention: 1 day)
- Avoids rebuilding for deployment
- Saves: **~1 minute**

## Security Best Practices

✅ **SSH keys** never exposed in logs
✅ **Secrets** injected via GitHub secrets
✅ **Backups** created before every deployment
✅ **Health checks** verify deployment success
✅ **Automatic rollback** prevents downtime
✅ **Deployment tags** for version tracking

## Cost Optimization

### GitHub Actions Minutes

Free tier: 2,000 minutes/month

Average workflow run:
- Tests: ~5 minutes
- Deployment: ~3 minutes
- **Total: ~8 minutes per push**

Estimated monthly usage (10 pushes/day):
- 10 pushes × 8 minutes × 30 days = **2,400 minutes**
- Consider: GitHub Pro ($4/month) for 3,000 minutes

### Reduce Minutes

1. **Skip CI on documentation changes:**
   ```yaml
   paths-ignore:
     - '**.md'
     - 'docs/**'
   ```

2. **Manual deployment trigger:**
   ```yaml
   workflow_dispatch:  # Already enabled
   ```

3. **Deploy only on releases:**
   ```yaml
   on:
     release:
       types: [published]
   ```

## Best Practices

### Before Pushing to Main

1. ✅ Test locally first
2. ✅ Run linters (`npm run lint`)
3. ✅ Update tests if needed
4. ✅ Check CHANGELOG
5. ✅ Review diff carefully

### During Deployment

1. ✅ Monitor Actions tab
2. ✅ Watch for red ❌ indicators
3. ✅ Check health after deployment
4. ✅ Verify in production

### After Deployment

1. ✅ Test critical paths in production
2. ✅ Monitor PM2 logs for errors
3. ✅ Check error tracking (if configured)
4. ✅ Update deployment notes

## Future Enhancements

Potential improvements:

- [ ] Slack/Discord notifications on deploy
- [ ] Performance testing in CI
- [ ] Visual regression testing
- [ ] Automated database migrations
- [ ] Blue-green deployments
- [ ] Canary deployments
- [ ] Multi-environment support (staging, prod)
- [ ] Automated smoke tests after deployment

## Support

For issues with CI/CD:
- Check workflow logs in Actions tab
- Review this documentation
- Check GitHub Actions status page
- Open an issue in the repository
