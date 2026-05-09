// Phase 1 seed extractor.
//
// Reads themis-platform.jsx, extracts the data constants by string-slicing
// (the data block is plain JS, no JSX inside), evaluates them in a sandbox,
// reshapes them to match the Postgres schema, and emits seed_data.json.
//
// Run: node scripts/seed.js
//
// One-time use. Delete this file after Phase 1 verification.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'frontend', 'themis-platform.jsx');
const OUT = path.join(__dirname, 'seed_data.json');

const source = fs.readFileSync(SRC, 'utf8');

// --- 1. Extract the top-level data block --------------------------------
// All top-level constants (CUSTOMERS, ALERTS, ..., SCREENING_RESULTS) live
// between `// --- Data` and `// --- DASHBOARD VIEW`.
const dataStart = source.indexOf('// --- Data');
const dataEnd = source.indexOf('// --- DASHBOARD VIEW');
if (dataStart < 0 || dataEnd < 0) {
  throw new Error('Could not locate data block in themis-platform.jsx');
}
const dataBlock = source.slice(dataStart, dataEnd);

// --- 2. Pull `const models = [...];` from inside ModelGovernanceView ----
function extractArrayLiteral(src, declaration) {
  const i = src.indexOf(declaration);
  if (i < 0) return null;
  const start = src.indexOf('[', i);
  let depth = 0;
  for (let j = start; j < src.length; j++) {
    const c = src[j];
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) return src.slice(start, j + 1);
    }
  }
  return null;
}

const modelsLiteral = extractArrayLiteral(source, 'const models=[');
const dsLiteral = extractArrayLiteral(source, 'const DS=[');
if (!modelsLiteral || !dsLiteral) {
  throw new Error('Could not extract `models` or `DS` array from JSX');
}

// --- 3. Evaluate everything in a sandbox --------------------------------
// Replace top-level `const`/`let` with `var` so the bindings land on the
// sandbox global rather than vanishing into block scope.
const evalSafeBlock = dataBlock.replace(/^(\s*)(const|let)\s+/gm, '$1var ');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(evalSafeBlock, sandbox);
sandbox.__models = vm.runInContext(`(${modelsLiteral})`, sandbox);
sandbox.__connectors = vm.runInContext(`(${dsLiteral})`, sandbox);

const {
  CUSTOMERS,
  ALERTS,
  TRANSACTIONS,
  TIMELINE_Data,
  NETWORK_Data,
  JOURNAL_STEPS,
  CASES,
  SARS,
  ANOMALIES,
  SCREENING_RESULTS,
  __models,
  __connectors,
} = sandbox;

// --- 4. Reshape to schema rows ------------------------------------------

const customers = [];
const customer_risk_factors = [];
for (const c of Object.values(CUSTOMERS)) {
  customers.push({
    id: c.id,
    name: c.name,
    dob: c.dob,
    ssn_last4: c.ssn,
    phone: c.phone,
    email: c.email,
    address: c.address,
    occupation: c.occupation,
    stated_income: c.statedIncome,
    customer_risk: c.customerRisk,
    customer_risk_level: c.customerRiskLevel,
    alert_risk: c.alertRisk,
    alert_risk_level: c.alertRiskLevel,
    account_type: c.accountType,
    opened: c.opened,
    country: c.country,
    aml_status: c.amlStatus,
    prior_alerts: c.priorAlerts,
    nationality: c.nationality,
  });
  for (const rf of c.riskFactors || []) {
    customer_risk_factors.push({
      customer_id: c.id,
      factor: rf.factor,
      weight: rf.weight,
      direction: rf.direction,
      detail: rf.detail,
    });
  }
}

const alerts = [];
const alert_typologies = [];
for (const a of ALERTS) {
  alerts.push({
    id: a.id,
    date: a.date,
    customer_id: a.customerId,
    txns: a.txns,
    flagged: a.flagged,
    status: a.status,
    confidence: a.confidence,
    alert_risk: a.alertRisk,
    alert_risk_level: a.alertRiskLevel,
    agent_decision: a.agentDecision,
    inflow: a.inflow,
    outflow: a.outflow,
  });
  for (const t of a.typologies || []) {
    alert_typologies.push({ alert_id: a.id, typology_name: t });
  }
}

const transactions = [];
for (const [alertId, txList] of Object.entries(TRANSACTIONS)) {
  for (const t of txList) {
    transactions.push({
      id: t.id,
      alert_id: alertId,
      date: t.date,
      time: t.time,
      descr: t.desc,
      category: t.category,
      counterparty: t.counterparty,
      cp_type: t.cpType,
      amount: t.amount,
      balance: t.balance,
      flagged: !!t.flagged,
      country: t.country,
      city: t.city,
      notes: t.notes,
      risk_indicators: t.riskIndicators || [],
    });
  }
}

const timeline_entries = [];
for (const [alertId, entries] of Object.entries(TIMELINE_Data)) {
  for (const e of entries) {
    timeline_entries.push({
      alert_id: alertId,
      date: e.date,
      inflow: e.inflow,
      outflow: e.outflow,
    });
  }
}

