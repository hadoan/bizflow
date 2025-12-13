

# Freelancer Module Backlog

## Global assumptions

* One freelancer workspace can have: **clients, projects, time entries, quotes, invoices, expenses, files, payments, automations**.
* “Freelancer module” = a **solo service business** operating in one or more countries (VAT optional).
* System supports multi-currency display, but **accounting base currency** is workspace currency.

---

## Epic A — Workspace, Identity, Settings

### A1 — Create workspace

**User story:** As a freelancer, I want to create a workspace, so I can start managing my freelance business.
**Acceptance criteria:**

* User can create workspace with: workspace name, default currency, timezone, locale/language.
* Workspace owner role assigned automatically.
* Unique workspace slug/ID created.
* User sees “Getting Started” checklist after creation.
  **Edge cases:**
* Duplicate workspace name allowed, unique slug enforced.
* Currency locked after first invoice OR can change only with admin warning (choose your rule).
  **Data fields:**
* `workspace_id`, `name`, `slug`, `timezone`, `currency`, `locale`, `created_at`, `owner_user_id`.

### A2 — Business identity profile (legal + branding)

**User story:** As a freelancer, I want to configure my business identity, so quotes/invoices are compliant and branded.
**Acceptance criteria:**

* Editable business identity fields:

  * Legal name
  * Trading name (optional)
  * Address (street, zip, city, country)
  * Tax info: VAT ID / Tax number (optional)
  * Contact: email, phone, website
  * Logo upload + removal
  * Payment instructions (bank info text / IBAN / SWIFT) (optional)
* Preview: “Invoice/Quote template preview” updates immediately.
* Identity can be **set as default**.
  **Edge cases:**
* VAT ID validation: format check by country (soft validation; don’t block saving).
* Logo file type/size restrictions; show clear error.
  **Data:**
* `business_identity_id`, `workspace_id`, `legal_name`, `trade_name`, `address_*`, `vat_id`, `tax_number`, `logo_url`, `payment_instructions`, `is_default`.

### A3 — Multiple identities (freelancer vs studio)

**User story:** As a freelancer, I want multiple business identities, so I can invoice under different brands/entities.
**Acceptance criteria:**

* Create/edit/delete identities.
* Set identity per client and/or per project and/or per document (quote/invoice).
* Deleting identity blocked if used in any issued invoice; offer “archive” instead.
  **Edge cases:**
* If identity removed from a project, existing invoices keep historical identity snapshot.

### A4 — Document settings (numbering, layout, terms)

**User story:** As a freelancer, I want configurable document settings, so numbering and terms match my needs.
**Acceptance criteria:**

* Invoice numbering:

  * Prefix (e.g., `INV-2025-`)
  * Next number integer
  * Optional yearly reset rule
* Quote numbering similar (separate sequence).
* Default payment terms: Net 7/14/30
* Default footer text + default “terms” block
* Document language per client override
  **Edge cases:**
* Prevent duplicate numbers; concurrency safe.
* Changing template does not change past issued docs (immutable snapshots).
  **States:**
* Draft → Issued → Paid / Partially paid → Overdue → Written off (optional).

### A5 — Roles & access control (minimal)

**User story:** As a freelancer, I want to invite a collaborator (assistant/accountant), so they can help without full access.
**Acceptance criteria:**

* Invite by email; roles:

  * Owner (full)
  * Manager (clients/projects/docs)
  * Accountant (read-only + exports + payments)
* Per-role permission set defined and tested.
  **Edge cases:**
* Pending invites expire after X days.
* Re-invite allowed.

---

## Epic B — Onboarding & Setup Wizard

### B1 — Guided onboarding checklist

**User story:** As a freelancer, I want a setup checklist, so I can complete critical steps quickly.
**Acceptance criteria:**

* Checklist items (track completion):

  * Add business identity
  * Add first client
  * Create first project
  * Create first quote
  * Add payment method
  * Create first invoice
* Progress persists.
* User can dismiss but re-open.
  **Edge cases:**
* Completing via any route marks item complete.

### B2 — Import clients and projects (CSV)

**User story:** As a freelancer, I want to import clients/projects from CSV, so I don’t start from scratch.
**Acceptance criteria:**

* Upload CSV and map columns to fields.
* Preview first N rows.
* Validate required fields; show row-level errors.
* Dedup suggestions:

  * Match by email + name (configurable).
