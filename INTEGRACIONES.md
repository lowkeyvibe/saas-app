# Integraciones y datos pendientes

Hoy la app es **solo interfaz**: todos los datos salen de [src/lib/mock-data.ts](src/lib/mock-data.ts) (datos de prueba fijos).
Este archivo junta todo lo que después hay que traer de verdad, para ir resolviéndolo de a uno.

Se actualiza a medida que se agrega UI: cada vez que una pantalla muestra un dato inventado que en la realidad viene de una API externa o de la base de datos, se anota acá.

**Estados:** ⬜ pendiente · 🟡 en curso · ✅ conectado

---

## 1. Integraciones externas (APIs, permisos, cuentas de terceros)

Necesitan credenciales, OAuth, webhooks o aprobación de otra empresa. Son lo más lento, porque algunas requieren revisión (por ejemplo Meta).

### 1.1 Pasarelas de pago ⬜

- **Dónde se ve:** la pestaña "Pagos" de cada tienda (Tiendas) ([pagos.tsx](src/components/settings/tabs/pagos.tsx)). Además, "Estado del pago" en [Últimas ventas](src/app/dashboard/overview.tsx) y en [Ventas](src/app/dashboard/ventas/sales-table.tsx) (con "Medio de pago").
- **Hoy:** en Pagos, Mercado Pago figura "conectado" y Stripe, PayPal, Whop y Transferencia no, pero es fijo. El estado de cada venta (aprobada, pendiente, rechazada, reembolsada) es inventado.
- **De dónde sale:**
  - **Mercado Pago:** OAuth de Mercado Pago (marketplace), para cobrar en nombre del vendedor. Webhooks de `payment` para enterarnos de aprobado, rechazado o reembolsado.
  - **Stripe:** Stripe Connect (cuentas Express o Standard). Webhooks `checkout.session.completed`, `charge.refunded`, `payout.*`.
  - **PayPal:** PayPal Commerce Platform (partner) y sus webhooks.
  - **Whop:** su API y webhooks de pagos.
  - **Transferencia:** no usa API. Es un flujo propio en el que el vendedor confirma a mano (va en la base de datos).
- **ID de pago:** el panel de detalle de la orden ([order-drawer.tsx](src/components/dashboard/order-drawer.tsx)) muestra el ID de pago de la pasarela. Hoy es inventado, con el formato de cada una (`pi_…` en Stripe, numérico en Mercado Pago, `PAYID-…` en PayPal). Sale del webhook del pago.
- **Un cobro por artículo (no hay carrito):** el producto principal y cada upsell se cobran por separado (one-click). Cada uno tiene su propio estado, ID de pago y, si falla, su motivo de rechazo. Por eso un upsell puede salir rechazado aunque el resto se haya cobrado. Para que el one-click funcione, la pasarela tiene que permitir volver a cobrarle al mismo cliente sin que cargue la tarjeta de nuevo:
  - **Stripe:** guardar el método de pago con `setup_future_usage: "off_session"` en el primer cobro y crear un PaymentIntent `off_session` por cada upsell.
  - **Mercado Pago:** guardar la tarjeta como *customer card* y cobrar con ese token. Cada upsell es un pago aparte.
  - **PayPal:** vault (guardar el método de pago) o *reference transactions*, que PayPal tiene que habilitar en la cuenta.
  - **Transferencia:** no admite one-click, así que en esas ventas no se ofrecen upsells.
- **Motivo del rechazo:** en las ventas rechazadas (y en cada upsell rechazado), el panel de detalle muestra arriba de todo un aviso con el motivo en lenguaje simple, qué puede hacer el cliente y el código original de la pasarela. Hoy es inventado (`DECLINE_REASONS` en [mock-data.ts](src/lib/mock-data.ts)). De dónde sale:
  - **Mercado Pago:** `status_detail` del pago (por ejemplo `cc_rejected_insufficient_amount`).
  - **Stripe:** `last_payment_error.decline_code` o `code` del PaymentIntent (por ejemplo `insufficient_funds`), que llega en el webhook `payment_intent.payment_failed`.
  - **PayPal:** el `issue` del error de la captura (por ejemplo `INSTRUMENT_DECLINED`).
  - Hay que armar una tabla propia que traduzca cada código a un mensaje entendible. La de prueba es la base.
  - **Transferencia:** no hay pasarela. El rechazo es propio: vence el plazo o el vendedor la cancela.
