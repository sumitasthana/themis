"""SQLAlchemy ORM models for the Themis Postgres schema.

Field names map directly to the JSX constants in `themis-platform.jsx`
so API serialization can mirror the existing UI shapes.
"""

from sqlalchemy import (
    ARRAY,
    Boolean,
    Column,
    Date,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    PrimaryKeyConstraint,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


# ---------------------------------------------------------------------
# Customers
# ---------------------------------------------------------------------

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Text, primary_key=True)
    name = Column(Text, nullable=False)
    dob = Column(Text)
    ssn_last4 = Column(Text)
    phone = Column(Text)
    email = Column(Text)
    address = Column(Text)
    occupation = Column(Text)
    stated_income = Column(Integer)
    customer_risk = Column(Integer)
    customer_risk_level = Column(Text)
    alert_risk = Column(Integer)
    alert_risk_level = Column(Text)
    account_type = Column(Text)
    opened = Column(Date)
    country = Column(Text)
    aml_status = Column(Text)
    prior_alerts = Column(Integer)
    nationality = Column(Text)

    risk_factors = relationship(
        "CustomerRiskFactor", back_populates="customer", cascade="all, delete-orphan"
    )
    alerts = relationship("Alert", back_populates="customer")
    cases = relationship("Case", back_populates="customer")
    sars = relationship("SAR", back_populates="customer")
    transactions = relationship("Transaction", back_populates="customer")


class CustomerRiskFactor(Base):
    __tablename__ = "customer_risk_factors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Text, ForeignKey("customers.id", ondelete="CASCADE"))
    factor = Column(Text)
    weight = Column(Numeric)
    direction = Column(Text)
    detail = Column(Text)

    customer = relationship("Customer", back_populates="risk_factors")


# ---------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Text, primary_key=True)
    date = Column(Date)
    customer_id = Column(Text, ForeignKey("customers.id"))
    txns = Column(Integer)
    flagged = Column(Integer)
    status = Column(Text)
    confidence = Column(Integer)
    alert_risk = Column(Integer)
    alert_risk_level = Column(Text)
    agent_decision = Column(Text)
    inflow = Column(Numeric)
    outflow = Column(Numeric)

    customer = relationship("Customer", back_populates="alerts")
    typologies = relationship(
        "AlertTypology", back_populates="alert", cascade="all, delete-orphan"
    )
    transactions = relationship(
        "Transaction",
        secondary="alert_transactions",
        back_populates="alerts",
    )
    timeline = relationship(
        "TimelineEntry", back_populates="alert", cascade="all, delete-orphan"
    )
    network_nodes = relationship(
        "NetworkNode", back_populates="alert", cascade="all, delete-orphan"
    )
    network_edges = relationship(
        "NetworkEdge", back_populates="alert", cascade="all, delete-orphan"
    )
    journal_steps = relationship(
        "JournalStep", back_populates="alert", cascade="all, delete-orphan"
    )
    anomalies = relationship("Anomaly", back_populates="alert")
    cases = relationship("Case", back_populates="alert")


class AlertTypology(Base):
    __tablename__ = "alert_typologies"

    alert_id = Column(Text, ForeignKey("alerts.id", ondelete="CASCADE"))
    typology_name = Column(Text)
    typology_id = Column(Text, ForeignKey("typologies.typology_id"), nullable=True)

    __table_args__ = (PrimaryKeyConstraint("alert_id", "typology_name"),)

    alert = relationship("Alert", back_populates="typologies")
    typology = relationship("Typology", back_populates="alert_links")


# ---------------------------------------------------------------------
# Transactions / Timeline
# ---------------------------------------------------------------------

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Text, primary_key=True)
    customer_id = Column(Text, ForeignKey("customers.id"))
    date = Column(Date)
    time = Column(Text)
    descr = Column(Text)
    category = Column(Text)
    counterparty = Column(Text)
    cp_type = Column(Text)
    amount = Column(Numeric)
    balance = Column(Numeric)
    flagged = Column(Boolean)
    country = Column(Text)
    city = Column(Text)
    notes = Column(Text)
    risk_indicators = Column(ARRAY(Text))

    customer = relationship("Customer", back_populates="transactions")
    alerts = relationship(
        "Alert",
        secondary="alert_transactions",
        back_populates="transactions",
    )


class AlertTransaction(Base):
    __tablename__ = "alert_transactions"

    alert_id = Column(Text, ForeignKey("alerts.id", ondelete="CASCADE"))
    transaction_id = Column(Text, ForeignKey("transactions.id", ondelete="CASCADE"))

    __table_args__ = (PrimaryKeyConstraint("alert_id", "transaction_id"),)


