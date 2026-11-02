# NutriLesiones · Frontend (Angular)

Menú del día para futbolistas lesionados: el nutricionista escribe los datos del jugador y la app muestra cinco comidas con alimentos reales, fotos, porciones, medidas caseras e intercambios. El cálculo lo hace el backend .NET (no se modifica); este proyecto es solo la interfaz.

- Angular 21 (componentes standalone, formularios reactivos, signals, TypeScript estricto, SCSS). Probado con Node 22. Si instalas el CLI más reciente y tu Node es compatible, el código no cambia.
- Sin librerías de UI. Fuentes con `@fontsource-variable` (sin CDN). Sin emojis; íconos SVG propios.
- Los datos personales solo viven en memoria: no se usa `localStorage` ni `sessionStorage`.
- Al servidor solo se envían **peso** y **fase** (y la lesión si se eligió, porque el contrato la acepta). Nombre, edad, altura, sexo y posición solo se muestran en pantalla.

## Cómo ejecutar (Windows, PowerShell)

### Backend en local
```
winget install Microsoft.DotNet.SDK.8        # solo la primera vez
Expand-Archive NutriLesiones.Api.zip -DestinationPath .
cd NutriLesiones.Api
dotnet run --urls http://localhost:5099
```
Probar: http://localhost:5099 (página de prueba del backend) y `Invoke-RestMethod http://localhost:5099/api/salud`.
Si solo tienen .NET 10: `(Get-Content NutriLesiones.Api.csproj) -replace 'net8.0','net10.0' | Set-Content NutriLesiones.Api.csproj`

### Frontend en local (Node 20 o superior; ajusta las banderas a la versión de Angular)
```
npm install -g @angular/cli
ng new nutrilesiones-web --style=scss --routing=false --skip-git
cd nutrilesiones-web
npm install @fontsource-variable/fraunces @fontsource-variable/nunito-sans
ng serve -o          # abre http://localhost:4200
ng test --watch=false
```
Esos comandos crean un proyecto vacío. Para usar **este** proyecto ya hecho, después de `ng new` y de instalar las fuentes, copia encima de la carpeta creada todo lo que viene en este repositorio (`src/`, `public/`, `scripts/`, `angular.json`, `package.json`, `vercel.json`, `Dockerfile`, `nginx.conf`, `.dockerignore`, `.gitignore`, `README.md`) y ejecuta `npm install` otra vez. Si descargas este proyecto completo, basta con `npm install` y `ng serve -o`.

Notas:
- Con Node 22 recién actualizado o Node 20.19 en adelante `ng new` funciona sin problemas. Si `npm install` falla con un error raro de `edgesOut` (error conocido de algunas versiones de npm), usa `npm install --legacy-peer-deps`.
- En local se usa `src/environments/environment.ts` (`http://localhost:5099`). Deja el backend corriendo en otra ventana.

### Subir a GitHub y desplegar
```
git init
git add .
git commit -m "NutriLesiones"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```
Backend: en Render, New > Web Service > conectar el repo del backend > Runtime Docker > plan Free > Health Check Path /api/salud.
Frontend: en Vercel, Add New > Project > importar el repo del frontend > variable de entorno `API_URL=https://TU-API.onrender.com` > Deploy.

## Despliegue (sin editar código, solo configuración)

Arquitectura: backend .NET en Render (Docker) + frontend estático en Vercel.

1. **Backend en Render.** Sube la carpeta `NutriLesiones.Api` a un repo, crea el Web Service (Docker, plan Free, Health Check Path `/api/salud`) y copia su URL, por ejemplo `https://nutrilesiones-api.onrender.com`.
2. **Variable en Vercel.** En el proyecto de Vercel: Settings > Environment Variables > `API_URL` = esa URL (con `https://`, sin barra final).
3. **Desplegar el frontend.** Vercel usa `vercel.json`: `buildCommand` = `npm run build`, `outputDirectory` = `dist/nutrilesiones-web/browser` (ruta real del builder `application` de Angular 21, confirmada al compilar) y un rewrite de SPA a `/index.html`.
4. **CORS.** En Render agrega la variable `CORS_ORIGINS=https://tu-front.vercel.app` (varias URL separadas por coma). Sin ella el backend acepta cualquier origen.
5. **Prueba rápida.** Abre la página, genera un menú y comprueba que se ven las fotos.

