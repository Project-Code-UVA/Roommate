/**
 * DateSeparator -- renders a centered date label between message groups.
 *
 * Displays "Today", "Yesterday", or formatted date string.
 */

import * as React from "react";
import { View, Text } from "react-native";

type Props = {
  readonly date: string;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dateStart.getTime() === todayStart.getTime()) {
    return "Today";
  }
  if (dateStart.getTime() === yesterdayStart.getTime()) {
    return "Yesterday";
  }

  const month = MONTHS[date.getMonth()];
  const day = date.getDate();

  if (date.getFullYear() === now.getFullYear()) {
    return `${month} ${day}`;
  }

  return `${month} ${day}, ${date.getFullYear()}`;
}

export function DateSeparator({ date }: Props): React.JSX.Element {
  return (
    <View className="items-center py-2">
      <Text className="text-xs text-gray-500">{formatDateLabel(date)}</Text>
    </View>
  );
}
