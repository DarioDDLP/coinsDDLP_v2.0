-- Table: country_location
-- Tracks which physical album each country's coins are stored in.
-- A country can have multiple rows if its coins span more than one album.

CREATE TABLE country_location (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country   TEXT NOT NULL,
  album     INTEGER NOT NULL,
  year_from INTEGER NOT NULL,
  year_to   INTEGER,
  is_closed BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE country_location ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read country_location"
  ON country_location FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "authenticated can write country_location"
  ON country_location FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Initial data (album assignments as of 2026-06-09)
INSERT INTO country_location (country, album, year_from, year_to, is_closed) VALUES
  ('Alemania',   1, 2002, 2018, true),
  ('Alemania',   2, 2019, NULL, false),
  ('Andorra',    2, 2014, NULL, false),
  ('Austria',    2, 2002, NULL, false),
  ('Bélgica',    2, 1999, NULL, false),
  ('Bulgaria',   3, 2026, NULL, false),
  ('Chipre',     3, 2008, NULL, false),
  ('Croacia',    3, 2023, NULL, false),
  ('Eslovaquia', 3, 2009, NULL, false),
  ('Eslovenia',  3, 2007, NULL, false),
  ('España',     3, 1999, NULL, false),
  ('Estonia',    4, 2011, NULL, false),
  ('Finlandia',  4, 1999, NULL, false),
  ('Francia',    4, 1999, NULL, false),
  ('Grecia',     5, 2002, NULL, false),
  ('Holanda',    5, 1999, NULL, false),
  ('Irlanda',    5, 2002, NULL, false),
  ('Italia',     6, 2002, NULL, false),
  ('Letonia',    6, 2014, NULL, false),
  ('Lituania',   6, 2015, NULL, false),
  ('Luxemburgo', 6, 2002, NULL, false),
  ('Malta',      7, 2008, NULL, false),
  ('Mónaco',     7, 2001, NULL, false),
  ('Portugal',   7, 2002, NULL, false),
  ('San Marino', 7, 2002, NULL, false),
  ('Vaticano',   7, 2002, NULL, false);
