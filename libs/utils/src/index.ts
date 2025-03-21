/**
 * Creates a debounced function that delays invoking the provided function until after the specified wait time has elapsed
 * since the last time the debounced function was invoked.
 *
 * @template T - The type of the function to debounce.
 * @param {T} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @returns {(...args: Parameters<T>) => void} - Returns the new debounced function.
 *
 * @example
 * ```typescript
 * const debouncedLog = createDebounce((message: string) => console.log(message), 2000);
 *
 * // This will only log "Hello, World!" once, after 2 seconds, even though the function is called multiple times.
 * debouncedLog("Hello, World!");
 * debouncedLog("Hello, World!");
 * debouncedLog("Hello, World!");
 * ```
 */
export function createDebounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null;

  return (...args: Parameters<T>): void => {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a throttled function that only invokes the provided function at most once per every wait milliseconds.
 *
 * @template T - The type of the function to throttle.
 * @param {T} func - The function to throttle.
 * @param {number} wait - The number of milliseconds to wait before allowing the function to be invoked again.
 * @returns {(...args: Parameters<T>) => void} - Returns the new throttled function.
 *
 * @example
 * ```typescript
 * const throttledLog = createThrottle((message: string) => console.log(message), 2000);
 *
 * // This will only log "Hello, World!" once every 2 seconds, even though the function is called multiple times.
 * throttledLog("Hello, World!");
 * throttledLog("Hello, World!");
 * throttledLog("Hello, World!");
 * ```
 */
export function createThrottle<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>): void => {
    const now = Date.now();

    if (now - lastCall >= wait) {
      lastCall = now;
      func(...args);
    }
  };
}

export async function hasThrown<K>(method: () => Promise<K>): Promise<boolean> {
  try {
    await method();
    return false;
  } catch {
    return true;
  }
}

export function formatStringForDiscordTitles(str: string) {
  return str.replaceAll('.', '․');
}

export function getDirectionSymbol(value: number | null) {
  switch (true) {
    case value && value > 0:
      return `▲`;

    case !value || value === 0:
      return '';

    case value && value < 0:
      return `▼`;

    default:
      return '';
  }
}

export function createChannelName(
  name: string,
  quotation: number,
  delta: number | null
) {
  return [
    name,
    formatStringForDiscordTitles(quotation.toString()),
    formatStringForDiscordTitles(getDirectionSymbol(delta)),
  ]
    .filter(Boolean)
    .join('・');
}
