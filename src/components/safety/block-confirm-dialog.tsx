/**
 * Block confirmation Alert.alert wrapper.
 *
 * Pure function (not a component) that shows a consistent block confirmation
 * dialog across all surfaces per UI-SPEC copywriting contract.
 */

import { Alert } from "react-native";

// ---------------------------------------------------------------------------
// Show block confirmation dialog
// ---------------------------------------------------------------------------

export function showBlockConfirmDialog(
  userName: string,
  onConfirm: () => void,
): void {
  Alert.alert(
    `Block ${userName}?`,
    "They won't be able to see your profile or message you. You won't see them anywhere in the app.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Block", style: "destructive", onPress: onConfirm },
    ],
  );
}