class TimelineEntry(Base):
    __tablename__ = "timeline_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(Text, ForeignKey("alerts.id", ondelete="CASCADE"))
    date = Column(Date)
    inflow = Column(Numeric)
    outflow = Column(Numeric)

    alert = relationship("Alert", back_populates="timeline")


# ---------------------------------------------------------------------
# Network
# ---------------------------------------------------------------------

class NetworkNode(Base):
    __tablename__ = "network_nodes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(Text, ForeignKey("alerts.id", ondelete="CASCADE"))
    node_key = Column(Text)
    label = Column(Text)
    node_type = Column(Text)
    x = Column(Numeric)
    y = Column(Numeric)
    risk = Column(Text)

    alert = relationship("Alert", back_populates="network_nodes")


class NetworkEdge(Base):
    __tablename__ = "network_edges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(Text, ForeignKey("alerts.id", ondelete="CASCADE"))
    src_key = Column(Text)
    dst_key = Column(Text)
    amount = Column(Text)
    direction = Column(Text)

    alert = relationship("Alert", back_populates="network_edges")


# ---------------------------------------------------------------------
# Journal steps
# ---------------------------------------------------------------------

class JournalStep(Base):
    __tablename__ = "journal_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(Text, ForeignKey("alerts.id", ondelete="CASCADE"))
    n = Column(Integer)
    step_type = Column(Text)
    title = Column(Text)
    tool = Column(Text)
    status = Column(Text)
    summary = Column(Text)
    details = Column(Text)

    alert = relationship("Alert", back_populates="journal_steps")


# ---------------------------------------------------------------------
# Cases / Documents
# ---------------------------------------------------------------------

class Case(Base):
    __tablename__ = "cases"

    id = Column(Text, primary_key=True)
    alert_id = Column(Text, ForeignKey("alerts.id"))
    customer_id = Column(Text, ForeignKey("customers.id"))
    title = Column(Text)
    status = Column(Text)
    priority = Column(Text)
    assignee = Column(Text)
    created = Column(Date)
    due_date = Column(Date)
    stage = Column(Text)
    sar_required = Column(Boolean)
    findings = Column(Text)

    alert = relationship("Alert", back_populates="cases")
    customer = relationship("Customer", back_populates="cases")
    documents = relationship(
        "CaseDocument", back_populates="case", cascade="all, delete-orphan"
    )
    sars = relationship("SAR", back_populates="case")


class CaseDocument(Base):
    __tablename__ = "case_documents"

    id = Column(Text, primary_key=True)
    case_id = Column(Text, ForeignKey("cases.id", ondelete="CASCADE"))
    doc_type = Column(Text)
    name = Column(Text)
    size = Column(Text)
    uploaded = Column(Date)
    uploaded_by = Column(Text)
    status = Column(Text)

    case = relationship("Case", back_populates="documents")


# ---------------------------------------------------------------------
# SARs
# ---------------------------------------------------------------------

class SAR(Base):
    __tablename__ = "sars"

    id = Column(Text, primary_key=True)
    case_id = Column(Text, ForeignKey("cases.id"))
    customer_id = Column(Text, ForeignKey("customers.id"))
    status = Column(Text)
    filing_deadline = Column(Date)
    prepared_by = Column(Text)
    reviewed_by = Column(Text)
    qc_score = Column(Integer)
    narrative = Column(Text)

    case = relationship("Case", back_populates="sars")
    customer = relationship("Customer", back_populates="sars")
    missing_fields = relationship(
        "SARMissingField", back_populates="sar", cascade="all, delete-orphan"
    )
    audit_trail = relationship(
        "SARAuditEntry", back_populates="sar", cascade="all, delete-orphan"
    )


class SARMissingField(Base):
    __tablename__ = "sar_missing_fields"

    sar_id = Column(Text, ForeignKey("sars.id", ondelete="CASCADE"))
    field = Column(Text)

    __table_args__ = (PrimaryKeyConstraint("sar_id", "field"),)

    sar = relationship("SAR", back_populates="missing_fields")


class SARAuditEntry(Base):
    __tablename__ = "sar_audit_trail"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sar_id = Column(Text, ForeignKey("sars.id", ondelete="CASCADE"))
    ts = Column(Text)
    user_name = Column(Text)
    action = Column(Text)
    detail = Column(Text)

    sar = relationship("SAR", back_populates="audit_trail")


