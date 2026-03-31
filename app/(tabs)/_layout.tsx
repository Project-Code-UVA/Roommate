import { useCallback, useEffect, useState } from "react";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { BRAND_COLOR } from "@/lib/constants";
import { useSession } from "@/contexts/auth-context";
import { getTotalUnreadCount } from "@/services/thread-service";
import { getLikedMeCount } from "@/services/likes-service";

function UnreadBadge({ count }: { readonly count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <View style={badgeStyles.container}>
      <Text style={badgeStyles.text}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: "#FF3B30",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  text: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});

export default function TabLayout() {
  const { session, isLoading, onboardingComplete } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [likedMeCount, setLikedMeCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!session?.user.id) return;
    const { count } = await getTotalUnreadCount(session.user.id);
    setUnreadCount(count);
  }, [session?.user.id]);

  const fetchLikedMeCount = useCallback(async () => {
    if (!session?.user.id) return;
    const { count } = await getLikedMeCount(session.user.id);
    setLikedMeCount(count);
  }, [session?.user.id]);

  useEffect(() => {
    fetchUnread();
    fetchLikedMeCount();
    // Poll every 30 seconds for unread count
    const unreadInterval = setInterval(fetchUnread, 30_000);
    // Poll every 60 seconds for liked-me count (changes less frequently)
    const likedMeInterval = setInterval(fetchLikedMeCount, 60_000);
    return () => {
      clearInterval(unreadInterval);
      clearInterval(likedMeInterval);
    };
  }, [fetchUnread, fetchLikedMeCount]);

  // Keep splash screen visible while loading
  if (isLoading) {
    return null;
  }

  // Unauthenticated -> welcome screen
  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Authenticated but not onboarded -> onboarding flow
  if (!onboardingComplete) {
    return <Redirect href="/(auth)/birthday" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(245,245,245,0.95)",
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarInactiveTintColor: "rgba(0,0,0,0.35)",
        tabBarActiveTintColor: BRAND_COLOR,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "compass" : "compass-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: "Likes",
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons
                name={focused ? "heart" : "heart-outline"}
                size={24}
                color={color}
              />
              <UnreadBadge count={likedMeCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Discovery",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons
                name={focused ? "chatbubble" : "chatbubble-outline"}
                size={24}
                color={color}
              />
              <UnreadBadge count={unreadCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
