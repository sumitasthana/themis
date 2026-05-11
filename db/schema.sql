--
-- PostgreSQL database dump
--

\restrict DsijDlKhUZXYrUTs59fqpwZGmrfqm7bk5jklNrqqZg0SsQg2MlrgTZ2sikf2r16

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3 (Debian 18.3-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: alert_typologies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alert_typologies (
    alert_id text NOT NULL,
    typology_name text NOT NULL
);


--
-- Name: alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerts (
    id text NOT NULL,
    date date,
    customer_id text,
    txns integer,
    flagged integer,
    status text,
    confidence integer,
    alert_risk integer,
    alert_risk_level text,
    agent_decision text,
    inflow numeric,
    outflow numeric
);


--
-- Name: anomalies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anomalies (
    id text NOT NULL,
    alert_id text,
    anomaly_type text,
    title text,
    descr text,
    accounts text[],
    detected date,
    amount text,
    details text,
    recommendations text[]
);


--
-- Name: case_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_documents (
    id text NOT NULL,
    case_id text,
    doc_type text,
    name text,
    size text,
    uploaded date,
    uploaded_by text,
    status text
);


--
-- Name: cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cases (
    id text NOT NULL,
    alert_id text,
    customer_id text,
    title text,
    status text,
    priority text,
    assignee text,
    created date,
    due_date date,
    stage text,
    sar_required boolean,
    findings text
);


--
-- Name: connectors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.connectors (
    id integer NOT NULL,
    name text,
    vendor text,
    conn_type text,
    status text,
    volume text,
    latency text,
    last_sync text
);


--
-- Name: connectors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.connectors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: connectors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.connectors_id_seq OWNED BY public.connectors.id;


--
-- Name: customer_risk_factors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_risk_factors (
    id integer NOT NULL,
    customer_id text,
    factor text,
    weight numeric,
    direction text,
    detail text
);


--
-- Name: customer_risk_factors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_risk_factors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_risk_factors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_risk_factors_id_seq OWNED BY public.customer_risk_factors.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id text NOT NULL,
    name text NOT NULL,
    dob text,
    ssn_last4 text,
    phone text,
    email text,
    address text,
    occupation text,
    stated_income integer,
    customer_risk integer,
    customer_risk_level text,
    alert_risk integer,
    alert_risk_level text,
    account_type text,
    opened date,
    country text,
    aml_status text,
    prior_alerts integer,
    nationality text
);


--
-- Name: investigation_journal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investigation_journal (
    id integer NOT NULL,
    investigation_id text,
    step integer,
    step_name text,
    ts timestamp with time zone,
    tool text,
    tool_input jsonb,
    tool_output jsonb,
    analysis text,
    findings jsonb,
    status text
);


--
-- Name: investigation_journal_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.investigation_journal_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: investigation_journal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.investigation_journal_id_seq OWNED BY public.investigation_journal.id;


--
-- Name: investigation_risk_factors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investigation_risk_factors (
    id integer NOT NULL,
    investigation_id text,
    factor text,
    weight numeric
);


--
-- Name: investigation_risk_factors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.investigation_risk_factors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: investigation_risk_factors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.investigation_risk_factors_id_seq OWNED BY public.investigation_risk_factors.id;


--
-- Name: investigations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investigations (
    id text NOT NULL,
    alert_id text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    status text,
    recommendation text,
    confidence numeric,
    risk_score jsonb,
    narrative text
);


--
-- Name: journal_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_steps (
    id integer NOT NULL,
    alert_id text,
    n integer,
    step_type text,
    title text,
    tool text,
    status text,
    summary text,
    details text
);


--
-- Name: journal_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.journal_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: journal_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.journal_steps_id_seq OWNED BY public.journal_steps.id;


--
-- Name: models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.models (
    id integer NOT NULL,
    name text,
    model_type text,
    accuracy numeric,
    "precision" numeric,
    recall numeric,
    fpr numeric,
    status text,
    drift text,
    retrained date
);


--
-- Name: models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.models_id_seq OWNED BY public.models.id;


--
-- Name: network_edges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.network_edges (
    id integer NOT NULL,
    alert_id text,
    src_key text,
    dst_key text,
    amount text,
    direction text
);


