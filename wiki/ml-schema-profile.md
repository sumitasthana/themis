# Themis Schema Profile — ML Reference

Reference for building training and inferencing pipelines against the Themis Postgres database. All numbers are from the live local DB at Alembic revision `0003` (Phase 4).

Generated: 2026-05-15

---

## 1. Tables overview (22 tables, post Phase 4)

| Table | Rows | Role for ML | Notes |
|---|---|---|---|
| **transactions** | 46 | **Primary feature/label surface (txn level)** | `flagged` is the binary label, `customer_id` is the join key |
| **alert_transactions** | 46 | M:N join (Phase 4) | needed when assembling alert-level labels back onto a txn ledger |
| **alerts** | 6 | **Alert-level label surface** | `status`, `alert_risk_level`, `agent_decision` are candidate targets |
| **alert_typologies** | 18 | Multi-label target *and* leakage source | These are the rules that *fired* — predicting them is fine; using them as features for `flagged` is leakage |
| **customers** | 6 | Static features (KYC) | One-row-per-entity; join via `customer_id` |
| **customer_risk_factors** | 22 | Derived-after-investigation | Likely leaky for predicting alerts |
| **timeline_entries** | 44 | Aggregated daily inflow/outflow per alert | Pre-aggregated by date+alert; useful for sequence models |
| **network_nodes** | 36 | Graph features (alert-scoped) | `risk` field is precomputed → leaky |
| **network_edges** | 35 | Graph features (alert-scoped) | `amount` is a display string (`"$95K"`) not numeric |
| **screening_results** | 8 | PEP/Sanctions/Adverse Media flags per entity | Reasonable feature when joined on `entity_id = customer_id` |
| **anomalies** | 4 | ML model output already | Circular — don't use as features |
| **investigations** | 14 | Agent run history (Phase 2) | Useful for evaluating model agreement with agent decisions |
| **investigation_journal** | 140 | Step-by-step agent trace | Could be training data for the agent itself, not for txn-flagging |
| **investigation_risk_factors** | 60 | Per-run factor weights | Useful as targets for an explainability head |
| **cases**, **sars**, **case_documents**, **sar_missing_fields**, **sar_audit_trail** | 3 / 3 / 8 / 2 / 9 | Downstream workflow state | Not directly useful for txn classification |
| **journal_steps** | 54 | Pre-seeded UI journal | Superseded by `investigation_journal` |
| **models** | 4 | Model registry metadata | Not training data |
| **connectors** | 8 | Data source registry | Not training data |

---

## 2. Foreign-key graph (joinable surfaces)

```text
customers ─┬─ alerts ─┬─ alert_typologies
           │          ├─ alert_transactions ─ transactions
           │          ├─ timeline_entries
           │          ├─ network_nodes
           │          ├─ network_edges
           │          ├─ journal_steps
           │          ├─ anomalies
           │          ├─ investigations ─┬─ investigation_journal
           │          │                  └─ investigation_risk_factors
           │          └─ cases ─┬─ case_documents
           │                    └─ sars ─┬─ sar_audit_trail
           │                             └─ sar_missing_fields
           ├─ customer_risk_factors
           └─ transactions   (Phase 4: direct edge)

screening_results.entity_id  →  customers.id  (no FK, but joinable)
```

---

## 3. Candidate ML targets

| Target | Table.column | Values | Class balance (seed) | Real-world prior |
|---|---|---|---|---|
| **Txn binary flag** | `transactions.flagged` | bool | 21 T / 25 F | ~0.1% positive |
| **Alert disposition** | `alerts.status` | `CLEAR`, `ESCALATE` | 3 / 3 | ~30% escalate after agent triage |
| **Alert risk** | `alerts.alert_risk_level` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | 2 / 2 / 1 / 1 | imbalanced |
| **Agent decision** | `alerts.agent_decision` | `CLEAR`, `ESCALATE` | 3 / 3 | mirrors `status` here — collinear |
| **Customer risk tier** | `customers.customer_risk_level` | `LOW`, `MEDIUM`, `HIGH` | 4 / 1 / 1 | for periodic KYC review |
| **Typology multi-label** | `alert_typologies.typology_name` | 7 distinct (see §6) | sparse | for rule-firing prediction |

