# Tu Futuro Dual - API (Backend Only)

Este repositorio ahora contiene **exclusivamente el backend (API REST)** del sistema de evaluación vocacional. Todo el frontend (HTML/CSS/JS) fue retirado deliberadamente según la solicitud para mantener un servicio puramente de datos.

## ✅ Características Actuales

- API para registro de estudiantes y resultados
- Autenticación de administradores (sesiones persistentes usando `connect-mongo` si está disponible)
- Endpoints protegidos para listar, filtrar y eliminar estudiantes
- Estadísticas agregadas (conteo global, últimos 30 días, agrupación por arquetipo)
- Health check

## 📁 Estructura Principal

```
├── server.js                # App Express (solo API)
├── api/index.js             # Handler (Vercel)
├── netlify/functions/api.js # Handler (Netlify Functions)
├── netlify.toml             # Config Netlify
├── vercel.json              # Config Vercel
├── models/
│   ├── Admin.js
│   └── Estudiante.js
├── config/env.js            # Configuración y variables de entorno centralizadas
├── package.json
└── README.md
```

## 🔐 Variables de Entorno

Configura en tu plataforma (Vercel / Netlify / Railway / Render):

```
MONGODB_URI=...
DB_NAME=uempresarial
SESSION_SECRET=una_clave_segura
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123   # Cambiar en prod
```

## 🌐 Endpoints Disponibles

| Método | Ruta                          | Auth | Descripción |
|--------|-------------------------------|------|-------------|
| GET    | /api/health                   | No   | Verifica estado |
| POST   | /api/auth/login               | No   | Inicia sesión admin |
| POST   | /api/auth/logout              | Sí   | Cierra sesión |
| GET    | /api/auth/verify              | Sí   | Verifica sesión |
| POST   | /api/estudiantes/registro     | No   | Registra estudiante y resultado |
| GET    | /api/estudiantes              | Sí   | Lista (paginación/filtros) |
| GET    | /api/estudiantes/:id          | Sí   | Obtiene un estudiante |
| DELETE | /api/estudiantes/:id          | Sí   | Elimina un estudiante |
| GET    | /api/estadisticas             | Sí   | Datos agregados |
| *      | (cualquier otra ruta)         | -    | 404 JSON { message: 'Recurso no encontrado' } |

## 🔄 Autenticación

- Basada en sesión (cookie `sessionId`).
- Si `connect-mongo` está instalado y `MONGODB_URI` configurada, las sesiones se guardan en la colección `sessions` (persistencia entre despliegues y escalado horizontal). Si no, fallback a memoria (no recomendado en producción).
- Recomendación futura: migrar a JWT + refresh tokens para entornos totalmente serverless/stateless.

## 🚀 Despliegue

### Netlify (Functions)
1. Asegura `netlify.toml` (ya incluido).
2. Directorio de Functions: `netlify/functions`
3. Install: `npm install`
4. Deploy. Los llamados van a `/api/...`.

### Vercel
1. Usa `api/index.js` como entry (ya incluido).
2. Configura variables de entorno.
3. Deploy.

## 🧪 Ejemplos cURL

```bash
# Health
curl https://tu-dominio/api/health

# Login
curl -X POST https://tu-dominio/api/auth/login \
	-H 'Content-Type: application/json' \
	-d '{"username":"admin","password":"admin123"}' -c cookies.txt

# Verificar sesión
curl https://tu-dominio/api/auth/verify -b cookies.txt

# Registrar estudiante
curl -X POST https://tu-dominio/api/estudiantes/registro \
	-H 'Content-Type: application/json' \
	-d '{"nombre":"Juan","email":"juan@example.com","telefono":"3001112222","resultado":{"archetypeId":1,"programa":"Negocios Internacionales","compatibilidad":82}}'
```

## ✅ Próximas Mejoras Sugeridas

- Sustituir sesiones por JWT + refresh tokens (stateless)
- Añadir validación con Joi/Zod
- Paginación más eficiente (cursor) para grandes volúmenes
- Índices en Mongo para campos consultados frecuentemente

## 📄 Nota

El frontend fue removido completamente de este repositorio. Mantén tu copia externa sincronizada con los endpoints listados.

---
Si necesitas que agregue JWT o un store de sesiones persistente, pídelo y lo integramos.