* Import summary: created/updated/skipped/errors.
  **Edge cases:**
* UTF-8 handling.
* Partial import rollback option (all-or-nothing vs best-effort—define).
  **Data:**
* Import job record for audit.

---

## Epic C — Client CRM

### C1 — Create and manage client

**User story:** As a freelancer, I want to create and manage clients, so I can track relationships and bill correctly.
**Acceptance criteria:**

* Create client with:

  * Type: Individual / Company
  * Name/company name
  * Primary contact (name, email, phone)
  * Billing address
  * VAT ID (optional)
  * Default currency (optional; defaults workspace)
  * Default language (optional)
  * Notes
* Edit client anytime.
* Archive client (soft delete); archived not selectable for new docs by default.
  **Edge cases:**
* Client email uniqueness not required (multiple contacts might share).
* Archiving blocked if they have active projects? (choose: allow with warning).
  **Data:**
* `client_id`, `workspace_id`, `status(active/archived)`, `type`, `billing_*`, `vat_id`, `defaults`.

### C2 — Multiple contacts per client

**User story:** As a freelancer, I want multiple contacts per client, so I can communicate with the right person.
**Acceptance criteria:**

* Add/edit/delete contacts (soft delete).
* Mark a “billing contact” and “project contact”.
* Choose contact when sending quote/invoice.
  **Edge cases:**
* If billing contact deleted, fallback to primary contact.

### C3 — Tags & segmentation

**User story:** As a freelancer, I want tags and filters, so I can segment clients by type and priority.
**Acceptance criteria:**

* Add tags to clients (create on the fly).
* Filter client list by tags, status, last activity.
* Save a filter view (optional).
  **Edge cases:**
* Tag rename merges where appropriate.

### C4 — Client activity timeline

**User story:** As a freelancer, I want a client timeline, so I can see everything that happened in one place.
**Acceptance criteria:**

* Timeline includes: notes, emails (if integrated later), created quotes, invoices, payments, projects, calls, attachments.
* Each item shows timestamp, author, object link.
* Search timeline by keyword.
  **Edge cases:**
* Permissions: collaborator sees only what their role allows.

### C5 — Reminders & follow-ups

**User story:** As a freelancer, I want reminders on clients/leads, so I don’t forget to follow up.
**Acceptance criteria:**

* Set reminder date/time + note.
* Reminder appears in dashboard and optionally email/push.
* Mark as done or reschedule.
  **Edge cases:**
* Timezone-correct scheduling.

---

## Epic D — Leads & Pipeline (optional but powerful)

### D1 — Lead capture

**User story:** As a freelancer, I want to create leads and convert them to clients, so I can manage sales pipeline.
**Acceptance criteria:**

* Lead entity with stage: New → Contacted → Proposal sent → Negotiation → Won/Lost.
* Convert lead → client (copy fields).
* Track source (referral, website, marketplace).
  **Edge cases:**
* Conversion keeps lead record (for analytics) but links to new client.

### D2 — Pipeline board view

**User story:** As a freelancer, I want a Kanban pipeline, so I can visually track lead progress.
**Acceptance criteria:**

* Drag/drop to change stage.
* Stage change logs event in timeline.
* Basic metrics: count per stage, total estimated value.
  **Edge cases:**
* Keyboard accessible alternative to drag/drop.

---

## Epic E — Projects & Delivery

### E1 — Create project

**User story:** As a freelancer, I want to create projects linked to clients, so work, time, and invoices are organized.
**Acceptance criteria:**

* Project fields:

  * Client
  * Name
  * Status: Active / On hold / Completed / Archived
  * Start/end dates (optional)
  * Pricing model: Hourly / Fixed / Retainer
  * Default rate (if hourly)
  * Budget (optional)
  * Default business identity override (optional)
* Project appears in client view and project list.
  **Edge cases:**
* Cannot set project to Completed if there are open invoices? (choose rule).

### E2 — Milestones & deliverables

**User story:** As a freelancer, I want milestones, so I can structure delivery and invoice by phase.
**Acceptance criteria:**

* Create milestone with:

  * Title, description
  * Due date
  * Amount (optional)
  * Status: Planned / In progress / Delivered / Invoiced / Paid
* Convert milestone to invoice line item.
  **Edge cases:**
* If milestone amount changes after invoicing, doesn’t affect issued invoice.

