--
-- PostgreSQL database dump
--

\restrict rVpRdbfMuSLCLw00sy80VUi0zrhz2KgwEcnRCn1lImpSemsScZfDgQRyXA8l6SM

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

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.alembic_version DISABLE TRIGGER ALL;

INSERT INTO public.alembic_version (version_num) VALUES
	('0002');


ALTER TABLE public.alembic_version ENABLE TRIGGER ALL;

--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.customers DISABLE TRIGGER ALL;

INSERT INTO public.customers (id, name, dob, ssn_last4, phone, email, address, occupation, stated_income, customer_risk, customer_risk_level, alert_risk, alert_risk_level, account_type, opened, country, aml_status, prior_alerts, nationality) VALUES
	('C-8518-0100', 'Jeremiah Garcia', '1990-07-09', '****4821', '(555) 412-7789', 'jeremiah.garcia8518@example.com', '412 Willowcrest Ave, Sacramento, CA 95823', 'Owner, Neighborhood Convenience Store (LLC)', 42000, 28, 'LOW', 52, 'MEDIUM', 'Small Business Checking / Personal Linked', '2022-03-15', 'USA', 'Approved', 1, 'US'),
	('C-7712-0108', 'Ryan Torres', '1985-03-22', '****9132', '(555) 208-4401', 'r.torres7712@example.com', '88 Pacific Rim Blvd, San Francisco, CA 94105', 'Import/Export Consultant', 95000, 68, 'MEDIUM', 81, 'HIGH', 'Business Checking', '2021-07-10', 'USA', 'Under Review', 3, 'US'),
	('C-4490-0109', 'Neal Hall', '1978-11-05', '****3374', '(555) 619-2200', 'neal.hall4490@example.com', '17 Sunset Blvd, Los Angeles, CA 90028', 'Real Estate Developer', 250000, 71, 'HIGH', 89, 'CRITICAL', 'Business Checking / Linked LLC', '2019-04-28', 'USA', 'Enhanced Monitoring', 5, 'US'),
	('C-3381-0110', 'David Hall', '1982-06-18', '****7721', '(555) 703-9988', 'david.hall3381@example.com', '220 Marina View Dr, Miami, FL 33132', 'Financial Consultant', 180000, 21, 'LOW', 55, 'MEDIUM', 'Personal Checking', '2023-01-15', 'USA', 'Approved', 0, 'US'),
	('C-5502-0111', 'Marisol Nguyen-Kelley', '1993-09-12', '****5509', '(555) 441-0034', 'marisol.nk5502@example.com', '5 Westgate Ave, Austin, TX 78701', 'Software Engineer', 135000, 27, 'LOW', 38, 'LOW', 'Personal Checking', '2020-11-02', 'USA', 'Approved', 0, 'US'),
	('C-6613-0112', 'Darius J. Wainwright', '1975-02-28', '****8843', '(555) 502-7761', 'd.wainwright6613@example.com', '900 Lakewood Rd, Chicago, IL 60601', 'Attorney', 320000, 27, 'LOW', 41, 'LOW', 'Professional Business Checking', '2018-06-20', 'USA', 'Approved', 1, 'US');


ALTER TABLE public.customers ENABLE TRIGGER ALL;

--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.alerts DISABLE TRIGGER ALL;

INSERT INTO public.alerts (id, date, customer_id, txns, flagged, status, confidence, alert_risk, alert_risk_level, agent_decision, inflow, outflow) VALUES
	('ALERT-0100', '2025-12-01', 'C-8518-0100', 192, 3, 'CLEAR', 85, 52, 'MEDIUM', 'CLEAR', 78950, 20684),
	('ALERT-0108', '2025-12-11', 'C-7712-0108', 700, 2, 'ESCALATE', 72, 81, 'HIGH', 'ESCALATE', 340000, 285000),
	('ALERT-0109', '2025-12-12', 'C-4490-0109', 1091, 9, 'ESCALATE', 80, 89, 'CRITICAL', 'ESCALATE', 1250000, 980000),
	('ALERT-0110', '2025-12-12', 'C-3381-0110', 560, 2, 'ESCALATE', 80, 55, 'MEDIUM', 'ESCALATE', 210000, 195000),
	('ALERT-0111', '2025-12-15', 'C-5502-0111', 717, 9, 'CLEAR', 85, 38, 'LOW', 'CLEAR', 145000, 130000),
	('ALERT-0112', '2025-12-17', 'C-6613-0112', 586, 14, 'CLEAR', 85, 41, 'LOW', 'CLEAR', 490000, 445000);


ALTER TABLE public.alerts ENABLE TRIGGER ALL;

--
-- Data for Name: alert_typologies; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.alert_typologies DISABLE TRIGGER ALL;

INSERT INTO public.alert_typologies (alert_id, typology_name) VALUES
	('ALERT-0100', 'RapidCashDeposits'),
	('ALERT-0100', 'StructuredDeposits'),
	('ALERT-0100', 'VelocityIncrease'),
	('ALERT-0100', 'RoundAmounts'),
	('ALERT-0108', 'InternationalWire'),
	('ALERT-0108', 'HighRiskKeyword'),
	('ALERT-0108', 'VelocityIncrease'),
	('ALERT-0109', 'HighRiskKeyword'),
	('ALERT-0109', 'VelocityIncrease'),
	('ALERT-0109', 'StructuredDeposits'),
	('ALERT-0110', 'InternationalWire'),
	('ALERT-0110', 'HighRiskKeyword'),
	('ALERT-0110', 'CircularMovement'),
	('ALERT-0111', 'HighRiskKeyword'),
	('ALERT-0111', 'VelocityIncrease'),
	('ALERT-0112', 'HighRiskKeyword'),
	('ALERT-0112', 'VelocityIncrease'),
	('ALERT-0112', 'RoundAmounts');


ALTER TABLE public.alert_typologies ENABLE TRIGGER ALL;

--
-- Data for Name: anomalies; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.anomalies DISABLE TRIGGER ALL;

