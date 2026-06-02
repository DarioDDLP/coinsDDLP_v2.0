-- Variantes LA/LR — países restantes (todos excepto España, Alemania, Bulgaria, Estonia, Malta)
-- España y Alemania ya migrados. Bulgaria, Estonia y Malta no tienen variantes.

UPDATE euro
SET variant = 'LA'
WHERE country NOT IN ('España', 'Alemania', 'Bulgaria', 'Estonia', 'Malta')
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
WHERE country NOT IN ('España', 'Alemania', 'Bulgaria', 'Estonia', 'Malta')
  AND "faceValue" IN ('2 Euros', '2 Euros C')
  AND variant = 'LA';
