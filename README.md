# MyCoins — Finanzas personales

MyCoins es una aplicación móvil para organizar las finanzas personales. Permite consultar el balance, revisar ingresos y gastos, crear cuentas y registrar movimientos asociados a categorías. Se conecta al backend `mycoins-listo` y mantiene la sesión del usuario en el dispositivo.

## Tecnología

**Ionic + React + Capacitor.**

- Ionic y React construyen la interfaz de finanzas personales.
- Capacitor empaqueta la aplicación para Android e iOS y permite guardar la sesión y programar recordatorios locales.
- La API entrega los datos de finanzas y autentica las solicitudes con un token Bearer.

## Funciones actuales

- Resumen de balance, ingresos, gastos y cantidad de movimientos.
- Creación de cuentas financieras.
- Registro de ingresos y gastos con cuenta, categoría, monto y descripción.
- Lista de movimientos recientes y cuentas.
- Inicio y cierre de sesión contra el backend.
- Recordatorios financieros mediante notificaciones locales.

Los presupuestos, edición/eliminación de movimientos y reportes históricos quedan fuera de la funcionalidad móvil actual.

## Requisitos

| Herramienta | Versión de referencia |
|---|---|
| Node.js | 20 LTS o superior |
| npm | 10.x |
| Ionic CLI | 7.x (`npm install -g @ionic/cli`) |
| Capacitor | 7.x |
| Android Studio | Ladybug o superior (para el SDK y el emulador) |
| JDK | 17 (el que instala Android Studio por defecto) |

## Instalación y ejecución

### Node.js e Ionic CLI

```bash
node -v          # confirma 20.x o superior
npm install -g @ionic/cli
ionic -v
```

### Android Studio, SDK y dispositivo

1. Instala [Android Studio](https://developer.android.com/studio).
2. Abre **More Actions → SDK Manager** y confirma que tienes instalado al menos un **Android SDK Platform** (por ejemplo API 34) y **Android SDK Build-Tools**.
3. Configura las variables de entorno `ANDROID_HOME` / `ANDROID_SDK_ROOT` apuntando a la carpeta del SDK (Android Studio te la muestra en **SDK Manager**).
4. Si tu equipo alcanza los requisitos, crea un **Android Virtual Device (AVD)** desde **Device Manager**. Si no los alcanza (poca RAM, sin virtualización habilitada en el BIOS), usa un **dispositivo físico** con depuración USB activada (Ajustes → Acerca del teléfono → toca 7 veces "Número de compilación" → Opciones de desarrollador → Depuración USB).

### Dependencias

```bash
cd mycoins-ionic
npm install
```

### Diagnóstico del entorno

```bash
npx cap doctor
```

Este comando de diagnóstico de Capacitor revisa versiones, plataformas instaladas y dependencias del proyecto.

Resuelve cualquier hallazgo que reporte (versiones desactualizadas, SDK faltante, etc.) antes de continuar.

### Plataforma Android

```bash
npx cap add android
npx cap sync
```

Esto genera la carpeta `android/` (con el proyecto nativo de Gradle) a partir de tu proyecto web. No se versiona en Git (ver `.gitignore`) porque se regenera con estos comandos.

## Conectar el backend

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Y ajusta `VITE_API_BASE_URL` según dónde vas a ejecutar la app (ver `spec/features/003-autenticacion-nativa/spec.md`):

| Destino | `VITE_API_BASE_URL` |
|---|---|
| Navegador (`ionic serve`) | `http://localhost:3000` |
| Emulador Android (AVD) | `http://10.0.2.2:3000` |
| Dispositivo físico (misma red Wi-Fi) | `http://<IP-LAN-de-tu-PC>:3000` |

**Por qué `10.0.2.2` y no `localhost` en el emulador:** el emulador de Android corre en su propia máquina virtual: `localhost` dentro del emulador se refiere al emulador mismo, no a tu PC. Google reserva la IP `10.0.2.2` como alias fijo hacia el `localhost` de la máquina anfitriona — es la forma estándar de que el emulador alcance un backend que corre en tu computador.

Para un dispositivo físico, ambos (el celular y tu PC) deben estar en la **misma red Wi-Fi**, y necesitas la IP LAN de tu PC (`ipconfig` en Windows, `ip addr` o `ifconfig` en Linux/macOS).

## Backend

En el otro proyecto (`mycoins-listo`), sigue su propio README para levantar Postgres, Redis y Keycloak (`docker compose up -d`) y correr `yarn dev`. Confirma que:

- El backend responde en `http://localhost:3000`.
- El cliente `mycoins-mobile` existe en el realm de Keycloak con `directAccessGrantsEnabled: true` (ver `keycloak/realm-mycoins.json`) — si el realm ya estaba importado desde antes, hay que recrear el contenedor de Keycloak para que tome el cliente nuevo (`docker compose down && docker compose up -d`).
- Existe un usuario de prueba en Keycloak para iniciar sesión.

## Ejecutar la app

### Opción A — En el navegador (más rápido para desarrollar la interfaz)

```bash
ionic serve
```

Usa `VITE_API_BASE_URL=http://localhost:3000` en `.env.local` para este modo.

### Android

```bash
npx cap sync
ionic cap run android -l --external
```

`-l --external` activa recarga en caliente: el WebView apunta al servidor Vite de tu máquina para reflejar cambios sin recompilar la app nativa.

## Uso financiero

1. Inicia sesión con una cuenta existente.
2. Consulta el balance y los totales de ingresos y gastos.
3. Crea una cuenta si aún no tienes ninguna.
4. Registra movimientos usando una cuenta y una categoría. Si no hay categorías, crea las categorías iniciales desde el formulario.
5. Cierra la sesión desde el botón de la barra superior.

Las operaciones financieras usan `/api/finanzas`; el login y cierre de sesión usan `/api/auth`.

## Seguridad y alcance

- La sesión se guarda con `@capacitor/preferences`, que no cifra los datos a nivel de disco. Para una distribución de producción se recomienda almacenamiento seguro nativo.
- El flujo de autenticación móvil actual envía las credenciales a la API y está documentado como una limitación; una versión de producción debería usar un flujo OAuth nativo con PKCE.
- El tráfico HTTP solo debe usarse en desarrollo local. Antes de distribuir la app, configura HTTPS y restringe CORS a los orígenes permitidos.

## Estructura principal

```
mycoins-ionic/
├── src/
│   ├── pages/
│   │   ├── Login.tsx      # acceso a la cuenta personal
│   │   └── Home.tsx       # resumen y operaciones financieras
│   ├── services/
│   │   ├── api.ts         # acceso autenticado a finanzas y sesiones
│   │   ├── native.ts      # recordatorios financieros locales
│   │   └── storage.ts     # sesión con Capacitor Preferences
│   ├── App.tsx
│   └── main.tsx
├── capacitor.config.ts
├── vite.config.ts
├── .env.example
└── spec/features/004-finanzas-personales/          # contrato funcional de la app
```
