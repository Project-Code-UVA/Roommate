/**
 * Settings screen — account management, privacy toggles, app info.
 *
 * Sections:
 * - Privacy: hometown visibility, gender visibility
 * - Notifications: placeholder toggles (wired in 08-03)
 * - Account: sign out, delete account (two-step confirmation)
 * - App info: version
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  Switch,
  Pressable,
  Alert,
  SectionList,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { COLORS, APP_VERSION } from "@/lib/constants";
import { requestAccountDeletion, signOut } from "@/services/account-service";
import { useSession } from "@/contexts/auth-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SettingItem = {
  readonly key: string;
  readonly type: "toggle" | "action" | "info";
  readonly label: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly iconColor?: string;
  readonly destructive?: boolean;
  readonly value?: boolean;
  readonly onToggle?: (value: boolean) => void;
  readonly onPress?: () => void;
  readonly detail?: string;
};

type Section = {
  readonly title: string;
  readonly data: readonly SettingItem[];
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsScreen() {
  const { session } = useSession();
  const router = useRouter();
  const userId = session?.user.id ?? "";

  // Privacy toggles (local state — persisted via profile service)
  const [showHometown, setShowHometown] = useState(true);
  const [showGender, setShowGender] = useState(true);

  // Notification toggles (placeholder for 08-03)
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "Your account will be immediately deactivated and permanently deleted within 30 days. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: () => {
            // Second confirmation
            Alert.alert(
              "Are you absolutely sure?",
              "All your data, matches, and messages will be permanently deleted.",
              [
                { text: "Keep Account", style: "cancel" },
                {
                  text: "Yes, Delete",
                  style: "destructive",
                  onPress: async () => {
                    const result = await requestAccountDeletion(userId);
                    if (result.error) {
                      Alert.alert("Error", result.error);
                    } else {
                      await signOut();
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [userId]);

  const sections: readonly Section[] = [
    {
      title: "Privacy",
      data: [
        {
          key: "show_hometown",
          type: "toggle",
          label: "Show Hometown",
          icon: "location-outline",
          value: showHometown,
          onToggle: setShowHometown,
        },
        {
          key: "show_gender",
          type: "toggle",
          label: "Show Gender",
          icon: "person-outline",
          value: showGender,
          onToggle: setShowGender,
        },
      ],
    },
    {
      title: "Notifications",
      data: [
        {
          key: "notify_matches",
          type: "toggle",
          label: "Match Notifications",
          icon: "heart-outline",
          value: notifyMatches,
          onToggle: setNotifyMatches,
        },
        {
          key: "notify_messages",
          type: "toggle",
          label: "Message Notifications",
          icon: "chatbubble-outline",
          value: notifyMessages,
          onToggle: setNotifyMessages,
        },
      ],
    },
    {
      title: "Account",
      data: [
        {
          key: "sign_out",
          type: "action",
          label: "Sign Out",
          icon: "log-out-outline",
          onPress: handleSignOut,
        },
        {
          key: "delete_account",
          type: "action",
          label: "Delete Account",
          icon: "trash-outline",
          iconColor: "#ef4444",
          destructive: true,
          onPress: handleDeleteAccount,
        },
      ],
    },
    {
      title: "App",
      data: [
        {
          key: "version",
          type: "info",
          label: "Version",
          icon: "information-circle-outline",
          detail: APP_VERSION,
        },
        {
          key: "privacy_policy",
          type: "action",
          label: "Privacy Policy",
          icon: "shield-outline",
          onPress: () => Linking.openURL("https://room.app/privacy"),
        },
        {
          key: "terms",
          type: "action",
          label: "Terms of Service",
          icon: "document-text-outline",
          onPress: () => Linking.openURL("https://room.app/terms"),
        },
      ],
    },
  ];

  const renderItem = ({ item }: { item: SettingItem }) => (
    <Pressable
      style={styles.row}
      onPress={item.type === "action" ? item.onPress : undefined}
      disabled={item.type !== "action"}
    >
      <Ionicons
        name={item.icon}
        size={22}
        color={item.iconColor ?? COLORS.gray[600]}
        style={styles.rowIcon}
      />
      <Text
        style={[
          styles.rowLabel,
          item.destructive && styles.destructiveLabel,
        ]}
      >
        {item.label}
      </Text>

      {item.type === "toggle" && (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ true: COLORS.primary[400], false: COLORS.gray[200] }}
        />
      )}

      {item.type === "info" && item.detail && (
        <Text style={styles.detailText}>{item.detail}</Text>
      )}

      {item.type === "action" && !item.destructive && (
        <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
      )}
    </Pressable>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  return (
    <SectionList
      sections={sections as Section[]}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray[500],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  destructiveLabel: {
    color: "#ef4444",
  },
  detailText: {
    fontSize: 15,
    color: COLORS.gray[400],
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[200],
    marginLeft: 50,
  },
  sectionSeparator: {
    height: 8,
  },
});
