# 003 · Autenticación nativa (login usuario/contraseña + sesión persistida)

**Estado:** implementado ✅ — corresponde al Taller Semana 9 (entorno de desarrollo móvil).

## Qué hace

Pantalla de login con campos propios de usuario y contraseña (sin abrir Keycloak en un navegador aparte). Al enviar el formulario:

1. Llama a `POST {VITE_API_BASE_URL}/api/auth/mobile/login` con `{ username, password }`.
2. Si la respuesta es `200`, guarda el `sessionToken` recibido en `@capacitor/preferences` (almacenamiento nativo, sobrevive a cerrar la app).
3. Navega a la pantalla principal, que hace `GET /api/auth/session` con `Authorization: Bearer <sessionToken>` para mostrar el usuario autenticado — esta es la solicitud que demuestra la conectividad con el backend propio.
4. "Salir" llama a `POST /api/auth/logout` con el mismo Bearer y borra el token guardado.

Ver la implementación equivalente del lado del servidor en `mycoins-listo/spec/features/012-autenticacion-movil-nativa/spec.md`.

## Por qué Ionic + React + Capacitor

- El backend de MyCoins ya está en TypeScript/React (Next.js) — reutilizar el mismo lenguaje y las mismas convenciones (componentes funcionales, hooks) reduce la curva de aprendizaje frente a adoptar Flutter/Dart o Kotlin nativo.
- Capacitor empaqueta la misma base web (HTML/CSS/JS) como app nativa para Android e iOS desde un solo código fuente, con acceso a APIs nativas (`@capacitor/preferences`, `@capacitor/status-bar`, etc.) cuando se necesitan.
- El endpoint `/api/auth/mobile/login` fue diseñado explícitamente para un WebView empaquetado sin cookies compartidas con el navegador del sistema — encaja directo con el modelo de Capacitor.

## Direccionamiento al backend

La URL base de la API se configura por variable de entorno (`VITE_API_BASE_URL`, ver `.env.example`), nunca hardcodeada:

| Destino de ejecución | URL |
|---|---|
| Navegador (`ionic serve`, sin empaquetar) | `http://localhost:3000` |
| Emulador Android (AVD) | `http://10.0.2.2:3000` (alias que el emulador resuelve al `localhost` de la máquina anfitriona) |
| Dispositivo físico (misma red Wi-Fi que el backend) | `http://<IP-LAN-de-tu-PC>:3000` |

En el backend (`mycoins-listo`), `proxy.ts` habilita CORS abierto únicamente en `/api/*` para que un origen distinto (el WebView de la app) pueda completar la petición — es seguro porque este flujo no usa cookies, solo `Authorization: Bearer`.

## Limitaciones (a exponer en el video del taller)

- El token se guarda en `@capacitor/preferences`, que no está cifrado a nivel de disco (sí está fuera del alcance de otras apps). Para producción real conviene `@capacitor-community/secure-storage` o Keychain/Keystore directo.
- ROPC (usuario/contraseña directo a la API en vez de Authorization Code + PKCE) expone la contraseña al código de la app — riesgo aceptado explícitamente y documentado en la spec del backend, acotado solo a este cliente móvil.
- El tráfico HTTP sin cifrar (`http://`) solo es aceptable en desarrollo local; antes de cualquier distribución debe pasar a `https://` y eliminarse cualquier excepción de tráfico en claro configurada en `AndroidManifest.xml`/`Info.plist`.

## Fuera de alcance

- Refresco automático de token en segundo plano (`/api/auth/refresh` existe en el backend pero no se invoca todavía desde esta app).
- Registro de nuevos usuarios desde la app — los usuarios se crean en el flujo web o directamente en Keycloak.
