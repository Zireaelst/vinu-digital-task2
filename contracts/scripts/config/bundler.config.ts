/**
 * Bundler Configuration for ERC-4337
 * 
 * This file configures bundler endpoints for submitting UserOperations
 * to the Ethereum network via ERC-4337 bundler services.
 * 
 * Supported Bundlers:
 * - Pimlico: https://pimlico.io
 * - Stackup: https://stackup.sh
 * - Alchemy: https://alchemy.com
 */

import * as dotenv from 'dotenv';
dotenv.config();

export interface BundlerConfig {
  name: string;
  endpoint: string;
  requiresApiKey: boolean;
  chainId: number;
}

// Sepolia chain ID
export const SEPOLIA_CHAIN_ID = 11155111;

/**
 * Get bundler endpoints with API keys from environment variables
 */
export function getBundlerEndpoints(): string[] {
  const endpoints: string[] = [];

  // Pimlico - Primary bundler (best for ERC-4337 + paymaster)
  const pimlicoKey = process.env.PIMLICO_API_KEY;
  if (pimlicoKey && pimlicoKey !== 'your_pimlico_api_key_here') {
    endpoints.push(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${pimlicoKey}`);
    console.log('✅ Pimlico bundler configured');
  }

  // Alchemy - Secondary bundler
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  if (alchemyKey && alchemyKey !== 'your_alchemy_api_key_here') {
    endpoints.push(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`);
    console.log('✅ Alchemy bundler configured');
  }

  // Legacy support - single bundler API key
  const legacyKey = process.env.BUNDLER_API_KEY;
  if (legacyKey && legacyKey !== 'your_bundler_api_key_here' && endpoints.length === 0) {
    endpoints.push(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${legacyKey}`);
    console.log('✅ Legacy bundler API key configured');
  }

  return endpoints;
}

/**
 * Get all configured bundler endpoints
 * Throws error if no bundlers are configured
 */
export function getAllBundlerEndpoints(): string[] {
  const endpoints = getBundlerEndpoints();

  if (endpoints.length === 0) {
    console.warn('\n⚠️  WARNING: No bundler API keys configured!');
    console.warn('Add one of the following to your .env file:\n');
    console.warn('  PIMLICO_API_KEY=your_key     (Get from: https://dashboard.pimlico.io)');
    console.warn('  ALCHEMY_API_KEY=your_key     (Get from: https://alchemy.com)\n');
    throw new Error('No bundler API keys configured. Please check .env file.');
  }

  console.log(`\n🔗 Using ${endpoints.length} bundler endpoint(s) for UserOperation submission\n`);
  return endpoints;
}

/**
 * Bundler configuration objects
 */
export const BUNDLER_CONFIGS: BundlerConfig[] = [
  {
    name: 'Pimlico',
    endpoint: 'https://api.pimlico.io/v2/sepolia/rpc',
    requiresApiKey: true,
    chainId: SEPOLIA_CHAIN_ID,
  },
  {
    name: 'Alchemy',
    endpoint: 'https://eth-sepolia.g.alchemy.com/v2',
    requiresApiKey: true,
    chainId: SEPOLIA_CHAIN_ID,
  },
];
