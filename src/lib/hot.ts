'use client';

import { CONTRACT_ID } from './near';
import { buildAddAccessKeyAction } from './access-key';

// HotConnector type reference (avoids top-level import which breaks SSR)
type HotConnectorType = import('@hot-labs/kit').HotConnector;

let _hot: HotConnectorType | null = null;
let _initPromise: Promise<HotConnectorType> | null = null;

// Lazy init: dynamically imports HOT Kit only on client
async function initHotConnector(): Promise<HotConnectorType> {
  if (_hot) return _hot;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const { HotConnector } = await import('@hot-labs/kit');
    const { defaultConnectors } = await import('@hot-labs/kit/defaults');

    _hot = new HotConnector({
      apiKey: process.env.NEXT_PUBLIC_HOT_API_KEY || '',
      connectors: defaultConnectors,
      walletConnect: {
        projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
        metadata: {
          name: 'Whisper Protocol',
          description: 'E2E encrypted messaging on NEAR',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`],
        },
      },
    });

    return _hot;
  })();

  return _initPromise;
}

// Sync getter — returns null on server or before init
export function getHotConnector(): HotConnectorType | null {
  return _hot;
}

// Async getter — initializes if needed
export async function ensureHotConnector(): Promise<HotConnectorType> {
  if (typeof window === 'undefined') {
    throw new Error('HotConnector can only be used in browser');
  }
  return initHotConnector();
}

// Helper: get the connected NEAR account ID
export function getNearAccountId(): string | null {
  return _hot?.near?.address ?? null;
}

// Helper: send a single NEAR function call transaction
export async function callContract(
  methodName: string,
  args: object,
  gas = '30000000000000',
  deposit = '0',
): Promise<string> {
  const hot = await ensureHotConnector();
  const nearWallet = hot.near;
  if (!nearWallet) throw new Error('NEAR wallet not connected');

  console.log(`[whisper] callContract: ${methodName}`, args);
  try {
    const result = await nearWallet.sendTransaction({
      receiverId: CONTRACT_ID,
      actions: [
        {
          type: 'FunctionCall',
          params: { methodName, args, gas, deposit },
        },
      ],
    });
    console.log(`[whisper] callContract success:`, result);
    return result;
  } catch (err) {
    console.error(`[whisper] callContract failed:`, err);
    throw err;
  }
}

// Helper: add a FunctionCall access key via HOT Kit (requires wallet approval)
export async function addFunctionCallAccessKey(
  publicKey: string,
): Promise<string> {
  const hot = await ensureHotConnector();
  const nearWallet = hot.near;
  if (!nearWallet) throw new Error('NEAR wallet not connected');

  const action = buildAddAccessKeyAction(publicKey);

  console.log(`[whisper] addFunctionCallAccessKey for ${publicKey}`);
  try {
    const result = await nearWallet.sendTransaction({
      receiverId: nearWallet.address,
      actions: [action as any],
    });
    console.log(`[whisper] addFunctionCallAccessKey success:`, result);
    return result;
  } catch (err) {
    console.error(`[whisper] addFunctionCallAccessKey failed:`, err);
    throw err;
  }
}
