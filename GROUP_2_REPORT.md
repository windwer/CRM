# GRUPO 2 — Sprint B2 + B3 + B4 Report
**Fecha:** 2026-05-10
**Rama:** `feature/sprint-grupo-2-b2-b3-b4`

## Resumen

| Sprint | Objetivo | Estado |
|--------|----------|--------|
| B2 | Settings: Flujos de oferta + Close offer flow | ✅ Completado |
| B3 | Dashboard refactor con filtro por oferta | ✅ Completado |
| B4 | Formulario ofertas + soft delete borradores | ✅ Completado |

## Verificación

| Métrica | Resultado |
|---------|-----------|
| Tests | 55/55 ✅ |
| TypeScript `--noEmit` | 0 errores ✅ |
| `next build` | Compilación OK ✅ |
| ESLint | 0 errores ✅ |
| Schema Prisma | Sin cambios ✅ |
| Archivos `.env` | Sin cambios ✅ |

---

## Sprint B2 — Flujos de oferta

### Endpoints creados
- `GET /api/settings/pipelines` — Devuelve template global y pipelines por oferta
- `POST /api/settings/pipelines` — 501 (solo plantilla Estándar soportada)
- `PATCH /api/settings/pipelines/[id]` — Renombrar stage template (403 si bloqueado)
- `DELETE /api/settings/pipelines/[id]` — 409 si slug en uso por stages de oferta
- `POST /api/offers/[id]/pipeline/stages` — Añadir stage intermedio (máx. 6, posiciones 2-7)
- `PATCH /api/offers/[id]/pipeline/stages/[stageId]` — Renombrar/reordenar (403 si bloqueado)
- `DELETE /api/offers/[id]/pipeline/stages/[stageId]` — 403 si bloqueado; 409 con `candidate_count` si hay candidatos; 204 si libre

### Close offer flow
- `POST /api/offers/[id]/close` — Detecta candidatos en stage `may_fit_future`; si existen devuelve `requires_confirmation: true`; si no, cierra directamente
- `POST /api/offers/[id]/close/confirm` — En `$transaction`: actualiza `candidate.talentPoolStatus = 'may_fit_future'`; cierra oferta como `closed_no_hire`

### Componentes frontend
- `PipelineEditor` — Editor visual de stages con Up/Down chevrons + Trash; modal "Añadir stage"; modal bloqueado (409)
- `/settings/flujos-de-oferta` — Página con template global (read-only) + acordeón por oferta
- `CloseOfferModal` — Actualizado para usar el nuevo flujo `/close` + `/close/confirm` con paso de confirmación de candidatos

### Validaciones
- `packages/web/src/lib/validations/pipeline.ts` — `addStageSchema`, `updateStageSchema`, `pipelineRenameSchema`; `LOCKED_POSITIONS = [1, 8, 9, 10]`

---

## Sprint B3 — Dashboard refactor

### Endpoint
- `GET /api/dashboard/stats` — Refactorizado con:
  - `?offer_id=<uuid>` filter (validación UUID; 400 si inválido)
  - `total_applications` = últimos 30 días
  - `Cache-Control: private, max-age=300, stale-while-revalidate=60`
  - Respuesta tipada como `DashboardStats`

### Frontend
- `useDashboard(offerId?)` — `staleTime: 5 min`, `refetchInterval: 5 min`
- `KPICards` — Tipado con `DashboardKpis`; eliminada tarjeta GDPR; grid `lg:grid-cols-5`
- `TopOffers` — Tipado con `TopOfferItem`
- `RecentActivity` — Tipado con `RecentActivityItem`
- Dashboard page — Select "Funnel de candidatos" con filtro por oferta activa (estado no persistente)

---

## Sprint B4 — Formulario ofertas

### Endpoints
- `GET /api/users` — Lista usuarios activos (`{ id, name, email, role }`), ordenados por nombre

### Frontend
- `OfferForm` — Campo "Gestionada por" (Select) cargado desde `/api/users`; default = `session.user.id`; required
- `DeleteDraftConfirmModal` — Modal de confirmación para borrar oferta en borrador; llama `DELETE /api/offers/[id]`
- `/dashboard/offers/[id]` — Botón "Eliminar borrador" visible solo cuando `status === "draft"`

### Validación
- `offerSchema.assignedToUserId` — Cambiado de `.optional()` a `.uuid("Asignación obligatoria")` (required)

---

## Archivos creados

| Archivo | Tipo |
|---------|------|
| `src/lib/validations/pipeline.ts` | Zod schemas pipeline |
| `src/app/api/settings/pipelines/route.ts` | API settings |
| `src/app/api/settings/pipelines/[id]/route.ts` | API settings |
| `src/app/api/offers/[id]/pipeline/stages/route.ts` | API pipeline stages |
| `src/app/api/offers/[id]/pipeline/stages/[stageId]/route.ts` | API pipeline stages |
| `src/app/api/offers/[id]/close/route.ts` | API close offer |
| `src/app/api/offers/[id]/close/confirm/route.ts` | API close confirm |
| `src/app/api/users/route.ts` | API users |
| `src/components/settings/PipelineEditor.tsx` | UI editor |
| `src/app/dashboard/(dashboard)/settings/flujos-de-oferta/page.tsx` | UI page |
| `src/components/offers/DeleteDraftConfirmModal.tsx` | UI modal |
| `src/__tests__/api/settings-pipelines.smoke.test.ts` | Tests (7) |
| `src/__tests__/api/offer-close-migration.smoke.test.ts` | Tests (4) |
| `src/__tests__/api/dashboard-stats.smoke.test.ts` | Tests (5) |
| `src/__tests__/api/users.smoke.test.ts` | Tests (5) |
| `audit-evidence/grupo-2/test-run.log` | Evidencia |
| `audit-evidence/grupo-2/diff-stat.log` | Evidencia |

## Archivos modificados clave

| Archivo | Cambio |
|---------|--------|
| `src/types/dashboard.ts` | Tipos `DashboardStats`, `DashboardKpis`, `RecentActivityItem`, `TopOfferItem` |
| `src/app/api/dashboard/stats/route.ts` | Refactor completo con filtro + cache |
| `src/hooks/useDashboard.ts` | Soporte `offerId?` + staleTime/refetch |
| `src/components/dashboard/KPICards.tsx` | Tipado + 5 cols + sin GDPR |
| `src/components/offers/CloseOfferModal.tsx` | Flujo /close + /close/confirm |
| `src/components/offers/OfferForm.tsx` | Campo `assignedToUserId` |
| `src/lib/validations/offer.ts` | `assignedToUserId` required |
| `src/app/api/offers/[id]/route.ts` | DELETE soft-delete borrador |
