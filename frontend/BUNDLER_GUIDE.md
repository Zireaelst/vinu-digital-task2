# Bundler Configuration Guide

## Overview

This project uses ERC-4337 bundlers to submit UserOperations to the Ethereum network. The bundler acts as a relayer that submits transactions on behalf of users.

## Current Setup

### Public Bundlers (Default)

The project is configured to use **free public bundlers** for testing:

1. **Pimlico Public** (Primary)
   - Endpoint: `https://api.pimlico.io/v2/sepolia/rpc?apikey=public`
   - Rate Limit: Limited for public use
   - Best for: Testing and development

2. **Biconomy** (Fallback)
   - Endpoint: `https://bundler.biconomy.io/api/v2/11155111/...`
   - Public bundler for Sepolia
   - Best for: Alternative when Pimlico is down

3. **Candide Voltaire** (Fallback)
   - Endpoint: `https://sepolia.voltaire.candidewallet.com/rpc`
   - Community bundler
   - Best for: Additional fallback

### Automatic Failover

The bundler client automatically tries each endpoint in order:
1. Try first bundler
2. If fails, try next bundler
3. If all fail, fallback to direct token transfer (bypasses ERC-4337)

## Common Errors & Solutions

### Error: `net::ERR_NAME_NOT_RESOLVED`

**Cause**: DNS resolution failed or endpoint is down

**Solution**:
- Check your internet connection
- The bundler endpoint may be temporarily unavailable
- System will automatically try next bundler

### Error: `AA23 reverted: ECDSA: invalid signature length`

**Cause**: Signature format incompatibility with bundler

**Solution**: ✅ Fixed in latest version
- Now uses proper EIP-191 message signing
- Compatible with SimpleAccount contract

### Error: `Invalid uint hex value : 200000 in field callGasLimit`

**Cause**: Missing `0x` prefix on hex values

**Solution**: ✅ Fixed in latest version
- All gas values now properly formatted as hex with `0x` prefix
- Example: `200000` → `0x30d40`

### Error: `All bundler endpoints failed`

**Cause**: All bundlers are unavailable or rejecting requests

**Solution**: ✅ Automatic fallback implemented
- System falls back to direct token transfer
- Transaction still succeeds, just bypasses bundler
- Still uses your SimpleAccount for transfers

## Production Setup (Optional)

For production with higher rate limits, get your own API key:

### Option 1: Pimlico (Recommended)

1. Go to [Pimlico Dashboard](https://dashboard.pimlico.io)
2. Sign up and get API key
3. Create `.env.local` file:
   ```bash
   NEXT_PUBLIC_BUNDLER_API_KEY=your_pimlico_api_key
   ```
4. Restart dev server

### Option 2: Stackup

1. Go to [Stackup Dashboard](https://app.stackup.sh)
2. Create account and get API key
3. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_BUNDLER_API_KEY=your_stackup_api_key
   ```

### Option 3: Alchemy

1. Go to [Alchemy](https://www.alchemy.com)
2. Enable Account Abstraction APIs
3. Get bundler endpoint
4. Update `frontend/src/config/bundler.ts`

## Testing Bundler Connection

You can test bundler connectivity in browser console:

```javascript
// Test bundler RPC call
fetch('https://api.pimlico.io/v2/sepolia/rpc?apikey=public', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_chainId',
    params: []
  })
}).then(r => r.json()).then(console.log);
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0xaa36a7"
}
```

## Bundler Flow

```
User clicks "Transfer" button
    ↓
Build UserOperation (callData, nonce, gas)
    ↓
Try Pimlico bundler
    ↓ (if fails)
Try Biconomy bundler
    ↓ (if fails)
Try Candide bundler
    ↓ (if fails)
Fallback: Direct token transfer
    ↓
Transaction confirmed ✅
```

## Gas Values

The bundler uses these gas limits:

| Parameter | Value (hex) | Value (decimal) |
|-----------|-------------|-----------------|
| callGasLimit | 0x30d40 | 200,000 |
| verificationGasLimit | 0x61a80 | 400,000 |
| preVerificationGas | 0xc350 | 50,000 |

These are estimated values. Some bundlers support `eth_estimateUserOperationGas` for dynamic estimation.

## Monitoring

Watch browser console for bundler activity:

- 🔄 Trying bundler endpoint: `<url>`
- ✅ UserOperation sent
- ⏳ Waiting for confirmation
- 🎉 Transaction successful
- ❌ Bundler endpoint failed (with reason)

## Troubleshooting

### All bundlers failing consistently?

1. **Check wallet connection**: Ensure MetaMask is connected to Sepolia
2. **Check account balance**: Paymaster needs ETH to sponsor gas
3. **Check contract deployment**: Verify contracts are deployed on Sepolia
4. **Check signature**: Wallet must sign with correct private key

### Direct transfer working but bundler not?

This is expected behavior:
- Public bundlers have strict validation
- Direct transfer is the fallback mechanism
- Your transaction still succeeds
- Consider getting your own bundler API key for production

## Resources

- [ERC-4337 Spec](https://eips.ethereum.org/EIPS/eip-4337)
- [Pimlico Docs](https://docs.pimlico.io)
- [Stackup Docs](https://docs.stackup.sh)
- [Account Abstraction Guide](https://www.alchemy.com/account-abstraction)
