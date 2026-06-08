# FacturadorApp

Generador de facturas HTML estático con preview en vivo, persistencia local y respaldo en Google Sheets. Diseñado para deploy en Coolify via Docker.

## Stack

- HTML / CSS / JavaScript vanilla — sin frameworks, cero dependencias runtime
- html2canvas + jsPDF — generación de PDF desde el preview
- [GoogleSheet-Database](https://github.com/rodrigolopezguerra/GoogleSheet-Database) — API REST sobre Google Sheets para persistencia
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

### 1. Desplegar el backend de persistencia (GoogleSheet-Database)

Este facturador depende de [**GoogleSheet-Database**](https://github.com/rodrigolopezguerra/GoogleSheet-Database) para guardar el histórico de facturas y clientes. Sin él, los datos se pierden al cerrar el navegador.

Seguí las instrucciones de ese proyecto para desplegar el Web App de Apps Script. Al finalizar vas a tener:
- Una **URL** del Web App (`https://script.google.com/macros/s/.../exec`)
- Un **token** que elegiste
- Un **spreadsheet** vinculado

### 2. Configurar el frontend

Abrí la app en el navegador, click en **⚙️ Config** y completá:
- **API URL**: la URL del Web App que publicaste en el paso 1
- **Token**: el mismo token que elegiste en el paso 1
- Los nombres de las hojas (por defecto `Facturas` y `Clientes`, deben coincidir con las de tu spreadsheet)

Eso es todo. La configuración queda guardada en localStorage.

### 3. Verificar las hojas en el spreadsheet

En tu spreadsheet tienen que existir estas dos hojas con estos encabezados:

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

## API de persistencia (GoogleSheet-Database)

[GoogleSheet-Database](https://github.com/rodrigolopezguerra/GoogleSheet-Database) expone estos dos endpoints que el facturador consume:

### `GET ?action=read&sheet=NOMBRE&token=TOKEN`

Devuelve todas las filas de la hoja como JSON:

```json
{ "status": "success", "data": [ { "columna1": "valor1", ... } ] }
```

### `GET ?action=write&sheet=NOMBRE&id=X&...&token=TOKEN`

Agrega una fila nueva con los parámetros como columnas. Si la hoja está vacía, crea los encabezados automáticamente a partir de las keys de los parámetros.

> **Nota sobre seguridad**: La `apiUrl` y `token` se configuran desde el modal ⚙️ y se guardan en localStorage. El repo no contiene valores reales. Cada persona que clone el proyecto debe configurar los suyos.

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
