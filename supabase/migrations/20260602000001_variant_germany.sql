-- Variantes LA/LR — Alemania
-- Las monedas alemanas de 2€ y 2€C ya están separadas por ceca (A/D/F/G/J).
-- Cada fila existente pasa a LA; se inserta su copia LR con uds = 0.

UPDATE euro
SET variant = 'LA'
WHERE country = 'Alemania'
  AND "faceValue" IN ('2 Euros', '2 Euros C')
  AND variant IS NULL;

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
WHERE country = 'Alemania'
  AND "faceValue" IN ('2 Euros', '2 Euros C')
  AND variant = 'LA';
