-- Migración 0001: convierte el hub en un second brain sin perder los datos actuales.
--
-- Agrega tags, meta (JSON), pinned, owner_email y updated_at a la tabla items,
-- y habilita los tipos 'note' y 'person'. No borra nada.
--
-- IMPORTANTE: esta migración NO es idempotente. ALTER TABLE ADD COLUMN falla si
-- la columna ya existe, y D1 aborta el resto del archivo cuando una sentencia
-- falla. Córrela una sola vez. Si ya corriste una parte, comenta las líneas de
-- las columnas que ya tengas y vuelve a correr el resto.
--
-- Aplicar (reemplaza DB por el nombre real de tu binding):
--   npx wrangler d1 execute DB --remote --file=./migrations/0001_second_brain.sql
--
-- Recomendado antes de aplicar, para tener respaldo:
--   npx wrangler d1 export DB --remote --output=backup.sql

ALTER TABLE items ADD COLUMN tags TEXT DEFAULT '';
ALTER TABLE items ADD COLUMN meta TEXT DEFAULT '{}';
ALTER TABLE items ADD COLUMN pinned INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN owner_email TEXT DEFAULT '';

-- SQLite no acepta CURRENT_TIMESTAMP como default en ADD COLUMN (no es constante),
-- así que la columna entra vacía y la rellenamos con created_at en el paso siguiente.
ALTER TABLE items ADD COLUMN updated_at TIMESTAMP;

UPDATE items SET updated_at = created_at WHERE updated_at IS NULL;

-- Normaliza los NULL que dejaron las filas viejas, para que el cliente no
-- tenga que defenderse de ellos en cada lectura.
UPDATE items SET tags = ''   WHERE tags IS NULL;
UPDATE items SET meta = '{}' WHERE meta IS NULL OR meta = '';
UPDATE items SET pinned = 0  WHERE pinned IS NULL;
UPDATE items SET owner_email = '' WHERE owner_email IS NULL;

CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_pinned ON items(pinned DESC, id DESC);
