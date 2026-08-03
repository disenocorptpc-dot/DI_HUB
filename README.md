# DI HUB

Dashboard interno del área de Diseño Industrial: directorio de web apps, prompts,
links, notas y equipo. Un solo lugar para lo que hoy vive repartido entre
SharePoint, chats y memoria.

Stack: React 19 + TypeScript + Vite + Tailwind 4, desplegado en **Cloudflare Pages**
con **D1** (SQLite) como base de datos.

## Correr en local

Solo frontend (rápido, con HMR). `/api/*` responde 404 y verás el estado de error
de carga:

```bash
npm install
npm run dev
```

Con base de datos, para probar de verdad crear / editar / borrar. Necesitas un
`wrangler.toml` en la raíz — **está en `.gitignore` a propósito**, porque en
Cloudflare Pages un `wrangler.toml` con bindings reemplaza los que tienes en el
dashboard, y un `database_id` equivocado rompería producción. Créalo así:

```toml
name = "di-hub-local"
compatibility_date = "2025-01-01"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "di-hub-local"
database_id = "local-placeholder-no-usar-en-produccion"
```

Y luego:

```bash
npm run build
npm run db:local
npm run dev:full
```

Queda en http://localhost:8788 con las Functions y una D1 local sembrada con los
datos de ejemplo. La base local vive en `.wrangler/` y no toca producción.

Nota: `wrangler pages dev` sirve `dist/`, no tiene HMR. Vuelve a correr
`npm run build` después de cada cambio, o usa `npm run dev` para iterar en la UI.

## Estructura

```
src/
  App.tsx              Layout, filtros y orquestación
  types.ts             Tipos de item y forma de `meta`
  lib/
    api.ts             Cliente del API, hidratación de filas y saneado de URLs
    dates.ts           Parseo y cuenta regresiva de cumpleaños
    search.ts          Búsqueda sin acentos y conteo de tags
  components/          Cards, modales, sidebar, toast
functions/api/
  _shared.ts           Validación compartida y lista de columnas
  items.ts             GET (listar) · POST (crear)
  items/[id].ts        PUT (editar) · DELETE (borrar)
schema.sql             DDL con IF NOT EXISTS — seguro de correr en cualquier base
migrations/            Migraciones incrementales para bases que ya tienen datos
seeds/                 Datos de ejemplo — SOLO local, nunca producción
```

## Modelo de datos

Una sola tabla `items`. La columna `type` decide cómo se renderiza y qué campos
aplican: `webapp`, `prompt`, `link`, `note`, `person`.

Los campos específicos de cada tipo viven en `meta` como JSON, no como columnas.
Eso significa que **agregar un campo nuevo no requiere migración** — solo tocar
`ItemMeta` en `src/types.ts` y el formulario. Con un par de cientos de registros,
filtrar en el cliente es más que suficiente.

| Campo | Uso |
|---|---|
| `title` | Nombre de la app / prompt / nota, o nombre de la persona |
| `category` | Departamento, IA recomendada, carpeta, o área según el tipo |
| `content` | Cuerpo largo: el prompt, el texto de la nota, notas de la persona |
| `tags` | CSV; se filtra desde el sidebar |
| `meta` | JSON por tipo (`role`, `birthday`, `loginUser`, `vault`, …) |
| `pinned` | Fija el item arriba de su sección |
| `owner_email` | Lo llena Cloudflare Access cuando esté configurado |

## Desplegar cambios que tocan el esquema

**El orden importa y no es negociable: la base primero, el código después.**

El frontend lee columnas específicas. Si subes código que espera una columna que
la base todavía no tiene, `GET /api/items` truena y el hub se ve vacío — parece
que se perdieron los datos, pero siguen ahí; solo que el código no los puede leer.

Como las migraciones aquí son aditivas (`ALTER TABLE ADD COLUMN`), el código viejo
sigue funcionando después de migrar. Eso permite hacerlo sin downtime:

```bash
# 1. Respaldo. Siempre.
npx wrangler d1 export DB --remote --output=backup.sql

# 2. Migrar producción. El sitio sigue funcionando con el código viejo.
npx wrangler d1 execute DB --remote --file=./migrations/0001_second_brain.sql

# 3. Verificar que las columnas nuevas existen.
npx wrangler d1 execute DB --remote --command="SELECT * FROM items LIMIT 1"

# 4. Ahora sí, subir el código (merge a main dispara el deploy de Pages).
```

Reemplaza `DB` por el nombre real del binding. Las migraciones **no son
idempotentes**: córrelas una sola vez. Si te marca `duplicate column name`,
significa que ya estaba aplicada — no pasa nada, pero revisa qué se alcanzó a
correr antes de insistir.

Si algo sale mal, `backup.sql` tiene todo:

```bash
npx wrangler d1 execute DB --remote --file=./backup.sql
```

## Contraseñas: qué guarda y qué no

Este hub guarda **referencias, nunca secretos**. En una web app puedes registrar
con qué usuario se entra, en qué gestor está la contraseña y un link directo a ese
item — pero no hay campo para la contraseña, a propósito.

La razón es concreta: cualquiera que pueda hacer `GET /api/items` obtiene la base
completa en texto plano. Un campo de contraseña aquí equivale a publicarla.

## Pendiente: autenticación

**El API no tiene autenticación.** `GET`, `POST`, `PUT` y `DELETE` están abiertos a
cualquiera que conozca la URL. Antes de meter datos del equipo (cumpleaños,
teléfonos, notas de desempeño) hay que poner **Cloudflare Access** delante del
proyecto:

- Plan Free de Zero Trust: hasta 50 usuarios, sin costo.
- Política sugerida: permitir correos que terminen en el dominio corporativo.
- No requiere cambios de código.

Cuando esté activo, Access inyecta `Cf-Access-Authenticated-User-Email` en cada
request. El endpoint de creación ya lo lee y lo guarda en `owner_email`, así que
queda listo para separar contenido por usuario.
