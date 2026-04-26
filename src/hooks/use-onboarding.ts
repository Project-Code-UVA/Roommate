/**
 * Onboarding progress tracking hook.
 *
 * Persists current step and step data to AsyncStorage so users can
 * resume onboarding after closing the app.
 *
 * Step order: birthday -> phone -> verify-otp -> name -> gender -> school -> photos -> bio -> nitty-gritty
 */

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "onboarding_progress";

export type OnboardingStepId =
  | "birthday"
  | "phone"
  | "verify-otp"
  | "name"
  | "gender"
  | "school"
  | "photos"
  | "bio"
  | "nitty-gritty";

export type OnboardingStep = {
  readonly id: OnboardingStepId;
  readonly label: string;
  readonly route: string;
};

/**
 * All onboarding steps in order.
 * verify-otp is part of the phone step visually (7 visible segments).
 */
export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: "birthday", label: "Birthday", route: "/(auth)/birthday" },
  { id: "phone", label: "Phone", route: "/(auth)/phone" },
  { id: "verify-otp", label: "Verify", route: "/(auth)/verify-otp" },
  { id: "name", label: "Name", route: "/(auth)/name" },
  { id: "gender", label: "Gender", route: "/(auth)/gender" },
  { id: "school", label: "School", route: "/(auth)/school" },
  { id: "photos", label: "Photos", route: "/(auth)/photos" },
  { id: "bio", label: "Bio", route: "/(auth)/bio" },
  { id: "nitty-gritty", label: "Lifestyle", route: "/(auth)/nitty-gritty" },
] as const;

type OnboardingProgress = {
  readonly currentStep: OnboardingStepId;
  readonly [key: string]: unknown;
};

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStepId | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      try {
        const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (mounted && stored) {
          const progress: OnboardingProgress = JSON.parse(stored);
          setCurrentStep(progress.currentStep);
        }
      } finally {
        if (mounted) {
          setIsLoadingProgress(false);
        }
      }
    }

    loadProgress();

    return () => {
      mounted = false;
    };
  }, []);

  const saveProgress = useCallback(
    async (step: OnboardingStepId, data?: Record<string, unknown>) => {
      const existing = await AsyncStorage.getItem(ONBOARDING_KEY);
      const parsed = existing ? JSON.parse(existing) : {};

      const updated: OnboardingProgress = {
        ...parsed,
        ...data,
        currentStep: step,
      };

      await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated));
      setCurrentStep(step);
    },
    [],
  );

  const getProgress = useCallback(async (): Promise<OnboardingProgress | null> => {
    const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  }, []);

  const clearProgress = useCallback(async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setCurrentStep(null);
  }, []);

  const getCurrentStepIndex = useCallback((): number => {
    if (!currentStep) return 0;
    const index = ONBOARDING_STEPS.findIndex((s) => s.id === currentStep);
    return index >= 0 ? index : 0;
  }, [currentStep]);

  return {
    currentStep,
    isLoadingProgress,
    saveProgress,
    getProgress,
    clearProgress,
    getCurrentStepIndex,
  };
}
