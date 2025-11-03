# GitHub Actions CI/CD

This directory contains the automated CI/CD pipeline for DevTools Dashboard.

## Quick Start

### 1. Setup Required Secrets

Before the workflow can run, configure these GitHub secrets:

| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | Private SSH key for deployment user |
| `DEPLOY_HOST` | Production server hostname or IP |
| `DEPLOY_USER` | SSH username (e.g., `deploy`) |
| `DEPLOY_PATH` | Deployment directory (e.g., `/var/www/devtools`) |

**See [SETUP-SECRETS.md](SETUP-SECRETS.md) for detailed setup instructions.**

### 2. Workflow Triggers

The CI/CD workflow runs automatically on:
- ✅ Every push to `main` branch
- ✅ Pull requests to `main` (tests only, no deployment)
- ✅ Manual trigger via "Run workflow" button

### 3. Workflow Stages

```
Push to main
    ↓
┌───────────────────────────────┐
│  Parallel Testing (5-7 min)  │
│  - Frontend tests & build     │
│  - Backend tests              │
│  - Microservices tests        │
└──────────┬────────────────────┘
           ↓
┌──────────────────────────────┐
│  Integration Tests (2-3 min) │
│  - Start all 15 services     │
│  - Health checks             │
│  - API endpoint tests        │
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│  Deploy to Prod (3-5 min)    │
│  - Create backup             │
│  - Upload & install          │
│  - Reload services           │
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│  Health Verification (15s)   │
│  - Check all services        │
└──────────┬───────────────────┘
           ↓
    ┌──────┴──────┐
    ↓             ↓
 SUCCESS      ROLLBACK
    ↓        (automatic)
  Done           ↓
              Restored
```

## Files

### Workflows
- `workflows/deploy.yml` - Main CI/CD pipeline

### Documentation
- `SETUP-SECRETS.md` - Secrets configuration guide
- `../docs/CI-CD.md` - Complete pipeline documentation

### Scripts
- `../scripts/test-integration.sh` - Integration test suite
- `../scripts/deploy-remote.sh` - Remote deployment script
- `../scripts/health-check.sh` - Service health checker

## Monitoring

### View Workflow Runs
1. Go to **Actions** tab in GitHub
2. Select **Build, Test, and Deploy** workflow
3. Click on a run to see details

### Check Deployment Status
```bash
# SSH to production server
ssh deploy@your-server

# Check service status
pm2 status

# View logs
pm2 logs

# Run health check
cd /var/www/devtools
./scripts/health-check.sh
```

## Manual Deployment

Trigger deployment manually:
1. Go to **Actions** tab
2. Select **Build, Test, and Deploy**
3. Click **Run workflow**
4. Select branch and click **Run**

## Rollback

### Automatic Rollback
If post-deployment health checks fail, the workflow automatically:
1. Stops all services
2. Removes failed deployment
3. Restores from latest backup
4. Restarts services
5. Verifies rollback health

### Manual Rollback
```bash
ssh deploy@your-server
cd /var/www/devtools

# View available backups
ls -lt /var/www/backups/

# Restore from backup
pm2 stop all
tar -xzf /var/www/backups/backup-TIMESTAMP.tar.gz -C /var/www/devtools
pm2 start ecosystem.config.js
```

## Troubleshooting

### Deployment Fails
1. Check workflow logs in Actions tab
2. SSH to server and check PM2 logs: `pm2 logs --err`
3. Run health check: `./scripts/health-check.sh`
4. Review [CI-CD.md](../docs/CI-CD.md) troubleshooting section

### SSH Connection Issues
- Verify `SSH_PRIVATE_KEY` secret format
- Test SSH connection: `ssh -i ~/.ssh/deploy_key deploy@server`
- Check server authorized_keys: `cat ~/.ssh/authorized_keys`

### Health Checks Fail
- Check service status: `pm2 status`
- Check for port conflicts: `./scripts/check-ports.sh`
- Verify databases initialized: `ls -la data/*.db`

## Documentation

📖 **[Complete CI/CD Documentation](../docs/CI-CD.md)**
- Pipeline architecture
- Job descriptions
- Secrets setup
- Monitoring guide
- Troubleshooting
- Best practices

📖 **[Secrets Setup Guide](SETUP-SECRETS.md)**
- Step-by-step setup
- SSH key generation
- Security best practices
- Troubleshooting

📖 **[Deployment Guide](../docs/DEPLOYMENT.md)**
- Production deployment
- Nginx setup
- SSL configuration
- Manual deployment

## Support

For issues:
1. Check documentation above
2. Review workflow logs
3. Check service logs on server
4. Open an issue with details
