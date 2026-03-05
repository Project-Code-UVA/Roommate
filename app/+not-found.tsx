import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center bg-white p-5">
        <Text className="text-xl font-bold text-gray-900">
          This screen does not exist.
        </Text>
        <Link href="/" className="mt-4 py-4">
          <Text className="text-primary-600 text-base">Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}
