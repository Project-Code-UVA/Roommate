/**
 * Test stubs for photo service.
 * Covers: AUTH-03 (photo upload, delete, reorder).
 */

describe("photo-service", () => {
  it.todo("uploadPhoto uploads base64 to storage bucket");
  it.todo("uploadPhoto inserts row into photos table with order_index");
  it.todo("deletePhoto removes from storage and deletes photos row");
  it.todo("reorderPhotos updates order_index for each photo");
});
