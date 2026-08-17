# MyCoins — App móvil (Ionic + React + Capacitor)

App móvil del proyecto integrador MyCoins. Login nativo (usuario/contraseña) contra el backend `mycoins-listo`, usando el endpoint `POST /api/auth/mobile/login`. Corresponde al **Taller práctico Semana 9** (configuración, verificación y conexión del entorno de desarrollo móvil).

## 1. Framework elegido y justificación

**Ionic + React + Capacitor.**

- El backend (`mycoins-listo`) ya está en TypeScript/React (Next.js), así que reutilizar React del lado móvil evita aprender un segundo lenguaje/paradigma (frente a Flutter/Dart o Android nativo/Kotlin) en la misma semana en que hay que entregar en cuatro materias distintas.
- Capacitor compila la misma base web (HTML/CSS/JS) como app nativa para Android e iOS desde un solo código fuente, con acceso a plugins nativos (`@capacitor/preferences` para guardar el token de sesión, por ejemplo) cuando la web pura no alcanza.
- El endpoint de login móvil del backend (`/api/auth/mobile/login`, con Bearer token en vez de cookie) fue diseñado justamente para un WebView empaquetado sin cookies compartidas con el navegador del sistema — es el modelo que usa Capacitor.

## 2. Versiones usadas en este proyecto (referencia — verifica las tuyas)

| Herramienta | Versión de referencia |
|---|---|
| Node.js | 20 LTS o superior |
| npm | 10.x |
| Ionic CLI | 7.x (`npm install -g @ionic/cli`) |
| Capacitor | 7.x |
| Android Studio | Ladybug o superior (para el SDK y el emulador) |
| JDK | 17 (el que instala Android Studio por defecto) |

Al grabar el video, **muestra en pantalla la salida real de tu máquina** de `node -v`, `npm -v`, `ionic -v` y `npx cap doctor` — el rubro "Instalación y verificación del entorno" pide exactamente eso, no esta tabla.

## 3. Instalación del entorno, paso a paso

### 3.1. Node.js y Ionic CLI

```bash
node -v          # confirma 20.x o superior
npm install -g @ionic/cli
ionic -v
```

### 3.2. Android Studio + SDK + emulador (o dispositivo físico)

