/**
 * MessageComposer -- text input with send, camera, and GIF buttons.
 *
 * Features:
 * - Multiline text input with max height
 * - Send button disabled when empty
 * - Camera and GIF action icons
 * - Compact reply preview with dismiss
 */

import React, { useState, useCallback } from "react";
import { View, TextInput, Text, Pressable, Platform, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/lib/constants";
import type { Message } from "@/types/chat";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  readonly onSend: (text: string) => void;
  readonly onCameraPress: () => void;
  readonly onGifPress: () => void;
  readonly replyTo: Message | null;
  readonly onDismissReply: () => void;
  readonly disabled: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageComposer({
  onSend,
  onCameraPress,
  onGifPress,
  replyTo,
  onDismissReply,
  disabled,
}: Props): React.JSX.Element {
  const [text, setText] = useState("");

  const isEmpty = text.trim().length === 0;

  const handleSend = useCallback(() => {
    if (isEmpty || disabled) return;
    onSend(text.trim());
    setText("");
  }, [text, isEmpty, disabled, onSend]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="border-t border-gray-200 bg-white px-3 pb-2 pt-1">
        {/* Reply preview */}
        {replyTo !== null && (
          <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2 mb-1">
            <View className="flex-1">
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {replyTo.body ?? "Media"}
              </Text>
            </View>
            <Pressable
              testID="composer-dismiss-reply"
              onPress={onDismissReply}
              className="ml-2"
            >
              <Ionicons name="close" size={18} color={COLORS.gray[400]} />
            </Pressable>
          </View>
        )}

        {/* Input row */}
        <View className="flex-row items-end gap-2">
          {/* Camera button */}
          <Pressable
            testID="composer-camera-btn"
            onPress={onCameraPress}
            className="pb-2"
          >
            <Ionicons name="camera-outline" size={24} color={COLORS.gray[500]} />
          </Pressable>

          {/* GIF button */}
          <Pressable
            testID="composer-gif-btn"
            onPress={onGifPress}
            className="pb-2"
          >
            <View className="rounded-md border border-gray-400 px-1.5 py-0.5">
              <Text className="text-xs font-bold text-gray-500">GIF</Text>
            </View>
          </Pressable>

          {/* Text input */}
          <View className="flex-1">
            <TextInput
              className="bg-gray-100 rounded-2xl px-4 py-2 text-base text-gray-900 max-h-[120px]"
              placeholder="Type a message..."
              placeholderTextColor={COLORS.gray[400]}
              multiline
              value={text}
              onChangeText={setText}
              editable={!disabled}
            />
          </View>

          {/* Send button */}
          <Pressable
            testID="composer-send-btn"
            onPress={handleSend}
            disabled={isEmpty || disabled}
            accessibilityState={{ disabled: isEmpty || disabled }}
            className="pb-2"
          >
            <Ionicons
              name="send"
              size={24}
              color={isEmpty || disabled ? COLORS.gray[300] : COLORS.primary[600]}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