--
-- Name: network_edges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.network_edges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: network_edges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.network_edges_id_seq OWNED BY public.network_edges.id;


--
-- Name: network_nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.network_nodes (
    id integer NOT NULL,
    alert_id text,
    node_key text,
    label text,
    node_type text,
    x numeric,
    y numeric,
    risk text
);


--
-- Name: network_nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.network_nodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: network_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.network_nodes_id_seq OWNED BY public.network_nodes.id;


--
-- Name: sar_audit_trail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sar_audit_trail (
    id integer NOT NULL,
    sar_id text,
    ts text,
    user_name text,
    action text,
    detail text
);


--
-- Name: sar_audit_trail_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sar_audit_trail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sar_audit_trail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sar_audit_trail_id_seq OWNED BY public.sar_audit_trail.id;


--
-- Name: sar_missing_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sar_missing_fields (
    sar_id text NOT NULL,
    field text NOT NULL
);


--
-- Name: sars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sars (
    id text NOT NULL,
    case_id text,
    customer_id text,
    status text,
    filing_deadline date,
    prepared_by text,
    reviewed_by text,
    qc_score integer,
    narrative text
);


--
-- Name: screening_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.screening_results (
    id text NOT NULL,
    screen_type text,
    entity text,
    entity_id text,
    entity_type text,
    match text,
    score integer,
    source text,
    details text,
    action text,
    payload jsonb
);


--
-- Name: timeline_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.timeline_entries (
    id integer NOT NULL,
    alert_id text,
    date date,
    inflow numeric,
    outflow numeric
);


--
-- Name: timeline_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.timeline_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: timeline_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.timeline_entries_id_seq OWNED BY public.timeline_entries.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id text NOT NULL,
    alert_id text NOT NULL,
    date date,
    "time" text,
    descr text,
    category text,
    counterparty text,
    cp_type text,
    amount numeric,
    balance numeric,
    flagged boolean,
    country text,
    city text,
    notes text,
    risk_indicators text[]
);


--
-- Name: connectors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connectors ALTER COLUMN id SET DEFAULT nextval('public.connectors_id_seq'::regclass);


--
-- Name: customer_risk_factors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_risk_factors ALTER COLUMN id SET DEFAULT nextval('public.customer_risk_factors_id_seq'::regclass);


--
-- Name: investigation_journal id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investigation_journal ALTER COLUMN id SET DEFAULT nextval('public.investigation_journal_id_seq'::regclass);


--
-- Name: investigation_risk_factors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investigation_risk_factors ALTER COLUMN id SET DEFAULT nextval('public.investigation_risk_factors_id_seq'::regclass);


--
-- Name: journal_steps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_steps ALTER COLUMN id SET DEFAULT nextval('public.journal_steps_id_seq'::regclass);


--
-- Name: models id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models ALTER COLUMN id SET DEFAULT nextval('public.models_id_seq'::regclass);


--
-- Name: network_edges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.network_edges ALTER COLUMN id SET DEFAULT nextval('public.network_edges_id_seq'::regclass);


--
-- Name: network_nodes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.network_nodes ALTER COLUMN id SET DEFAULT nextval('public.network_nodes_id_seq'::regclass);


--
-- Name: sar_audit_trail id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sar_audit_trail ALTER COLUMN id SET DEFAULT nextval('public.sar_audit_trail_id_seq'::regclass);


--
-- Name: timeline_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timeline_entries ALTER COLUMN id SET DEFAULT nextval('public.timeline_entries_id_seq'::regclass);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: alert_typologies alert_typologies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_typologies
    ADD CONSTRAINT alert_typologies_pkey PRIMARY KEY (alert_id, typology_name);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: anomalies anomalies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anomalies
    ADD CONSTRAINT anomalies_pkey PRIMARY KEY (id);


--
-- Name: case_documents case_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_documents
    ADD CONSTRAINT case_documents_pkey PRIMARY KEY (id);


--
-- Name: cases cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_pkey PRIMARY KEY (id);


--
-- Name: connectors connectors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connectors
    ADD CONSTRAINT connectors_pkey PRIMARY KEY (id);


--
-- Name: customer_risk_factors customer_risk_factors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_risk_factors
    ADD CONSTRAINT customer_risk_factors_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: investigation_journal investigation_journal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investigation_journal
    ADD CONSTRAINT investigation_journal_pkey PRIMARY KEY (id);


