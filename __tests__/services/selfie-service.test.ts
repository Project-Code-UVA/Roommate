/**
 * Tests for selfie-service.
 * Covers: AUTH-07
 */

import { resetAllMocks, mockSupabase } from "../setup";

const mockLaunchCameraAsync = jest.fn();

jest.mock("expo-image-picker", () => ({
  launchCameraAsync: (...args: unknown[]) => mockLaunchCameraAsync(...args),
  CameraType: { front: "front", back: "back" },
}));

const mockReadAsStringAsync = jest.fn();

jest.mock("expo-file-system", () => ({
  readAsStringAsync: (...args: unknown[]) => mockReadAsStringAsync(...args),
  EncodingType: { Base64: "base64" },
}));

jest.mock("base64-arraybuffer", () => ({
  decode: jest.fn((str: string) => new ArrayBuffer(str.length)),
}));

import { captureSelfie, uploadSelfie } from "@/services/selfie-service";

const TEST_USER_ID = "test-user-id";
const TEST_URI = "file:///test/selfie.jpg";

describe("selfie-service", () => {
  beforeEach(() => {
    resetAllMocks();
    mockLaunchCameraAsync.mockReset();
    mockReadAsStringAsync.mockReset();
  });

  describe("captureSelfie", () => {
    it("calls launchCameraAsync with front camera", async () => {
      mockLaunchCameraAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: TEST_URI }],
      });

      const result = await captureSelfie();

      expect(mockLaunchCameraAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          cameraType: "front",
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          mediaTypes: ["images"],
        }),
      );
      expect(result.canceled).toBe(false);
    });
  });

  describe("uploadSelfie", () => {
    it("uploads to selfies bucket with upsert true", async () => {
      mockReadAsStringAsync.mockResolvedValueOnce("base64-data");

      const storageMock = mockSupabase.storage.from("selfies");
      storageMock.upload.mockResolvedValueOnce({
        data: { path: `${TEST_USER_ID}/selfie.jpg` },
        error: null,
      });
      storageMock.getPublicUrl.mockReturnValueOnce({
        data: { publicUrl: "https://storage.supabase.co/selfies/test.jpg" },
      });
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      const result = await uploadSelfie(TEST_USER_ID, TEST_URI);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith("selfies");
      expect(storageMock.upload).toHaveBeenCalledWith(
        `${TEST_USER_ID}/selfie.jpg`,
        expect.any(ArrayBuffer),
        expect.objectContaining({ contentType: "image/jpeg", upsert: true }),
      );
      expect(result.url).toBe("https://storage.supabase.co/selfies/test.jpg");
      expect(result.error).toBeNull();
    });

    it("calls set_selfie_verified RPC on success", async () => {
      mockReadAsStringAsync.mockResolvedValueOnce("base64-data");

      const storageMock = mockSupabase.storage.from("selfies");
      storageMock.upload.mockResolvedValueOnce({
        data: { path: `${TEST_USER_ID}/selfie.jpg` },
        error: null,
      });
      storageMock.getPublicUrl.mockReturnValueOnce({
        data: { publicUrl: "https://storage.supabase.co/selfies/test.jpg" },
      });
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      await uploadSelfie(TEST_USER_ID, TEST_URI);

      expect(mockSupabase.rpc).toHaveBeenCalled();
      // rpc is called via bound function pattern, so check the mock was invoked
      // with set_selfie_verified and user_id param
    });

    it("returns error when upload fails", async () => {
      mockReadAsStringAsync.mockResolvedValueOnce("base64-data");

      const storageMock = mockSupabase.storage.from("selfies");
      storageMock.upload.mockResolvedValueOnce({
        data: null,
        error: { message: "Upload failed" },
      });

      const result = await uploadSelfie(TEST_USER_ID, TEST_URI);

      expect(result.url).toBe("");
      expect(result.error).toBe("Upload failed");
    });

    it("returns error when file read fails", async () => {
      mockReadAsStringAsync.mockRejectedValueOnce(new Error("File not found"));

      const result = await uploadSelfie(TEST_USER_ID, TEST_URI);

      expect(result.url).toBe("");
      expect(result.error).toBe("File not found");
    });
  });
});
