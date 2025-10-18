# 🚀 API Router - Deno

Un servidor HTTP para Deno, ligero, de alto rendimiento y con cero dependencias. Implementa un sistema de enrutamiento avanzado con soporte para middlewares, parámetros dinámicos y servicio de archivos estáticos.

## ✨ Características

- **Router de Alto Rendimiento**: Optimizado con indexación por método HTTP y cacheo de patrones `URLPattern`.
- **Configuración Flexible**: Puerto, hostname y logging configurables.
- **Parámetros Dinámicos**: Soporte completo para rutas con parámetros (ej: `/user/:id`).
- **Middlewares**: Sistema de middlewares flexible, con soporte para middlewares globales y específicos por ruta.
- **Servidor de Archivos Estáticos**: Sirve archivos estáticos de manera eficiente y segura.
- **Logging Avanzado**: Sistema de logs con colores, timestamps y medición de performance.
- **Hot Reload**: Desarrollo ágil con recarga automática.
- **TypeScript Nativo**: Código limpio y tipado sin necesidad de transpilación.
- **Cero Dependencias Externas**: Construido únicamente con la librería estándar de Deno.

## 📋 Requisitos Previos

- [Deno](https://deno.land/) v1.37 o superior

```bash
# Instalar Deno (Linux/macOS)
curl -fsSL https://deno.land/x/install/install.sh | sh

# Instalar Deno (Windows - PowerShell)
irm https://deno.land/install.ps1 | iex
```

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd api

# No se requiere instalación de dependencias (Deno las maneja automáticamente)
```

## 🏃 Ejecución

### Modo Desarrollo

```bash
deno task dev
```

Esto iniciará el servidor en `http://0.0.0.0:4242` con hot reload habilitado.

**Salida esperada:**
```plaintext
🚀 Server listening on http://0.0.0.0:4242
[2025-10-18T21:30:27.332Z] POST    / 200 1.35ms
[2025-10-18T21:30:37.307Z] POST    /user/add/ 200 13.63ms
[2025-10-18T21:30:42.841Z] GET     / 200 0.40ms
```

### Modo Producción

```bash
deno run --allow-net --allow-read --allow-env --env-file src/main.ts
```

## 📁 Estructura del Proyecto

```plaintext
api/
├── core/                  # Lógica central del router
│   ├── router.ts          # Clase Router principal
│   └── shared/
│       └── index.ts       # Instancia única del router
├── src/
│   ├── public/            # Archivos estáticos (CSS, JS, HTML)
│   │   ├── index.html
│   │   ├── css/
│   │   ├── js/
│   │   └── ...
│   └── routes/            # Definición de rutas
│       ├── index.ts
│       ├── static.ts
│       └── ...
├── tests/                 # Pruebas unitarias
│   ├── static-files.test.ts
│   └── ...
├── main.ts                # Punto de entrada de la aplicación
├── deno.json              # Configuración y tasks de Deno
└── README.md
```

## 🔌 Rutas Disponibles

| Ruta                | Método | Descripción                                        |
| ------------------- | ------ | -------------------------------------------------- |
| `/`                 | GET    | Página principal - Retorna mensaje de bienvenida   |
| `/test`             | GET    | Página de prueba - Muestra variable de entorno     |
| `/user/:id/:name`   | GET    | Página de usuario con parámetros dinámicos         |
| `/assets/*`         | GET    | Sirve archivos estáticos desde `src/public`        |

### Ejemplos de Uso con `curl`

```bash
# Ruta raíz
curl http://localhost:4242/

# Ruta con parámetros
curl http://localhost:4242/user/123/john

# Archivo estático (HTML)
curl http://localhost:4242/assets/index.html

# Archivo estático (CSS)
curl http://localhost:4242/assets/css/main.css
```

## 🧩 Uso del Router

### Configuración Básica

```typescript
import { Router } from "./core/router.ts";

const router = new Router();
router.route("/", () => new Response("Hello World!"));
router.serve();
```

### Configuración Avanzada

```typescript
import { Router } from "./core/router.ts";

const router = new Router({
  port: 8080,
  hostname: "localhost",
  logRequests: true
});

// Middleware global
router.use(async (req, next) => {
  console.log(`Processing: ${req.method} ${req.url}`);
  return await next();
});

// Ruta con múltiples middlewares
const authMiddleware = (req, next) => {
  if (!req.headers.has("Authorization")) {
    return new Response("Unauthorized", { status: 401 });
  }
  return next();
};

router.route(
  { pathname: "/admin", method: "GET" },
  authMiddleware,
  () => new Response("Admin Panel")
);

router.serve();
```

### Agregar una Nueva Ruta

Crea un nuevo archivo en `src/routes/` y regístralo en `main.ts`.

```typescript
// src/routes/example.ts
import { router } from "../../core/shared/index.ts";

const handler = () => new Response("Hello from example!");

router.route("/example", handler);
```

### Ruta con Middlewares

Los middlewares se pasan como argumentos antes del manejador final.

```typescript
const authMiddleware = (req, next) => {
  if (!req.headers.has("Authorization")) {
    return new Response("Unauthorized", { status: 401 });
  }
  return next();
};

const finalHandler = () => new Response("Secret data");

router.route("/secret", authMiddleware, finalHandler);
```

### Servir Archivos Estáticos

La ruta para archivos estáticos está definida en `src/routes/static.ts`. Por defecto, sirve el contenido de `src/public` bajo la URL `/assets`.

## 🔧 API del Router

### `Router`

Clase principal que gestiona el enrutamiento.

#### Constructor

```typescript
new Router(config?: RouterConfig)
```

**Opciones de configuración:**

| Opción        | Tipo      | Por Defecto | Descripción                                |
| ------------- | --------- | ----------- | ------------------------------------------ |
| `port`        | `number`  | `4242`      | Puerto en el que escucha el servidor       |
| `hostname`    | `string`  | `"0.0.0.0"` | Hostname del servidor                      |
| `logRequests` | `boolean` | `true`      | Habilita/deshabilita el logging de requests|

#### Métodos

- **`route(data, ...handlers)`**: Registra una nueva ruta.
  - `data`: Puede ser un `string` para la ruta (método GET por defecto) o un objeto `{ pathname, method }`.
  - `...handlers`: Una secuencia de middlewares y, al final, el manejador de la ruta.

- **`use(middleware)`**: Aplica un middleware global a todas las rutas.

- **`serve()`**: Inicia el servidor HTTP.

### Tipos TypeScript

```typescript
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";

type RouteHandler = (
  req: Request,
  params: Record<string, string | undefined>
) => Response | Promise<Response>;

type Middleware = (
  req: Request,
  next: () => Response | Promise<Response>
) => Response | Promise<Response>;

interface RouterConfig {
  port?: number;
  hostname?: string;
  logRequests?: boolean;
}
```

## 📊 Sistema de Logging

El router incluye un sistema de logging avanzado con las siguientes características:

- **Timestamps ISO**: Cada log incluye la fecha y hora exacta
- **Códigos de colores**: Diferentes colores según el status HTTP
  - 🟢 Verde (2xx) - Éxito
  - 🔵 Cyan (3xx) - Redirecciones
  - 🟡 Amarillo (4xx) - Errores del cliente
  - 🔴 Rojo (5xx) - Errores del servidor
- **Medición de performance**: Tiempo de respuesta en milisegundos
- **Configurable**: Puede deshabilitarse pasando `logRequests: false`

## 🚦 Permisos de Deno

El proyecto utiliza los siguientes permisos, definidos en `deno.json`:

- `--allow-net`: Acceso a la red para el servidor HTTP.
- `--allow-read`: Permiso de lectura para servir archivos estáticos.
- `--allow-env`: Acceso a variables de entorno.
- `--env-file`: Carga de variables desde archivo `.env`.
- `--watch`: Recarga automática en modo desarrollo.

## ✅ Testing

El proyecto incluye una suite completa de pruebas unitarias.

```bash
deno task test
```

**Resultados esperados:**
```plaintext
✅ 4 passed (15 steps) | 0 failed
```

Las pruebas verifican:
- Enrutamiento de todos los métodos HTTP
- Manejo de parámetros dinámicos
- Ejecución correcta de middlewares
- Servicio de archivos estáticos
- Manejo de errores 404

## 📝 Notas Técnicas

- **Puerto por defecto**: `4242` (configurable)
- **Host por defecto**: `0.0.0.0` (configurable)
- **Patrón de rutas**: Utiliza la API `URLPattern` nativa de Deno
- **Manejo de 404**: Respuestas automáticas para rutas no encontradas
- **Performance**: Indexación por método HTTP y cacheo de patrones para máxima eficiencia

## 🚀 Roadmap y Futuras Mejoras

### Corto Plazo
- ✅ Configuración flexible del servidor
- ✅ Sistema de logging avanzado
- ✅ Validación de entrada robusta
- ✅ Documentación JSDoc completa
- 🔄 **Rate Limiting**: Protección contra abuso
- 🔄 **CORS Middleware**: Soporte para peticiones cross-origin
- 🔄 **Body Parsing**: Parser integrado para JSON/FormData
- 🔄 **Compression**: Gzip/Brotli para responses

### Mediano Plazo
- 🔄 **WebSocket Support**: Soporte para conexiones WebSocket
- 🔄 **Streaming**: Soporte para respuestas en streaming
- 🔄 **Health Checks**: Endpoint `/health` automático
- 🔄 **Metrics**: Recolección de métricas (Prometheus-compatible)

### Largo Plazo
- 🔄 **Plugin System**: Sistema de plugins extensible
- 🔄 **OpenAPI/Swagger**: Generación automática de documentación
- 🔄 **GraphQL**: Soporte opcional para GraphQL
- 🔄 **Hot Module Reloading**: HMR para desarrollo

## 🤝 Contribuir

1. Fork el proyecto.
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`).
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`).
4. Push a la rama (`git push origin feature/AmazingFeature`).
5. Abre un Pull Request.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🔗 Enlaces Útiles

- [Documentación de Deno](https://deno.land/manual)
- [API de `serveDir`](https://deno.land/std/http/file_server.ts)
- [URLPattern API](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

---

**Última actualización**: Octubre 2025 | **Versión**: 2.0.0
