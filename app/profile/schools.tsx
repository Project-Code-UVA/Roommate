/**
 * My Schools sub-page — add and remove schools.
 *
 * Uses the same SchoolSearch component from onboarding,
 * pre-populated with the user's current schools.
 */

import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { SchoolSearch } from "@/components/onboarding/school-search";
import {
  getUserSchools,
  addUserSchool,
  removeUserSchool,
} from "@/services/school-service";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";
import type { School } from "@/components/onboarding/school-search";

export default function MySchoolsScreen() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getUserSchools(userId);
      if (!cancelled) {
        setSchools(result);
        setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const handleAdd = useCallback(
    async (school: School) => {
      const { error } = await addUserSchool(userId, school.id);
      if (error) {
        Alert.alert("Error", `Failed to add school: ${error}`);
        return;
      }
      setSchools((prev) => [...prev, school]);
    },
    [userId],
  );

  const handleRemove = useCallback(
    async (school: School) => {
      if (schools.length <= 1) {
        Alert.alert("Required", "You must have at least one school.");
        return;
      }
      const { error } = await removeUserSchool(userId, school.id);
      if (error) {
        Alert.alert("Error", `Failed to remove school: ${error}`);
        return;
      }
      setSchools((prev) => prev.filter((s) => s.id !== school.id));
    },
    [userId, schools.length],
  );

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "My Schools",
          headerStyle: { backgroundColor: "#fff" },
          headerShadowVisible: false,
          headerTintColor: COLORS.primary[600],
        }}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
        </View>
      ) : (
        <View style={styles.scrollContent}>
          <Text style={styles.hint}>
            Add schools where you're looking for roommates. You'll discover and
            connect with people at these schools.
          </Text>

          <SchoolSearch
            selectedSchools={schools}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  hint: {
    fontSize: 15,
    color: COLORS.gray[500],
    lineHeight: 22,
    marginBottom: 20,
  },
});
