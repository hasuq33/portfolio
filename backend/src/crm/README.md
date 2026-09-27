# CRM foundation

## Architecture

- `CrmLead` is the single lead/opportunity model (`crm_leads`). Conversion updates the same document atomically and preserves its ID and creation date. The old `Lead` collection is untouched; no automatic migration is performed.
- `CrmStage` and `CrmTag` are company-owned reference models. The existing `leads` ACL key covers CRM records and their reference data; the existing `crm` menu key controls navigation. No parallel ACL engine or new administrator-seeder logic is introduced.
- The generic `/api/:model` controller delegates all three CRM models to `CrmService`. `CommonService` deliberately refuses direct, context-free CRM access. Dedicated business actions live in `CrmController`.
- `AccessService.permittedCompanyIds` intersects user membership (`companyIds`, `allowedToAllCompanies`) with group permissions **for each company**. A write grant in company A cannot be used against a read-only record in company B. Every record query includes that scope, and an optional `X-Company-Id` narrows it further.
- CRUD responses include `_access` for company-specific form/action permissions. Client payloads cannot set conversion, closure or status audit fields.
- DTO validation uses the existing field-error response format. Search options are allowlisted, regular expressions are escaped, and client filters are always ANDed with the company scope.

## Routes

Frontend (all use the existing `ModelWorkspace` / `ListView` / `FormView`):

- `/web/crm` redirects to `/web/crm/leads`.
- `/web/crm/leads` and `/web/crm/leads/new` or `/:id`.
- `/web/crm/opportunities` and `/web/crm/opportunities/new` or `/:id`.
- `/web/crm/stages` and `/web/crm/tags`, with the same `/new` and `/:id` convention, are small reference-data screens linked from the corresponding fields. The main CRM menu contains only Leads and Opportunities.
- Opening the old lead URL after conversion redirects to the opportunity URL with the same ID.

API:

- `POST /api/CrmLead`, `POST /api/CrmLead/search`, `POST /api/CrmLead/read` (`{ id }`), `PUT /api/CrmLead/:id`, `DELETE /api/CrmLead/:id`.
- The same create/read/search/update infrastructure is registered for `CrmStage` and `CrmTag`.
- `POST /crm/leads/:id/convert` with `{}`.
- `POST /crm/opportunities/:id/status` with `{ status: "won" | "lost" | "open", lostReason?: string }`.
- Minimal, company-scoped company/user selectors use `/crm/lookups/companies/search` and `/crm/lookups/users/search`, plus `/read`. They disclose only IDs and display names (company code when relevant), not full User records.
- Stage-only updates use `PUT /api/CrmLead/:id` with `{ stageId }`; this is ready for the future Kanban client.

## Behavior and deliberate limits

- Company ownership is required and immutable after creation. User/company access is not redesigned.
- Default stages are inserted lazily for a company on CRM record creation/conversion. Stable seed keys and `$setOnInsert` make repeated and concurrent calls idempotent without overwriting renamed, reordered or archived stages. The first active stage is selected by `sequence`, never by its name.
- Conversion rejects already-converted records. Atomic type/status/version predicates reject racing transitions. Save/discard is required before running a form action.
- Won/lost set `dateClosed`; reopen clears it and preserves the last lost reason. Status changes do not silently change the stage or probability. No sales-order behavior is added.
- CRM records can be deleted only with delete permission and UI confirmation. Stages are archived, not deleted; tags are retained to avoid dangling references. Editing other stage fields still requires write permission even when the payload also archives a stage.
- Stage and tag management uses existing widgets. Many-to-many choices are searchable; the existing single-reference select shows at most 200 choices. Stage choices can be refreshed after editing them in another tab. A scalable searchable single-reference picker remains a shared-platform improvement, not a custom CRM control.
- No Kanban, activities, chatter, reporting, quotation, attachment or email features were added. Stage ordering is stored now; per-card manual ordering can be added when the Kanban behavior is specified.

## Verification

- `node node_modules/@nestjs/cli/bin/nest.js build`
- `node node_modules/jest/bin/jest.js --runInBand`
- Real API tests: set `CRM_TEST_MONGO_URI` to a reachable MongoDB server and run `src/crm/crm.integration.spec.ts`. The suite creates a random `codex_crm_test_<uuid>` database, boots the complete Nest application with real JWT/group guards, and removes only that exact test database afterward. It does not write to the configured application database.
- Frontend: `node --test tests/crm-workspace.test.cjs` covers metadata, list requests, save payloads, field validation, dirty-state action protection, confirmation, conversion routing and company-specific readonly behavior. Existing editor regression tests remain separate.
- Frontend production build: `node node_modules/next/dist/bin/next build`.

Manual signed-in check: CRM → Leads → New Lead → select company and enter title → Save → Convert to Opportunity → adjust stage/revenue/probability → Save → Mark Lost (reason) → Reopen → Mark Won. Confirm that the record ID never changes and that only the appropriate list contains it. Repeat with a read-only group and a second company to verify the visible action restrictions.
