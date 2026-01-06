# 🎨 Tareas Pendientes - Specialist Frontend

> Última actualización: 2026-01-06

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

- [x] **Botón "Aceptar Presupuesto" visible (no es MVP)**
  - Fix: Removido de `client/requests/[id]/page.tsx`
  - Eliminado: import de `useAcceptQuote`, variable `canAcceptQuote`, botón

- [x] **Campanita de notificaciones rota en 360px**
  - Fix: Dropdown responsive con `fixed` positioning en mobile
  - Archivo: `components/notifications/notification-bell.tsx`

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

| PR | Estado | Descripción |
|----|--------|-------------|
| #3 | 🟡 Pendiente merge | fix: Campanita mobile responsive |
| - | 🔴 Por crear | fix: Role param en hooks + remover Accept Quote |

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

- [ ] Consistencia en badges de estado
- [ ] Iconografía unificada
- [ ] Colores de estado estandarizados
- [ ] Tipografía responsive

---

## 📅 Prioridades

### Esta Semana
1. Crear PR con fixes de hooks + Accept Quote
2. Merge PR #3 (campanita mobile)
3. Verificar manejo de 403

### Próxima Semana
1. Empty states y loading states
2. Revisar responsive en todas las páginas
3. Traduciones completas

---

## 📌 Notas

- Usar `@tanstack/react-query` devtools para debugging
- El hook `useRequest` ahora puede devolver 403, actualizar manejo de error
- Considerar extraer lógica de permisos a un hook `useCanViewRequest`