const network_nodes = [];
const network_edges = [];
for (const [alertId, graph] of Object.entries(NETWORK_Data)) {
  for (const n of graph.nodes || []) {
    network_nodes.push({
      alert_id: alertId,
      node_key: n.id,
      label: n.label,
      node_type: n.type,
      x: n.x,
      y: n.y,
      risk: n.risk,
    });
  }
  for (const e of graph.edges || []) {
    network_edges.push({
      alert_id: alertId,
      src_key: e.from,
      dst_key: e.to,
      amount: e.amount,
      direction: e.dir,
    });
  }
}

const journal_steps = [];
for (const [alertId, steps] of Object.entries(JOURNAL_STEPS)) {
  for (const s of steps) {
    journal_steps.push({
      alert_id: alertId,
      n: s.n,
      step_type: s.type,
      title: s.title,
      tool: s.tool,
      status: s.status,
      summary: s.summary,
      details: s.details,
    });
  }
}

const cases = [];
const case_documents = [];
for (const c of CASES) {
  cases.push({
    id: c.id,
    alert_id: c.alertId,
    customer_id: c.customerId,
    title: c.title,
    status: c.status,
    priority: c.priority,
    assignee: c.assignee,
    created: c.created,
    due_date: c.dueDate,
    stage: c.stage,
    sar_required: !!c.sarRequired,
    findings: c.findings,
  });
  for (const d of c.documents || []) {
    case_documents.push({
      id: `${c.id}-${d.id}`,
      case_id: c.id,
      doc_type: d.type,
      name: d.name,
      size: d.size,
      uploaded: d.uploaded,
      uploaded_by: d.by,
      status: d.status,
    });
  }
}

const sars = [];
const sar_missing_fields = [];
const sar_audit_trail = [];
for (const s of SARS) {
  sars.push({
    id: s.id,
    case_id: s.caseId,
    customer_id: s.customerId,
    status: s.status,
    filing_deadline: s.filingDeadline,
    prepared_by: s.preparedBy,
    reviewed_by: s.reviewedBy,
    qc_score: s.qcScore,
    narrative: s.narrative,
  });
  for (const f of s.missingFields || []) {
    sar_missing_fields.push({ sar_id: s.id, field: f });
  }
  for (const a of s.auditTrail || []) {
    sar_audit_trail.push({
      sar_id: s.id,
      ts: a.ts,
      user_name: a.user,
      action: a.action,
      detail: a.detail,
    });
  }
}

const anomalies = [];
for (const a of ANOMALIES) {
  anomalies.push({
    id: a.id,
    alert_id: a.alertId,
    anomaly_type: a.type,
    title: a.title,
    descr: a.desc,
    accounts: a.accounts || [],
    detected: a.detected,
    amount: a.amount,
    details: a.details,
    recommendations: a.recommendations || [],
  });
}

// Screening rows preserve the per-type sub-payload as `payload`.
const screening_results = [];
for (const r of SCREENING_RESULTS) {
  const payload =
    r.pepDetails ?? r.sanctionDetails ?? r.mediaDetails ?? r.enforcementDetails ?? null;
  screening_results.push({
    id: r.id,
    screen_type: r.type,
    entity: r.entity,
    entity_id: r.entityId,
    entity_type: r.entityType,
    match: r.match,
    score: r.score,
    source: r.source,
    details: r.details,
    action: r.action,
    payload,
  });
}

const models = __models.map((m) => ({
  name: m.name,
  model_type: m.type,
  accuracy: m.accuracy,
  precision: m.precision,
  recall: m.recall,
  fpr: m.fpr,
  status: m.status,
  drift: m.drift,
  retrained: m.retrained,
}));

const connectors = __connectors.map((d) => ({
  name: d.n,
  vendor: d.v,
  conn_type: d.t,
  status: d.s,
  volume: d.vol,
  latency: d.lat,
  last_sync: d.sync,
}));

// --- 5. Validate required fields ----------------------------------------
function assertNoMissing(rows, table, requiredFields) {
  for (const [i, row] of rows.entries()) {
    for (const f of requiredFields) {
      if (row[f] === undefined || row[f] === null) {
        throw new Error(
          `${table}[${i}] missing required field '${f}': ${JSON.stringify(row)}`,
        );
      }
    }
  }
}
assertNoMissing(customers, 'customers', ['id', 'name']);
assertNoMissing(alerts, 'alerts', ['id', 'customer_id']);
assertNoMissing(transactions, 'transactions', ['id', 'alert_id', 'amount']);
assertNoMissing(cases, 'cases', ['id', 'alert_id', 'customer_id']);
assertNoMissing(sars, 'sars', ['id', 'case_id', 'customer_id']);
assertNoMissing(anomalies, 'anomalies', ['id', 'alert_id']);
assertNoMissing(screening_results, 'screening_results', ['id']);

// --- 6. Emit ------------------------------------------------------------
const out = {
  customers,
  customer_risk_factors,
  alerts,
  alert_typologies,
  transactions,
  timeline_entries,
  network_nodes,
  network_edges,
  journal_steps,
  cases,
  case_documents,
  sars,
  sar_missing_fields,
  sar_audit_trail,
  anomalies,
  screening_results,
  models,
  connectors,
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

const counts = Object.fromEntries(
  Object.entries(out).map(([k, v]) => [k, v.length]),
);
console.log('seed_data.json written to', OUT);
console.log('Row counts:');
for (const [k, v] of Object.entries(counts)) {
  console.log(`  ${k.padEnd(28)} ${v}`);
}