Cómo funciona `API_URL`:
- `scripts/set-env.js` genera `src/environments/environment.prod.ts` desde `process.env.API_URL` antes de cada `ng build` (`npm run build`).
- En Vercel (o con `CI=true` / `NODE_ENV=production` / `REQUIRE_API_URL=1`) el build **falla con un mensaje claro** si `API_URL` falta o no empieza con `https://`.
- Ese archivo no se sube a Git (está en `.gitignore`). No hay `localhost` en el código de la app; solo existe en `environment.ts` de desarrollo.
- Producción: sin sourcemaps, presupuestos de tamaño en `angular.json` (inicial: aviso 350 kB, error 600 kB; el build actual pesa unos 281 kB, 76 kB comprimido).

### Alternativa opcional: Docker + nginx
```
docker build --build-arg API_URL=https://TU-API.onrender.com -t nutrilesiones-web .
docker run -p 8080:80 nutrilesiones-web
```
`nginx.conf` incluye fallback a `index.html`, gzip y caché de un año para archivos con hash.

### Servidor gratuito dormido
Al abrir la página se hace un ping silencioso a `GET /api/salud` para despertar el servidor de Render mientras se llena el formulario. Arriba a la derecha se ve el estado (Conectando / Despertando / Servidor listo / Sin conexión). Si no responde, reintenta solo hasta 5 veces.

## Estructura del proyecto
```
nutrilesiones-web/
├─ angular.json · package.json · tsconfig*.json
├─ vercel.json · Dockerfile · nginx.conf · .dockerignore · .gitignore
├─ scripts/set-env.js
├─ public/favicon.svg
└─ src/
   ├─ index.html · main.ts · styles.scss
   ├─ environments/environment.ts · environment.prod.ts (generado)
   └─ app/
      ├─ app.ts · app.html · app.scss · app.config.ts
      ├─ core/
      │  ├─ models/api.models.ts            (contrato de la API)
      │  └─ services/
      │     ├─ api.service.ts               (HTTP + mensajes de error en español)
      │     ├─ servidor.service.ts          (ping /api/salud + catálogos)
      │     ├─ plan.store.ts / .spec.ts     (menús, historial de 5, cancelar, intercambios)
      ├─ features/
      │  ├─ formulario/paciente-form.component.{ts,html,scss}
      │  └─ resultado/
      │     ├─ resultado.component.{ts,html,scss}
      │     ├─ barras-adecuacion.component.{ts,html,scss}
      │     ├─ alimento-item.component.{ts,html,scss}
      │     └─ formato.ts
      └─ shared/
         ├─ directives/ filtro-entrada.base.ts · solo-letras · solo-digitos · solo-peso · directivas.spec.ts
         ├─ validators/ paciente.validators.ts · .spec.ts
         ├─ utils/ texto.ts · texto.spec.ts
         └─ ui/ icono · logo · ayuda
```

