/**
 * UpgradeBanner: Prompts free users to upgrade to see who liked them.
 *
 * Shows gold/amber banner with count and "Upgrade" button.
 * onUpgrade shows "Coming Soon" alert (Phase 9 stub).
 */

import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UpgradeBannerProps = {
  readonly count: number;
  readonly onUpgrade?: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UpgradeBanner({ count, onUpgrade }: UpgradeBannerProps) {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      Alert.alert("Coming Soon", "Premium features launching soon!");
    }
  };

  const subtitle =
    count > 0 ? `${count} ${count === 1 ? "person" : "people"} liked you` : "See who likes you";

  return (
    <View testID="upgrade-banner" style={styles.container}>
      <View style={styles.left}>
        <Ionicons name="sparkles" size={20} color="#d97706" />
        <View style={styles.textWrap}>
          <Text style={styles.title}>See who likes you</Text>
          {count > 0 && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <Pressable
        testID="upgrade-button"
        style={styles.button}
        onPress={handleUpgrade}
      >
        <Text style={styles.buttonText}>Upgrade</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fffbeb", // amber-50
    borderWidth: 1,
    borderColor: "#fde68a", // amber-200
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  textWrap: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400e", // amber-800
  },
  subtitle: {
    fontSize: 13,
    color: "#b45309", // amber-700
    marginTop: 2,
  },
  button: {
    backgroundColor: "#f59e0b", // amber-500
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