1. Instala [Android Studio](https://developer.android.com/studio).
2. Abre **More Actions → SDK Manager** y confirma que tienes instalado al menos un **Android SDK Platform** (por ejemplo API 34) y **Android SDK Build-Tools**.
3. Configura las variables de entorno `ANDROID_HOME` / `ANDROID_SDK_ROOT` apuntando a la carpeta del SDK (Android Studio te la muestra en **SDK Manager**).
4. Si tu equipo alcanza los requisitos, crea un **Android Virtual Device (AVD)** desde **Device Manager**. Si no los alcanza (poca RAM, sin virtualización habilitada en el BIOS), usa un **dispositivo físico** con depuración USB activada (Ajustes → Acerca del teléfono → toca 7 veces "Número de compilación" → Opciones de desarrollador → Depuración USB) y decláralo así en el video — es una decisión válida y justificada, no un atajo.

### 3.3. Dependencias del proyecto

```bash
cd mycoins-ionic
npm install
```

### 3.4. Diagnóstico del entorno

```bash
npx cap doctor
```

Este es el comando de diagnóstico de Capacitor: revisa versiones de Node, del CLI, de las plataformas nativas instaladas y de las dependencias del proyecto, y señala cualquier configuración faltante. **Muestra la salida completa en el video**, no solo el resultado final — es un criterio explícito de la rúbrica.

Resuelve cualquier hallazgo que reporte (versiones desactualizadas, SDK faltante, etc.) antes de continuar.

### 3.5. Agregar la plataforma Android

```bash
npx cap add android
npx cap sync
```

Esto genera la carpeta `android/` (con el proyecto nativo de Gradle) a partir de tu proyecto web. No se versiona en Git (ver `.gitignore`) porque se regenera con estos comandos.

## 4. Configurar la URL del backend

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Y ajusta `VITE_API_BASE_URL` según dónde vas a ejecutar la app (ver tabla completa en `spec/features/003-autenticacion-nativa/spec.md`):

| Destino | `VITE_API_BASE_URL` |
|---|---|
| Navegador (`ionic serve`) | `http://localhost:3000` |
| Emulador Android (AVD) | `http://10.0.2.2:3000` |
| Dispositivo físico (misma red Wi-Fi) | `http://<IP-LAN-de-tu-PC>:3000` |

**Por qué `10.0.2.2` y no `localhost` en el emulador:** el emulador de Android corre en su propia máquina virtual: `localhost` dentro del emulador se refiere al emulador mismo, no a tu PC. Google reserva la IP `10.0.2.2` como alias fijo hacia el `localhost` de la máquina anfitriona — es la forma estándar de que el emulador alcance un backend que corre en tu computador.

Para un dispositivo físico, ambos (el celular y tu PC) deben estar en la **misma red Wi-Fi**, y necesitas la IP LAN de tu PC (`ipconfig` en Windows, `ip addr` o `ifconfig` en Linux/macOS).

## 5. Levantar el backend

En el otro proyecto (`mycoins-listo`), sigue su propio README para levantar Postgres, Redis y Keycloak (`docker compose up -d`) y correr `yarn dev`. Confirma que:

- El backend responde en `http://localhost:3000`.
- El cliente `mycoins-mobile` existe en el realm de Keycloak con `directAccessGrantsEnabled: true` (ver `keycloak/realm-mycoins.json`) — si el realm ya estaba importado desde antes, hay que recrear el contenedor de Keycloak para que tome el cliente nuevo (`docker compose down && docker compose up -d`).
- Existe al menos un usuario de prueba en Keycloak (por ejemplo `futbolista` / `mycoins123`).

## 6. Ejecutar la app y verificar recarga en caliente

### Opción A — En el navegador (más rápido para desarrollar la interfaz)

```bash
ionic serve
```

Usa `VITE_API_BASE_URL=http://localhost:3000` en `.env.local` para este modo.

### Opción B — Sobre un emulador o dispositivo real (lo que pide el taller)

```bash
npx cap sync
ionic cap run android -l --external
```

`-l --external` activa **recarga en caliente**: el WebView de la app apunta al servidor de Vite en tu máquina (ver `server.host: true` en `vite.config.ts`) en vez de a los archivos empaquetados, así que los cambios en el código se reflejan sin recompilar la app nativa. Para verificarlo en el video: cambia un texto en `src/pages/Login.tsx`, guarda, y muestra que la app en el emulador/dispositivo se actualiza sola.

## 7. Demostrar la conexión con el backend propio

1. Con el backend corriendo y la app abierta, ingresa un usuario de prueba (por ejemplo `futbolista` / `mycoins123`) en la pantalla de login.
2. Al enviar, la app llama a `POST {API_BASE_URL}/api/auth/mobile/login`.
3. Si las credenciales son correctas, la app navega a la pantalla principal, que hace `GET /api/auth/session` con el token recibido (`Authorization: Bearer <token>`) y muestra el nombre, email y roles del usuario autenticado — ésa es la solicitud exitosa hacia tu propia API que el taller pide demostrar.
4. El botón "Salir" llama a `POST /api/auth/logout` y borra el token guardado localmente.

Para el video, muestra también la pestaña **Network** de las DevTools de Chrome conectadas al WebView (`chrome://inspect` con el dispositivo conectado por USB) para que se vea la petición real y su respuesta.

## 8. Limitaciones y dificultades a exponer en el video

- El token de sesión se guarda con `@capacitor/preferences`, que no cifra a nivel de disco (sí queda fuera del alcance de otras apps del dispositivo). Para producción real conviene almacenamiento seguro nativo (Keychain/Keystore).
- El login usa Resource Owner Password Credentials (usuario/contraseña directo a la API), un patrón que expone la contraseña al código de la app — decisión de alcance acotada y documentada, no el estándar recomendado para producción a gran escala (ver `mycoins-listo/spec/features/012-autenticacion-movil-nativa/spec.md`).
- El CORS abierto (`Access-Control-Allow-Origin: *`) en `/api/*` del backend es aceptable aquí porque este flujo no usa cookies — debe **acotarse antes de cualquier distribución real**, junto con pasar todo el tráfico a HTTPS.
- Si tu equipo no soporta el emulador (poca RAM o virtualización deshabilitada), documenta que trabajaste sobre dispositivo físico y por qué.

## 9. Estructura del proyecto

```
mycoins-ionic/
├── src/
│   ├── pages/
│   │   ├── Login.tsx      # formulario nativo usuario/contraseña
│   │   └── Home.tsx       # pantalla autenticada, GET /api/auth/session
│   ├── services/
│   │   ├── api.ts         # llamadas HTTP al backend (login, session, logout)
│   │   └── storage.ts     # guardar/leer el token con Capacitor Preferences
│   ├── App.tsx
│   └── main.tsx
├── capacitor.config.ts
├── vite.config.ts
├── .env.example
└── spec/features/003-autenticacion-nativa/spec.md   # decisiones técnicas documentadas
```
