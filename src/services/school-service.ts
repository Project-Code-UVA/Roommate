/**
 * School service: search, user school management.
 *
 * Queries the schools table (51 seeded schools) and manages
 * user_schools junction table entries.
 */

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database.types";

type School = Tables<"schools">;

/**
 * Search schools by name using case-insensitive matching.
 */
export async function searchSchools(query: string): Promise<School[]> {
  if (!query.trim()) {
    return [];
  }

  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(20);

  if (error) {
    return [];
  }

  return data ?? [];
}

/**
 * Get all schools associated with a user.
 */
export async function getUserSchools(userId: string): Promise<School[]> {
  const { data, error } = await supabase
    .from("user_schools")
    .select("school_id, schools(*)")
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => row.schools)
    .filter((school): school is School => school !== null);
}

/**
 * Add a school to a user's school list.
 */
export async function addUserSchool(
  userId: string,
  schoolId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("user_schools").insert({
    user_id: userId,
    school_id: schoolId,
  });

  return { error: error?.message ?? null };
}

/**
 * Remove a school from a user's school list.
 */
export async function removeUserSchool(
  userId: string,
  schoolId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("user_schools")
    .delete()
    .eq("user_id", userId)
    .eq("school_id", schoolId);

  return { error: error?.message ?? null };
}
