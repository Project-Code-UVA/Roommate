import { useState, useRef, useCallback, useEffect } from "react";
import { View, TextInput, NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
import { COLORS } from "@/lib/constants";

interface OtpInputProps {
  onComplete: (code: string) => void;
  length?: number;
}

export function OtpInput({ onComplete, length = 6 }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const handleChange = useCallback(
    (text: string, index: number) => {
      // Paste support: if pasted text fills all boxes
      if (text.length === length) {
        const digits = text.replace(/\D/g, "").slice(0, length).split("");
        if (digits.length === length) {
          setValues(digits);
          refs.current[length - 1]?.focus();
          onComplete(digits.join(""));
          return;
        }
      }

      const digit = text.replace(/\D/g, "").slice(-1);
      setValues((prev) => {
        const next = [...prev];
        next[index] = digit;
        // Auto-complete check
        if (digit && index === length - 1) {
          const code = next.join("");
          if (code.length === length && !code.includes("")) {
            onComplete(code);
          }
        }
        return next;
      });

      // Auto-advance
      if (digit && index < length - 1) {
        refs.current[index + 1]?.focus();
      }
    },
    [length, onComplete],
  );

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (e.nativeEvent.key === "Backspace" && !values[index] && index > 0) {
        refs.current[index - 1]?.focus();
        setValues((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
      }
    },
    [values],
  );

  /** Clear all boxes and refocus the first one. */
  const reset = useCallback(() => {
    setValues(Array(length).fill(""));
    refs.current[0]?.focus();
  }, [length]);

  return (
    <View className="flex-row justify-center" style={{ gap: 10 }}>
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={values[i]}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          textContentType="oneTimeCode"
          style={{
            width: 50,
            height: 60,
            borderWidth: 2,
            borderColor: values[i] ? COLORS.primary[600] : COLORS.gray[300],
            borderRadius: 12,
            textAlign: "center",
            fontSize: 26, // MODIFIED: OTP digit text bumped +2pt (was ~24pt / text-2xl)
            fontWeight: "700",
            color: COLORS.gray[900],
          }}
        />
      ))}
    </View>
  );
}
