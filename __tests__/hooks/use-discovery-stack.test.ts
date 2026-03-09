// TODO: uncomment when implemented
// import { useDiscoveryStack } from "@/hooks/use-discovery-stack";

describe("useDiscoveryStack", () => {
  // Stack management
  it.todo("loads initial discovery stack on mount");
  it.todo("returns loading state while fetching");
  it.todo("returns empty state when stack has no profiles");
  it.todo("returns error state on fetch failure");

  // Swipe actions — DISC-01
  it.todo("dismissProfile removes top card from stack");
  it.todo("dismissProfile calls discovery service dismissProfile");
  it.todo("dismissProfile handles service errors gracefully");

  // Like actions — DISC-02
  it.todo("likeProfile removes top card from stack");
  it.todo("likeProfile calls match service likeProfile");
  it.todo("likeProfile handles service errors gracefully");

  // Save/bookmark — DISC-03
  it.todo("saveProfile calls discovery service saveProfile");
  it.todo("unsaveProfile calls discovery service unsaveProfile");
  it.todo("save toggle updates saved state for current profile");

  // Match detection — MTCH-02
  it.todo("sets matchData when likeProfile returns is_match true");
  it.todo("does not set matchData when likeProfile returns is_match false");
  it.todo("clears matchData when dismissMatch is called");

  // Thread auto-creation — MTCH-03
  it.todo("stores thread_id from likeProfile match response");

  // Pagination
  it.todo("fetches next page when stack length <= 5");
  it.todo("does not fetch when already loading");
  it.todo("appends new profiles to existing stack immutably");

  // Current profile
  it.todo("currentProfile returns first item in stack");
  it.todo("currentProfile returns null when stack is empty");
});