## Decisiones de diseño
- **Contraste.** Los colores de la paleta se respetan como variables. Pero `--terracota` (#C4572D), `--verde-hoja` y `--ambar` no llegan a 4,5:1 como color de texto sobre crema o papel. Por eso se usan solo para líneas, bordes, marcadores y rellenos, y el **texto** va con variantes más oscuras (`--terracota-texto` #A8431F, `--verde-hoja-texto`) o en `--tinta`. Las etiquetas ámbar llevan texto `--tinta` (6,5:1).
- **Fotos.** Salen de `${apiUrl}/${foto}`; no se copian al frontend. Si una foto falla al cargar se muestra «Sin foto».
- **Descripción de cada fase.** El texto de ayuda bajo el select se basa en las kcal por kg que usa el backend (30 y 40). No añade datos clínicos.
- **Intercambios.** Conservan las porciones; el aporte por comida lo calcula el backend y no se recalcula en pantalla.

## Heurística de Nielsen → dónde se aplica

| # | Heurística | Decisión concreta | Archivo / componente |
|---|---|---|---|
| 1 | Visibilidad del estado | «Generando el menú…» con barra y aviso de servidor lento; estado de conexión (Conectando/Listo); encabezado «Menú N para [nombre] · [peso] kg · fase [x]»; validación en vivo | `app.html`, `servidor.service.ts`, `resultado.component.html`, `paciente-form.component.html` |
| 2 | Lenguaje del mundo real | Porciones, intercambios, medida casera, comidas del día; sin «semilla» ni «payload»; «Carbohidratos» completo (CHO en tooltip); unidades siempre visibles | `barras-adecuacion.component.*`, `alimento-item.component.html`, `paciente-form.component.html` |
| 3 | Control y libertad | Deshacer intercambio y deshacer el último; menú anterior/siguiente (últimos 5); cancelar petición; «Limpiar formulario» con confirmación; «Generar otro menú» sin reescribir | `plan.store.ts`, `resultado.component.html`, `alimento-item.component.html`, `app.html` |
| 4 | Consistencia | Un botón principal y uno secundario (`.btn-principal`/`.btn-secundario`); etiquetas encima de los campos; siempre «porciones» e «Intercambiar por» | `styles.scss`, `paciente-form.component.html`, `alimento-item.component.html` |
| 5 | Prevención de errores | Directivas que bloquean teclas, pegado y arrastre; min/max; botón deshabilitado si el formulario es inválido; sin doble envío; unidades como sufijo; confirmación antes de limpiar | `shared/directives/*`, `paciente.validators.ts`, `plan.store.ts` (`generar`), `paciente-form.component.ts` |
| 6 | Reconocimiento antes que recuerdo | Etiquetas siempre visibles; ayuda corta bajo cada campo; descripción de la fase junto al select; resumen del jugador junto al resultado; leyenda «zona verde = 90 a 110 %» | `paciente-form.component.html`, `resultado.component.html`, `barras-adecuacion.component.html` |
| 7 | Flexibilidad y eficiencia | Orden de tabulación lógico; Enter envía; tecla G genera otro menú (fuera de campos); foco inicial en Nombre y en el resultado; datos en memoria durante la sesión | `app.ts` (`atajo`), `paciente-form.component.ts`, `resultado.component.ts`, `plan.store.ts` |
| 8 | Diseño minimalista | Detalle plegable: intercambios, aporte de nutrientes por comida, «¿Cómo funciona?» y glosario | `alimento-item.component.html`, `resultado.component.html`, `app.html` |
| 9 | Recuperación de errores | Mensajes en español que dicen qué pasó y cómo corregir; error 400 muestra su mensaje; sin conexión; servidor lento con Reintentar; sin JSON crudo; `aria-live` y `aria-invalid` | `api.service.ts` (`traducirError`), `paciente-form.component.ts`, `app.html` |
| 10 | Ayuda y documentación | Tooltips «?» (fase, adecuación, porciones); panel «¿Cómo funciona?» de 4 líneas; glosario corto | `shared/ui/ayuda.component.ts`, `app.html` |

## Pruebas automáticas
`ng test --watch=false` (Vitest): 37 pruebas. Cubren los ejemplos pedidos («Juan123» → «Juan», pegar «María #1» → «María», peso «7a» → «7», peso 20 → error de rango), validadores, y el estado (solo se envían peso y fase, historial de 5, cancelar, error 400, sin conexión, intercambio y deshacer).

## Pruebas manuales

Antes de empezar: backend en marcha y `ng serve -o`.

**Validaciones**
1. Al abrir, el cursor está en «Nombre completo».
2. Nombre: teclea `Juan123 #Pérez` → queda «Juan Pérez». Pega `María #1` → queda «María». Arrastra texto con números → se limpia. No deja empezar con espacio ni escribir dos espacios seguidos. Al salir del campo recorta y pone mayúscula inicial en cada palabra.
3. Nombre de una sola palabra, o con una palabra de 1 letra → mensaje «Escribe nombre y apellido…». Más de 60 caracteres: no deja teclear.
4. Edad: no acepta letras, `e`, `+`, `-`, `.`. Escribe 9 y 61 → error con el rango 10 a 60.
5. Peso: acepta `65,5` y `65.5`; `7a` → `7`; segundo separador y segundo decimal bloqueados. 20 y 151 → «El peso debe estar entre 25 y 150 kg. Escribe por ejemplo 65,5.»
6. Altura: solo dígitos; 99 y 231 → error con el rango 100 a 230.
7. Sexo, posición y fase vacíos y tocados → mensaje «Elige…». Lesión es opcional.
8. Con el formulario inválido, «Generar menú» está deshabilitado y debajo dice qué falta.

**Flujo completo**
9. Llena todo, pulsa Enter → «Generando el menú…» y luego el menú; el foco pasa al encabezado «Menú 1 para … · … kg · fase …».
10. Las 4 barras muestran la zona verde 90–110 % y el marcador con el %. Un valor fuera de rango se ve en terracota con texto «Fuera de la zona adecuada».
11. Línea de tiempo: 5 comidas con horario a la izquierda, kcal y «Ver aporte de nutrientes». Cada alimento: foto, nombre, porciones y «Cada porción: … (… g)».
12. Alimento sin foto → recuadro «Sin foto». Con foto de referencia → etiqueta ámbar «Foto de referencia» y el texto al pasar el mouse. Las notas y los avisos del backend se ven.
13. «Intercambiar por (N)» despliega las alternativas con miniatura; al elegir una reemplaza el alimento y mantiene las porciones; «Deshacer intercambio» lo revierte; «Deshacer último intercambio» también.
14. «Generar otro menú» (botón o tecla G con el foco fuera de un campo) crea el Menú 2 sin reescribir; «Menú anterior / siguiente» recorre hasta 5 menús.
15. «Imprimir / guardar PDF» abre la vista de impresión sin botones ni formulario y con fondo blanco.
16. «Limpiar formulario» con datos pide confirmación; «Cancelar» conserva todo.

**Errores de red y servidor lento**
17. Apaga el backend y recarga: estado «Sin conexión con el servidor» con «Reintentar». Enciéndelo y pulsa Reintentar → «Servidor listo».
18. Con el backend apagado, pulsa «Generar menú» → «Revisa tu conexión a internet…» con botón Reintentar, sin JSON ni errores técnicos.
19. En Render gratuito dormido: aparece «Despertando el servidor…» y, si la petición pasa de 8 segundos, «El servidor gratuito puede tardar unos 30 segundos en despertar». «Cancelar» detiene la espera sin perder los datos.
20. Error 400 (por ejemplo peso fuera de rango forzado desde otra herramienta): se muestra el mensaje del servidor.

**Despliegue**
21. En Vercel sin `API_URL` el build falla con «falta la variable de entorno API_URL». Con `http://` también falla.
22. Con `CORS_ORIGINS` puesto en Render, la página de Vercel funciona y una página de otro dominio recibe error de CORS.
23. En la página publicada: generar un menú y comprobar que las fotos cargan por HTTPS (sin contenido mixto).

**Heurísticas (revisión rápida)**
24. 1: carga, estado de conexión y encabezado. 2: no aparece «CHO» salvo en tooltip. 3: deshacer, anterior/siguiente, cancelar, limpiar con confirmación. 4: mismos botones y posiciones en toda la app. 5: teclas bloqueadas y botón deshabilitado. 6: etiquetas visibles, ayuda bajo campos, leyenda de barras. 7: Tab ordenado, Enter, tecla G. 8: detalles plegados. 9: mensajes de error claros. 10: tooltips «?», «¿Cómo funciona?» y glosario.
25. Accesibilidad: recorre todo con Tab (el foco siempre se ve), prueba con zoom 200 % y con «reducir movimiento» activado en el sistema.
