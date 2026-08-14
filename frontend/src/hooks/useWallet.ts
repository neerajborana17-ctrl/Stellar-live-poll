import { useCallback, useEffect, useState } from 'react';
import { walletsKit } from '../lib/stellar';
import { toAppError } from '../lib/contract';
import type { AppError } from '../types';

const STORAGE_KEY = 'stellar-live-poll:last-wallet-id';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Reconnect silently on reload if the user connected before in this browser.
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId) return;
    walletsKit.setWallet(savedId);
    walletsKit
      .getAddress()
      .then(({ address: a }) => setAddress(a))
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      });
  }, []);

  const connect = useCallback(async (): Promise<AppError | null> => {
    setConnecting(true);
    try {
      let resolvedError: AppError | null = null;
      await walletsKit.openModal({
        onWalletSelected: async (option) => {
          try {
            walletsKit.setWallet(option.id);
            const { address: a } = await walletsKit.getAddress();
            setAddress(a);
            localStorage.setItem(STORAGE_KEY, option.id);
          } catch (err) {
            console.error('[live-poll] wallet connect failed:', err);
            resolvedError = toAppError('WALLET_UNAVAILABLE');
          }
        },
      });
      return resolvedError;
    } catch (err) {
      console.error('[live-poll] wallet modal failed:', err);
      return toAppError('WALLET_UNAVAILABLE');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { address, isConnected: !!address, connecting, connect, disconnect };
}
