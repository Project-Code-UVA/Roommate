import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LikesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-primary-600">Likes</Text>
        <Text className="mt-2 text-base text-gray-500">Coming Soon</Text>
      </View>
    </SafeAreaView>
  );
}
