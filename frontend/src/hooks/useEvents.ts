import { useEffect, useRef, useState } from 'react';
import { scValToNative, xdr } from '@stellar/stellar-sdk';
import { CONTRACT_ID, server } from '../lib/stellar';
import type { ActivityItem } from '../types';

const POLL_INTERVAL_MS = 4000;
const MAX_FEED_ITEMS = 25;

/**
 * Real-time integration note:
 * Public Soroban RPC endpoints do not currently offer a reliable WebSocket
 * subscription for contract events, so this hook polls `getEvents` on a
 * short interval instead. Each tick only asks for events *after* the last
 * ledger we've already processed, so it stays cheap and never re-announces
 * the same vote twice.
 */
export function useEvents(optionLabels: string[], onVote: () => void) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const cursorLedger = useRef<number | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const labelsRef = useRef(optionLabels);
  labelsRef.current = optionLabels;

  useEffect(() => {
    if (!CONTRACT_ID) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      try {
        if (cursorLedger.current === null) {
          const latest = await server.getLatestLedger();
          // Start a little behind "now" so we don't miss a vote that lands
          // between page load and the first poll.
          cursorLedger.current = Math.max(latest.sequence - 20, 1);
        }

        const res = await server.getEvents({
          startLedger: cursorLedger.current,
          filters: [
            {
              type: 'contract',
              contractIds: [CONTRACT_ID],
            },
          ],
          limit: 50,
        });

        if (!cancelled && res.events.length > 0) {
          const newItems: ActivityItem[] = [];

          for (const event of res.events) {
            const id = `${event.id}`;
            if (seenIds.current.has(id)) continue;

            const topics = event.topic.map((t: xdr.ScVal) => scValToNative(t));
            if (topics[0] !== 'VoteCast') continue;

            const voter = topics[1] as string;
            const option = scValToNative(event.value) as number;
            seenIds.current.add(id);

            newItems.push({
              id,
              voter,
              option,
              optionLabel: labelsRef.current[option] ?? `Option ${option}`,
              timestamp: Date.now(),
            });
          }

          if (newItems.length > 0) {
            setActivity((prev) => [...newItems.reverse(), ...prev].slice(0, MAX_FEED_ITEMS));
            onVote();
          }
        }

        if (!cancelled && res.latestLedger) {
          cursorLedger.current = res.latestLedger + 1;
        }
      } catch (err) {
        // Non-fatal — just log and retry on the next tick.
        console.error('[live-poll] event poll failed:', err);
      } finally {
        if (!cancelled) {
          timer = setTimeout(tick, POLL_INTERVAL_MS);
        }
      }
    }

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onVote]);

  return { activity };
}
