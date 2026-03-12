/**
 * MessageReplyPreview -- shows a quoted original message above a reply bubble.
 *
 * Displays sender name and truncated body text with a left purple accent border.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";

type OriginalMessage = {
  readonly body: string | null;
  readonly sender_name: string;
};

type Props = {
  readonly originalMessage: OriginalMessage;
  readonly onPress: () => void;
};

function truncateBody(body: string | null, maxLength: number = 100): string {
  if (body === null) {
    return "";
  }
  if (body.length <= maxLength) {
    return body;
  }
  return body.slice(0, maxLength) + "...";
}

export function MessageReplyPreview({ originalMessage, onPress }: Props): React.JSX.Element {
  const bodyText = truncateBody(originalMessage.body);

  return (
    <Pressable onPress={onPress}>
      <View className="flex-row rounded-lg bg-gray-100 mb-1 overflow-hidden">
        <View className="w-0.5 bg-violet-600" />
        <View className="flex-1 px-2 py-1">
          <Text className="text-xs font-bold text-gray-900">
            {originalMessage.sender_name}
          </Text>
          {bodyText.length > 0 && (
            <Text className="text-xs text-gray-500" numberOfLines={2}>
              {bodyText}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
