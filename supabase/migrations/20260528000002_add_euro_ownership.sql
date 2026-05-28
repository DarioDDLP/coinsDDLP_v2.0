-- ─────────────────────────────────────────────────────────────────────────────
-- Segunda colección: normalizar posesión de euros
--
-- Antes: tabla `euro` mezcla catálogo y posesión (uds, conservation, observations)
-- Después:
--   · `euro`           → catálogo puro (sin columnas de posesión)
--   · `owner`          → tabla de dueños, id = auth.uid()
--   · `euro_ownership` → posesión por dueño (uds, conservation, observations)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tabla de dueños
CREATE TABLE IF NOT EXISTS owner (
  id   uuid PRIMARY KEY,        -- coincide con auth.uid() del usuario
  name text NOT NULL,
  slug text NOT NULL UNIQUE      -- 'dario' | 'suegro'
);

INSERT INTO owner (id, name, slug) VALUES
  ('e787ff06-0da9-43e8-9dc5-a16e37cb4a33', 'Darío',  'dario'),
  ('a02324b5-c401-4dbd-938f-9aea5f8b43da', 'Manolo', 'manolo');

-- 2. Tabla de posesión
CREATE TABLE IF NOT EXISTS euro_ownership (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  euro_id      text NOT NULL REFERENCES euro(id)  ON DELETE CASCADE,
  owner_id     uuid NOT NULL REFERENCES owner(id) ON DELETE CASCADE,
  uds          integer NOT NULL DEFAULT 0,
  conservation text,
  observations text,
  CONSTRAINT euro_ownership_unique UNIQUE (euro_id, owner_id)
);

-- 3. Migrar posesiones actuales de Darío
INSERT INTO euro_ownership (euro_id, owner_id, uds, conservation, observations)
SELECT id,
       'e787ff06-0da9-43e8-9dc5-a16e37cb4a33',
       uds,
       conservation,
       observations
FROM euro;

-- 4. Eliminar columnas de posesión de euro (queda como catálogo)
ALTER TABLE euro
  DROP COLUMN uds,
  DROP COLUMN conservation,
  DROP COLUMN observations;

-- 5. RLS
ALTER TABLE owner          ENABLE ROW LEVEL SECURITY;
ALTER TABLE euro_ownership ENABLE ROW LEVEL SECURITY;

-- owner: lectura pública (la UI necesita los nombres)
CREATE POLICY "owner_select_all"
  ON owner FOR SELECT USING (true);

-- euro_ownership: lectura pública, escritura solo del propio dueño
CREATE POLICY "euro_ownership_select_all"
  ON euro_ownership FOR SELECT USING (true);

CREATE POLICY "euro_ownership_insert_own"
  ON euro_ownership FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "euro_ownership_update_own"
  ON euro_ownership FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "euro_ownership_delete_own"
  ON euro_ownership FOR DELETE
  USING (auth.uid() = owner_id);

-- 6. Grants para Data API
GRANT SELECT ON owner          TO anon, authenticated;
GRANT SELECT ON euro_ownership TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE   ON euro_ownership TO authenticated;
