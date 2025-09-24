# Documentación de la API

Última actualización: 2025-09-24

## Índice
1. Visión General
2. Autenticación y Sesiones
3. Variables de Entorno Requeridas
4. Formato de Errores
5. Convenciones (Rutas, Paginación, Filtros)
6. Endpoints Detallados
7. Esquema de Validación (Registro Estudiantes)
8. Ejemplos cURL / Postman Flow
9. Código de Estado (Status Codes)
10. Rate Limiting
11. Checklist de Pruebas Rápidas
12. Próximos Pasos Recomendados

---

## 1. Visión General
API REST para registro de estudiantes y administración de resultados vocacionales. Las rutas administrativas están protegidas mediante sesión basada en cookie `sessionId`.

Base URL local (development): `http://localhost:3000`

Todas las rutas de negocio se sirven bajo el prefijo `/api`.

| Tipo | Ejemplo |
|------|---------|
| Health | `GET /api/health` |
| Auth | `POST /api/auth/login` |
| Estudiantes | `POST /api/estudiantes/registro` |
| Estadísticas | `GET /api/estadisticas` |

---

## 2. Autenticación y Sesiones
La autenticación actual es stateful usando `express-session` y memoria del proceso (no persistente). Tras login exitoso se establece una cookie `sessionId` (httpOnly) que debe reenviarse en peticiones posteriores.

