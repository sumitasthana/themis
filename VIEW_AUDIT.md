# Themis Platform - View Accessibility Audit

## All Available Views
1. dashboard - Dashboard View ✓
2. alerts - Alerts View ✓
3. cases - Cases View ✓
4. transactions - Transactions View ✓
5. network - Network Detection View ✓
6. sar-list - SAR List View ✓
7. screening - Screening View ✓
8. model - Model Governance View ✓
9. settings - Data Sources View ✓
10. customer-detail - Customer Detail View ✓
11. alert-detail - Alert Detail View ✓
12. case-detail - Case Detail View ✓
13. sar-detail - SAR Detail View ✓
14. anomaly-detail - Anomaly Detail View ✓

## Persona Access Matrix

### AN - AML Analyst
- ✓ dashboard
- ✓ alerts
- ✓ transactions
- ✓ screening
- ✓ customer-detail
- ✓ alert-detail

**Missing:** cases, network, sar-list, model, settings, case-detail, sar-detail, anomaly-detail

### IN - AML Investigator
- ✓ dashboard
- ✓ alerts
- ✓ cases
- ✓ transactions
- ✓ network
- ✓ customer-detail
- ✓ alert-detail
- ✓ case-detail
- ✓ anomaly-detail

**Missing:** sar-list, screening, model, settings, sar-detail

### CO - Compliance Officer
- ✓ dashboard
- ✓ cases
- ✓ sar-list
- ✓ screening
- ✓ case-detail
- ✓ sar-detail

**Missing:** alerts, transactions, network, model, settings, customer-detail, alert-detail, anomaly-detail

### MG - AML Ops Manager (UPDATED)
- ✓ dashboard
- ✓ alerts
- ✓ cases
- ✓ sar-list
- ✓ model
- ✓ screening (ADDED)
- ✓ transactions (ADDED)
- ✓ alert-detail
- ✓ case-detail

**Missing:** network, settings, customer-detail, sar-detail, anomaly-detail

### DS - Data Scientist
- ✓ dashboard
- ✓ model
- ✓ settings

**Missing:** alerts, cases, transactions, network, sar-list, screening, customer-detail, alert-detail, case-detail, sar-detail, anomaly-detail

### RG - Regulator
- ✓ dashboard
- ✓ sar-list
- ✓ model
- ✓ sar-detail

**Missing:** alerts, cases, transactions, network, screening, settings, customer-detail, alert-detail, case-detail, anomaly-detail

## Issues Fixed

1. **Manager (MG) - Screening Access**
   - Issue: Manager persona couldn't access Screening view
   - Fix: Added "screening" and "transactions" to Manager's allowed views
   - Status: ✓ FIXED

## Recommendations

### Suggested View Additions

**AML Analyst (AN):**
- Consider adding: network (for relationship analysis)

**Compliance Officer (CO):**
- Consider adding: alerts (to review flagged alerts before SAR)
- Consider adding: transactions (for transaction review)

**AML Ops Manager (MG):**
- Consider adding: network (for oversight of ML detection)
- Consider adding: anomaly-detail (for reviewing detected anomalies)

**Data Scientist (DS):**
- Consider adding: alerts (to analyze model performance)
- Consider adding: transactions (for model training data review)

**Regulator (RG):**
- Current access is appropriate (dashboard, SAR list, SAR detail, model governance)

## All Views Verified

All 14 views have been verified to render content:
- ✓ All views have proper data sources
- ✓ All views have UI components
- ✓ No blank screens detected
- ✓ All navigation paths working
