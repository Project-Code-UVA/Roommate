import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-primary-600" testID="profile-title">Profile</Text>
        <Text className="mt-2 text-base text-gray-500">Coming Soon</Text>

        {__DEV__ && (
          <Pressable
            testID="dev-sign-out"
            onPress={() => supabase.auth.signOut()}
            className="mt-8 rounded-lg border border-red-300 px-6 py-3"
          >
            <Text className="text-sm text-red-500">DEV: Sign Out</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
