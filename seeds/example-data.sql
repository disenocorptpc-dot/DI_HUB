-- DATOS DE EJEMPLO — SOLO PARA DESARROLLO LOCAL.
--
-- NO corras este archivo contra producción. Es para tener con qué probar en una
-- base local vacía. Producción ya tiene tus datos reales.
--
-- Uso (nota el --local, sin --remote):
--   npx wrangler d1 execute DB --local --file=./seeds/example-data.sql

INSERT INTO items (type, title, category, url, description, content, tags, meta) VALUES
('webapp', 'Yield Manager 3D', 'Producción', '#',
 'Gestor de recursos y líneas de tiempo para la granja de impresión 3D industrial. Permite reasignar recursos arrastrando y soltando.',
 '', '3d,produccion',
 '{"loginUser":"usuario@ejemplo.com","vault":"1Password","owner":"Diseño Industrial"}'),

('webapp', 'Digital Signage', 'Retail', '#',
 'Control remoto de contenido en pantallas ubicadas en punto de venta. Se sincroniza en tiempo real usando Firebase.',
 '', 'retail,pantallas', '{}'),

('prompt', 'Arquitectura React', 'Antigravity', '',
 'Este prompt sirve para iniciar un nuevo proyecto de Frontend desde cero con un Agente AI. Se asegura de que la arquitectura sea escalable, use Vite y mantenga el diseño corporativo sin sobrecomplicar la estructura (evita over-engineering).',
 'Actúa como un Senior Frontend Architect. Necesito que estructures una aplicación React usando Vite y TailwindCSS.
1. Crea un layout de Dashboard.
2. Implementa un store global ligero.
3. Asegura que el diseño siga los lineamientos corporativos (Dark mode, glassmorphism).
Evita over-engineering. Dame el plan paso a paso antes de codificar.',
 'react,frontend', '{}'),

('link', 'Assets 3D Oficiales', 'SharePoint / Producción', '#', '', '', '3d', '{}'),
('link', 'Lineamientos de Marca 2026', 'Google Drive / Marketing', '#', '', '', 'marca', '{}'),

('note', 'Cómo levantar el ambiente local', 'Procesos', '', '',
 'npm run build
npm run db:local
npm run dev:full

Queda en localhost:8788 con las Functions y la D1 local.',
 'setup,dev', '{}'),

('person', 'Nombre de Ejemplo', 'Diseño Industrial', '', '',
 'Este registro es de ejemplo. Bórralo cuando agregues a tu equipo real.',
 'ejemplo',
 '{"role":"Puesto de ejemplo","birthday":"03-15","email":"ejemplo@ejemplo.com","phone":"Ext. 0000"}');
