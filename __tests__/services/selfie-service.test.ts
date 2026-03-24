/**
 * Tests for selfie-service.
 * Covers: AUTH-07
 */

// import { resetAllMocks, mockSupabase } from "../setup";
// import { captureSelfie, uploadSelfie } from "@/services/selfie-service";

describe("selfie-service", () => {
  describe("captureSelfie", () => {
    it.todo("captureSelfie calls launchCameraAsync with front camera");
  });

  describe("uploadSelfie", () => {
    it.todo("uploadSelfie uploads to selfies bucket with upsert true");
    it.todo("uploadSelfie calls set_selfie_verified RPC on success");
  });
});
