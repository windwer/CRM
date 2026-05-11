# is_locked Audit
**DB:** smartcrm
**Timestamp:** 2026-05-11T08:26:48.492Z

## Template global
| Pos | Slug | Name | isLocked |
|---|---|---|---|
| 1 | pending | Pendiente | true |
| 2 | awaiting_response | Pdte respuesta | false |
| 3 | interview_internal | Convocado a entrevista | false |
| 4 | sent_to_review | Pdte feedback Victor y Pilar | false |
| 5 | sent_to_client | Enviado a cliente | false |
| 6 | sent_to_review_client | Pdte feedback cliente | false |
| 7 | interview_client | Entrevista con cliente agendada | false |
| 8 | hired | Contratado | true |
| 9 | may_fit_future | Puede encajar a futuro | true |
| 10 | rejected | Descartado | true |

**Locked positions:** [1,8,9,10] — Expected [1,8,9,10] → ✅

## Per-offer stages
### "Data Analyst People Ops"
| Pos | Slug | isLocked |
|---|---|---|
| 1 | pending | true |
| 2 | awaiting_response | false |
| 3 | interview_internal | false |
| 4 | sent_to_review | false |
| 5 | sent_to_client | false |
| 6 | sent_to_review_client | false |
| 7 | interview_client | false |
| 8 | hired | true |
| 9 | may_fit_future | true |
| 10 | rejected | true |
Locked: [1,8,9,10]

### "Product Designer B2B"
| Pos | Slug | isLocked |
|---|---|---|
| 1 | pending | true |
| 2 | awaiting_response | false |
| 3 | interview_internal | false |
| 4 | sent_to_review | false |
| 5 | sent_to_client | false |
| 6 | sent_to_review_client | false |
| 7 | interview_client | false |
| 8 | hired | true |
| 9 | may_fit_future | true |
| 10 | rejected | true |
Locked: [1,8,9,10]

### "Talent Acquisition Partner"
| Pos | Slug | isLocked |
|---|---|---|
| 1 | pending | true |
| 2 | awaiting_response | false |
| 3 | interview_internal | false |
| 4 | sent_to_review | false |
| 5 | sent_to_client | false |
| 6 | sent_to_review_client | false |
| 7 | interview_client | false |
| 8 | hired | true |
| 9 | may_fit_future | true |
| 10 | rejected | true |
Locked: [1,8,9,10]

### "Senior Fullstack Engineer"
| Pos | Slug | isLocked |
|---|---|---|
| 1 | pending | true |
| 2 | awaiting_response | false |
| 3 | interview_internal | false |
| 4 | sent_to_review | false |
| 5 | sent_to_client | false |
| 6 | sent_to_review_client | false |
| 7 | interview_client | false |
| 8 | hired | true |
| 9 | may_fit_future | true |
| 10 | rejected | true |
Locked: [1,8,9,10]

### "Junior QA Automation"
| Pos | Slug | isLocked |
|---|---|---|
| 1 | pending | true |
| 2 | awaiting_response | false |
| 3 | interview_internal | false |
| 4 | sent_to_review | false |
| 5 | sent_to_client | false |
| 6 | sent_to_review_client | false |
| 7 | interview_client | false |
| 8 | hired | true |
| 9 | may_fit_future | true |
| 10 | rejected | true |
Locked: [1,8,9,10]

### "Backend Engineer Integrations"
| Pos | Slug | isLocked |
|---|---|---|
| 1 | pending | true |
| 2 | awaiting_response | false |
| 3 | interview_internal | false |
| 4 | sent_to_review | false |
| 5 | sent_to_client | false |
| 6 | sent_to_review_client | false |
| 7 | interview_client | false |
| 8 | hired | true |
| 9 | may_fit_future | true |
| 10 | rejected | true |
Locked: [1,8,9,10]

### "sdf"
| Pos | Slug | isLocked |
|---|---|---|
| 1 | pending | true |
| 2 | awaiting_response | false |
| 3 | interview_internal | false |
| 4 | sent_to_review | false |
| 5 | sent_to_client | false |
| 6 | sent_to_review_client | false |
| 7 | interview_client | false |
| 8 | hired | true |
| 9 | may_fit_future | true |
| 10 | rejected | true |
Locked: [1,8,9,10]

## Scenario: **OK**
