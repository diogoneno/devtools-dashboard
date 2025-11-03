# GitHub Secrets Setup Guide

This guide helps you configure GitHub secrets required for the CI/CD pipeline.

## Required Secrets

The deployment workflow requires these secrets to be configured in your GitHub repository:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `SSH_PRIVATE_KEY` | Private SSH key for deployment | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_HOST` | Production server hostname/IP | `devtools.example.com` or `192.168.1.100` |
| `DEPLOY_USER` | SSH username on production server | `deploy` or `ubuntu` |
| `DEPLOY_PATH` | Full path to deployment directory | `/var/www/devtools` |
| `PRODUCTION_URL` | Production URL (for environment tracking) | `https://devtools.example.com` |

## Step-by-Step Setup

### 1. Create Deployment User on Production Server

```bash
# SSH to your production server
ssh root@your-server

# Create deployment user
sudo useradd -m -s /bin/bash deploy

# Add to necessary groups
sudo usermod -aG www-data deploy

# Create deployment directory
sudo mkdir -p /var/www/devtools
sudo chown -R deploy:www-data /var/www/devtools

# Create backups directory
sudo mkdir -p /var/www/backups
sudo chown -R deploy:www-data /var/www/backups
```

### 2. Generate SSH Key Pair

```bash
# Switch to deployment user
sudo su - deploy

# Generate ED25519 key pair (more secure than RSA)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Important: Leave passphrase empty (press Enter twice)
# GitHub Actions cannot handle passphrases

# Add public key to authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Copy Private Key

```bash
# Display private key (you'll copy this to GitHub)
cat ~/.ssh/github_deploy
```

**Copy the entire output**, including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
-----END OPENSSH PRIVATE KEY-----
```

### 4. Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:

#### SSH_PRIVATE_KEY

- **Name:** `SSH_PRIVATE_KEY`
- **Value:** Paste the entire private key from step 3

#### DEPLOY_HOST

- **Name:** `DEPLOY_HOST`
- **Value:** Your server's hostname or IP address
  - Examples: `devtools.example.com` or `192.168.1.100`

#### DEPLOY_USER

- **Name:** `DEPLOY_USER`
- **Value:** The deployment user (from step 1)
  - Example: `deploy`

#### DEPLOY_PATH

- **Name:** `DEPLOY_PATH`
- **Value:** Full path to deployment directory
  - Example: `/var/www/devtools`

#### PRODUCTION_URL

- **Name:** `PRODUCTION_URL`
- **Value:** Your production URL
  - Example: `https://devtools.example.com`

### 5. Test SSH Connection

Before running the workflow, test the SSH connection:

```bash
# On your local machine, test with the key
ssh -i ~/.ssh/github_deploy deploy@your-server

# Verify you can access the deployment path
ls -la /var/www/devtools

# Verify you have write permissions
touch /var/www/devtools/test.txt && rm /var/www/devtools/test.txt
```

### 6. Verify Secrets in GitHub

After adding secrets:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see all 5 secrets listed
3. Secrets are encrypted and cannot be viewed after creation

## Security Best Practices

### ✅ DO

- ✅ Use ED25519 keys (more secure)
- ✅ Create dedicated deployment user (don't use root)
- ✅ Limit deployment user permissions
- ✅ Use SSH keys without passphrases for automation
- ✅ Rotate keys periodically (every 6-12 months)
- ✅ Keep private keys secure (never commit to repo)

### ❌ DON'T

- ❌ Don't use root user for deployment
- ❌ Don't use password authentication
- ❌ Don't share SSH keys across environments
- ❌ Don't commit secrets to repository
- ❌ Don't use weak RSA keys (< 2048 bits)

## Troubleshooting

### Problem: "Permission denied (publickey)"

**Cause:** SSH key not properly configured

**Solution:**
```bash
# On production server, check authorized_keys
cat ~/.ssh/authorized_keys

# Verify permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Check SSH key format in GitHub
# Must include BEGIN and END lines
```

### Problem: "Host key verification failed"

**Cause:** Server not in known_hosts

**Solution:**
The workflow includes `ssh-keyscan` to handle this automatically. If issues persist:

```bash
# On production server, ensure SSH is running
sudo systemctl status ssh

# Check firewall allows SSH
sudo ufw status
sudo ufw allow 22/tcp
```

### Problem: Deployment fails with "Permission denied" writing files

**Cause:** Deployment user lacks write permissions

**Solution:**
```bash
# On production server
sudo chown -R deploy:www-data /var/www/devtools
sudo chmod -R 755 /var/www/devtools

# Verify permissions
ls -la /var/www/devtools
```

### Problem: PM2 commands fail

**Cause:** PM2 not installed for deployment user

**Solution:**
```bash
# As deployment user
npm install -g pm2

# Or with sudo
sudo npm install -g pm2

# Verify PM2 is accessible
which pm2
pm2 --version
```

## Advanced Configuration

### Using Multiple Environments

For staging + production:

1. Create separate secrets:
   - `STAGING_HOST`, `PROD_HOST`
   - `STAGING_USER`, `PROD_USER`
   - `STAGING_PATH`, `PROD_PATH`

2. Modify workflow to use environment-specific secrets:
   ```yaml
   environment:
     name: ${{ github.event.inputs.environment || 'production' }}
   ```

### Using SSH Config

For complex SSH setups, create `.ssh/config`:

```bash
# On production server
cat > ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy
    StrictHostKeyChecking no
EOF

chmod 600 ~/.ssh/config
```

### Using Bastion/Jump Host

If your production server is behind a bastion:

```bash
# Modify workflow to use ProxyJump
ssh -J bastion-user@bastion-host deploy@prod-server
```

## Rotating SSH Keys

Recommended every 6-12 months:

```bash
# 1. Generate new key pair
ssh-keygen -t ed25519 -C "github-actions-deploy-2025" -f ~/.ssh/github_deploy_new

# 2. Add new public key to authorized_keys
cat ~/.ssh/github_deploy_new.pub >> ~/.ssh/authorized_keys

# 3. Update GitHub secret SSH_PRIVATE_KEY with new private key
cat ~/.ssh/github_deploy_new

# 4. Test workflow with new key

# 5. Remove old key from authorized_keys
nano ~/.ssh/authorized_keys  # Delete old key line

# 6. Delete old key files
rm ~/.ssh/github_deploy ~/.ssh/github_deploy.pub
mv ~/.ssh/github_deploy_new ~/.ssh/github_deploy
mv ~/.ssh/github_deploy_new.pub ~/.ssh/github_deploy.pub
```

## Security Checklist

Before running your first deployment:

- [ ] Deployment user created (not root)
- [ ] SSH key pair generated (ED25519)
- [ ] Public key added to authorized_keys
- [ ] Private key added to GitHub secrets
- [ ] All 5 required secrets configured in GitHub
- [ ] SSH connection tested successfully
- [ ] Deployment path exists with correct permissions
- [ ] PM2 installed and accessible
- [ ] Nginx configured (if using reverse proxy)
- [ ] Firewall allows SSH (port 22)
- [ ] Server has Node.js 18+ and Python 3.8+ installed

## Need Help?

If you're still having issues:

1. Check the [CI/CD Documentation](../docs/CI-CD.md)
2. Review the [Deployment Guide](../docs/DEPLOYMENT.md)
3. Check GitHub Actions logs for specific errors
4. Open an issue with logs and error messages
