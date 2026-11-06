import { useCallback, useEffect, useRef } from 'react';

/**
 * useBarcodeScanner — detects USB/serial barcode scanner input.
 *
 * USB scanners behave like keyboards: they type characters very quickly
 * (typically <30ms between keystrokes) and end with an Enter keypress.
 * We capture the global keydown events and accumulate characters into a
 * buffer.  If a sequence arrives faster than `maxCharIntervalMs` ms and
 * ends with Enter we treat the full string as a barcode scan.
 *
 * The hook also works when the search input is focused — the input's own
 * keydown fires first, so we additionally watch for the "Enter" key while
 * the input has a value that looks like a barcode (all alphanumeric, len≥4).
 */
export interface BarcodeHookOptions {
  /** Called with the decoded barcode string.  Return true to consume the event (stops typing into inputs). */
  onScan: (barcode: string) => void;
  /** Max ms between consecutive keystrokes to consider them part of one scan. Default 60. */
  maxCharIntervalMs?: number;
  /** Min barcode length to trigger. Default 4. */
  minLength?: number;
  /** Whether to intercept the scan and prevent it from being typed into focused inputs. Default true. */
  consume?: boolean;
}

export function useBarcodeScanner({
  onScan,
  maxCharIntervalMs = 60,
  minLength = 4,
  consume = true,
}: BarcodeHookOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    const code = bufferRef.current.trim();
    bufferRef.current = '';
    if (code.length >= minLength) {
      onScan(code);
    }
  }, [minLength, onScan]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const elapsed = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If too much time has passed since last key, reset buffer
      if (elapsed > maxCharIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        // Scanner fires Enter at the end
        if (bufferRef.current.length >= minLength) {
          if (consume) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }
          if (timerRef.current) clearTimeout(timerRef.current);
          flush();
        }
        return;
      }

      // Collect printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Auto-flush after a short delay in case scanner doesn't send Enter
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          flush();
        }, maxCharIntervalMs + 20);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [consume, flush, maxCharIntervalMs, minLength]);

  /** Programmatically process a barcode string (e.g. from camera scanning). */
  const processBarcode = useCallback(
    (barcode: string) => {
      const code = barcode.trim();
      if (code.length >= minLength) {
        onScan(code);
      }
    },
    [minLength, onScan]
  );

  return { processBarcode };
}