### E3 — Scope of work + change log

**User story:** As a freelancer, I want scope-of-work tracking with change history, so it’s clear what’s included.
**Acceptance criteria:**

* Project has “Scope” rich text section.
* Every edit creates a version (diff view optional).
* User can “lock scope” when quote is approved.
  **Edge cases:**
* Locked scope can be updated only via “Change request” (new version + reason).

### E4 — Task list (lightweight)

**User story:** As a freelancer, I want a simple task list, so I can track to-dos per project.
**Acceptance criteria:**

* Tasks with: title, status, assignee, due date, labels, link to time entries.
* Quick add from project page.
  **Edge cases:**
* If no tasks, time entries can still be added directly.

### E5 — Client portal access (read-only)

**User story:** As a freelancer, I want a client portal per project, so clients can view documents and status.
**Acceptance criteria:**

* Client can view:

  * Approved quote
  * Issued invoices + payment status
  * Project milestones status (optional)
* Secure link with auth token or email-based login.
  **Edge cases:**
* Link can be revoked/regenerated.

---

## Epic F — Time Tracking & Timesheets

### F1 — Start/stop timer

**User story:** As a freelancer, I want a timer, so I can accurately track billable work.
**Acceptance criteria:**

* Start timer with: project, task (optional), description, billable toggle.
* Stop timer creates time entry with start/end/duration.
* Only one running timer per user (or per workspace) — define rule.
* Running timer persists across refresh/re-login.
  **Edge cases:**
* Auto-stop prompt after inactivity threshold (configurable).
* If user closes laptop, resume prompt on return.

### F2 — Manual time entry

**User story:** As a freelancer, I want to add/edit time entries manually, so I can log offline work.
**Acceptance criteria:**

* Add: date, start time/end time OR duration, project, description, billable, tags.
* Edit allowed until invoiced/locked.
* Delete time entry (soft delete) unless invoiced.
  **Edge cases:**
* Prevent overlaps (warn, don’t block) or block (define).
* Rounding rules (e.g., 5/6/15 min) optional.

### F3 — Billable vs non-billable categories

**User story:** As a freelancer, I want time categorized as billable/non-billable, so reporting and invoices are correct.
**Acceptance criteria:**

* Default billable setting per project.
* Time summary totals separated.
* Non-billable never appears in invoice conversion by default.
  **Edge cases:**
* Allow override “include non-billable” with warning.

### F4 — Weekly timesheets + locking

**User story:** As a freelancer, I want weekly timesheets, so I can review before billing.
**Acceptance criteria:**

* Timesheet view by week:

  * Total hours billable/non-billable
  * Group by project/day
* “Lock week” prevents edits.
* Unlock only by owner role.
  **Edge cases:**
* Locked entries can still be used to invoice.

### F5 — Convert time to invoice lines

**User story:** As a freelancer, I want to convert selected time entries into invoice items, so I bill quickly and accurately.
**Acceptance criteria:**

* Select entries by date range/project/client.
* Preview grouped line items (by day, by task, or single summary).
* Rate applied based on project/client overrides and entry date.
* Converted entries become “Invoiced” and are linked to invoice id.
  **Edge cases:**
* If rate missing, block conversion with clear action (“set rate now”).

---

## Epic G — Services, Rates, Packages

### G1 — Service catalog

**User story:** As a freelancer, I want a service catalog, so I can reuse services across quotes/invoices.
**Acceptance criteria:**

* Create service with: name, description, unit (hour/day/fixed), default price, default tax.
* Search services while adding line items.
* Services can be archived.
  **Edge cases:**
* Editing a service does not change existing issued docs (use snapshots).

### G2 — Rate rules

**User story:** As a freelancer, I want rate overrides per client/project, so pricing matches context.
**Acceptance criteria:**

* Rate can be set at:

  * Workspace default
  * Client override
  * Project override
  * Time entry override (rare)
* System shows which rule applied (“effective rate trace”).
  **Edge cases:**
* Historical rates: time entries store applied rate if configured; otherwise compute at invoicing with effective date.

### G3 — Packages & retainers

**User story:** As a freelancer, I want packages and retainers, so I can sell productized services and recurring work.
**Acceptance criteria:**

* Package: fixed price + included deliverables; can generate quote.
* Retainer:

  * monthly amount
  * includes X hours (optional)
  * rollover policy (no rollover / rollover 1 month / unlimited) optional
  * automatic recurring invoice schedule
