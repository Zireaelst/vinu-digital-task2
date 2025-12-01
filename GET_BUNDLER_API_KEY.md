# Get Your FREE Stackup Bundler API Key

Stackup is a reliable ERC-4337 bundler service with a generous free tier.

## Steps to Get API Key:

1. **Sign up at Stackup**
   - Go to: https://app.stackup.sh/sign-up
   - Sign up with email or GitHub
   - Verify your email

2. **Create API Key**
   - Go to Dashboard: https://app.stackup.sh
   - Click "Create App"
   - Name it: "ERC-4337 Demo" or similar
   - Select Network: **Sepolia Testnet**
   - Copy your API Key

3. **Add to Project**
   - Create `.env.local` in `/frontend` folder:
   ```bash
   NEXT_PUBLIC_BUNDLER_API_KEY=your_stackup_api_key_here
   ```

4. **Restart Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

## Benefits of Stackup:

✅ **Reliable execution** - High uptime and fast bundling
✅ **Free tier** - 1000 UserOperations/month free
✅ **Better logging** - Detailed error messages
✅ **Paymaster support** - Works well with gas sponsorship
✅ **Low latency** - Fast UserOperation processing

## Alternative: Pimlico

If Stackup doesn't work, try Pimlico:

1. Sign up: https://dashboard.pimlico.io
2. Create project for Sepolia
3. Copy API key
4. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_api_key_here
   ```

## Current Issue:

**Biconomy bundler** accepts UserOperations but doesn't execute them. This is likely because:
- Public Biconomy endpoint has restrictions
- Paymaster validation may be failing on their side
- Gas profitability checks may be failing

**With a dedicated API key**, you'll get:
- Priority processing
- Better error messages  
- Guaranteed execution
- No rate limits

## After Adding API Key:

Your UserOperation will use Stackup as the primary bundler, and the system will automatically prioritize it over public bundlers.

The bundler configuration (`/frontend/src/config/bundler.ts`) already checks for `NEXT_PUBLIC_BUNDLER_API_KEY` and will use it automatically!
