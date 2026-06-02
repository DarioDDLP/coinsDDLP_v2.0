-- ─────────────────────────────────────────────────────────────────────────────
-- Variantes de monedas (LA / LR)
--
-- Algunas denominaciones 2 Euros y 2 Euros C tienen dos variantes físicas
-- distinguibles por el lado en que aparece el diseño nacional:
--   · LA (Lado Anverso) — diseño nacional en el anverso
--   · LR (Lado Reverso) — diseño nacional en el reverso
--
-- La columna variant es nullable: el resto de denominaciones (1c–1€) no
-- tienen variante y mantienen NULL.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Añadir columna variant (nullable)
ALTER TABLE euro ADD COLUMN IF NOT EXISTS variant TEXT;

-- 2. Marcar como 'LA' las monedas España 2€ y 2€C existentes
--    (las unidades en euro_ownership quedan intactas)
UPDATE euro
SET variant = 'LA'
WHERE country = 'España'
  AND "faceValue" IN ('2 Euros', '2 Euros C')
  AND variant IS NULL;

-- 3. Insertar variantes LR para España
--    Son copias de catálogo; sin registros en euro_ownership → uds = 0
INSERT INTO euro (id, year, country, mint, "faceValue", description, commemorative, circulation, "idNum", variant)
SELECT
  gen_random_uuid()::text,
  year,
  country,
  mint,
  "faceValue",
  description,
  commemorative,
  circulation,
  "idNum",
  'LR'
FROM euro
WHERE country = 'España'
  AND "faceValue" IN ('2 Euros', '2 Euros C')
  AND variant = 'LA';
