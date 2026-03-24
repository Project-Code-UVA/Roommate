/**
 * Hook for enforcement state on app lifecycle.
 *
 * Fetches enforcement info on mount and provides warning modal state.
 * Warning modal shown on next app open per D-07.
 * Permanent ban signals handled at the layout level (Plan 03).
 */

import { useCallback, useEffect, useState } from "react";

import { getEnforcementInfo } from "@/services/enforcement-service";
import type { EnforcementInfo } from "@/types/safety";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

type UseEnforcementResult = {
  readonly enforcementInfo: EnforcementInfo | null;
  readonly isLoading: boolean;
  readonly showWarningModal: boolean;
  readonly dismissWarning: () => void;
};

export function useEnforcement(
  userId: string | undefined,
): UseEnforcementResult {
  const [enforcementInfo, setEnforcementInfo] =
    useState<EnforcementInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function fetchEnforcement() {
      const info = await getEnforcementInfo(userId!);

      if (!mounted) return;

      setEnforcementInfo(info);
      setIsLoading(false);

      // Show warning modal on next app open (D-07)
      if (info.state === "warning") {
        setShowWarningModal(true);
      }
    }

    fetchEnforcement();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const dismissWarning = useCallback(() => {
    setShowWarningModal(false);
  }, []);

  return {
    enforcementInfo,
    isLoading,
    showWarningModal,
    dismissWarning,
  };
}
