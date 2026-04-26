/**
 * Full-screen pinch-to-zoom photo viewer.
 *
 * Opens from the profile bottom sheet when a photo is tapped.
 * Supports pinch to zoom (1x-3x), pan when zoomed in, and
 * double-tap to reset zoom.
 */

import { Modal, View, TouchableOpacity, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PhotoViewerProps = {
  readonly photoUrl: string | null;
  readonly visible: boolean;
  readonly onClose: () => void;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MIN_SCALE = 1;
const MAX_SCALE = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhotoViewer({ photoUrl, visible, onClose }: PhotoViewerProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Reset zoom when closing
  const resetZoom = () => {
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const handleClose = () => {
    resetZoom();
    onClose();
  };

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      "worklet";
      const newScale = savedScale.value * event.scale;
      scale.value = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      "worklet";
      savedScale.value = scale.value;

      // Snap back to 1 if close to minimum
      if (scale.value < 1.1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  // Pan gesture — only active when zoomed in
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      "worklet";
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      "worklet";
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Double-tap to reset
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      "worklet";
      scale.value = withTiming(1);
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedScale.value = 1;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!visible || !photoUrl) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View
        style={{ flex: 1, backgroundColor: COLORS.black }}
        className="items-center justify-center"
      >
        {/* Close button */}
        <TouchableOpacity
          onPress={handleClose}
          className="absolute right-4 top-14 z-10 rounded-full p-2"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>

        {/* Zoomable image */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={animatedStyle}>
            <Image
              source={{ uri: photoUrl }}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT * 0.7,
              }}
              contentFit="contain"
            />
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}
