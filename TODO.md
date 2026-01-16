# 🎨 Tareas Pendientes - Specialist Frontend

> Última actualización: 2026-01-06 (actualizado)

---

## 📋 Resumen de Estado

| Feature | Estado | Tests | Mobile |
|---------|--------|-------|--------|
| Dashboard Cliente | ✅ | ⬜ | ✅ |
| Dashboard Especialista | ✅ | ⬜ | ✅ |
| Detalle Solicitud (Cliente) | ✅ | ⬜ | ✅ |
| Detalle Solicitud (Especialista) | ✅ | ⬜ | ✅ |
| Notificaciones | ✅ | ⬜ | ✅ |
| Job Board | ✅ | ⬜ | ⬜ |
| Perfiles | ✅ | ⬜ | ⬜ |

---

## 🐛 Bug Fixes

### ✅ Completados

- [x] **Solicitudes no aparecían en dashboard del especialista**
  - Causa: Hook `useProfessionalRequests` no pasaba `role=professional`
  - Fix: Agregar `?role=professional` y `?role=client` a los hooks
  - Archivo: `hooks/use-requests.ts`
  - PR: #4

- [x] **Botón "Aceptar Presupuesto" visible (no es MVP)**
  - Fix: Removido de `client/requests/[id]/page.tsx`
  - Eliminado: import de `useAcceptQuote`, variable `canAcceptQuote`, botón
  - PR: #4

- [x] **Campanita de notificaciones rota en 360px**
  - Fix: Dropdown responsive con `fixed` positioning en mobile
  - Archivo: `components/notifications/notification-bell.tsx`
  - PR: #3

- [x] **Edición de perfil profesional creaba en lugar de editar**
  - Causa: Setup page siempre hacía POST en lugar de PATCH
  - Fix: Detectar edit mode y usar PATCH, pre-rellenar form
  - Archivo: `app/[locale]/specialist/setup/page.tsx`
  - PR: #4

### ⬜ Pendiente

- [ ] **Revisar acceso a solicitudes por URL directa**
  - El backend ahora devuelve 403, ¿el FE lo maneja bien?
  - Mostrar mensaje apropiado al usuario

- [ ] **Traduciones faltantes identificadas**
  - Verificar que todas las keys de traducción estén completas
  - Revisar `messages/es.json` y `messages/en.json`

---

## 🗑️ Código Eliminado (No MVP)

### ✅ Eliminado

- [x] `useAcceptQuote` import en `client/requests/[id]/page.tsx`
- [x] `acceptQuoteMutation` variable
- [x] `handleAcceptQuote` función
- [x] `canAcceptQuote` lógica
- [x] Botón de "Aceptar Presupuesto" en Actions

### ⬜ Pendiente Evaluar

- [ ] ¿Eliminar traducciones relacionadas a quotes?
  - `acceptQuote`, `quote`, `amount`, etc.
  - Mantener si se planea implementar en futuro

---

## 📝 Pull Requests

### ✅ Mergeados

| PR | Descripción |
|----|-------------|
| #3 | fix: Campanita mobile responsive |
| #4 | fix: Professional profile edit + permissions |
| #5 | feat: Company profiles feature |

### 🟡 Pendiente Merge

_Ninguno por ahora_

---

## 🎯 Mejoras de UX Pendientes

### Alta Prioridad

- [ ] **Manejo de errores 403/401**
  - Mostrar mensaje amigable cuando no tiene permisos
  - Redirigir a dashboard si no puede ver una solicitud

- [ ] **Loading states consistentes**
  - Verificar que todos los componentes tengan loading state
  - Skeletons en lugar de spinners donde aplique

- [ ] **Empty states**
  - Mejorar mensajes cuando no hay datos
  - Agregar call-to-action relevante

### Media Prioridad

- [ ] **Optimistic updates**
  - Implementar en acciones frecuentes (marcar como leído, etc.)

- [ ] **Toast notifications**
  - Feedback visual para acciones completadas
  - Errores más claros

### Baja Prioridad

- [ ] **Animaciones y transiciones**
  - Page transitions
  - List animations

---

## 📱 Responsive Pendiente

- [ ] Job Board page (revisar en 360px)
- [ ] Perfil de especialista
- [ ] Formulario de nueva solicitud
- [ ] Lista de especialistas interesados

---

## 🧪 Tests Pendientes

- [ ] Configurar testing framework (Jest + RTL)
- [ ] Tests unitarios para hooks
- [ ] Tests de componentes críticos
- [ ] Tests E2E con Playwright/Cypress

---

## 🌐 Traducciones

### Verificar Completitud

- [ ] `messages/es.json` - Español
- [ ] `messages/en.json` - Inglés

### Keys Identificadas como Faltantes

```
navigation.specialists
specialist.requestDetail.interestExpressed
specialist.requestDetail.interestExpressedDescription
specialist.requestDetail.removeInterest
```

---

## 🎨 UI/UX Improvements

### Alta Prioridad

- [ ] **Tarjetas de especialista - Badge de empresa**
  - Mostrar badge "Empresa" si el especialista tiene perfil de empresa
  - Usar color distintivo (emerald) para diferenciarlo

- [ ] **Tarjetas de especialista - Cambiar texto del botón**
  - Cambiar "Solicitar" → "Contactar"
  - Más apropiado para el contexto de primer contacto

- [ ] **Formulario de solicitud directa - Ajustar descripción**
  - Actualizar textos para que se entienda que puede ser:
    - Un especialista independiente
    - Una empresa
  - Revisar labels y placeholders

### Media Prioridad

- [ ] Consistencia en badges de estado
- [ ] Iconografía unificada
- [ ] Colores de estado estandarizados
- [ ] Tipografía responsive

---

## 🏢 Feature: Company Profiles

### ✅ Completado (PR #5)

- [x] Types y API Client (`Company`, `CompanyStatus`, `ProviderType`, DTOs)
- [x] Hooks (`useMyCompanyProfile`, `useCreateCompany`, `useUpdateCompany`, etc.)
- [x] Company Setup page (`/company/setup`)
- [x] Company section en Profile page
- [x] Navigation: badge y acceso a Job Board
- [x] Traducciones ES/EN

### ⬜ Pendiente

- [ ] Company Dashboard page (`/company/dashboard`)
- [ ] Company puede expresar interés en requests (actualizar Job Board)
- [ ] Mostrar tipo de proveedor (Professional/Company) en interesados
- [ ] Company public profile page

---

## 📅 Prioridades

### Esta Semana
1. ~~Crear PR con fixes de hooks + Accept Quote~~ ✅ PR #4
2. ~~Merge PR #3 (campanita mobile)~~ ✅
3. ~~Company profiles feature~~ ✅ PR #5
4. Verificar manejo de 403

### Próxima Semana
1. Empty states y loading states
2. Revisar responsive en todas las páginas
3. Company Dashboard + expresar interés

---

## 📌 Notas

- Usar `@tanstack/react-query` devtools para debugging
- El hook `useRequest` ahora puede devolver 403, actualizar manejo de error
- Considerar extraer lógica de permisos a un hook `useCanViewRequest`
- Company usa colores `emerald` para diferenciarse de Professional (`blue`/`green`)