- **Botón "Reembolsar"** (en el panel de detalle): necesita la API de reembolsos de cada pasarela (Stripe Refunds, Mercado Pago `/v1/payments/{id}/refunds`, PayPal Refunds). Hoy no hace nada.
- **Permisos:** una cuenta de desarrollador en cada una, claves en variables de entorno (`.env`) y una URL pública para recibir webhooks.

### 1.2 Wallet: saldo, liberaciones y retiros ⬜

- **Dónde se ve:** sección [Wallet](src/components/wallet/wallet.tsx) (`/dashboard/wallet`) y la card "Tu saldo" del Resumen, que lleva a la Wallet.
- **Hoy:** todo inventado en [mock-wallet.ts](src/lib/mock-wallet.ts): saldo disponible, "por liberar", retiro en camino, calendario de liberaciones de los próximos 14 días, saldo por pasarela, cuentas para retirar e historial de retiros. El botón "Retirar" simula el pedido (lo suma al historial como "En camino" y descuenta el saldo hasta recargar).
- **De dónde sale:**
  - **Disponible y por liberar, por pasarela:** Stripe Balance API (`available` / `pending`, con `available_on` de cada transacción para el calendario); Mercado Pago: saldo disponible y "dinero a liberar" con su fecha de liberación (`money_release_date` de cada pago); PayPal: Balances API.
  - **Calendario de liberaciones:** se arma con la fecha de liberación de cada pago (Stripe `balance_transactions.available_on`, Mercado Pago `money_release_date`). Conviene guardarla en la base de datos al recibir el webhook del pago.
  - **Retiros:** Stripe Payouts API; Mercado Pago: retiros a cuenta bancaria (o transferencias de dinero); PayPal Payouts API. Webhooks de estado del retiro (`payout.paid`, `payout.failed`) para pasar de "En camino" a "Acreditado" o "Rechazado".
  - **Si la plata pasa por una cuenta nuestra** (modelo plataforma): saldo propio por vendedor en la base de datos, con un libro de movimientos (ventas, comisiones, reembolsos, retiros) y un proceso que libere y pague.
- **Saldos por moneda y moneda principal** ([currency-balance.tsx](src/components/wallet/currency-balance.tsx)): pensado para una pasarela global como **Whop**, donde cada venta entra en la moneda en la que pagó el comprador.
  - **Qué hay hoy:** saldo disponible y "a acreditarse" de cada moneda (USD, EUR, ARS, MXN, COP, CLP), elección de moneda principal (USD o EUR) y "Convertir" para pasar un saldo a la principal. Es todo inventado (`currencyBalances` y `CURRENCIES` en [mock-wallet.ts](src/lib/mock-wallet.ts)), con tasas de referencia fijas. Convertir lo simula.
  - **Saldos por moneda y conversiones:** salen de la API de Whop (o de Stripe, si se usa con saldos en varias monedas: Balance API por `currency` y conversiones de saldo). La **tasa real** y la comisión de cambio las da la pasarela al convertir: no hay que calcularlas nosotros.
  - **Tasas de referencia** para mostrar los "≈": una API de tipo de cambio (por ejemplo Open Exchange Rates o exchangerate.host, con API key), cacheada unas horas.
  - **Moneda principal:** es una preferencia de la cuenta que va a la base de datos. Hoy vuelve a USD al recargar. Si la pasarela permite elegir la moneda de liquidación, hay que mandársela también.
  - **"Actualizar":** hoy simula. Con la API, trae los saldos al momento.
- **Cuentas para retirar** ([accounts.tsx](src/components/wallet/accounts.tsx)): se eligen en el desplegable de la card de saldos (sin cuenta elegida no se puede retirar) y se administran desde el botón "Cuentas": ver, agregar (cuenta bancaria con CBU/CVU/alias, Mercado Pago o USDT), editar, eliminar (no deja si tiene un retiro en camino) y elegir la predeterminada. Hoy los cambios quedan solo en pantalla. Falta: guardarlas cifradas en la base de datos, **validar titularidad** (que el CBU/CVU sea del vendedor: hay APIs bancarias o de Coelsa/BCRA vía proveedores, o una transferencia de prueba) y verificar las billeteras cripto antes del primer retiro.
- **Reglas que hoy están fijas en el código:** retiro mínimo de $10 y comisión por cuenta ($1 en USDT). Tienen que salir de la configuración de la plataforma.

