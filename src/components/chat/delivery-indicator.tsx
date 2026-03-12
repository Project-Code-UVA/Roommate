/**
 * DeliveryIndicator -- displays message delivery status icons.
 *
 * Follows WhatsApp-style checkmarks:
 * - sending: clock icon
 * - sent: single checkmark
 * - delivered: double checkmark (gray)
 * - read: double checkmark (purple/primary)
 * - failed: red alert icon
 */

import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/lib/constants";
import type { DeliveryStatus } from "@/types/chat";

type Props = {
  readonly status: DeliveryStatus | "failed";
};

const ICON_SIZE = 14;

export function DeliveryIndicator({ status }: Props): React.JSX.Element {
  switch (status) {
    case "sending":
      return (
        <View testID="delivery-sending" className="flex-row items-center">
          <Ionicons name="time-outline" size={ICON_SIZE} color={COLORS.gray[400]} />
        </View>
      );
    case "sent":
      return (
        <View testID="delivery-sent" className="flex-row items-center">
          <Ionicons name="checkmark" size={ICON_SIZE} color={COLORS.gray[400]} />
        </View>
      );
    case "delivered":
      return (
        <View testID="delivery-delivered" className="flex-row items-center">
          <Ionicons name="checkmark-done-outline" size={ICON_SIZE} color={COLORS.gray[400]} />
        </View>
      );
    case "read":
      return (
        <View testID="delivery-read" className="flex-row items-center">
          <Ionicons name="checkmark-done-outline" size={ICON_SIZE} color={COLORS.primary[500]} />
        </View>
      );
    case "failed":
      return (
        <View testID="delivery-failed" className="flex-row items-center">
          <Ionicons name="alert-circle" size={ICON_SIZE} color="#ef4444" />
        </View>
      );
  }
}