--
-- Name: investigation_risk_factors investigation_risk_factors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investigation_risk_factors
    ADD CONSTRAINT investigation_risk_factors_pkey PRIMARY KEY (id);


--
-- Name: investigations investigations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investigations
    ADD CONSTRAINT investigations_pkey PRIMARY KEY (id);


--
-- Name: journal_steps journal_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_steps
    ADD CONSTRAINT journal_steps_pkey PRIMARY KEY (id);


--
-- Name: models models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_pkey PRIMARY KEY (id);


--
-- Name: network_edges network_edges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.network_edges
    ADD CONSTRAINT network_edges_pkey PRIMARY KEY (id);


--
-- Name: network_nodes network_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.network_nodes
    ADD CONSTRAINT network_nodes_pkey PRIMARY KEY (id);


--
-- Name: sar_audit_trail sar_audit_trail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sar_audit_trail
    ADD CONSTRAINT sar_audit_trail_pkey PRIMARY KEY (id);


--
-- Name: sar_missing_fields sar_missing_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sar_missing_fields
    ADD CONSTRAINT sar_missing_fields_pkey PRIMARY KEY (sar_id, field);


--
-- Name: sars sars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sars
    ADD CONSTRAINT sars_pkey PRIMARY KEY (id);


--
-- Name: screening_results screening_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.screening_results
    ADD CONSTRAINT screening_results_pkey PRIMARY KEY (id);


--
-- Name: timeline_entries timeline_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timeline_entries
    ADD CONSTRAINT timeline_entries_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (alert_id, id);


--
-- Name: alert_typologies alert_typologies_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_typologies
    ADD CONSTRAINT alert_typologies_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id) ON DELETE CASCADE;


--
-- Name: alerts alerts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: anomalies anomalies_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anomalies
    ADD CONSTRAINT anomalies_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id);


--
-- Name: case_documents case_documents_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_documents
    ADD CONSTRAINT case_documents_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;


--
-- Name: cases cases_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id);


--
-- Name: cases cases_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customer_risk_factors customer_risk_factors_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_risk_factors
    ADD CONSTRAINT customer_risk_factors_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: investigation_journal investigation_journal_investigation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investigation_journal
    ADD CONSTRAINT investigation_journal_investigation_id_fkey FOREIGN KEY (investigation_id) REFERENCES public.investigations(id) ON DELETE CASCADE;


--
-- Name: investigation_risk_factors investigation_risk_factors_investigation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investigation_risk_factors
    ADD CONSTRAINT investigation_risk_factors_investigation_id_fkey FOREIGN KEY (investigation_id) REFERENCES public.investigations(id) ON DELETE CASCADE;


--
-- Name: investigations investigations_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investigations
    ADD CONSTRAINT investigations_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id);


--
-- Name: journal_steps journal_steps_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_steps
    ADD CONSTRAINT journal_steps_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id) ON DELETE CASCADE;


--
-- Name: network_edges network_edges_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.network_edges
    ADD CONSTRAINT network_edges_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id) ON DELETE CASCADE;


--
-- Name: network_nodes network_nodes_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.network_nodes
    ADD CONSTRAINT network_nodes_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id) ON DELETE CASCADE;


--
-- Name: sar_audit_trail sar_audit_trail_sar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sar_audit_trail
    ADD CONSTRAINT sar_audit_trail_sar_id_fkey FOREIGN KEY (sar_id) REFERENCES public.sars(id) ON DELETE CASCADE;


--
-- Name: sar_missing_fields sar_missing_fields_sar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sar_missing_fields
    ADD CONSTRAINT sar_missing_fields_sar_id_fkey FOREIGN KEY (sar_id) REFERENCES public.sars(id) ON DELETE CASCADE;


--
-- Name: sars sars_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sars
    ADD CONSTRAINT sars_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id);


--
-- Name: sars sars_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sars
    ADD CONSTRAINT sars_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: timeline_entries timeline_entries_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timeline_entries
    ADD CONSTRAINT timeline_entries_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict DsijDlKhUZXYrUTs59fqpwZGmrfqm7bk5jklNrqqZg0SsQg2MlrgTZ2sikf2r16

