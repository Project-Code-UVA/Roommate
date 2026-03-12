/**
 * Shared test setup for Room app.
 *
 * Provides mocks for:
 * - @react-native-async-storage/async-storage
 * - src/lib/supabase.ts (Supabase client with chained query builder)
 *
 * Import { mockSession, resetAllMocks } from this file for reuse.
 */

// ---------------------------------------------------------------------------
// @expo/vector-icons mock
// ---------------------------------------------------------------------------
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  const MockIcon = ({ name, testID, ...rest }: Record<string, unknown>) => {
    const actualTestID = testID ?? `icon-${name}`;
    return require("react").createElement(Text, { ...rest, testID: actualTestID }, String(name));
  };
  return {
    Ionicons: MockIcon,
    MaterialIcons: MockIcon,
    FontAwesome: MockIcon,
    Feather: MockIcon,
    MaterialCommunityIcons: MockIcon,
  };
});

// ---------------------------------------------------------------------------
// react-native-reanimated mock
// ---------------------------------------------------------------------------
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

// ---------------------------------------------------------------------------
// expo-haptics mock
// ---------------------------------------------------------------------------
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Heavy: "heavy", Medium: "medium", Light: "light" },
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// ---------------------------------------------------------------------------
// expo-linear-gradient mock
// ---------------------------------------------------------------------------
jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  return { LinearGradient: View };
});

// ---------------------------------------------------------------------------
// react-native-confetti-cannon mock
// ---------------------------------------------------------------------------
jest.mock("react-native-confetti-cannon", () => {
  const { View } = require("react-native");
  return View;
});

// ---------------------------------------------------------------------------
// @gorhom/bottom-sheet mock
// ---------------------------------------------------------------------------
jest.mock("@gorhom/bottom-sheet", () => {
  const { View, ScrollView } = require("react-native");
  return {
    __esModule: true,
    default: View,
    BottomSheetModal: View,
    BottomSheetScrollView: ScrollView,
    BottomSheetBackdrop: View,
  };
});

// ---------------------------------------------------------------------------
// AsyncStorage mock
// ---------------------------------------------------------------------------
const asyncStorageStore: Record<string, string> = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key: string) =>
    Promise.resolve(asyncStorageStore[key] ?? null),
  ),
  setItem: jest.fn((key: string, value: string) => {
    asyncStorageStore[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete asyncStorageStore[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(asyncStorageStore).forEach((k) => delete asyncStorageStore[k]);
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(asyncStorageStore))),
  multiGet: jest.fn((keys: string[]) =>
    Promise.resolve(keys.map((k) => [k, asyncStorageStore[k] ?? null])),
  ),
  multiSet: jest.fn((pairs: [string, string][]) => {
    pairs.forEach(([k, v]) => {
      asyncStorageStore[k] = v;
    });
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys: string[]) => {
    keys.forEach((k) => delete asyncStorageStore[k]);
    return Promise.resolve();
  }),
}));

// ---------------------------------------------------------------------------
// Mock session for reuse across tests
// ---------------------------------------------------------------------------
export const mockSession = {
  user: { id: "test-user-id", email: "test@example.com" },
  access_token: "test-token",
  refresh_token: "test-refresh-token",
  expires_in: 3600,
  token_type: "bearer" as const,
};

// ---------------------------------------------------------------------------
// Chainable Supabase query-builder mock
// ---------------------------------------------------------------------------
function createChainableQuery(resolvedValue?: unknown) {
  const defaultValue = resolvedValue ?? { data: [], error: null };

  const chain: Record<string, jest.Mock> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "like",
    "ilike",
    "in",
    "is",
    "order",
    "limit",
    "range",
    "single",
    "maybeSingle",
    "match",
    "filter",
    "not",
    "or",
    "contains",
    "overlaps",
    "textSearch",
  ];

  methods.forEach((method) => {
    chain[method] = jest.fn().mockReturnValue(chain);
  });

  // Terminal methods that resolve the promise
  chain["then"] = jest.fn((resolve) => resolve(defaultValue));

  // Make chain thenable so `await supabase.from(...).select(...)` works
  Object.defineProperty(chain, "then", {
    value: jest.fn((resolve?: (v: unknown) => unknown) =>
      Promise.resolve(defaultValue).then(resolve),
    ),
    writable: true,
    configurable: true,
  });

  return chain;
}

// ---------------------------------------------------------------------------
// Supabase storage mock
// ---------------------------------------------------------------------------
function createStorageBucketMock() {
  return {
    upload: jest.fn().mockResolvedValue({ data: { path: "mock-path" }, error: null }),
    remove: jest.fn().mockResolvedValue({ data: [], error: null }),
    getPublicUrl: jest.fn().mockReturnValue({
      data: { publicUrl: "https://mock-storage.supabase.co/mock-path" },
    }),
    download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
    list: jest.fn().mockResolvedValue({ data: [], error: null }),
  };
}

const storageBucketMock = createStorageBucketMock();

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------
export const mockSupabase = {
  auth: {
    signInWithOtp: jest
      .fn()
      .mockResolvedValue({ data: {}, error: null }),
    verifyOtp: jest
      .fn()
      .mockResolvedValue({ data: { session: mockSession }, error: null }),
    getSession: jest
      .fn()
      .mockResolvedValue({ data: { session: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
  },
  from: jest.fn((_table: string) => createChainableQuery()),
  storage: {
    from: jest.fn((_bucket: string) => storageBucketMock),
  },
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};

jest.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}));

// ---------------------------------------------------------------------------
// Reset helper
// ---------------------------------------------------------------------------
export function resetAllMocks(): void {
  jest.clearAllMocks();
  Object.keys(asyncStorageStore).forEach((k) => delete asyncStorageStore[k]);
}
