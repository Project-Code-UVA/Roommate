-- Migration: Lower minimum signup age from 18 to 17.
--
-- Product decision: open Room to first-year college students who may still be
-- 17 in fall. Reporting "Underage" remains for users who appear to be under
-- the new minimum. Both INSERT and UPDATE triggers re-use this function, so
-- replacing the function body is sufficient.

CREATE OR REPLACE FUNCTION public.validate_age()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.birthdate > (CURRENT_DATE - INTERVAL '17 years')::date THEN
    RAISE EXCEPTION 'User must be 17 or older';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
