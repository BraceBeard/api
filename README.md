# API Router - Deno

Un servidor HTTP ligero y eficiente construido con **Deno** que implementa un sistema de enrutamiento personalizado con soporte para parámetros dinámicos.

## 🚀 Características

- **Router personalizado**: Sistema de enrutamiento basado en `URLPattern` de Deno
- **Parámetros dinámicos**: Soporte para rutas con parámetros (ej: `/user/:id/:name`)
- **Hot reload**: Desarrollo con recarga automática usando `--watch`
- **Variables de entorno**: Carga automática desde archivo `.env`
- **TypeScript nativo**: Sin necesidad de transpilación gracias a Deno
- **Zero dependencies**: Usa únicamente las APIs nativas de Deno

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

### Modo Producción

```bash
deno run --env-file -E -N main.ts
```

## 📁 Estructura del Proyecto

```
api/
├── core/
│   └── router.ts        # Clase Router con lógica de enrutamiento
├── src/
│   ├── home.ts          # Handler para ruta raíz
│   ├── test.ts          # Handler de prueba con variables de entorno
│   └── user.ts          # Handler con parámetros dinámicos
├── main.ts              # Punto de entrada de la aplicación
├── deno.json            # Configuración y tasks de Deno
└── README.md
```

## 🔌 Rutas Disponibles

| Ruta              | Método | Descripción                                             |
| ----------------- | ------ | ------------------------------------------------------- |
| `/`               | GET    | Página principal - Retorna mensaje de bienvenida        |
| `/test`           | GET    | Página de prueba - Muestra variable de entorno `PRUEBA` |
| `/user/:id/:name` | GET    | Página de usuario con parámetros dinámicos              |

### Ejemplos de Uso

```bash
# Ruta raíz
curl http://localhost:4242/

# Ruta de prueba
curl http://localhost:4242/test

# Ruta con parámetros
curl http://localhost:4242/user/123/john
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PRUEBA=valor_de_prueba
```

## 🧩 Uso del Router

### Agregar una Nueva Ruta

1. Crea un nuevo handler en `src/`:

```typescript
// src/example.ts
export function ExampleRouteHandler(
	req: Request,
	params: Record<string, string | undefined>,
): Response {
	return new Response("Hello from example!");
}
```

2. Registra la ruta en `main.ts`:

```typescript
import { ExampleRouteHandler } from "./src/example.ts";

router.addRoute("/example", ExampleRouteHandler);
```

### Rutas con Parámetros Dinámicos

```typescript
// Definir la ruta
router.addRoute("/product/:category/:id", ProductHandler);

// Acceder a los parámetros
export function ProductHandler(
	_req: Request,
	params: Record<string, string | undefined>,
): Response {
	const { category, id } = params;
	return new Response(`Category: ${category}, ID: ${id}`);
}
```

## 🔧 API del Router

### `Router`

Clase principal que gestiona el enrutamiento de la aplicación.

#### Métodos

- **`addRoute(pathname: string, callback: Function)`**: Registra una nueva ruta
  - `pathname`: Patrón de la ruta (soporta parámetros con `:`)
  - `callback`: Función que maneja la petición

- **`serve()`**: Inicia el servidor HTTP en el puerto 4242

## 🚦 Permisos de Deno

El proyecto requiere los siguientes permisos:

- `--env-file`: Carga variables de entorno desde archivo `.env`
- `-E` (`--env`): Acceso a todas las variables de entorno
- `-N` (`--net`): Acceso a la red para el servidor HTTP
- `--watch`: Recarga automática en modo desarrollo

## 📝 Notas Técnicas

- **Puerto**: El servidor escucha en el puerto `4242`
- **Host**: Configurado para escuchar en todas las interfaces (`0.0.0.0`)
- **Patrón de rutas**: Utiliza la API `URLPattern` nativa de Deno
- **Manejo de 404**: Respuestas automáticas para rutas no encontradas

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## 🔗 Enlaces Útiles

- [Documentación de Deno](https://deno.land/manual)
- [URLPattern API](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern)
- [Deno Deploy](https://deno.com/deploy)
