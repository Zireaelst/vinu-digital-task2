# 🚀 Deployment Guide

Complete guide for deploying the ERC-4337 Account Abstraction project to production.

---

## 📋 Deployment Overview

```
┌─────────────────────────────────┐
│   Smart Contracts (Sepolia)    │
│   - Already deployed ✅         │
│   - Verified on Etherscan ✅    │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   Frontend (Vercel/Netlify)    │
│   - Next.js 16 app              │
│   - Edge deployment              │
│   - Automatic CI/CD              │
└─────────────────────────────────┘
```

---

## 🔐 Prerequisites

### Required Accounts & API Keys

- ✅ Infura/Alchemy account (RPC provider)
- ✅ Etherscan API key (contract verification)
- ✅ Vercel account (frontend hosting)
- ✅ GitHub account (version control)
- ✅ Sepolia ETH (for deployments)

### Get Sepolia ETH

```
Faucets:
• https://sepoliafaucet.com/
• https://faucet.quicknode.com/ethereum/sepolia
• https://www.alchemy.com/faucets/ethereum-sepolia
```

---

## 📦 Smart Contract Deployment

### Step 1: Environment Setup

Create `.env` in `/contracts`:

```bash
# RPC Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Deployment Wallet
PRIVATE_KEY=your_deployer_private_key_here

# Sponsor Wallet (for Paymaster deposits)
SPONSOR_PRIVATE_KEY=your_sponsor_wallet_key_here

# Contract Verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Optional: Bundler API Keys
PIMLICO_API_KEY=your_pimlico_api_key (optional)
```

### Step 2: Install Dependencies

```bash
cd contracts
npm install
```

### Step 3: Compile Contracts

```bash
npm run compile
```

**Expected output:**
```
Compiled 25 Solidity files successfully
```

### Step 4: Run Tests

```bash
npm test
```

**Expected output:**
```
  27 passing (5s)
```

### Step 5: Deploy Contracts

```bash
npm run deploy
```

**This will deploy:**
1. TestToken (ERC-20)
2. SponsorPaymaster
3. SimpleAccountFactory

**Expected output:**
```
Deploying contracts to Sepolia...

✅ TestToken deployed: 0x4eEE914a9Da7cAB89e5Bd2F01B5aea14327B3cC1
✅ SponsorPaymaster deployed: 0xd6fC41c0c3D14Cac0c66Af4a0E8eFc6a4a47A20d
✅ SimpleAccountFactory deployed: 0xd74F11eeEF835d8b46b7329c8A00BD95bEd59704

Addresses saved to deployed_addresses.json
```

### Step 6: Verify Contracts

```bash
# Verify TestToken
npx hardhat verify --network sepolia <TOKEN_ADDRESS>

# Verify Paymaster
npx hardhat verify --network sepolia <PAYMASTER_ADDRESS> <ENTRYPOINT_ADDRESS> <OWNER_ADDRESS>

# Verify Factory
npx hardhat verify --network sepolia <FACTORY_ADDRESS> <ENTRYPOINT_ADDRESS>
```

