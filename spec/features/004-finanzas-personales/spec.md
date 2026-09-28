# 004 · Gestión de finanzas personales

**Estado:** implementado parcialmente.

## Objetivo

Ayudar a cada persona a registrar y consultar sus ingresos y gastos, organizar sus cuentas y entender su balance desde una aplicación móvil.

## Alcance móvil actual

- Mostrar balance, total de ingresos, total de gastos y cantidad de movimientos.
- Consultar cuentas y movimientos recientes del usuario autenticado.
- Crear cuentas financieras.
- Registrar ingresos y gastos con cuenta, categoría, monto, descripción y fecha.
- Crear categorías iniciales de ingresos y gastos cuando el usuario aún no tenga categorías.
- Programar un recordatorio financiero local.
- Mantener la sesión autenticada mientras la app permanezca instalada.

## Fuera de alcance actual

- Presupuestos y alertas por límite de gasto.
- Edición y eliminación de cuentas, categorías o movimientos.
- Filtros por periodo, exportación y reportes históricos.
- Sincronización en segundo plano.

## Criterios de aceptación

- Sin una sesión válida, la app muestra el acceso y no carga datos financieros.
- Con una sesión válida, la pantalla principal muestra el balance y los totales devueltos por la API.
- El usuario puede crear una cuenta y registrar un movimiento asociado a cuenta y categoría.
- Los movimientos muestran descripción, categoría, fecha y monto con signo según sean ingreso o gasto.
- Las operaciones financieras usan los endpoints `/api/finanzas` y envían el token de sesión como Bearer.
