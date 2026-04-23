CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT,
    url TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO items (type, title, category, url, content) VALUES 
('webapp', 'Yield Manager 3D', 'Producción', '#', 'Gestor de recursos y líneas de tiempo para la granja de impresión 3D industrial. Permite reasignar recursos arrastrando y soltando.'),
('webapp', 'Digital Signage', 'Retail', '#', 'Control remoto de contenido en pantallas ubicadas en punto de venta. Se sincroniza en tiempo real usando Firebase.'),
('prompt', 'Arquitectura React', 'Antigravity', '', 'Actúa como un Senior Frontend Architect. Necesito que estructures una aplicación React usando Vite y TailwindCSS. \n1. Crea un layout de Dashboard.\n2. Implementa un store global ligero.\n3. Asegura que el diseño siga los lineamientos corporativos (Dark mode, glassmorphism).\nEvita over-engineering. Dame el plan paso a paso antes de codificar.'),
('link', 'Assets 3D Oficiales', 'SharePoint / Producción', '#', ''),
('link', 'Lineamientos de Marca 2026', 'Google Drive / Marketing', '#', ''),
('link', 'Catálogo de Resguardo', 'app.hub.corp/catalogo', '#', '');