### 1.3 País del comprador ⬜

- **Dónde se ve:** país con bandera en el panel de detalle de la orden ([order-drawer.tsx](src/components/dashboard/order-drawer.tsx)) y en [Clientes](src/app/dashboard/clientes/page.tsx).
- **Hoy:** se elige al azar de una lista fija (`countries` y `COUNTRY_FLAGS` en [mock-data.ts](src/lib/mock-data.ts)).
- **De dónde sale (de más a menos confiable):**
  1. **País de facturación de la pasarela:** Stripe (`billing_details.address.country`), Mercado Pago (datos del pagador) o PayPal (`payer.address.country_code`). Es el dato más real.
  2. **Por IP al momento de comprar:** si deployamos en Vercel, viene gratis en el header `x-vercel-ip-country` (sin API key). Si no, una base GeoIP como MaxMind GeoLite2 (cuenta gratuita y licencia).
- **Ciudad y teléfono** (panel de detalle de la orden): hoy inventados (`COUNTRY_DETAILS` en [mock-data.ts](src/lib/mock-data.ts)). El teléfono lo pide nuestro checkout (es propio, va a la base de datos). La ciudad sale de la pasarela (dirección de facturación) o de la IP (Vercel da `x-vercel-ip-city`).
- **Banderas:** se calculan solas a partir del código ISO del país (por ejemplo "AR" da 🇦🇷), sin API. Cuando haya datos reales, reemplazar la tabla fija por esa conversión.

### 1.4 Origen del tráfico: de dónde llegó el cliente ⬜