**Verification status:** ✅ All contracts verified on [Sepolia Etherscan](https://sepolia.etherscan.io/)

### Step 7: Fund Paymaster

```bash
# Run setup script
npm run setup-paymaster
```

**This will:**
- Deposit 0.1 ETH to Paymaster
- Whitelist your test account
- Display confirmation

---

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

#### Step 1: Prepare Repository

```bash
cd frontend

# Ensure dependencies are up to date
npm install

# Build locally to test
npm run build
```

#### Step 2: Push to GitHub

```bash
git add .
git commit -m "feat: prepare for deployment"
git push origin main
```

#### Step 3: Deploy to Vercel

**Via Vercel Dashboard:**

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

#### Step 4: Environment Variables

Add in Vercel dashboard:

```env
# RPC Endpoint
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Contract Addresses
NEXT_PUBLIC_ENTRY_POINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
NEXT_PUBLIC_TEST_TOKEN_ADDRESS=0x4eEE914a9Da7cAB89e5Bd2F01B5aea14327B3cC1
NEXT_PUBLIC_SPONSOR_PAYMASTER_ADDRESS=0xd6fC41c0c3D14Cac0c66Af4a0E8eFc6a4a47A20d
NEXT_PUBLIC_SIMPLE_ACCOUNT_FACTORY_ADDRESS=0xd74F11eeEF835d8b46b7329c8A00BD95bEd59704

# Optional: Custom Bundlers
NEXT_PUBLIC_CUSTOM_BUNDLERS=https://your-bundler.com

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

#### Step 5: Deploy

Click "Deploy" and wait ~2 minutes.

**Result:** Your app will be live at `https://your-project.vercel.app`

---

### Option 2: Netlify

#### Step 1: Build Configuration

Create `netlify.toml` in `/frontend`:

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Step 2: Deploy

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy --prod
```

---

### Option 3: Self-Hosted (VPS)

#### Requirements
- Ubuntu 20.04+ server
- Node.js 20+
- Nginx
- SSL certificate (Let's Encrypt)

#### Step 1: Setup Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### Step 2: Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/vinu-digital-task2.git
cd vinu-digital-task2/frontend

# Install dependencies
npm install

# Create .env.local
nano .env.local
# (paste environment variables)

# Build
npm run build

# Start with PM2
pm2 start npm --name "vinu-frontend" -- start
pm2 save
pm2 startup
```

#### Step 3: Configure Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Step 4: SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd contracts
          npm install
      
      - name: Run tests
        run: |
          cd contracts
          npm test
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend
```

---

## 📊 Post-Deployment Checklist

### Smart Contracts

- [ ] All contracts deployed successfully
- [ ] Contract verification on Etherscan complete
- [ ] Paymaster funded with ETH
- [ ] Test accounts whitelisted
- [ ] Ownership transferred (if needed)
- [ ] Contract addresses saved

### Frontend

- [ ] Build successful
- [ ] Environment variables configured
- [ ] Site accessible via URL
- [ ] Wallet connection works
- [ ] Account creation works
- [ ] Sponsored transfers work
- [ ] Etherscan links work
- [ ] Mobile responsive

### Monitoring

- [ ] Analytics configured
- [ ] Error tracking setup (Sentry)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Gas price alerts
- [ ] Transaction monitoring

---

## 🔍 Verification & Testing

### Test Smart Contracts

```bash
# Run full test suite
cd contracts
npm test

# Run specific test
npx hardhat test test/SponsorPaymaster.test.ts

# Generate coverage report
npx hardhat coverage
```

### Test Frontend

```bash
cd frontend

# Build test
npm run build

# Start production mode
npm start

# Open in browser
open http://localhost:3000
```

### Manual Testing Checklist

1. **Wallet Connection**
   - [ ] MetaMask connects successfully
   - [ ] Network switches to Sepolia
   - [ ] Account address displayed correctly

2. **Account Creation**
   - [ ] Create account button works
   - [ ] Account address generated
   - [ ] Account saved to storage

3. **Token Operations**
   - [ ] Balance displays correctly
   - [ ] Transfer form works
   - [ ] Sponsored transfer succeeds
   - [ ] Balance updates after transfer

4. **UI/UX**
   - [ ] Responsive on mobile
   - [ ] Loading states work
   - [ ] Error messages clear
   - [ ] Success notifications show

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Contract Deployment Fails

```bash
Error: insufficient funds for intrinsic transaction cost
```

**Solution:** Add more Sepolia ETH to deployer wallet

---

#### 2. Verification Fails

```bash
Error: Already Verified
```

**Solution:** Contract is already verified, check Etherscan

---

#### 3. Frontend Build Fails

```bash
Error: Module not found
```

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

#### 4. Environment Variables Not Working

**Solution:**
- Vercel: Check dashboard → Settings → Environment Variables
- Local: Restart dev server after changing .env.local
- Ensure variables start with `NEXT_PUBLIC_` for client-side

---

#### 5. Bundler Not Working

```bash
Error: Bundler unavailable
```

**Solution:**
- Check Pimlico status: https://status.pimlico.io
- Try alternate bundler in config
- Verify SEPOLIA_RPC_URL is correct

---

## 📈 Monitoring & Maintenance

### Uptime Monitoring

Use [UptimeRobot](https://uptimerobot.com) (free):

```
Monitor URL: https://your-site.vercel.app
Check Interval: 5 minutes
Alert: Email when down
```

### Analytics

Use [Vercel Analytics](https://vercel.com/analytics) (built-in):

```typescript
// Already included in Next.js 16
// View in Vercel dashboard
```

### Error Tracking

Use [Sentry](https://sentry.io):

```bash
npm install @sentry/nextjs

# Run setup wizard
npx @sentry/wizard@latest -i nextjs
```

### Contract Monitoring

Monitor contract events:

```typescript
// Setup event listener
const paymaster = getPaymasterContract();

paymaster.on("UserOpSponsored", (sender, cost) => {
  console.log(`Sponsored ${sender}: ${cost} wei`);
  // Send alert if cost too high
});
```

---

## 🔒 Security Best Practices

### Production Checklist

- [ ] Private keys never committed
- [ ] Environment variables in secure vault
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Dependencies updated
- [ ] Security audit complete (for mainnet)

### Environment Security

```bash
# Never commit .env files
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# Use secrets management
# Vercel: Built-in secrets
# AWS: AWS Secrets Manager
# GCP: Secret Manager
```

---

## 🚀 Scaling Considerations

### When to Scale

| Metric | Threshold | Action |
|--------|-----------|--------|
| Users | 1,000+ | Add caching layer |
| TX/day | 10,000+ | Multiple bundlers |
| API calls | 100k/day | Upgrade RPC plan |
| Gas costs | $1000+/mo | Optimize UserOps |

### Optimization Strategies

1. **Caching**
   - Cache contract data (token balance, etc.)
   - Use React Query stale time
   - CDN for static assets

2. **Batch Operations**
   - Batch multiple transfers
   - Reduce on-chain calls
   - Use multicall

3. **Gas Optimization**
   - Monitor gas prices
   - Batch during low gas
   - Optimize contract calls

---

## 📚 Additional Resources

- [Vercel Deployment Docs](https://nextjs.org/docs/deployment)
- [Hardhat Deployment Guide](https://hardhat.org/tutorial/deploying-to-a-live-network)
- [Etherscan Verification](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## 🆘 Support

Need help with deployment?

- 📖 [Documentation](./README.md)
- 🐛 [GitHub Issues](https://github.com/yourusername/vinu-digital-task2/issues)
- 💬 [Discord Community](https://discord.gg/ethereum)
- 📧 [Email Support](mailto:support@example.com)

---

**Last Updated:** December 2, 2025
**Deployment Version:** 1.0.0