* Dashboard shows “retainer balance” if enabled.
  **Edge cases:**
* If client doesn’t pay retainer invoice, hours shouldn’t auto-deduct.

---

## Epic H — Proposals & Quotes

### H1 — Create quote from template

**User story:** As a freelancer, I want to create a quote from templates, so I send consistent offers quickly.
**Acceptance criteria:**

* Quote includes:

  * client + contact
  * business identity
  * line items (services, qty, unit price, tax, discount)
  * terms (payment terms, validity date)
  * notes
* Save as draft.
* Export to PDF.
  **Edge cases:**
* Quote currency can differ from workspace currency if allowed.

### H2 — Quote approval workflow

**User story:** As a freelancer, I want a client to approve/reject a quote online, so acceptance is frictionless and recorded.
**Acceptance criteria:**

* Share quote via secure link.
* Client can:

  * Approve (with optional signature)
  * Reject (requires reason)
  * Request changes (comment)
* Approval creates immutable record:

  * approver name/email
  * timestamp
  * IP/user-agent (optional)
* Quote status: Draft → Sent → Viewed → Approved/Rejected/Expired.
  **Edge cases:**
* Quote expires automatically after validity date.
* If quote edited after sent, version increments and prior version remains viewable.

### H3 — E-signature (optional)

**User story:** As a freelancer, I want optional e-signature, so agreements are more enforceable.
**Acceptance criteria:**

* Signature block on quote (or attached contract).
* Audit trail stored.
* Downloadable signed PDF.
  **Edge cases:**
* Signature not required for approval if disabled.

### H4 — Convert quote to project + invoice

**User story:** As a freelancer, I want to convert an approved quote into a project and/or invoice, so delivery and billing is seamless.
**Acceptance criteria:**

* Button: “Create project from quote” (if project doesn’t exist).
* Button: “Create invoice from quote”:

  * copies line items
  * links invoice to quote
* Quote marked “Converted” with references.
  **Edge cases:**
* Partial invoicing allowed: select subset of items/milestones.

---

## Epic I — Invoicing, Payments, Collections

### I1 — Create invoice (manual)

**User story:** As a freelancer, I want to create invoices, so I can bill clients for work.
**Acceptance criteria:**

* Invoice draft fields:

  * client/contact
  * invoice date
  * due date (auto from payment terms)
  * currency
  * line items
  * taxes/discounts
  * notes + footer
* Save draft, preview, download PDF.
* Issue invoice: locks number and content snapshot.
  **Edge cases:**
* Cannot issue invoice without invoice number.
* Edits blocked after issue (except allowed metadata like “internal note”).

### I2 — Create invoice from time/milestones/expenses

**User story:** As a freelancer, I want to generate invoices from tracked items, so billing is fast and accurate.
**Acceptance criteria:**

* Choose sources:

  * time entries
  * milestones
  * billable expenses
* Preview grouping (by project/day/service).
* Select items to include.
* Included items become “linked + invoiced”.
  **Edge cases:**
* Items already invoiced cannot be selected.

### I3 — Send invoice (email + portal)

**User story:** As a freelancer, I want to send invoices via email/portal, so clients can view and pay easily.
**Acceptance criteria:**

* Send via email with:

  * subject + body templates
  * PDF attachment optional
  * payment link (if enabled)
* “Sent” status tracked with timestamp.
* Client portal shows invoice list + statuses.
  **Edge cases:**
* If email fails, show error and allow retry; do not mark as sent.

### I4 — Payment methods + payment links

**User story:** As a freelancer, I want multiple payment options, so clients can pay in the way they prefer.
**Acceptance criteria:**

* Configure payment methods:

  * bank transfer instructions
  * Stripe (card) (optional integration)
  * PayPal (optional)
* Invoice shows payment options based on configuration.
* Payment link status updates invoice to Paid/Partially Paid.
  **Edge cases:**
* Payment fees can be shown separately (optional).
* Partial payments supported.

### I5 — Payment tracking (manual + automatic)

**User story:** As a freelancer, I want to record payments, so invoice status and reporting are accurate.
**Acceptance criteria:**

* Add payment manually:

  * date
  * amount
  * method
  * reference note
* Invoice status updates:

  * Unpaid → Partially paid → Paid
