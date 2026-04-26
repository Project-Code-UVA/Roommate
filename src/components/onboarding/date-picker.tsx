import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { COLORS } from "@/lib/constants";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function range(start: number, end: number): number[] {
  const arr: number[] = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

function WheelColumn({
  data,
  selectedIndex,
  onSelect,
  formatItem,
}: {
  data: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatItem: (value: number) => string;
}) {
  const listRef = useRef<FlatList<number>>(null);
  const isUserScrolling = useRef(false);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visualIdx, setVisualIdx] = useState(selectedIndex);

  useEffect(() => {
    if (!isUserScrolling.current && listRef.current) {
      listRef.current.scrollToOffset({
        offset: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
      setVisualIdx(selectedIndex);
    }
  }, [selectedIndex]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(idx, data.length - 1));
      setVisualIdx((prev) => (prev === clamped ? prev : clamped));
    },
    [data.length],
  );

  const snapToIndex = useCallback(
    (y: number) => {
      const idx = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(idx, data.length - 1));
      listRef.current?.scrollToOffset({
        offset: clamped * ITEM_HEIGHT,
        animated: true,
      });
      isUserScrolling.current = false;
      onSelect(clamped);
    },
    [data.length, onSelect],
  );

  const handleScrollBeginDrag = useCallback(() => {
    isUserScrolling.current = true;
  }, []);

  // When drag ends without momentum (slow drag), snap manually after a short
  // delay. The delay lets onMomentumScrollBegin cancel it if a fling follows.
  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      snapTimerRef.current = setTimeout(() => {
        snapToIndex(y);
      }, 50);
    },
    [snapToIndex],
  );

  // Cancel the manual-snap timer — momentum scroll will handle it instead.
  const handleMomentumScrollBegin = useCallback(() => {
    if (snapTimerRef.current) {
      clearTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
    }
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      snapToIndex(e.nativeEvent.contentOffset.y);
    },
    [snapToIndex],
  );

  const padding = ((VISIBLE_ITEMS - 1) / 2) * ITEM_HEIGHT;

  return (
    <View style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS, overflow: "hidden" }}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item) => String(item)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        initialScrollIndex={selectedIndex}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={{ paddingVertical: padding }}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        renderItem={({ item, index }) => {
          const isSelected = index === visualIdx;
          return (
            <View
              style={{ height: ITEM_HEIGHT, justifyContent: "center", alignItems: "center" }}
            >
              {/* // MODIFIED: increased picker text from 18pt to 22pt */}
              <Text
                style={{
                  fontSize: 22, // MODIFIED: date picker text bumped +4pt
                  fontWeight: isSelected ? "700" : "400",
                  color: isSelected ? COLORS.gray[900] : COLORS.gray[400],
                }}
              >
                {formatItem(item)}
              </Text>
            </View>
          );
        }}
      />
      {/* Selection highlight band */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: padding,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: COLORS.gray[200],
        }}
      />
    </View>
  );
}

export function DatePicker({
  value,
  onChange,
  maximumDate,
  minimumDate,
}: DatePickerProps) {
  const minYear = minimumDate?.getFullYear() ?? value.getFullYear() - 100;
  const maxYear = maximumDate?.getFullYear() ?? value.getFullYear();

  const years = range(minYear, maxYear).reverse();
  const months = range(0, 11);
  const daysInMonth = new Date(value.getFullYear(), value.getMonth() + 1, 0).getDate();
  const days = range(1, daysInMonth);

  const [monthIdx, setMonthIdx] = useState(value.getMonth());
  const [dayIdx, setDayIdx] = useState(value.getDate() - 1);
  const [yearIdx, setYearIdx] = useState(
    years.indexOf(value.getFullYear()),
  );

  const emitChange = useCallback(
    (m: number, d: number, y: number) => {
      const year = years[y] ?? value.getFullYear();
      const month = months[m] ?? 0;
      const maxDay = new Date(year, month + 1, 0).getDate();
      const day = Math.min((days[d] ?? 1), maxDay);
      onChange(new Date(year, month, day));
    },
    [years, months, days, onChange, value],
  );

  return (
    <View className="flex-row justify-center" style={{ gap: 4 }}>
      <View style={{ flex: 2 }}>
        <WheelColumn
          data={months}
          selectedIndex={monthIdx}
          onSelect={(i) => { setMonthIdx(i); emitChange(i, dayIdx, yearIdx); }}
          formatItem={(v) => MONTHS[v]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <WheelColumn
          data={days}
          selectedIndex={dayIdx}
          onSelect={(i) => { setDayIdx(i); emitChange(monthIdx, i, yearIdx); }}
          formatItem={(v) => String(v)}
        />
      </View>
      <View style={{ flex: 1.3 }}>
        <WheelColumn
          data={years}
          selectedIndex={yearIdx}
          onSelect={(i) => { setYearIdx(i); emitChange(monthIdx, dayIdx, i); }}
          formatItem={(v) => String(v)}
        />
      </View>
    </View>
  );
}