Características:
- Cookie segura (`secure=true`) sólo en producción detrás de HTTPS.
- `sameSite=none` en producción, `lax` en desarrollo.
- Duración: 24h.
- Un administrador se crea automáticamente (bootstrap) si no existe en el primer intento de login (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

Rutas que requieren sesión válida:
- `GET /api/auth/verify`
- Todas las rutas `GET/DELETE /api/estudiantes` (salvo `POST /registro`)
- `GET /api/estadisticas`

Alternativa recomendada futuro: JWT (stateless) + Refresh.

---

## 3. Variables de Entorno Requeridas

```
MONGODB_URI=mongodb+srv://usuario:password@cluster/tuDB?retryWrites=true&w=majority
DB_NAME=uempresarial
SESSION_SECRET=una_clave_segura
NODE_ENV=development            # o production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin123!        # Cambiar en producción
```

Opcionales (si existen en config):
- `MONGO_CONNECT_RETRIES` (default 5)
- `MONGO_CONNECT_DELAY_MS` (default 3000)

---

## 4. Formato de Errores
Errores se devuelven con JSON:
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

Errores de validación incluyen `details`:
```json
{
  "success": false,
  "message": "Validación falló",
  "details": ["\"email\" is required", "..." ]
}
```

Errores comunes:
| Código | Caso |
|--------|------|
| 400 | Faltan campos / validación |
| 401 | No autenticado o credenciales inválidas |
| 404 | Recurso no encontrado |
| 429 | Demasiados intentos de login |
| 500 | Error interno |

---

## 5. Convenciones
### Prefijo
Todas las rutas: `/api/...`

### Paginación (Listar Estudiantes)
Query params:
- `page` (default 1)
- `limit` (default 20)

Respuesta incluye objeto `pagination`:
```json
{"page":1,"limit":20,"total":123,"pages":7}
```

### Filtros
- `archetype` → filtra por `resultado.archetypeId`
- `fechaDesde` / `fechaHasta` (ISO date `YYYY-MM-DD`)

Ejemplo: `/api/estudiantes?archetype=2&fechaDesde=2025-01-01&page=2`.

---

## 6. Endpoints Detallados

### 6.1 Health
GET `/api/health`
Respuesta 200:
```json
{"status":"ok","uptime":123.45,"env":"development"}
```

### 6.2 Login Admin
POST `/api/auth/login`
Body:
```json
{ "username": "admin", "password": "Admin123!" }
```
Respuestas:
| Código | Cuerpo |
|--------|--------|
| 200 | `{ success:true, message:"Login exitoso", data:{ username, role, lastLogin }}` |
| 400 | Campos faltantes |
| 401 | Credenciales inválidas |
| 429 | Límite de intentos alcanzado |

Establece cookie `sessionId`.

### 6.3 Logout
POST `/api/auth/logout`
Requiere cookie. Devuelve `{ success:true, message:"Sesión cerrada exitosamente" }`.

### 6.4 Verificar Sesión
GET `/api/auth/verify`
Respuestas 200:
```json
{ "success": true, "authenticated": true, "data": { "username": "admin", "role": "super_admin" }}
```
o
```json
{ "success": true, "authenticated": false }
```

### 6.5 Registrar Estudiante
POST `/api/estudiantes/registro`
Body mínimo requerido:
```json
{
  "nombre":"Juan Pérez",
  "email":"juan@example.com",
  "telefono":"3001112222",
  "resultado":{
    "archetypeId":1,
    "compatibilidad":82,
    "programa":"Administración"
  }
}
```
Campos opcionales: `respuestas[]`, `puntuaciones[]`, `resultado.nombreArchetype`.

Respuesta 201:
```json
{"success":true,"message":"Estudiante registrado exitosamente","data":{"id":"<id>","nombre":"Juan Pérez","resultado":{"archetypeId":1,"compatibilidad":82,"programa":"Administración"}}}
```

### 6.6 Listar Estudiantes
GET `/api/estudiantes?archetype=1&page=1&limit=20`
Requiere sesión.
Respuesta 200 (ejemplo abreviado):
```json
{
  "success": true,
  "data": [ {"_id":"...","nombre":"Juan","resultado":{"archetypeId":1,"programa":"..."},"fechaCompletado":"2025-09-24T..."} ],
  "pagination": {"page":1,"limit":20,"total":1,"pages":1}
}
```

### 6.7 Obtener Estudiante
GET `/api/estudiantes/:id`
Requiere sesión. 404 si no existe.

### 6.8 Eliminar Estudiante
DELETE `/api/estudiantes/:id`
Requiere sesión.
Respuesta 200:
```json
{"success":true,"message":"Estudiante eliminado exitosamente","data":{"id":"...","nombre":"Juan"}}
```

### 6.9 Estadísticas
GET `/api/estadisticas`
Requiere sesión.
Respuesta ejemplo:
```json
{
  "success": true,
  "data": {
    "totalEstudiantes": 150,
    "estudiantesUltimos30Dias": 40,
    "estadisticasArchetype": [
      {"_id":1,"nombre":"Explorador","programa":"Negocios","count":60}
    ]
  }
}
```

### 6.10 404 Genérico
Respuesta:
```json
{"success":false,"message":"Recurso no encontrado"}
```

---

## 7. Esquema de Validación (Registro Estudiantes)
Reglas (Joi):
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| nombre | string 2-100 | Sí | trim |
| email | email | Sí | lowercase |
| telefono | string 5-30 | Sí |  |
| respuestas | array[obj] | No | Cada objeto con: preguntaId (number), categoria, pregunta, respuesta, puntuacion |
| puntuaciones | array[obj] | No | { archetypeId:number, puntuacion:number } |
| resultado.archetypeId | number | Sí |  |
| resultado.nombreArchetype | string | No |  |
| resultado.programa | string | No |  |
| resultado.compatibilidad | number | Sí | 0-100 recomendado |

Errores de validación devuelven 400 con arreglo `details` de mensajes.

---

## 8. Ejemplos cURL / Flujo Postman

### 8.1 Health
```
curl -s http://localhost:3000/api/health
```

### 8.2 Login (guarda cookie)
```
curl -i -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin123!"}' \
  -c cookies.txt
```

### 8.3 Verificar sesión
```
curl -s http://localhost:3000/api/auth/verify -b cookies.txt
```

### 8.4 Registrar estudiante
```
curl -X POST http://localhost:3000/api/estudiantes/registro \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Ana","email":"ana@example.com","telefono":"3000000000","resultado":{"archetypeId":2,"compatibilidad":75,"programa":"Ingeniería"}}'
```

### 8.5 Listar (autenticado)
```
curl -s 'http://localhost:3000/api/estudiantes?limit=5' -b cookies.txt
```

### 8.6 Estadísticas
```
curl -s http://localhost:3000/api/estadisticas -b cookies.txt
```

### 8.7 Logout
```
curl -X POST http://localhost:3000/api/auth/logout -b cookies.txt
```

### 8.8 Postman
Crear una variable de entorno `baseUrl` = `http://localhost:3000/api` y usar:
- POST {{baseUrl}}/auth/login
- GET  {{baseUrl}}/auth/verify (auto envía cookie) 
- POST {{baseUrl}}/estudiantes/registro
- GET  {{baseUrl}}/estudiantes
- GET  {{baseUrl}}/estadisticas

---

## 9. Códigos de Estado
| Código | Uso |
|--------|-----|
| 200 | Operación exitosa (GET / listados / logout / verify) |
| 201 | Creación (registro estudiante) |
| 400 | Validación o parámetros faltantes |
| 401 | No autenticado |
| 404 | Recurso no encontrado |
| 429 | Límite de intentos de login |
| 500 | Error interno |

---

## 10. Rate Limiting
Para `/api/auth/login`:
- Ventana: 15 minutos
- Máx: 5 intentos
- Respuesta 429: `{ success:false, message:"Demasiados intentos de login. Intenta más tarde." }`

Adicional: La colección Admin incrementa `loginAttempts` y puede bloquear a nivel de documento (lock 2h) si se implementa el umbral interno (en el modelo se contemplan campos). Actualmente sólo se registra y potencialmente setea `lockUntil` al llegar a 5 intentos consecutivos.

---

## 11. Checklist de Pruebas Rápidas
1. Health: 200
2. Login correcto: 200 y cookie presente
3. Login incorrecto: 401
4. Más de 5 intentos fallidos: 429
5. Registro estudiante: 201
6. Listado sin cookie: 401
7. Listado con cookie: 200 + pagination
8. Estadísticas con cookie: 200
9. Obtener estudiante inexistente: 404
10. Logout: 200 y luego verify → authenticated:false

---

## 12. Próximos Pasos Recomendados
- Migrar a JWT (access + refresh) para facilitar escalado serverless.
- Persistir sesiones (si se mantienen) usando `connect-mongo`.
- Añadir pruebas automatizadas (Jest + supertest) para endpoints clave.
- Añadir CORS restrictivo (orígenes explícitos) en producción.
- Logging estructurado (pino) + correlación de requests.
- Exportación CSV/XLSX de estudiantes filtrados.

---
¿Necesitas también una colección Postman JSON generada automáticamente? Pídelo y la agregamos al repositorio.