* Payments listed in invoice detail view.
  **Edge cases:**
* Overpayment becomes credit balance or prompts refund/credit note.

### I6 — Automated reminders for overdue invoices

**User story:** As a freelancer, I want automated reminders, so I collect cash faster with less effort.
**Acceptance criteria:**

* Configurable reminder schedule (e.g., 3 days before due, on due date, 7 days after).
* Templates for each reminder stage.
* Auto-stop when invoice paid.
* Reminder log stored.
  **Edge cases:**
* Do not send reminders for disputed invoices (if dispute state exists).

### I7 — Credit notes & corrections

**User story:** As a freelancer, I want credit notes, so I can correct issued invoices without breaking accounting trails.
**Acceptance criteria:**

* Create credit note referencing original invoice.
* Credit note has its own numbering sequence.
* Can apply credit to:

  * same invoice (reduce balance)
  * future invoice (client credit balance)
    **Edge cases:**
* Credit note cannot exceed invoice total unless allowed as “goodwill credit”.

### I8 — Recurring invoices (retainership)

**User story:** As a freelancer, I want recurring invoices, so I can automate retainer billing.
**Acceptance criteria:**

* Schedule: monthly/weekly/custom.
* Auto-generate draft X days before send.
* Auto-send if enabled.
* Cancellation/pause supported.
  **Edge cases:**
* If previous invoice unpaid, optionally pause recurrence.

---

## Epic J — Expenses & Receipts

### J1 — Create expense

**User story:** As a freelancer, I want to log expenses, so I track profitability and deductions.
**Acceptance criteria:**

* Expense fields:

  * vendor
  * category
  * amount
  * currency
  * date
  * tax amount (optional)
  * project link (optional)
  * billable to client toggle
  * notes
* Expense list filter by category/project/date.
  **Edge cases:**
* Multi-currency conversion shown using stored FX rate at entry time (optional).

### J2 — Receipt upload

**User story:** As a freelancer, I want to upload receipts, so I have proof for accounting.
**Acceptance criteria:**

* Attach image/PDF to expense.
* Multiple receipts allowed.
* Download/view receipt.
  **Edge cases:**
* Storage quotas; file type validation.

### J3 — Re-bill expense to client

**User story:** As a freelancer, I want to re-bill client expenses, so pass-through costs are invoiced.
**Acceptance criteria:**

* Mark expense billable.
* Add billable expenses to invoice generator.
* Expense becomes linked + invoiced.
  **Edge cases:**
* Billable expense can include markup % (optional).

---

## Epic K — Taxes & Compliance

### K1 — Tax configuration (VAT/GST/Sales tax)

**User story:** As a freelancer, I want to configure taxes, so invoices calculate correctly and remain compliant.
**Acceptance criteria:**

* Tax rates table:

  * name
  * rate %
  * country/region
  * default status
* Apply tax per line item and/or invoice-level.
* Support “reverse charge” flag for B2B EU (optional toggle per client).
  **Edge cases:**
* If reverse charge enabled, VAT = 0 and invoice prints legal text (configurable).

### K2 — Invoice legal requirements helpers

**User story:** As a freelancer, I want legal-field checks, so I don’t forget important invoice information.
**Acceptance criteria:**

* Issue-time checklist warnings:

  * missing address
  * missing invoice number
  * missing VAT ID (if VAT enabled)
* Warnings can be overridden (unless strict mode enabled).
  **Edge cases:**
* Country-specific requirements are advisory unless you implement strict country rules.

---

## Epic L — Files, Notes, Knowledge Base (light)

### L1 — Attachments to client/project/documents

**User story:** As a freelancer, I want to attach files to clients/projects/invoices, so everything is in one place.
**Acceptance criteria:**

* Upload and link file to:

  * client
  * project
  * quote
  * invoice
* File metadata: name, size, type, uploader, uploaded_at.
  **Edge cases:**
* Permissions and portal visibility toggles.

### L2 — Internal notes vs client-visible notes

**User story:** As a freelancer, I want internal notes that clients cannot see, so I can store private context safely.
**Acceptance criteria:**

* Notes have visibility: internal / client-visible.
* Client portal excludes internal notes.

---

## Epic M — Reporting & Analytics

### M1 — Income dashboard

**User story:** As a freelancer, I want an income dashboard, so I can see revenue trends and cashflow.
**Acceptance criteria:**

