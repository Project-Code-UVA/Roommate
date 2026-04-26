-- Re-seed cover photos so every demo profile has an adult, gender-matched
-- portrait from Pravatar. The image pools below are hand-curated lists of
-- adult photos confirmed to look like men vs women. Pravatar has no gender
-- query param, so we maintain the buckets explicitly.

WITH men_pool(img) AS (
  VALUES
    (11),(12),(13),(14),(15),(17),(18),(33),
    (50),(51),(52),(53),(54),(55),(56),(57),(59),
    (60),(61),(63),(64),(65),(66),(68),(69),(70)
),
women_pool(img) AS (
  VALUES
    (5),(9),(10),(16),(20),(21),(23),(25),(26),(27),(28),
    (30),(31),(32),(34),(36),(38),(40),(42),(43),(44),(45),(47),(49)
),
classified AS (
  SELECT
    u.id AS user_id,
    CASE
      WHEN p.gender = 'woman' THEN 'women'
      WHEN p.gender = 'man'   THEN 'men'
      -- Nonbinary / other: split deterministically across both pools.
      WHEN (ROW_NUMBER() OVER (PARTITION BY p.gender ORDER BY u.id)) % 2 = 0 THEN 'women'
      ELSE 'men'
    END AS bucket
  FROM public.users u
  JOIN public.profiles p ON p.user_id = u.id
),
indexed_men AS (
  SELECT user_id,
         (ROW_NUMBER() OVER (ORDER BY user_id) - 1) AS rn
  FROM classified WHERE bucket = 'men'
),
indexed_women AS (
  SELECT user_id,
         (ROW_NUMBER() OVER (ORDER BY user_id) - 1) AS rn
  FROM classified WHERE bucket = 'women'
),
men_indexed_pool AS (
  SELECT img, ROW_NUMBER() OVER (ORDER BY img) - 1 AS pool_idx,
         (SELECT COUNT(*) FROM men_pool) AS pool_size
  FROM men_pool
),
women_indexed_pool AS (
  SELECT img, ROW_NUMBER() OVER (ORDER BY img) - 1 AS pool_idx,
         (SELECT COUNT(*) FROM women_pool) AS pool_size
  FROM women_pool
),
assignments AS (
  SELECT i.user_id, p.img
  FROM indexed_men i
  JOIN men_indexed_pool p ON p.pool_idx = (i.rn % p.pool_size)
  UNION ALL
  SELECT i.user_id, p.img
  FROM indexed_women i
  JOIN women_indexed_pool p ON p.pool_idx = (i.rn % p.pool_size)
),
covers AS (
  SELECT DISTINCT ON (user_id) id, user_id
  FROM public.photos
  ORDER BY user_id, order_index ASC, created_at ASC
)
UPDATE public.photos ph
SET url = 'https://i.pravatar.cc/1000?img=' || a.img::text
FROM covers c
JOIN assignments a ON a.user_id = c.user_id
WHERE ph.id = c.id;
