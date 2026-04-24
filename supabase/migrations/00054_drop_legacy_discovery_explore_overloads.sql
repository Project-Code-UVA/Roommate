-- Drop the legacy overloads of get_discovery_stack and get_explore_feed.
--
-- 00053 added filter-aware overloads (with p_filters jsonb DEFAULT NULL)
-- but left the original 3-arg / 4-arg versions in place. Having both creates
-- a raw-SQL call ambiguity — `get_discovery_stack(uuid, int, int)` matches
-- both overloads and Postgres returns 42725 "function is not unique".
--
-- PostgREST can still disambiguate by the exact set of named-parameter keys
-- in the request body, but any tool or migration that issues a positional
-- call would fail. The filter-aware versions are strict supersets: when
-- p_filters is NULL or '{}'::jsonb, the NOT EXISTS subquery over
-- jsonb_each(v_filters) returns no rows, so no candidate is excluded.
--
-- Dropping the legacy overloads leaves only the filter-aware versions; calls
-- that omit p_filters are handled by the DEFAULT NULL on the parameter.

DROP FUNCTION IF EXISTS public.get_discovery_stack(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_explore_feed(uuid, integer, integer, integer);