* Metrics:

  * total invoiced (period)
  * total paid
  * outstanding
  * overdue
* Filters by month/quarter/year and by client/project.
  **Edge cases:**
* Multi-currency handling: show in workspace base currency.

### M2 — Time utilization report

**User story:** As a freelancer, I want a time utilization report, so I understand how much time is billable.
**Acceptance criteria:**

* Billable vs non-billable hours trend
* By project/client breakdown
* Export CSV

### M3 — Profitability report (simple)

**User story:** As a freelancer, I want project profitability, so I know which projects are worth it.
**Acceptance criteria:**

* Profitability = paid revenue − expenses (optionally include time cost).
* Show per project and per client.

### M4 — Export for accounting

**User story:** As a freelancer, I want exports for my accountant, so handoff is easy.
**Acceptance criteria:**

* Export invoices, payments, expenses as CSV.
* Date range filter.
* Include tax breakdown columns.

---

## Epic N — Automation & Notifications

### N1 — Notification center

**User story:** As a freelancer, I want notifications in-app, so I don’t miss critical events.
**Acceptance criteria:**

* Events:

  * quote viewed/approved/rejected
  * invoice due soon/overdue/paid
  * reminder sent
* Mark read/unread.
  **Edge cases:**
* Email notifications optional per event.

### N2 — Automation rules (starter set)

**User story:** As a freelancer, I want simple automation rules, so repetitive admin is reduced.
**Acceptance criteria:**

* Rules:

  * when quote approved → create project
  * when invoice overdue → send reminder
  * when invoice paid → send thank-you email
* Each rule has enable/disable + template editor.
  **Edge cases:**
* Prevent duplicate execution (idempotency).

---

## Epic O — AI-Native Helpers (optional but aligned with Bizflow)

### O1 — Draft proposal from brief

**User story:** As a freelancer, I want AI to draft a proposal from a short brief, so I write faster and more consistently.
**Acceptance criteria:**

* Input: client name + goals + deliverables + timeline + constraints.
* Output: editable proposal sections + suggested line items + risks/assumptions.
* User must approve before sending.
  **Edge cases:**
* Always show “AI-generated” indicator and allow “regenerate”.

### O2 — Invoice line item summarization

**User story:** As a freelancer, I want AI to summarize time entries into client-friendly invoice descriptions, so invoices look professional.
**Acceptance criteria:**

* Select time entries → AI suggests grouped descriptions.
* User can edit and lock the final text.
  **Edge cases:**
* Never leak internal notes; only use selected entries.

### O3 — Follow-up assistant (tone + timing)

**User story:** As a freelancer, I want AI to draft follow-ups for overdue invoices, so I get paid without awkwardness.
**Acceptance criteria:**

* Tone selector: friendly/firm/very firm.
* Includes invoice number, due date, payment link.
* Human review required.

---

## Epic P — Quality, Security, and Guardrails

### P1 — Audit log

**User story:** As a freelancer, I want an audit log, so I can trace who changed financial records.
**Acceptance criteria:**

* Log events:

  * invoice issued/edited attempt/credited
  * payment recorded/edited
  * numbering settings changed
* Include actor, timestamp, object id, before/after summary.

### P2 — Data retention & deletion

**User story:** As a freelancer, I want to export/delete my data, so I can control my information.
**Acceptance criteria:**

* Export workspace data bundle (zip/csv).
* Delete workspace with confirmation and safety delay (optional).
  **Edge cases:**
* If there are legal retention requirements, provide “archive only” mode (policy decision).

---

# Key Gherkin examples (for QA)

### Quote approval

**Scenario:** Client approves quote

* Given a quote is “Sent”
* When the client opens the secure link and clicks “Approve”
* Then the quote status becomes “Approved”
* And the system stores approver name/email and timestamp
* And the freelancer is notified

### Convert time to invoice

**Scenario:** Convert time entries into invoice lines

* Given time entries exist and are not invoiced
* When the freelancer selects entries and clicks “Create invoice”
* Then an invoice draft is created with grouped line items
* And selected entries are linked to the invoice and flagged “Invoiced” after issuance

### Overdue reminder

**Scenario:** Reminder stops after payment

* Given an invoice is overdue and reminders are enabled
* When a payment is recorded that completes the invoice
* Then the invoice status becomes “Paid”
* And no further reminders are sent for that invoice