The demo seed is balanced because it's hand-crafted; expect heavy imbalance when you load the Themis-ML dataset.

---

## 4. Feature catalog — `transactions` (txn-level model)

| Column | Type | Distinct / range | Usable as feature? | Notes |
|---|---|---|---|---|
| `id` | text | unique | ❌ identifier | |
| `customer_id` | text | 6 | ✅ join key | Use for customer features, not as a feature itself |
| `date` | date | 2025-10-01 → 2025-12-12 (73 days) | ✅ derived | extract dow, day-of-month, days-since-account-open |
| `time` | text | "HH:MM" | ✅ derived | extract hour, off-hours flag |
| `descr` | text | free text | ✅ text feature | TF-IDF or embed; **but** flagged txns get suspicious-looking descriptions in the seed (likely leakage in this seed; clean in Themis-ML) |
| `category` | text | 8 values: `ach_credit`, `wire_transfer`, `cash_deposit`, `p2p_transfer`, `ach_debit`, `debit_purchase`, `card_receipt`, `cash_withdrawal` | ✅ one-hot or target-encode | Clean in current seed (no "Suspicious-*" categories) |
| `counterparty` | text | high cardinality | ⚠️ as feature | Entity/embedding; raw string risks overfit |
| `cp_type` | text | 10 values: `entity`, `ach`, `bank`, `branch`, `p2p`, `merchant`, `landlord`, `atm`, `processor`, `vendor` | ✅ one-hot | |
| `amount` | numeric | min -250000, max 300000, mean 3943, std 90745 | ✅ scaled | Has sign (negative = outflow); engineer abs, sign separately |
| `balance` | numeric | mostly NULL in seed | ⚠️ low fill | Skip unless populated |
| `country` | text | 6 values: USA (41), GBR, HKG, PAN, CYM, DEU | ✅ + foreign flag | Engineer `is_high_risk_jurisdiction` (HKG/PAN/CYM) |
| `city` | text | several distinct | ⚠️ high cardinality | use country instead unless target-encoded |
| `notes` | text | populated only on suspicious txns | ❌ **leaks** | Skip for training |
| `risk_indicators` | text[] | 22 distinct tags | ❌ **leaks** | These are *rule outputs* — circular |
| `flagged` | bool | **label** | — | |

---

## 5. Feature catalog — `customers` (joinable static features)

| Column | Distinct / stats | Usable? | Notes |
|---|---|---|---|
| `dob` | varies | ✅ → age at txn date | text format `YYYY-MM-DD`; cast to date |
| `stated_income` | 42K–320K, mean 170K | ✅ scaled | Powerful feature when ratioed against observed inflow |
| `customer_risk` | 21–71, mean 40 | ✅ as-is | **Numeric pre-alert risk score** — already useful |
| `customer_risk_level` | LOW (4), MEDIUM (1), HIGH (1) | ✅ ordinal | Redundant with `customer_risk` |
| `prior_alerts` | 0–5 | ✅ count | Strong recidivism feature |
| `opened` | 2018-06-20 → 2023-01-15 | ✅ → age days | Compute `txn.date - customers.opened` |
| `account_type` | 5 distinct | ✅ one-hot | Business vs personal is the key signal |
| `aml_status` | Approved (4), Under Review (1), Enhanced Monitoring (1) | ✅ ordinal | Borderline leaky — set by compliance based on past alerts |
| `country`, `nationality` | USA / US only in seed | ❌ no variance | Will be useful when Themis-ML data lands |
| `occupation` | high cardinality free text | ⚠️ embed | |

---

## 6. Categorical vocabularies (you'll need these for encoders)

**`alert_typologies.typology_name`** — 7 values:

`VelocityIncrease (5)`, `HighRiskKeyword (5)`, `RoundAmounts (2)`, `InternationalWire (2)`, `StructuredDeposits (2)`, `CircularMovement (1)`, `RapidCashDeposits (1)`

**`transactions.category`** — 8 values (above)

**`transactions.cp_type`** — 10 values (above)

**`transactions.risk_indicators`** — 22 tags (leaky for `flagged`, useful as multi-label *target* if you want to predict typologies)