- **Dónde se ve:** fila "Canal" de la sección "Origen" en el panel de detalle de la orden ([order-drawer.tsx](src/components/dashboard/order-drawer.tsx)). Opciones: Facebook Ads, Instagram, TikTok, Google, Email o Directo.
- **Hoy:** se elige al azar (`sources` en [mock-data.ts](src/lib/mock-data.ts)).
- **De dónde sale:**
  - **Parte propia, sin API:** la página de venta y el checkout guardan los parámetros con los que llegó el visitante (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid`, `ttclid`) y el `referrer`. Se guardan en una cookie y se asocian a la orden al pagar.
  - Con eso se clasifica el origen: `fbclid` o `utm_source=facebook` es Meta, `gclid` es Google, `ttclid` es TikTok, sin nada es Directo.
- **Base de datos:** la tabla de órdenes necesita los campos `utm_*`, `click_id`, `referrer` y `landing_url`.

### 1.5 De qué anuncio de Meta vino y desde cuál compró ⬜

- **Dónde se ve:** sección "Origen" del panel de detalle de la orden ([order-drawer.tsx](src/components/dashboard/order-drawer.tsx)): fuente / medio, campaña, conjunto y anuncio. Más adelante también en una vista de "Marketing" (ya está en el menú como "próximamente").
- **Hoy:** campaña, conjunto y anuncio inventados (`attribution` en `addDetails()` de [mock-data.ts](src/lib/mock-data.ts)).
- **Qué queremos:** campaña, conjunto de anuncios y anuncio exacto que trajo la venta, y si compró en el primer clic o volvió después.
- **De dónde sale:**
  1. **Parámetros de URL en los anuncios:** en Meta Ads Manager se configura `utm_campaign={{campaign.id}}&utm_term={{adset.id}}&utm_content={{ad.id}}`. Así cada venta guarda los IDs. Para esto no hace falta API.
  2. **Meta Marketing API:** con esos IDs se piden los nombres, la miniatura del anuncio, el gasto, etc. Necesita:
     - una app en Meta for Developers,
     - login con Facebook del vendedor (OAuth) con permiso `ads_read` (y `business_management` si maneja varios Business),
     - **App Review de Meta** para usarla con usuarios que no sean de prueba (tarda días o semanas: arrancarla temprano).
     - Atajo sin API: Meta también acepta `{{campaign.name}}`, `{{adset.name}}` y `{{ad.name}}` en la URL, así que los nombres pueden llegar directo en los UTM. Sirve para arrancar, pero si el vendedor renombra el anuncio queda el nombre viejo. Conviene guardar siempre también los IDs.
  3. **Meta Pixel + Conversions API (CAPI):** para mandarle a Meta las compras y que optimice los anuncios. El pixel va en el navegador. CAPI se manda desde nuestro servidor con un token del pixel.
- **Lo mismo para TikTok Ads** (TikTok Marketing API + Events API) **y Google Ads** (Google Ads API, requiere developer token aprobado).

### 1.6 Envío y seguimiento del email de entrega ⬜

- **Dónde se ve:** sección "Email de entrega" del panel de detalle de la orden ([order-drawer.tsx](src/components/dashboard/order-drawer.tsx)): enviado, entregado y abierto, con fecha y hora. Botón "Reenviar entrega".
- **Hoy:** eventos inventados (`emailEvents` en [mock-data.ts](src/lib/mock-data.ts)). El botón no hace nada.
- **De dónde sale:** un servicio de email transaccional (Resend, Postmark, SendGrid o Amazon SES) para mandar el producto al aprobarse el pago, más sus **webhooks** de entregado, abierto y rebotado, que se guardan por orden en la base de datos.
- **Permisos:** API key del servicio y **dominio verificado** (registros DNS SPF/DKIM) para que no caiga en spam.

### 1.7 Dominio propio de la tienda ⬜

- **Dónde se ve:** pestaña "Dominio" de cada tienda (Tiendas) ([dominio.tsx](src/components/settings/tabs/dominio.tsx)): el vendedor escribe su dominio, ve los registros DNS que tiene que cargar y toca "verificar".
- **De dónde sale:** si estamos en Vercel, Vercel Domains API para agregar el dominio del vendedor y verificar su DNS.

### 1.8 Configuración: conexiones con terceros ⬜

La configuración de cada tienda está en **Tiendas** (`/dashboard/tiendas/[id]`) y la de la cuenta en el engranaje (`/dashboard/configuracion`). Las pestañas están en [src/components/settings/tabs/](src/components/settings/tabs/), una por archivo. Cada tienda tiene su propia configuración (`getStoreSettings()`). Los datos de prueba están en [mock-settings.ts](src/lib/mock-settings.ts). Hoy nada se conecta: los botones "Conectar" no hacen nada y "Guardar cambios" simula el guardado.

| Pestaña | Qué se conecta | Qué necesita |
|---|---|---|
| **Pagos** | Mercado Pago, Stripe, PayPal (botón "Conectar") | OAuth de cada pasarela (ver 1.1). "Modo de cobro → Multidivisa" necesita una API de tipo de cambio para mostrar precios en moneda local. |
| **Checkout** | Medidor de "calidad de coincidencia" | Hoy son puntajes orientativos fijos. Meta da el real (Event Match Quality) en Events Manager y por la API de Conversiones. |
| **Integraciones → Meta** | Pixel + token de la API de Conversiones, verificación de dominio | Nuestro servidor manda eventos a `graph.facebook.com/{pixel}/events` con el token del vendedor. La verificación de dominio es una etiqueta `<meta>` que hay que poner en la tienda. |
| **Integraciones → Parámetros** | Plantillas UTM para Meta, TikTok y Google, con botón copiar | No necesita API: ya funciona. Del lado nuestro hay que guardar esos parámetros al entrar a la tienda (ver 1.4). |
| **Integraciones → TikTok** | Pixel + token de Events API | TikTok Events API (`business-api.tiktok.com`), con el token del vendedor. |
| **Integraciones → Google** | GA4 (`G-…`) y Google Ads (`AW-…`) | Se inyecta el script gtag en la tienda. Para mandar conversiones desde el servidor: GA4 Measurement Protocol (necesita un *API secret*) o Google Ads API (developer token aprobado). |
| **Integraciones → Clarity** | ID de proyecto | No necesita API: se inyecta el script de Clarity en la tienda y el checkout. |
| **Integraciones → Utmify** | Token de API | API/webhook de Utmify para mandarle cada venta. |
| **Integraciones → Brevo** | API key, reenvío de carritos de los últimos N días | Brevo API (contactos + eventos) para disparar sus automatizaciones. Hace falta guardar los carritos abandonados (2.4). |
| **Dominio** | Dominio propio con registros DNS (A y CNAME) y botón "verificar" | Hoy la verificación se simula. Vercel Domains API (agregar dominio y consultar si el DNS ya apunta) y certificado SSL, que Vercel emite solo. |
| **Webhooks** | Endpoints del vendedor, eventos, clave de firma, "Enviar prueba" | Es un sistema propio, no de terceros: una cola que mande un POST firmado con HMAC-SHA256 en el header `X-Firma` por cada evento, reintentos durante 32 horas y registro de cada envío. Hoy "Enviar prueba" simula un 200 OK. |
| **Notificaciones** | Instalar la app y avisos push | La app es una PWA (manifest + service worker). Los push necesitan Web Push con claves VAPID. Los emails, el servicio de email transaccional (1.6). |
| **Mi cuenta** | Contraseña, verificación en dos pasos, plan y facturas | Login (2.1). El 2FA con app de autenticación (TOTP) es propio. Plan y facturas: cobro de suscripciones (Stripe Billing o Mercado Pago suscripciones). |
| **General** | Subir ícono de la pestaña | Almacenamiento de archivos (S3, R2 o Supabase Storage). Idioma, zona horaria, moneda y datos de la tienda van a la base de datos. |
| **General → Apariencia** | Tema automático, claro u oscuro | No necesita nada: ya funciona y se guarda en el navegador. |

---

## 2. Datos propios (base de datos y backend, sin terceros)

No dependen de nadie más, pero hoy son datos de prueba. Hay que armar la base de datos, el login y las rutas del servidor.

### 2.1 Cuenta y login ⬜

- **Hoy:** "Hola, Lautaro 👋" en [overview.tsx](src/app/dashboard/overview.tsx). Nombre, email, nombre de la tienda y email de soporte están fijos en la pestaña "General" de cada tienda y "Mi cuenta" en Configuración, y "Guardar cambios" solo simula el guardado.
- **Falta:** autenticación (por ejemplo Auth.js, Clerk o Supabase Auth; "Login con Google" requiere credenciales de Google Cloud), tabla de usuarios y permisos para que cada vendedor vea solo lo suyo.

### 2.1.1 Notificaciones ⬜

- **Dónde se ve:** botón de la bandeja en el encabezado ([notifications-menu.tsx](src/components/dashboard/notifications-menu.tsx)): ventas nuevas, pagos y upsells rechazados, reembolsos y retiros acreditados, con punto de "sin leer" y "Marcar todo como leído".
- **Hoy:** se arman a partir de las ventas de prueba (`notifications` en [mock-data.ts](src/lib/mock-data.ts)). Lo leído se pierde al recargar.
- **Falta:**
  - Tabla de notificaciones por vendedor, con su marca de leída.
  - Se crean cuando llegan los webhooks de pago (1.1) y de retiros (1.2).
  - **En vivo** (que aparezcan sin recargar): Server-Sent Events, websockets o un servicio como Pusher, Ably o Supabase Realtime (los servicios necesitan su API key).
  - Opcional: avisos por email o push del navegador (Web Push necesita claves VAPID).

### 2.1.2 Menú del usuario ⬜

- **Dónde se ve:** nombre y avatar arriba a la derecha ([user-menu.tsx](src/components/dashboard/user-menu.tsx)), con "Mi cuenta" y "Configuración". También el engranaje del encabezado.
- **Hoy:** nombre, iniciales y tienda fijos (`user` en [shell.tsx](src/components/dashboard/shell.tsx)). Los links ya funcionan: llevan a [Configuración](src/app/dashboard/configuracion/page.tsx), y "Mi cuenta" abre directo esa pestaña.
- **Falta:** sacar los datos de la sesión (ver 2.1) y sumar "Cerrar sesión" cuando haya login.

### 2.2 Tiendas activas e inactivas ⬜

- **Hoy:** `activeStores` e `inactiveStores` en [mock-data.ts](src/lib/mock-data.ts), con sus ventas históricas inventadas. Los botones de [Tiendas inactivas](src/app/dashboard/tiendas-inactivas/page.tsx) (reactivar y eliminar) no hacen nada.
- **Falta:** tabla de tiendas (nombre, subdominio, estado, motivo de baja, fechas) y las acciones de pausar, reactivar y eliminar.
- **Imagen de la tienda:** en [Ventas](src/components/ventas/sales-history.tsx), la card "Por tienda" tiene un lugar para la foto de cada tienda, hoy vacío (`StoreImage`). Falta poder subirla (mismo almacenamiento que los archivos de productos, ver 2.3) y guardar su URL en la tabla de tiendas.

### 2.3 Productos y upsells ⬜

- **Hoy:** `products` en [mock-data.ts](src/lib/mock-data.ts). Botones de crear, editar, publicar y copiar link sin función.
- **Falta:** tabla de productos, tabla de upsells (qué producto se ofrece después de comprar cuál, y a qué precio) y subida de archivos entregables (necesita almacenamiento: S3, Cloudflare R2, Supabase Storage o similar).
- **Imagen del producto:** todas las imágenes de producto de la app salen de un solo componente, `ProductThumb` ([ui.tsx](src/components/dashboard/ui.tsx)), que hoy muestra el lugar vacío. Falta subirla (mismo almacenamiento que los entregables), guardar su URL en la tabla de productos y pasarla como `src`.

### 2.4 Ventas / órdenes ⬜

- **Hoy:** 40 ventas generadas en `buildSales()` ([mock-data.ts](src/lib/mock-data.ts)): número de pedido, cliente, email, producto, upsells, total, medio de pago, estado, fecha, país y origen.
- **Falta:** tabla de órdenes y tabla de ítems por orden (producto principal y upsells, cada uno con su precio). Se completa con los webhooks de pago (1.1), el país (1.3) y el origen (1.4).
- **Panel de detalle de la orden:** al tocar una venta en "Últimas ventas" se abre un panel lateral con cliente, productos, pago, origen y email. La UI ya funciona; los datos salen de los puntos 1.1, 1.3, 1.5 y 1.6.
- **"Ver todas" y "Exportar" en Ventas:** exportar a CSV se puede hacer propio, sin API.

### 2.5 Clientes ⬜

- **Hoy:** se arman a partir de las ventas de prueba (`customers` en [mock-data.ts](src/lib/mock-data.ts)).
- **Falta:** tabla de clientes (o una consulta agrupada sobre las órdenes).

### 2.6 Métricas: ingresos diarios, visitas, conversión, comparativas ⬜

- **Hoy:** 365 días de historial inventado (`revenueHistory`, `productDaily`, `inactiveStoreDaily`) y variaciones fijas (`revenueDelta: 18.4`, etc.) en [mock-data.ts](src/lib/mock-data.ts). Los cálculos de rangos y comparativas están en [analytics.ts](src/lib/analytics.ts) y sirven tal cual.
- **Falta:**
  - Ingresos y ventas: consultas sobre la tabla de órdenes.
  - **Visitas:** tracking propio en la página de venta (un evento por visita guardado en la base de datos). Alternativa: Vercel Analytics, Plausible o PostHog (cada uno con su API key).
  - Para que el dashboard no tarde, tablas de resumen diarias.

---

## 3. Cosas a decidir antes de la parte pesada

- **Base de datos:** Postgres. Opciones: Supabase, Neon o Vercel Postgres, con un ORM como Prisma o Drizzle.
- **Hosting:** Vercel. Encaja con Next.js y da gratis el país por IP (1.3) y los dominios (1.6).
- **Moneda:** hoy todo es USD ([site.ts](src/config/site.ts)). Con varias pasarelas y países van a llegar pagos en ARS, MXN, etc. Hay que decidir si se convierte (necesita una API de tipo de cambio) o se muestra cada venta en su moneda.
- **Zona horaria:** hoy las fechas se muestran en UTC. Hay que guardar la zona del vendedor y mostrar todo en su hora.
