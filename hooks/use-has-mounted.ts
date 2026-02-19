import { useSyncExternalStore } from "react";

/**
 * useHasMounted - Returns true after component has mounted on client
 *
 * Uses useSyncExternalStore for proper hydration handling without
 * triggering the "setState in useEffect" lint warning.
 *
 * Use this to conditionally render client-only content that would
 * cause hydration mismatches (e.g., Radix UI components that generate
 * random IDs on server vs client).
 */
const emptySubscribe = () => () => {};
const getServerSnapshot = () => false;
const getClientSnapshot = () => true;

export function useHasMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
}