# ---------------------------------------------------------------------
# Anomalies
# ---------------------------------------------------------------------

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Text, primary_key=True)
    alert_id = Column(Text, ForeignKey("alerts.id"))
    anomaly_type = Column(Text)
    title = Column(Text)
    descr = Column(Text)
    accounts = Column(ARRAY(Text))
    detected = Column(Date)
    amount = Column(Text)
    details = Column(Text)
    recommendations = Column(ARRAY(Text))

    alert = relationship("Alert", back_populates="anomalies")


# ---------------------------------------------------------------------
# Screening
# ---------------------------------------------------------------------

class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(Text, primary_key=True)
    screen_type = Column(Text)
    entity = Column(Text)
    entity_id = Column(Text)
    entity_type = Column(Text)
    match = Column(Text)
    score = Column(Integer)
    source = Column(Text)
    details = Column(Text)
    action = Column(Text)
    payload = Column(JSON)


# ---------------------------------------------------------------------
# Models / Connectors
# ---------------------------------------------------------------------

class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text)
    model_type = Column(Text)
    accuracy = Column(Numeric)
    precision = Column(Numeric)
    recall = Column(Numeric)
    fpr = Column(Numeric)
    status = Column(Text)
    drift = Column(Text)
    retrained = Column(Date)


class Connector(Base):
    __tablename__ = "connectors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text)
    vendor = Column(Text)
    conn_type = Column(Text)
    status = Column(Text)
    volume = Column(Text)
    latency = Column(Text)
    last_sync = Column(Text)


# ---------------------------------------------------------------------
# Investigations (Phase 2) — per-run audit trail
# ---------------------------------------------------------------------

from sqlalchemy import DateTime  # noqa: E402


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Text, primary_key=True)
    alert_id = Column(Text, ForeignKey("alerts.id"))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    status = Column(Text)
    recommendation = Column(Text)
    confidence = Column(Numeric)
    risk_score = Column(JSON)
    narrative = Column(Text)

    journal = relationship("InvestigationJournal", back_populates="investigation", cascade="all, delete-orphan")
    factors = relationship("InvestigationRiskFactor", back_populates="investigation", cascade="all, delete-orphan")


class InvestigationJournal(Base):
    __tablename__ = "investigation_journal"

    id = Column(Integer, primary_key=True, autoincrement=True)
    investigation_id = Column(Text, ForeignKey("investigations.id", ondelete="CASCADE"))
    step = Column(Integer)
    step_name = Column(Text)
    ts = Column(DateTime(timezone=True))
    tool = Column(Text)
    tool_input = Column(JSON)
    tool_output = Column(JSON)
    analysis = Column(Text)
    findings = Column(JSON)
    status = Column(Text)

    investigation = relationship("Investigation", back_populates="journal")


class InvestigationRiskFactor(Base):
    __tablename__ = "investigation_risk_factors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    investigation_id = Column(Text, ForeignKey("investigations.id", ondelete="CASCADE"))
    factor = Column(Text)
    weight = Column(Numeric)

    investigation = relationship("Investigation", back_populates="factors")


# ---------------------------------------------------------------------
# Typology registry (Phase 5 — harvester pipeline)
# ---------------------------------------------------------------------

from sqlalchemy import Float  # noqa: E402


class Typology(Base):
    __tablename__ = "typologies"

    typology_id = Column(Text, primary_key=True)
    name = Column(Text, nullable=False)
    category = Column(Text, nullable=False)
    current_version = Column(Text, nullable=False)
    md_path = Column(Text, nullable=False)
    md_sha256 = Column(Text, nullable=False)
    status = Column(Text, nullable=False)
    approved_by = Column(JSON)
    deployed_at = Column(DateTime(timezone=True))
    retired_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True))

    alert_links = relationship("AlertTypology", back_populates="typology")


class TypologyCandidate(Base):
    __tablename__ = "typology_candidates"

    id = Column(Text, primary_key=True)
    source_tier = Column(Text, nullable=False)
    source_org = Column(Text, nullable=False)
    source_url = Column(Text, nullable=False)
    source_sha256 = Column(Text, nullable=False)
    fetched_at = Column(DateTime(timezone=True), nullable=False)
    extractor_name = Column(Text, nullable=False)
    extractor_version = Column(Text, nullable=False)
    prompt_version = Column(Text)
    prompt_sha256 = Column(Text)
    candidate_md = Column(Text, nullable=False)
    candidate_name = Column(Text, nullable=False)
    candidate_category = Column(Text, nullable=False)
    diff_class = Column(Text, nullable=False)
    diff_target_id = Column(Text, ForeignKey("typologies.typology_id"))
    similarity = Column(Float)
    review_status = Column(Text, nullable=False, default="pending")
    reviewed_by = Column(JSON)
    review_notes = Column(Text)
    created_at = Column(DateTime(timezone=True))
