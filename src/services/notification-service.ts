/**
 * Notification service — register push token, handle foreground/tap events.
 *
 * Uses expo-notifications for permissions and token registration.
 * Tokens are stored server-side via push-token-service for delivery.
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { registerPushToken, removePushToken } from "@/services/push-token-service";

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions and register push token.
 * Returns the Expo push token or null if not available.
 */
export async function registerForPushNotifications(
  userId: string,
): Promise<string | null> {
  if (!Device.isDevice) {
    // Push notifications only work on physical devices
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  // Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Register on server
  const platform = Platform.OS === "ios" ? "ios" : "android";
  await registerPushToken(userId, token, platform as "ios" | "android");

  return token;
}

/**
 * Remove push token on sign-out.
 */
export async function unregisterPushNotifications(
  userId: string,
  token: string,
): Promise<void> {
  await removePushToken(userId, token);
}

/**
 * Get the notification that caused the app to open (cold start).
 */
export async function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}
