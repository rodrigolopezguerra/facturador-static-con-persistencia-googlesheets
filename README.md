# FacturadorApp

Generador de facturas HTML estático con preview en vivo, persistencia local y respaldo en Google Sheets. Diseñado para deploy en Coolify via Docker.

## Stack

- HTML / CSS / JavaScript vanilla — sin frameworks, cero dependencias runtime
- html2canvas + jsPDF — generación de PDF desde el preview
- Google Apps Script — API REST que escribe en un spreadsheet
- Docker + nginx:alpine — servidor estático listo para Coolify

## Funcionalidades

| Feature | Detalle |
|---|---|
| Preview en vivo | La factura se actualiza mientras completás los campos |
| Presets | Guardás y cargás configuraciones completas de factura |
| Logo personalizado | Subís una imagen, se guarda en localStorage y aparece en la factura |
| Clientes recurrentes | Guardás destinatarios y los cargás con un click |
| Emisor recurrente | Misma mecánica para los datos del emisor |
| USD / ARS | Selector de moneda con formato correcto |
| Items dinámicos | Agregar / quitar líneas, totales autocalculados sin perder foco |
| PDF | Descargás la factura como PDF con un botón |
| Google Sheets | Cada factura se persiste en un spreadsheet vía Apps Script |
| Persistencia | localStorage recuerda la última factura, clientes, emisores, logo y config |

## Primeros pasos después de clonar

Este repo está limpio de secretos — los valores reales los configurás vos localmente.

### 1. Configurar el backend (Apps Script)

Abrí [`Code.gs`](Code.gs) y reemplazá los placeholders:

```js
SPREADSHEET_ID: 'TU_SPREADSHEET_ID',     // el ID de tu spreadsheet de Google
TOKEN: 'TU_TOKEN_SECRETO'                 // cualquier string que quieras como llave
```

Luego:
1. Copiá `Code.gs` a un nuevo proyecto en [script.google.com](https://script.google.com)
2. Publicá como Web App: *Deploy > New Deployment > Web App*
   - **Execute as**: `Yo`
   - **Who has access**: `Anyone`
3. Copiá la URL generada (la vas a necesitar en el paso 2)

### 2. Configurar el frontend

Abrí la app en el navegador, click en **⚙️ Config** y completá:
- **API URL**: la URL del Web App que publicaste
- **Token**: el mismo `TOKEN` que elegiste en `Code.gs`
- Los nombres de las hojas (por defecto `Facturas` y `Clientes`)

Eso es todo. La configuración queda guardada en localStorage.

### 3. Crear las hojas en el spreadsheet

En tu spreadsheet, creá dos hojas con estos nombres y encabezados:

**Hoja `Facturas`**:
```
id | invoice_number | order_number | date | due_date | currency | emisor_name | emisor_tax_id | emisor_address | destinatario_name | destinatario_tax_id | destinatario_address | items | subtotal | total | email | created_at
```

**Hoja `Clientes`**:
```
id | nombre | tax_id | direccion | email
```

No hace falta que tengan datos; el sistema las completa solo.

## Cómo funciona

El frontend es un HTML estático servido por nginx. No hay backend. Los datos se guardan en dos lugares:

1. **localStorage del navegador** — para recordar la última sesión, presets, clientes, emisores y logo
2. **Google Sheets via Apps Script** — para el histórico de facturas y clientes (configurable)

## Dependencia externa: Google Apps Script

Este proyecto requiere un Web App de Google Apps Script desplegado que exponga dos endpoints:

### `GET ?action=read&sheet=NOMBRE&token=TOKEN`

Devuelve todas las filas de la hoja como JSON:

```json
{ "status": "success", "data": [ { "columna1": "valor1", ... } ] }
```

### `GET ?action=write&sheet=NOMBRE&id=X&...&token=TOKEN`

Agrega una fila nueva con los parámetros como columnas. Si la hoja está vacía, crea los encabezados automáticamente a partir de las keys de los parámetros.

El archivo [`Code.gs`](Code.gs) de este repo contiene una implementación funcional que podés copiar a tu proyecto de Apps Script.

Si preferís una solución más completa con CRUD (leer por clave, actualizar, eliminar y control de unicidad), usá de base el proyecto [**GoogleSheet-Database**](https://github.com/rodrigolopezguerra/GoogleSheet-Database). La API es compatible: solo cambia la URL en la configuración y ajustá los nombres de las columnas en tu spreadsheet para que coincidan con los parámetros que envía el frontend.

### Columnas esperadas en la hoja `Facturas`

```
id | invoice_number | order_number | date | due_date | currency | emisor_name | emisor_tax_id | emisor_address | destinatario_name | destinatario_tax_id | destinatario_address | items | subtotal | total | email | created_at
```

### Columnas esperadas en la hoja `Clientes`

```
id | nombre | tax_id | direccion | email
```

### Configuración del Apps Script

1. Copiá [`Code.gs`](Code.gs) a un nuevo proyecto en [script.google.com](https://script.google.com)
2. Actualizá `SPREADSHEET_ID` con el ID de tu spreadsheet (lo sacás de la URL: `docs.google.com/spreadsheets/d/`**`ACA_EL_ID`**`/edit`)
3. Cambiá `TOKEN` por el valor que quieras usar
4. Publicá como Web App: *Deploy > New Deployment > Web App*
   - **Execute as**: `Yo`
   - **Who has access**: `Anyone`
5. Copiás la URL generada

> **Nota sobre seguridad**: Los valores del `SPREADSHEET_ID` y `TOKEN` en `Code.gs`, y la `apiUrl` y `token` en `index.html`, se reemplazaron por placeholders vacíos. Nunca subas valores reales al repo público. Cada persona que clone el proyecto debe configurar los suyos.

## Deploy en Coolify

### Opción 1: Desde Dockerfile (recomendada)

```bash
docker build -t facturador .
docker run -d -p 8080:80 facturador
```

En Coolify:
1. Creá un nuevo **Service**
2. **Build pack**: `Dockerfile`
3. **Port**: `80`
4. Listo — no necesita base de datos ni variables de entorno

### Opción 2: Servir directo

Si no querés Docker, cualquier servidor HTTP sirve el `index.html`:

```bash
python3 -m http.server 8080
```

## Configuración inicial

1. Abrí la app en el navegador
2. Click en **⚙️ Config** (header)
3. Completá:
   - **API URL**: la URL del Web App de Apps Script (`https://script.google.com/macros/s/.../exec`)
   - **Token**: el mismo que configuraste en `Code.gs`
   - **Hoja de Facturas**: nombre de la hoja (default: `Facturas`)
   - **Hoja de Clientes**: nombre de la hoja (default: `Clientes`)
4. Guardá — todo queda persistido en localStorage

## Estructura del proyecto

```
Facturador/
├── index.html           # App completa (formulario + preview + lógica)
├── Code.gs              # Apps Script para Google Sheets (backend)
├── Dockerfile           # Imagen nginx:alpine para Coolify
├── docker-compose.yml   # Test local rápido
├── .dockerignore
└── README.md
```

## Licencia

CC BY 4.0 — como el proyecto del que depende.
