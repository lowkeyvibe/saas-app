@AGENTS.md

## Reglas del proyecto

- Por ahora la app es solo interfaz: los datos son de prueba y salen de `src/lib/mock-data.ts`. No conectar APIs externas ni base de datos todavía, salvo que se pida.
- **Mantener `INTEGRACIONES.md` al día.** Cada vez que se agrega o cambia UI que muestra un dato que en la realidad viene de una API externa (pagos, Meta, geolocalización, etc.) o de la base de datos, anotarlo ahí en la sección que corresponda: dónde se ve, qué es hoy, de dónde va a salir y qué permisos o credenciales necesita. Si algo se conecta de verdad, marcarlo ✅.
- Todo lo que se pueda resolver dentro de la propia app sin terceros (navegación, filtros, cálculos sobre los datos) se hace funcional ya, aunque los datos sean de prueba.
