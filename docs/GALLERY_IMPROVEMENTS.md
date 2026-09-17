# Mejoras de galería de imágenes

Opciones para mejorar la visualización de galerías (fotos de solicitudes, galería de perfil profesional/empresa).

## Dónde hay galerías hoy

- **Fotos de solicitud (request photos):** `client/requests/[id]/page.tsx`, `specialist/requests/[id]/page.tsx` — grid de fotos/videos, click abre en nueva pestaña.
- **Perfil profesional/empresa:** fotos de galería en perfiles (si se muestran en detalle de proveedor).
- **Avatar / foto de perfil:** varios componentes usan `AuthenticatedImage` o `<img>` para una sola imagen.

## Herramientas recomendadas

### 1. Lightbox (abrir foto a tamaño completo)

Para que al hacer click no se abra en otra pestaña sino un overlay con zoom y navegación:

| Librería | Tamaño | Uso |
|----------|--------|-----|
| **yet-another-react-lightbox** | ~15kb gzip | Muy usada con React, soporta thumbnails, zoom, gestos. |
| **react-photo-view** | Ligera | Lightbox simple, buena en móvil. |
| **photoswipe** (vanilla) | ~45kb | Muy completa; hay wrappers React (e.g. `react-photoswipe`) si preferís la original. |

Recomendación: **yet-another-react-lightbox** — se integra bien con Next/React, soporta imágenes autenticadas pasando `src` por estado.

### 2. Layout tipo masonry (columnas de altura variable)

Útil si las fotos tienen proporciones muy distintas:

| Librería | Notas |
|----------|--------|
| **react-masonry-css** | CSS-based, sin deps pesadas. |
| **masonic** | Virtualizada, buena para muchas imágenes. |

Hoy el grid es `grid-cols-2 md:grid-cols-3` con `aspect-square` u `object-cover` — si querés mantener proporción real por foto, masonry mejora la vista.

### 3. Lazy loading

- **Nativo:** `<img loading="lazy" />` (ya soportado en todos los browsers).
- **react-lazy-load-image-component** — placeholder/blur mientras carga, opcional.

Con muchas fotos en una página, añadir `loading="lazy"` a las imágenes que quedan fuera del viewport inicial es suficiente en muchos casos.

### 4. Thumbnails + imagen grande

- Generar thumbnails en backend al subir (ej. con Sharp en Node o servicio tipo Cloudinary) y mostrar thumbnail en grid, imagen grande en lightbox.
- Si no hay thumbnails, se puede usar `srcset` o una URL con parámetro de tamaño si el almacenamiento (S3, Supabase Storage, etc.) lo soporta.

## Plan de implementación sugerido

1. **Corto plazo (sin nuevas deps):**
   - Añadir `loading="lazy"` a las imágenes de galerías y listados.
   - Mejorar accesibilidad: `alt` descriptivo, teclado (Escape para cerrar si luego hay lightbox).

2. **Lightbox:**
   - Instalar `yet-another-react-lightbox` (y opcionalmente `yarl/thumbnails` si hay muchas fotos).
   - En las páginas de detalle de solicitud, reemplazar `onClick={() => window.open(url, '_blank')}` por abrir el lightbox con la lista de `request.photos` y el índice clickeado.
   - Para imágenes privadas (`AuthenticatedImage`), pasar al lightbox la URL que ya resuelve el componente (o un callback que devuelva la URL con auth).

3. **Opcional (masonry):**
   - Si se prioriza “ver muchas fotos con proporción real”, añadir `react-masonry-css` solo en las vistas de galería grandes.

## Referencias

- [yet-another-react-lightbox](https://github.com/igordanchenko/yet-another-react-lightbox)
- [Native lazy loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading#images)
