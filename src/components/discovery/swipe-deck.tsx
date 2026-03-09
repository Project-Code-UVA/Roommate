/**
 * Swipe deck: manages stacked discovery cards.
 *
 * Renders top 3 cards from the stack. Cards behind the top card
 * are scaled down and non-interactive. The top card receives all
 * gesture events for swiping and photo navigation.
 *
 * Cards are rendered in reverse order so the last-rendered (top card)
 * has the highest z-index naturally.
 */

import { View } from "react-native";

import { SwipeCard } from "@/components/discovery/swipe-card";
import type { DiscoveryProfile } from "@/types/filters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_VISIBLE_CARDS = 3;
const CARD_SCALES = [1, 0.95, 0.9] as const;
const CARD_OFFSETS = [0, 8, 16] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SwipeDeckProps = {
  readonly stack: readonly DiscoveryProfile[];
  readonly onLike: (profile: DiscoveryProfile) => void;
  readonly onDismiss: (profile: DiscoveryProfile) => void;
  readonly onSave: (profile: DiscoveryProfile) => void;
  readonly onSwipeUp: (profile: DiscoveryProfile) => void;
  readonly onTapCard: (profile: DiscoveryProfile) => void;
  readonly savedIds?: ReadonlySet<string>;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SwipeDeck({
  stack,
  onLike,
  onDismiss,
  onSave,
  onSwipeUp,
  onTapCard,
  savedIds = new Set<string>(),
}: SwipeDeckProps) {
  const visibleCards = stack.slice(0, MAX_VISIBLE_CARDS);

  // Render in reverse order: bottom card first, top card last (highest z-index)
  const reversedCards = [...visibleCards].reverse();

  return (
    <View className="flex-1" testID="swipe-deck">
      {reversedCards.map((profile, reversedIndex) => {
        const actualIndex = visibleCards.length - 1 - reversedIndex;
        const isTopCard = actualIndex === 0;

        return (
          <View
            key={profile.user_id}
            className="absolute inset-0"
            style={{
              transform: [
                { scale: CARD_SCALES[actualIndex] ?? 0.9 },
                { translateY: CARD_OFFSETS[actualIndex] ?? 16 },
              ],
              zIndex: visibleCards.length - actualIndex,
            }}
          >
            <SwipeCard
              profile={profile}
              isTopCard={isTopCard}
              onLike={() => onLike(profile)}
              onDismiss={() => onDismiss(profile)}
              onSave={() => onSave(profile)}
              onSwipeUp={() => onSwipeUp(profile)}
              onTapCard={() => onTapCard(profile)}
              isSaved={savedIds.has(profile.user_id)}
            />
          </View>
        );
      })}
    </View>
  );
}
