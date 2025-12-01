/**
 * Bundler Configuration
 * 
 * ERC-4337 Bundler endpoints for Sepolia testnet
 * 
 * PUBLIC BUNDLERS (No API key required):
 * - Pimlico: Free public endpoints with rate limits
 * - Biconomy: Public bundler for testing
 * - Candide: Voltaire bundler (may have restrictions)
 * 
 * PRODUCTION: Get your own API keys from:
 * - Pimlico: https://dashboard.pimlico.io
 * - Stackup: https://app.stackup.sh
 * - Alchemy: https://www.alchemy.com
 */

export interface BundlerConfig {
  name: string;
  endpoint: string;
  requiresApiKey: boolean;
  isPublic: boolean;
  chainId: number;
}

// Sepolia chainId
export const SEPOLIA_CHAIN_ID = 11155111;

/**
 * Available bundler endpoints
 * Using dedicated API keys for reliable execution
 */
export const BUNDLER_CONFIGS: BundlerConfig[] = [
  // No public bundlers - all using API keys for reliability
];

/**
 * Get bundler endpoint URLs
 */
export function getBundlerEndpoints(): string[] {
  return BUNDLER_CONFIGS.map(config => config.endpoint);
}

/**
 * Get bundler configuration by name
 */
export function getBundlerConfig(name: string): BundlerConfig | undefined {
  return BUNDLER_CONFIGS.find(config => config.name === name);
}

/**
 * Get bundler endpoints with API keys
 * Using Pimlico and Alchemy for reliable execution
 */
export function getCustomBundlerEndpoints(): string[] {
  const endpoints: string[] = [];
  
  // Pimlico - Primary bundler (best for ERC-4337 + paymaster)
  const pimlicoKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
  if (pimlicoKey) {
    endpoints.push(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${pimlicoKey}`);
  }
  
  // Alchemy - Secondary bundler
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (alchemyKey) {
    endpoints.push(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`);
  }
  
  return endpoints;
}

/**
 * Legacy function for backward compatibility
 */
export function getCustomBundlerEndpoint(): string | null {
  const endpoints = getCustomBundlerEndpoints();
  return endpoints.length > 0 ? endpoints[0] : null;
}

/**
 * Get all available bundler endpoints
 * Uses only API key endpoints for reliability
 */
export function getAllBundlerEndpoints(): string[] {
  const customEndpoints = getCustomBundlerEndpoints();
  
  if (customEndpoints.length === 0) {
    console.warn('⚠️ No bundler API keys configured! Add to .env.local:');
    console.warn('   NEXT_PUBLIC_PIMLICO_API_KEY=your_key');
    console.warn('   NEXT_PUBLIC_ALCHEMY_API_KEY=your_key');
    throw new Error('No bundler API keys configured. Please check .env.local');
  }
  
  console.log(`✅ Using ${customEndpoints.length} bundler endpoint(s) with API keys`);
  return customEndpoints;
}