**`screening_results.screen_type × match`** — 4 × 3 grid; from seed: `Adverse Media/HIT`, `Adverse Media/POTENTIAL`, `Enforcement/HIT`, `PEP/POTENTIAL`, `Sanctions/POTENTIAL`

**`network_nodes.node_type × risk`** — `subject` / `entity` / `bank` / `branch` / `processor` × `LOW` / `MEDIUM` / `HIGH` / `CRITICAL`

---

## 7. Suggested training-table SQL (txn-level binary classifier)

```sql
SELECT
  t.id                                       AS txn_id,
  t.flagged                                  AS label,

  -- temporal
  EXTRACT(hour FROM t.time::time)            AS hour,
  EXTRACT(dow  FROM t.date)                  AS dow,
  EXTRACT(day  FROM t.date)                  AS day_of_month,
  (t.date - c.opened)                        AS account_age_days,

  -- txn-intrinsic
  t.amount                                   AS amount_signed,
  ABS(t.amount)                              AS amount_abs,
  CASE WHEN t.amount < 0 THEN 1 ELSE 0 END   AS is_outflow,
  t.category, t.cp_type, t.country,
  CASE WHEN t.country <> 'USA' THEN 1 ELSE 0 END AS is_foreign,
  CASE WHEN t.country IN ('HKG','PAN','CYM') THEN 1 ELSE 0 END AS is_high_risk_jurisdiction,

  -- customer profile
  c.stated_income, c.customer_risk, c.prior_alerts,
  c.account_type, c.aml_status,
  CASE WHEN c.account_type ILIKE '%business%' OR c.account_type ILIKE '%llc%' THEN 1 ELSE 0 END AS is_business,

  -- screening (any positive hit on the customer)
  EXISTS (
    SELECT 1 FROM screening_results sr
     WHERE sr.entity_id = c.id AND sr.match IN ('HIT','POTENTIAL')
  )                                          AS has_screening_hit

FROM transactions t
JOIN customers c ON c.id = t.customer_id;
```

Drop `descr`, `notes`, `risk_indicators` from this query — they are seed-engineered to correlate with `flagged` and will leak.

---

## 8. Suggested training-table SQL (alert-level model)

```sql
SELECT
  a.id                                          AS alert_id,
  a.status                                      AS label,           -- or alert_risk_level

  -- alert intrinsics
  a.txns, a.flagged AS flagged_count,
  a.inflow, a.outflow, (a.inflow - a.outflow)   AS net_flow,
  a.confidence,                                 -- only if available at training time

  -- aggregated txn features (M:N join)
  agg.txn_count, agg.flagged_pct, agg.amount_sum, agg.amount_max, agg.foreign_pct, agg.cash_pct,

  -- customer profile
  c.stated_income, c.customer_risk, c.prior_alerts, c.account_type,

  -- typologies fired (multi-hot)
  (SELECT array_agg(typology_name) FROM alert_typologies WHERE alert_id = a.id) AS typologies

FROM alerts a
JOIN customers c ON c.id = a.customer_id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)                                                 AS txn_count,
    AVG(t.flagged::int)                                      AS flagged_pct,
    SUM(ABS(t.amount))                                       AS amount_sum,
    MAX(ABS(t.amount))                                       AS amount_max,
    AVG(CASE WHEN t.country <> 'USA' THEN 1 ELSE 0 END)      AS foreign_pct,
    AVG(CASE WHEN t.category ILIKE 'cash%' THEN 1 ELSE 0 END) AS cash_pct
  FROM alert_transactions at
  JOIN transactions t ON t.id = at.transaction_id
  WHERE at.alert_id = a.id
) agg ON true;
```

