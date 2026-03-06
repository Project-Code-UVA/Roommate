import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { BRAND_COLOR } from "@/lib/constants";
import { useSession } from "@/contexts/auth-context";

export default function TabLayout() {
  const { session, isLoading, onboardingComplete } = useSession();

  // Keep splash screen visible while loading
  if (isLoading) {
    return null;
  }

  // Unauthenticated -> welcome screen
  if (!session) {
    return <Redirect href="/welcome" />;
  }

  // Authenticated but not onboarded -> onboarding flow
  if (!onboardingComplete) {
    return <Redirect href="/(auth)/birthday" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND_COLOR,
        headerShown: false,
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
            <Ionicons
              name={focused ? "heart" : "heart-outline"}
              size={24}
              color={color}
            />
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
            <Ionicons
              name={focused ? "chatbubble" : "chatbubble-outline"}
              size={24}
              color={color}
            />
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
