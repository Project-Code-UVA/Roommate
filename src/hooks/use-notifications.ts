/**
 * Hook to initialize push notification listeners at app start.
 *
 * Handles:
 * - Token registration on mount
 * - Foreground notification display
 * - Tap-to-navigate on notification tap
 */

import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

import {
  registerForPushNotifications,
  getLastNotificationResponse,
} from "@/services/notification-service";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotifications(userId: string | undefined) {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!userId) return;

    // Register push token
    registerForPushNotifications(userId);

    // Handle notification received while app is in foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((_notification) => {
        // Foreground notifications are shown by the handler config
      });

    // Handle notification tap (app in background or cold start)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        navigateFromNotification(data, router);
      });

    // Check for cold-start notification
    getLastNotificationResponse().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        navigateFromNotification(data, router);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [userId, router]);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function navigateFromNotification(
  data: Record<string, unknown>,
  router: ReturnType<typeof useRouter>,
) {
  const type = data.type as string | undefined;

  if (type === "message" && data.threadId) {
    const threadId = data.threadId as string;
    const otherUserId = (data.otherUserId as string) ?? "";
    const otherName = (data.otherName as string) ?? "";
    const otherAvatar = (data.otherAvatar as string) ?? "";

    router.push(
      `/chat/${threadId}?otherUserId=${otherUserId}&otherName=${encodeURIComponent(otherName)}&otherAvatar=${encodeURIComponent(otherAvatar)}` as never,
    );
  } else if (type === "match") {
    router.push("/(tabs)/likes" as never);
  }
}