Note: predicting `alerts.status` from `alerts.agent_decision` is trivial (they're collinear in the seed) — drop `agent_decision` from features.

---

## 9. Leakage checklist (most important section)

| Feature | Why it leaks | Mitigation |
|---|---|---|
| `transactions.risk_indicators` | Set by rule engine; correlates 100% with `flagged` | Exclude |
| `transactions.notes` | Populated only for suspicious txns | Exclude |
| `transactions.descr` containing "Suspicious-*" | Seed artifact | Filter or rebuild on Themis-ML data |
| `customer_risk_factors.*` | Generated during investigation | Exclude when predicting alerts |
| `network_nodes.risk` | Precomputed by upstream model | Engineer your own from edges instead |
| `anomalies.*` | Already ML output | Exclude entirely |
| `alerts.confidence` | Set by the agent after investigation | Only use if available at inference time in your deployment |
| `alerts.agent_decision` | Collinear with `alerts.status` | Pick one as label, drop the other |
| `alert_typologies` | These are rule firings; use as label, not feature, for the binary task | Exclude when predicting `flagged`; use as a separate multi-label target |

---

## 10. Inference pipeline shape

```text
┌────────────────────────────────────┐
│ Live txn stream (Kafka / batch)    │
└──────────────┬─────────────────────┘
               ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│ Feature builder          │◀───│ Postgres: customers, screening_ │
│   - txn-intrinsic        │    │ results, customer aggregates    │
│   - customer join        │    └─────────────────────────────────┘
│   - rolling aggregates   │
└──────────────┬───────────┘
               ▼
┌──────────────────────────┐
│ Model A: txn flag (bin.) │ ──▶ INSERT INTO transactions (..., flagged)
└──────────────┬───────────┘
               ▼ (if flagged)
┌──────────────────────────┐
│ Alert grouper            │ ──▶ INSERT INTO alerts + alert_transactions
│ (window + rule overlay)  │
└──────────────┬───────────┘
               ▼
┌──────────────────────────┐
│ Model B: typology multi  │ ──▶ INSERT INTO alert_typologies
└──────────────┬───────────┘
               ▼
┌──────────────────────────┐
│ Model C: risk tier (mc)  │ ──▶ UPDATE alerts SET alert_risk_level=...
└──────────────────────────┘
               ▼
        Themis agent picks it up via the existing
        POST /api/agent/investigate flow.
```

---

## 11. Where data won't get you (gaps to know)

- **`network_edges.amount` is a display string** (`"$95K"`). For numeric graph features, parse it back to float or pull from `transactions.amount`.
- **No KYC document features** beyond `customers.occupation` / `address`. No ID-verification, no UBO list.
- **No `transactions.balance`** in most rows.
- **No actual sanction list payload** — `screening_results.payload` is JSON but mostly empty in seed.
- **All seed customers are `USA` / `US`** — country / nationality variance arrives only when you load Themis-ML.
- **No transaction-level timestamps** with sub-day precision standardized; `time` is text `HH:MM` and may be missing.

---

## 12. Quick reference — all columns by table

### transactions (PK: id, FK: customer_id → customers.id)

```
id              text       NOT NULL
customer_id     text
date            date
time            text
descr           text
category        text
counterparty    text
cp_type         text
amount          numeric
balance         numeric
flagged         boolean
country         text
city            text
notes           text
risk_indicators text[]
```

### alert_transactions (PK: alert_id + transaction_id)

```
alert_id        text  NOT NULL  → alerts.id        ON DELETE CASCADE
transaction_id  text  NOT NULL  → transactions.id  ON DELETE CASCADE
```

### alerts (PK: id, FK: customer_id → customers.id)

```
id                text  NOT NULL
date              date
customer_id       text
txns              integer
flagged           integer        -- count of flagged txns in this alert
status            text           -- CLEAR | ESCALATE
confidence        integer
alert_risk        integer
alert_risk_level  text           -- LOW | MEDIUM | HIGH | CRITICAL
agent_decision    text           -- CLEAR | ESCALATE
inflow            numeric
outflow           numeric
```

### alert_typologies (PK: alert_id + typology_name)

```
alert_id        text  NOT NULL  → alerts.id  ON DELETE CASCADE
typology_name   text  NOT NULL
```

### customers (PK: id)

```
id                   text  NOT NULL
name                 text  NOT NULL
dob                  text
ssn_last4            text
phone                text
email                text
address              text
occupation           text
stated_income        integer
customer_risk        integer
customer_risk_level  text
alert_risk           integer
alert_risk_level     text
account_type         text
opened               date
country              text
aml_status           text
prior_alerts         integer
nationality          text
```

### customer_risk_factors (PK: id, FK: customer_id)

```
id           integer  NOT NULL
customer_id  text              → customers.id  ON DELETE CASCADE
factor       text
weight       numeric
direction    text
detail       text
```

### timeline_entries (PK: id, FK: alert_id)

```
id        integer  NOT NULL
alert_id  text              → alerts.id  ON DELETE CASCADE
date      date
inflow    numeric
outflow   numeric
```

### network_nodes (PK: id, FK: alert_id)

```
id         integer  NOT NULL
alert_id   text              → alerts.id  ON DELETE CASCADE
node_key   text
label      text
node_type  text   -- subject | entity | bank | branch | processor
x          numeric
y          numeric
risk       text   -- LOW | MEDIUM | HIGH | CRITICAL
```

### network_edges (PK: id, FK: alert_id)

```
id         integer  NOT NULL
alert_id   text              → alerts.id  ON DELETE CASCADE
src_key    text
dst_key    text
amount     text   -- display string ("$95K"); NOT numeric
direction  text   -- in | out
```

### screening_results (PK: id)

```
id            text  NOT NULL
screen_type   text   -- PEP | Sanctions | Adverse Media | Enforcement
entity        text
entity_id     text   -- joinable to customers.id (no FK)
entity_type   text
match         text   -- HIT | POTENTIAL | NO_MATCH
score         integer
source        text
details       text
action        text
payload       jsonb
```

### anomalies (PK: id, FK: alert_id)

```
id              text  NOT NULL
alert_id        text             → alerts.id
anomaly_type    text   -- MEDIUM | HIGH | CRITICAL
title           text
descr           text
accounts        text[]
detected        date
amount          text   -- display string
details         text
recommendations text[]
```

### investigations (PK: id, FK: alert_id)

```
id              text                       NOT NULL
alert_id        text                                   → alerts.id
started_at      timestamp with time zone
completed_at    timestamp with time zone
status          text
recommendation  text
confidence      numeric
risk_score      jsonb
narrative       text
```

### investigation_journal (PK: id, FK: investigation_id)

```
id                integer                    NOT NULL
investigation_id  text                                  → investigations.id  ON DELETE CASCADE
step              integer
step_name         text
ts                timestamp with time zone
tool              text
tool_input        jsonb
tool_output       jsonb
analysis          text
findings          jsonb
status            text
```

### investigation_risk_factors (PK: id, FK: investigation_id)

```
id                integer  NOT NULL
investigation_id  text              → investigations.id  ON DELETE CASCADE
factor            text
weight            numeric
```

### journal_steps (PK: id, FK: alert_id)

```
id         integer  NOT NULL
alert_id   text              → alerts.id  ON DELETE CASCADE
n          integer
step_type  text
title      text
tool       text
status     text
summary    text
details    text
```

### cases (PK: id, FKs: alert_id, customer_id)

```
id           text  NOT NULL
alert_id     text         → alerts.id
customer_id  text         → customers.id
title        text
status       text
priority     text
assignee     text
created      date
due_date     date
stage        text
sar_required boolean
findings     text
```

### case_documents (PK: id, FK: case_id)

```
id          text  NOT NULL
case_id     text         → cases.id  ON DELETE CASCADE
doc_type    text
name        text
size        text
uploaded    date
uploaded_by text
status      text
```

### sars (PK: id, FKs: case_id, customer_id)

```
id              text  NOT NULL
case_id         text         → cases.id
customer_id     text         → customers.id
status          text
filing_deadline date
prepared_by     text
reviewed_by     text
qc_score        integer
narrative       text
```

### sar_missing_fields (PK: sar_id + field)

```
sar_id  text  NOT NULL  → sars.id  ON DELETE CASCADE
field   text  NOT NULL
```

### sar_audit_trail (PK: id, FK: sar_id)

```
id         integer  NOT NULL
sar_id     text              → sars.id  ON DELETE CASCADE
ts         text
user_name  text
action     text
detail     text
```

### models (PK: id)

```
id          integer  NOT NULL
name        text
model_type  text
accuracy    numeric
precision   numeric
recall      numeric
fpr         numeric
status      text
drift       text
retrained   date
```

### connectors (PK: id)

```
id         integer  NOT NULL
name       text
vendor     text
conn_type  text
status     text
volume     text
latency    text
last_sync  text
```
