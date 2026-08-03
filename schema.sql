-- Esquema de DI HUB.
--
-- Este archivo es SEGURO de correr contra cualquier base, incluida producción:
-- no borra ni sobrescribe nada. Usa IF NOT EXISTS, así que si la tabla ya existe
-- no hace absolutamente nada.
--
-- Si tu tabla `items` ya existe pero le faltan las columnas nuevas (tags, meta,
-- pinned, owner_email, updated_at), lo que necesitas es la migración:
--   migrations/0001_second_brain.sql
--
-- Los datos de ejemplo NO están aquí a propósito. Viven en seeds/example-data.sql
-- para que nunca lleguen a producción por accidente.

CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 'webapp' | 'prompt' | 'link' | 'note' | 'person'
    type TEXT NOT NULL,
    title TEXT NOT NULL,

    -- Categoría / departamento / carpeta, según el tipo.
    category TEXT DEFAULT '',
    url TEXT DEFAULT '',
    description TEXT DEFAULT '',

    -- Cuerpo largo: el prompt, el texto de la nota, las notas de una persona.
    content TEXT DEFAULT '',

    -- CSV de etiquetas, ej. '3d,produccion'. Se filtra en el cliente.
    tags TEXT DEFAULT '',

    -- Campos específicos de cada tipo, como JSON. Agregar uno nuevo NO requiere
    -- migración: puesto y cumpleaños de una persona, usuario y gestor de una app.
    -- Nunca guardamos contraseñas aquí. Ver README.
    meta TEXT DEFAULT '{}',

    pinned INTEGER DEFAULT 0,

    -- Lo llena Cloudflare Access cuando está configurado. Vacío si no.
    owner_email TEXT DEFAULT '',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_pinned ON items(pinned DESC, id DESC);
