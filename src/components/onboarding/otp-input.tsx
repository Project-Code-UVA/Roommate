/**
 * Six-box OTP input component.
 *
 * Features:
 * - Auto-advance on digit entry
 * - Paste support (fills all boxes when pasting full code)
 * - Backspace navigates to previous box
 * - Auto-focus first input on mount
 * - iOS autofill support via textContentType="oneTimeCode"
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";

type OtpInputProps = {
  readonly onComplete: (code: string) => void;
  readonly length?: number;
};

export function OtpInput({ onComplete, length = 6 }: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [digits, setDigits] = useState<readonly string[]>(
    () => Array.from({ length }, () => "") as readonly string[],
  );

  // Auto-focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = useCallback(
    (text: string, index: number) => {
      // Handle paste: if user pastes full code
      if (text.length === length) {
        const pastedDigits = text.split("").slice(0, length);
        const allNumeric = pastedDigits.every((d) => /^\d$/.test(d));
        if (allNumeric) {
          setDigits(pastedDigits);
          inputRefs.current[length - 1]?.focus();
          onComplete(pastedDigits.join(""));
          return;
        }
      }

      // Handle single digit entry
      const digit = text.replace(/[^0-9]/g, "").slice(-1);
      const updated = digits.map((d, i) => (i === index ? digit : d));
      setDigits(updated);

      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Check if all digits are filled
      if (digit && index === length - 1) {
        const code = updated.join("");
        if (code.length === length && updated.every((d) => d !== "")) {
          onComplete(code);
        }
      } else if (digit) {
        // Check if filling this digit completes the code
        const code = updated.join("");
        if (code.length === length && updated.every((d) => d !== "")) {
          onComplete(code);
        }
      }
    },
    [digits, length, onComplete],
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === "Backspace" && !digits[index] && index > 0) {
        // Move to previous input and clear it
        const updated = digits.map((d, i) => (i === index - 1 ? "" : d));
        setDigits(updated);
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  /** Reset all digits and refocus first input. */
  const clear = useCallback(() => {
    setDigits(Array.from({ length }, () => "") as readonly string[]);
    inputRefs.current[0]?.focus();
  }, [length]);

  // Expose clear via a stable ref-like pattern
  // The parent can call onComplete to trigger re-render which will clear
  // For explicit clear, we export this as part of the component
  useEffect(() => {
    // Attach clear to the first ref's parent for external access
    const firstInput = inputRefs.current[0];
    if (firstInput) {
      (firstInput as TextInput & { clearOtp?: () => void }).clearOtp = clear;
    }
  }, [clear]);

  return (
    <View className="flex-row items-center justify-center gap-3">
      {Array.from({ length }, (_, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          value={digits[index]}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={({ nativeEvent }) =>
            handleKeyPress(nativeEvent.key, index)
          }
          keyboardType="number-pad"
          maxLength={index === 0 ? length : 1}
          textContentType={index === 0 ? "oneTimeCode" : "none"}
          className={`h-14 w-12 rounded-xl border-2 text-center text-2xl font-bold ${
            digits[index]
              ? "border-primary-600 text-gray-900"
              : "border-gray-300 text-gray-900"
          }`}
          accessibilityLabel={`Digit ${index + 1} of ${length}`}
          testID={`otp-digit-${index}`}
        />
      ))}
    </View>
  );
}
