/**
 * Scroll-wheel date picker for birthday selection.
 *
 * Wraps @react-native-community/datetimepicker with spinner display
 * for a consistent scroll-wheel look on both iOS and Android.
 */

import { View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS } from "@/lib/constants";

type DatePickerProps = {
  readonly value: Date;
  readonly onChange: (date: Date) => void;
  readonly maximumDate?: Date;
  readonly minimumDate?: Date;
};

function getDefaultMinDate(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 100);
  return d;
}

export function DatePicker({
  value,
  onChange,
  maximumDate = new Date(),
  minimumDate = getDefaultMinDate(),
}: DatePickerProps) {
  return (
    <View className="items-center">
      <DateTimePicker
        value={value}
        mode="date"
        display="spinner"
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onChange={(_event, selectedDate) => {
          if (selectedDate) {
            onChange(selectedDate);
          }
        }}
        textColor={COLORS.gray[900]}
      />
    </View>
  );
}
