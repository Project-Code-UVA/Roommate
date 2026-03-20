import { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/constants";

// ─── Stub data (replace with real user data from context/queries) ────

const STUB_USER = {
  name: "Alex Johnson",
  school: "UCLA",
  bio: "Early riser, loves hiking and cooking. Looking for a clean, chill roommate near campus.",
  photoUrl: "https://picsum.photos/seed/profile/400/400",
  photos: [
    "https://picsum.photos/seed/p1/400/400",
    "https://picsum.photos/seed/p2/400/400",
    "https://picsum.photos/seed/p3/400/400",
    "https://picsum.photos/seed/p4/400/400",
  ],
  preferences: {
    location: "Westwood, LA",
    cleanliness: "Very tidy",
    sleep_schedule: "Early bird",
    noise_level: "Quiet",
    guests: "Sometimes",
    pets: "Love pets",
    smoking: "Never",
    drinking: "Socially",
    budget: "$1000–$1500",
    looking_for: "Roommate",
  } as Record<string, string>,
};

const PREF_LABELS: Record<string, string> = {
  location: "Location",
  cleanliness: "Cleanliness",
  sleep_schedule: "Sleep Schedule",
  noise_level: "Noise Level",
  guests: "Guests",
  pets: "Pets",
  smoking: "Smoking",
  drinking: "Drinking",
  budget: "Budget",
  looking_for: "Looking For",
};

// ─── Screen ──────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false); // NEW: settings modal state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // NEW: notification toggle state
  const [signingOut, setSigningOut] = useState(false);

  // NEW: sign out handler using existing supabase client
  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      // AuthProvider will detect sign-out and root layout will redirect to (auth)
    } catch {
      Alert.alert("Error", "Failed to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }, [router]);

  // NEW: delete account with confirmation modal
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone. Your data will be permanently removed within 30 days.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // TODO: call deleteAccount service when available
            Alert.alert(
              "Account Scheduled for Deletion",
              "Your account will be deactivated immediately and permanently deleted within 30 days.",
            );
            await supabase.auth.signOut();
            // AuthProvider handles redirect
          },
        },
      ],
    );
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ─── Top bar with settings gear ─── */}
        {/* NEW: gear icon to open settings panel */}
        <View className="flex-row justify-end px-6 pt-2 pb-1">
          <TouchableOpacity onPress={() => setShowSettings(true)} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={26} color={COLORS.gray[700]} />
          </TouchableOpacity>
        </View>

        {/* ─── Profile Header ─── */}
        {/* NEW: profile header with circular photo, name, school, bio */}
        <View className="items-center px-6 pb-6">
          <Image
            source={{ uri: STUB_USER.photoUrl }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60, // NEW: large circular profile photo
              borderWidth: 3,
              borderColor: COLORS.primary[200],
            }}
          />
          {/* // MODIFIED: name text at 26pt matching onboarding font scale */}
          <Text
            style={{ fontSize: 26 }} // MODIFIED: name font bumped to match onboarding scale
            className="font-bold text-gray-900 mt-4"
          >
            {STUB_USER.name}
          </Text>
          <Text
            style={{ fontSize: 18 }} // MODIFIED: school text bumped +2pt
            className="text-primary-600 font-medium mt-1"
          >
            {STUB_USER.school}
          </Text>
          <Text
            style={{ fontSize: 16 }} // MODIFIED: bio snippet bumped +2pt
            className="text-gray-500 text-center mt-2 px-4"
            numberOfLines={3}
          >
            {STUB_USER.bio}
          </Text>
        </View>

        {/* ─── Photos Section ─── */}
        {/* NEW: scrollable photo grid */}
        <View className="px-6 mb-6">
          <Text
            style={{ fontSize: 20 }} // MODIFIED: section heading bumped +2pt
            className="font-bold text-gray-900 mb-3"
          >
            Photos
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {STUB_USER.photos.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 12,
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ─── Preferences Section ─── */}
        {/* NEW: card-style preference display */}
        <View className="px-6 mb-8">
          <Text
            style={{ fontSize: 20 }} // MODIFIED: section heading bumped +2pt
            className="font-bold text-gray-900 mb-3"
          >
            Preferences
          </Text>
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: COLORS.gray[200],
              overflow: "hidden",
            }}
          >
            {Object.entries(STUB_USER.preferences).map(([key, value], idx, arr) => (
              <View
                key={key}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                  borderBottomColor: COLORS.gray[100],
                }}
              >
                {/* // MODIFIED: preference label at 16pt */}
                <Text
                  style={{ fontSize: 16 }} // MODIFIED: pref label bumped +2pt
                  className="text-gray-500"
                >
                  {PREF_LABELS[key] ?? key}
                </Text>
                {/* // MODIFIED: preference value at 16pt */}
                <Text
                  style={{ fontSize: 16 }} // MODIFIED: pref value bumped +2pt
                  className="text-gray-900 font-medium"
                >
                  {value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Settings Modal ─── */}
      {/* NEW: settings panel as a bottom-sheet style modal */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View
            style={{
              backgroundColor: COLORS.white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: 40,
            }}
          >
            {/* Handle bar */}
            <View className="items-center pt-3 pb-4">
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: COLORS.gray[300],
                }}
              />
            </View>

            {/* // MODIFIED: settings title at 22pt */}
            <Text
              style={{ fontSize: 22 }} // MODIFIED: settings heading bumped +2pt
              className="font-bold text-gray-900 px-6 mb-4"
            >
              Settings
            </Text>

            {/* Edit Profile */}
            {/* NEW: edit profile option */}
            <TouchableOpacity
              onPress={() => {
                setShowSettings(false);
                // TODO: navigate to edit profile screen
                Alert.alert("Edit Profile", "Edit profile screen coming soon.");
              }}
              activeOpacity={0.7}
              className="px-6 py-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <Ionicons name="create-outline" size={22} color={COLORS.gray[700]} />
                <Text
                  style={{ fontSize: 18 }} // MODIFIED: option text bumped +2pt
                  className="text-gray-900 ml-3"
                >
                  Edit Profile
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>

            {/* Notification Preferences */}
            {/* NEW: notification toggle (front-end only) */}
            <View className="px-6 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="notifications-outline" size={22} color={COLORS.gray[700]} />
                <Text
                  style={{ fontSize: 18 }} // MODIFIED: option text bumped +2pt
                  className="text-gray-900 ml-3"
                >
                  Notifications
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: COLORS.gray[300], true: COLORS.primary[600] }}
                thumbColor={COLORS.white}
              />
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: COLORS.gray[200], marginVertical: 8 }} />

            {/* Sign Out */}
            {/* NEW: sign out button calling supabase.auth.signOut() */}
            <View className="px-6 mt-2">
              <TouchableOpacity
                onPress={handleSignOut}
                disabled={signingOut}
                activeOpacity={0.85}
                style={{
                  backgroundColor: COLORS.primary[600],
                  borderRadius: 999, // NEW: fully rounded pill shape
                  paddingVertical: 16,
                }}
              >
                <Text
                  style={{ fontSize: 18 }} // MODIFIED: button text bumped +2pt
                  className="text-white font-semibold text-center"
                >
                  {signingOut ? "Signing Out..." : "Sign Out"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Delete Account */}
            {/* NEW: delete account with confirmation modal */}
            <View className="px-6 mt-3 mb-2">
              <TouchableOpacity
                onPress={handleDeleteAccount}
                activeOpacity={0.85}
                style={{
                  borderWidth: 2,
                  borderColor: "#ef4444",
                  borderRadius: 999, // NEW: fully rounded pill shape
                  paddingVertical: 16,
                }}
              >
                <Text
                  style={{ fontSize: 18 }} // MODIFIED: button text bumped +2pt
                  className="text-red-500 font-semibold text-center"
                >
                  Delete Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Close */}
            <TouchableOpacity
              onPress={() => setShowSettings(false)}
              className="items-center mt-2 pb-2"
            >
              <Text
                style={{ fontSize: 16 }}
                className="text-gray-400 font-medium"
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