INSERT INTO public.anomalies (id, alert_id, anomaly_type, title, descr, accounts, detected, amount, details, recommendations) VALUES
	('AN-001', 'ALERT-0109', 'CRITICAL', 'Circular Fund Movement', 'Circular fund movement detected across 4 accounts · Neal Hall network', '{C-4490-0109,C-7712-0108,"Nexus Realty LLC","Pacific Shell Corp"}', '2025-12-12', '$430,000', 'Themis Graph ML detected a circular money movement pattern involving Neal Hall and 3 connected entities. Funds originate from Hall''s account, pass through Nexus Realty LLC and Pacific Shell Corp, and a portion (approx. $30K) returns to the originating account via Ryan Torres. This round-trip pattern within 6 days is a strong indicator of layering · the second stage of money laundering where illicit funds are moved to obscure their origin.

Flow: Hall  Nexus ($95K)  Pacific Shell ($40K)  Torres ($35K)  Hall ($30K)
Additional flow: Hall  Deutsche Bank Frankfurt ($200K) · possible placement exit

ML Model: Network Cluster Detector v0.9 | Confidence: 87%', '{"Immediate SAR filing recommended","Freeze accounts pending investigation","Request transaction records from all connected entities","Issue RFI to correspondent banks for wire details"}'),
	('AN-002', 'ALERT-0109', 'HIGH', 'Structuring Pattern · 9 Deposits', '9 deposits below $10K threshold · Neal Hall', '{C-4490-0109}', '2025-12-12', '$87,200', 'ML model identified a systematic pattern of cash deposits where each transaction falls below the $10,000 Currency Transaction Report (CTR) filing threshold. Over 4 consecutive days, 9 deposits were made across 3 different branch locations.

Deposit pattern:
· Dec 1: $8,900 (Hollywood Branch)
· Dec 2: $9,500 (Burbank Branch)
· Dec 3: $9,800 (Downtown LA Branch)
· Dec 4: $8,700 (Hollywood Branch)
[...5 more deposits]

Total: $87,200 in structured deposits
Avg per deposit: $9,689 · deliberately proximate to but below threshold

ML Model: AML Alert Classifier v2.4 | Confidence: 94%', '{"File CTR for aggregated deposits exceeding $10K","Flag for structuring investigation","Cross-reference with other institution reports via FinCEN"}'),
	('AN-003', 'ALERT-0108', 'HIGH', 'Dormant Account Reactivation', 'Dormant account sudden activation · Ryan Torres (14 months inActive)', '{C-7712-0108}', '2025-12-11', '$340,000', 'Account C-7712-0108 (Ryan Torres) showed zero transaction activity for 14 months (October 2024 · November 2025). The account was then activated with $210,000 credit from ''Global Trade Partners Inc'' followed immediately by two large international wire transfers within 10 days.

Timeline:
· Oct 2024: Last transaction (account goes dormant)
· Nov 28, 2025: $210,000 ACH credit · ''Trade Invoice''
· Dec 5, 2025: $85,000 wire  Panama
· Dec 8, 2025: $120,000 wire  London

Dormant-to-Active pattern is a known typology for accounts being ''warmed up'' for use in layering schemes.

ML Model: Behavioral Risk Profiler v1.1 | Confidence: 82%', '{"Enhanced customer due diligence immediately","Request documentation for trade invoice","Verify counterparties · Global Trade Partners Inc","Consider account restriction pending review"}'),
	('AN-004', 'ALERT-0100', 'MEDIUM', 'Velocity Spike · Garcia', 'Velocity spike 340% above 90-day baseline · Jeremiah Garcia', '{C-8518-0100}', '2025-12-01', '$16,800', 'Customer Jeremiah Garcia''s transaction velocity on Nov 29, 2025 was 340% above their established 90-day behavioral baseline. The spike was driven by 3 same-day cash deposits across 3 branches totaling $16,800.

Baseline: $514 average transaction size, no cash deposits historically
Anomaly: $5,600 average across 3 transactions, all cash deposits

While the velocity spike is significant, investigation concluded this was likely a false positive given the customer''s cash-intensive business nature and travel reimbursement patterns.

ML Model: Transaction Anomaly Detector v1.8 | Confidence: 73%', '{"Alert has been cleared (false positive)","Monitor for recurrence over next 90 days","Consider adding explanatory note to customer profile"}');


ALTER TABLE public.anomalies ENABLE TRIGGER ALL;

--
-- Data for Name: cases; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.cases DISABLE TRIGGER ALL;

INSERT INTO public.cases (id, alert_id, customer_id, title, status, priority, assignee, created, due_date, stage, sar_required, findings) VALUES
	('CASE-2025-001', 'ALERT-0108', 'C-7712-0108', 'International Wire - High Risk Patterns', 'OPEN', 'HIGH', 'Sarah Chen', '2025-12-11', '2025-12-18', 'AI Investigation', true, 'Multiple large international wire transfers to high-risk jurisdictions. Pattern consistent with trade-based money laundering.'),
	('CASE-2025-002', 'ALERT-0109', 'C-4490-0109', 'Structuring & HighValue Deposits - Real Estate', 'OPEN', 'CRITICAL', 'Marcus Williams', '2025-12-12', '2025-12-19', 'Compliance Review', true, 'Classic structuring pattern with deposits systematically below CTR threshold. Real estate connections suggest layering phase.'),
	('CASE-2025-003', 'ALERT-0110', 'C-3381-0110', 'Circular Funds Movement - Financial Consultant', 'UNDER_REVIEW', 'MEDIUM', 'Jennifer Park', '2025-12-12', '2025-12-22', 'Investigator Analysis', false, 'International wire activity with circular patterns. Further investigation required.');


ALTER TABLE public.cases ENABLE TRIGGER ALL;

--
-- Data for Name: case_documents; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.case_documents DISABLE TRIGGER ALL;

INSERT INTO public.case_documents (id, case_id, doc_type, name, size, uploaded, uploaded_by, status) VALUES
	('CASE-2025-001-doc1', 'CASE-2025-001', 'Transaction Records', 'Wire Transfer Confirmations Q4-2025.pdf', '2.1 MB', '2025-12-11', 'Sarah Chen', 'attached'),
	('CASE-2025-001-doc2', 'CASE-2025-001', 'Account Information', 'Torres_KYC_Package_2021.pdf', '4.7 MB', '2025-12-11', 'System', 'attached'),
	('CASE-2025-001-doc3', 'CASE-2025-001', 'Internal Analysis', 'AML_Analyst_Notes_CASE-001.docx', '156 KB', '2025-12-12', 'Sarah Chen', 'attached'),
	('CASE-2025-002-doc4', 'CASE-2025-002', 'Transaction Records', 'Hall_Deposit_Records_Nov-Dec2025.pdf', '3.2 MB', '2025-12-12', 'Marcus Williams', 'attached'),
	('CASE-2025-002-doc5', 'CASE-2025-002', 'Account Information', 'Neal_Hall_KYC_Enhanced_2024.pdf', '6.1 MB', '2025-12-12', 'System', 'attached'),
	('CASE-2025-002-doc6', 'CASE-2025-002', 'Correspondence & Emails', 'Internal_Escalation_Email_Thread.pdf', '890 KB', '2025-12-13', 'Marcus Williams', 'attached'),
	('CASE-2025-002-doc7', 'CASE-2025-002', 'Internal Analysis', 'Structuring_Pattern_Analysis.xlsx', '445 KB', '2025-12-14', 'Marcus Williams', 'attached'),
	('CASE-2025-003-doc8', 'CASE-2025-003', 'Transaction Records', 'Hall_David_Transaction_Export.csv', '234 KB', '2025-12-12', 'System', 'attached');


ALTER TABLE public.case_documents ENABLE TRIGGER ALL;

--
-- Data for Name: connectors; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.connectors DISABLE TRIGGER ALL;

INSERT INTO public.connectors (id, name, vendor, conn_type, status, volume, latency, last_sync) VALUES
	(1, 'Core Banking System', 'Temenos T24', 'Core Banking', 'CONNECTED', '2.1M txns/day', '<100ms', '2 min ago'),
	(2, 'Wire Transfer System', 'SWIFT Network', 'Wire/Payments', 'CONNECTED', '45K wires/day', '<200ms', '5 min ago'),
	(3, 'Card Processing', 'FIS Worldpay', 'Card', 'CONNECTED', '8.3M txns/day', '<50ms', '1 min ago'),
	(4, 'Digital Banking', 'Mambu', 'Digital Banking', 'CONNECTED', '1.2M txns/day', '<150ms', '3 min ago'),
	(5, 'Kafka Streaming', 'Apache Kafka', 'Streaming/ETL', 'CONNECTED', '12M events/day', '<30ms', 'Real-time'),
	(6, 'Sanctions Database', 'World-Check (LSEG)', 'Screening', 'CONNECTED', 'Daily', 'N/A', '06:00 AM'),
	(7, 'Adverse Media Feed', 'Dow Jones Risk', 'Media/Intelligence', 'CONNECTED', 'Continuous', 'N/A', 'Real-time'),
	(8, 'PEP Database', 'Refinitiv', 'Screening', 'DISCONNECTED', 'Weekly', 'N/A', 'Never');


ALTER TABLE public.connectors ENABLE TRIGGER ALL;

--
-- Data for Name: customer_risk_factors; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.customer_risk_factors DISABLE TRIGGER ALL;

INSERT INTO public.customer_risk_factors (id, customer_id, factor, weight, direction, detail) VALUES
	(1, 'C-8518-0100', 'Cash-intensive business', 0.28, 'up', 'Convenience stores have high cash throughput, increasing structuring risk'),
	(2, 'C-8518-0100', 'Transaction velocity spike', 0.24, 'up', '340% above 90-day baseline in flagged window'),
	(3, 'C-8518-0100', 'Multi-branch same-day deposits', 0.22, 'up', '3 branches visited in single day is atypical for customer profile'),
	(4, 'C-8518-0100', 'Stated income alignment', 0.15, 'down', 'Payroll inflows consistent with $42K stated income · mitigating'),
	(5, 'C-8518-0100', 'Prior alert dismissed', 0.11, 'down', 'AL-0042 cleared with receipts in 2024 · favorable history'),
	(6, 'C-7712-0108', 'International wire frequency', 0.32, 'up', '14 international wires in 30 days to high-risk jurisdictions'),
	(7, 'C-7712-0108', 'Counterparty risk score', 0.26, 'up', '2 counterparties on enhanced monitoring lists'),
	(8, 'C-7712-0108', 'High-risk jurisdiction exposure', 0.2, 'up', 'Panama and Cayman Islands routing'),
	(9, 'C-7712-0108', 'Business income plausibility', 0.14, 'up', 'Import/export volumes exceed stated revenue by 3.2x'),
	(10, 'C-7712-0108', 'Account age', 0.08, 'down', '3+ year relationship with no prior enforcement'),
	(11, 'C-4490-0109', 'Structuring pattern confirmed', 0.35, 'up', '9 deposits between $8,900·$9,800 on consecutive days across 3 branches'),
	(12, 'C-4490-0109', 'Shell entity network', 0.28, 'up', 'Linked to 3 entities with no web presence or known staff'),
	(13, 'C-4490-0109', 'Real estate layering risk', 0.2, 'up', 'Real estate is a known vehicle for placement and layering'),
	(14, 'C-4490-0109', 'Geographic dispersion', 0.1, 'up', 'Branches in different counties · deliberate dispersion pattern'),
	(15, 'C-4490-0109', 'Prior SAR history', 0.07, 'up', 'Subject of 2 prior SARs filed by other institutions'),
	(16, 'C-3381-0110', 'International wire pattern', 0.4, 'up', 'Circular movement detected between 4 accounts'),
	(17, 'C-3381-0110', 'New account activity', 0.25, 'up', 'Account opened Jan 2023 · high activity from month 1'),
	(18, 'C-3381-0110', 'No prior history', 0.35, 'down', 'Zero prior alerts · clean history mitigates suspicion'),
	(19, 'C-5502-0111', 'High-risk keyword in transactions', 0.55, 'up', '''green light'' phrase found in P2P transfers'),
	(20, 'C-5502-0111', 'Strong income documentation', 0.45, 'down', 'Tech salary fully documented and aligns with spend'),
	(21, 'C-6613-0112', 'Large round-number transfers', 0.48, 'up', 'Multiple $50K transfers flagged for round amounts'),
	(22, 'C-6613-0112', 'Attorney IOLTA patterns', 0.52, 'down', 'Law firm client trust accounts commonly show large round transfers');


ALTER TABLE public.customer_risk_factors ENABLE TRIGGER ALL;

--
-- Data for Name: investigations; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.investigations DISABLE TRIGGER ALL;

INSERT INTO public.investigations (id, alert_id, started_at, completed_at, status, recommendation, confidence, risk_score, narrative) VALUES
	('9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 'ALERT-0109', '2026-05-09 21:29:28.819005+00', '2026-05-09 21:29:28.987396+00', 'completed', 'ESCALATE', 90, '{"confidence": 90.0, "risk_level": "CRITICAL", "risk_score": 195.0, "requires_edd": true, "requires_sar": true, "calculated_at": "2026-05-09 21:29:28", "recommendation": "ESCALATE", "factor_breakdown": [{"factor": "sanctions_hit", "weight": 0.4, "contribution": 40.0}, {"factor": "multiple_rules_fired", "weight": 0.3, "contribution": 30.0}, {"factor": "extreme_volume_deviation", "weight": 0.3, "contribution": 30.0}, {"factor": "pep_status", "weight": 0.25, "contribution": 25.0}, {"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}, {"factor": "high_risk_customer", "weight": 0.2, "contribution": 20.0}, {"factor": "suspicious_keywords", "weight": 0.15, "contribution": 15.0}, {"factor": "kyc_needs_refresh", "weight": 0.1, "contribution": 10.0}], "factors_analyzed": 8}', 'INVESTIGATION NARRATIVE - ALERT-0109

ALERT SUMMARY:
Alert ALERT-0109 was triggered on 2025-12-12 for Neal Hall 
(C-4490-0109). The alert was classified as CRITICAL risk with an alert 
score of 89.

RULES FIRED:
- HighRiskKeyword
- VelocityIncrease
- StructuredDeposits

CUSTOMER PROFILE:
Neal Hall is a BUSINESS entity operating in the 
Real Estate Developer industry. The account was opened on 2019-04-28. 
Current risk rating: HIGH. KYC status: NEEDS_REFRESH.

KEY FINDINGS:
- Risk Level: CRITICAL
- Rules Fired: HighRiskKeyword, VelocityIncrease, StructuredDeposits
- Business Type: Real Estate Developer
- KYC Status: NEEDS_REFRESH
- Total Transactions: 7
- Total Volume: $-41,800.00
- Baseline Volume: $11,666.67/month
- Alert Period Volume: $323,200.00/month
- Stated Income: $250,000.00
- Observed Volume: $1,924,766.67
- Keywords Searched: 8
- Matches Found: 4
- Total Connections: 5
- High-Risk Connections: 2
- Lists Checked: 4
- Total Hits: 1
- Risk Score: 195.0/100
- Risk Level: CRITICAL

RISK ASSESSMENT:
Total risk score: 195.0/100 (CRITICAL)
Top risk factors:
- sanctions_hit: 40.0% contribution
- multiple_rules_fired: 30.0% contribution
- extreme_volume_deviation: 30.0% contribution
- pep_status: 25.0% contribution
- income_inconsistent: 25.0% contribution

RECOMMENDATION:
Based on the investigation findings, the recommendation is to ESCALATE this alert.
Confidence level: 90.0%
SAR filing required: YES
EDD required: YES

INVESTIGATION COMPLETED: 2026-05-09 17:29:28'),
	('f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 'ALERT-0108', '2026-05-09 21:33:52.402741+00', '2026-05-09 21:33:53.594867+00', 'completed', 'ESCALATE', 90, '{"confidence": 90.0, "risk_level": "CRITICAL", "risk_score": 95.0, "requires_edd": true, "requires_sar": true, "calculated_at": "2026-05-09 21:33:53", "recommendation": "ESCALATE", "factor_breakdown": [{"factor": "multiple_rules_fired", "weight": 0.3, "contribution": 30.0}, {"factor": "extreme_volume_deviation", "weight": 0.3, "contribution": 30.0}, {"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}, {"factor": "kyc_needs_refresh", "weight": 0.1, "contribution": 10.0}], "factors_analyzed": 4}', 'INVESTIGATION NARRATIVE - ALERT-0108

ALERT SUMMARY:
Alert ALERT-0108 was triggered on 2025-12-11 for Ryan Torres 
(C-7712-0108). The alert was classified as HIGH risk with an alert 
score of 81.

RULES FIRED:
- InternationalWire
- HighRiskKeyword
- VelocityIncrease

CUSTOMER PROFILE:
Ryan Torres is a BUSINESS entity operating in the 
Import/Export Consultant industry. The account was opened on 2021-07-10. 
Current risk rating: MEDIUM. KYC status: NEEDS_REFRESH.

KEY FINDINGS:
- Risk Level: HIGH
- Rules Fired: InternationalWire, HighRiskKeyword, VelocityIncrease
- Business Type: Import/Export Consultant
- KYC Status: NEEDS_REFRESH
- Total Transactions: 7
- Total Volume: $57,800.00
- Baseline Volume: $39,066.67/month
- Alert Period Volume: $415,000.00/month
- Stated Income: $95,000.00
- Observed Volume: $3,589,166.67
- Keywords Searched: 8
- Matches Found: 2
- Total Connections: 5
- High-Risk Connections: 2
- Lists Checked: 4
- Total Hits: 0
- Risk Score: 95.0/100
- Risk Level: CRITICAL

RISK ASSESSMENT:
Total risk score: 95.0/100 (CRITICAL)
Top risk factors:
- multiple_rules_fired: 30.0% contribution
- extreme_volume_deviation: 30.0% contribution
- income_inconsistent: 25.0% contribution
- kyc_needs_refresh: 10.0% contribution

RECOMMENDATION:
Based on the investigation findings, the recommendation is to ESCALATE this alert.
Confidence level: 90.0%
SAR filing required: YES
EDD required: YES

INVESTIGATION COMPLETED: 2026-05-09 17:33:53'),
	('f47ec1a5-4404-4116-aa16-16169fd718ff', 'ALERT-0100', '2026-05-10 02:53:07.867844+00', '2026-05-10 02:53:07.97815+00', 'completed', 'ESCALATE', 90, '{"confidence": 90.0, "risk_level": "CRITICAL", "risk_score": 85.0, "requires_edd": true, "requires_sar": true, "calculated_at": "2026-05-10 02:53:07", "recommendation": "ESCALATE", "factor_breakdown": [{"factor": "multiple_rules_fired", "weight": 0.3, "contribution": 30.0}, {"factor": "extreme_volume_deviation", "weight": 0.3, "contribution": 30.0}, {"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}], "factors_analyzed": 3}', 'INVESTIGATION NARRATIVE - ALERT-0100

ALERT SUMMARY:
Alert ALERT-0100 was triggered on 2025-12-01 for Jeremiah Garcia 
(C-8518-0100). The alert was classified as MEDIUM risk with an alert 
score of 52.

RULES FIRED:
- RapidCashDeposits
- StructuredDeposits
- VelocityIncrease
- RoundAmounts

CUSTOMER PROFILE:
Jeremiah Garcia is a BUSINESS entity operating in the 
Owner, Neighborhood Convenience Store (LLC) industry. The account was opened on 2022-03-15. 
Current risk rating: LOW. KYC status: CURRENT.

KEY FINDINGS:
- Risk Level: MEDIUM
- Rules Fired: RapidCashDeposits, StructuredDeposits, VelocityIncrease, RoundAmounts
- Business Type: Owner, Neighborhood Convenience Store (LLC)
- KYC Status: CURRENT
- Total Transactions: 7
- Total Volume: $26,800.00
- Baseline Volume: $4,133.33/month
- Alert Period Volume: $16,800.00/month
- Stated Income: $42,000.00
- Observed Volume: $340,666.67
- Keywords Searched: 8
- Matches Found: 3
- Total Connections: 5
- High-Risk Connections: 0
- Lists Checked: 4
- Total Hits: 0
- Risk Score: 85.0/100
- Risk Level: CRITICAL

RISK ASSESSMENT:
Total risk score: 85.0/100 (CRITICAL)
Top risk factors:
- multiple_rules_fired: 30.0% contribution
- extreme_volume_deviation: 30.0% contribution
- income_inconsistent: 25.0% contribution

RECOMMENDATION:
Based on the investigation findings, the recommendation is to ESCALATE this alert.
Confidence level: 90.0%
SAR filing required: YES
EDD required: YES

INVESTIGATION COMPLETED: 2026-05-09 22:53:07'),
	('23707230-302d-4c61-8f9e-a88acf97823a', 'ALERT-0110', '2026-05-10 02:53:08.044913+00', '2026-05-10 02:53:08.108928+00', 'completed', 'ESCALATE', 90, '{"confidence": 90.0, "risk_level": "CRITICAL", "risk_score": 110.0, "requires_edd": true, "requires_sar": true, "calculated_at": "2026-05-10 02:53:08", "recommendation": "ESCALATE", "factor_breakdown": [{"factor": "sanctions_hit", "weight": 0.4, "contribution": 40.0}, {"factor": "multiple_rules_fired", "weight": 0.3, "contribution": 30.0}, {"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}, {"factor": "suspicious_keywords", "weight": 0.15, "contribution": 15.0}], "factors_analyzed": 4}', 'INVESTIGATION NARRATIVE - ALERT-0110

ALERT SUMMARY:
Alert ALERT-0110 was triggered on 2025-12-12 for David Hall 
(C-3381-0110). The alert was classified as MEDIUM risk with an alert 
score of 55.

RULES FIRED:
- InternationalWire
- HighRiskKeyword
- CircularMovement

CUSTOMER PROFILE:
David Hall is a INDIVIDUAL entity operating in the 
Financial Consultant industry. The account was opened on 2023-01-15. 
Current risk rating: LOW. KYC status: CURRENT.

KEY FINDINGS:
- Risk Level: MEDIUM
- Rules Fired: InternationalWire, HighRiskKeyword, CircularMovement
- Business Type: Financial Consultant
- KYC Status: CURRENT
- Total Transactions: 7
- Total Volume: $148,500.00
- Baseline Volume: $98,500.00/month
- Alert Period Volume: $130,000.00/month
- Stated Income: $180,000.00
- Observed Volume: $3,491,833.33
- Keywords Searched: 8
- Matches Found: 5
- Total Connections: 5
- High-Risk Connections: 2
- Lists Checked: 4
- Total Hits: 1
- Risk Score: 110.0/100
- Risk Level: CRITICAL

RISK ASSESSMENT:
Total risk score: 110.0/100 (CRITICAL)
Top risk factors:
- sanctions_hit: 40.0% contribution
- multiple_rules_fired: 30.0% contribution
- income_inconsistent: 25.0% contribution
- suspicious_keywords: 15.0% contribution

RECOMMENDATION:
Based on the investigation findings, the recommendation is to ESCALATE this alert.
Confidence level: 90.0%
SAR filing required: YES
EDD required: YES

INVESTIGATION COMPLETED: 2026-05-09 22:53:08'),
	('3dba89a1-d641-4289-9bbe-e8ad7a14d326', 'ALERT-0111', '2026-05-10 02:53:08.141861+00', '2026-05-10 02:53:08.204988+00', 'completed', 'CLEAR', 65, '{"confidence": 65.0, "risk_level": "MEDIUM", "risk_score": 45.0, "requires_edd": false, "requires_sar": false, "calculated_at": "2026-05-10 02:53:08", "recommendation": "CLEAR", "factor_breakdown": [{"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}, {"factor": "multiple_rules_fired", "weight": 0.2, "contribution": 20.0}], "factors_analyzed": 2}', 'INVESTIGATION NARRATIVE - ALERT-0111

ALERT SUMMARY:
Alert ALERT-0111 was triggered on 2025-12-15 for Marisol Nguyen-Kelley 
(C-5502-0111). The alert was classified as LOW risk with an alert 
score of 38.

RULES FIRED:
- HighRiskKeyword
- VelocityIncrease

CUSTOMER PROFILE:
Marisol Nguyen-Kelley is a INDIVIDUAL entity operating in the 
Software Engineer industry. The account was opened on 2020-11-02. 
Current risk rating: LOW. KYC status: CURRENT.

KEY FINDINGS:
- Risk Level: LOW
- Rules Fired: HighRiskKeyword, VelocityIncrease
- Business Type: Software Engineer
- KYC Status: CURRENT
- Total Transactions: 8
- Total Volume: $19,650.00
- Baseline Volume: $7,166.67/month
- Alert Period Volume: $6,987.00/month
- Stated Income: $135,000.00
- Observed Volume: $295,345.83
- Keywords Searched: 8
- Matches Found: 0
- Total Connections: 5
- High-Risk Connections: 0
- Lists Checked: 4
- Total Hits: 0
- Risk Score: 45.0/100
- Risk Level: MEDIUM

RISK ASSESSMENT:
Total risk score: 45.0/100 (MEDIUM)
Top risk factors:
- income_inconsistent: 25.0% contribution
- multiple_rules_fired: 20.0% contribution

RECOMMENDATION:
Based on the investigation findings, the recommendation is to CLEAR this alert.
Confidence level: 65.0%
SAR filing required: NO
EDD required: NO

INVESTIGATION COMPLETED: 2026-05-09 22:53:08'),
	('cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 'ALERT-0112', '2026-05-10 02:53:08.236309+00', '2026-05-10 02:53:08.31686+00', 'completed', 'ESCALATE', 90, '{"confidence": 90.0, "risk_level": "CRITICAL", "risk_score": 85.0, "requires_edd": true, "requires_sar": true, "calculated_at": "2026-05-10 02:53:08", "recommendation": "ESCALATE", "factor_breakdown": [{"factor": "multiple_rules_fired", "weight": 0.3, "contribution": 30.0}, {"factor": "extreme_volume_deviation", "weight": 0.3, "contribution": 30.0}, {"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}], "factors_analyzed": 3}', 'INVESTIGATION NARRATIVE - ALERT-0112

ALERT SUMMARY:
Alert ALERT-0112 was triggered on 2025-12-17 for Darius J. Wainwright 
(C-6613-0112). The alert was classified as LOW risk with an alert 
score of 41.

RULES FIRED:
- HighRiskKeyword
- VelocityIncrease
- RoundAmounts

CUSTOMER PROFILE:
Darius J. Wainwright is a BUSINESS entity operating in the 
Attorney industry. The account was opened on 2018-06-20. 
Current risk rating: LOW. KYC status: CURRENT.

KEY FINDINGS:
- Risk Level: LOW
- Rules Fired: HighRiskKeyword, VelocityIncrease, RoundAmounts
- Business Type: Attorney
- KYC Status: CURRENT
- Total Transactions: 8
- Total Volume: $-30,000.00
- Baseline Volume: $138,333.33/month
- Alert Period Volume: $675,000.00/month
- Stated Income: $320,000.00
- Observed Volume: $6,448,333.33
- Keywords Searched: 8
- Matches Found: 0
- Total Connections: 5
- High-Risk Connections: 0
- Lists Checked: 4
- Total Hits: 0
- Risk Score: 85.0/100
- Risk Level: CRITICAL

RISK ASSESSMENT:
Total risk score: 85.0/100 (CRITICAL)
Top risk factors:
- multiple_rules_fired: 30.0% contribution
- extreme_volume_deviation: 30.0% contribution
- income_inconsistent: 25.0% contribution

RECOMMENDATION:
Based on the investigation findings, the recommendation is to ESCALATE this alert.
Confidence level: 90.0%
SAR filing required: YES
EDD required: YES

INVESTIGATION COMPLETED: 2026-05-09 22:53:08'),
	('380a8362-d39b-44cd-978b-c73ce6075be5', 'ALERT-0109', '2026-05-10 02:53:22.606758+00', '2026-05-10 02:53:22.694948+00', 'completed', 'ESCALATE', 90, '{"confidence": 90.0, "risk_level": "CRITICAL", "risk_score": 195.0, "requires_edd": true, "requires_sar": true, "calculated_at": "2026-05-10 02:53:22", "recommendation": "ESCALATE", "factor_breakdown": [{"factor": "sanctions_hit", "weight": 0.4, "contribution": 40.0}, {"factor": "multiple_rules_fired", "weight": 0.3, "contribution": 30.0}, {"factor": "extreme_volume_deviation", "weight": 0.3, "contribution": 30.0}, {"factor": "pep_status", "weight": 0.25, "contribution": 25.0}, {"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}, {"factor": "high_risk_customer", "weight": 0.2, "contribution": 20.0}, {"factor": "suspicious_keywords", "weight": 0.15, "contribution": 15.0}, {"factor": "kyc_needs_refresh", "weight": 0.1, "contribution": 10.0}], "factors_analyzed": 8}', 'INVESTIGATION NARRATIVE - ALERT-0109

ALERT SUMMARY:
Alert ALERT-0109 was triggered on 2025-12-12 for Neal Hall 
(C-4490-0109). The alert was classified as CRITICAL risk with an alert 
score of 89.

RULES FIRED:
- HighRiskKeyword
- VelocityIncrease
- StructuredDeposits

CUSTOMER PROFILE:
Neal Hall is a BUSINESS entity operating in the 
Real Estate Developer industry. The account was opened on 2019-04-28. 
Current risk rating: HIGH. KYC status: NEEDS_REFRESH.

KEY FINDINGS:
- Risk Level: CRITICAL
- Rules Fired: HighRiskKeyword, VelocityIncrease, StructuredDeposits
- Business Type: Real Estate Developer
- KYC Status: NEEDS_REFRESH
- Total Transactions: 7
- Total Volume: $-41,800.00
- Baseline Volume: $11,666.67/month
- Alert Period Volume: $323,200.00/month
- Stated Income: $250,000.00
- Observed Volume: $1,924,766.67
- Keywords Searched: 8
- Matches Found: 4
- Total Connections: 5
- High-Risk Connections: 2
- Lists Checked: 4
- Total Hits: 1
- Risk Score: 195.0/100
- Risk Level: CRITICAL

RISK ASSESSMENT:
Total risk score: 195.0/100 (CRITICAL)
Top risk factors:
- sanctions_hit: 40.0% contribution
- multiple_rules_fired: 30.0% contribution
- extreme_volume_deviation: 30.0% contribution
- pep_status: 25.0% contribution
- income_inconsistent: 25.0% contribution

RECOMMENDATION:
Based on the investigation findings, the recommendation is to ESCALATE this alert.
Confidence level: 90.0%
SAR filing required: YES
EDD required: YES

INVESTIGATION COMPLETED: 2026-05-09 22:53:22');


ALTER TABLE public.investigations ENABLE TRIGGER ALL;

--
-- Data for Name: investigation_journal; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.investigation_journal DISABLE TRIGGER ALL;

INSERT INTO public.investigation_journal (id, investigation_id, step, step_name, ts, tool, tool_input, tool_output, analysis, findings, status) VALUES
	(1, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 1, 'Alert Details Retrieval', '2026-05-09 21:29:28.930156+00', 'get_alert_details', '{"alert_id": "ALERT-0109"}', '{"status": "ESCALATE", "alert_id": "ALERT-0109", "risk_level": "CRITICAL", "rule_count": 3, "alert_score": 89, "assigned_to": "System", "customer_id": "C-4490-0109", "rules_fired": ["HighRiskKeyword", "VelocityIncrease", "StructuredDeposits"], "alert_window": {"end_date": "2025-12-12", "start_date": "2025-11-12"}, "created_date": "2025-12-12", "customer_name": "Neal Hall", "previous_alerts": 5, "account_age_days": 2568, "flagged_transactions": ["TX-1091", "TX-1092", "TX-1093", "TX-1094", "TX-1095"], "total_flagged_volume": 323200.0}', 'Alert ALERT-0109 was triggered on 2025-12-12 for customer Neal Hall (C-4490-0109). Risk level: CRITICAL. 3 rules fired: HighRiskKeyword, VelocityIncrease, StructuredDeposits. Total flagged volume: $323,200.00 across 5 transactions.', '["Risk Level: CRITICAL", "Rules Fired: HighRiskKeyword, VelocityIncrease, StructuredDeposits", "Flagged Volume: $323,200.00", "Transaction Count: 5"]', 'completed'),
	(2, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 2, 'Customer Profile Review', '2026-05-09 21:29:28.936956+00', 'get_customer_profile', '{"customer_id": "C-4490-0109"}', '{"email": "neal.hall4490@example.com", "phone": "(555) 619-2200", "addresses": [{"city": null, "type": "BUSINESS", "state": null, "street": "17 Sunset Blvd, Los Angeles, CA 90028", "country": "USA"}], "kyc_status": "NEEDS_REFRESH", "pep_status": true, "customer_id": "C-4490-0109", "risk_rating": "HIGH", "adverse_media": false, "business_type": "Real Estate Developer", "customer_name": "Neal Hall", "customer_type": "BUSINESS", "industry_code": null, "sanctions_hit": false, "account_opened": "2019-04-28", "kyc_last_updated": "2019-04-28", "beneficial_owners": [], "expected_activity": {"monthly_volume": 20833.333333333332, "geographic_scope": "DOMESTIC", "transaction_types": ["CASH_DEPOSIT", "WIRE_TRANSFER", "ACH_CREDIT", "ACH_DEBIT"]}}', 'Customer Neal Hall is a BUSINESS in the Real Estate Developer industry. Account opened: 2019-04-28. KYC status: NEEDS_REFRESH (last updated 2019-04-28). Current risk rating: HIGH. PEP status: YES.', '["Business Type: Real Estate Developer", "KYC Status: NEEDS_REFRESH", "Risk Rating: HIGH", "PEP: YES"]', 'completed'),
	(3, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 3, 'Transaction History Search', '2026-05-09 21:29:28.946199+00', 'search_transactions', '{"min_amount": 1000, "customer_id": "C-4490-0109"}', '{"count": 7, "transactions": [{"date": "2025-12-05", "type": "WIRE_TRANSFER", "flags": ["international", "high-risk-jurisdiction", "large-transfer"], "amount": -200000.0, "currency": "USD", "location": "Frankfurt, DEU", "customer_id": "C-4490-0109", "description": "International Wire", "counterparty": "Deutsche Bank Frankfurt", "transaction_id": "TX-1095"}, {"date": "2025-12-04", "type": "CASH_DEPOSIT", "flags": ["structuring", "sub-threshold", "multi-branch"], "amount": 9800.0, "currency": "USD", "location": "Los Angeles, USA", "customer_id": "C-4490-0109", "description": "Cash Deposit", "counterparty": "Branch - Downtown LA", "transaction_id": "TX-1094"}, {"date": "2025-12-03", "type": "WIRE_TRANSFER", "flags": ["shell-entity", "large-transfer", "no-documentation"], "amount": 95000.0, "currency": "USD", "location": "USA", "customer_id": "C-4490-0109", "description": "Wire Transfer - Domestic", "counterparty": "Nexus Realty LLC", "transaction_id": "TX-1093"}, {"date": "2025-12-02", "type": "CASH_DEPOSIT", "flags": ["structuring", "sub-threshold", "multi-branch"], "amount": 9500.0, "currency": "USD", "location": "Burbank, USA", "customer_id": "C-4490-0109", "description": "Cash Deposit", "counterparty": "Branch - Burbank", "transaction_id": "TX-1092"}, {"date": "2025-12-01", "type": "CASH_DEPOSIT", "flags": ["structuring", "sub-threshold"], "amount": 8900.0, "currency": "USD", "location": "Los Angeles, USA", "customer_id": "C-4490-0109", "description": "Cash Deposit", "counterparty": "Branch - Hollywood", "transaction_id": "TX-1091"}, {"date": "2025-11-20", "type": "ACH_CREDIT", "flags": [], "amount": 20000.0, "currency": "USD", "location": "USA", "customer_id": "C-4490-0109", "description": "Payroll Deposit", "counterparty": "Hall Development Corp", "transaction_id": "TX-1085"}, {"date": "2025-11-10", "type": "ACH_CREDIT", "flags": [], "amount": 15000.0, "currency": "USD", "location": "USA", "customer_id": "C-4490-0109", "description": "Property Management Fees", "counterparty": "Pacific Properties LLC", "transaction_id": "TX-1080"}]}', 'Found 7 transactions totaling $-41,800.00. 5 transactions have risk flags. Transaction types: WIRE_TRANSFER, CASH_DEPOSIT.', '["Total Transactions: 7", "Total Volume: $-41,800.00", "Flagged Transactions: 5", "Avg Transaction: $-5,971.43"]', 'completed'),
	(4, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 4, 'Baseline Calculation', '2026-05-09 21:29:28.955348+00', 'calculate_baseline', '{"customer_id": "C-4490-0109", "period_days": 90}', '{"deviations": {"size_deviation_pct": 269.4, "volume_deviation_pct": 2670.3, "frequency_deviation_pct": 150.0}, "customer_id": "C-4490-0109", "deviation_score": 100.0, "baseline_metrics": {"wire_ratio": 0.0, "avg_monthly_volume": 11666.67, "cash_deposit_ratio": 0.0, "avg_transaction_size": 17500.0, "transaction_frequency": 2}, "alert_period_metrics": {"monthly_volume": 323200.0, "avg_transaction_size": 64640.0, "transaction_frequency": 5}, "analysis_period_days": 90, "is_significant_deviation": true}', 'Baseline monthly volume: $11,666.67. Alert period volume: $323,200.00. Deviation: +2670.3%. Significant deviation: YES.', '["Baseline Volume: $11,666.67/month", "Alert Period Volume: $323,200.00/month", "Deviation: +2670.3%", "Significant: YES"]', 'completed'),
	(5, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 5, 'Income Verification', '2026-05-09 21:29:28.964151+00', 'verify_income', '{"customer_id": "C-4490-0109"}', '{"red_flags": ["Volume exceeds stated income by >100%"], "customer_id": "C-4490-0109", "income_source": "Business Revenue", "is_consistent": false, "discrepancy_pct": 669.9, "verification_status": "INCONSISTENT", "stated_annual_income": 250000.0, "documentation_provided": "Bank Statements", "observed_annual_volume": 1924766.67}', 'Stated annual income: $250,000.00. Observed annual volume: $1,924,766.67. Discrepancy: 669.9%. Verification status: INCONSISTENT.', '["Stated Income: $250,000.00", "Observed Volume: $1,924,766.67", "Discrepancy: 669.9%", "Status: INCONSISTENT"]', 'completed'),
	(6, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 6, 'Keyword Search', '2026-05-09 21:29:28.971709+00', 'search_keywords', '{"keywords": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "customer_id": "C-4490-0109"}', '{"matches": [{"date": "2025-12-04", "amount": 9800.0, "context": "Description", "description": "Cash Deposit", "transaction_id": "TX-1094", "keyword_matched": "cash"}, {"date": "2025-12-03", "amount": 95000.0, "context": "Notes", "description": "Wire Transfer - Domestic", "transaction_id": "TX-1093", "keyword_matched": "shell"}, {"date": "2025-12-02", "amount": 9500.0, "context": "Description", "description": "Cash Deposit", "transaction_id": "TX-1092", "keyword_matched": "cash"}, {"date": "2025-12-01", "amount": 8900.0, "context": "Description", "description": "Cash Deposit", "transaction_id": "TX-1091", "keyword_matched": "cash"}], "customer_id": "C-4490-0109", "total_matches": 4, "requires_review": true, "keywords_searched": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "high_risk_keywords_found": ["cash", "shell"]}', 'Searched for 8 suspicious keywords. Found 4 matches. High-risk keywords: cash, shell.', '["Keywords Searched: 8", "Matches Found: 4", "High-Risk Keywords: cash, shell"]', 'completed'),
	(20, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 10, 'Narrative Generation', '2026-05-09 21:33:53.485922+00', 'generate_narrative', '{"investigation_state": "complete"}', '{"narrative": "\nINVESTIGATION NARRATIVE - ALERT-0108\n\nALERT SUMMARY:\nAlert ALERT-0108 was triggered on 2025-12-11 for Ryan Torres \n(C-7712-0108). The alert was classified as HIGH risk with an alert \nscore of 81.\n\nRU..."}', 'Investigation narrative generated. Recommendation: ESCALATE. Total investigation steps completed: 9.', '["Steps Completed: 9", "Final Recommendation: ESCALATE", "Narrative Length: 1461 characters"]', 'completed'),
	(7, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 7, 'Network Analysis', '2026-05-09 21:29:28.982302+00', 'analyze_network', '{"depth": 2, "customer_id": "C-4490-0109"}', '{"connections": [{"entity_id": "ALERT-0109:n1", "risk_score": 75.0, "entity_name": "Nexus Realty LLC", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0109:n2", "risk_score": 75.0, "entity_name": "Pacific Shell Corp", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0109:n3", "risk_score": 50.0, "entity_name": "Deutsche Bank Frankfurt", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0109:n4", "risk_score": 20.0, "entity_name": "Branch Hollywood", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}, {"entity_id": "ALERT-0109:n5", "risk_score": 20.0, "entity_name": "Hall Development Corp", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}], "customer_id": "C-4490-0109", "analysis_depth": 2, "circular_flows": [], "layering_detected": false, "total_connections": 5, "network_risk_score": 48.0, "high_risk_connections": 2, "shared_infrastructure": false}', 'Network analysis found 5 connected entities. High-risk connections: 2. Circular flows detected: 0. Layering detected: NO.', '["Total Connections: 5", "High-Risk Connections: 2", "Circular Flows: 0", "Layering: NO"]', 'completed'),
	(8, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 8, 'Sanctions Screening', '2026-05-09 21:29:28.987315+00', 'check_sanctions', '{"entity_name": "Neal Hall", "entity_type": "BUSINESS"}', '{"matches": [{"list": "WORLD_CHECK_PEP", "program": "PEP", "added_date": null, "match_name": "Neal Hall", "match_type": "POTENTIAL", "entity_type": "CUSTOMER", "match_score": 72, "requires_review": true}], "total_hits": 1, "entity_name": "Neal Hall", "entity_type": "BUSINESS", "lists_checked": ["OFAC_SDN", "UN_CONSOLIDATED", "EU_SANCTIONS", "UK_HMT"], "screening_date": "2026-05-09 21:29:28"}', 'Screened Neal Hall against 4 sanctions lists. Total hits: 1. POTENTIAL MATCH FOUND - requires review.', '["Lists Checked: 4", "Total Hits: 1", "Status: ⚠️ MATCH FOUND"]', 'completed'),
	(9, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 9, 'Risk Score Calculation', '2026-05-09 21:29:28.987359+00', 'calculate_risk_score', '{"factors": {"pep_status": 0.25, "sanctions_hit": 0.4, "kyc_needs_refresh": 0.1, "high_risk_customer": 0.2, "income_inconsistent": 0.25, "suspicious_keywords": 0.15, "multiple_rules_fired": 0.3, "extreme_volume_deviation": 0.3}}', '{"confidence": 90.0, "risk_level": "CRITICAL", "risk_score": 195.0, "requires_edd": true, "requires_sar": true, "calculated_at": "2026-05-09 21:29:28", "recommendation": "ESCALATE", "factor_breakdown": [{"factor": "sanctions_hit", "weight": 0.4, "contribution": 40.0}, {"factor": "multiple_rules_fired", "weight": 0.3, "contribution": 30.0}, {"factor": "extreme_volume_deviation", "weight": 0.3, "contribution": 30.0}, {"factor": "pep_status", "weight": 0.25, "contribution": 25.0}, {"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}, {"factor": "high_risk_customer", "weight": 0.2, "contribution": 20.0}, {"factor": "suspicious_keywords", "weight": 0.15, "contribution": 15.0}, {"factor": "kyc_needs_refresh", "weight": 0.1, "contribution": 10.0}], "factors_analyzed": 8}', 'Risk score: 195.0/100 (CRITICAL). Analyzed 8 risk factors. Recommendation: ESCALATE (confidence: 90.0%). Requires SAR: YES.', '["Risk Score: 195.0/100", "Risk Level: CRITICAL", "Recommendation: ESCALATE", "Confidence: 90.0%", "Requires SAR: YES"]', 'completed'),
	(10, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 10, 'Narrative Generation', '2026-05-09 21:29:28.987392+00', 'generate_narrative', '{"investigation_state": "complete"}', '{"narrative": "\nINVESTIGATION NARRATIVE - ALERT-0109\n\nALERT SUMMARY:\nAlert ALERT-0109 was triggered on 2025-12-12 for Neal Hall \n(C-4490-0109). The alert was classified as CRITICAL risk with an alert \nscore of 89.\n\n..."}', 'Investigation narrative generated. Recommendation: ESCALATE. Total investigation steps completed: 9.', '["Steps Completed: 9", "Final Recommendation: ESCALATE", "Narrative Length: 1492 characters"]', 'completed'),
	(11, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 1, 'Alert Details Retrieval', '2026-05-09 21:33:52.416775+00', 'get_alert_details', '{"alert_id": "ALERT-0108"}', '{"status": "ESCALATE", "alert_id": "ALERT-0108", "risk_level": "HIGH", "rule_count": 3, "alert_score": 81, "assigned_to": "System", "customer_id": "C-7712-0108", "rules_fired": ["InternationalWire", "HighRiskKeyword", "VelocityIncrease"], "alert_window": {"end_date": "2025-12-11", "start_date": "2025-11-11"}, "created_date": "2025-12-11", "customer_name": "Ryan Torres", "previous_alerts": 3, "account_age_days": 1764, "flagged_transactions": ["TX-1075", "TX-1081", "TX-1082"], "total_flagged_volume": 415000.0}', 'Alert ALERT-0108 was triggered on 2025-12-11 for customer Ryan Torres (C-7712-0108). Risk level: HIGH. 3 rules fired: InternationalWire, HighRiskKeyword, VelocityIncrease. Total flagged volume: $415,000.00 across 3 transactions.', '["Risk Level: HIGH", "Rules Fired: InternationalWire, HighRiskKeyword, VelocityIncrease", "Flagged Volume: $415,000.00", "Transaction Count: 3"]', 'completed'),
	(12, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 2, 'Customer Profile Review', '2026-05-09 21:33:52.528899+00', 'get_customer_profile', '{"customer_id": "C-7712-0108"}', '{"email": "r.torres7712@example.com", "phone": "(555) 208-4401", "addresses": [{"city": null, "type": "BUSINESS", "state": null, "street": "88 Pacific Rim Blvd, San Francisco, CA 94105", "country": "USA"}], "kyc_status": "NEEDS_REFRESH", "pep_status": false, "customer_id": "C-7712-0108", "risk_rating": "MEDIUM", "adverse_media": false, "business_type": "Import/Export Consultant", "customer_name": "Ryan Torres", "customer_type": "BUSINESS", "industry_code": null, "sanctions_hit": false, "account_opened": "2021-07-10", "kyc_last_updated": "2021-07-10", "beneficial_owners": [], "expected_activity": {"monthly_volume": 7916.666666666667, "geographic_scope": "DOMESTIC", "transaction_types": ["CASH_DEPOSIT", "WIRE_TRANSFER", "ACH_CREDIT", "ACH_DEBIT"]}}', 'Customer Ryan Torres is a BUSINESS in the Import/Export Consultant industry. Account opened: 2021-07-10. KYC status: NEEDS_REFRESH (last updated 2021-07-10). Current risk rating: MEDIUM. PEP status: NO.', '["Business Type: Import/Export Consultant", "KYC Status: NEEDS_REFRESH", "Risk Rating: MEDIUM", "PEP: NO"]', 'completed'),
	(35, '23707230-302d-4c61-8f9e-a88acf97823a', 5, 'Income Verification', '2026-05-10 02:53:08.08518+00', 'verify_income', '{"customer_id": "C-3381-0110"}', '{"red_flags": ["Volume exceeds stated income by >100%"], "customer_id": "C-3381-0110", "income_source": "Salary", "is_consistent": false, "discrepancy_pct": 1839.9, "verification_status": "INCONSISTENT", "stated_annual_income": 180000.0, "documentation_provided": "Bank Statements", "observed_annual_volume": 3491833.33}', 'Stated annual income: $180,000.00. Observed annual volume: $3,491,833.33. Discrepancy: 1839.9%. Verification status: INCONSISTENT.', '["Stated Income: $180,000.00", "Observed Volume: $3,491,833.33", "Discrepancy: 1839.9%", "Status: INCONSISTENT"]', 'completed'),
	(13, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 3, 'Transaction History Search', '2026-05-09 21:33:52.653782+00', 'search_transactions', '{"min_amount": 1000, "customer_id": "C-7712-0108"}', '{"count": 7, "transactions": [{"date": "2025-12-08", "type": "WIRE_TRANSFER", "flags": ["international", "rapid-movement", "large-transfer", "rapid-depletion"], "amount": -120000.0, "currency": "USD", "location": "London, GBR", "customer_id": "C-7712-0108", "description": "Wire Transfer - International", "counterparty": "Barclays London - Correspondent", "transaction_id": "TX-1082"}, {"date": "2025-12-05", "type": "WIRE_TRANSFER", "flags": ["international", "high-risk-jurisdiction", "large-transfer", "no-documentation"], "amount": -85000.0, "currency": "USD", "location": "Panama City, PAN", "customer_id": "C-7712-0108", "description": "Wire Transfer - International", "counterparty": "HSBC Panama Branch", "transaction_id": "TX-1081"}, {"date": "2025-11-28", "type": "ACH_CREDIT", "flags": ["dormant-reactivation", "undocumented-source", "large-inflow"], "amount": 210000.0, "currency": "USD", "location": "San Francisco, USA", "customer_id": "C-7712-0108", "description": "ACH Credit - Trade Invoice", "counterparty": "Global Trade Partners Inc", "transaction_id": "TX-1075"}, {"date": "2025-11-14", "type": "ACH_CREDIT", "flags": [], "amount": 50000.0, "currency": "USD", "location": "San Francisco, USA", "customer_id": "C-7712-0108", "description": "ACH Credit - Consulting Retainer", "counterparty": "Pacific Rim Trade Advisors LLC", "transaction_id": "TX-1070"}, {"date": "2025-11-01", "type": "ACH_CREDIT", "flags": [], "amount": 35000.0, "currency": "USD", "location": "USA", "customer_id": "C-7712-0108", "description": "ACH Credit - Invoice Payment", "counterparty": "AsiaLink Commerce Group", "transaction_id": "TX-1065"}, {"date": "2025-10-15", "type": "WIRE_TRANSFER", "flags": [], "amount": -28000.0, "currency": "USD", "location": "USA", "customer_id": "C-7712-0108", "description": "Wire Transfer - Domestic", "counterparty": "Torres Logistics Solutions LLC", "transaction_id": "TX-1055"}, {"date": "2025-10-01", "type": "ACH_DEBIT", "flags": [], "amount": -4200.0, "currency": "USD", "location": "San Francisco, USA", "customer_id": "C-7712-0108", "description": "ACH Debit - Office Lease", "counterparty": "Pacific Rim Business Center", "transaction_id": "TX-1045"}]}', 'Found 7 transactions totaling $57,800.00. 3 transactions have risk flags. Transaction types: ACH_CREDIT, WIRE_TRANSFER.', '["Total Transactions: 7", "Total Volume: $57,800.00", "Flagged Transactions: 3", "Avg Transaction: $8,257.14"]', 'completed'),
	(14, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 4, 'Baseline Calculation', '2026-05-09 21:33:52.776179+00', 'calculate_baseline', '{"customer_id": "C-7712-0108", "period_days": 90}', '{"deviations": {"size_deviation_pct": 372.1, "volume_deviation_pct": 962.3, "frequency_deviation_pct": -25.0}, "customer_id": "C-7712-0108", "deviation_score": 100.0, "baseline_metrics": {"wire_ratio": 0.25, "avg_monthly_volume": 39066.67, "cash_deposit_ratio": 0.0, "avg_transaction_size": 29300.0, "transaction_frequency": 4}, "alert_period_metrics": {"monthly_volume": 415000.0, "avg_transaction_size": 138333.33, "transaction_frequency": 3}, "analysis_period_days": 90, "is_significant_deviation": true}', 'Baseline monthly volume: $39,066.67. Alert period volume: $415,000.00. Deviation: +962.3%. Significant deviation: YES.', '["Baseline Volume: $39,066.67/month", "Alert Period Volume: $415,000.00/month", "Deviation: +962.3%", "Significant: YES"]', 'completed'),
	(15, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 5, 'Income Verification', '2026-05-09 21:33:52.902912+00', 'verify_income', '{"customer_id": "C-7712-0108"}', '{"red_flags": ["Volume exceeds stated income by >100%"], "customer_id": "C-7712-0108", "income_source": "Business Revenue", "is_consistent": false, "discrepancy_pct": 3678.1, "verification_status": "INCONSISTENT", "stated_annual_income": 95000.0, "documentation_provided": "Bank Statements", "observed_annual_volume": 3589166.67}', 'Stated annual income: $95,000.00. Observed annual volume: $3,589,166.67. Discrepancy: 3678.1%. Verification status: INCONSISTENT.', '["Stated Income: $95,000.00", "Observed Volume: $3,589,166.67", "Discrepancy: 3678.1%", "Status: INCONSISTENT"]', 'completed'),
	(16, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 6, 'Keyword Search', '2026-05-09 21:33:53.02398+00', 'search_keywords', '{"keywords": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "customer_id": "C-7712-0108"}', '{"matches": [{"date": "2025-11-14", "amount": 50000.0, "context": "Description", "description": "ACH Credit - Consulting Retainer", "transaction_id": "TX-1070", "keyword_matched": "consulting"}, {"date": "2025-10-01", "amount": -4200.0, "context": "Notes", "description": "ACH Debit - Office Lease", "transaction_id": "TX-1045", "keyword_matched": "consulting"}], "customer_id": "C-7712-0108", "total_matches": 2, "requires_review": false, "keywords_searched": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "high_risk_keywords_found": []}', 'Searched for 8 suspicious keywords. Found 2 matches. High-risk keywords: None.', '["Keywords Searched: 8", "Matches Found: 2", "High-Risk Keywords: None"]', 'completed'),
	(17, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 7, 'Network Analysis', '2026-05-09 21:33:53.151449+00', 'analyze_network', '{"depth": 2, "customer_id": "C-7712-0108"}', '{"connections": [{"entity_id": "ALERT-0108:n1", "risk_score": 75.0, "entity_name": "Global Trade Partners Inc", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}, {"entity_id": "ALERT-0108:n5", "risk_score": 20.0, "entity_name": "Pacific Rim Trade Advisors", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}, {"entity_id": "ALERT-0108:n2", "risk_score": 75.0, "entity_name": "HSBC Panama Branch", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0108:n3", "risk_score": 50.0, "entity_name": "Barclays London", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0108:n4", "risk_score": 50.0, "entity_name": "Torres Logistics Solutions", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}], "customer_id": "C-7712-0108", "analysis_depth": 2, "circular_flows": [], "layering_detected": false, "total_connections": 5, "network_risk_score": 54.0, "high_risk_connections": 2, "shared_infrastructure": false}', 'Network analysis found 5 connected entities. High-risk connections: 2. Circular flows detected: 0. Layering detected: NO.', '["Total Connections: 5", "High-Risk Connections: 2", "Circular Flows: 0", "Layering: NO"]', 'completed'),
	(18, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 8, 'Sanctions Screening', '2026-05-09 21:33:53.273784+00', 'check_sanctions', '{"entity_name": "Ryan Torres", "entity_type": "BUSINESS"}', '{"matches": [], "total_hits": 0, "entity_name": "Ryan Torres", "entity_type": "BUSINESS", "lists_checked": ["OFAC_SDN", "UN_CONSOLIDATED", "EU_SANCTIONS", "UK_HMT"], "screening_date": "2026-05-09 21:33:53"}', 'Screened Ryan Torres against 4 sanctions lists. Total hits: 0. No matches found.', '["Lists Checked: 4", "Total Hits: 0", "Status: ✓ Clear"]', 'completed'),
	(19, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 9, 'Risk Score Calculation', '2026-05-09 21:33:53.377055+00', 'calculate_risk_score', '{"factors": {"kyc_needs_refresh": 0.1, "income_inconsistent": 0.25, "multiple_rules_fired": 0.3, "extreme_volume_deviation": 0.3}}', '{"confidence": 90.0, "risk_level": "CRITICAL", "risk_score": 95.0, "requires_edd": true, "requires_sar": true, "calculated_at": "2026-05-09 21:33:53", "recommendation": "ESCALATE", "factor_breakdown": [{"factor": "multiple_rules_fired", "weight": 0.3, "contribution": 30.0}, {"factor": "extreme_volume_deviation", "weight": 0.3, "contribution": 30.0}, {"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}, {"factor": "kyc_needs_refresh", "weight": 0.1, "contribution": 10.0}], "factors_analyzed": 4}', 'Risk score: 95.0/100 (CRITICAL). Analyzed 4 risk factors. Recommendation: ESCALATE (confidence: 90.0%). Requires SAR: YES.', '["Risk Score: 95.0/100", "Risk Level: CRITICAL", "Recommendation: ESCALATE", "Confidence: 90.0%", "Requires SAR: YES"]', 'completed'),
	(21, 'f47ec1a5-4404-4116-aa16-16169fd718ff', 1, 'Alert Details Retrieval', '2026-05-10 02:53:07.89512+00', 'get_alert_details', '{"alert_id": "ALERT-0100"}', '{"status": "CLEAR", "alert_id": "ALERT-0100", "risk_level": "MEDIUM", "rule_count": 4, "alert_score": 52, "assigned_to": "System", "customer_id": "C-8518-0100", "rules_fired": ["RapidCashDeposits", "StructuredDeposits", "VelocityIncrease", "RoundAmounts"], "alert_window": {"end_date": "2025-12-01", "start_date": "2025-11-01"}, "created_date": "2025-12-01", "customer_name": "Jeremiah Garcia", "previous_alerts": 1, "account_age_days": 1516, "flagged_transactions": ["TX-9851", "TX-9853", "TX-9857"], "total_flagged_volume": 16800.0}', 'Alert ALERT-0100 was triggered on 2025-12-01 for customer Jeremiah Garcia (C-8518-0100). Risk level: MEDIUM. 4 rules fired: RapidCashDeposits, StructuredDeposits, VelocityIncrease, RoundAmounts. Total flagged volume: $16,800.00 across 3 transactions.', '["Risk Level: MEDIUM", "Rules Fired: RapidCashDeposits, StructuredDeposits, VelocityIncrease, RoundAmounts", "Flagged Volume: $16,800.00", "Transaction Count: 3"]', 'completed'),
	(22, 'f47ec1a5-4404-4116-aa16-16169fd718ff', 2, 'Customer Profile Review', '2026-05-10 02:53:07.906675+00', 'get_customer_profile', '{"customer_id": "C-8518-0100"}', '{"email": "jeremiah.garcia8518@example.com", "phone": "(555) 412-7789", "addresses": [{"city": null, "type": "BUSINESS", "state": null, "street": "412 Willowcrest Ave, Sacramento, CA 95823", "country": "USA"}], "kyc_status": "CURRENT", "pep_status": false, "customer_id": "C-8518-0100", "risk_rating": "LOW", "adverse_media": false, "business_type": "Owner, Neighborhood Convenience Store (LLC)", "customer_name": "Jeremiah Garcia", "customer_type": "BUSINESS", "industry_code": null, "sanctions_hit": false, "account_opened": "2022-03-15", "kyc_last_updated": "2022-03-15", "beneficial_owners": [], "expected_activity": {"monthly_volume": 3500.0, "geographic_scope": "DOMESTIC", "transaction_types": ["CASH_DEPOSIT", "WIRE_TRANSFER", "ACH_CREDIT", "ACH_DEBIT"]}}', 'Customer Jeremiah Garcia is a BUSINESS in the Owner, Neighborhood Convenience Store (LLC) industry. Account opened: 2022-03-15. KYC status: CURRENT (last updated 2022-03-15). Current risk rating: LOW. PEP status: NO.', '["Business Type: Owner, Neighborhood Convenience Store (LLC)", "KYC Status: CURRENT", "Risk Rating: LOW", "PEP: NO"]', 'completed'),
	(23, 'f47ec1a5-4404-4116-aa16-16169fd718ff', 3, 'Transaction History Search', '2026-05-10 02:53:07.920182+00', 'search_transactions', '{"min_amount": 1000, "customer_id": "C-8518-0100"}', '{"count": 7, "transactions": [{"date": "2025-11-29", "type": "CASH_DEPOSIT", "flags": ["sub-threshold amount", "multi-branch"], "amount": 3600.0, "currency": "USD", "location": "Sacramento, USA", "customer_id": "C-8518-0100", "description": "Cash Deposit - In Branch", "counterparty": "Branch - Del Paso Heights (Branch #103)", "transaction_id": "TX-9851"}, {"date": "2025-11-29", "type": "CASH_DEPOSIT", "flags": ["sub-threshold amount", "multi-branch", "velocity"], "amount": 3500.0, "currency": "USD", "location": "Sacramento, USA", "customer_id": "C-8518-0100", "description": "Cash Deposit - In Branch", "counterparty": "Branch - Midtown Sacramento", "transaction_id": "TX-9853"}, {"date": "2025-11-29", "type": "CASH_DEPOSIT", "flags": ["sub-threshold amount", "multi-branch", "round-proximate"], "amount": 9700.0, "currency": "USD", "location": "Sacramento, USA", "customer_id": "C-8518-0100", "description": "Cash Deposit - In Branch", "counterparty": "Branch - Oak Park (Branch #07)", "transaction_id": "TX-9857"}, {"date": "2025-11-01", "type": "CARD_RECEIPT", "flags": [], "amount": 4200.0, "currency": "USD", "location": "Online, USA", "customer_id": "C-8518-0100", "description": "Card Processor - Stripe", "counterparty": "Card Processor - Stripe", "transaction_id": "TX-9820"}, {"date": "2025-10-28", "type": "CASH_WITHDRAWAL", "flags": [], "amount": -1200.0, "currency": "USD", "location": "Sacramento, USA", "customer_id": "C-8518-0100", "description": "ATM Withdrawal", "counterparty": "Cash Withdrawal ATM", "transaction_id": "TX-9801"}, {"date": "2025-10-15", "type": "ACH_CREDIT", "flags": [], "amount": 3500.0, "currency": "USD", "location": "USA", "customer_id": "C-8518-0100", "description": "Payroll ACH Credit", "counterparty": "Garcia Convenience LLC Payroll", "transaction_id": "TX-9790"}, {"date": "2025-10-01", "type": "ACH_CREDIT", "flags": [], "amount": 3500.0, "currency": "USD", "location": "USA", "customer_id": "C-8518-0100", "description": "Payroll ACH Credit", "counterparty": "Garcia Convenience LLC Payroll", "transaction_id": "TX-9780"}]}', 'Found 7 transactions totaling $26,800.00. 3 transactions have risk flags. Transaction types: CARD_RECEIPT, CASH_DEPOSIT, CASH_WITHDRAWAL.', '["Total Transactions: 7", "Total Volume: $26,800.00", "Flagged Transactions: 3", "Avg Transaction: $3,828.57"]', 'completed'),
	(24, 'f47ec1a5-4404-4116-aa16-16169fd718ff', 4, 'Baseline Calculation', '2026-05-10 02:53:07.930036+00', 'calculate_baseline', '{"customer_id": "C-8518-0100", "period_days": 90}', '{"deviations": {"size_deviation_pct": 80.6, "volume_deviation_pct": 306.5, "frequency_deviation_pct": -25.0}, "customer_id": "C-8518-0100", "deviation_score": 100.0, "baseline_metrics": {"wire_ratio": 0.0, "avg_monthly_volume": 4133.33, "cash_deposit_ratio": 0.0, "avg_transaction_size": 3100.0, "transaction_frequency": 4}, "alert_period_metrics": {"monthly_volume": 16800.0, "avg_transaction_size": 5600.0, "transaction_frequency": 3}, "analysis_period_days": 90, "is_significant_deviation": true}', 'Baseline monthly volume: $4,133.33. Alert period volume: $16,800.00. Deviation: +306.5%. Significant deviation: YES.', '["Baseline Volume: $4,133.33/month", "Alert Period Volume: $16,800.00/month", "Deviation: +306.5%", "Significant: YES"]', 'completed'),
	(25, 'f47ec1a5-4404-4116-aa16-16169fd718ff', 5, 'Income Verification', '2026-05-10 02:53:07.941573+00', 'verify_income', '{"customer_id": "C-8518-0100"}', '{"red_flags": ["Volume exceeds stated income by >100%"], "customer_id": "C-8518-0100", "income_source": "Business Revenue", "is_consistent": false, "discrepancy_pct": 711.1, "verification_status": "INCONSISTENT", "stated_annual_income": 42000.0, "documentation_provided": "Bank Statements", "observed_annual_volume": 340666.67}', 'Stated annual income: $42,000.00. Observed annual volume: $340,666.67. Discrepancy: 711.1%. Verification status: INCONSISTENT.', '["Stated Income: $42,000.00", "Observed Volume: $340,666.67", "Discrepancy: 711.1%", "Status: INCONSISTENT"]', 'completed'),
	(26, 'f47ec1a5-4404-4116-aa16-16169fd718ff', 6, 'Keyword Search', '2026-05-10 02:53:07.95721+00', 'search_keywords', '{"keywords": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "customer_id": "C-8518-0100"}', '{"matches": [{"date": "2025-11-29", "amount": 3600.0, "context": "Description", "description": "Cash Deposit - In Branch", "transaction_id": "TX-9851", "keyword_matched": "cash"}, {"date": "2025-11-29", "amount": 3500.0, "context": "Description", "description": "Cash Deposit - In Branch", "transaction_id": "TX-9853", "keyword_matched": "cash"}, {"date": "2025-11-29", "amount": 9700.0, "context": "Description", "description": "Cash Deposit - In Branch", "transaction_id": "TX-9857", "keyword_matched": "cash"}], "customer_id": "C-8518-0100", "total_matches": 3, "requires_review": true, "keywords_searched": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "high_risk_keywords_found": ["cash"]}', 'Searched for 8 suspicious keywords. Found 3 matches. High-risk keywords: cash.', '["Keywords Searched: 8", "Matches Found: 3", "High-Risk Keywords: cash"]', 'completed'),
	(34, '23707230-302d-4c61-8f9e-a88acf97823a', 4, 'Baseline Calculation', '2026-05-10 02:53:08.076542+00', 'calculate_baseline', '{"customer_id": "C-3381-0110", "period_days": 90}', '{"deviations": {"size_deviation_pct": 10.0, "volume_deviation_pct": 32.0, "frequency_deviation_pct": -60.0}, "customer_id": "C-3381-0110", "deviation_score": 33.2, "baseline_metrics": {"wire_ratio": 0.2, "avg_monthly_volume": 98500.0, "cash_deposit_ratio": 0.0, "avg_transaction_size": 59100.0, "transaction_frequency": 5}, "alert_period_metrics": {"monthly_volume": 130000.0, "avg_transaction_size": 65000.0, "transaction_frequency": 2}, "analysis_period_days": 90, "is_significant_deviation": false}', 'Baseline monthly volume: $98,500.00. Alert period volume: $130,000.00. Deviation: +32.0%. Significant deviation: NO.', '["Baseline Volume: $98,500.00/month", "Alert Period Volume: $130,000.00/month", "Deviation: +32.0%", "Significant: NO"]', 'completed'),
	(27, 'f47ec1a5-4404-4116-aa16-16169fd718ff', 7, 'Network Analysis', '2026-05-10 02:53:07.972225+00', 'analyze_network', '{"depth": 2, "customer_id": "C-8518-0100"}', '{"connections": [{"entity_id": "ALERT-0100:n1", "risk_score": 20.0, "entity_name": "Stripe", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}, {"entity_id": "ALERT-0100:n2", "risk_score": 20.0, "entity_name": "Del Paso Heights Branch", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}, {"entity_id": "ALERT-0100:n3", "risk_score": 20.0, "entity_name": "Midtown Sacramento Branch", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}, {"entity_id": "ALERT-0100:n4", "risk_score": 50.0, "entity_name": "Oak Park Branch", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}, {"entity_id": "ALERT-0100:n5", "risk_score": 20.0, "entity_name": "Garcia Convenience LLC", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}], "customer_id": "C-8518-0100", "analysis_depth": 2, "circular_flows": [], "layering_detected": false, "total_connections": 5, "network_risk_score": 26.0, "high_risk_connections": 0, "shared_infrastructure": false}', 'Network analysis found 5 connected entities. High-risk connections: 0. Circular flows detected: 0. Layering detected: NO.', '["Total Connections: 5", "High-Risk Connections: 0", "Circular Flows: 0", "Layering: NO"]', 'completed'),
	(28, 'f47ec1a5-4404-4116-aa16-16169fd718ff', 8, 'Sanctions Screening', '2026-05-10 02:53:07.977941+00', 'check_sanctions', '{"entity_name": "Jeremiah Garcia", "entity_type": "BUSINESS"}', '{"matches": [], "total_hits": 0, "entity_name": "Jeremiah Garcia", "entity_type": "BUSINESS", "lists_checked": ["OFAC_SDN", "UN_CONSOLIDATED", "EU_SANCTIONS", "UK_HMT"], "screening_date": "2026-05-10 02:53:07"}', 'Screened Jeremiah Garcia against 4 sanctions lists. Total hits: 0. No matches found.', '["Lists Checked: 4", "Total Hits: 0", "Status: ✓ Clear"]', 'completed'),
	(29, 'f47ec1a5-4404-4116-aa16-16169fd718ff', 9, 'Risk Score Calculation', '2026-05-10 02:53:07.978049+00', 'calculate_risk_score', '{"factors": {"income_inconsistent": 0.25, "multiple_rules_fired": 0.3, "extreme_volume_deviation": 0.3}}', '{"confidence": 90.0, "risk_level": "CRITICAL", "risk_score": 85.0, "requires_edd": true, "requires_sar": true, "calculated_at": "2026-05-10 02:53:07", "recommendation": "ESCALATE", "factor_breakdown": [{"factor": "multiple_rules_fired", "weight": 0.3, "contribution": 30.0}, {"factor": "extreme_volume_deviation", "weight": 0.3, "contribution": 30.0}, {"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}], "factors_analyzed": 3}', 'Risk score: 85.0/100 (CRITICAL). Analyzed 3 risk factors. Recommendation: ESCALATE (confidence: 90.0%). Requires SAR: YES.', '["Risk Score: 85.0/100", "Risk Level: CRITICAL", "Recommendation: ESCALATE", "Confidence: 90.0%", "Requires SAR: YES"]', 'completed'),
	(30, 'f47ec1a5-4404-4116-aa16-16169fd718ff', 10, 'Narrative Generation', '2026-05-10 02:53:07.978133+00', 'generate_narrative', '{"investigation_state": "complete"}', '{"narrative": "\nINVESTIGATION NARRATIVE - ALERT-0100\n\nALERT SUMMARY:\nAlert ALERT-0100 was triggered on 2025-12-01 for Jeremiah Garcia \n(C-8518-0100). The alert was classified as MEDIUM risk with an alert \nscore of 5..."}', 'Investigation narrative generated. Recommendation: ESCALATE. Total investigation steps completed: 9.', '["Steps Completed: 9", "Final Recommendation: ESCALATE", "Narrative Length: 1487 characters"]', 'completed'),
	(31, '23707230-302d-4c61-8f9e-a88acf97823a', 1, 'Alert Details Retrieval', '2026-05-10 02:53:08.056442+00', 'get_alert_details', '{"alert_id": "ALERT-0110"}', '{"status": "ESCALATE", "alert_id": "ALERT-0110", "risk_level": "MEDIUM", "rule_count": 3, "alert_score": 55, "assigned_to": "System", "customer_id": "C-3381-0110", "rules_fired": ["InternationalWire", "HighRiskKeyword", "CircularMovement"], "alert_window": {"end_date": "2025-12-12", "start_date": "2025-11-12"}, "created_date": "2025-12-12", "customer_name": "David Hall", "previous_alerts": 0, "account_age_days": 1210, "flagged_transactions": ["TX-1101", "TX-1102"], "total_flagged_volume": 130000.0}', 'Alert ALERT-0110 was triggered on 2025-12-12 for customer David Hall (C-3381-0110). Risk level: MEDIUM. 3 rules fired: InternationalWire, HighRiskKeyword, CircularMovement. Total flagged volume: $130,000.00 across 2 transactions.', '["Risk Level: MEDIUM", "Rules Fired: InternationalWire, HighRiskKeyword, CircularMovement", "Flagged Volume: $130,000.00", "Transaction Count: 2"]', 'completed'),
	(32, '23707230-302d-4c61-8f9e-a88acf97823a', 2, 'Customer Profile Review', '2026-05-10 02:53:08.062033+00', 'get_customer_profile', '{"customer_id": "C-3381-0110"}', '{"email": "david.hall3381@example.com", "phone": "(555) 703-9988", "addresses": [{"city": null, "type": "PERSONAL", "state": null, "street": "220 Marina View Dr, Miami, FL 33132", "country": "USA"}], "kyc_status": "CURRENT", "pep_status": false, "customer_id": "C-3381-0110", "risk_rating": "LOW", "adverse_media": true, "business_type": "Financial Consultant", "customer_name": "David Hall", "customer_type": "INDIVIDUAL", "industry_code": null, "sanctions_hit": false, "account_opened": "2023-01-15", "kyc_last_updated": "2023-01-15", "beneficial_owners": [], "expected_activity": {"monthly_volume": 15000.0, "geographic_scope": "DOMESTIC", "transaction_types": ["CASH_DEPOSIT", "WIRE_TRANSFER", "ACH_CREDIT", "ACH_DEBIT"]}}', 'Customer David Hall is a INDIVIDUAL in the Financial Consultant industry. Account opened: 2023-01-15. KYC status: CURRENT (last updated 2023-01-15). Current risk rating: LOW. PEP status: NO.', '["Business Type: Financial Consultant", "KYC Status: CURRENT", "Risk Rating: LOW", "PEP: NO"]', 'completed'),
	(33, '23707230-302d-4c61-8f9e-a88acf97823a', 3, 'Transaction History Search', '2026-05-10 02:53:08.06973+00', 'search_transactions', '{"min_amount": 1000, "customer_id": "C-3381-0110"}', '{"count": 7, "transactions": [{"date": "2025-12-07", "type": "WIRE_TRANSFER", "flags": ["international", "rapid-movement", "dispersal-pattern", "private-banking"], "amount": -55000.0, "currency": "USD", "location": "Hong Kong, HKG", "customer_id": "C-3381-0110", "description": "Wire Transfer - International", "counterparty": "HSBC Hong Kong Private Banking", "transaction_id": "TX-1102"}, {"date": "2025-12-03", "type": "WIRE_TRANSFER", "flags": ["international", "offshore-jurisdiction", "large-transfer", "no-documentation"], "amount": -75000.0, "currency": "USD", "location": "George Town, CYM", "customer_id": "C-3381-0110", "description": "Wire Transfer - International", "counterparty": "Banco Santander Cayman Islands", "transaction_id": "TX-1101"}, {"date": "2025-11-25", "type": "ACH_CREDIT", "flags": [], "amount": 135000.0, "currency": "USD", "location": "Miami, USA", "customer_id": "C-3381-0110", "description": "ACH Credit - Management Consulting Fee", "counterparty": "Meridian Capital Advisory LLC", "transaction_id": "TX-1095"}, {"date": "2025-11-18", "type": "WIRE_TRANSFER", "flags": [], "amount": 85000.0, "currency": "USD", "location": "Miami, USA", "customer_id": "C-3381-0110", "description": "Wire Transfer - Domestic", "counterparty": "Hall Financial Services LLC", "transaction_id": "TX-1090"}, {"date": "2025-11-10", "type": "ACH_CREDIT", "flags": [], "amount": 45000.0, "currency": "USD", "location": "Fort Lauderdale, USA", "customer_id": "C-3381-0110", "description": "ACH Credit - Investment Return", "counterparty": "Coral Springs Investment Fund", "transaction_id": "TX-1085"}, {"date": "2025-10-28", "type": "ACH_DEBIT", "flags": [], "amount": -8500.0, "currency": "USD", "location": "Miami, USA", "customer_id": "C-3381-0110", "description": "ACH Debit - Professional Services", "counterparty": "Legal & Compliance Group PA", "transaction_id": "TX-1078"}, {"date": "2025-10-15", "type": "ACH_CREDIT", "flags": [], "amount": 22000.0, "currency": "USD", "location": "Miami, USA", "customer_id": "C-3381-0110", "description": "ACH Credit - Referral Fee", "counterparty": "Southeast Capital Partners", "transaction_id": "TX-1072"}]}', 'Found 7 transactions totaling $148,500.00. 2 transactions have risk flags. Transaction types: ACH_CREDIT, WIRE_TRANSFER.', '["Total Transactions: 7", "Total Volume: $148,500.00", "Flagged Transactions: 2", "Avg Transaction: $21,214.29"]', 'completed'),
	(36, '23707230-302d-4c61-8f9e-a88acf97823a', 6, 'Keyword Search', '2026-05-10 02:53:08.09495+00', 'search_keywords', '{"keywords": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "customer_id": "C-3381-0110"}', '{"matches": [{"date": "2025-12-07", "amount": -55000.0, "context": "Notes", "description": "Wire Transfer - International", "transaction_id": "TX-1102", "keyword_matched": "offshore"}, {"date": "2025-12-03", "amount": -75000.0, "context": "Notes", "description": "Wire Transfer - International", "transaction_id": "TX-1101", "keyword_matched": "offshore"}, {"date": "2025-11-25", "amount": 135000.0, "context": "Description", "description": "ACH Credit - Management Consulting Fee", "transaction_id": "TX-1095", "keyword_matched": "consulting"}, {"date": "2025-10-28", "amount": -8500.0, "context": "Description", "description": "ACH Debit - Professional Services", "transaction_id": "TX-1078", "keyword_matched": "services"}, {"date": "2025-10-15", "amount": 22000.0, "context": "Notes", "description": "ACH Credit - Referral Fee", "transaction_id": "TX-1072", "keyword_matched": "consulting"}], "customer_id": "C-3381-0110", "total_matches": 5, "requires_review": true, "keywords_searched": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "high_risk_keywords_found": ["offshore"]}', 'Searched for 8 suspicious keywords. Found 5 matches. High-risk keywords: offshore.', '["Keywords Searched: 8", "Matches Found: 5", "High-Risk Keywords: offshore"]', 'completed'),
	(37, '23707230-302d-4c61-8f9e-a88acf97823a', 7, 'Network Analysis', '2026-05-10 02:53:08.102145+00', 'analyze_network', '{"depth": 2, "customer_id": "C-3381-0110"}', '{"connections": [{"entity_id": "ALERT-0110:n1", "risk_score": 50.0, "entity_name": "Meridian Capital Advisory", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}, {"entity_id": "ALERT-0110:n5", "risk_score": 20.0, "entity_name": "Coral Springs Investment Fund", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}, {"entity_id": "ALERT-0110:n2", "risk_score": 75.0, "entity_name": "Banco Santander Cayman", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0110:n3", "risk_score": 75.0, "entity_name": "HSBC HK Private Banking", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0110:n4", "risk_score": 50.0, "entity_name": "Hall Financial Services LLC", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}], "customer_id": "C-3381-0110", "analysis_depth": 2, "circular_flows": [], "layering_detected": false, "total_connections": 5, "network_risk_score": 54.0, "high_risk_connections": 2, "shared_infrastructure": false}', 'Network analysis found 5 connected entities. High-risk connections: 2. Circular flows detected: 0. Layering detected: NO.', '["Total Connections: 5", "High-Risk Connections: 2", "Circular Flows: 0", "Layering: NO"]', 'completed'),
	(38, '23707230-302d-4c61-8f9e-a88acf97823a', 8, 'Sanctions Screening', '2026-05-10 02:53:08.108796+00', 'check_sanctions', '{"entity_name": "David Hall", "entity_type": "BUSINESS"}', '{"matches": [{"list": "DOW_JONES_ADVERSE", "program": "Adverse Media", "added_date": null, "match_name": "David Hall", "match_type": "POTENTIAL", "entity_type": "CUSTOMER", "match_score": 58, "requires_review": true}], "total_hits": 1, "entity_name": "David Hall", "entity_type": "INDIVIDUAL", "lists_checked": ["OFAC_SDN", "UN_CONSOLIDATED", "EU_SANCTIONS", "UK_HMT"], "screening_date": "2026-05-10 02:53:08"}', 'Screened David Hall against 4 sanctions lists. Total hits: 1. POTENTIAL MATCH FOUND - requires review.', '["Lists Checked: 4", "Total Hits: 1", "Status: ⚠️ MATCH FOUND"]', 'completed'),
	(39, '23707230-302d-4c61-8f9e-a88acf97823a', 9, 'Risk Score Calculation', '2026-05-10 02:53:08.108871+00', 'calculate_risk_score', '{"factors": {"sanctions_hit": 0.4, "income_inconsistent": 0.25, "suspicious_keywords": 0.15, "multiple_rules_fired": 0.3}}', '{"confidence": 90.0, "risk_level": "CRITICAL", "risk_score": 110.0, "requires_edd": true, "requires_sar": true, "calculated_at": "2026-05-10 02:53:08", "recommendation": "ESCALATE", "factor_breakdown": [{"factor": "sanctions_hit", "weight": 0.4, "contribution": 40.0}, {"factor": "multiple_rules_fired", "weight": 0.3, "contribution": 30.0}, {"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}, {"factor": "suspicious_keywords", "weight": 0.15, "contribution": 15.0}], "factors_analyzed": 4}', 'Risk score: 110.0/100 (CRITICAL). Analyzed 4 risk factors. Recommendation: ESCALATE (confidence: 90.0%). Requires SAR: YES.', '["Risk Score: 110.0/100", "Risk Level: CRITICAL", "Recommendation: ESCALATE", "Confidence: 90.0%", "Requires SAR: YES"]', 'completed'),
	(40, '23707230-302d-4c61-8f9e-a88acf97823a', 10, 'Narrative Generation', '2026-05-10 02:53:08.108919+00', 'generate_narrative', '{"investigation_state": "complete"}', '{"narrative": "\nINVESTIGATION NARRATIVE - ALERT-0110\n\nALERT SUMMARY:\nAlert ALERT-0110 was triggered on 2025-12-12 for David Hall \n(C-3381-0110). The alert was classified as MEDIUM risk with an alert \nscore of 55.\n\nR..."}', 'Investigation narrative generated. Recommendation: ESCALATE. Total investigation steps completed: 9.', '["Steps Completed: 9", "Final Recommendation: ESCALATE", "Narrative Length: 1437 characters"]', 'completed'),
	(41, '3dba89a1-d641-4289-9bbe-e8ad7a14d326', 1, 'Alert Details Retrieval', '2026-05-10 02:53:08.151795+00', 'get_alert_details', '{"alert_id": "ALERT-0111"}', '{"status": "CLEAR", "alert_id": "ALERT-0111", "risk_level": "LOW", "rule_count": 2, "alert_score": 38, "assigned_to": "System", "customer_id": "C-5502-0111", "rules_fired": ["HighRiskKeyword", "VelocityIncrease"], "alert_window": {"end_date": "2025-12-15", "start_date": "2025-11-15"}, "created_date": "2025-12-15", "customer_name": "Marisol Nguyen-Kelley", "previous_alerts": 0, "account_age_days": 2014, "flagged_transactions": ["TX-1088", "TX-1111", "TX-1112", "TX-1113"], "total_flagged_volume": 6987.0}', 'Alert ALERT-0111 was triggered on 2025-12-15 for customer Marisol Nguyen-Kelley (C-5502-0111). Risk level: LOW. 2 rules fired: HighRiskKeyword, VelocityIncrease. Total flagged volume: $6,987.00 across 4 transactions.', '["Risk Level: LOW", "Rules Fired: HighRiskKeyword, VelocityIncrease", "Flagged Volume: $6,987.00", "Transaction Count: 4"]', 'completed'),
	(49, '3dba89a1-d641-4289-9bbe-e8ad7a14d326', 9, 'Risk Score Calculation', '2026-05-10 02:53:08.204889+00', 'calculate_risk_score', '{"factors": {"income_inconsistent": 0.25, "multiple_rules_fired": 0.2}}', '{"confidence": 65.0, "risk_level": "MEDIUM", "risk_score": 45.0, "requires_edd": false, "requires_sar": false, "calculated_at": "2026-05-10 02:53:08", "recommendation": "CLEAR", "factor_breakdown": [{"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}, {"factor": "multiple_rules_fired", "weight": 0.2, "contribution": 20.0}], "factors_analyzed": 2}', 'Risk score: 45.0/100 (MEDIUM). Analyzed 2 risk factors. Recommendation: CLEAR (confidence: 65.0%). Requires SAR: NO.', '["Risk Score: 45.0/100", "Risk Level: MEDIUM", "Recommendation: CLEAR", "Confidence: 65.0%", "Requires SAR: NO"]', 'completed'),
	(42, '3dba89a1-d641-4289-9bbe-e8ad7a14d326', 2, 'Customer Profile Review', '2026-05-10 02:53:08.159956+00', 'get_customer_profile', '{"customer_id": "C-5502-0111"}', '{"email": "marisol.nk5502@example.com", "phone": "(555) 441-0034", "addresses": [{"city": null, "type": "PERSONAL", "state": null, "street": "5 Westgate Ave, Austin, TX 78701", "country": "USA"}], "kyc_status": "CURRENT", "pep_status": false, "customer_id": "C-5502-0111", "risk_rating": "LOW", "adverse_media": false, "business_type": "Software Engineer", "customer_name": "Marisol Nguyen-Kelley", "customer_type": "INDIVIDUAL", "industry_code": null, "sanctions_hit": false, "account_opened": "2020-11-02", "kyc_last_updated": "2020-11-02", "beneficial_owners": [], "expected_activity": {"monthly_volume": 11250.0, "geographic_scope": "DOMESTIC", "transaction_types": ["CASH_DEPOSIT", "WIRE_TRANSFER", "ACH_CREDIT", "ACH_DEBIT"]}}', 'Customer Marisol Nguyen-Kelley is a INDIVIDUAL in the Software Engineer industry. Account opened: 2020-11-02. KYC status: CURRENT (last updated 2020-11-02). Current risk rating: LOW. PEP status: NO.', '["Business Type: Software Engineer", "KYC Status: CURRENT", "Risk Rating: LOW", "PEP: NO"]', 'completed'),
	(43, '3dba89a1-d641-4289-9bbe-e8ad7a14d326', 3, 'Transaction History Search', '2026-05-10 02:53:08.165684+00', 'search_transactions', '{"min_amount": 1000, "customer_id": "C-5502-0111"}', '{"count": 8, "transactions": [{"date": "2025-12-12", "type": "P2P_TRANSFER", "flags": ["high-risk-keyword"], "amount": 1750.0, "currency": "USD", "location": "Austin, USA", "customer_id": "C-5502-0111", "description": "P2P Transfer - Venmo", "counterparty": "@marcus.wei (Venmo)", "transaction_id": "TX-1113"}, {"date": "2025-12-11", "type": "P2P_TRANSFER", "flags": ["high-risk-keyword"], "amount": 1900.0, "currency": "USD", "location": "Austin, USA", "customer_id": "C-5502-0111", "description": "P2P Transfer - Venmo", "counterparty": "@priya.dev.austin (Venmo)", "transaction_id": "TX-1112"}, {"date": "2025-12-10", "type": "P2P_TRANSFER", "flags": ["high-risk-keyword"], "amount": 2850.0, "currency": "USD", "location": "Austin, USA", "customer_id": "C-5502-0111", "description": "P2P Transfer - Venmo", "counterparty": "@kai.chen.dev (Venmo)", "transaction_id": "TX-1111"}, {"date": "2025-12-09", "type": "ACH_CREDIT", "flags": [], "amount": 5625.0, "currency": "USD", "location": "USA", "customer_id": "C-5502-0111", "description": "Direct Deposit - Payroll", "counterparty": "Synapse Technologies Inc Payroll", "transaction_id": "TX-1110"}, {"date": "2025-12-05", "type": "ACH_DEBIT", "flags": [], "amount": -2300.0, "currency": "USD", "location": "Austin, USA", "customer_id": "C-5502-0111", "description": "ACH Debit - Mortgage Payment", "counterparty": "Austin Home Lending LLC", "transaction_id": "TX-1105"}, {"date": "2025-11-25", "type": "ACH_CREDIT", "flags": [], "amount": 5625.0, "currency": "USD", "location": "USA", "customer_id": "C-5502-0111", "description": "Direct Deposit - Payroll", "counterparty": "Synapse Technologies Inc Payroll", "transaction_id": "TX-1098"}, {"date": "2025-11-10", "type": "DEBIT_PURCHASE", "flags": [], "amount": -1425.0, "currency": "USD", "location": "Seattle, USA", "customer_id": "C-5502-0111", "description": "Purchase - Hotel", "counterparty": "Marriott Seattle Downtown", "transaction_id": "TX-1079"}, {"date": "2025-10-30", "type": "ACH_CREDIT", "flags": [], "amount": 5625.0, "currency": "USD", "location": "USA", "customer_id": "C-5502-0111", "description": "Direct Deposit - Payroll", "counterparty": "Synapse Technologies Inc Payroll", "transaction_id": "TX-1068"}]}', 'Found 8 transactions totaling $19,650.00. 3 transactions have risk flags. Transaction types: ACH_CREDIT, ACH_DEBIT, P2P_TRANSFER.', '["Total Transactions: 8", "Total Volume: $19,650.00", "Flagged Transactions: 3", "Avg Transaction: $2,456.25"]', 'completed'),
	(44, '3dba89a1-d641-4289-9bbe-e8ad7a14d326', 4, 'Baseline Calculation', '2026-05-10 02:53:08.173691+00', 'calculate_baseline', '{"customer_id": "C-5502-0111", "period_days": 90}', '{"deviations": {"size_deviation_pct": -51.3, "volume_deviation_pct": -2.5, "frequency_deviation_pct": -33.3}, "customer_id": "C-5502-0111", "deviation_score": 18.4, "baseline_metrics": {"wire_ratio": 0.0, "avg_monthly_volume": 7166.67, "cash_deposit_ratio": 0.0, "avg_transaction_size": 3583.33, "transaction_frequency": 6}, "alert_period_metrics": {"monthly_volume": 6987.0, "avg_transaction_size": 1746.75, "transaction_frequency": 4}, "analysis_period_days": 90, "is_significant_deviation": false}', 'Baseline monthly volume: $7,166.67. Alert period volume: $6,987.00. Deviation: -2.5%. Significant deviation: NO.', '["Baseline Volume: $7,166.67/month", "Alert Period Volume: $6,987.00/month", "Deviation: -2.5%", "Significant: NO"]', 'completed'),
	(45, '3dba89a1-d641-4289-9bbe-e8ad7a14d326', 5, 'Income Verification', '2026-05-10 02:53:08.181264+00', 'verify_income', '{"customer_id": "C-5502-0111"}', '{"red_flags": ["Volume exceeds stated income by >100%"], "customer_id": "C-5502-0111", "income_source": "Salary", "is_consistent": false, "discrepancy_pct": 118.8, "verification_status": "INCONSISTENT", "stated_annual_income": 135000.0, "documentation_provided": "Bank Statements", "observed_annual_volume": 295345.83}', 'Stated annual income: $135,000.00. Observed annual volume: $295,345.83. Discrepancy: 118.8%. Verification status: INCONSISTENT.', '["Stated Income: $135,000.00", "Observed Volume: $295,345.83", "Discrepancy: 118.8%", "Status: INCONSISTENT"]', 'completed'),
	(46, '3dba89a1-d641-4289-9bbe-e8ad7a14d326', 6, 'Keyword Search', '2026-05-10 02:53:08.189556+00', 'search_keywords', '{"keywords": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "customer_id": "C-5502-0111"}', '{"matches": [], "customer_id": "C-5502-0111", "total_matches": 0, "requires_review": false, "keywords_searched": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "high_risk_keywords_found": []}', 'Searched for 8 suspicious keywords. Found 0 matches. High-risk keywords: None.', '["Keywords Searched: 8", "Matches Found: 0", "High-Risk Keywords: None"]', 'completed'),
	(47, '3dba89a1-d641-4289-9bbe-e8ad7a14d326', 7, 'Network Analysis', '2026-05-10 02:53:08.198975+00', 'analyze_network', '{"depth": 2, "customer_id": "C-5502-0111"}', '{"connections": [{"entity_id": "ALERT-0111:n1", "risk_score": 20.0, "entity_name": "Synapse Technologies", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}, {"entity_id": "ALERT-0111:n2", "risk_score": 20.0, "entity_name": "@kai.chen.dev", "total_volume": 2.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 2}, {"entity_id": "ALERT-0111:n3", "risk_score": 20.0, "entity_name": "@priya.dev.austin", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0111:n4", "risk_score": 20.0, "entity_name": "@marcus.wei", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0111:n5", "risk_score": 20.0, "entity_name": "Delta Air Lines", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}], "customer_id": "C-5502-0111", "analysis_depth": 2, "circular_flows": [], "layering_detected": false, "total_connections": 5, "network_risk_score": 20.0, "high_risk_connections": 0, "shared_infrastructure": false}', 'Network analysis found 5 connected entities. High-risk connections: 0. Circular flows detected: 0. Layering detected: NO.', '["Total Connections: 5", "High-Risk Connections: 0", "Circular Flows: 0", "Layering: NO"]', 'completed'),
	(48, '3dba89a1-d641-4289-9bbe-e8ad7a14d326', 8, 'Sanctions Screening', '2026-05-10 02:53:08.20476+00', 'check_sanctions', '{"entity_name": "Marisol Nguyen-Kelley", "entity_type": "BUSINESS"}', '{"matches": [], "total_hits": 0, "entity_name": "Marisol Nguyen-Kelley", "entity_type": "INDIVIDUAL", "lists_checked": ["OFAC_SDN", "UN_CONSOLIDATED", "EU_SANCTIONS", "UK_HMT"], "screening_date": "2026-05-10 02:53:08"}', 'Screened Marisol Nguyen-Kelley against 4 sanctions lists. Total hits: 0. No matches found.', '["Lists Checked: 4", "Total Hits: 0", "Status: ✓ Clear"]', 'completed'),
	(50, '3dba89a1-d641-4289-9bbe-e8ad7a14d326', 10, 'Narrative Generation', '2026-05-10 02:53:08.204971+00', 'generate_narrative', '{"investigation_state": "complete"}', '{"narrative": "\nINVESTIGATION NARRATIVE - ALERT-0111\n\nALERT SUMMARY:\nAlert ALERT-0111 was triggered on 2025-12-15 for Marisol Nguyen-Kelley \n(C-5502-0111). The alert was classified as LOW risk with an alert \nscore o..."}', 'Investigation narrative generated. Recommendation: CLEAR. Total investigation steps completed: 9.', '["Steps Completed: 9", "Final Recommendation: CLEAR", "Narrative Length: 1313 characters"]', 'completed'),
	(51, 'cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 1, 'Alert Details Retrieval', '2026-05-10 02:53:08.247753+00', 'get_alert_details', '{"alert_id": "ALERT-0112"}', '{"status": "CLEAR", "alert_id": "ALERT-0112", "risk_level": "LOW", "rule_count": 3, "alert_score": 41, "assigned_to": "System", "customer_id": "C-6613-0112", "rules_fired": ["HighRiskKeyword", "VelocityIncrease", "RoundAmounts"], "alert_window": {"end_date": "2025-12-17", "start_date": "2025-11-17"}, "created_date": "2025-12-17", "customer_name": "Darius J. Wainwright", "previous_alerts": 1, "account_age_days": 2880, "flagged_transactions": ["TX-1115", "TX-1121", "TX-1122", "TX-1123"], "total_flagged_volume": 675000.0}', 'Alert ALERT-0112 was triggered on 2025-12-17 for customer Darius J. Wainwright (C-6613-0112). Risk level: LOW. 3 rules fired: HighRiskKeyword, VelocityIncrease, RoundAmounts. Total flagged volume: $675,000.00 across 4 transactions.', '["Risk Level: LOW", "Rules Fired: HighRiskKeyword, VelocityIncrease, RoundAmounts", "Flagged Volume: $675,000.00", "Transaction Count: 4"]', 'completed'),
	(52, 'cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 2, 'Customer Profile Review', '2026-05-10 02:53:08.263468+00', 'get_customer_profile', '{"customer_id": "C-6613-0112"}', '{"email": "d.wainwright6613@example.com", "phone": "(555) 502-7761", "addresses": [{"city": null, "type": "BUSINESS", "state": null, "street": "900 Lakewood Rd, Chicago, IL 60601", "country": "USA"}], "kyc_status": "CURRENT", "pep_status": false, "customer_id": "C-6613-0112", "risk_rating": "LOW", "adverse_media": false, "business_type": "Attorney", "customer_name": "Darius J. Wainwright", "customer_type": "BUSINESS", "industry_code": null, "sanctions_hit": false, "account_opened": "2018-06-20", "kyc_last_updated": "2018-06-20", "beneficial_owners": [], "expected_activity": {"monthly_volume": 26666.666666666668, "geographic_scope": "DOMESTIC", "transaction_types": ["CASH_DEPOSIT", "WIRE_TRANSFER", "ACH_CREDIT", "ACH_DEBIT"]}}', 'Customer Darius J. Wainwright is a BUSINESS in the Attorney industry. Account opened: 2018-06-20. KYC status: CURRENT (last updated 2018-06-20). Current risk rating: LOW. PEP status: NO.', '["Business Type: Attorney", "KYC Status: CURRENT", "Risk Rating: LOW", "PEP: NO"]', 'completed'),
	(53, 'cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 3, 'Transaction History Search', '2026-05-10 02:53:08.273989+00', 'search_transactions', '{"min_amount": 1000, "customer_id": "C-6613-0112"}', '{"count": 8, "transactions": [{"date": "2025-12-12", "type": "WIRE_TRANSFER", "flags": ["round-amount", "internal-transfer"], "amount": -75000.0, "currency": "USD", "location": "Chicago, USA", "customer_id": "C-6613-0112", "description": "Wire Transfer - IOLTA Disbursement", "counterparty": "Wainwright Law LLC Operating Acct", "transaction_id": "TX-1123"}, {"date": "2025-12-10", "type": "WIRE_TRANSFER", "flags": ["round-amount", "large-transfer"], "amount": -50000.0, "currency": "USD", "location": "Chicago, USA", "customer_id": "C-6613-0112", "description": "Wire Transfer - IOLTA Trust", "counterparty": "Cook County Circuit Court - Clerk", "transaction_id": "TX-1122"}, {"date": "2025-12-08", "type": "WIRE_TRANSFER", "flags": ["large-transfer", "round-amount"], "amount": -250000.0, "currency": "USD", "location": "Chicago, USA", "customer_id": "C-6613-0112", "description": "Wire Transfer - IOLTA Trust", "counterparty": "1st National Escrow Services", "transaction_id": "TX-1121"}, {"date": "2025-12-05", "type": "WIRE_TRANSFER", "flags": ["large-transfer", "round-amount"], "amount": 300000.0, "currency": "USD", "location": "Detroit, USA", "customer_id": "C-6613-0112", "description": "Wire Transfer - Client Funds Received", "counterparty": "Harrison Industrial Corp", "transaction_id": "TX-1115"}, {"date": "2025-11-29", "type": "WIRE_TRANSFER", "flags": [], "amount": 180000.0, "currency": "USD", "location": "Chicago, USA", "customer_id": "C-6613-0112", "description": "Wire Transfer - Client Funds Received", "counterparty": "Lakeview Partners LLC", "transaction_id": "TX-1108"}, {"date": "2025-11-20", "type": "ACH_DEBIT", "flags": [], "amount": -65000.0, "currency": "USD", "location": "USA", "customer_id": "C-6613-0112", "description": "ACH Debit - Payroll", "counterparty": "Wainwright Law LLC Payroll", "transaction_id": "TX-1100"}, {"date": "2025-11-15", "type": "WIRE_TRANSFER", "flags": [], "amount": -120000.0, "currency": "USD", "location": "Chicago, USA", "customer_id": "C-6613-0112", "description": "Wire Transfer - Opposing Counsel Settlement", "counterparty": "Johnson & Reed LLP Escrow", "transaction_id": "TX-1090"}, {"date": "2025-11-01", "type": "ACH_CREDIT", "flags": [], "amount": 50000.0, "currency": "USD", "location": "Chicago, USA", "customer_id": "C-6613-0112", "description": "ACH Credit - Retainer Deposit", "counterparty": "Midwest Equity Group Inc", "transaction_id": "TX-1082"}]}', 'Found 8 transactions totaling $-30,000.00. 4 transactions have risk flags. Transaction types: WIRE_TRANSFER.', '["Total Transactions: 8", "Total Volume: $-30,000.00", "Flagged Transactions: 4", "Avg Transaction: $-3,750.00"]', 'completed'),
	(54, 'cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 4, 'Baseline Calculation', '2026-05-10 02:53:08.281984+00', 'calculate_baseline', '{"customer_id": "C-6613-0112", "period_days": 90}', '{"deviations": {"size_deviation_pct": 62.7, "volume_deviation_pct": 388.0, "frequency_deviation_pct": 0.0}, "customer_id": "C-6613-0112", "deviation_score": 100.0, "baseline_metrics": {"wire_ratio": 0.5, "avg_monthly_volume": 138333.33, "cash_deposit_ratio": 0.0, "avg_transaction_size": 103750.0, "transaction_frequency": 4}, "alert_period_metrics": {"monthly_volume": 675000.0, "avg_transaction_size": 168750.0, "transaction_frequency": 4}, "analysis_period_days": 90, "is_significant_deviation": true}', 'Baseline monthly volume: $138,333.33. Alert period volume: $675,000.00. Deviation: +388.0%. Significant deviation: YES.', '["Baseline Volume: $138,333.33/month", "Alert Period Volume: $675,000.00/month", "Deviation: +388.0%", "Significant: YES"]', 'completed'),
	(55, 'cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 5, 'Income Verification', '2026-05-10 02:53:08.293319+00', 'verify_income', '{"customer_id": "C-6613-0112"}', '{"red_flags": ["Volume exceeds stated income by >100%"], "customer_id": "C-6613-0112", "income_source": "Business Revenue", "is_consistent": false, "discrepancy_pct": 1915.1, "verification_status": "INCONSISTENT", "stated_annual_income": 320000.0, "documentation_provided": "Bank Statements", "observed_annual_volume": 6448333.33}', 'Stated annual income: $320,000.00. Observed annual volume: $6,448,333.33. Discrepancy: 1915.1%. Verification status: INCONSISTENT.', '["Stated Income: $320,000.00", "Observed Volume: $6,448,333.33", "Discrepancy: 1915.1%", "Status: INCONSISTENT"]', 'completed'),
	(56, 'cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 6, 'Keyword Search', '2026-05-10 02:53:08.300791+00', 'search_keywords', '{"keywords": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "customer_id": "C-6613-0112"}', '{"matches": [], "customer_id": "C-6613-0112", "total_matches": 0, "requires_review": false, "keywords_searched": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "high_risk_keywords_found": []}', 'Searched for 8 suspicious keywords. Found 0 matches. High-risk keywords: None.', '["Keywords Searched: 8", "Matches Found: 0", "High-Risk Keywords: None"]', 'completed'),
	(57, 'cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 7, 'Network Analysis', '2026-05-10 02:53:08.31145+00', 'analyze_network', '{"depth": 2, "customer_id": "C-6613-0112"}', '{"connections": [{"entity_id": "ALERT-0112:n1", "risk_score": 20.0, "entity_name": "Harrison Industrial Corp", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}, {"entity_id": "ALERT-0112:n5", "risk_score": 20.0, "entity_name": "Lakeview Partners LLC", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}, {"entity_id": "ALERT-0112:n2", "risk_score": 20.0, "entity_name": "1st National Escrow", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0112:n3", "risk_score": 20.0, "entity_name": "Cook County Circuit Court", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0112:n4", "risk_score": 20.0, "entity_name": "Wainwright Law LLC", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}], "customer_id": "C-6613-0112", "analysis_depth": 2, "circular_flows": [], "layering_detected": false, "total_connections": 5, "network_risk_score": 20.0, "high_risk_connections": 0, "shared_infrastructure": false}', 'Network analysis found 5 connected entities. High-risk connections: 0. Circular flows detected: 0. Layering detected: NO.', '["Total Connections: 5", "High-Risk Connections: 0", "Circular Flows: 0", "Layering: NO"]', 'completed'),
	(58, 'cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 8, 'Sanctions Screening', '2026-05-10 02:53:08.316663+00', 'check_sanctions', '{"entity_name": "Darius J. Wainwright", "entity_type": "BUSINESS"}', '{"matches": [], "total_hits": 0, "entity_name": "Darius J. Wainwright", "entity_type": "BUSINESS", "lists_checked": ["OFAC_SDN", "UN_CONSOLIDATED", "EU_SANCTIONS", "UK_HMT"], "screening_date": "2026-05-10 02:53:08"}', 'Screened Darius J. Wainwright against 4 sanctions lists. Total hits: 0. No matches found.', '["Lists Checked: 4", "Total Hits: 0", "Status: ✓ Clear"]', 'completed'),
	(59, 'cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 9, 'Risk Score Calculation', '2026-05-10 02:53:08.316768+00', 'calculate_risk_score', '{"factors": {"income_inconsistent": 0.25, "multiple_rules_fired": 0.3, "extreme_volume_deviation": 0.3}}', '{"confidence": 90.0, "risk_level": "CRITICAL", "risk_score": 85.0, "requires_edd": true, "requires_sar": true, "calculated_at": "2026-05-10 02:53:08", "recommendation": "ESCALATE", "factor_breakdown": [{"factor": "multiple_rules_fired", "weight": 0.3, "contribution": 30.0}, {"factor": "extreme_volume_deviation", "weight": 0.3, "contribution": 30.0}, {"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}], "factors_analyzed": 3}', 'Risk score: 85.0/100 (CRITICAL). Analyzed 3 risk factors. Recommendation: ESCALATE (confidence: 90.0%). Requires SAR: YES.', '["Risk Score: 85.0/100", "Risk Level: CRITICAL", "Recommendation: ESCALATE", "Confidence: 90.0%", "Requires SAR: YES"]', 'completed'),
	(60, 'cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 10, 'Narrative Generation', '2026-05-10 02:53:08.316845+00', 'generate_narrative', '{"investigation_state": "complete"}', '{"narrative": "\nINVESTIGATION NARRATIVE - ALERT-0112\n\nALERT SUMMARY:\nAlert ALERT-0112 was triggered on 2025-12-17 for Darius J. Wainwright \n(C-6613-0112). The alert was classified as LOW risk with an alert \nscore of..."}', 'Investigation narrative generated. Recommendation: ESCALATE. Total investigation steps completed: 9.', '["Steps Completed: 9", "Final Recommendation: ESCALATE", "Narrative Length: 1383 characters"]', 'completed'),
	(61, '380a8362-d39b-44cd-978b-c73ce6075be5', 1, 'Alert Details Retrieval', '2026-05-10 02:53:22.623029+00', 'get_alert_details', '{"alert_id": "ALERT-0109"}', '{"status": "ESCALATE", "alert_id": "ALERT-0109", "risk_level": "CRITICAL", "rule_count": 3, "alert_score": 89, "assigned_to": "System", "customer_id": "C-4490-0109", "rules_fired": ["HighRiskKeyword", "VelocityIncrease", "StructuredDeposits"], "alert_window": {"end_date": "2025-12-12", "start_date": "2025-11-12"}, "created_date": "2025-12-12", "customer_name": "Neal Hall", "previous_alerts": 5, "account_age_days": 2568, "flagged_transactions": ["TX-1091", "TX-1092", "TX-1093", "TX-1094", "TX-1095"], "total_flagged_volume": 323200.0}', 'Alert ALERT-0109 was triggered on 2025-12-12 for customer Neal Hall (C-4490-0109). Risk level: CRITICAL. 3 rules fired: HighRiskKeyword, VelocityIncrease, StructuredDeposits. Total flagged volume: $323,200.00 across 5 transactions.', '["Risk Level: CRITICAL", "Rules Fired: HighRiskKeyword, VelocityIncrease, StructuredDeposits", "Flagged Volume: $323,200.00", "Transaction Count: 5"]', 'completed'),
	(62, '380a8362-d39b-44cd-978b-c73ce6075be5', 2, 'Customer Profile Review', '2026-05-10 02:53:22.633797+00', 'get_customer_profile', '{"customer_id": "C-4490-0109"}', '{"email": "neal.hall4490@example.com", "phone": "(555) 619-2200", "addresses": [{"city": null, "type": "BUSINESS", "state": null, "street": "17 Sunset Blvd, Los Angeles, CA 90028", "country": "USA"}], "kyc_status": "NEEDS_REFRESH", "pep_status": true, "customer_id": "C-4490-0109", "risk_rating": "HIGH", "adverse_media": false, "business_type": "Real Estate Developer", "customer_name": "Neal Hall", "customer_type": "BUSINESS", "industry_code": null, "sanctions_hit": false, "account_opened": "2019-04-28", "kyc_last_updated": "2019-04-28", "beneficial_owners": [], "expected_activity": {"monthly_volume": 20833.333333333332, "geographic_scope": "DOMESTIC", "transaction_types": ["CASH_DEPOSIT", "WIRE_TRANSFER", "ACH_CREDIT", "ACH_DEBIT"]}}', 'Customer Neal Hall is a BUSINESS in the Real Estate Developer industry. Account opened: 2019-04-28. KYC status: NEEDS_REFRESH (last updated 2019-04-28). Current risk rating: HIGH. PEP status: YES.', '["Business Type: Real Estate Developer", "KYC Status: NEEDS_REFRESH", "Risk Rating: HIGH", "PEP: YES"]', 'completed'),
	(63, '380a8362-d39b-44cd-978b-c73ce6075be5', 3, 'Transaction History Search', '2026-05-10 02:53:22.643095+00', 'search_transactions', '{"min_amount": 1000, "customer_id": "C-4490-0109"}', '{"count": 7, "transactions": [{"date": "2025-12-05", "type": "WIRE_TRANSFER", "flags": ["international", "high-risk-jurisdiction", "large-transfer"], "amount": -200000.0, "currency": "USD", "location": "Frankfurt, DEU", "customer_id": "C-4490-0109", "description": "International Wire", "counterparty": "Deutsche Bank Frankfurt", "transaction_id": "TX-1095"}, {"date": "2025-12-04", "type": "CASH_DEPOSIT", "flags": ["structuring", "sub-threshold", "multi-branch"], "amount": 9800.0, "currency": "USD", "location": "Los Angeles, USA", "customer_id": "C-4490-0109", "description": "Cash Deposit", "counterparty": "Branch - Downtown LA", "transaction_id": "TX-1094"}, {"date": "2025-12-03", "type": "WIRE_TRANSFER", "flags": ["shell-entity", "large-transfer", "no-documentation"], "amount": 95000.0, "currency": "USD", "location": "USA", "customer_id": "C-4490-0109", "description": "Wire Transfer - Domestic", "counterparty": "Nexus Realty LLC", "transaction_id": "TX-1093"}, {"date": "2025-12-02", "type": "CASH_DEPOSIT", "flags": ["structuring", "sub-threshold", "multi-branch"], "amount": 9500.0, "currency": "USD", "location": "Burbank, USA", "customer_id": "C-4490-0109", "description": "Cash Deposit", "counterparty": "Branch - Burbank", "transaction_id": "TX-1092"}, {"date": "2025-12-01", "type": "CASH_DEPOSIT", "flags": ["structuring", "sub-threshold"], "amount": 8900.0, "currency": "USD", "location": "Los Angeles, USA", "customer_id": "C-4490-0109", "description": "Cash Deposit", "counterparty": "Branch - Hollywood", "transaction_id": "TX-1091"}, {"date": "2025-11-20", "type": "ACH_CREDIT", "flags": [], "amount": 20000.0, "currency": "USD", "location": "USA", "customer_id": "C-4490-0109", "description": "Payroll Deposit", "counterparty": "Hall Development Corp", "transaction_id": "TX-1085"}, {"date": "2025-11-10", "type": "ACH_CREDIT", "flags": [], "amount": 15000.0, "currency": "USD", "location": "USA", "customer_id": "C-4490-0109", "description": "Property Management Fees", "counterparty": "Pacific Properties LLC", "transaction_id": "TX-1080"}]}', 'Found 7 transactions totaling $-41,800.00. 5 transactions have risk flags. Transaction types: CASH_DEPOSIT, WIRE_TRANSFER.', '["Total Transactions: 7", "Total Volume: $-41,800.00", "Flagged Transactions: 5", "Avg Transaction: $-5,971.43"]', 'completed'),
	(64, '380a8362-d39b-44cd-978b-c73ce6075be5', 4, 'Baseline Calculation', '2026-05-10 02:53:22.65298+00', 'calculate_baseline', '{"customer_id": "C-4490-0109", "period_days": 90}', '{"deviations": {"size_deviation_pct": 269.4, "volume_deviation_pct": 2670.3, "frequency_deviation_pct": 150.0}, "customer_id": "C-4490-0109", "deviation_score": 100.0, "baseline_metrics": {"wire_ratio": 0.0, "avg_monthly_volume": 11666.67, "cash_deposit_ratio": 0.0, "avg_transaction_size": 17500.0, "transaction_frequency": 2}, "alert_period_metrics": {"monthly_volume": 323200.0, "avg_transaction_size": 64640.0, "transaction_frequency": 5}, "analysis_period_days": 90, "is_significant_deviation": true}', 'Baseline monthly volume: $11,666.67. Alert period volume: $323,200.00. Deviation: +2670.3%. Significant deviation: YES.', '["Baseline Volume: $11,666.67/month", "Alert Period Volume: $323,200.00/month", "Deviation: +2670.3%", "Significant: YES"]', 'completed'),
	(65, '380a8362-d39b-44cd-978b-c73ce6075be5', 5, 'Income Verification', '2026-05-10 02:53:22.665895+00', 'verify_income', '{"customer_id": "C-4490-0109"}', '{"red_flags": ["Volume exceeds stated income by >100%"], "customer_id": "C-4490-0109", "income_source": "Business Revenue", "is_consistent": false, "discrepancy_pct": 669.9, "verification_status": "INCONSISTENT", "stated_annual_income": 250000.0, "documentation_provided": "Bank Statements", "observed_annual_volume": 1924766.67}', 'Stated annual income: $250,000.00. Observed annual volume: $1,924,766.67. Discrepancy: 669.9%. Verification status: INCONSISTENT.', '["Stated Income: $250,000.00", "Observed Volume: $1,924,766.67", "Discrepancy: 669.9%", "Status: INCONSISTENT"]', 'completed'),
	(66, '380a8362-d39b-44cd-978b-c73ce6075be5', 6, 'Keyword Search', '2026-05-10 02:53:22.67612+00', 'search_keywords', '{"keywords": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "customer_id": "C-4490-0109"}', '{"matches": [{"date": "2025-12-04", "amount": 9800.0, "context": "Description", "description": "Cash Deposit", "transaction_id": "TX-1094", "keyword_matched": "cash"}, {"date": "2025-12-03", "amount": 95000.0, "context": "Notes", "description": "Wire Transfer - Domestic", "transaction_id": "TX-1093", "keyword_matched": "shell"}, {"date": "2025-12-02", "amount": 9500.0, "context": "Description", "description": "Cash Deposit", "transaction_id": "TX-1092", "keyword_matched": "cash"}, {"date": "2025-12-01", "amount": 8900.0, "context": "Description", "description": "Cash Deposit", "transaction_id": "TX-1091", "keyword_matched": "cash"}], "customer_id": "C-4490-0109", "total_matches": 4, "requires_review": true, "keywords_searched": ["loan", "gift", "cash", "consulting", "services", "shell", "offshore", "nominee"], "high_risk_keywords_found": ["cash", "shell"]}', 'Searched for 8 suspicious keywords. Found 4 matches. High-risk keywords: cash, shell.', '["Keywords Searched: 8", "Matches Found: 4", "High-Risk Keywords: cash, shell"]', 'completed'),
	(67, '380a8362-d39b-44cd-978b-c73ce6075be5', 7, 'Network Analysis', '2026-05-10 02:53:22.687542+00', 'analyze_network', '{"depth": 2, "customer_id": "C-4490-0109"}', '{"connections": [{"entity_id": "ALERT-0109:n1", "risk_score": 75.0, "entity_name": "Nexus Realty LLC", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0109:n2", "risk_score": 75.0, "entity_name": "Pacific Shell Corp", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0109:n3", "risk_score": 50.0, "entity_name": "Deutsche Bank Frankfurt", "total_volume": 1.0, "relationship_type": "WIRE_PARTNER", "transaction_count": 1}, {"entity_id": "ALERT-0109:n4", "risk_score": 20.0, "entity_name": "Branch Hollywood", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}, {"entity_id": "ALERT-0109:n5", "risk_score": 20.0, "entity_name": "Hall Development Corp", "total_volume": 1.0, "relationship_type": "FREQUENT_COUNTERPARTY", "transaction_count": 1}], "customer_id": "C-4490-0109", "analysis_depth": 2, "circular_flows": [], "layering_detected": false, "total_connections": 5, "network_risk_score": 48.0, "high_risk_connections": 2, "shared_infrastructure": false}', 'Network analysis found 5 connected entities. High-risk connections: 2. Circular flows detected: 0. Layering detected: NO.', '["Total Connections: 5", "High-Risk Connections: 2", "Circular Flows: 0", "Layering: NO"]', 'completed'),
	(68, '380a8362-d39b-44cd-978b-c73ce6075be5', 8, 'Sanctions Screening', '2026-05-10 02:53:22.694687+00', 'check_sanctions', '{"entity_name": "Neal Hall", "entity_type": "BUSINESS"}', '{"matches": [{"list": "WORLD_CHECK_PEP", "program": "PEP", "added_date": null, "match_name": "Neal Hall", "match_type": "POTENTIAL", "entity_type": "CUSTOMER", "match_score": 72, "requires_review": true}], "total_hits": 1, "entity_name": "Neal Hall", "entity_type": "BUSINESS", "lists_checked": ["OFAC_SDN", "UN_CONSOLIDATED", "EU_SANCTIONS", "UK_HMT"], "screening_date": "2026-05-10 02:53:22"}', 'Screened Neal Hall against 4 sanctions lists. Total hits: 1. POTENTIAL MATCH FOUND - requires review.', '["Lists Checked: 4", "Total Hits: 1", "Status: ⚠️ MATCH FOUND"]', 'completed'),
	(69, '380a8362-d39b-44cd-978b-c73ce6075be5', 9, 'Risk Score Calculation', '2026-05-10 02:53:22.694838+00', 'calculate_risk_score', '{"factors": {"pep_status": 0.25, "sanctions_hit": 0.4, "kyc_needs_refresh": 0.1, "high_risk_customer": 0.2, "income_inconsistent": 0.25, "suspicious_keywords": 0.15, "multiple_rules_fired": 0.3, "extreme_volume_deviation": 0.3}}', '{"confidence": 90.0, "risk_level": "CRITICAL", "risk_score": 195.0, "requires_edd": true, "requires_sar": true, "calculated_at": "2026-05-10 02:53:22", "recommendation": "ESCALATE", "factor_breakdown": [{"factor": "sanctions_hit", "weight": 0.4, "contribution": 40.0}, {"factor": "multiple_rules_fired", "weight": 0.3, "contribution": 30.0}, {"factor": "extreme_volume_deviation", "weight": 0.3, "contribution": 30.0}, {"factor": "pep_status", "weight": 0.25, "contribution": 25.0}, {"factor": "income_inconsistent", "weight": 0.25, "contribution": 25.0}, {"factor": "high_risk_customer", "weight": 0.2, "contribution": 20.0}, {"factor": "suspicious_keywords", "weight": 0.15, "contribution": 15.0}, {"factor": "kyc_needs_refresh", "weight": 0.1, "contribution": 10.0}], "factors_analyzed": 8}', 'Risk score: 195.0/100 (CRITICAL). Analyzed 8 risk factors. Recommendation: ESCALATE (confidence: 90.0%). Requires SAR: YES.', '["Risk Score: 195.0/100", "Risk Level: CRITICAL", "Recommendation: ESCALATE", "Confidence: 90.0%", "Requires SAR: YES"]', 'completed'),
	(70, '380a8362-d39b-44cd-978b-c73ce6075be5', 10, 'Narrative Generation', '2026-05-10 02:53:22.69493+00', 'generate_narrative', '{"investigation_state": "complete"}', '{"narrative": "\nINVESTIGATION NARRATIVE - ALERT-0109\n\nALERT SUMMARY:\nAlert ALERT-0109 was triggered on 2025-12-12 for Neal Hall \n(C-4490-0109). The alert was classified as CRITICAL risk with an alert \nscore of 89.\n\n..."}', 'Investigation narrative generated. Recommendation: ESCALATE. Total investigation steps completed: 9.', '["Steps Completed: 9", "Final Recommendation: ESCALATE", "Narrative Length: 1492 characters"]', 'completed');


ALTER TABLE public.investigation_journal ENABLE TRIGGER ALL;

--
-- Data for Name: investigation_risk_factors; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.investigation_risk_factors DISABLE TRIGGER ALL;

INSERT INTO public.investigation_risk_factors (id, investigation_id, factor, weight) VALUES
	(1, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 'multiple_rules_fired', 0.299999999999999988897769753748434595763683319091796875),
	(2, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 'kyc_needs_refresh', 0.1000000000000000055511151231257827021181583404541015625),
	(3, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 'pep_status', 0.25),
	(4, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 'high_risk_customer', 0.200000000000000011102230246251565404236316680908203125),
	(5, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 'extreme_volume_deviation', 0.299999999999999988897769753748434595763683319091796875),
	(6, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 'income_inconsistent', 0.25),
	(7, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 'suspicious_keywords', 0.1499999999999999944488848768742172978818416595458984375),
	(8, '9cfbd161-42fd-48ef-9bda-63cba4c9ab12', 'sanctions_hit', 0.40000000000000002220446049250313080847263336181640625),
	(9, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 'multiple_rules_fired', 0.299999999999999988897769753748434595763683319091796875),
	(10, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 'kyc_needs_refresh', 0.1000000000000000055511151231257827021181583404541015625),
	(11, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 'extreme_volume_deviation', 0.299999999999999988897769753748434595763683319091796875),
	(12, 'f0280a74-3167-4e7f-b78b-3a5138b4c2b0', 'income_inconsistent', 0.25),
	(13, 'f47ec1a5-4404-4116-aa16-16169fd718ff', 'multiple_rules_fired', 0.299999999999999988897769753748434595763683319091796875),
	(14, 'f47ec1a5-4404-4116-aa16-16169fd718ff', 'extreme_volume_deviation', 0.299999999999999988897769753748434595763683319091796875),
	(15, 'f47ec1a5-4404-4116-aa16-16169fd718ff', 'income_inconsistent', 0.25),
	(16, '23707230-302d-4c61-8f9e-a88acf97823a', 'multiple_rules_fired', 0.299999999999999988897769753748434595763683319091796875),
	(17, '23707230-302d-4c61-8f9e-a88acf97823a', 'income_inconsistent', 0.25),
	(18, '23707230-302d-4c61-8f9e-a88acf97823a', 'suspicious_keywords', 0.1499999999999999944488848768742172978818416595458984375),
	(19, '23707230-302d-4c61-8f9e-a88acf97823a', 'sanctions_hit', 0.40000000000000002220446049250313080847263336181640625),
	(20, '3dba89a1-d641-4289-9bbe-e8ad7a14d326', 'multiple_rules_fired', 0.200000000000000011102230246251565404236316680908203125),
	(21, '3dba89a1-d641-4289-9bbe-e8ad7a14d326', 'income_inconsistent', 0.25),
	(22, 'cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 'multiple_rules_fired', 0.299999999999999988897769753748434595763683319091796875),
	(23, 'cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 'extreme_volume_deviation', 0.299999999999999988897769753748434595763683319091796875),
	(24, 'cc1137b5-ad08-41f8-a9c4-edd92dadc61c', 'income_inconsistent', 0.25),
	(25, '380a8362-d39b-44cd-978b-c73ce6075be5', 'multiple_rules_fired', 0.299999999999999988897769753748434595763683319091796875),
	(26, '380a8362-d39b-44cd-978b-c73ce6075be5', 'kyc_needs_refresh', 0.1000000000000000055511151231257827021181583404541015625),
	(27, '380a8362-d39b-44cd-978b-c73ce6075be5', 'pep_status', 0.25),
	(28, '380a8362-d39b-44cd-978b-c73ce6075be5', 'high_risk_customer', 0.200000000000000011102230246251565404236316680908203125),
	(29, '380a8362-d39b-44cd-978b-c73ce6075be5', 'extreme_volume_deviation', 0.299999999999999988897769753748434595763683319091796875),
	(30, '380a8362-d39b-44cd-978b-c73ce6075be5', 'income_inconsistent', 0.25),
	(31, '380a8362-d39b-44cd-978b-c73ce6075be5', 'suspicious_keywords', 0.1499999999999999944488848768742172978818416595458984375),
	(32, '380a8362-d39b-44cd-978b-c73ce6075be5', 'sanctions_hit', 0.40000000000000002220446049250313080847263336181640625);


ALTER TABLE public.investigation_risk_factors ENABLE TRIGGER ALL;

--
-- Data for Name: journal_steps; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.journal_steps DISABLE TRIGGER ALL;

INSERT INTO public.journal_steps (id, alert_id, n, step_type, title, tool, status, summary, details) VALUES
	(1, 'ALERT-0100', 1, 'ALERT', 'Alert Details Retrieval', 'get_alert_details', 'complete', 'Retrieved alert metaData for ALERT-0100 triggered Dec 1, 2025.', 'Tool call: get_alert_details(alert_id=''ALERT-0100'')

Result:
· Alert ID: ALERT-0100
· Customer: Jeremiah Garcia (C-8518-0100)
· Date triggered: 2025-12-01
· Rules fired: RapidCashDeposits, StructuredDeposits, VelocityIncrease, RoundAmounts
· Flagged transactions: TX-9851 ($3,600), TX-9853 ($3,500), TX-9857 ($9,700)
· Total flagged inflow: $16,800 across 3 branches on 2025-11-29
· Alert window: 2025-10-30 to 2025-11-29 (30 days)'),
	(2, 'ALERT-0100', 2, 'STEP', 'Customer Profile & KYC Review', 'get_customer_details', 'complete', 'Customer profile retrieved. Stated income $42K/yr. Risk score 28 (LOW). 1 prior alert dismissed.', 'Tool call: get_customer_details(customer_id=''C-8518-0100'')

Result:
· Name: Jeremiah Garcia | DOB: 1990-07-09 | SSN last 4: 4821
· Occupation: Owner, Neighborhood Convenience Store (LLC)
· Account type: Small Business Checking / Personal Linked
· Account opened: 2022-03-15 (2.7 years)
· Stated annual income: $42,000
· Customer risk score: 28 (LOW) · auto-calculated
· Prior alert AL-0042 (2024): Cleared with receipts · favorable history
· KYC status: Full KYC on file, last refreshed 2024-11-01
· Beneficial ownership: Jeremiah Garcia (100% sole proprietor)'),
	(3, 'ALERT-0100', 3, 'STEP', 'Flagged Transaction Retrieval', 'search_transactions', 'complete', '3 flagged cash deposits retrieved. All on same day (2025-11-29) across 3 different branches.', 'Tool call: search_transactions(alert_id=''ALERT-0100'', flagged=true, limit=50)

Flagged transactions returned:
1. TX-9851 | 2025-11-29 09:12 | Cash Deposit | Branch - Del Paso Heights | $3,600 | Flagged: ?
2. TX-9853 | 2025-11-29 13:45 | Cash Deposit | Branch - Midtown Sacramento | $3,500 | Flagged: ?
3. TX-9857 | 2025-11-29 16:36 | Cash Deposit | Branch - Oak Park | $9,700 | Flagged: ?

Observations:
· All three deposits on 2025-11-29 within 7.5-hour window
· Three different branches used (geographic dispersion)
· Individual amounts: $3,600, $3,500, $9,700 · all below $10,000 CTR threshold
· Combined total: $16,800
· Pattern: consistent with structuring typology'),
	(4, 'ALERT-0100', 4, 'STEP', 'Baseline Transaction Summary', 'get_baseline_summary', 'complete', '90-day baseline established. Average monthly inflow: $5,210 (~$62.5K annualized). Baseline consistent with stated income.', 'Tool call: get_baseline_summary(customer_id=''C-8518-0100'', lookback_days=90, exclude_flagged=True, exclude_alert_window_days=7)

Baseline results:
· Total baseline inflow (90 days): $44,700 across 87 transactions
· Average transaction size: $514
· Largest single baseline inflow: $4,200 (Stripe merchant settlement)
· Typical cash deposit: None in baseline · cash deposits are anomalous
· Average monthly inflow: ~$5,210 (~$62,520 annualized)
· Annualized income ratio vs stated $42K: 1.49x · within acceptable range for cash business

Conclusion: Baseline is consistent with stated occupation and income.'),
	(5, 'ALERT-0100', 5, 'STEP', 'Income Verification Calculation', 'calculate', 'complete', 'Flagged sum $16,800 + baseline $44,700 = $61,500 observed. Annualized: $246,000. Ratio vs stated income: 5.86x · elevated but partially explained by business cash cycle.', 'Tool call: calculate(operation=''income_verification'', alert_id=''ALERT-0100'')

Calculation:
· Baseline inflow (90-day): $44,700
· Flagged inflow (alert window): $16,800
· Combined observed inflow: $61,500
· Annualized: $61,500 · (365/90) = $249,583
· Stated annual income: $42,000
· Ratio: $249,583 / $42,000 = 5.94x

Note: For cash-intensive retail businesses, the ratio between gross revenue and owner income commonly ranges 4·8x depending on margin. A convenience store with $42K owner income could plausibly generate $200K·$350K in gross sales. This ratio does not independently confirm suspicious activity.'),
	(6, 'ALERT-0100', 6, 'STEP', 'High-Risk Keyword Search', 'search_keyword_transactions', 'complete', 'Searched for 22 high-risk keywords. Identified ''green light'' in 3 P2P transfer descriptions. Investigated in context · found to be consistent with youth sports tournament reimbursements.', 'Tool call: search_keyword_transactions(customer_id=''C-8518-0100'', keywords=[''green light'',''fronting'',''owe'',''dark'',''clean'',''wash'',''layering'',...], window_days=7, representative_windows=[''2025-07-19'',''2025-12-12''])

Keyword hits:
· ''green light'' · found in TXN-BASE-000999 (2025-07-19), TXN-BASE-001002, TXN-0111-F002 (2025-12-12), TXN-0111-F006, TXN-0111-F007

Context investigation for ''green light'':
· TXN-BASE-000999 description: ''reimb hotel green light tournament Sacramento''
· TXN-BASE-001002 description: ''youth soccer green light split fee''
· TXN-0111-F002: ''tourney reimb green light finals''

Conclusion: ''Green light'' is a youth soccer tournament name based in Sacramento. Descriptions consistently reference hotel splits, tournament fees, and reimbursements. P2P counterparties form a stable group of 4·5 individuals transacting back and forth · consistent with carpooling/travel cost sharing.'),
	(7, 'ALERT-0100', 7, 'STEP', 'Representative Window Analysis (1·3 Day)', 'analyze_window', 'complete', 'Two representative windows analyzed (earliest and most recent flagged period). Both show payroll inflows, lodging/merchant charges, and reciprocal P2P · consistent with business owner supporting youth sports travel.', 'Tool call: analyze_window(customer_id=''C-8518-0100'', window_1=''2025-07-18:2025-07-20'', window_2=''2025-12-11:2025-12-13'')

Window 1 (2025-07-18 to 2025-07-20):
· Inflows: Payroll ACH $3,500 | Stripe settlement $1,200
· Outflows: Hampton Inn & Suites -$214.36 | Shell Gas -$67.20 | Lyft -$34.50
· P2P: Venmo from ''Mike R.'' +$107 (hotel split), from ''Sarah K.'' +$53 (gas split)
· Assessment: Normal business owner + travel pattern

Window 2 (2025-12-11 to 2025-12-13):
· Inflows: Payroll ACH $3,500 | P2P ''tourney reimb'' +$87 each from 3 contacts
· Outflows: Safeway -$124 | ATM -$200 | Local Restaurant -$89
· Assessment: Grocery, cash, dining · consistent with personal spending

Conclusion: No atypical or suspicious activity in representative windows beyond Nov 29 structuring-like pattern.'),
	(8, 'ALERT-0100', 8, 'STEP', 'Risk Factor Synthesis & Decision', 'evaluate_risk', 'complete', '4 suspicious indicators vs 8 mitigating factors. Agent recommends CLEAR with 85% confidence. Residual risk: ''green light'' keyword context.', 'Tool call: evaluate_risk(alert_id=''ALERT-0100'', include_factors=true)

Suspicious Indicators:
1. Three same-day cross-branch cash deposits below $10K CTR threshold
2. Combined $16,800 · consistent with structuring typology
3. Velocity 340% above 90-day baseline
4. ''green light'' keyword appears in P2P descriptions (minor ambiguity)

Mitigating Factors:
1. KYC fully current · cash-intensive business owner profile
2. Payroll ACHs consistently fund account ($5,210/month baseline)
3. Baseline inflow ratio aligns with stated income for retail business
4. Prior alert AL-0042 dismissed with receipts · favorable disposition history
5. ''Green light'' confirmed as Sacramento youth soccer tournament
6. P2P counterparty group is stable and reciprocal (reimbursement pattern)
7. Representative window analyses show no contradictory activity
8. No adverse media, sanctions, or PEP flags on customer or counterparties

Final Decision: CLEAR (False Positive)
Confidence: 85%
Rationale: Weight of evidence supports legitimate business activity. Lone residual concern is keyword context · resolved by transaction description review. No substantive suspicious behavior confirmed.'),
	(9, 'ALERT-0100', 9, 'STEP', 'Narrative Generation', 'generate_narrative', 'complete', 'Final investigation narrative generated and attached to alert record.', 'Tool call: generate_narrative(alert_id=''ALERT-0100'', decision=''CLEAR'', include_evidence=true)

Narrative generated successfully. Key narrative elements:
· Opening: Alert trigger and customer context
· Investigation steps summary (8 steps, 9 tool calls)
· Evidence summary: baseline, keyword analysis, window analyses
· Risk factor matrix: 4 suspicious vs 8 mitigating
· Final disposition: CLEAR with 85% confidence
· Residual concern documented: ''green light'' keyword context with explanation

Narrative word count: 847 words
Regulatory format: FinCEN SAR-compliant structure
Status: Attached to ALERT-0100 record'),
	(10, 'ALERT-0108', 1, 'STEP', 'Alert Details Retrieval', 'get_alert_details', 'complete', 'Alert ALERT-0108 triggered Dec 11, 2025 for Ryan Torres. Three rules fired: InternationalWire, HighRiskKeyword, VelocityIncrease. Account dormant 14 months prior to alert window.', 'Tool call: get_alert_details(alert_id=''ALERT-0108'')

Result:
· Alert ID: ALERT-0108
· Customer: Ryan Torres (C-7712-0108)
· Date triggered: 2025-12-11
· Rules fired: InternationalWire, HighRiskKeyword, VelocityIncrease
· Flagged transactions: TX-1081 ($85,000 outbound to Panama), TX-1082 ($120,000 outbound to London), TX-1075 ($210,000 inbound from Global Trade Partners Inc)
· Total flagged volume: $415,000 in and out within 14 days
· Alert window: 2025-11-21 to 2025-12-11 (21 days)
· Critical note: Account C-7712-0108 last Active transaction: October 2024 · 14 months dormancy before this alert window'),
	(11, 'ALERT-0108', 2, 'STEP', 'Customer Profile & KYC Review', 'get_customer_details', 'complete', 'Ryan Torres · Import/Export Consultant, SF. Stated income $95K. Customer risk 68 (MEDIUM). 3 prior alerts. Account dormant 14 months before current activity. KYC stale · 24+ months.', 'Tool call: get_customer_details(customer_id=''C-7712-0108'')

Result:
· Name: Ryan Torres | DOB: 1985-03-22 | SSN last 4: 9132
· Occupation: Import/Export Consultant (self-employed, Torres Import/Export LLC)
· Account type: Business Checking
· Account opened: 2021-07-10 (4.4 years)
· Stated annual income: $95,000
· Customer risk score: 68 (MEDIUM)
· Alert risk score: 81 (HIGH)
· Prior alerts: 3 · none resulted in SAR, each involved cross-border activity
· KYC status: Last refreshed 2023-08-15 · STALE (>24 months). Recommend immediate refresh.
· Business registration: Torres Import/Export LLC · Active CA license
· Beneficial ownership: 100% Ryan Torres
· Last known Active account use: October 14, 2024 (14 months prior to this alert)'),
	(12, 'ALERT-0108', 3, 'STEP', 'Flagged Transaction Retrieval & Dormancy Analysis', 'search_transactions', 'complete', '3 flagged transactions: $210K inbound from undocumented entity, $85K to Panama, $120K to London. $205K dispersed offshore within 10 days of inflow. Dormant account reactivation pattern confirmed.', 'Tool call: search_transactions(alert_id=''ALERT-0108'', flagged=true, limit=50)

Flagged transactions returned:
1. TX-1075 | 2025-11-28 14:00 | ACH Credit | Global Trade Partners Inc | +$210,000 | Flagged: ?
   · Entity with no prior relationship. Described as ''trade invoice'' · no docs on file.
   · This credit reactivated a 14-month dormant account to $210,000 balance immediately.
2. TX-1081 | 2025-12-05 11:00 | Wire Transfer | HSBC Panama Branch | -$85,000 | Flagged: ?
   · Panama is FATF grey-listed jurisdiction. 7 days after $210K inflow.
   · Receiving account at HSBC Panama opened 6 months ago · no prior relationship.
3. TX-1082 | 2025-12-08 09:30 | Wire Transfer | Barclays London Correspondent | -$120,000 | Flagged: ?
   · 3 days after Panama wire. Account effectively drained: $210K in  $205K out in 10 days.

Dormancy pattern:
· Oct 2024: Last transaction (account goes dormant)
· Nov 28, 2025: Large unexplained inflow from new counterparty
· Dec 5·8, 2025: Rapid dispersal to two offshore jurisdictions
· Residual balance: ~$5,000'),
	(13, 'ALERT-0108', 4, 'STEP', 'Baseline Transaction Summary', 'get_baseline_summary', 'complete', 'Pre-dormancy baseline: avg $47K/month consulting income. Alert window is 4.5x baseline monthly average. Dormancy breaks baseline continuity · reactivation pattern is key finding.', 'Tool call: get_baseline_summary(customer_id=''C-7712-0108'', lookback_days=90, reference_period=''pre_dormancy'')

Pre-dormancy baseline (Oct 2023·Oct 2024 Active period):
· Average monthly inflow: $47,000 (consulting retainers, trade invoices)
· International wires in prior 12 months: 2 (both under $25K, partially documented)
· Typical domestic wire outflow: $15K·$30K/month (business expenses)

Alert window comparison:
· Alert inflow: $210,000 (single transaction) vs $47K avg monthly = 4.5x spike
· International wire count: 0 in 12 months pre-dormancy  2 large wires in 10 days

Key finding: Account dormant 14 months then reactivated with immediate large credit from unknown entity, rapidly dispersed to offshore · classic ''warm-up'' account typology.'),
	(14, 'ALERT-0108', 5, 'STEP', 'Income Verification & Trade Documentation Check', 'calculate', 'complete', '$210K ''trade invoice'' = 2.2x stated annual income in one payment. No trade documentation on file. Income ratio annualized: 38.4x. Global Trade Partners Inc: registered Jan 2025 (10 months old), no web presence, registered agent address only.', 'Tool call: calculate(operation=''income_verification'', alert_id=''ALERT-0108'')
also: check_documentation(customer_id=''C-7712-0108'', transaction_id=''TX-1075'')

Income verification:
· Total alert window inflow: $210,000
· Annualized: $210,000 · (365/21) = $3,650,000
· Stated annual income: $95,000
· Income ratio: 38.4x · HIGHLY ANOMALOUS

Documentation check for TX-1075:
· Trade contract: NOT ON FILE
· Commercial invoice: NOT ON FILE
· Shipping/freight documentation: NOT ON FILE
· Letter of credit: NOT ON FILE
· Source of funds declaration: NOT ON FILE

Global Trade Partners Inc entity check:
· Delaware LLC registration: January 2025 (10 months old)
· No public web presence found
· Address: Registered agent office only · no physical address
· No prior banking relationship with institution
· No employees found on LinkedIn or public directories'),
	(15, 'ALERT-0108', 6, 'STEP', 'High-Risk Keyword Search & Jurisdiction Analysis', 'search_keyword_transactions', 'complete', '''Trade invoice'' in undocumented context. ''Correspondent'' flagged in wire routing. Jurisdictions confirmed: Panama (FATF grey list), London (correspondent to unidentified end-beneficiary). Recipient entities · HSBC Panama and Barclays London · both tied to anonymous offshore accounts.', 'Tool call: search_keyword_transactions(customer_id=''C-7712-0108'', keywords=[''trade'',''invoice'',''offshore'',''correspondent'',''layering'',''clean'',''wash'',...], window_days=21)

Keyword hits:
· ''trade invoice'' · TX-1075: ''ACH Credit - Trade Invoice'' · no supporting docs, new entity
· ''correspondent'' · TX-1082 routing note: ''Barclays London Correspondent'' · flag

Jurisdiction analysis:
· Panama (TX-1081): FATF grey list · heightened monitoring required
· London (TX-1082): Correspondent routing to EuroTrade Holdings Ltd (BVI incorporation)

Counterparty research:
· HSBC Panama recipient: Opened 2025-06-01 (6 months). Only 3 prior transactions.
· Barclays London: EuroTrade Holdings Ltd · BVI incorporation, no public business presence

Conclusion: No benign explanation found for transaction sequence.'),
	(16, 'ALERT-0108', 7, 'STEP', 'Counterparty Network & Cross-Institution Query', 'analyze_network', 'complete', 'Network: Global Trade Partners Inc sent similar large ACH credits to 2 other bank accounts (per FinCEN 314(b)). HSBC Panama recipient linked to Active FinCEN 314(b) inquiry. EuroTrade Holdings (BVI) · nominee entity pattern.', 'Tool call: analyze_network(customer_id=''C-7712-0108'', depth=2, include_cross_institution=True)

Network findings:
· Global Trade Partners Inc (TX-1075 originator):
  · Also sent large ACH credits to 2 other regional bank accounts (FinCEN 314(b) sharing)
  · Those accounts made international wires within 2 weeks · identical pattern

· HSBC Panama recipient account:
  · Subject of FinCEN 314(b) information request filed Nov 2025
  · 3 inbound wires from US accounts totaling $340K in 60 days
  · No outbound transactions · funds accumulating

· Barclays London (EuroTrade Holdings Ltd):
  · BVI incorporation, no beneficial ownership on record
  · Pattern matches nominee entity structure

Overall: Dormant account reactivation  undocumented large inflow  rapid offshore dispersal  recipients with suspicious flags = textbook layering operation.'),
	(17, 'ALERT-0108', 8, 'STEP', 'Risk Factor Synthesis & Decision', 'evaluate_risk', 'complete', '7 suspicious indicators vs 1 mitigating factor. Agent recommends ESCALATE with 72% confidence. Confidence slightly reduced · 314(b) Data preliminary, customer not yet contacted for documentation.', 'Tool call: evaluate_risk(alert_id=''ALERT-0108'', include_factors=true)

Suspicious Indicators:
1. Dormant account reactivation (14 months) by large undocumented credit · classic warm-up typology
2. $210K inbound from newly registered entity (10 months old) with no trade documentation
3. $205K rapidly dispersed to two offshore jurisdictions within 10 days
4. HSBC Panama recipient under Active FinCEN 314(b) inquiry
5. London recipient is nominee entity with BVI incorporation
6. Income ratio 38.4x stated annual income in single transaction
7. KYC stale >24 months · EDD overdue

Mitigating Factors:
1. 4+ year banking relationship with no prior SAR filed

Final Decision: ESCALATE
Confidence: 72%
Rationale: Dormancy pattern, undocumented source, offshore dispersal, linked suspicious recipients · all support escalation. SAR filing deadline: Jan 10, 2026.'),
	(18, 'ALERT-0108', 9, 'STEP', 'Narrative Generation & Case Referral', 'generate_narrative', 'complete', 'Escalation narrative generated. Case CASE-2025-001 created. Assigned to Sarah Chen. SAR-2025-002 initiated in draft.', 'Tool call: generate_narrative(alert_id=''ALERT-0108'', decision=''ESCALATE'', include_evidence=true)
also: create_case_referral(alert_id=''ALERT-0108'', priority=''HIGH'', assignee=''sarah_chen'')

Narrative: 912 words
· SAR filing recommendation: YES · if documentation not provided within 5 business days
· Regulatory basis: 31 USC 5318(g)

Case created: CASE-2025-001 · Assigned to Sarah Chen · Priority: HIGH · Due: 2025-12-18
Required actions: (1) Contact customer for trade documentation (2) Submit 314(b) query (3) Prepare SAR draft
SAR-2025-002 initiated in draft status.'),
	(19, 'ALERT-0109', 1, 'STEP', 'Alert Details Retrieval', 'get_alert_details', 'complete', 'Alert ALERT-0109 triggered Dec 12, 2025 for Neal Hall. Three rules fired: HighRiskKeyword, VelocityIncrease, StructuredDeposits. 9 flagged transactions across 4 consecutive days. 5 prior alerts on record.', 'Tool call: get_alert_details(alert_id=''ALERT-0109'')

Result:
· Alert ID: ALERT-0109
· Customer: Neal Hall (C-4490-0109)
· Date triggered: 2025-12-12
· Rules fired: HighRiskKeyword, VelocityIncrease, StructuredDeposits
· Flagged transactions: TX-1091 through TX-1095 (9 deposits + wire transfers)
· Total flagged volume: $1,250,000 inflow / $980,000 outflow
· Alert window: 2025-11-12 to 2025-12-12 (30 days)
· Prior alerts: 5 (most recent: 2024-08-20 · referred to compliance)
· Prior SARs by other institutions: 2 (per FinCEN 314(a) response)'),
	(20, 'ALERT-0109', 2, 'STEP', 'Customer Profile & KYC Review', 'get_customer_details', 'complete', 'Neal Hall · Real Estate Developer. Customer risk 71 (HIGH). Enhanced monitoring. 5 prior alerts. PEP: held appointed LA County position 2019·2022. Linked to 3 entities including Nexus Realty (CA DRE suspended) and Pacific Shell Corp (Panama Papers).', 'Tool call: get_customer_details(customer_id=''C-4490-0109'')

Result:
· Name: Neal Hall | DOB: 1978-11-05 | SSN last 4: 3374
· Occupation: Real Estate Developer
· Entity structure: Hall Development Corp + Nexus Realty LLC + Pacific Shell Corp (BVI)
· Account opened: 2019-04-28 | Stated income: $250,000
· Customer risk score: 71 (HIGH) | Alert risk score: 89 (CRITICAL)
· PEP status: POTENTIAL · LA County Infrastructure Commission (2019·2022)
· Enhanced monitoring: Active since 2024-09-15
· Prior alerts: 5 | Prior SARs (other institutions): 2
· Linked entities: Nexus Realty LLC (CA DRE suspended 2024), Pacific Shell Corp (Panama Papers, BVI)'),
	(21, 'ALERT-0109', 3, 'STEP', 'Flagged Transaction Retrieval & Structuring Analysis', 'search_transactions', 'complete', '9 flagged transactions: 8 cash deposits $8,700·$9,800 across 5 branches (all below $10K CTR threshold), 1 $95K wire to suspended shell entity, 1 $200K international wire to Germany. Structuring fully confirmed.', 'Tool call: search_transactions(alert_id=''ALERT-0109'', flagged=true, limit=50)

Flagged transactions:
1. TX-1091 | Dec 1 | Cash Deposit | Branch Hollywood | +$8,900
2. TX-1092 | Dec 2 | Cash Deposit | Branch Burbank | +$9,500
3. TX-1093 | Dec 3 | Wire Transfer | Nexus Realty LLC | +$95,000 (to suspended entity)
4. TX-1094 | Dec 4 | Cash Deposit | Branch Downtown LA | +$9,800
5. TX-1095 | Dec 5 | Intl Wire | Deutsche Bank Frankfurt | -$200,000
6·9: Additional cash deposits Nov 25·30 ($8,700, $9,200, $9,100, $9,500) across 4 more branches

Structuring analysis:
· 8 deposits averaging $9,212 · systematically below $10,000 CTR threshold
· 5 branch locations · deliberate geographic dispersion
· Combined structured deposits: $87,200
· CTRs that should have been filed if aggregated: 8
· Wire to Nexus Realty LLC during license suspension: no legitimate purpose
· Frankfurt wire: no documented real estate transaction in Germany'),
	(22, 'ALERT-0109', 4, 'STEP', 'Baseline Transaction Summary', 'get_baseline_summary', 'complete', '90-day baseline: avg $85K/month from property management and development income. Alert window $1.25M is 14.7x monthly baseline. Zero cash deposits in 90-day baseline · cash deposits are entirely new behavior for this customer.', 'Tool call: get_baseline_summary(customer_id=''C-4490-0109'', lookback_days=90, exclude_flagged=True)

Baseline results:
· Total baseline inflow (90 days): $255,000 across 14 transactions
· Average monthly inflow: $85,000
· Transaction types: Property management fees (ACH), development income
· Cash deposits in 90-day baseline: ZERO
· Average wire: $45,000 (documented real estate closings)

Alert window: $1,250,000 vs $85K baseline = 14.7x spike
Cash activity: None in baseline  $87,200 structured cash = entirely new behavior'),
	(31, 'ALERT-0110', 4, 'STEP', 'Baseline Transaction Summary', 'get_baseline_summary', 'complete', '90-day baseline: avg $22K/month from investment distributions and referral fees. Alert window $210K is 9.5x monthly baseline. Zero prior international wire history in account lifetime.', 'Tool call: get_baseline_summary(customer_id=''C-3381-0110'', lookback_days=90, exclude_flagged=True)

Baseline: $67,000 total / $22,300 monthly avg · investment distributions, referral fees
International wire history: ZERO · no prior international transfers ever

Alert window: $210,000 vs $22K = 9.5x spike
· International wires: 0 in history  2 large offshore wires in 4 days
Key finding: First international wire activity ever, to two high-risk jurisdictions, funded by undocumented source · significant behavioral departure.'),
	(23, 'ALERT-0109', 5, 'STEP', 'Income Verification & Shell Entity Analysis', 'calculate', 'complete', '$1.25M alert inflow = 5x stated annual income in 30 days (60x annualized). Nexus Realty LLC: license suspended, FinCEN enforcement $250K penalty. Pacific Shell Corp: Panama Papers. Frankfurt wire: no Germany real estate on record.', 'Tool call: calculate(operation=''income_verification'', alert_id=''ALERT-0109'')
also: analyze_entity(entities=[''Nexus Realty LLC'',''Pacific Shell Corp''])

Income verification:
· Alert window inflow: $1,250,000  annualized: $15,000,000
· Stated annual income: $250,000
· Income ratio: 60x · extremely anomalous

Nexus Realty LLC:
· CA DRE license: SUSPENDED 2024-09-01 (commingling of funds, undisclosed agency)
· FinCEN civil penalty: $250,000 (failure to maintain AML program, failure to file CTRs)
· Wire to Nexus during suspension: no legitimate real estate purpose

Pacific Shell Corp:
· Jurisdiction: British Virgin Islands
· Panama Papers (ICIJ): Nominee holding vehicle, 2011 incorporation
· LA Times (Oct 2024): Named in real estate money laundering probe'),
	(24, 'ALERT-0109', 6, 'STEP', 'High-Risk Keyword Search', 'search_keyword_transactions', 'complete', '''Cash'' in 8 deposits (anomalous for real estate developer). ''Nexus'' = known enforcement subject. ''Frankfurt'' = undocumented international. No benign context found for any keyword hit.', 'Tool call: search_keyword_transactions(customer_id=''C-4490-0109'', keywords=[''cash'',''offshore'',''nominee'',''shell'',''nexus'',''layering'',...], window_days=30)

Keyword hits:
· ''cash'' · 8 cash deposit descriptions. Context: anomalous for real estate developer profile.
· ''nexus'' · TX-1093 counterparty: Nexus Realty LLC. Context: enforcement subject, license suspended.
· ''frankfurt'' · TX-1095 wire destination. Context: no Germany business relationship documented.

All keyword hits tied to confirmed suspicious transactions. Zero benign contexts identified.'),
	(25, 'ALERT-0109', 7, 'STEP', 'Network & Circular Movement Analysis', 'analyze_network', 'complete', 'Circular movement confirmed: Hall  Nexus Realty ($95K)  Pacific Shell Corp ($40K)  Ryan Torres ($35K)  Hall ($30K). ML confidence 87%. $200K international placement to Frankfurt also detected. Linked to ALERT-0108.', 'Tool call: analyze_network(customer_id=''C-4490-0109'', depth=2, include_cross_institution=True)

Circular movement (Network Cluster Detector v0.9, confidence 87%):
· Neal Hall  Nexus Realty LLC: $95,000
· Nexus Realty LLC  Pacific Shell Corp: $40,000 (cross-institution)
· Pacific Shell Corp  Ryan Torres: $35,000 (cross-institution)
· Ryan Torres  Neal Hall: $30,000 (partial return)

Haircut: $65,000 (30%) absorbed by shell intermediaries
Additional placement: Neal Hall  Deutsche Bank Frankfurt: $200,000

Connection to ALERT-0108: Ryan Torres is network participant · simultaneous alerts indicate coordinated activity. Cross-alert link recommended.'),
	(26, 'ALERT-0109', 8, 'STEP', 'Risk Factor Synthesis & Decision', 'evaluate_risk', 'complete', '7 suspicious indicators, 0 meaningful mitigating factors. ESCALATE · CRITICAL PRIORITY. SAR filing highly likely. Immediate compliance officer notification triggered.', 'Tool call: evaluate_risk(alert_id=''ALERT-0109'', include_factors=true)

Suspicious Indicators:
1. Structuring: 8 cash deposits averaging $9,212 across 5 branches
2. Shell entity wire: $95K to Nexus Realty during license suspension
3. International placement: $200K to Frankfurt, no documented real estate
4. Circular layering confirmed at 87% confidence
5. Income ratio: 60x stated annual income
6. PEP status: Former appointed LA County official
7. Prior SARs at other institutions (FinCEN 314(a))

Mitigating Factors: None identified.

Final Decision: ESCALATE · CRITICAL
Confidence: 80%
SAR filing deadline: Jan 11, 2026. Compliance officer notified immediately.'),
	(27, 'ALERT-0109', 9, 'STEP', 'Narrative Generation & Critical Case Referral', 'generate_narrative', 'complete', 'Critical escalation narrative generated. Case CASE-2025-002 created · assigned to Marcus Williams. Cross-alert link to ALERT-0108 documented. SAR-2025-001 initiated.', 'Tool call: generate_narrative(alert_id=''ALERT-0109'', decision=''ESCALATE'', priority=''CRITICAL'')
also: create_case_referral(alert_id=''ALERT-0109'', priority=''CRITICAL'', assignee=''marcus_williams'')
also: link_alerts(primary=''ALERT-0109'', related=''ALERT-0108'')

Narrative: 1,124 words
Case created: CASE-2025-002 · Marcus Williams · CRITICAL · Due: 2025-12-19
SAR-2025-001 initiated in DRAFT status
Compliance officer Jennifer Kim notified per CRITICAL escalation protocol'),
	(28, 'ALERT-0110', 1, 'STEP', 'Alert Details Retrieval', 'get_alert_details', 'complete', 'Alert ALERT-0110 triggered Dec 12, 2025 for David Hall. Three rules fired: InternationalWire, HighRiskKeyword, CircularMovement. 2 flagged international wires totaling $130K to Cayman Islands and Hong Kong.', 'Tool call: get_alert_details(alert_id=''ALERT-0110'')

Result:
· Alert ID: ALERT-0110
· Customer: David Hall (C-3381-0110)
· Date triggered: 2025-12-12
· Rules fired: InternationalWire, HighRiskKeyword, CircularMovement
· Flagged transactions: TX-1101 ($75,000 to Cayman Islands), TX-1102 ($55,000 to Hong Kong)
· Total flagged volume: $210,000 inflow / $195,000 outflow
· Alert window: 2025-11-12 to 2025-12-12 (30 days)
· Note: First alert for this customer. No prior suspicious activity.'),
	(29, 'ALERT-0110', 2, 'STEP', 'Customer Profile & KYC Review', 'get_customer_details', 'complete', 'David Hall · Financial Consultant, Miami FL. Customer risk 21 (LOW). No prior alerts. Stated income $180K. Account Active since Jan 2023. Adverse media: linked to SEC investigation of Coastal Capital Group (advisor role).', 'Tool call: get_customer_details(customer_id=''C-3381-0110'')

Result:
· Name: David Hall | DOB: 1982-06-18 | SSN last 4: 7721
· Occupation: Financial Consultant (Hall Financial Services LLC)
· Account opened: 2023-01-15 | Stated income: $180,000
· Customer risk score: 21 (LOW) | Alert risk score: 55 (MEDIUM)
· Prior alerts: 0 · first alert in account history
· KYC status: CURRENT (refreshed 2024-12-01)
· Adverse media: SEC investigation · Coastal Capital Group (customer listed as advisor in SEC exhibits)
· Note: No confirmed familial or business connection to Neal Hall (C-4490-0109)'),
	(30, 'ALERT-0110', 3, 'STEP', 'Flagged Transaction Retrieval & International Wire Analysis', 'search_transactions', 'complete', '2 flagged outbound international wires within 4 days: $75K to Cayman Islands, $55K to Hong Kong Private Banking. Source: $135K consulting fee from undocumented, newly incorporated entity. Placement-then-dispersal pattern.', 'Tool call: search_transactions(alert_id=''ALERT-0110'', flagged=true, limit=50)

Flagged transactions:
1. TX-1101 | Dec 3 | Wire | Banco Santander Cayman Islands | -$75,000
   · Offshore jurisdiction, described as ''investment account'', no investment docs on file
2. TX-1102 | Dec 7 | Wire | HSBC Hong Kong Private Banking | -$55,000
   · Private banking · limited beneficial ownership visibility
   · 4 days after Cayman wire · rapid dispersal pattern

Source fund analysis:
· TX-1095 (Nov 25): +$135,000 from Meridian Capital Advisory LLC
· Meridian: Delaware incorporation June 2024 (18 months old), no web presence, no prior relationship
· No consulting contract, statement of work, or invoice on file'),
	(32, 'ALERT-0110', 5, 'STEP', 'Income Verification & Entity Documentation Check', 'calculate', 'complete', '$135K consulting fee = 75% of stated annual income in one payment. No documentation. Meridian Capital Advisory LLC: 18 months old, no public business presence, registered agent address only.', 'Tool call: calculate(operation=''income_verification'', alert_id=''ALERT-0110'')
also: analyze_entity(entities=[''Meridian Capital Advisory LLC''])

Income verification:
· $135K single payment / $15K monthly income = 9x monthly income in one payment
· Annualized alert inflow: 14.0x stated income

Meridian Capital Advisory LLC:
· Delaware incorporation: June 2024 (18 months old)
· No physical address, no website, no employees found
· No prior banking relationship
· No Florida registration (customer based in FL)

Documentation for TX-1095: ALL fields · NOT ON FILE'),
	(33, 'ALERT-0110', 6, 'STEP', 'High-Risk Keyword Search & Adverse Media Review', 'search_keyword_transactions', 'complete', '''Investment account'' unverified in wire descriptions. ''Private banking'' in HK wire flags limited visibility. Adverse media: SEC Wells Notice to Coastal Capital Group · customer listed as advisor. No FBAR filing found for 2024.', 'Tool call: search_keyword_transactions(customer_id=''C-3381-0110'', keywords=[''offshore'',''investment'',''private'',''cayman'',...], window_days=30)
also: search_adverse_media(customer_id=''C-3381-0110'')

Keyword hits:
· ''investment account'' · unverified description in Cayman wire
· ''private banking'' · HK HSBC wire · limits transaction visibility

Adverse media:
· Bloomberg Law (Jul 2024): SEC Wells Notice to Coastal Capital Group · David Hall listed as advisor in exhibits (Relevance: 85%)
· Miami Herald (Mar 2024): Miami firm under investigation · consultants subpoenaed (Relevance: 72%)

FBAR: No 2024 filing found · potential non-disclosure of foreign accounts (IRS referral if SAR filed)'),
	(34, 'ALERT-0110', 7, 'STEP', 'Circular Movement Pattern Check', 'analyze_circular_movement', 'complete', 'Partial circular movement detected (58% ML confidence · insufficient for confirmed classification): Hall  Hall Financial Services LLC ($85K out)  possible return via Meridian credit ($135K in). Full loop not confirmed. International wire pattern alone sufficient for escalation.', 'Tool call: analyze_circular_movement(customer_id=''C-3381-0110'', depth=2, days=60)

Movement analysis:
· Nov 18: David Hall  Hall Financial Services LLC: -$85,000
· Nov 25: Meridian Capital Advisory  David Hall: +$135,000
· Dec 3: David Hall  Banco Santander Cayman: -$75,000
· Dec 7: David Hall  HSBC HK Private Banking: -$55,000

Circular movement ML confidence: 58% · possible but not confirmed
Alternative interpretation: Legitimate financial consultant with offshore investment activity (legal for US persons; FBAR required)
Conclusion: International wire pattern without documentation is sufficient for escalation regardless of circular movement status.'),
	(35, 'ALERT-0110', 8, 'STEP', 'Risk Factor Synthesis & Decision', 'evaluate_risk', 'complete', '5 suspicious indicators vs 3 mitigating factors. ESCALATE with 80% confidence. SAR may or may not be required · depends on documentation review by investigator.', 'Tool call: evaluate_risk(alert_id=''ALERT-0110'', include_factors=true)

Suspicious Indicators:
1. International wire to Cayman Islands · offshore, no documentation
2. International wire to HK Private Banking · high-risk, no documentation
3. Source funds ($135K) undocumented from newly incorporated entity
4. Adverse media: SEC investigation (Coastal Capital Group) · customer is named advisor
5. Possible FBAR non-disclosure

Mitigating Factors:
1. No prior alerts
2. KYC current
3. Occupation (financial consultant) makes some offshore activity plausible

Final Decision: ESCALATE
Confidence: 80%
SAR filing not certain · investigator to determine after documentation review.'),
	(36, 'ALERT-0110', 9, 'STEP', 'Narrative Generation', 'generate_narrative', 'complete', 'Escalation narrative generated. Referred to Jennifer Park. First action: documentation request. If not provided within 5 days, proceed to SAR. FBAR non-disclosure flagged for IRS referral.', 'Tool call: generate_narrative(alert_id=''ALERT-0110'', decision=''ESCALATE'')

Narrative: 786 words
Key recommendation: Request docs for (1) Cayman investment account, (2) HK Private Banking relationship, (3) Meridian Capital consulting engagement
SAR guidance: Proceed if documentation not provided in 5 business days
FBAR referral: Flag to IRS if SAR filed

Alert: ESCALATE · Assigned to Jennifer Park
No case created at this stage · pending investigator documentation review'),
	(37, 'ALERT-0111', 1, 'STEP', 'Alert Details Retrieval', 'get_alert_details', 'complete', 'Alert ALERT-0111 triggered Dec 15, 2025 for Marisol Nguyen-Kelley. Two rules fired: HighRiskKeyword, VelocityIncrease. 9 flagged transactions · P2P transfers and a merchant purchase flagged on keyword ''delta''.', 'Tool call: get_alert_details(alert_id=''ALERT-0111'')

Result:
· Alert ID: ALERT-0111
· Customer: Marisol Nguyen-Kelley (C-5502-0111)
· Date triggered: 2025-12-15
· Rules fired: HighRiskKeyword, VelocityIncrease
· Flagged transactions: TX-1088 (Delta Air Lines -$487), TX-1111 (Venmo +$2,850), TX-1112 (Venmo +$1,900), TX-1113 (Venmo +$1,750) + 5 additional Venmo transfers
· Alert window: 2025-11-05 to 2025-12-15 (40 days)
· Note: First alert for this customer. No prior suspicious activity.'),
	(38, 'ALERT-0111', 2, 'STEP', 'Customer Profile & KYC Review', 'get_customer_details', 'complete', 'Marisol Nguyen-Kelley · Software Engineer, Synapse Technologies Inc, Austin TX. Risk 27 (LOW). No prior alerts. Stated income $135K. Regular bi-weekly payroll confirms salary.', 'Tool call: get_customer_details(customer_id=''C-5502-0111'')

Result:
· Name: Marisol Nguyen-Kelley | DOB: 1993-09-12
· Occupation: Senior Software Engineer · Synapse Technologies Inc (Austin, TX)
· Account opened: 2020-11-02 | Stated income: $135,000
· Customer risk score: 27 (LOW) | Alert risk score: 38 (LOW)
· Prior alerts: 0 | KYC: CURRENT (2025-01-15)
· Payroll verification: Bi-weekly ACH $5,625 from Synapse Technologies ($146,250 annualized · consistent with stated income)'),
	(39, 'ALERT-0111', 3, 'STEP', 'Flagged Transaction Retrieval & Keyword Context', 'search_transactions', 'complete', '9 flagged transactions: all on ''delta'' keyword. TX-1088 = Delta Air Lines purchase. TX-1111·TX-1113 + 6 more = Venmo reimbursements with ''delta force sprint'' in memos. Context investigation: ''Delta Force Sprint'' is annual Synapse Technologies engineering hackathon.', 'Tool call: search_transactions(alert_id=''ALERT-0111'', flagged=true, limit=50)

Flagged transactions:
1. TX-1088 | Nov 15 | Delta Air Lines | -$487 | keyword: ''delta'' (merchant)
2. TX-1111 | Dec 10 | Venmo @kai.chen.dev | +$2,850 | keyword: ''delta force''
3. TX-1112 | Dec 11 | Venmo @priya.dev.austin | +$1,900 | keyword: ''delta sprint hotel''
4. TX-1113 | Dec 12 | Venmo @marcus.wei | +$1,750 | keyword: ''delta flights''
5·9: Additional Venmo from same 4-person group, $400·$900 | keyword: ''delta''

Context investigation:
· ''Delta Force Sprint'' = Synapse Technologies internal engineering hackathon (Dec 8·12, Seattle)
· Company blog post confirmed event
· All Venmo counterparties are verified Synapse Technologies colleagues (LinkedIn confirmed)'),
	(40, 'ALERT-0111', 4, 'STEP', 'Baseline Transaction Summary', 'get_baseline_summary', 'complete', '90-day baseline: $5,625 bi-weekly payroll + small P2P activity ($50·$900 avg). December spike = hackathon travel reimbursements. One-time event explains entire velocity anomaly.', 'Tool call: get_baseline_summary(customer_id=''C-5502-0111'', lookback_days=90, exclude_flagged=True)

Baseline: $36,750 inflow (payroll + P2P) | P2P avg: $285/transaction | Largest P2P in baseline: $900
December spike: 8 P2P credits totaling ~$13,000 in 4 days = 4.6x average 4-day P2P total
Explanation: Hackathon · customer fronted hotel/flights, colleagues reimbursed via Venmo
Pattern: TX-1079 (Marriott Seattle -$1,425) then TX-1111·TX-1113 (reimbursements) = perfect cost-sharing structure'),
	(41, 'ALERT-0111', 5, 'STEP', 'Income Verification Calculation', 'calculate', 'complete', 'Alert inflow $145K = 1.07x stated annual income · fully explained by payroll. P2P $13K is transient reimbursement (net-zero). No income concern.', 'Tool call: calculate(operation=''income_verification'', alert_id=''ALERT-0111'')

Payroll (40 days): $22,500 · consistent with $135K stated income
P2P reimbursements ($13K): Non-income, transient, net-zero (customer reimbursed what they paid out)
Income ratio: 1.07x · completely normal
Result: NO CONCERN'),
	(42, 'ALERT-0111', 6, 'STEP', 'High-Risk Keyword Deep-Dive', 'search_keyword_transactions', 'complete', '''Delta'' in 9 flagged transactions · all resolved. 7 reference ''Delta Force Sprint'' (Synapse hackathon, company-confirmed). 2 reference Delta Air Lines (legitimate airline). All counterparties verified colleagues. Zero unresolved hits.', 'Tool call: search_keyword_transactions(customer_id=''C-5502-0111'', keywords=[''delta'',''force'',''sprint'',''offshore'',''clean'',''layering'',''wash'',...], full_context=True)

Keyword resolution:
· Delta Air Lines (TX-1088): legitimate airline purchase ?
· ''delta force sprint'' (7 Venmo memos): Synapse Technologies annual hackathon ?
  Evidence: Company blog, LinkedIn posts from counterparties, employer-confirmed event

Other high-risk keywords: 0 hits
All P2P counterparties: verified Synapse Technologies colleagues
Conclusion: ZERO unresolved keyword hits.'),
	(43, 'ALERT-0111', 7, 'STEP', 'Representative Window Analysis', 'analyze_window', 'complete', 'October baseline window: normal payroll + small P2P. December spike window: payroll + hackathon reimbursements from verified colleagues. Marriott Seattle booking matches event dates exactly. No suspicious pattern.', 'Tool call: analyze_window(customer_id=''C-5502-0111'', window_1=''2025-10-14:2025-10-16'', window_2=''2025-12-09:2025-12-13'')

Window 1 (baseline): Payroll $5,625, small personal spending, minor P2P ($45, $30) · completely normal
Window 2 (spike): Payroll $5,625 + Venmo reimbursements from 3 confirmed colleagues + Marriott Seattle -$1,425 + Delta Air Lines -$487 + Uber Seattle -$234
Conclusion: One-time event-driven spike, fully documented and verified.'),
	(44, 'ALERT-0111', 8, 'STEP', 'Risk Factor Synthesis & Decision', 'evaluate_risk', 'complete', '1 suspicious indicator (velocity, fully explained) vs 7 mitigating factors. CLEAR with 85% confidence. False positive · keyword-triggered by corporate event name.', 'Tool call: evaluate_risk(alert_id=''ALERT-0111'', include_factors=true)

Suspicious Indicators:
1. Velocity spike (P2P credits Dec 8·12) · fully explained by hackathon travel reimbursements

Mitigating Factors:
1. ''Delta'' = corporate event name (Synapse Technologies hackathon), confirmed by employer
2. All P2P counterparties: verified colleagues at same employer
3. Net P2P position: near-zero
4. Regular payroll consistent with stated $135K income
5. Marriott Seattle + Delta Air Lines confirm actual travel event
6. Zero prior alerts in 5-year history
7. No adverse media, sanctions, or PEP flags

Final Decision: CLEAR (False Positive)
Confidence: 85%'),
	(45, 'ALERT-0111', 9, 'STEP', 'Narrative Generation', 'generate_narrative', 'complete', 'CLEAR narrative generated. Customer note added: annual hackathon causes predictable velocity spike. Rule tuning recommendation submitted.', 'Tool call: generate_narrative(alert_id=''ALERT-0111'', decision=''CLEAR'')
also: add_customer_note(customer_id=''C-5502-0111'', note=''Delta Force Sprint is annual Synapse Technologies hackathon · December velocity spikes expected.'')

Narrative: 623 words · Decision: CLEAR, False Positive
No case created. No SAR required.
Recommendation: Add rule suppression note for verified employer events.'),
	(46, 'ALERT-0112', 1, 'STEP', 'Alert Details Retrieval', 'get_alert_details', 'complete', 'Alert ALERT-0112 triggered Dec 17, 2025 for Darius J. Wainwright. Three rules fired: HighRiskKeyword, VelocityIncrease, RoundAmounts. 14 flagged transactions · large round-number wire transfers through an attorney trust (IOLTA) account.', 'Tool call: get_alert_details(alert_id=''ALERT-0112'')

Result:
· Alert ID: ALERT-0112
· Customer: Darius J. Wainwright (C-6613-0112)
· Date triggered: 2025-12-17
· Rules fired: HighRiskKeyword, VelocityIncrease, RoundAmounts
· Flagged transactions: 14 wire transfers · client fund inflows and legal disbursements
· Total flagged volume: $490,000 inflow / $445,000 outflow
· Alert window: 2025-11-01 to 2025-12-17 (47 days)
· Account type: Professional Business Checking (IOLTA-linked)
· Note: 7-year account relationship. 1 prior alert cleared in 2022 (same pattern).'),
	(47, 'ALERT-0112', 2, 'STEP', 'Customer Profile & KYC Review', 'get_customer_details', 'complete', 'Darius Wainwright · Attorney (Wainwright Law LLC), Chicago IL. Risk 27 (LOW). Stated income $320K. 7-year account. IOLTA registered with Illinois IOLTA Fund. Illinois Bar license Active, no disciplinary history. Prior 2022 alert cleared on same basis.', 'Tool call: get_customer_details(customer_id=''C-6613-0112'')

Result:
· Name: Darius J. Wainwright | DOB: 1975-02-28
· Occupation: Attorney · Wainwright Law LLC (principal, commercial real estate & M&A)
· Account opened: 2018-06-20 (7.5 years) | Stated income: $320,000
· Customer risk score: 27 (LOW) | Alert risk score: 41 (LOW)
· Prior alerts: 1 (2022 · cleared; same round-number wire pattern)
· KYC: CURRENT (2025-03-01)
· Illinois State Bar: Active, in good standing, no disciplinary history
· IOLTA: Registered with Illinois IOLTA Fund · compliant'),
	(48, 'ALERT-0112', 3, 'STEP', 'Flagged Transaction Retrieval & Attorney Trust Account Analysis', 'search_transactions', 'complete', '14 flagged transactions: 4 large inbound client fund wires ($50K·$300K), 4 large outbound disbursements ($50K·$250K), payroll, court payments · all round numbers. All consistent with IOLTA trust account activity. Documentation retrieval initiated.', 'Tool call: search_transactions(alert_id=''ALERT-0112'', flagged=true, limit=50)

Flagged transactions:
1. TX-1082 | Nov 1 | ACH Credit | Midwest Equity Group | +$50,000  Client retainer (engagement letter on file)
2. TX-1090 | Nov 15 | Wire | Johnson & Reed LLP Escrow | -$120,000  Settlement (court order on file)
3. TX-1100 | Nov 20 | ACH Debit | Wainwright Law LLC Payroll | -$65,000  Law firm payroll
4. TX-1108 | Nov 29 | Wire | Lakeview Partners LLC | +$180,000  Commercial RE escrow (purchase agreement on file)
5. TX-1115 | Dec 5 | Wire | Harrison Industrial Corp | +$300,000  M&A escrow deposit (LOI on file)
6. TX-1121 | Dec 8 | Wire | 1st National Escrow | -$250,000  RE closing disbursement
7. TX-1122 | Dec 10 | Wire | Cook County Circuit Court | -$50,000  Court-ordered bond payment
8. TX-1123 | Dec 12 | Wire | Wainwright Law Operating | -$75,000  Attorney fee withdrawal (fee agreement: 25% of $300K)

All transactions: IOLTA trust account pattern · large round-number client funds and disbursements are standard for commercial law practice.'),
	(49, 'ALERT-0112', 4, 'STEP', 'Baseline Transaction Summary', 'get_baseline_summary', 'complete', '90-day baseline: avg $82K/month consistent with Active commercial practice. Alert window is 1.7x baseline · driven by single Harrison Industrial M&A closing. 78% round-number transactions in baseline · standard legal billing.', 'Tool call: get_baseline_summary(customer_id=''C-6613-0112'', lookback_days=90, exclude_flagged=True)

Baseline: $245,000 inflow / $238,000 outflow (90 days)
Avg monthly: $81,700 | Avg transaction: $47,500 | Round-number %: 78%

Alert window: $490,000 vs $82K = 1.7x monthly average
Primary spike cause: TX-1115 (Harrison Industrial $300K M&A closing · one-time event)
Excluding Harrison: $190K · within normal range'),
	(50, 'ALERT-0112', 5, 'STEP', 'Income Verification & Legal Documentation Review', 'calculate', 'complete', 'IOLTA client funds are not income. Attorney fees withdrawn: $75K (fee agreement on file). Annualized: ~$180K · consistent with stated $320K income across multiple matters. ALL 14 transactions fully documented.', 'Tool call: calculate(operation=''income_verification'', alert_id=''ALERT-0112'')
also: review_documentation(customer_id=''C-6613-0112'', all_flagged=True)

IMPORTANT: IOLTA trust account · client funds are NOT attorney income.
Attorney fees in alert window: $75,000 (TX-1123 · fee agreement on file)
Annualized fees estimate: ~$180K/yr (partial view)

Documentation review:
All 14 flagged transactions:  FULLY DOCUMENTED
· TX-1082: Engagement letter  | TX-1090: Court Order  | TX-1100: Payroll records ?
· TX-1108: Purchase agreement  | TX-1115: Executed LOI  | TX-1121: Closing statement ?
· TX-1122: Court Order #2024-L-003891  | TX-1123: Fee agreement ?'),
	(51, 'ALERT-0112', 6, 'STEP', 'High-Risk Keyword Search', 'search_keyword_transactions', 'complete', 'Keywords ''settlement'', ''escrow'', ''judgment'', ''bond'' · all in legal context (court orders, RE closings, M&A). Zero hits for criminal slang. RoundAmounts rule: 78% of transactions round · standard legal billing (hourly · time, percentage fees, court amounts).', 'Tool call: search_keyword_transactions(customer_id=''C-6613-0112'', keywords=[''settlement'',''escrow'',''trust'',''judgment'',''bond'',''offshore'',''clean'',''layering'',...], full_context=True)

Keyword hits:
· ''settlement'' · TX-1090: Civil litigation settlement, court order on file  BENIGN
· ''escrow'' · TX-1108, TX-1115, TX-1121: RE and M&A escrow  BENIGN
· ''judgment''/''bond'' · TX-1122: Court-ordered payment  BENIGN

High-risk keywords: ZERO hits for ''offshore'', ''clean'', ''layering'', ''wash'', ''cash'', ''anonymous''

RoundAmounts analysis: $50K retainer, $75K contingency fee, $120K settlement, $300K M&A escrow · all standard legal amounts. Round numbers in legal practice are a professional norm.'),
	(52, 'ALERT-0112', 7, 'STEP', 'Representative Window Analysis & Prior Alert Review', 'analyze_window', 'complete', 'September baseline: normal law firm activity ($120K inflow, $102K outflow). December spike: single Harrison Industrial M&A closing. Prior 2022 alert cleared on identical basis · direct precedent. 7-year consistent history.', 'Tool call: analyze_window(customer_id=''C-6613-0112'', window_1=''2025-09-01:2025-09-30'', window_2=''2025-12-05:2025-12-12'')
also: get_prior_alert_disposition(alert_id=''ALERT-2022-0056'')

Prior alert (2022): Same rules triggered. Cleared after documentation review. Note on file: ''Attorney IOLTA · large round transfers are routine.''

Sep baseline: $120K inflow (3 client retainers + settlement), $102K outflow (payroll + court + operating)  normal
Dec spike: $300K Harrison Industrial M&A escrow deposit  single large matter drives spike

Conclusion: 7-year consistent history, prior alert cleared on same basis, all documentation present.'),
	(53, 'ALERT-0112', 8, 'STEP', 'Risk Factor Synthesis & Decision', 'evaluate_risk', 'complete', '1 technical suspicious indicator (round amounts, velocity) vs 7 strong mitigating factors. CLEAR with 85% confidence. False positive · IOLTA attorney trust account. Rule tuning recommendation submitted.', 'Tool call: evaluate_risk(alert_id=''ALERT-0112'', include_factors=true)

Suspicious Indicators:
1. Round-number transactions and velocity spike · fully explained by legal billing and one-time M&A closing

Mitigating Factors:
1. All 14 transactions fully documented (engagement letters, court orders, closing statements, fee agreements)
2. IOLTA registration · Illinois IOLTA Fund compliant
3. Illinois Bar license: Active, no disciplinary history
4. 7-year account history: consistent, documented pattern
5. Prior 2022 alert: identical pattern, cleared · direct precedent
6. No adverse media, sanctions, or PEP flags
7. Court-ordered disbursements confirm judicial oversight

Final Decision: CLEAR (False Positive)
Confidence: 85%'),
	(54, 'ALERT-0112', 9, 'STEP', 'Narrative Generation & Model Feedback', 'generate_narrative', 'complete', 'CLEAR narrative generated. Rule tuning feedback submitted: IOLTA accounts should have elevated thresholds for RoundAmounts and VelocityIncrease rules.', 'Tool call: generate_narrative(alert_id=''ALERT-0112'', decision=''CLEAR'')
also: submit_model_feedback(alert_id=''ALERT-0112'', feedback_type=''false_positive'', rules=[''RoundAmounts'',''VelocityIncrease''], suggested_tuning=''IOLTA accounts need elevated thresholds'')

Narrative: 714 words · Decision: CLEAR, False Positive
Model feedback: Add IOLTA account exemption to RoundAmounts rule; use matter-adjusted velocity baseline for law firms
Expected impact: ~40% reduction in false positives on attorney accounts

No case created. No SAR required.
Account C-6613-0112 recommendation: Tag as IOLTA type; apply attorney-specific rule thresholds');


ALTER TABLE public.journal_steps ENABLE TRIGGER ALL;

--
-- Data for Name: models; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.models DISABLE TRIGGER ALL;

INSERT INTO public.models (id, name, model_type, accuracy, "precision", recall, fpr, status, drift, retrained) VALUES
	(1, 'AML Alert Classifier v2.4', 'Classification', 91.3, 88.7, 93.1, 8.2, 'PRODUCTION', 'LOW', '2025-11-01'),
	(2, 'Transaction Anomaly Detector v1.8', 'Anomaly Detection', 87.5, 84.2, 90, 12.1, 'PRODUCTION', 'LOW', '2025-10-15'),
	(3, 'SAR Likelihood Predictor v1.2', 'Regression', 82.1, 79.8, 84.5, 15.3, 'STAGING', 'MEDIUM', '2025-11-20'),
	(4, 'Network Cluster Detector v0.9', 'Graph ML', 78.4, 76.1, 80.8, 18.6, 'DEVELOPMENT', 'N/A', '2025-12-01');


ALTER TABLE public.models ENABLE TRIGGER ALL;

--
-- Data for Name: network_edges; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.network_edges DISABLE TRIGGER ALL;

INSERT INTO public.network_edges (id, alert_id, src_key, dst_key, amount, direction) VALUES
	(1, 'ALERT-0100', 'n1', 'c', '$41K', 'in'),
	(2, 'ALERT-0100', 'n2', 'c', '$3.6K', 'in'),
	(3, 'ALERT-0100', 'n3', 'c', '$3.5K', 'in'),
	(4, 'ALERT-0100', 'n4', 'c', '$9.7K', 'in'),
	(5, 'ALERT-0100', 'c', 'n5', '$8K', 'out'),
	(6, 'ALERT-0108', 'n1', 'c', '$210K', 'in'),
	(7, 'ALERT-0108', 'n5', 'c', '$50K', 'in'),
	(8, 'ALERT-0108', 'c', 'n2', '$85K', 'out'),
	(9, 'ALERT-0108', 'c', 'n3', '$120K', 'out'),
	(10, 'ALERT-0108', 'c', 'n4', '$28K', 'out'),
	(11, 'ALERT-0108', 'n1', 'n2', '$40K', 'out'),
	(12, 'ALERT-0109', 'c', 'n1', '$95K', 'out'),
	(13, 'ALERT-0109', 'c', 'n2', '$120K', 'out'),
	(14, 'ALERT-0109', 'c', 'n3', '$200K', 'out'),
	(15, 'ALERT-0109', 'n4', 'c', '$28.2K', 'in'),
	(16, 'ALERT-0109', 'n5', 'c', '$20K', 'in'),
	(17, 'ALERT-0109', 'n1', 'n2', '$40K', 'out'),
	(18, 'ALERT-0110', 'n1', 'c', '$135K', 'in'),
	(19, 'ALERT-0110', 'n5', 'c', '$45K', 'in'),
	(20, 'ALERT-0110', 'c', 'n2', '$75K', 'out'),
	(21, 'ALERT-0110', 'c', 'n3', '$55K', 'out'),
	(22, 'ALERT-0110', 'c', 'n4', '$85K', 'out'),
	(23, 'ALERT-0110', 'n4', 'n2', '$30K', 'out'),
	(24, 'ALERT-0111', 'n1', 'c', '$5.6K', 'in'),
	(25, 'ALERT-0111', 'n2', 'c', '$900', 'in'),
	(26, 'ALERT-0111', 'c', 'n2', '$2.9K', 'out'),
	(27, 'ALERT-0111', 'c', 'n3', '$1.9K', 'out'),
	(28, 'ALERT-0111', 'c', 'n4', '$1.8K', 'out'),
	(29, 'ALERT-0111', 'c', 'n5', '$487', 'out'),
	(30, 'ALERT-0112', 'n1', 'c', '$300K', 'in'),
	(31, 'ALERT-0112', 'n5', 'c', '$180K', 'in'),
	(32, 'ALERT-0112', 'c', 'n2', '$250K', 'out'),
	(33, 'ALERT-0112', 'c', 'n3', '$50K', 'out'),
	(34, 'ALERT-0112', 'c', 'n4', '$75K', 'out'),
	(35, 'ALERT-0112', 'n4', 'n2', '$120K', 'out');


ALTER TABLE public.network_edges ENABLE TRIGGER ALL;

--
-- Data for Name: network_nodes; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.network_nodes DISABLE TRIGGER ALL;

INSERT INTO public.network_nodes (id, alert_id, node_key, label, node_type, x, y, risk) VALUES
	(1, 'ALERT-0100', 'c', 'Jeremiah Garcia', 'subject', 300, 220, 'MEDIUM'),
	(2, 'ALERT-0100', 'n1', 'Stripe', 'processor', 480, 120, 'LOW'),
	(3, 'ALERT-0100', 'n2', 'Del Paso Heights Branch', 'branch', 140, 130, 'LOW'),
	(4, 'ALERT-0100', 'n3', 'Midtown Sacramento Branch', 'branch', 100, 280, 'LOW'),
	(5, 'ALERT-0100', 'n4', 'Oak Park Branch', 'branch', 180, 380, 'MEDIUM'),
	(6, 'ALERT-0100', 'n5', 'Garcia Convenience LLC', 'entity', 460, 340, 'LOW'),
	(7, 'ALERT-0108', 'c', 'Ryan Torres', 'subject', 300, 230, 'HIGH'),
	(8, 'ALERT-0108', 'n1', 'Global Trade Partners Inc', 'entity', 120, 110, 'HIGH'),
	(9, 'ALERT-0108', 'n2', 'HSBC Panama Branch', 'bank', 490, 110, 'HIGH'),
	(10, 'ALERT-0108', 'n3', 'Barclays London', 'bank', 490, 360, 'MEDIUM'),
	(11, 'ALERT-0108', 'n4', 'Torres Logistics Solutions', 'entity', 120, 360, 'MEDIUM'),
	(12, 'ALERT-0108', 'n5', 'Pacific Rim Trade Advisors', 'entity', 300, 50, 'LOW'),
	(13, 'ALERT-0109', 'c', 'Neal Hall', 'subject', 300, 230, 'CRITICAL'),
	(14, 'ALERT-0109', 'n1', 'Nexus Realty LLC', 'entity', 130, 120, 'HIGH'),
	(15, 'ALERT-0109', 'n2', 'Pacific Shell Corp', 'entity', 470, 120, 'HIGH'),
	(16, 'ALERT-0109', 'n3', 'Deutsche Bank Frankfurt', 'bank', 480, 360, 'MEDIUM'),
	(17, 'ALERT-0109', 'n4', 'Branch Hollywood', 'branch', 130, 360, 'LOW'),
	(18, 'ALERT-0109', 'n5', 'Hall Development Corp', 'entity', 300, 60, 'LOW'),
	(19, 'ALERT-0110', 'c', 'David Hall', 'subject', 300, 230, 'MEDIUM'),
	(20, 'ALERT-0110', 'n1', 'Meridian Capital Advisory', 'entity', 120, 110, 'MEDIUM'),
	(21, 'ALERT-0110', 'n2', 'Banco Santander Cayman', 'bank', 490, 110, 'HIGH'),
	(22, 'ALERT-0110', 'n3', 'HSBC HK Private Banking', 'bank', 490, 360, 'HIGH'),
	(23, 'ALERT-0110', 'n4', 'Hall Financial Services LLC', 'entity', 120, 360, 'MEDIUM'),
	(24, 'ALERT-0110', 'n5', 'Coral Springs Investment Fund', 'entity', 300, 60, 'LOW'),
	(25, 'ALERT-0111', 'c', 'Marisol Nguyen-Kelley', 'subject', 300, 230, 'LOW'),
	(26, 'ALERT-0111', 'n1', 'Synapse Technologies', 'entity', 120, 110, 'LOW'),
	(27, 'ALERT-0111', 'n2', '@kai.chen.dev', 'processor', 490, 110, 'LOW'),
	(28, 'ALERT-0111', 'n3', '@priya.dev.austin', 'processor', 490, 360, 'LOW'),
	(29, 'ALERT-0111', 'n4', '@marcus.wei', 'processor', 120, 360, 'LOW'),
	(30, 'ALERT-0111', 'n5', 'Delta Air Lines', 'processor', 300, 60, 'LOW'),
	(31, 'ALERT-0112', 'c', 'Darius Wainwright', 'subject', 300, 230, 'LOW'),
	(32, 'ALERT-0112', 'n1', 'Harrison Industrial Corp', 'entity', 120, 110, 'LOW'),
	(33, 'ALERT-0112', 'n2', '1st National Escrow', 'entity', 490, 110, 'LOW'),
	(34, 'ALERT-0112', 'n3', 'Cook County Circuit Court', 'entity', 490, 360, 'LOW'),
	(35, 'ALERT-0112', 'n4', 'Wainwright Law LLC', 'entity', 120, 360, 'LOW'),
	(36, 'ALERT-0112', 'n5', 'Lakeview Partners LLC', 'entity', 300, 60, 'LOW');


ALTER TABLE public.network_nodes ENABLE TRIGGER ALL;

--
-- Data for Name: sars; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.sars DISABLE TRIGGER ALL;

INSERT INTO public.sars (id, case_id, customer_id, status, filing_deadline, prepared_by, reviewed_by, qc_score, narrative) VALUES
	('SAR-2025-001', 'CASE-2025-002', 'C-4490-0109', 'DRAFT', '2026-01-12', 'Marcus Williams', NULL, 82, 'Subject Neal Hall, a Real Estate Developer, engaged in a structured cash deposit pattern across three branches with nine deposits ranging $8,900 to $9,800 over four consecutive days · totaling $87,200 below CTR thresholds. Network analysis reveals circular fund movement through linked shell entities (Nexus Realty LLC, Pacific Shell Corp). Pattern is consistent with placement and layering typologies under FinCEN guidance.'),
	('SAR-2025-002', 'CASE-2025-001', 'C-7712-0108', 'IN_REVIEW', '2026-01-18', 'Sarah Chen', 'Compliance Officer Kim', 91, 'Subject Ryan Torres, an Import/Export Consultant, reactivated a 14-month dormant account followed by $340,000 in international wire transfers to Panama and London with no documented business purpose. Trade invoice from ''Global Trade Partners Inc'' could not be verified. Pattern is consistent with trade-based money laundering and dormant-account warm-up typologies.'),
	('SAR-A82EC5C5', 'CASE-2025-003', 'C-3381-0110', 'DRAFT', '2026-06-08', 'Themis AI', NULL, NULL, '# SAR Narrative – CASE-2025-003 / ALERT-0110
**Subject:** David Hall

---

**Subject Identification**

This Suspicious Activity Report (SAR) is being filed in connection with account activity associated with David Hall (hereinafter "the Subject"), identified under internal case number CASE-2025-003 and alert reference ALERT-0110. The filing institution identified the Subject''s account activity through automated transaction monitoring systems, which generated alert ALERT-0110 based on parameters consistent with potentially suspicious international wire transfer behavior. No prior SAR filings or investigation journal entries were available for review in connection with this Subject at the time of this report.

**Description of Suspicious Activity**

A review of the Subject''s account activity revealed a pattern of international wire transfers exhibiting circular movement of funds. Specifically, funds were identified as being transmitted internationally and subsequently returned, in whole or in part, to accounts associated with or potentially controlled by the Subject, without an apparent legitimate business or personal financial purpose to justify such routing. This circular flow of funds is inconsistent with the Subject''s known customer profile and expected account activity as established at account opening.

**Red Flags Identified**

The following red flags were identified during the course of this investigation: (1) international wire transfers structured in a manner consistent with layering activity, a recognized stage of the money laundering process; (2) circular fund flows lacking a discernible legitimate economic purpose; (3) transaction patterns inconsistent with the Subject''s stated business or personal financial profile; and (4) the absence of clear counterparty relationships or commercial documentation that would otherwise explain the international movement of funds. These indicators are consistent with typologies identified in FinCEN guidance related to trade-based money laundering, third-party money movement, and layering schemes.

**Recommendation and Further Action**

Due to the nature and complexity of the identified transaction patterns, further investigation is warranted. The filing institution recommends a comprehensive review of all corresponding accounts, beneficiary relationships, and originating financial institutions associated with the Subject''s international wire activity. Law enforcement and regulatory authorities are encouraged to examine whether the circular wire patterns are indicative of money laundering, fraud, or other illicit financial activity. The filing institution will continue to monitor the Subject''s account activity and will file supplemental SARs as additional information becomes available.

---

*This SAR narrative has been prepared in accordance with FinCEN guidance and the Bank Secrecy Act (BSA), 31 U.S.C. § 5318(g). Information contained herein is confidential and subject to applicable legal protections against unauthorized disclosure.*');


ALTER TABLE public.sars ENABLE TRIGGER ALL;

--
-- Data for Name: sar_audit_trail; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.sar_audit_trail DISABLE TRIGGER ALL;

INSERT INTO public.sar_audit_trail (id, sar_id, ts, user_name, action, detail) VALUES
	(1, 'SAR-2025-001', '2025-12-12 14:32', 'Themis AI', 'Initial narrative generated', 'AI generated 847-word narrative based on investigation findings'),
	(2, 'SAR-2025-001', '2025-12-13 09:15', 'Marcus Williams', 'Edited Section 2 (Subject Information)', 'Updated occupation description and added LLC details'),
	(3, 'SAR-2025-001', '2025-12-13 11:42', 'Marcus Williams', 'Edited Section 4 (Transaction Timeline)', 'Added three additional flagged transactions from Nov 29'),
	(4, 'SAR-2025-001', '2025-12-14 16:20', 'Themis AI', 'QC check run', 'QC score 82/100. Flagged 2 missing fields.'),
	(5, 'SAR-2025-001', '2025-12-15 10:05', 'Marcus Williams', 'Edited Section 5 (Reason for Suspicion)', 'Strengthened language around structuring pattern'),
	(6, 'SAR-2025-002', '2025-12-11 16:00', 'Themis AI', 'Initial narrative generated', 'AI generated 912-word narrative'),
	(7, 'SAR-2025-002', '2025-12-12 10:30', 'Sarah Chen', 'Edited Section 3 (Transaction Timeline)', 'Added wire transfer reference numbers'),
	(8, 'SAR-2025-002', '2025-12-13 14:15', 'Compliance Officer Kim', 'Review started', 'Compliance officer review initiated'),
	(9, 'SAR-2025-002', '2025-12-14 09:45', 'Compliance Officer Kim', 'Approved for submission', 'QC score 91/100. All required fields complete.');


ALTER TABLE public.sar_audit_trail ENABLE TRIGGER ALL;

--
-- Data for Name: sar_missing_fields; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.sar_missing_fields DISABLE TRIGGER ALL;

INSERT INTO public.sar_missing_fields (sar_id, field) VALUES
	('SAR-2025-001', 'Supporting Document #3'),
	('SAR-2025-001', 'Final Reviewer Signature');


ALTER TABLE public.sar_missing_fields ENABLE TRIGGER ALL;

--
-- Data for Name: screening_results; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.screening_results DISABLE TRIGGER ALL;

INSERT INTO public.screening_results (id, screen_type, entity, entity_id, entity_type, match, score, source, details, action, payload) VALUES
	('scr1', 'PEP', 'Neal Hall', 'C-4490-0109', 'customer', 'POTENTIAL', 72, 'World-Check (LSEG)', 'Name match in PEP Database', 'Enhanced Monitoring', '{"positions": [{"to": "2022-08", "from": "2019-02", "title": "Member, Los Angeles County Infrastructure Commission", "appointedBy": "County Board of Supervisors", "jurisdiction": "Los Angeles County, CA"}, {"to": "2019-01", "from": "2017-06", "title": "Advisor, CA State Real Estate Development Fund", "appointedBy": "Governor''s Office", "jurisdiction": "State of California"}], "familyLinks": [], "riskNarrative": "Subject held appointed public positions giving access to infrastructure contract decisions and public fund allocations. Positions have concluded but PEP status persists for 5 years per FATF guidance."}'),
	('scr2', 'Sanctions', 'Ryan Torres', 'C-7712-0108', 'customer', 'NO_MATCH', 0, 'OFAC SDN', 'No match found', 'Clear', '{"hits": [], "lastChecked": "2025-12-11 08:00"}'),
	('scr3', 'Adverse Media', 'David Hall', 'C-3381-0110', 'customer', 'POTENTIAL', 58, 'Dow Jones Risk Center', 'Associated entity in fraud investigation', 'Review Required', '{"articles": [{"url": "https://miamiherald.com", "date": "2024-03-14", "snippet": "Investigators have subpoenaed records from several Miami-area financial consultants connected to the fund...", "headline": "Miami-Based Financial Firm Under State Investigation for Undisclosed Conflicts", "publication": "Miami Herald", "relevanceScore": 72}, {"url": "https://bloomberglaw.com", "date": "2024-07-22", "snippet": "The SEC sent Wells notices to principals at Coastal Capital Group, where sources indicate David Hall served as an advisor...", "headline": "SEC Issues Wells Notice to Coastal Capital Group", "publication": "Bloomberg Law", "relevanceScore": 85}]}'),
	('scr4', 'Sanctions', 'Jeremiah Garcia', 'C-8518-0100', 'customer', 'NO_MATCH', 0, 'EU Consolidated Sanctions', 'No match found', 'Clear', '{"hits": [], "lastChecked": "2025-12-01 06:00"}'),
	('scr5', 'PEP', 'Marisol Nguyen-Kelley', 'C-5502-0111', 'customer', 'NO_MATCH', 0, 'Refinitiv World-Check', 'No match found', 'Clear', '{"positions": [], "familyLinks": []}'),
	('scr6', 'Enforcement', 'Nexus Realty LLC', 'nexus-realty', 'entity', 'HIT', 91, 'CA DRE & FinCEN', 'Regulatory enforcement action', 'Escalate', '{"actions": [{"date": "2024-09-01", "type": "License Suspension", "status": "Resolved (Dec 2024)", "authority": "California Department of Real Estate", "description": "License suspended for 180 days following investigation into undisclosed dual agency relationships and commingling of client funds.", "docketNumber": "2024-DRE-0491", "jurisdiction": "State of California", "penaltyAmount": "$85,000 fine"}, {"date": "2023-11-15", "type": "Civil Money Penalty", "status": "Final Order", "authority": "FinCEN", "description": "Failure to maintain adequate AML program and file required CTRs for real estate transactions exceeding $10,000.", "docketNumber": "2023-FMC-0112", "jurisdiction": "Federal", "penaltyAmount": "$250,000 civil money penalty"}]}'),
	('scr7', 'Sanctions', 'HSBC Panama Branch', 'hsbc-panama', 'entity', 'POTENTIAL', 44, 'FATF High-Risk Jurisdictions', 'Correspondent bank in FATF-listed jurisdiction', 'Enhanced Due Diligence', '{"hits": [{"date": "2023-06-23", "entity": "Panama (Jurisdiction)", "status": "Grey List · Increased Monitoring", "program": "FATF Jurisdiction Under Increased Monitoring", "reference": "https://www.fatf-gafi.org/en/topics/grey-and-black-lists.html", "description": "Panama remains under FATF increased monitoring. Correspondent banking relationships require enhanced due diligence and documentation of business purpose.", "sanctioningBody": "FATF"}], "lastChecked": "2025-12-11 08:00"}'),
	('scr8', 'Adverse Media', 'Pacific Shell Corp', 'pacific-shell', 'entity', 'HIT', 87, 'OpenCorporates & Media Scan', 'Shell company with no public business presence', 'Escalate', '{"articles": [{"url": "https://offshoreleaks.icij.org", "date": "2016-04-05", "snippet": "Records show Pacific Shell Corp was incorporated in BVI in 2011 as a nominee holding vehicle...", "headline": "Panama Papers Leak References Pacific Shell Corp as Nominee Entity", "publication": "ICIJ", "relevanceScore": 87}, {"url": "https://latimes.com", "date": "2024-10-18", "snippet": "Investigators are examining a series of real estate transactions involving shell companies including Pacific Shell Corp...", "headline": "LA Real Estate Deals Scrutinized in Money Laundering Probe", "publication": "LA Times", "relevanceScore": 91}]}');


ALTER TABLE public.screening_results ENABLE TRIGGER ALL;

--
-- Data for Name: timeline_entries; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.timeline_entries DISABLE TRIGGER ALL;

INSERT INTO public.timeline_entries (id, alert_id, date, inflow, outflow) VALUES
	(1, 'ALERT-0100', '2025-10-01', 3500, 0),
	(2, 'ALERT-0100', '2025-10-15', 4200, 1200),
	(3, 'ALERT-0100', '2025-10-28', 0, 1200),
	(4, 'ALERT-0100', '2025-11-01', 4200, 0),
	(5, 'ALERT-0100', '2025-11-15', 3500, 800),
	(6, 'ALERT-0100', '2025-11-29', 16800, 0),
	(7, 'ALERT-0100', '2025-12-01', 4200, 2100),
	(8, 'ALERT-0108', '2025-10-01', 35000, 28000),
	(9, 'ALERT-0108', '2025-10-15', 0, 4200),
	(10, 'ALERT-0108', '2025-11-01', 50000, 0),
	(11, 'ALERT-0108', '2025-11-14', 50000, 0),
	(12, 'ALERT-0108', '2025-11-28', 210000, 0),
	(13, 'ALERT-0108', '2025-12-05', 0, 85000),
	(14, 'ALERT-0108', '2025-12-08', 0, 120000),
	(15, 'ALERT-0109', '2025-11-10', 15000, 0),
	(16, 'ALERT-0109', '2025-11-20', 20000, 5000),
	(17, 'ALERT-0109', '2025-12-01', 8900, 0),
	(18, 'ALERT-0109', '2025-12-02', 9500, 0),
	(19, 'ALERT-0109', '2025-12-03', 9800, 95000),
	(20, 'ALERT-0109', '2025-12-04', 9200, 0),
	(21, 'ALERT-0109', '2025-12-05', 8700, 200000),
	(22, 'ALERT-0110', '2025-10-15', 22000, 8500),
	(23, 'ALERT-0110', '2025-10-28', 0, 8500),
	(24, 'ALERT-0110', '2025-11-10', 45000, 0),
	(25, 'ALERT-0110', '2025-11-18', 0, 85000),
	(26, 'ALERT-0110', '2025-11-25', 135000, 0),
	(27, 'ALERT-0110', '2025-12-03', 0, 75000),
	(28, 'ALERT-0110', '2025-12-07', 0, 55000),
	(29, 'ALERT-0111', '2025-10-15', 5625, 487),
	(30, 'ALERT-0111', '2025-10-30', 5625, 900),
	(31, 'ALERT-0111', '2025-11-10', 0, 1425),
	(32, 'ALERT-0111', '2025-11-15', 0, 487),
	(33, 'ALERT-0111', '2025-11-25', 5625, 0),
	(34, 'ALERT-0111', '2025-12-09', 5625, 0),
	(35, 'ALERT-0111', '2025-12-10', 6500, 0),
	(36, 'ALERT-0111', '2025-12-12', 1750, 487),
	(37, 'ALERT-0112', '2025-11-01', 50000, 0),
	(38, 'ALERT-0112', '2025-11-15', 0, 120000),
	(39, 'ALERT-0112', '2025-11-20', 0, 65000),
	(40, 'ALERT-0112', '2025-11-29', 180000, 0),
	(41, 'ALERT-0112', '2025-12-05', 300000, 0),
	(42, 'ALERT-0112', '2025-12-08', 0, 250000),
	(43, 'ALERT-0112', '2025-12-10', 0, 50000),
	(44, 'ALERT-0112', '2025-12-12', 0, 75000);


ALTER TABLE public.timeline_entries ENABLE TRIGGER ALL;

--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.transactions DISABLE TRIGGER ALL;

INSERT INTO public.transactions (id, alert_id, date, "time", descr, category, counterparty, cp_type, amount, balance, flagged, country, city, notes, risk_indicators) VALUES
	('TX-9851', 'ALERT-0100', '2025-11-29', '09:12', 'Cash Deposit - In Branch', 'cash_deposit', 'Branch - Del Paso Heights (Branch #103)', 'branch', 3600, 41210, true, 'USA', 'Sacramento', 'Multi-branch same-day deposit #1 of 3. Amount below $10K CTR threshold.', '{"sub-threshold amount",multi-branch}'),
	('TX-9853', 'ALERT-0100', '2025-11-29', '13:45', 'Cash Deposit - In Branch', 'cash_deposit', 'Branch - Midtown Sacramento', 'branch', 3500, 50710, true, 'USA', 'Sacramento', 'Multi-branch same-day deposit #2 of 3. Second branch visited same day.', '{"sub-threshold amount",multi-branch,velocity}'),
	('TX-9857', 'ALERT-0100', '2025-11-29', '16:36', 'Cash Deposit - In Branch', 'cash_deposit', 'Branch - Oak Park (Branch #07)', 'branch', 9700, 60410, true, 'USA', 'Sacramento', 'Multi-branch same-day deposit #3 of 3. Largest deposit still below $10K.', '{"sub-threshold amount",multi-branch,round-proximate}'),
	('TX-9820', 'ALERT-0100', '2025-11-01', '10:00', 'Card Processor - Stripe', 'card_receipt', 'Card Processor - Stripe', 'processor', 4200, 38100, false, 'USA', 'Online', 'Regular merchant settlement from point-of-sale operations.', '{}'),
	('TX-9801', 'ALERT-0100', '2025-10-28', '14:22', 'ATM Withdrawal', 'cash_withdrawal', 'Cash Withdrawal ATM', 'atm', -1200, 33900, false, 'USA', 'Sacramento', 'Routine ATM withdrawal within normal range.', '{}'),
	('TX-9790', 'ALERT-0100', '2025-10-15', '08:00', 'Payroll ACH Credit', 'ach_credit', 'Garcia Convenience LLC Payroll', 'ach', 3500, 35100, false, 'USA', '', 'Bi-weekly payroll deposit consistent with stated income.', '{}'),
	('TX-9780', 'ALERT-0100', '2025-10-01', '08:00', 'Payroll ACH Credit', 'ach_credit', 'Garcia Convenience LLC Payroll', 'ach', 3500, 31600, false, 'USA', '', 'Bi-weekly payroll deposit consistent with stated income.', '{}'),
	('TX-1091', 'ALERT-0109', '2025-12-01', '08:00', 'Cash Deposit', 'cash_deposit', 'Branch - Hollywood', 'branch', 8900, 500000, true, 'USA', 'Los Angeles', 'Day 1 of structuring pattern. Amount is $1,100 below CTR threshold.', '{structuring,sub-threshold}'),
	('TX-1092', 'ALERT-0109', '2025-12-02', '09:30', 'Cash Deposit', 'cash_deposit', 'Branch - Burbank', 'branch', 9500, 509500, true, 'USA', 'Burbank', 'Day 2, different branch. Systematic below-threshold pattern.', '{structuring,sub-threshold,multi-branch}'),
	('TX-1093', 'ALERT-0109', '2025-12-03', '10:00', 'Wire Transfer - Domestic', 'wire_transfer', 'Nexus Realty LLC', 'entity', 95000, 604500, true, 'USA', '', 'Large domestic wire to shell entity. No apparent business purpose documented.', '{shell-entity,large-transfer,no-documentation}'),
	('TX-1094', 'ALERT-0109', '2025-12-04', '11:15', 'Cash Deposit', 'cash_deposit', 'Branch - Downtown LA', 'branch', 9800, 614300, true, 'USA', 'Los Angeles', 'Day 4, third branch location. Pattern continues.', '{structuring,sub-threshold,multi-branch}'),
	('TX-1095', 'ALERT-0109', '2025-12-05', '14:00', 'International Wire', 'wire_transfer', 'Deutsche Bank Frankfurt', 'bank', -200000, 414300, true, 'DEU', 'Frankfurt', 'Large outbound international wire to Germany. Real estate pretext unverified.', '{international,high-risk-jurisdiction,large-transfer}'),
	('TX-1085', 'ALERT-0109', '2025-11-20', '09:00', 'Payroll Deposit', 'ach_credit', 'Hall Development Corp', 'ach', 20000, 390000, false, 'USA', '', 'Monthly business income · plausible for real estate developer.', '{}'),
	('TX-1080', 'ALERT-0109', '2025-11-10', '11:30', 'Property Management Fees', 'ach_credit', 'Pacific Properties LLC', 'entity', 15000, 370000, false, 'USA', '', 'Routine property management income.', '{}'),
	('TX-1081', 'ALERT-0108', '2025-12-05', '11:00', 'Wire Transfer - International', 'wire_transfer', 'HSBC Panama Branch', 'bank', -85000, 125000, true, 'PAN', 'Panama City', 'Outbound wire to Panama · FATF grey-listed jurisdiction. No trade documentation or business purpose provided. Recipient account opened 6 months ago.', '{international,high-risk-jurisdiction,large-transfer,no-documentation}'),
	('TX-1082', 'ALERT-0108', '2025-12-08', '09:30', 'Wire Transfer - International', 'wire_transfer', 'Barclays London - Correspondent', 'bank', -120000, 5000, true, 'GBR', 'London', 'Second large outbound international wire within 3 days, nearly depleting account. Rapid layering pattern. London correspondent account has no prior relationship with customer.', '{international,rapid-movement,large-transfer,rapid-depletion}'),
	('TX-1075', 'ALERT-0108', '2025-11-28', '14:00', 'ACH Credit - Trade Invoice', 'ach_credit', 'Global Trade Partners Inc', 'entity', 210000, 210000, true, 'USA', 'San Francisco', 'Large ACH credit from entity with no prior relationship. Described as ''trade invoice'' but no shipping documents or trade contracts on file. Account was dormant 14 months before this credit.', '{dormant-reactivation,undocumented-source,large-inflow}'),
	('TX-1070', 'ALERT-0108', '2025-11-14', '10:00', 'ACH Credit - Consulting Retainer', 'ach_credit', 'Pacific Rim Trade Advisors LLC', 'entity', 50000, 52000, false, 'USA', 'San Francisco', 'Monthly consulting retainer consistent with import/export advisory role.', '{}'),
	('TX-1065', 'ALERT-0108', '2025-11-01', '09:00', 'ACH Credit - Invoice Payment', 'ach_credit', 'AsiaLink Commerce Group', 'entity', 35000, 38000, false, 'USA', '', 'Invoice payment from known client · documented in engagement file.', '{}'),
	('TX-1055', 'ALERT-0108', '2025-10-15', '14:30', 'Wire Transfer - Domestic', 'wire_transfer', 'Torres Logistics Solutions LLC', 'entity', -28000, 18000, false, 'USA', '', 'Payment to controlled entity · Torres 100% owner of logistics company.', '{}'),
	('TX-1045', 'ALERT-0108', '2025-10-01', '11:00', 'ACH Debit - Office Lease', 'ach_debit', 'Pacific Rim Business Center', 'landlord', -4200, 41000, false, 'USA', 'San Francisco', 'Monthly office lease payment · consistent with stated consulting business.', '{}'),
	('TX-1101', 'ALERT-0110', '2025-12-03', '10:15', 'Wire Transfer - International', 'wire_transfer', 'Banco Santander Cayman Islands', 'bank', -75000, 135000, true, 'CYM', 'George Town', 'Outbound wire to Cayman Islands · offshore jurisdiction. Described as ''investment account transfer'' but no investment documentation provided. Cayman account has no prior relationship.', '{international,offshore-jurisdiction,large-transfer,no-documentation}'),
	('TX-1102', 'ALERT-0110', '2025-12-07', '14:30', 'Wire Transfer - International', 'wire_transfer', 'HSBC Hong Kong Private Banking', 'bank', -55000, 80000, true, 'HKG', 'Hong Kong', 'Second international outbound wire within 4 days. Pattern of dispersal to multiple offshore accounts. Hong Kong HSBC account is private banking · high confidentiality.', '{international,rapid-movement,dispersal-pattern,private-banking}'),
	('TX-1095', 'ALERT-0110', '2025-11-25', '09:00', 'ACH Credit - Management Consulting Fee', 'ach_credit', 'Meridian Capital Advisory LLC', 'entity', 135000, 210000, false, 'USA', 'Miami', 'Large consulting fee credit. Entity incorporated in Delaware, Miami address. Fee is 75% of customer''s stated annual income in a single payment.', '{}'),
	('TX-1090', 'ALERT-0110', '2025-11-18', '11:30', 'Wire Transfer - Domestic', 'wire_transfer', 'Hall Financial Services LLC', 'entity', 85000, 90000, false, 'USA', 'Miami', 'Transfer to controlled entity (customer is sole member).', '{}'),
	('TX-1085', 'ALERT-0110', '2025-11-10', '10:00', 'ACH Credit - Investment Return', 'ach_credit', 'Coral Springs Investment Fund', 'entity', 45000, 48000, false, 'USA', 'Fort Lauderdale', 'Investment distribution · consistent with financial consultant activity.', '{}'),
	('TX-1078', 'ALERT-0110', '2025-10-28', '09:00', 'ACH Debit - Professional Services', 'ach_debit', 'Legal & Compliance Group PA', 'vendor', -8500, 12000, false, 'USA', 'Miami', 'Routine legal/compliance services payment.', '{}'),
	('TX-1072', 'ALERT-0110', '2025-10-15', '14:00', 'ACH Credit - Referral Fee', 'ach_credit', 'Southeast Capital Partners', 'entity', 22000, 25000, false, 'USA', 'Miami', 'Referral fee for client introductions · normal for financial consulting.', '{}'),
	('TX-1111', 'ALERT-0111', '2025-12-10', '19:30', 'P2P Transfer - Venmo', 'p2p_transfer', '@kai.chen.dev (Venmo)', 'p2p', 2850, 14200, true, 'USA', 'Austin', 'Flagged for keyword ''delta force'' in transfer memo. Investigation confirmed this refers to ''Delta Force Sprint'' · an internal hackathon event at employer. Recurring transfers in same group.', '{high-risk-keyword}'),
	('TX-1112', 'ALERT-0111', '2025-12-11', '08:15', 'P2P Transfer - Venmo', 'p2p_transfer', '@priya.dev.austin (Venmo)', 'p2p', 1900, 16100, true, 'USA', 'Austin', 'Memo: ''delta sprint hotel split''. Same colleague group as TX-1111. Hotel cost-sharing for company event in Seattle.', '{high-risk-keyword}'),
	('TX-1113', 'ALERT-0111', '2025-12-12', '12:00', 'P2P Transfer - Venmo', 'p2p_transfer', '@marcus.wei (Venmo)', 'p2p', 1750, 17850, true, 'USA', 'Austin', 'Memo: ''delta flights reimbursement''. Flight cost reimbursement · Seattle team sprint trip.', '{high-risk-keyword}'),
	('TX-1110', 'ALERT-0111', '2025-12-09', '07:30', 'Direct Deposit - Payroll', 'ach_credit', 'Synapse Technologies Inc Payroll', 'ach', 5625, 9400, false, 'USA', '', 'Bi-weekly payroll deposit. Annualized: $146,250 · consistent with $135K stated income plus overtime.', '{}'),
	('TX-1105', 'ALERT-0111', '2025-12-05', '09:00', 'ACH Debit - Mortgage Payment', 'ach_debit', 'Austin Home Lending LLC', 'bank', -2300, 6800, false, 'USA', 'Austin', 'Regular monthly mortgage payment.', '{}'),
	('TX-1098', 'ALERT-0111', '2025-11-25', '07:30', 'Direct Deposit - Payroll', 'ach_credit', 'Synapse Technologies Inc Payroll', 'ach', 5625, 11200, false, 'USA', '', 'Bi-weekly payroll · consistent with salary structure.', '{}'),
	('TX-1088', 'ALERT-0111', '2025-11-15', '14:00', 'Purchase - Travel', 'debit_purchase', 'Delta Air Lines', 'merchant', -487, 6100, true, 'USA', '', 'Airfare purchase at Delta Air Lines. System flagged ''delta'' keyword in merchant name. Context: legitimate airline travel for work sprint in Seattle.', '{high-risk-keyword}'),
	('TX-1079', 'ALERT-0111', '2025-11-10', '11:30', 'Purchase - Hotel', 'debit_purchase', 'Marriott Seattle Downtown', 'merchant', -1425, 7800, false, 'USA', 'Seattle', 'Hotel booking for company hackathon in Seattle · consistent with travel reimbursement pattern.', '{}'),
	('TX-1068', 'ALERT-0111', '2025-10-30', '09:00', 'Direct Deposit - Payroll', 'ach_credit', 'Synapse Technologies Inc Payroll', 'ach', 5625, 10200, false, 'USA', '', 'Regular bi-weekly payroll.', '{}'),
	('TX-1058', 'ALERT-0111', '2025-10-15', '19:00', 'P2P Transfer - Venmo', 'p2p_transfer', '@kai.chen.dev (Venmo)', 'p2p', 900, 7400, false, 'USA', 'Austin', 'Reciprocal reimbursement from prior trip · normal cost-sharing group.', '{}'),
	('TX-1121', 'ALERT-0112', '2025-12-08', '10:00', 'Wire Transfer - IOLTA Trust', 'wire_transfer', '1st National Escrow Services', 'entity', -250000, 480000, true, 'USA', 'Chicago', 'Large round-number outbound wire from attorney trust account to escrow company. IOLTA (Interest on Lawyer Trust Accounts) transfers commonly show large round amounts · client funds for real estate closings.', '{large-transfer,round-amount}'),
	('TX-1122', 'ALERT-0112', '2025-12-10', '14:00', 'Wire Transfer - IOLTA Trust', 'wire_transfer', 'Cook County Circuit Court - Clerk', 'entity', -50000, 430000, true, 'USA', 'Chicago', 'Payment to Cook County Circuit Court · consistent with court-ordered payments or bond/settlement funds managed by attorney.', '{round-amount,large-transfer}'),
	('TX-1123', 'ALERT-0112', '2025-12-12', '09:30', 'Wire Transfer - IOLTA Disbursement', 'wire_transfer', 'Wainwright Law LLC Operating Acct', 'entity', -75000, 355000, true, 'USA', 'Chicago', 'Transfer from trust to operating account · attorney fee withdrawal. $75K fee consistent with large commercial litigation settlement.', '{round-amount,internal-transfer}'),
	('TX-1115', 'ALERT-0112', '2025-12-05', '11:00', 'Wire Transfer - Client Funds Received', 'wire_transfer', 'Harrison Industrial Corp', 'entity', 300000, 730000, true, 'USA', 'Detroit', 'Large inbound wire · client escrow deposit for commercial acquisition. Harrison Industrial is counterparty in pending M&A transaction.', '{large-transfer,round-amount}'),
	('TX-1108', 'ALERT-0112', '2025-11-29', '10:00', 'Wire Transfer - Client Funds Received', 'wire_transfer', 'Lakeview Partners LLC', 'entity', 180000, 430000, false, 'USA', 'Chicago', 'Client trust funds for commercial real estate closing · supporting escrow agreement on file.', '{}'),
	('TX-1100', 'ALERT-0112', '2025-11-20', '09:00', 'ACH Debit - Payroll', 'ach_debit', 'Wainwright Law LLC Payroll', 'ach', -65000, 290000, false, 'USA', '', 'Monthly payroll for law firm staff · 5 associates and 2 support staff.', '{}'),
	('TX-1090', 'ALERT-0112', '2025-11-15', '14:00', 'Wire Transfer - Opposing Counsel Settlement', 'wire_transfer', 'Johnson & Reed LLP Escrow', 'entity', -120000, 380000, false, 'USA', 'Chicago', 'Settlement disbursement to opposing counsel escrow · civil litigation resolution. Court order on file.', '{}'),
	('TX-1082', 'ALERT-0112', '2025-11-01', '11:00', 'ACH Credit - Retainer Deposit', 'ach_credit', 'Midwest Equity Group Inc', 'entity', 50000, 420000, false, 'USA', 'Chicago', 'Client retainer for M&A advisory work · engagement letter on file.', '{}');


ALTER TABLE public.transactions ENABLE TRIGGER ALL;

--
-- Name: connectors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.connectors_id_seq', 8, true);


--
-- Name: customer_risk_factors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_risk_factors_id_seq', 22, true);


--
-- Name: investigation_journal_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.investigation_journal_id_seq', 70, true);


--
-- Name: investigation_risk_factors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.investigation_risk_factors_id_seq', 32, true);


--
-- Name: journal_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.journal_steps_id_seq', 54, true);


--
-- Name: models_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.models_id_seq', 4, true);


--
-- Name: network_edges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.network_edges_id_seq', 35, true);


--
-- Name: network_nodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.network_nodes_id_seq', 36, true);


--
-- Name: sar_audit_trail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sar_audit_trail_id_seq', 9, true);


--
-- Name: timeline_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.timeline_entries_id_seq', 44, true);


--
-- PostgreSQL database dump complete
--

\unrestrict rVpRdbfMuSLCLw00sy80VUi0zrhz2KgwEcnRCn1lImpSemsScZfDgQRyXA8l6SM

