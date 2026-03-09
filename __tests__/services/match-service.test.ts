/**
 * Test stubs for match-service.
 * Covers: MTCH-01, MTCH-04
 */

import { resetAllMocks } from "../setup";

// TODO: uncomment when service is created
// import { likeProfile, unmatchUser, getMatches } from "@/services/match-service";

describe("match-service", () => {
  beforeEach(resetAllMocks);

  describe("likeProfile", () => {
    it.todo("calls rpc with like_profile and both user IDs (MTCH-01)");
    it.todo("returns is_match true when mutual like creates a match");
    it.todo("returns match_id and thread_id on mutual match");
    it.todo("returns is_match false when no reciprocal like exists");
    it.todo("handles blocked user error gracefully");
    it.todo("handles no_shared_school error gracefully");
    it.todo("handles already_matched_or_unmatched error");
    it.todo("returns error on RPC failure");
  });

  describe("unmatchUser", () => {
    it.todo("calls rpc with unmatch_user and both user IDs (MTCH-04)");
    it.todo("passes block_too flag when user chooses to block");
    it.todo("returns success on valid unmatch");
    it.todo("returns error on RPC failure");
  });

  describe("getMatches", () => {
    it.todo("fetches active matches for user (unmatched_at IS NULL)");
    it.todo("returns empty array when no matches exist");
    it.todo("returns error on fetch failure");
  });
});
