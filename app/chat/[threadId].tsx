/**
 * Individual chat screen -- full messaging experience.
 *
 * Wires all chat components: header, message list, composer,
 * icebreaker, long-press menu, GIF panel, photo preview, and
 * report bottom sheet. Manages state for all interaction flows.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ChatHeader } from "@/components/chat/chat-header";
import { GifSearchPanel } from "@/components/chat/gif-search-panel";
import { IcebreakerCard } from "@/components/chat/icebreaker-card";
import { MessageComposer } from "@/components/chat/message-composer";
import { MessageList } from "@/components/chat/message-list";
import { MessageLongPress } from "@/components/chat/message-long-press";
import { PhotoPreview } from "@/components/chat/photo-preview";
import { EnforcementModal } from "@/components/safety/enforcement-modal";
import { useSession } from "@/contexts/auth-context";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useEnforcement } from "@/hooks/use-enforcement";
import { useMessageActions } from "@/hooks/use-message-actions";
import { COLORS } from "@/lib/constants";
import { blockFromChat } from "@/services/block-service";
import { submitReport } from "@/services/report-service";
import type { Message, MessageReaction, ReportCategory } from "@/types/chat";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GIF_PANEL_HEIGHT = 300;

const REPORT_CATEGORIES: readonly {
  readonly value: ReportCategory;
  readonly label: string;
}[] = [
  { value: "harassment", label: "Harassment" },
  { value: "sexual_content", label: "Sexual Content" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "spam", label: "Spam" },
  { value: "impersonation", label: "Impersonation" },
  { value: "underage", label: "Underage" },
  { value: "safety_threat", label: "Safety Threat" },
  { value: "other", label: "Other" },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    threadId: string;
    otherUserId: string;
    otherName: string;
    otherAvatar: string;
  }>();

  const threadId = params.threadId ?? "";
  const otherUserId = params.otherUserId ?? "";
  const otherName = decodeURIComponent(params.otherName ?? "");
  const otherAvatar = decodeURIComponent(params.otherAvatar ?? "") || null;

  const { session } = useSession();
  const currentUserId = session?.user.id ?? "";

  // Hooks
  const { messages, isLoading, hasMore, loadMore } = useChatMessages(
    threadId,
    currentUserId,
  );
  const {
    sendText,
    sendMedia,
    sendReaction,
    removeReaction,
    sendReply,
    copyText,
    deleteForMe,
  } = useMessageActions(threadId, currentUserId);

  // Enforcement info for DM ban modal (D-05)
  const { enforcementInfo } = useEnforcement(currentUserId);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showDmBanModal, setShowDmBanModal] = useState(false);
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [showLongPress, setShowLongPress] = useState(false);
  const [longPressMessage, setLongPressMessage] = useState<Message | null>(
    null,
  );
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [icebreakerDismissed, setIcebreakerDismissed] = useState(true);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

  // Reactions map (empty for now; would be populated from a separate query)
  const reactionsMap = useRef(new Map<string, readonly MessageReaction[]>());

  // ---------------------------------------------------------------------------
  // Icebreaker dismissed state (AsyncStorage)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function checkDismissed() {
      const key = `icebreaker_dismissed_${threadId}`;
      const val = await AsyncStorage.getItem(key);
      setIcebreakerDismissed(val === "true");
    }
    checkDismissed();
  }, [threadId]);

  const handleDismissIcebreaker = useCallback(async () => {
    const key = `icebreaker_dismissed_${threadId}`;
    await AsyncStorage.setItem(key, "true");
    setIcebreakerDismissed(true);
  }, [threadId]);

  const handleSelectPrompt = useCallback(
    async (text: string) => {
      const result = await sendText(text, replyingTo?.id);
      if (result.error === "under_enforcement") {
        setShowDmBanModal(true);
        return;
      }
      handleDismissIcebreaker();
    },
    [sendText, replyingTo, handleDismissIcebreaker],
  );

  // ---------------------------------------------------------------------------
  // Message actions
  // ---------------------------------------------------------------------------

  const handleSendText = useCallback(
    async (text: string) => {
      const result = await sendText(text, replyingTo?.id);
      if (result.error === "under_enforcement") {
        setShowDmBanModal(true);
        return;
      }
      setReplyingTo(null);
    },
    [sendText, replyingTo],
  );

  const handleLongPress = useCallback((message: Message) => {
    setLongPressMessage(message);
    setShowLongPress(true);
  }, []);

  const closeLongPress = useCallback(() => {
    setShowLongPress(false);
    setLongPressMessage(null);
  }, []);

  const handleReact = useCallback(
    (emoji: string) => {
      if (longPressMessage) {
        sendReaction(longPressMessage.id, emoji);
      }
      closeLongPress();
    },
    [longPressMessage, sendReaction, closeLongPress],
  );

  const handleReplyFromMenu = useCallback(() => {
    if (longPressMessage) {
      setReplyingTo(longPressMessage);
    }
    closeLongPress();
  }, [longPressMessage, closeLongPress]);

  const handleCopy = useCallback(() => {
    if (longPressMessage?.body) {
      copyText(longPressMessage.body);
    }
    closeLongPress();
  }, [longPressMessage, copyText, closeLongPress]);

  const handleDeleteForMe = useCallback(() => {
    if (longPressMessage) {
      deleteForMe(longPressMessage.id);
    }
    closeLongPress();
  }, [longPressMessage, deleteForMe, closeLongPress]);

  const handleReportFromMenu = useCallback(() => {
    closeLongPress();
    setShowReportSheet(true);
  }, [closeLongPress]);

  const handleDismissReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Image press (full-screen viewer)
  // ---------------------------------------------------------------------------

  const handleImagePress = useCallback((mediaUrl: string) => {
    setImageViewerUrl(mediaUrl);
  }, []);

  // ---------------------------------------------------------------------------
  // Reaction press on a bubble
  // ---------------------------------------------------------------------------

  const handleReactionPress = useCallback(
    (messageId: string, emoji: string) => {
      sendReaction(messageId, emoji);
    },
    [sendReaction],
  );

  // ---------------------------------------------------------------------------
  // Reply press (scroll to original -- for now just log)
  // ---------------------------------------------------------------------------

  const handleReplyPress = useCallback((_messageId: string) => {
    // In a future iteration, scroll to the original message.
    // For now this is a no-op as the reply preview is inline.
  }, []);

  // ---------------------------------------------------------------------------
  // Camera / Photo
  // ---------------------------------------------------------------------------

  const handleCameraPress = useCallback(() => {
    Keyboard.dismiss();
    setShowGifPanel(false);

    Alert.alert("Add Photo", undefined, [
      {
        text: "Take Photo",
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
            allowsEditing: true,
          });
          if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
          }
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
            allowsEditing: true,
          });
          if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, []);

  const handlePhotoSend = useCallback(
    async (uri: string, caption?: string) => {
      // For MVP, send the local URI as media_url.
      // In production, upload to Supabase Storage first.
      const result = await sendMedia(uri, caption);
      if (result.error === "under_enforcement") {
        setShowDmBanModal(true);
        return;
      }
      setPhotoUri(null);
    },
    [sendMedia],
  );

  const handlePhotoCancel = useCallback(() => {
    setPhotoUri(null);
  }, []);

  // ---------------------------------------------------------------------------
  // GIF
  // ---------------------------------------------------------------------------

  const handleGifPress = useCallback(() => {
    Keyboard.dismiss();
    setShowGifPanel((prev) => !prev);
  }, []);

  const handleSelectGif = useCallback(
    async (gif: { readonly url: string }) => {
      const result = await sendMedia(gif.url);
      if (result.error === "under_enforcement") {
        setShowDmBanModal(true);
        return;
      }
      setShowGifPanel(false);
    },
    [sendMedia],
  );

  const handleCloseGifPanel = useCallback(() => {
    setShowGifPanel(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Header actions
  // ---------------------------------------------------------------------------

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handlePressProfile = useCallback(() => {
    // Profile bottom sheet -- future iteration
  }, []);

  const handlePressBlock = useCallback(() => {
    Alert.alert(`Block ${otherName}?`, "They won't be able to contact you.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          await blockFromChat(currentUserId, otherUserId);
          router.back();
        },
      },
    ]);
  }, [otherName, currentUserId, otherUserId, router]);

  const handlePressReport = useCallback(() => {
    setShowReportSheet(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Report submission
  // ---------------------------------------------------------------------------

  const handleSubmitReport = useCallback(
    async (category: ReportCategory) => {
      await submitReport(currentUserId, otherUserId, category);
      setShowReportSheet(false);
      Alert.alert("Report Submitted", "Thank you for helping keep Room safe.");
    },
    [currentUserId, otherUserId],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const otherUser = {
    id: otherUserId,
    display_name: otherName,
    avatar_url: otherAvatar,
  };

  const showIcebreaker =
    !icebreakerDismissed && messages.length === 0 && !isLoading;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Chat header */}
        <ChatHeader
          otherUser={otherUser}
          onBack={handleBack}
          onPressProfile={handlePressProfile}
          onPressBlock={handlePressBlock}
          onPressReport={handlePressReport}
        />

        {/* Message list */}
        <View style={styles.flex}>
          <MessageList
            messages={messages as Message[]}
            currentUserId={currentUserId}
            reactions={reactionsMap.current}
            onLongPress={handleLongPress}
            onImagePress={handleImagePress}
            onReactionPress={handleReactionPress}
            onReplyPress={handleReplyPress}
            onEndReached={hasMore ? loadMore : () => {}}
            isLoading={isLoading}
            ListEmptyComponent={
              showIcebreaker ? (
                <View style={styles.icebreakerWrapper}>
                  <IcebreakerCard
                    onSelectPrompt={handleSelectPrompt}
                    onDismiss={handleDismissIcebreaker}
                  />
                </View>
              ) : undefined
            }
          />
        </View>

        {/* Photo preview overlay */}
        {photoUri && (
          <PhotoPreview
            uri={photoUri}
            onSend={handlePhotoSend}
            onCancel={handlePhotoCancel}
          />
        )}

        {/* GIF panel */}
        {showGifPanel && (
          <GifSearchPanel
            onSelectGif={handleSelectGif}
            onClose={handleCloseGifPanel}
            height={GIF_PANEL_HEIGHT}
          />
        )}

        {/* Composer */}
        <MessageComposer
          onSend={handleSendText}
          onCameraPress={handleCameraPress}
          onGifPress={handleGifPress}
          replyTo={replyingTo}
          onDismissReply={handleDismissReply}
          disabled={false}
        />
      </KeyboardAvoidingView>

      {/* Long-press overlay */}
      <MessageLongPress
        visible={showLongPress}
        message={longPressMessage}
        onReact={handleReact}
        onReply={handleReplyFromMenu}
        onCopy={handleCopy}
        onDelete={handleDeleteForMe}
        onReport={handleReportFromMenu}
        onOpenEmojiPicker={() => {}}
        onClose={closeLongPress}
      />

      {/* Full-screen image viewer */}
      {imageViewerUrl && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setImageViewerUrl(null)}
        >
          <Pressable
            style={styles.imageViewerBackdrop}
            onPress={() => setImageViewerUrl(null)}
          >
            <View style={styles.imageViewerContainer}>
              <Pressable
                style={styles.imageViewerClose}
                onPress={() => setImageViewerUrl(null)}
              >
                <Text style={styles.imageViewerCloseText}>Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Report bottom sheet (simplified as Modal) */}
      <Modal
        visible={showReportSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportSheet(false)}
      >
        <View style={styles.reportBackdrop}>
          <Pressable
            style={styles.reportDismissArea}
            onPress={() => setShowReportSheet(false)}
          />
          <View style={styles.reportSheet}>
            <View style={styles.reportHandle} />
            <Text style={styles.reportTitle}>Report User</Text>
            <ScrollView>
              {REPORT_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  style={styles.reportOption}
                  onPress={() => handleSubmitReport(cat.value)}
                  testID={`report-${cat.value}`}
                >
                  <Text style={styles.reportOptionText}>{cat.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DM ban enforcement modal (D-05) */}
      <EnforcementModal
        variant="dm_ban"
        endDate={enforcementInfo?.endAt ?? null}
        visible={showDmBanModal}
        onDismiss={() => setShowDmBanModal(false)}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  flex: {
    flex: 1,
  },
  icebreakerWrapper: {
    transform: [{ scaleY: -1 }],
  },
  imageViewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerContainer: {
    width: "100%",
    alignItems: "center",
  },
  imageViewerClose: {
    position: "absolute",
    top: -60,
    right: 20,
    padding: 8,
  },
  imageViewerCloseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  reportBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  reportDismissArea: {
    flex: 1,
  },
  reportSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 16,
    maxHeight: "60%",
  },
  reportHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray[300],
    alignSelf: "center",
    marginBottom: 16,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  reportOption: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  reportOptionText: {
    fontSize: 16,
    color: COLORS.gray[700],
  },
});
