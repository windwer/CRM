# Grupo 3 — Environment State Audit
**Date:** 2026-05-10
**Branch:** feature/sprint-grupo-3-b5-b6-b7

## Environment Summary Table

| Metric | smartcrm (dev) | smartcrm_test | smartcrm_pro |
|---|---|---|---|
| PostgreSQL | 16.13 | 16.13 | 16.13 |
| Migrations | 14 | 14 | 14 |
| Last migration | 2026-05-09 22:01 | 2026-05-09 22:02 | 2026-05-10 22:12 |
| Candidates | 35 | 0 | **34 ✅** |
| Offers | 7 | 1 | 3 |
| Template stages (offer_id IS NULL) | 10 | 10 | 10 |
| Users | 3 | 454 | 1 |

## Validation Checks

| Check | Expected | Actual | Status |
|---|---|---|---|
| smartcrm_pro candidates | 34 | 34 | ✅ |
| smartcrm_pro users | >= 1 | 1 (omartinez@smartway.es) | ✅ |
| All envs migrations | 14+ | 14 | ✅ |
| Template stages per env | 10 | 10 | ✅ |
| Santillana in pro | present | Inaki Santillana Garay | ✅ |

## TalentPoolStatus Enum (smartcrm_pro)
- `active`
- `may_fit_future`
- `discarded`

## Candidates table key columns
- `full_name` (NOT first_name/last_name)
- `salary_expectation_max` INT NOT NULL DEFAULT 0
- `currency` VARCHAR NOT NULL DEFAULT 'EUR'
- `talent_pool_status` TalentPoolStatus (nullable)

## Verdict: ✅ All environments healthy. Proceeding to Sprint B5.
