import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/lib/constants";

// ─── Option definitions ──────────────────────────────────────────────

interface OptionDef {
  key: string;
  question: string;
  options: string[];
}

// MODIFIED: all preference categories rendered as interactive selectors
const PREFERENCE_OPTIONS: OptionDef[] = [
  {
    key: "cleanliness",
    question: "How clean do you keep your space?",
    options: ["Very tidy", "Mostly clean", "Average", "A bit messy"],
  },
  {
    key: "sleep_schedule",
    question: "What's your sleep schedule?",
    options: ["Early bird", "Average", "Night owl", "Varies"],
  },
  {
    key: "noise_level",
    question: "What noise level are you comfortable with?",
    options: ["Quiet", "Moderate", "Loud is fine"],
  },
  {
    key: "guests",
    question: "How do you feel about guests?",
    options: ["Rarely", "Sometimes", "Often", "Anytime"],
  },
  {
    key: "pets",
    question: "Are you okay with pets?",
    options: ["No pets", "I have a pet", "Love pets", "Allergic"],
  },
  {
    key: "smoking",
    question: "Do you smoke?",
    options: ["Never", "Socially", "Regularly"],
  },
  {
    key: "drinking",
    question: "Do you drink?",
    options: ["Never", "Socially", "Regularly"],
  },
  {
    key: "budget",
    question: "What's your monthly budget?",
    options: ["Under $500", "$500–$1000", "$1000–$1500", "$1500+"],
  },
  {
    key: "looking_for",
    question: "What are you looking for?",
    options: ["Roommate", "Friends", "Both"],
  },
];

// ─── Pill selector component ─────────────────────────────────────────

function PillSelector({
  question,
  options,
  selected,
  onSelect,
}: {
  question: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <View className="mb-6">
      {/* // MODIFIED: increased question text from ~16pt to 18pt */}
      <Text
        style={{ fontSize: 18 }} // MODIFIED: question label bumped +2pt
        className="font-semibold text-gray-900 mb-3"
      >
        {question}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const isActive = selected === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onSelect(opt)}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 9999,
                borderWidth: 2,
                borderColor: isActive ? COLORS.primary[600] : COLORS.gray[200],
                backgroundColor: isActive ? COLORS.primary[50] : "transparent",
              }}
            >
              {/* // MODIFIED: increased pill text from ~14pt to 16pt */}
              <Text
                style={{ fontSize: 16 }} // MODIFIED: option pill text bumped +2pt
                className={isActive ? "text-primary-700 font-medium" : "text-gray-700"}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────

export default function PreferencesScreen() {
  const router = useRouter();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelect = useCallback((key: string, value: string) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleContinue = useCallback(async () => {
    setLoading(true);
    try {
      const nittyGritty = {
        ...selections,
        location: location.trim() || undefined,
      };
      // TODO: call updateProfile(session.user.id, { nitty_gritty: nittyGritty })
      // TODO: call saveProgress('preferences', nittyGritty)
      await new Promise((r) => setTimeout(r, 400));

      router.push("/(auth)/photos");
    } catch {
      // error handling
    } finally {
      setLoading(false);
    }
  }, [selections, location, router]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top bar: back + progress */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="chevron-back" size={28} color={COLORS.gray[800]} />
          </TouchableOpacity>
          <View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              style={{
                width: "66%",
                height: "100%",
                backgroundColor: COLORS.primary[600],
                borderRadius: 9999,
              }}
            />
          </View>
        </View>
      </View>

      {/* Title */}
      <View className="px-6 pt-4 pb-4">
        {/* // MODIFIED: increased title from ~24pt to 32pt matching onboarding hero scale */}
        <Text
          style={{ fontSize: 32, lineHeight: 40 }} // MODIFIED: hero heading at 32pt
          className="font-bold text-gray-900"
        >
          Your preferences
        </Text>
        {/* // MODIFIED: increased subtitle from ~16pt to 18pt */}
        <Text
          style={{ fontSize: 18 }} // MODIFIED: subtitle bumped +2pt
          className="mt-2 text-gray-500"
        >
          Help us find your ideal roommate match
        </Text>
      </View>

      {/* Scrollable content */}
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* // MODIFIED: location implemented as interactive text input question */}
        <View className="mb-6">
          <Text
            style={{ fontSize: 18 }} // MODIFIED: question label bumped +2pt
            className="font-semibold text-gray-900 mb-3"
          >
            Where are you looking to live?
          </Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="City, neighborhood, or area"
            placeholderTextColor={COLORS.gray[400]}
            autoCapitalize="words"
            maxLength={100}
            style={{
              fontSize: 18, // MODIFIED: location input text bumped +2pt
              color: COLORS.gray[900],
              borderWidth: 2,
              borderColor: location ? COLORS.primary[600] : COLORS.gray[300],
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          />
        </View>

        {/* // MODIFIED: all preference options rendered as interactive pill selectors */}
        {PREFERENCE_OPTIONS.map((pref) => (
          <PillSelector
            key={pref.key}
            question={pref.question}
            options={pref.options}
            selected={selections[pref.key] ?? null}
            onSelect={(val) => handleSelect(pref.key, val)}
          />
        ))}
      </ScrollView>

      {/* Continue button */}
      <View className="px-6 pb-6 pt-4">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
          style={{
            backgroundColor: COLORS.primary[600],
            borderRadius: 999, // MODIFIED: fully rounded pill shape
            paddingVertical: 18, // MODIFIED: button padding matches onboarding scale
          }}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text
              style={{ fontSize: 20 }} // MODIFIED: button text bumped +2pt for larger scale
              className="text-white font-semibold text-center"
            >
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
