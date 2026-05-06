import { useState, useRef, useEffect } from "react";
import AGENTS_REGISTRY from "./agents/agents.json";

// Centralized libraries loaded at build time by Vite
const SKILL_MODULES  = import.meta.glob("./skills/aml/*.md",  { query:"?raw", import:"default", eager:true });
const PROMPT_MODULES = import.meta.glob("./prompts/*.yaml",   { query:"?raw", import:"default", eager:true });

// ============================================================
// THEMIS by INCEDO · Complete AML Intelligence Platform
// ============================================================

// --- BRAND (Kratos-inspired) --------------------------------
const NAVY = "#0c1f3d", NAVY_MID = "#1a3358", NAVY_LIGHT = "#e8eef7";
const ORANGE = "#e85d20"; // Themis accent

// --- SHARED UTILS (Kratos colors) ---------------------------
const rc  = l => ({HIGH:"#b45309",CRITICAL:"#b91c1c",MEDIUM:"#1d4ed8",LOW:"#1a7f4b"})[l]||"#6b7280";
const rb  = l => ({HIGH:"#fef3cd",CRITICAL:"#fde8e8",MEDIUM:"#eff4ff",LOW:"#e6f5ee"})[l]||"#f3f4f6";
const sc  = s => ({CLEAR:"#1a7f4b",ESCALATE:"#b91c1c",REVIEW:"#b45309",OPEN:"#1d4ed8",
  DRAFT:"#6d28d9",IN_REVIEW:"#b45309",SUBMITTED:"#1a7f4b",UNDER_REVIEW:"#b45309",
  CRITICAL:"#b91c1c",HIGH:"#b45309",MEDIUM:"#1d4ed8",LOW:"#1a7f4b",
  CONNECTED:"#1a7f4b",DISCONNECTED:"#b91c1c",POTENTIAL:"#b45309",NO_MATCH:"#1a7f4b"})[s]||"#6b7280";
const fm  = n => n>=1e6?`$${(n/1e6).toFixed(1)}M`:n>=1e3?`$${(n/1e3).toFixed(0)}K`:`$${n}`;
const fd  = d => new Date(d).toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"});

const Badge = ({label,color,bg,small})=>(
  <span style={{background:bg||rb(label),color:color||rc(label),fontSize:small?10:11,fontWeight:600,
    padding:small?"1px 6px":"2px 8px",borderRadius:4,letterSpacing:"0.03em",whiteSpace:"nowrap"}}>{label}</span>
);
const Pill = ({label,color="#15803D",bg="#DCFCE7"})=>(
  <span style={{display:"inline-flex",alignItems:"center",gap:4,background:bg,color,fontSize:11,
    fontWeight:700,padding:"2px 9px",borderRadius:20}}>
    <span style={{width:6,height:6,borderRadius:"50%",background:color,display:"inline-block"}}/>
    {label}
  </span>
);
const SH = ({title,sub,action})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
    <div>
      <div style={{fontSize:17,fontWeight:800,color:"#0F172A",letterSpacing:"-0.01em"}}>{title}</div>
      {sub&&<div style={{fontSize:12,color:"#64748B",marginTop:3}}>{sub}</div>}
    </div>
    {action}
  </div>
);
const KV = ({label,value,mono,color})=>(
  <div>
    <div style={{fontSize:10,color:"#94A3B8",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:3}}>{label}</div>
    <div style={{fontWeight:600,color:color||"#334155",fontSize:13,fontFamily:mono?"monospace":"inherit"}}>{value}</div>
  </div>
);
const MCard = ({label,value,sub,color,onClick})=>(
  <div onClick={onClick} style={{background:"white",borderRadius:12,padding:"16px 20px",
    boxShadow:"0 1px 4px rgba(0,0,0,0.07)",border:"1px solid #E2E8F0",flex:1,minWidth:120,
    cursor:onClick?"pointer":"default",transition:"box-shadow 0.15s"}}
    onMouseEnter={e=>onClick&&(e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,0.12)")}
    onMouseLeave={e=>onClick&&(e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.07)")}>
    <div style={{fontSize:10,color:"#94A3B8",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6}}>{label}</div>
    <div style={{fontSize:28,fontWeight:800,color:color||"#0F172A",fontFamily:"monospace",letterSpacing:"-0.02em"}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#64748B",marginTop:4,fontWeight:500}}>{sub}</div>}
  </div>
);

// --- Data -----------------------------------------------------
const CUSTOMERS = {
  "C-8518-0100":{id:"C-8518-0100",name:"Jeremiah Garcia",dob:"1990-07-09",ssn:"****4821",phone:"(555) 412-7789",
    email:"jeremiah.garcia8518@example.com",address:"412 Willowcrest Ave, Sacramento, CA 95823",
    occupation:"Owner, Neighborhood Convenience Store (LLC)",statedIncome:42000,customerRisk:28,
    customerRiskLevel:"LOW",alertRisk:52,alertRiskLevel:"MEDIUM",
    accountType:"Small Business Checking / Personal Linked",opened:"2022-03-15",country:"USA",
    amlStatus:"Approved",priorAlerts:1,nationality:"US",
    riskFactors:[
      {factor:"Cash-intensive business",weight:0.28,direction:"up",detail:"Convenience stores have high cash throughput, increasing structuring risk"},
      {factor:"Transaction velocity spike",weight:0.24,direction:"up",detail:"340% above 90-day baseline in flagged window"},
      {factor:"Multi-branch same-day deposits",weight:0.22,direction:"up",detail:"3 branches visited in single day is atypical for customer profile"},
      {factor:"Stated income alignment",weight:0.15,direction:"down",detail:"Payroll inflows consistent with $42K stated income · mitigating"},
      {factor:"Prior alert dismissed",weight:0.11,direction:"down",detail:"AL-0042 cleared with receipts in 2024 · favorable history"},
    ]},
  "C-7712-0108":{id:"C-7712-0108",name:"Ryan Torres",dob:"1985-03-22",ssn:"****9132",phone:"(555) 208-4401",
    email:"r.torres7712@example.com",address:"88 Pacific Rim Blvd, San Francisco, CA 94105",
    occupation:"Import/Export Consultant",statedIncome:95000,customerRisk:68,customerRiskLevel:"MEDIUM",
    alertRisk:81,alertRiskLevel:"HIGH",
    accountType:"Business Checking",opened:"2021-07-10",country:"USA",amlStatus:"Under Review",priorAlerts:3,nationality:"US",
    riskFactors:[
      {factor:"International wire frequency",weight:0.32,direction:"up",detail:"14 international wires in 30 days to high-risk jurisdictions"},
      {factor:"Counterparty risk score",weight:0.26,direction:"up",detail:"2 counterparties on enhanced monitoring lists"},
      {factor:"High-risk jurisdiction exposure",weight:0.20,direction:"up",detail:"Panama and Cayman Islands routing"},
      {factor:"Business income plausibility",weight:0.14,direction:"up",detail:"Import/export volumes exceed stated revenue by 3.2x"},
      {factor:"Account age",weight:0.08,direction:"down",detail:"3+ year relationship with no prior enforcement"},
    ]},
  "C-4490-0109":{id:"C-4490-0109",name:"Neal Hall",dob:"1978-11-05",ssn:"****3374",phone:"(555) 619-2200",
    email:"neal.hall4490@example.com",address:"17 Sunset Blvd, Los Angeles, CA 90028",
    occupation:"Real Estate Developer",statedIncome:250000,customerRisk:71,customerRiskLevel:"HIGH",
    alertRisk:89,alertRiskLevel:"CRITICAL",
    accountType:"Business Checking / Linked LLC",opened:"2019-04-28",country:"USA",amlStatus:"Enhanced Monitoring",priorAlerts:5,nationality:"US",
    riskFactors:[
      {factor:"Structuring pattern confirmed",weight:0.35,direction:"up",detail:"9 deposits between $8,900·$9,800 on consecutive days across 3 branches"},
      {factor:"Shell entity network",weight:0.28,direction:"up",detail:"Linked to 3 entities with no web presence or known staff"},
      {factor:"Real estate layering risk",weight:0.20,direction:"up",detail:"Real estate is a known vehicle for placement and layering"},
      {factor:"Geographic dispersion",weight:0.10,direction:"up",detail:"Branches in different counties · deliberate dispersion pattern"},
      {factor:"Prior SAR history",weight:0.07,direction:"up",detail:"Subject of 2 prior SARs filed by other institutions"},
    ]},
  "C-3381-0110":{id:"C-3381-0110",name:"David Hall",dob:"1982-06-18",ssn:"****7721",phone:"(555) 703-9988",
    email:"david.hall3381@example.com",address:"220 Marina View Dr, Miami, FL 33132",
    occupation:"Financial Consultant",statedIncome:180000,customerRisk:21,customerRiskLevel:"LOW",
    alertRisk:55,alertRiskLevel:"MEDIUM",
    accountType:"Personal Checking",opened:"2023-01-15",country:"USA",amlStatus:"Approved",priorAlerts:0,nationality:"US",
    riskFactors:[
      {factor:"International wire pattern",weight:0.40,direction:"up",detail:"Circular movement detected between 4 accounts"},
      {factor:"New account activity",weight:0.25,direction:"up",detail:"Account opened Jan 2023 · high activity from month 1"},
      {factor:"No prior history",weight:0.35,direction:"down",detail:"Zero prior alerts · clean history mitigates suspicion"},
    ]},
  "C-5502-0111":{id:"C-5502-0111",name:"Marisol Nguyen-Kelley",dob:"1993-09-12",ssn:"****5509",phone:"(555) 441-0034",
    email:"marisol.nk5502@example.com",address:"5 Westgate Ave, Austin, TX 78701",
    occupation:"Software Engineer",statedIncome:135000,customerRisk:27,customerRiskLevel:"LOW",
    alertRisk:38,alertRiskLevel:"LOW",
    accountType:"Personal Checking",opened:"2020-11-02",country:"USA",amlStatus:"Approved",priorAlerts:0,nationality:"US",
    riskFactors:[
      {factor:"High-risk keyword in transactions",weight:0.55,direction:"up",detail:"'green light' phrase found in P2P transfers"},
      {factor:"Strong income documentation",weight:0.45,direction:"down",detail:"Tech salary fully documented and aligns with spend"},
    ]},
  "C-6613-0112":{id:"C-6613-0112",name:"Darius J. Wainwright",dob:"1975-02-28",ssn:"****8843",phone:"(555) 502-7761",
    email:"d.wainwright6613@example.com",address:"900 Lakewood Rd, Chicago, IL 60601",
    occupation:"Attorney",statedIncome:320000,customerRisk:27,customerRiskLevel:"LOW",
    alertRisk:41,alertRiskLevel:"LOW",
    accountType:"Professional Business Checking",opened:"2018-06-20",country:"USA",amlStatus:"Approved",priorAlerts:1,nationality:"US",
    riskFactors:[
      {factor:"Large round-number transfers",weight:0.48,direction:"up",detail:"Multiple $50K transfers flagged for round amounts"},
      {factor:"Attorney IOLTA patterns",weight:0.52,direction:"down",detail:"Law firm client trust accounts commonly show large round transfers"},
    ]},
};

const ALERTS = [
  {id:"ALERT-0100",date:"2025-12-01",customerId:"C-8518-0100",typologies:["RapidCashDeposits","StructuredDeposits","VelocityIncrease","RoundAmounts"],txns:192,flagged:3,status:"CLEAR",confidence:85,alertRisk:52,alertRiskLevel:"MEDIUM",agentDecision:"CLEAR",inflow:78950,outflow:20684},
  {id:"ALERT-0108",date:"2025-12-11",customerId:"C-7712-0108",typologies:["InternationalWire","HighRiskKeyword","VelocityIncrease"],txns:700,flagged:2,status:"ESCALATE",confidence:72,alertRisk:81,alertRiskLevel:"HIGH",agentDecision:"ESCALATE",inflow:340000,outflow:285000},
  {id:"ALERT-0109",date:"2025-12-12",customerId:"C-4490-0109",typologies:["HighRiskKeyword","VelocityIncrease","StructuredDeposits"],txns:1091,flagged:9,status:"ESCALATE",confidence:80,alertRisk:89,alertRiskLevel:"CRITICAL",agentDecision:"ESCALATE",inflow:1250000,outflow:980000},
  {id:"ALERT-0110",date:"2025-12-12",customerId:"C-3381-0110",typologies:["InternationalWire","HighRiskKeyword","CircularMovement"],txns:560,flagged:2,status:"ESCALATE",confidence:80,alertRisk:55,alertRiskLevel:"MEDIUM",agentDecision:"ESCALATE",inflow:210000,outflow:195000},
  {id:"ALERT-0111",date:"2025-12-15",customerId:"C-5502-0111",typologies:["HighRiskKeyword","VelocityIncrease"],txns:717,flagged:9,status:"CLEAR",confidence:85,alertRisk:38,alertRiskLevel:"LOW",agentDecision:"CLEAR",inflow:145000,outflow:130000},
  {id:"ALERT-0112",date:"2025-12-17",customerId:"C-6613-0112",typologies:["HighRiskKeyword","VelocityIncrease","RoundAmounts"],txns:586,flagged:14,status:"CLEAR",confidence:85,alertRisk:41,alertRiskLevel:"LOW",agentDecision:"CLEAR",inflow:490000,outflow:445000},
];

const TRANSACTIONS = {
  "ALERT-0100":[
    {id:"TX-9851",date:"2025-11-29",time:"09:12",desc:"Cash Deposit - In Branch",category:"cash_deposit",counterparty:"Branch - Del Paso Heights (Branch #103)",cpType:"branch",amount:3600,balance:41210,flagged:true,country:"USA",city:"Sacramento",notes:"Multi-branch same-day deposit #1 of 3. Amount below $10K CTR threshold.",riskIndicators:["sub-threshold amount","multi-branch"]},
    {id:"TX-9853",date:"2025-11-29",time:"13:45",desc:"Cash Deposit - In Branch",category:"cash_deposit",counterparty:"Branch - Midtown Sacramento",cpType:"branch",amount:3500,balance:50710,flagged:true,country:"USA",city:"Sacramento",notes:"Multi-branch same-day deposit #2 of 3. Second branch visited same day.",riskIndicators:["sub-threshold amount","multi-branch","velocity"]},
    {id:"TX-9857",date:"2025-11-29",time:"16:36",desc:"Cash Deposit - In Branch",category:"cash_deposit",counterparty:"Branch - Oak Park (Branch #07)",cpType:"branch",amount:9700,balance:60410,flagged:true,country:"USA",city:"Sacramento",notes:"Multi-branch same-day deposit #3 of 3. Largest deposit still below $10K.",riskIndicators:["sub-threshold amount","multi-branch","round-proximate"]},
    {id:"TX-9820",date:"2025-11-01",time:"10:00",desc:"Card Processor - Stripe",category:"card_receipt",counterparty:"Card Processor - Stripe",cpType:"processor",amount:4200,balance:38100,flagged:false,country:"USA",city:"Online",notes:"Regular merchant settlement from point-of-sale operations.",riskIndicators:[]},
    {id:"TX-9801",date:"2025-10-28",time:"14:22",desc:"ATM Withdrawal",category:"cash_withdrawal",counterparty:"Cash Withdrawal ATM",cpType:"atm",amount:-1200,balance:33900,flagged:false,country:"USA",city:"Sacramento",notes:"Routine ATM withdrawal within normal range.",riskIndicators:[]},
    {id:"TX-9790",date:"2025-10-15",time:"08:00",desc:"Payroll ACH Credit",category:"ach_credit",counterparty:"Garcia Convenience LLC Payroll",cpType:"ach",amount:3500,balance:35100,flagged:false,country:"USA",city:"",notes:"Bi-weekly payroll deposit consistent with stated income.",riskIndicators:[]},
    {id:"TX-9780",date:"2025-10-01",time:"08:00",desc:"Payroll ACH Credit",category:"ach_credit",counterparty:"Garcia Convenience LLC Payroll",cpType:"ach",amount:3500,balance:31600,flagged:false,country:"USA",city:"",notes:"Bi-weekly payroll deposit consistent with stated income.",riskIndicators:[]},
  ],
  "ALERT-0109":[
    {id:"TX-1091",date:"2025-12-01",time:"08:00",desc:"Cash Deposit",category:"cash_deposit",counterparty:"Branch - Hollywood",cpType:"branch",amount:8900,balance:500000,flagged:true,country:"USA",city:"Los Angeles",notes:"Day 1 of structuring pattern. Amount is $1,100 below CTR threshold.",riskIndicators:["structuring","sub-threshold"]},
    {id:"TX-1092",date:"2025-12-02",time:"09:30",desc:"Cash Deposit",category:"cash_deposit",counterparty:"Branch - Burbank",cpType:"branch",amount:9500,balance:509500,flagged:true,country:"USA",city:"Burbank",notes:"Day 2, different branch. Systematic below-threshold pattern.",riskIndicators:["structuring","sub-threshold","multi-branch"]},
    {id:"TX-1093",date:"2025-12-03",time:"10:00",desc:"Wire Transfer - Domestic",category:"wire_transfer",counterparty:"Nexus Realty LLC",cpType:"entity",amount:95000,balance:604500,flagged:true,country:"USA",city:"",notes:"Large domestic wire to shell entity. No apparent business purpose documented.",riskIndicators:["shell-entity","large-transfer","no-documentation"]},
    {id:"TX-1094",date:"2025-12-04",time:"11:15",desc:"Cash Deposit",category:"cash_deposit",counterparty:"Branch - Downtown LA",cpType:"branch",amount:9800,balance:614300,flagged:true,country:"USA",city:"Los Angeles",notes:"Day 4, third branch location. Pattern continues.",riskIndicators:["structuring","sub-threshold","multi-branch"]},
    {id:"TX-1095",date:"2025-12-05",time:"14:00",desc:"International Wire",category:"wire_transfer",counterparty:"Deutsche Bank Frankfurt",cpType:"bank",amount:-200000,balance:414300,flagged:true,country:"DEU",city:"Frankfurt",notes:"Large outbound international wire to Germany. Real estate pretext unverified.",riskIndicators:["international","high-risk-jurisdiction","large-transfer"]},
    {id:"TX-1085",date:"2025-11-20",time:"09:00",desc:"Payroll Deposit",category:"ach_credit",counterparty:"Hall Development Corp",cpType:"ach",amount:20000,balance:390000,flagged:false,country:"USA",city:"",notes:"Monthly business income · plausible for real estate developer.",riskIndicators:[]},
    {id:"TX-1080",date:"2025-11-10",time:"11:30",desc:"Property Management Fees",category:"ach_credit",counterparty:"Pacific Properties LLC",cpType:"entity",amount:15000,balance:370000,flagged:false,country:"USA",city:"",notes:"Routine property management income.",riskIndicators:[]},
  ],
  "ALERT-0108":[
    {id:"TX-1081",date:"2025-12-05",time:"11:00",desc:"Wire Transfer - International",category:"wire_transfer",counterparty:"HSBC Panama Branch",cpType:"bank",amount:-85000,balance:125000,flagged:true,country:"PAN",city:"Panama City",notes:"Outbound wire to Panama · FATF grey-listed jurisdiction. No trade documentation or business purpose provided. Recipient account opened 6 months ago.",riskIndicators:["international","high-risk-jurisdiction","large-transfer","no-documentation"]},
    {id:"TX-1082",date:"2025-12-08",time:"09:30",desc:"Wire Transfer - International",category:"wire_transfer",counterparty:"Barclays London - Correspondent",cpType:"bank",amount:-120000,balance:5000,flagged:true,country:"GBR",city:"London",notes:"Second large outbound international wire within 3 days, nearly depleting account. Rapid layering pattern. London correspondent account has no prior relationship with customer.",riskIndicators:["international","rapid-movement","large-transfer","rapid-depletion"]},
    {id:"TX-1075",date:"2025-11-28",time:"14:00",desc:"ACH Credit - Trade Invoice",category:"ach_credit",counterparty:"Global Trade Partners Inc",cpType:"entity",amount:210000,balance:210000,flagged:true,country:"USA",city:"San Francisco",notes:"Large ACH credit from entity with no prior relationship. Described as 'trade invoice' but no shipping documents or trade contracts on file. Account was dormant 14 months before this credit.",riskIndicators:["dormant-reactivation","undocumented-source","large-inflow"]},
    {id:"TX-1070",date:"2025-11-14",time:"10:00",desc:"ACH Credit - Consulting Retainer",category:"ach_credit",counterparty:"Pacific Rim Trade Advisors LLC",cpType:"entity",amount:50000,balance:52000,flagged:false,country:"USA",city:"San Francisco",notes:"Monthly consulting retainer consistent with import/export advisory role.",riskIndicators:[]},
    {id:"TX-1065",date:"2025-11-01",time:"09:00",desc:"ACH Credit - Invoice Payment",category:"ach_credit",counterparty:"AsiaLink Commerce Group",cpType:"entity",amount:35000,balance:38000,flagged:false,country:"USA",city:"",notes:"Invoice payment from known client · documented in engagement file.",riskIndicators:[]},
    {id:"TX-1055",date:"2025-10-15",time:"14:30",desc:"Wire Transfer - Domestic",category:"wire_transfer",counterparty:"Torres Logistics Solutions LLC",cpType:"entity",amount:-28000,balance:18000,flagged:false,country:"USA",city:"",notes:"Payment to controlled entity · Torres 100% owner of logistics company.",riskIndicators:[]},
    {id:"TX-1045",date:"2025-10-01",time:"11:00",desc:"ACH Debit - Office Lease",category:"ach_debit",counterparty:"Pacific Rim Business Center",cpType:"landlord",amount:-4200,balance:41000,flagged:false,country:"USA",city:"San Francisco",notes:"Monthly office lease payment · consistent with stated consulting business.",riskIndicators:[]},
  ],
  "ALERT-0110":[
    {id:"TX-1101",date:"2025-12-03",time:"10:15",desc:"Wire Transfer - International",category:"wire_transfer",counterparty:"Banco Santander Cayman Islands",cpType:"bank",amount:-75000,balance:135000,flagged:true,country:"CYM",city:"George Town",notes:"Outbound wire to Cayman Islands · offshore jurisdiction. Described as 'investment account transfer' but no investment documentation provided. Cayman account has no prior relationship.",riskIndicators:["international","offshore-jurisdiction","large-transfer","no-documentation"]},
    {id:"TX-1102",date:"2025-12-07",time:"14:30",desc:"Wire Transfer - International",category:"wire_transfer",counterparty:"HSBC Hong Kong Private Banking",cpType:"bank",amount:-55000,balance:80000,flagged:true,country:"HKG",city:"Hong Kong",notes:"Second international outbound wire within 4 days. Pattern of dispersal to multiple offshore accounts. Hong Kong HSBC account is private banking · high confidentiality.",riskIndicators:["international","rapid-movement","dispersal-pattern","private-banking"]},
    {id:"TX-1095",date:"2025-11-25",time:"09:00",desc:"ACH Credit - Management Consulting Fee",category:"ach_credit",counterparty:"Meridian Capital Advisory LLC",cpType:"entity",amount:135000,balance:210000,flagged:false,country:"USA",city:"Miami",notes:"Large consulting fee credit. Entity incorporated in Delaware, Miami address. Fee is 75% of customer's stated annual income in a single payment.",riskIndicators:[]},
    {id:"TX-1090",date:"2025-11-18",time:"11:30",desc:"Wire Transfer - Domestic",category:"wire_transfer",counterparty:"Hall Financial Services LLC",cpType:"entity",amount:85000,balance:90000,flagged:false,country:"USA",city:"Miami",notes:"Transfer to controlled entity (customer is sole member).",riskIndicators:[]},
    {id:"TX-1085",date:"2025-11-10",time:"10:00",desc:"ACH Credit - Investment Return",category:"ach_credit",counterparty:"Coral Springs Investment Fund",cpType:"entity",amount:45000,balance:48000,flagged:false,country:"USA",city:"Fort Lauderdale",notes:"Investment distribution · consistent with financial consultant activity.",riskIndicators:[]},
    {id:"TX-1078",date:"2025-10-28",time:"09:00",desc:"ACH Debit - Professional Services",category:"ach_debit",counterparty:"Legal & Compliance Group PA",cpType:"vendor",amount:-8500,balance:12000,flagged:false,country:"USA",city:"Miami",notes:"Routine legal/compliance services payment.",riskIndicators:[]},
    {id:"TX-1072",date:"2025-10-15",time:"14:00",desc:"ACH Credit - Referral Fee",category:"ach_credit",counterparty:"Southeast Capital Partners",cpType:"entity",amount:22000,balance:25000,flagged:false,country:"USA",city:"Miami",notes:"Referral fee for client introductions · normal for financial consulting.",riskIndicators:[]},
  ],
  "ALERT-0111":[
    {id:"TX-1111",date:"2025-12-10",time:"19:30",desc:"P2P Transfer - Venmo",category:"p2p_transfer",counterparty:"@kai.chen.dev (Venmo)",cpType:"p2p",amount:2850,balance:14200,flagged:true,country:"USA",city:"Austin",notes:"Flagged for keyword 'delta force' in transfer memo. Investigation confirmed this refers to 'Delta Force Sprint' · an internal hackathon event at employer. Recurring transfers in same group.",riskIndicators:["high-risk-keyword"]},
    {id:"TX-1112",date:"2025-12-11",time:"08:15",desc:"P2P Transfer - Venmo",category:"p2p_transfer",counterparty:"@priya.dev.austin (Venmo)",cpType:"p2p",amount:1900,balance:16100,flagged:true,country:"USA",city:"Austin",notes:"Memo: 'delta sprint hotel split'. Same colleague group as TX-1111. Hotel cost-sharing for company event in Seattle.",riskIndicators:["high-risk-keyword"]},
    {id:"TX-1113",date:"2025-12-12",time:"12:00",desc:"P2P Transfer - Venmo",category:"p2p_transfer",counterparty:"@marcus.wei (Venmo)",cpType:"p2p",amount:1750,balance:17850,flagged:true,country:"USA",city:"Austin",notes:"Memo: 'delta flights reimbursement'. Flight cost reimbursement · Seattle team sprint trip.",riskIndicators:["high-risk-keyword"]},
    {id:"TX-1110",date:"2025-12-09",time:"07:30",desc:"Direct Deposit - Payroll",category:"ach_credit",counterparty:"Synapse Technologies Inc Payroll",cpType:"ach",amount:5625,balance:9400,flagged:false,country:"USA",city:"",notes:"Bi-weekly payroll deposit. Annualized: $146,250 · consistent with $135K stated income plus overtime.",riskIndicators:[]},
    {id:"TX-1105",date:"2025-12-05",time:"09:00",desc:"ACH Debit - Mortgage Payment",category:"ach_debit",counterparty:"Austin Home Lending LLC",cpType:"bank",amount:-2300,balance:6800,flagged:false,country:"USA",city:"Austin",notes:"Regular monthly mortgage payment.",riskIndicators:[]},
    {id:"TX-1098",date:"2025-11-25",time:"07:30",desc:"Direct Deposit - Payroll",category:"ach_credit",counterparty:"Synapse Technologies Inc Payroll",cpType:"ach",amount:5625,balance:11200,flagged:false,country:"USA",city:"",notes:"Bi-weekly payroll · consistent with salary structure.",riskIndicators:[]},
    {id:"TX-1088",date:"2025-11-15",time:"14:00",desc:"Purchase - Travel",category:"debit_purchase",counterparty:"Delta Air Lines",cpType:"merchant",amount:-487,balance:6100,flagged:true,country:"USA",city:"",notes:"Airfare purchase at Delta Air Lines. System flagged 'delta' keyword in merchant name. Context: legitimate airline travel for work sprint in Seattle.",riskIndicators:["high-risk-keyword"]},
    {id:"TX-1079",date:"2025-11-10",time:"11:30",desc:"Purchase - Hotel",category:"debit_purchase",counterparty:"Marriott Seattle Downtown",cpType:"merchant",amount:-1425,balance:7800,flagged:false,country:"USA",city:"Seattle",notes:"Hotel booking for company hackathon in Seattle · consistent with travel reimbursement pattern.",riskIndicators:[]},
    {id:"TX-1068",date:"2025-10-30",time:"09:00",desc:"Direct Deposit - Payroll",category:"ach_credit",counterparty:"Synapse Technologies Inc Payroll",cpType:"ach",amount:5625,balance:10200,flagged:false,country:"USA",city:"",notes:"Regular bi-weekly payroll.",riskIndicators:[]},
    {id:"TX-1058",date:"2025-10-15",time:"19:00",desc:"P2P Transfer - Venmo",category:"p2p_transfer",counterparty:"@kai.chen.dev (Venmo)",cpType:"p2p",amount:900,balance:7400,flagged:false,country:"USA",city:"Austin",notes:"Reciprocal reimbursement from prior trip · normal cost-sharing group.",riskIndicators:[]},
  ],
  "ALERT-0112":[
    {id:"TX-1121",date:"2025-12-08",time:"10:00",desc:"Wire Transfer - IOLTA Trust",category:"wire_transfer",counterparty:"1st National Escrow Services",cpType:"entity",amount:-250000,balance:480000,flagged:true,country:"USA",city:"Chicago",notes:"Large round-number outbound wire from attorney trust account to escrow company. IOLTA (Interest on Lawyer Trust Accounts) transfers commonly show large round amounts · client funds for real estate closings.",riskIndicators:["large-transfer","round-amount"]},
    {id:"TX-1122",date:"2025-12-10",time:"14:00",desc:"Wire Transfer - IOLTA Trust",category:"wire_transfer",counterparty:"Cook County Circuit Court - Clerk",cpType:"entity",amount:-50000,balance:430000,flagged:true,country:"USA",city:"Chicago",notes:"Payment to Cook County Circuit Court · consistent with court-ordered payments or bond/settlement funds managed by attorney.",riskIndicators:["round-amount","large-transfer"]},
    {id:"TX-1123",date:"2025-12-12",time:"09:30",desc:"Wire Transfer - IOLTA Disbursement",category:"wire_transfer",counterparty:"Wainwright Law LLC Operating Acct",cpType:"entity",amount:-75000,balance:355000,flagged:true,country:"USA",city:"Chicago",notes:"Transfer from trust to operating account · attorney fee withdrawal. $75K fee consistent with large commercial litigation settlement.",riskIndicators:["round-amount","internal-transfer"]},
    {id:"TX-1115",date:"2025-12-05",time:"11:00",desc:"Wire Transfer - Client Funds Received",category:"wire_transfer",counterparty:"Harrison Industrial Corp",cpType:"entity",amount:300000,balance:730000,flagged:true,country:"USA",city:"Detroit",notes:"Large inbound wire · client escrow deposit for commercial acquisition. Harrison Industrial is counterparty in pending M&A transaction.",riskIndicators:["large-transfer","round-amount"]},
    {id:"TX-1108",date:"2025-11-29",time:"10:00",desc:"Wire Transfer - Client Funds Received",category:"wire_transfer",counterparty:"Lakeview Partners LLC",cpType:"entity",amount:180000,balance:430000,flagged:false,country:"USA",city:"Chicago",notes:"Client trust funds for commercial real estate closing · supporting escrow agreement on file.",riskIndicators:[]},
    {id:"TX-1100",date:"2025-11-20",time:"09:00",desc:"ACH Debit - Payroll",category:"ach_debit",counterparty:"Wainwright Law LLC Payroll",cpType:"ach",amount:-65000,balance:290000,flagged:false,country:"USA",city:"",notes:"Monthly payroll for law firm staff · 5 associates and 2 support staff.",riskIndicators:[]},
    {id:"TX-1090",date:"2025-11-15",time:"14:00",desc:"Wire Transfer - Opposing Counsel Settlement",category:"wire_transfer",counterparty:"Johnson & Reed LLP Escrow",cpType:"entity",amount:-120000,balance:380000,flagged:false,country:"USA",city:"Chicago",notes:"Settlement disbursement to opposing counsel escrow · civil litigation resolution. Court order on file.",riskIndicators:[]},
    {id:"TX-1082",date:"2025-11-01",time:"11:00",desc:"ACH Credit - Retainer Deposit",category:"ach_credit",counterparty:"Midwest Equity Group Inc",cpType:"entity",amount:50000,balance:420000,flagged:false,country:"USA",city:"Chicago",notes:"Client retainer for M&A advisory work · engagement letter on file.",riskIndicators:[]},
  ],
};

const TIMELINE_Data = {
  "ALERT-0100":[
    {date:"2025-10-01",inflow:3500,outflow:0},{date:"2025-10-15",inflow:4200,outflow:1200},
    {date:"2025-10-28",inflow:0,outflow:1200},{date:"2025-11-01",inflow:4200,outflow:0},
    {date:"2025-11-15",inflow:3500,outflow:800},{date:"2025-11-29",inflow:16800,outflow:0},
    {date:"2025-12-01",inflow:4200,outflow:2100},
  ],
  "ALERT-0108":[
    {date:"2025-10-01",inflow:35000,outflow:28000},{date:"2025-10-15",inflow:0,outflow:4200},
    {date:"2025-11-01",inflow:50000,outflow:0},{date:"2025-11-14",inflow:50000,outflow:0},
    {date:"2025-11-28",inflow:210000,outflow:0},{date:"2025-12-05",inflow:0,outflow:85000},
    {date:"2025-12-08",inflow:0,outflow:120000},
  ],
  "ALERT-0109":[
    {date:"2025-11-10",inflow:15000,outflow:0},{date:"2025-11-20",inflow:20000,outflow:5000},
    {date:"2025-12-01",inflow:8900,outflow:0},{date:"2025-12-02",inflow:9500,outflow:0},
    {date:"2025-12-03",inflow:9800,outflow:95000},{date:"2025-12-04",inflow:9200,outflow:0},
    {date:"2025-12-05",inflow:8700,outflow:200000},
  ],
  "ALERT-0110":[
    {date:"2025-10-15",inflow:22000,outflow:8500},{date:"2025-10-28",inflow:0,outflow:8500},
    {date:"2025-11-10",inflow:45000,outflow:0},{date:"2025-11-18",inflow:0,outflow:85000},
    {date:"2025-11-25",inflow:135000,outflow:0},{date:"2025-12-03",inflow:0,outflow:75000},
    {date:"2025-12-07",inflow:0,outflow:55000},
  ],
  "ALERT-0111":[
    {date:"2025-10-15",inflow:5625,outflow:487},{date:"2025-10-30",inflow:5625,outflow:900},
    {date:"2025-11-10",inflow:0,outflow:1425},{date:"2025-11-15",inflow:0,outflow:487},
    {date:"2025-11-25",inflow:5625,outflow:0},{date:"2025-12-09",inflow:5625,outflow:0},
    {date:"2025-12-10",inflow:6500,outflow:0},{date:"2025-12-12",inflow:1750,outflow:487},
  ],
  "ALERT-0112":[
    {date:"2025-11-01",inflow:50000,outflow:0},{date:"2025-11-15",inflow:0,outflow:120000},
    {date:"2025-11-20",inflow:0,outflow:65000},{date:"2025-11-29",inflow:180000,outflow:0},
    {date:"2025-12-05",inflow:300000,outflow:0},{date:"2025-12-08",inflow:0,outflow:250000},
    {date:"2025-12-10",inflow:0,outflow:50000},{date:"2025-12-12",inflow:0,outflow:75000},
  ],
};

const NETWORK_Data = {
  "ALERT-0100":{
    nodes:[
      {id:"c",label:"Jeremiah Garcia",type:"subject",x:300,y:220,risk:"MEDIUM"},
      {id:"n1",label:"Stripe",type:"processor",x:480,y:120,risk:"LOW"},
      {id:"n2",label:"Del Paso Heights Branch",type:"branch",x:140,y:130,risk:"LOW"},
      {id:"n3",label:"Midtown Sacramento Branch",type:"branch",x:100,y:280,risk:"LOW"},
      {id:"n4",label:"Oak Park Branch",type:"branch",x:180,y:380,risk:"MEDIUM"},
      {id:"n5",label:"Garcia Convenience LLC",type:"entity",x:460,y:340,risk:"LOW"},
    ],
    edges:[
      {from:"n1",to:"c",amount:"$41K",dir:"in"},{from:"n2",to:"c",amount:"$3.6K",dir:"in"},
      {from:"n3",to:"c",amount:"$3.5K",dir:"in"},{from:"n4",to:"c",amount:"$9.7K",dir:"in"},
      {from:"c",to:"n5",amount:"$8K",dir:"out"},
    ]
  },
  "ALERT-0108":{
    nodes:[
      {id:"c",label:"Ryan Torres",type:"subject",x:300,y:230,risk:"HIGH"},
      {id:"n1",label:"Global Trade Partners Inc",type:"entity",x:120,y:110,risk:"HIGH"},
      {id:"n2",label:"HSBC Panama Branch",type:"bank",x:490,y:110,risk:"HIGH"},
      {id:"n3",label:"Barclays London",type:"bank",x:490,y:360,risk:"MEDIUM"},
      {id:"n4",label:"Torres Logistics Solutions",type:"entity",x:120,y:360,risk:"MEDIUM"},
      {id:"n5",label:"Pacific Rim Trade Advisors",type:"entity",x:300,y:50,risk:"LOW"},
    ],
    edges:[
      {from:"n1",to:"c",amount:"$210K",dir:"in"},{from:"n5",to:"c",amount:"$50K",dir:"in"},
      {from:"c",to:"n2",amount:"$85K",dir:"out"},{from:"c",to:"n3",amount:"$120K",dir:"out"},
      {from:"c",to:"n4",amount:"$28K",dir:"out"},{from:"n1",to:"n2",amount:"$40K",dir:"out"},
    ]
  },
  "ALERT-0109":{
    nodes:[
      {id:"c",label:"Neal Hall",type:"subject",x:300,y:230,risk:"CRITICAL"},
      {id:"n1",label:"Nexus Realty LLC",type:"entity",x:130,y:120,risk:"HIGH"},
      {id:"n2",label:"Pacific Shell Corp",type:"entity",x:470,y:120,risk:"HIGH"},
      {id:"n3",label:"Deutsche Bank Frankfurt",type:"bank",x:480,y:360,risk:"MEDIUM"},
      {id:"n4",label:"Branch Hollywood",type:"branch",x:130,y:360,risk:"LOW"},
      {id:"n5",label:"Hall Development Corp",type:"entity",x:300,y:60,risk:"LOW"},
    ],
    edges:[
      {from:"c",to:"n1",amount:"$95K",dir:"out"},{from:"c",to:"n2",amount:"$120K",dir:"out"},
      {from:"c",to:"n3",amount:"$200K",dir:"out"},{from:"n4",to:"c",amount:"$28.2K",dir:"in"},
      {from:"n5",to:"c",amount:"$20K",dir:"in"},{from:"n1",to:"n2",amount:"$40K",dir:"out"},
    ]
  },
  "ALERT-0110":{
    nodes:[
      {id:"c",label:"David Hall",type:"subject",x:300,y:230,risk:"MEDIUM"},
      {id:"n1",label:"Meridian Capital Advisory",type:"entity",x:120,y:110,risk:"MEDIUM"},
      {id:"n2",label:"Banco Santander Cayman",type:"bank",x:490,y:110,risk:"HIGH"},
      {id:"n3",label:"HSBC HK Private Banking",type:"bank",x:490,y:360,risk:"HIGH"},
      {id:"n4",label:"Hall Financial Services LLC",type:"entity",x:120,y:360,risk:"MEDIUM"},
      {id:"n5",label:"Coral Springs Investment Fund",type:"entity",x:300,y:60,risk:"LOW"},
    ],
    edges:[
      {from:"n1",to:"c",amount:"$135K",dir:"in"},{from:"n5",to:"c",amount:"$45K",dir:"in"},
      {from:"c",to:"n2",amount:"$75K",dir:"out"},{from:"c",to:"n3",amount:"$55K",dir:"out"},
      {from:"c",to:"n4",amount:"$85K",dir:"out"},{from:"n4",to:"n2",amount:"$30K",dir:"out"},
    ]
  },
  "ALERT-0111":{
    nodes:[
      {id:"c",label:"Marisol Nguyen-Kelley",type:"subject",x:300,y:230,risk:"LOW"},
      {id:"n1",label:"Synapse Technologies",type:"entity",x:120,y:110,risk:"LOW"},
      {id:"n2",label:"@kai.chen.dev",type:"processor",x:490,y:110,risk:"LOW"},
      {id:"n3",label:"@priya.dev.austin",type:"processor",x:490,y:360,risk:"LOW"},
      {id:"n4",label:"@marcus.wei",type:"processor",x:120,y:360,risk:"LOW"},
      {id:"n5",label:"Delta Air Lines",type:"processor",x:300,y:60,risk:"LOW"},
    ],
    edges:[
      {from:"n1",to:"c",amount:"$5.6K",dir:"in"},{from:"n2",to:"c",amount:"$900",dir:"in"},
      {from:"c",to:"n2",amount:"$2.9K",dir:"out"},{from:"c",to:"n3",amount:"$1.9K",dir:"out"},
      {from:"c",to:"n4",amount:"$1.8K",dir:"out"},{from:"c",to:"n5",amount:"$487",dir:"out"},
    ]
  },
  "ALERT-0112":{
    nodes:[
      {id:"c",label:"Darius Wainwright",type:"subject",x:300,y:230,risk:"LOW"},
      {id:"n1",label:"Harrison Industrial Corp",type:"entity",x:120,y:110,risk:"LOW"},
      {id:"n2",label:"1st National Escrow",type:"entity",x:490,y:110,risk:"LOW"},
      {id:"n3",label:"Cook County Circuit Court",type:"entity",x:490,y:360,risk:"LOW"},
      {id:"n4",label:"Wainwright Law LLC",type:"entity",x:120,y:360,risk:"LOW"},
      {id:"n5",label:"Lakeview Partners LLC",type:"entity",x:300,y:60,risk:"LOW"},
    ],
    edges:[
      {from:"n1",to:"c",amount:"$300K",dir:"in"},{from:"n5",to:"c",amount:"$180K",dir:"in"},
      {from:"c",to:"n2",amount:"$250K",dir:"out"},{from:"c",to:"n3",amount:"$50K",dir:"out"},
      {from:"c",to:"n4",amount:"$75K",dir:"out"},{from:"n4",to:"n2",amount:"$120K",dir:"out"},
    ]
  },
};

const JOURNAL_STEPS = {
  "ALERT-0100":[
    {n:1,type:"ALERT",title:"Alert Details Retrieval",tool:"get_alert_details",status:"complete",
     summary:"Retrieved alert metaData for ALERT-0100 triggered Dec 1, 2025.",
     details:"Tool call: get_alert_details(alert_id='ALERT-0100')\n\nResult:\n· Alert ID: ALERT-0100\n· Customer: Jeremiah Garcia (C-8518-0100)\n· Date triggered: 2025-12-01\n· Rules fired: RapidCashDeposits, StructuredDeposits, VelocityIncrease, RoundAmounts\n· Flagged transactions: TX-9851 ($3,600), TX-9853 ($3,500), TX-9857 ($9,700)\n· Total flagged inflow: $16,800 across 3 branches on 2025-11-29\n· Alert window: 2025-10-30 to 2025-11-29 (30 days)"},
    {n:2,type:"STEP",title:"Customer Profile & KYC Review",tool:"get_customer_details",status:"complete",
     summary:"Customer profile retrieved. Stated income $42K/yr. Risk score 28 (LOW). 1 prior alert dismissed.",
     details:"Tool call: get_customer_details(customer_id='C-8518-0100')\n\nResult:\n· Name: Jeremiah Garcia | DOB: 1990-07-09 | SSN last 4: 4821\n· Occupation: Owner, Neighborhood Convenience Store (LLC)\n· Account type: Small Business Checking / Personal Linked\n· Account opened: 2022-03-15 (2.7 years)\n· Stated annual income: $42,000\n· Customer risk score: 28 (LOW) · auto-calculated\n· Prior alert AL-0042 (2024): Cleared with receipts · favorable history\n· KYC status: Full KYC on file, last refreshed 2024-11-01\n· Beneficial ownership: Jeremiah Garcia (100% sole proprietor)"},
    {n:3,type:"STEP",title:"Flagged Transaction Retrieval",tool:"search_transactions",status:"complete",
     summary:"3 flagged cash deposits retrieved. All on same day (2025-11-29) across 3 different branches.",
     details:"Tool call: search_transactions(alert_id='ALERT-0100', flagged=true, limit=50)\n\nFlagged transactions returned:\n1. TX-9851 | 2025-11-29 09:12 | Cash Deposit | Branch - Del Paso Heights | $3,600 | Flagged: ?\n2. TX-9853 | 2025-11-29 13:45 | Cash Deposit | Branch - Midtown Sacramento | $3,500 | Flagged: ?\n3. TX-9857 | 2025-11-29 16:36 | Cash Deposit | Branch - Oak Park | $9,700 | Flagged: ?\n\nObservations:\n· All three deposits on 2025-11-29 within 7.5-hour window\n· Three different branches used (geographic dispersion)\n· Individual amounts: $3,600, $3,500, $9,700 · all below $10,000 CTR threshold\n· Combined total: $16,800\n· Pattern: consistent with structuring typology"},
    {n:4,type:"STEP",title:"Baseline Transaction Summary",tool:"get_baseline_summary",status:"complete",
     summary:"90-day baseline established. Average monthly inflow: $5,210 (~$62.5K annualized). Baseline consistent with stated income.",
     details:"Tool call: get_baseline_summary(customer_id='C-8518-0100', lookback_days=90, exclude_flagged=True, exclude_alert_window_days=7)\n\nBaseline results:\n· Total baseline inflow (90 days): $44,700 across 87 transactions\n· Average transaction size: $514\n· Largest single baseline inflow: $4,200 (Stripe merchant settlement)\n· Typical cash deposit: None in baseline · cash deposits are anomalous\n· Average monthly inflow: ~$5,210 (~$62,520 annualized)\n· Annualized income ratio vs stated $42K: 1.49x · within acceptable range for cash business\n\nConclusion: Baseline is consistent with stated occupation and income."},
    {n:5,type:"STEP",title:"Income Verification Calculation",tool:"calculate",status:"complete",
     summary:"Flagged sum $16,800 + baseline $44,700 = $61,500 observed. Annualized: $246,000. Ratio vs stated income: 5.86x · elevated but partially explained by business cash cycle.",
     details:"Tool call: calculate(operation='income_verification', alert_id='ALERT-0100')\n\nCalculation:\n· Baseline inflow (90-day): $44,700\n· Flagged inflow (alert window): $16,800\n· Combined observed inflow: $61,500\n· Annualized: $61,500 · (365/90) = $249,583\n· Stated annual income: $42,000\n· Ratio: $249,583 / $42,000 = 5.94x\n\nNote: For cash-intensive retail businesses, the ratio between gross revenue and owner income commonly ranges 4·8x depending on margin. A convenience store with $42K owner income could plausibly generate $200K·$350K in gross sales. This ratio does not independently confirm suspicious activity."},
    {n:6,type:"STEP",title:"High-Risk Keyword Search",tool:"search_keyword_transactions",status:"complete",
     summary:"Searched for 22 high-risk keywords. Identified 'green light' in 3 P2P transfer descriptions. Investigated in context · found to be consistent with youth sports tournament reimbursements.",
     details:"Tool call: search_keyword_transactions(customer_id='C-8518-0100', keywords=['green light','fronting','owe','dark','clean','wash','layering',...], window_days=7, representative_windows=['2025-07-19','2025-12-12'])\n\nKeyword hits:\n· 'green light' · found in TXN-BASE-000999 (2025-07-19), TXN-BASE-001002, TXN-0111-F002 (2025-12-12), TXN-0111-F006, TXN-0111-F007\n\nContext investigation for 'green light':\n· TXN-BASE-000999 description: 'reimb hotel green light tournament Sacramento'\n· TXN-BASE-001002 description: 'youth soccer green light split fee'\n· TXN-0111-F002: 'tourney reimb green light finals'\n\nConclusion: 'Green light' is a youth soccer tournament name based in Sacramento. Descriptions consistently reference hotel splits, tournament fees, and reimbursements. P2P counterparties form a stable group of 4·5 individuals transacting back and forth · consistent with carpooling/travel cost sharing."},
    {n:7,type:"STEP",title:"Representative Window Analysis (1·3 Day)",tool:"analyze_window",status:"complete",
     summary:"Two representative windows analyzed (earliest and most recent flagged period). Both show payroll inflows, lodging/merchant charges, and reciprocal P2P · consistent with business owner supporting youth sports travel.",
     details:"Tool call: analyze_window(customer_id='C-8518-0100', window_1='2025-07-18:2025-07-20', window_2='2025-12-11:2025-12-13')\n\nWindow 1 (2025-07-18 to 2025-07-20):\n· Inflows: Payroll ACH $3,500 | Stripe settlement $1,200\n· Outflows: Hampton Inn & Suites -$214.36 | Shell Gas -$67.20 | Lyft -$34.50\n· P2P: Venmo from 'Mike R.' +$107 (hotel split), from 'Sarah K.' +$53 (gas split)\n· Assessment: Normal business owner + travel pattern\n\nWindow 2 (2025-12-11 to 2025-12-13):\n· Inflows: Payroll ACH $3,500 | P2P 'tourney reimb' +$87 each from 3 contacts\n· Outflows: Safeway -$124 | ATM -$200 | Local Restaurant -$89\n· Assessment: Grocery, cash, dining · consistent with personal spending\n\nConclusion: No atypical or suspicious activity in representative windows beyond Nov 29 structuring-like pattern."},
    {n:8,type:"STEP",title:"Risk Factor Synthesis & Decision",tool:"evaluate_risk",status:"complete",
     summary:"4 suspicious indicators vs 8 mitigating factors. Agent recommends CLEAR with 85% confidence. Residual risk: 'green light' keyword context.",
     details:"Tool call: evaluate_risk(alert_id='ALERT-0100', include_factors=true)\n\nSuspicious Indicators:\n1. Three same-day cross-branch cash deposits below $10K CTR threshold\n2. Combined $16,800 · consistent with structuring typology\n3. Velocity 340% above 90-day baseline\n4. 'green light' keyword appears in P2P descriptions (minor ambiguity)\n\nMitigating Factors:\n1. KYC fully current · cash-intensive business owner profile\n2. Payroll ACHs consistently fund account ($5,210/month baseline)\n3. Baseline inflow ratio aligns with stated income for retail business\n4. Prior alert AL-0042 dismissed with receipts · favorable disposition history\n5. 'Green light' confirmed as Sacramento youth soccer tournament\n6. P2P counterparty group is stable and reciprocal (reimbursement pattern)\n7. Representative window analyses show no contradictory activity\n8. No adverse media, sanctions, or PEP flags on customer or counterparties\n\nFinal Decision: CLEAR (False Positive)\nConfidence: 85%\nRationale: Weight of evidence supports legitimate business activity. Lone residual concern is keyword context · resolved by transaction description review. No substantive suspicious behavior confirmed."},
    {n:9,type:"STEP",title:"Narrative Generation",tool:"generate_narrative",status:"complete",
     summary:"Final investigation narrative generated and attached to alert record.",
     details:"Tool call: generate_narrative(alert_id='ALERT-0100', decision='CLEAR', include_evidence=true)\n\nNarrative generated successfully. Key narrative elements:\n· Opening: Alert trigger and customer context\n· Investigation steps summary (8 steps, 9 tool calls)\n· Evidence summary: baseline, keyword analysis, window analyses\n· Risk factor matrix: 4 suspicious vs 8 mitigating\n· Final disposition: CLEAR with 85% confidence\n· Residual concern documented: 'green light' keyword context with explanation\n\nNarrative word count: 847 words\nRegulatory format: FinCEN SAR-compliant structure\nStatus: Attached to ALERT-0100 record"},
  ],
  "ALERT-0108":[
    {n:1,type:"STEP",title:"Alert Details Retrieval",tool:"get_alert_details",status:"complete",
     summary:"Alert ALERT-0108 triggered Dec 11, 2025 for Ryan Torres. Three rules fired: InternationalWire, HighRiskKeyword, VelocityIncrease. Account dormant 14 months prior to alert window.",
     details:"Tool call: get_alert_details(alert_id='ALERT-0108')\n\nResult:\n· Alert ID: ALERT-0108\n· Customer: Ryan Torres (C-7712-0108)\n· Date triggered: 2025-12-11\n· Rules fired: InternationalWire, HighRiskKeyword, VelocityIncrease\n· Flagged transactions: TX-1081 ($85,000 outbound to Panama), TX-1082 ($120,000 outbound to London), TX-1075 ($210,000 inbound from Global Trade Partners Inc)\n· Total flagged volume: $415,000 in and out within 14 days\n· Alert window: 2025-11-21 to 2025-12-11 (21 days)\n· Critical note: Account C-7712-0108 last Active transaction: October 2024 · 14 months dormancy before this alert window"},
    {n:2,type:"STEP",title:"Customer Profile & KYC Review",tool:"get_customer_details",status:"complete",
     summary:"Ryan Torres · Import/Export Consultant, SF. Stated income $95K. Customer risk 68 (MEDIUM). 3 prior alerts. Account dormant 14 months before current activity. KYC stale · 24+ months.",
     details:"Tool call: get_customer_details(customer_id='C-7712-0108')\n\nResult:\n· Name: Ryan Torres | DOB: 1985-03-22 | SSN last 4: 9132\n· Occupation: Import/Export Consultant (self-employed, Torres Import/Export LLC)\n· Account type: Business Checking\n· Account opened: 2021-07-10 (4.4 years)\n· Stated annual income: $95,000\n· Customer risk score: 68 (MEDIUM)\n· Alert risk score: 81 (HIGH)\n· Prior alerts: 3 · none resulted in SAR, each involved cross-border activity\n· KYC status: Last refreshed 2023-08-15 · STALE (>24 months). Recommend immediate refresh.\n· Business registration: Torres Import/Export LLC · Active CA license\n· Beneficial ownership: 100% Ryan Torres\n· Last known Active account use: October 14, 2024 (14 months prior to this alert)"},
    {n:3,type:"STEP",title:"Flagged Transaction Retrieval & Dormancy Analysis",tool:"search_transactions",status:"complete",
     summary:"3 flagged transactions: $210K inbound from undocumented entity, $85K to Panama, $120K to London. $205K dispersed offshore within 10 days of inflow. Dormant account reactivation pattern confirmed.",
     details:"Tool call: search_transactions(alert_id='ALERT-0108', flagged=true, limit=50)\n\nFlagged transactions returned:\n1. TX-1075 | 2025-11-28 14:00 | ACH Credit | Global Trade Partners Inc | +$210,000 | Flagged: ?\n   · Entity with no prior relationship. Described as 'trade invoice' · no docs on file.\n   · This credit reactivated a 14-month dormant account to $210,000 balance immediately.\n2. TX-1081 | 2025-12-05 11:00 | Wire Transfer | HSBC Panama Branch | -$85,000 | Flagged: ?\n   · Panama is FATF grey-listed jurisdiction. 7 days after $210K inflow.\n   · Receiving account at HSBC Panama opened 6 months ago · no prior relationship.\n3. TX-1082 | 2025-12-08 09:30 | Wire Transfer | Barclays London Correspondent | -$120,000 | Flagged: ?\n   · 3 days after Panama wire. Account effectively drained: $210K in  $205K out in 10 days.\n\nDormancy pattern:\n· Oct 2024: Last transaction (account goes dormant)\n· Nov 28, 2025: Large unexplained inflow from new counterparty\n· Dec 5·8, 2025: Rapid dispersal to two offshore jurisdictions\n· Residual balance: ~$5,000"},
    {n:4,type:"STEP",title:"Baseline Transaction Summary",tool:"get_baseline_summary",status:"complete",
     summary:"Pre-dormancy baseline: avg $47K/month consulting income. Alert window is 4.5x baseline monthly average. Dormancy breaks baseline continuity · reactivation pattern is key finding.",
     details:"Tool call: get_baseline_summary(customer_id='C-7712-0108', lookback_days=90, reference_period='pre_dormancy')\n\nPre-dormancy baseline (Oct 2023·Oct 2024 Active period):\n· Average monthly inflow: $47,000 (consulting retainers, trade invoices)\n· International wires in prior 12 months: 2 (both under $25K, partially documented)\n· Typical domestic wire outflow: $15K·$30K/month (business expenses)\n\nAlert window comparison:\n· Alert inflow: $210,000 (single transaction) vs $47K avg monthly = 4.5x spike\n· International wire count: 0 in 12 months pre-dormancy  2 large wires in 10 days\n\nKey finding: Account dormant 14 months then reactivated with immediate large credit from unknown entity, rapidly dispersed to offshore · classic 'warm-up' account typology."},
    {n:5,type:"STEP",title:"Income Verification & Trade Documentation Check",tool:"calculate",status:"complete",
     summary:"$210K 'trade invoice' = 2.2x stated annual income in one payment. No trade documentation on file. Income ratio annualized: 38.4x. Global Trade Partners Inc: registered Jan 2025 (10 months old), no web presence, registered agent address only.",
     details:"Tool call: calculate(operation='income_verification', alert_id='ALERT-0108')\nalso: check_documentation(customer_id='C-7712-0108', transaction_id='TX-1075')\n\nIncome verification:\n· Total alert window inflow: $210,000\n· Annualized: $210,000 · (365/21) = $3,650,000\n· Stated annual income: $95,000\n· Income ratio: 38.4x · HIGHLY ANOMALOUS\n\nDocumentation check for TX-1075:\n· Trade contract: NOT ON FILE\n· Commercial invoice: NOT ON FILE\n· Shipping/freight documentation: NOT ON FILE\n· Letter of credit: NOT ON FILE\n· Source of funds declaration: NOT ON FILE\n\nGlobal Trade Partners Inc entity check:\n· Delaware LLC registration: January 2025 (10 months old)\n· No public web presence found\n· Address: Registered agent office only · no physical address\n· No prior banking relationship with institution\n· No employees found on LinkedIn or public directories"},
    {n:6,type:"STEP",title:"High-Risk Keyword Search & Jurisdiction Analysis",tool:"search_keyword_transactions",status:"complete",
     summary:"'Trade invoice' in undocumented context. 'Correspondent' flagged in wire routing. Jurisdictions confirmed: Panama (FATF grey list), London (correspondent to unidentified end-beneficiary). Recipient entities · HSBC Panama and Barclays London · both tied to anonymous offshore accounts.",
     details:"Tool call: search_keyword_transactions(customer_id='C-7712-0108', keywords=['trade','invoice','offshore','correspondent','layering','clean','wash',...], window_days=21)\n\nKeyword hits:\n· 'trade invoice' · TX-1075: 'ACH Credit - Trade Invoice' · no supporting docs, new entity\n· 'correspondent' · TX-1082 routing note: 'Barclays London Correspondent' · flag\n\nJurisdiction analysis:\n· Panama (TX-1081): FATF grey list · heightened monitoring required\n· London (TX-1082): Correspondent routing to EuroTrade Holdings Ltd (BVI incorporation)\n\nCounterparty research:\n· HSBC Panama recipient: Opened 2025-06-01 (6 months). Only 3 prior transactions.\n· Barclays London: EuroTrade Holdings Ltd · BVI incorporation, no public business presence\n\nConclusion: No benign explanation found for transaction sequence."},
    {n:7,type:"STEP",title:"Counterparty Network & Cross-Institution Query",tool:"analyze_network",status:"complete",
     summary:"Network: Global Trade Partners Inc sent similar large ACH credits to 2 other bank accounts (per FinCEN 314(b)). HSBC Panama recipient linked to Active FinCEN 314(b) inquiry. EuroTrade Holdings (BVI) · nominee entity pattern.",
     details:"Tool call: analyze_network(customer_id='C-7712-0108', depth=2, include_cross_institution=True)\n\nNetwork findings:\n· Global Trade Partners Inc (TX-1075 originator):\n  · Also sent large ACH credits to 2 other regional bank accounts (FinCEN 314(b) sharing)\n  · Those accounts made international wires within 2 weeks · identical pattern\n\n· HSBC Panama recipient account:\n  · Subject of FinCEN 314(b) information request filed Nov 2025\n  · 3 inbound wires from US accounts totaling $340K in 60 days\n  · No outbound transactions · funds accumulating\n\n· Barclays London (EuroTrade Holdings Ltd):\n  · BVI incorporation, no beneficial ownership on record\n  · Pattern matches nominee entity structure\n\nOverall: Dormant account reactivation  undocumented large inflow  rapid offshore dispersal  recipients with suspicious flags = textbook layering operation."},
    {n:8,type:"STEP",title:"Risk Factor Synthesis & Decision",tool:"evaluate_risk",status:"complete",
     summary:"7 suspicious indicators vs 1 mitigating factor. Agent recommends ESCALATE with 72% confidence. Confidence slightly reduced · 314(b) Data preliminary, customer not yet contacted for documentation.",
     details:"Tool call: evaluate_risk(alert_id='ALERT-0108', include_factors=true)\n\nSuspicious Indicators:\n1. Dormant account reactivation (14 months) by large undocumented credit · classic warm-up typology\n2. $210K inbound from newly registered entity (10 months old) with no trade documentation\n3. $205K rapidly dispersed to two offshore jurisdictions within 10 days\n4. HSBC Panama recipient under Active FinCEN 314(b) inquiry\n5. London recipient is nominee entity with BVI incorporation\n6. Income ratio 38.4x stated annual income in single transaction\n7. KYC stale >24 months · EDD overdue\n\nMitigating Factors:\n1. 4+ year banking relationship with no prior SAR filed\n\nFinal Decision: ESCALATE\nConfidence: 72%\nRationale: Dormancy pattern, undocumented source, offshore dispersal, linked suspicious recipients · all support escalation. SAR filing deadline: Jan 10, 2026."},
    {n:9,type:"STEP",title:"Narrative Generation & Case Referral",tool:"generate_narrative",status:"complete",
     summary:"Escalation narrative generated. Case CASE-2025-001 created. Assigned to Sarah Chen. SAR-2025-002 initiated in draft.",
     details:"Tool call: generate_narrative(alert_id='ALERT-0108', decision='ESCALATE', include_evidence=true)\nalso: create_case_referral(alert_id='ALERT-0108', priority='HIGH', assignee='sarah_chen')\n\nNarrative: 912 words\n· SAR filing recommendation: YES · if documentation not provided within 5 business days\n· Regulatory basis: 31 USC 5318(g)\n\nCase created: CASE-2025-001 · Assigned to Sarah Chen · Priority: HIGH · Due: 2025-12-18\nRequired actions: (1) Contact customer for trade documentation (2) Submit 314(b) query (3) Prepare SAR draft\nSAR-2025-002 initiated in draft status."},
  ],
  "ALERT-0109":[
    {n:1,type:"STEP",title:"Alert Details Retrieval",tool:"get_alert_details",status:"complete",
     summary:"Alert ALERT-0109 triggered Dec 12, 2025 for Neal Hall. Three rules fired: HighRiskKeyword, VelocityIncrease, StructuredDeposits. 9 flagged transactions across 4 consecutive days. 5 prior alerts on record.",
     details:"Tool call: get_alert_details(alert_id='ALERT-0109')\n\nResult:\n· Alert ID: ALERT-0109\n· Customer: Neal Hall (C-4490-0109)\n· Date triggered: 2025-12-12\n· Rules fired: HighRiskKeyword, VelocityIncrease, StructuredDeposits\n· Flagged transactions: TX-1091 through TX-1095 (9 deposits + wire transfers)\n· Total flagged volume: $1,250,000 inflow / $980,000 outflow\n· Alert window: 2025-11-12 to 2025-12-12 (30 days)\n· Prior alerts: 5 (most recent: 2024-08-20 · referred to compliance)\n· Prior SARs by other institutions: 2 (per FinCEN 314(a) response)"},
    {n:2,type:"STEP",title:"Customer Profile & KYC Review",tool:"get_customer_details",status:"complete",
     summary:"Neal Hall · Real Estate Developer. Customer risk 71 (HIGH). Enhanced monitoring. 5 prior alerts. PEP: held appointed LA County position 2019·2022. Linked to 3 entities including Nexus Realty (CA DRE suspended) and Pacific Shell Corp (Panama Papers).",
     details:"Tool call: get_customer_details(customer_id='C-4490-0109')\n\nResult:\n· Name: Neal Hall | DOB: 1978-11-05 | SSN last 4: 3374\n· Occupation: Real Estate Developer\n· Entity structure: Hall Development Corp + Nexus Realty LLC + Pacific Shell Corp (BVI)\n· Account opened: 2019-04-28 | Stated income: $250,000\n· Customer risk score: 71 (HIGH) | Alert risk score: 89 (CRITICAL)\n· PEP status: POTENTIAL · LA County Infrastructure Commission (2019·2022)\n· Enhanced monitoring: Active since 2024-09-15\n· Prior alerts: 5 | Prior SARs (other institutions): 2\n· Linked entities: Nexus Realty LLC (CA DRE suspended 2024), Pacific Shell Corp (Panama Papers, BVI)"},
    {n:3,type:"STEP",title:"Flagged Transaction Retrieval & Structuring Analysis",tool:"search_transactions",status:"complete",
     summary:"9 flagged transactions: 8 cash deposits $8,700·$9,800 across 5 branches (all below $10K CTR threshold), 1 $95K wire to suspended shell entity, 1 $200K international wire to Germany. Structuring fully confirmed.",
     details:"Tool call: search_transactions(alert_id='ALERT-0109', flagged=true, limit=50)\n\nFlagged transactions:\n1. TX-1091 | Dec 1 | Cash Deposit | Branch Hollywood | +$8,900\n2. TX-1092 | Dec 2 | Cash Deposit | Branch Burbank | +$9,500\n3. TX-1093 | Dec 3 | Wire Transfer | Nexus Realty LLC | +$95,000 (to suspended entity)\n4. TX-1094 | Dec 4 | Cash Deposit | Branch Downtown LA | +$9,800\n5. TX-1095 | Dec 5 | Intl Wire | Deutsche Bank Frankfurt | -$200,000\n6·9: Additional cash deposits Nov 25·30 ($8,700, $9,200, $9,100, $9,500) across 4 more branches\n\nStructuring analysis:\n· 8 deposits averaging $9,212 · systematically below $10,000 CTR threshold\n· 5 branch locations · deliberate geographic dispersion\n· Combined structured deposits: $87,200\n· CTRs that should have been filed if aggregated: 8\n· Wire to Nexus Realty LLC during license suspension: no legitimate purpose\n· Frankfurt wire: no documented real estate transaction in Germany"},
    {n:4,type:"STEP",title:"Baseline Transaction Summary",tool:"get_baseline_summary",status:"complete",
     summary:"90-day baseline: avg $85K/month from property management and development income. Alert window $1.25M is 14.7x monthly baseline. Zero cash deposits in 90-day baseline · cash deposits are entirely new behavior for this customer.",
     details:"Tool call: get_baseline_summary(customer_id='C-4490-0109', lookback_days=90, exclude_flagged=True)\n\nBaseline results:\n· Total baseline inflow (90 days): $255,000 across 14 transactions\n· Average monthly inflow: $85,000\n· Transaction types: Property management fees (ACH), development income\n· Cash deposits in 90-day baseline: ZERO\n· Average wire: $45,000 (documented real estate closings)\n\nAlert window: $1,250,000 vs $85K baseline = 14.7x spike\nCash activity: None in baseline  $87,200 structured cash = entirely new behavior"},
    {n:5,type:"STEP",title:"Income Verification & Shell Entity Analysis",tool:"calculate",status:"complete",
     summary:"$1.25M alert inflow = 5x stated annual income in 30 days (60x annualized). Nexus Realty LLC: license suspended, FinCEN enforcement $250K penalty. Pacific Shell Corp: Panama Papers. Frankfurt wire: no Germany real estate on record.",
     details:"Tool call: calculate(operation='income_verification', alert_id='ALERT-0109')\nalso: analyze_entity(entities=['Nexus Realty LLC','Pacific Shell Corp'])\n\nIncome verification:\n· Alert window inflow: $1,250,000  annualized: $15,000,000\n· Stated annual income: $250,000\n· Income ratio: 60x · extremely anomalous\n\nNexus Realty LLC:\n· CA DRE license: SUSPENDED 2024-09-01 (commingling of funds, undisclosed agency)\n· FinCEN civil penalty: $250,000 (failure to maintain AML program, failure to file CTRs)\n· Wire to Nexus during suspension: no legitimate real estate purpose\n\nPacific Shell Corp:\n· Jurisdiction: British Virgin Islands\n· Panama Papers (ICIJ): Nominee holding vehicle, 2011 incorporation\n· LA Times (Oct 2024): Named in real estate money laundering probe"},
    {n:6,type:"STEP",title:"High-Risk Keyword Search",tool:"search_keyword_transactions",status:"complete",
     summary:"'Cash' in 8 deposits (anomalous for real estate developer). 'Nexus' = known enforcement subject. 'Frankfurt' = undocumented international. No benign context found for any keyword hit.",
     details:"Tool call: search_keyword_transactions(customer_id='C-4490-0109', keywords=['cash','offshore','nominee','shell','nexus','layering',...], window_days=30)\n\nKeyword hits:\n· 'cash' · 8 cash deposit descriptions. Context: anomalous for real estate developer profile.\n· 'nexus' · TX-1093 counterparty: Nexus Realty LLC. Context: enforcement subject, license suspended.\n· 'frankfurt' · TX-1095 wire destination. Context: no Germany business relationship documented.\n\nAll keyword hits tied to confirmed suspicious transactions. Zero benign contexts identified."},
    {n:7,type:"STEP",title:"Network & Circular Movement Analysis",tool:"analyze_network",status:"complete",
     summary:"Circular movement confirmed: Hall  Nexus Realty ($95K)  Pacific Shell Corp ($40K)  Ryan Torres ($35K)  Hall ($30K). ML confidence 87%. $200K international placement to Frankfurt also detected. Linked to ALERT-0108.",
     details:"Tool call: analyze_network(customer_id='C-4490-0109', depth=2, include_cross_institution=True)\n\nCircular movement (Network Cluster Detector v0.9, confidence 87%):\n· Neal Hall  Nexus Realty LLC: $95,000\n· Nexus Realty LLC  Pacific Shell Corp: $40,000 (cross-institution)\n· Pacific Shell Corp  Ryan Torres: $35,000 (cross-institution)\n· Ryan Torres  Neal Hall: $30,000 (partial return)\n\nHaircut: $65,000 (30%) absorbed by shell intermediaries\nAdditional placement: Neal Hall  Deutsche Bank Frankfurt: $200,000\n\nConnection to ALERT-0108: Ryan Torres is network participant · simultaneous alerts indicate coordinated activity. Cross-alert link recommended."},
    {n:8,type:"STEP",title:"Risk Factor Synthesis & Decision",tool:"evaluate_risk",status:"complete",
     summary:"7 suspicious indicators, 0 meaningful mitigating factors. ESCALATE · CRITICAL PRIORITY. SAR filing highly likely. Immediate compliance officer notification triggered.",
     details:"Tool call: evaluate_risk(alert_id='ALERT-0109', include_factors=true)\n\nSuspicious Indicators:\n1. Structuring: 8 cash deposits averaging $9,212 across 5 branches\n2. Shell entity wire: $95K to Nexus Realty during license suspension\n3. International placement: $200K to Frankfurt, no documented real estate\n4. Circular layering confirmed at 87% confidence\n5. Income ratio: 60x stated annual income\n6. PEP status: Former appointed LA County official\n7. Prior SARs at other institutions (FinCEN 314(a))\n\nMitigating Factors: None identified.\n\nFinal Decision: ESCALATE · CRITICAL\nConfidence: 80%\nSAR filing deadline: Jan 11, 2026. Compliance officer notified immediately."},
    {n:9,type:"STEP",title:"Narrative Generation & Critical Case Referral",tool:"generate_narrative",status:"complete",
     summary:"Critical escalation narrative generated. Case CASE-2025-002 created · assigned to Marcus Williams. Cross-alert link to ALERT-0108 documented. SAR-2025-001 initiated.",
     details:"Tool call: generate_narrative(alert_id='ALERT-0109', decision='ESCALATE', priority='CRITICAL')\nalso: create_case_referral(alert_id='ALERT-0109', priority='CRITICAL', assignee='marcus_williams')\nalso: link_alerts(primary='ALERT-0109', related='ALERT-0108')\n\nNarrative: 1,124 words\nCase created: CASE-2025-002 · Marcus Williams · CRITICAL · Due: 2025-12-19\nSAR-2025-001 initiated in DRAFT status\nCompliance officer Jennifer Kim notified per CRITICAL escalation protocol"},
  ],
  "ALERT-0110":[
    {n:1,type:"STEP",title:"Alert Details Retrieval",tool:"get_alert_details",status:"complete",
     summary:"Alert ALERT-0110 triggered Dec 12, 2025 for David Hall. Three rules fired: InternationalWire, HighRiskKeyword, CircularMovement. 2 flagged international wires totaling $130K to Cayman Islands and Hong Kong.",
     details:"Tool call: get_alert_details(alert_id='ALERT-0110')\n\nResult:\n· Alert ID: ALERT-0110\n· Customer: David Hall (C-3381-0110)\n· Date triggered: 2025-12-12\n· Rules fired: InternationalWire, HighRiskKeyword, CircularMovement\n· Flagged transactions: TX-1101 ($75,000 to Cayman Islands), TX-1102 ($55,000 to Hong Kong)\n· Total flagged volume: $210,000 inflow / $195,000 outflow\n· Alert window: 2025-11-12 to 2025-12-12 (30 days)\n· Note: First alert for this customer. No prior suspicious activity."},
    {n:2,type:"STEP",title:"Customer Profile & KYC Review",tool:"get_customer_details",status:"complete",
     summary:"David Hall · Financial Consultant, Miami FL. Customer risk 21 (LOW). No prior alerts. Stated income $180K. Account Active since Jan 2023. Adverse media: linked to SEC investigation of Coastal Capital Group (advisor role).",
     details:"Tool call: get_customer_details(customer_id='C-3381-0110')\n\nResult:\n· Name: David Hall | DOB: 1982-06-18 | SSN last 4: 7721\n· Occupation: Financial Consultant (Hall Financial Services LLC)\n· Account opened: 2023-01-15 | Stated income: $180,000\n· Customer risk score: 21 (LOW) | Alert risk score: 55 (MEDIUM)\n· Prior alerts: 0 · first alert in account history\n· KYC status: CURRENT (refreshed 2024-12-01)\n· Adverse media: SEC investigation · Coastal Capital Group (customer listed as advisor in SEC exhibits)\n· Note: No confirmed familial or business connection to Neal Hall (C-4490-0109)"},
    {n:3,type:"STEP",title:"Flagged Transaction Retrieval & International Wire Analysis",tool:"search_transactions",status:"complete",
     summary:"2 flagged outbound international wires within 4 days: $75K to Cayman Islands, $55K to Hong Kong Private Banking. Source: $135K consulting fee from undocumented, newly incorporated entity. Placement-then-dispersal pattern.",
     details:"Tool call: search_transactions(alert_id='ALERT-0110', flagged=true, limit=50)\n\nFlagged transactions:\n1. TX-1101 | Dec 3 | Wire | Banco Santander Cayman Islands | -$75,000\n   · Offshore jurisdiction, described as 'investment account', no investment docs on file\n2. TX-1102 | Dec 7 | Wire | HSBC Hong Kong Private Banking | -$55,000\n   · Private banking · limited beneficial ownership visibility\n   · 4 days after Cayman wire · rapid dispersal pattern\n\nSource fund analysis:\n· TX-1095 (Nov 25): +$135,000 from Meridian Capital Advisory LLC\n· Meridian: Delaware incorporation June 2024 (18 months old), no web presence, no prior relationship\n· No consulting contract, statement of work, or invoice on file"},
    {n:4,type:"STEP",title:"Baseline Transaction Summary",tool:"get_baseline_summary",status:"complete",
     summary:"90-day baseline: avg $22K/month from investment distributions and referral fees. Alert window $210K is 9.5x monthly baseline. Zero prior international wire history in account lifetime.",
     details:"Tool call: get_baseline_summary(customer_id='C-3381-0110', lookback_days=90, exclude_flagged=True)\n\nBaseline: $67,000 total / $22,300 monthly avg · investment distributions, referral fees\nInternational wire history: ZERO · no prior international transfers ever\n\nAlert window: $210,000 vs $22K = 9.5x spike\n· International wires: 0 in history  2 large offshore wires in 4 days\nKey finding: First international wire activity ever, to two high-risk jurisdictions, funded by undocumented source · significant behavioral departure."},
    {n:5,type:"STEP",title:"Income Verification & Entity Documentation Check",tool:"calculate",status:"complete",
     summary:"$135K consulting fee = 75% of stated annual income in one payment. No documentation. Meridian Capital Advisory LLC: 18 months old, no public business presence, registered agent address only.",
     details:"Tool call: calculate(operation='income_verification', alert_id='ALERT-0110')\nalso: analyze_entity(entities=['Meridian Capital Advisory LLC'])\n\nIncome verification:\n· $135K single payment / $15K monthly income = 9x monthly income in one payment\n· Annualized alert inflow: 14.0x stated income\n\nMeridian Capital Advisory LLC:\n· Delaware incorporation: June 2024 (18 months old)\n· No physical address, no website, no employees found\n· No prior banking relationship\n· No Florida registration (customer based in FL)\n\nDocumentation for TX-1095: ALL fields · NOT ON FILE"},
    {n:6,type:"STEP",title:"High-Risk Keyword Search & Adverse Media Review",tool:"search_keyword_transactions",status:"complete",
     summary:"'Investment account' unverified in wire descriptions. 'Private banking' in HK wire flags limited visibility. Adverse media: SEC Wells Notice to Coastal Capital Group · customer listed as advisor. No FBAR filing found for 2024.",
     details:"Tool call: search_keyword_transactions(customer_id='C-3381-0110', keywords=['offshore','investment','private','cayman',...], window_days=30)\nalso: search_adverse_media(customer_id='C-3381-0110')\n\nKeyword hits:\n· 'investment account' · unverified description in Cayman wire\n· 'private banking' · HK HSBC wire · limits transaction visibility\n\nAdverse media:\n· Bloomberg Law (Jul 2024): SEC Wells Notice to Coastal Capital Group · David Hall listed as advisor in exhibits (Relevance: 85%)\n· Miami Herald (Mar 2024): Miami firm under investigation · consultants subpoenaed (Relevance: 72%)\n\nFBAR: No 2024 filing found · potential non-disclosure of foreign accounts (IRS referral if SAR filed)"},
    {n:7,type:"STEP",title:"Circular Movement Pattern Check",tool:"analyze_circular_movement",status:"complete",
     summary:"Partial circular movement detected (58% ML confidence · insufficient for confirmed classification): Hall  Hall Financial Services LLC ($85K out)  possible return via Meridian credit ($135K in). Full loop not confirmed. International wire pattern alone sufficient for escalation.",
     details:"Tool call: analyze_circular_movement(customer_id='C-3381-0110', depth=2, days=60)\n\nMovement analysis:\n· Nov 18: David Hall  Hall Financial Services LLC: -$85,000\n· Nov 25: Meridian Capital Advisory  David Hall: +$135,000\n· Dec 3: David Hall  Banco Santander Cayman: -$75,000\n· Dec 7: David Hall  HSBC HK Private Banking: -$55,000\n\nCircular movement ML confidence: 58% · possible but not confirmed\nAlternative interpretation: Legitimate financial consultant with offshore investment activity (legal for US persons; FBAR required)\nConclusion: International wire pattern without documentation is sufficient for escalation regardless of circular movement status."},
    {n:8,type:"STEP",title:"Risk Factor Synthesis & Decision",tool:"evaluate_risk",status:"complete",
     summary:"5 suspicious indicators vs 3 mitigating factors. ESCALATE with 80% confidence. SAR may or may not be required · depends on documentation review by investigator.",
     details:"Tool call: evaluate_risk(alert_id='ALERT-0110', include_factors=true)\n\nSuspicious Indicators:\n1. International wire to Cayman Islands · offshore, no documentation\n2. International wire to HK Private Banking · high-risk, no documentation\n3. Source funds ($135K) undocumented from newly incorporated entity\n4. Adverse media: SEC investigation (Coastal Capital Group) · customer is named advisor\n5. Possible FBAR non-disclosure\n\nMitigating Factors:\n1. No prior alerts\n2. KYC current\n3. Occupation (financial consultant) makes some offshore activity plausible\n\nFinal Decision: ESCALATE\nConfidence: 80%\nSAR filing not certain · investigator to determine after documentation review."},
    {n:9,type:"STEP",title:"Narrative Generation",tool:"generate_narrative",status:"complete",
     summary:"Escalation narrative generated. Referred to Jennifer Park. First action: documentation request. If not provided within 5 days, proceed to SAR. FBAR non-disclosure flagged for IRS referral.",
     details:"Tool call: generate_narrative(alert_id='ALERT-0110', decision='ESCALATE')\n\nNarrative: 786 words\nKey recommendation: Request docs for (1) Cayman investment account, (2) HK Private Banking relationship, (3) Meridian Capital consulting engagement\nSAR guidance: Proceed if documentation not provided in 5 business days\nFBAR referral: Flag to IRS if SAR filed\n\nAlert: ESCALATE · Assigned to Jennifer Park\nNo case created at this stage · pending investigator documentation review"},
  ],
  "ALERT-0111":[
    {n:1,type:"STEP",title:"Alert Details Retrieval",tool:"get_alert_details",status:"complete",
     summary:"Alert ALERT-0111 triggered Dec 15, 2025 for Marisol Nguyen-Kelley. Two rules fired: HighRiskKeyword, VelocityIncrease. 9 flagged transactions · P2P transfers and a merchant purchase flagged on keyword 'delta'.",
     details:"Tool call: get_alert_details(alert_id='ALERT-0111')\n\nResult:\n· Alert ID: ALERT-0111\n· Customer: Marisol Nguyen-Kelley (C-5502-0111)\n· Date triggered: 2025-12-15\n· Rules fired: HighRiskKeyword, VelocityIncrease\n· Flagged transactions: TX-1088 (Delta Air Lines -$487), TX-1111 (Venmo +$2,850), TX-1112 (Venmo +$1,900), TX-1113 (Venmo +$1,750) + 5 additional Venmo transfers\n· Alert window: 2025-11-05 to 2025-12-15 (40 days)\n· Note: First alert for this customer. No prior suspicious activity."},
    {n:2,type:"STEP",title:"Customer Profile & KYC Review",tool:"get_customer_details",status:"complete",
     summary:"Marisol Nguyen-Kelley · Software Engineer, Synapse Technologies Inc, Austin TX. Risk 27 (LOW). No prior alerts. Stated income $135K. Regular bi-weekly payroll confirms salary.",
     details:"Tool call: get_customer_details(customer_id='C-5502-0111')\n\nResult:\n· Name: Marisol Nguyen-Kelley | DOB: 1993-09-12\n· Occupation: Senior Software Engineer · Synapse Technologies Inc (Austin, TX)\n· Account opened: 2020-11-02 | Stated income: $135,000\n· Customer risk score: 27 (LOW) | Alert risk score: 38 (LOW)\n· Prior alerts: 0 | KYC: CURRENT (2025-01-15)\n· Payroll verification: Bi-weekly ACH $5,625 from Synapse Technologies ($146,250 annualized · consistent with stated income)"},
    {n:3,type:"STEP",title:"Flagged Transaction Retrieval & Keyword Context",tool:"search_transactions",status:"complete",
     summary:"9 flagged transactions: all on 'delta' keyword. TX-1088 = Delta Air Lines purchase. TX-1111·TX-1113 + 6 more = Venmo reimbursements with 'delta force sprint' in memos. Context investigation: 'Delta Force Sprint' is annual Synapse Technologies engineering hackathon.",
     details:"Tool call: search_transactions(alert_id='ALERT-0111', flagged=true, limit=50)\n\nFlagged transactions:\n1. TX-1088 | Nov 15 | Delta Air Lines | -$487 | keyword: 'delta' (merchant)\n2. TX-1111 | Dec 10 | Venmo @kai.chen.dev | +$2,850 | keyword: 'delta force'\n3. TX-1112 | Dec 11 | Venmo @priya.dev.austin | +$1,900 | keyword: 'delta sprint hotel'\n4. TX-1113 | Dec 12 | Venmo @marcus.wei | +$1,750 | keyword: 'delta flights'\n5·9: Additional Venmo from same 4-person group, $400·$900 | keyword: 'delta'\n\nContext investigation:\n· 'Delta Force Sprint' = Synapse Technologies internal engineering hackathon (Dec 8·12, Seattle)\n· Company blog post confirmed event\n· All Venmo counterparties are verified Synapse Technologies colleagues (LinkedIn confirmed)"},
    {n:4,type:"STEP",title:"Baseline Transaction Summary",tool:"get_baseline_summary",status:"complete",
     summary:"90-day baseline: $5,625 bi-weekly payroll + small P2P activity ($50·$900 avg). December spike = hackathon travel reimbursements. One-time event explains entire velocity anomaly.",
     details:"Tool call: get_baseline_summary(customer_id='C-5502-0111', lookback_days=90, exclude_flagged=True)\n\nBaseline: $36,750 inflow (payroll + P2P) | P2P avg: $285/transaction | Largest P2P in baseline: $900\nDecember spike: 8 P2P credits totaling ~$13,000 in 4 days = 4.6x average 4-day P2P total\nExplanation: Hackathon · customer fronted hotel/flights, colleagues reimbursed via Venmo\nPattern: TX-1079 (Marriott Seattle -$1,425) then TX-1111·TX-1113 (reimbursements) = perfect cost-sharing structure"},
    {n:5,type:"STEP",title:"Income Verification Calculation",tool:"calculate",status:"complete",
     summary:"Alert inflow $145K = 1.07x stated annual income · fully explained by payroll. P2P $13K is transient reimbursement (net-zero). No income concern.",
     details:"Tool call: calculate(operation='income_verification', alert_id='ALERT-0111')\n\nPayroll (40 days): $22,500 · consistent with $135K stated income\nP2P reimbursements ($13K): Non-income, transient, net-zero (customer reimbursed what they paid out)\nIncome ratio: 1.07x · completely normal\nResult: NO CONCERN"},
    {n:6,type:"STEP",title:"High-Risk Keyword Deep-Dive",tool:"search_keyword_transactions",status:"complete",
     summary:"'Delta' in 9 flagged transactions · all resolved. 7 reference 'Delta Force Sprint' (Synapse hackathon, company-confirmed). 2 reference Delta Air Lines (legitimate airline). All counterparties verified colleagues. Zero unresolved hits.",
     details:"Tool call: search_keyword_transactions(customer_id='C-5502-0111', keywords=['delta','force','sprint','offshore','clean','layering','wash',...], full_context=True)\n\nKeyword resolution:\n· Delta Air Lines (TX-1088): legitimate airline purchase ?\n· 'delta force sprint' (7 Venmo memos): Synapse Technologies annual hackathon ?\n  Evidence: Company blog, LinkedIn posts from counterparties, employer-confirmed event\n\nOther high-risk keywords: 0 hits\nAll P2P counterparties: verified Synapse Technologies colleagues\nConclusion: ZERO unresolved keyword hits."},
    {n:7,type:"STEP",title:"Representative Window Analysis",tool:"analyze_window",status:"complete",
     summary:"October baseline window: normal payroll + small P2P. December spike window: payroll + hackathon reimbursements from verified colleagues. Marriott Seattle booking matches event dates exactly. No suspicious pattern.",
     details:"Tool call: analyze_window(customer_id='C-5502-0111', window_1='2025-10-14:2025-10-16', window_2='2025-12-09:2025-12-13')\n\nWindow 1 (baseline): Payroll $5,625, small personal spending, minor P2P ($45, $30) · completely normal\nWindow 2 (spike): Payroll $5,625 + Venmo reimbursements from 3 confirmed colleagues + Marriott Seattle -$1,425 + Delta Air Lines -$487 + Uber Seattle -$234\nConclusion: One-time event-driven spike, fully documented and verified."},
    {n:8,type:"STEP",title:"Risk Factor Synthesis & Decision",tool:"evaluate_risk",status:"complete",
     summary:"1 suspicious indicator (velocity, fully explained) vs 7 mitigating factors. CLEAR with 85% confidence. False positive · keyword-triggered by corporate event name.",
     details:"Tool call: evaluate_risk(alert_id='ALERT-0111', include_factors=true)\n\nSuspicious Indicators:\n1. Velocity spike (P2P credits Dec 8·12) · fully explained by hackathon travel reimbursements\n\nMitigating Factors:\n1. 'Delta' = corporate event name (Synapse Technologies hackathon), confirmed by employer\n2. All P2P counterparties: verified colleagues at same employer\n3. Net P2P position: near-zero\n4. Regular payroll consistent with stated $135K income\n5. Marriott Seattle + Delta Air Lines confirm actual travel event\n6. Zero prior alerts in 5-year history\n7. No adverse media, sanctions, or PEP flags\n\nFinal Decision: CLEAR (False Positive)\nConfidence: 85%"},
    {n:9,type:"STEP",title:"Narrative Generation",tool:"generate_narrative",status:"complete",
     summary:"CLEAR narrative generated. Customer note added: annual hackathon causes predictable velocity spike. Rule tuning recommendation submitted.",
     details:"Tool call: generate_narrative(alert_id='ALERT-0111', decision='CLEAR')\nalso: add_customer_note(customer_id='C-5502-0111', note='Delta Force Sprint is annual Synapse Technologies hackathon · December velocity spikes expected.')\n\nNarrative: 623 words · Decision: CLEAR, False Positive\nNo case created. No SAR required.\nRecommendation: Add rule suppression note for verified employer events."},
  ],
  "ALERT-0112":[
    {n:1,type:"STEP",title:"Alert Details Retrieval",tool:"get_alert_details",status:"complete",
     summary:"Alert ALERT-0112 triggered Dec 17, 2025 for Darius J. Wainwright. Three rules fired: HighRiskKeyword, VelocityIncrease, RoundAmounts. 14 flagged transactions · large round-number wire transfers through an attorney trust (IOLTA) account.",
     details:"Tool call: get_alert_details(alert_id='ALERT-0112')\n\nResult:\n· Alert ID: ALERT-0112\n· Customer: Darius J. Wainwright (C-6613-0112)\n· Date triggered: 2025-12-17\n· Rules fired: HighRiskKeyword, VelocityIncrease, RoundAmounts\n· Flagged transactions: 14 wire transfers · client fund inflows and legal disbursements\n· Total flagged volume: $490,000 inflow / $445,000 outflow\n· Alert window: 2025-11-01 to 2025-12-17 (47 days)\n· Account type: Professional Business Checking (IOLTA-linked)\n· Note: 7-year account relationship. 1 prior alert cleared in 2022 (same pattern)."},
    {n:2,type:"STEP",title:"Customer Profile & KYC Review",tool:"get_customer_details",status:"complete",
     summary:"Darius Wainwright · Attorney (Wainwright Law LLC), Chicago IL. Risk 27 (LOW). Stated income $320K. 7-year account. IOLTA registered with Illinois IOLTA Fund. Illinois Bar license Active, no disciplinary history. Prior 2022 alert cleared on same basis.",
     details:"Tool call: get_customer_details(customer_id='C-6613-0112')\n\nResult:\n· Name: Darius J. Wainwright | DOB: 1975-02-28\n· Occupation: Attorney · Wainwright Law LLC (principal, commercial real estate & M&A)\n· Account opened: 2018-06-20 (7.5 years) | Stated income: $320,000\n· Customer risk score: 27 (LOW) | Alert risk score: 41 (LOW)\n· Prior alerts: 1 (2022 · cleared; same round-number wire pattern)\n· KYC: CURRENT (2025-03-01)\n· Illinois State Bar: Active, in good standing, no disciplinary history\n· IOLTA: Registered with Illinois IOLTA Fund · compliant"},
    {n:3,type:"STEP",title:"Flagged Transaction Retrieval & Attorney Trust Account Analysis",tool:"search_transactions",status:"complete",
     summary:"14 flagged transactions: 4 large inbound client fund wires ($50K·$300K), 4 large outbound disbursements ($50K·$250K), payroll, court payments · all round numbers. All consistent with IOLTA trust account activity. Documentation retrieval initiated.",
     details:"Tool call: search_transactions(alert_id='ALERT-0112', flagged=true, limit=50)\n\nFlagged transactions:\n1. TX-1082 | Nov 1 | ACH Credit | Midwest Equity Group | +$50,000  Client retainer (engagement letter on file)\n2. TX-1090 | Nov 15 | Wire | Johnson & Reed LLP Escrow | -$120,000  Settlement (court order on file)\n3. TX-1100 | Nov 20 | ACH Debit | Wainwright Law LLC Payroll | -$65,000  Law firm payroll\n4. TX-1108 | Nov 29 | Wire | Lakeview Partners LLC | +$180,000  Commercial RE escrow (purchase agreement on file)\n5. TX-1115 | Dec 5 | Wire | Harrison Industrial Corp | +$300,000  M&A escrow deposit (LOI on file)\n6. TX-1121 | Dec 8 | Wire | 1st National Escrow | -$250,000  RE closing disbursement\n7. TX-1122 | Dec 10 | Wire | Cook County Circuit Court | -$50,000  Court-ordered bond payment\n8. TX-1123 | Dec 12 | Wire | Wainwright Law Operating | -$75,000  Attorney fee withdrawal (fee agreement: 25% of $300K)\n\nAll transactions: IOLTA trust account pattern · large round-number client funds and disbursements are standard for commercial law practice."},
    {n:4,type:"STEP",title:"Baseline Transaction Summary",tool:"get_baseline_summary",status:"complete",
     summary:"90-day baseline: avg $82K/month consistent with Active commercial practice. Alert window is 1.7x baseline · driven by single Harrison Industrial M&A closing. 78% round-number transactions in baseline · standard legal billing.",
     details:"Tool call: get_baseline_summary(customer_id='C-6613-0112', lookback_days=90, exclude_flagged=True)\n\nBaseline: $245,000 inflow / $238,000 outflow (90 days)\nAvg monthly: $81,700 | Avg transaction: $47,500 | Round-number %: 78%\n\nAlert window: $490,000 vs $82K = 1.7x monthly average\nPrimary spike cause: TX-1115 (Harrison Industrial $300K M&A closing · one-time event)\nExcluding Harrison: $190K · within normal range"},
    {n:5,type:"STEP",title:"Income Verification & Legal Documentation Review",tool:"calculate",status:"complete",
     summary:"IOLTA client funds are not income. Attorney fees withdrawn: $75K (fee agreement on file). Annualized: ~$180K · consistent with stated $320K income across multiple matters. ALL 14 transactions fully documented.",
     details:"Tool call: calculate(operation='income_verification', alert_id='ALERT-0112')\nalso: review_documentation(customer_id='C-6613-0112', all_flagged=True)\n\nIMPORTANT: IOLTA trust account · client funds are NOT attorney income.\nAttorney fees in alert window: $75,000 (TX-1123 · fee agreement on file)\nAnnualized fees estimate: ~$180K/yr (partial view)\n\nDocumentation review:\nAll 14 flagged transactions:  FULLY DOCUMENTED\n· TX-1082: Engagement letter  | TX-1090: Court Order  | TX-1100: Payroll records ?\n· TX-1108: Purchase agreement  | TX-1115: Executed LOI  | TX-1121: Closing statement ?\n· TX-1122: Court Order #2024-L-003891  | TX-1123: Fee agreement ?"},
    {n:6,type:"STEP",title:"High-Risk Keyword Search",tool:"search_keyword_transactions",status:"complete",
     summary:"Keywords 'settlement', 'escrow', 'judgment', 'bond' · all in legal context (court orders, RE closings, M&A). Zero hits for criminal slang. RoundAmounts rule: 78% of transactions round · standard legal billing (hourly · time, percentage fees, court amounts).",
     details:"Tool call: search_keyword_transactions(customer_id='C-6613-0112', keywords=['settlement','escrow','trust','judgment','bond','offshore','clean','layering',...], full_context=True)\n\nKeyword hits:\n· 'settlement' · TX-1090: Civil litigation settlement, court order on file  BENIGN\n· 'escrow' · TX-1108, TX-1115, TX-1121: RE and M&A escrow  BENIGN\n· 'judgment'/'bond' · TX-1122: Court-ordered payment  BENIGN\n\nHigh-risk keywords: ZERO hits for 'offshore', 'clean', 'layering', 'wash', 'cash', 'anonymous'\n\nRoundAmounts analysis: $50K retainer, $75K contingency fee, $120K settlement, $300K M&A escrow · all standard legal amounts. Round numbers in legal practice are a professional norm."},
    {n:7,type:"STEP",title:"Representative Window Analysis & Prior Alert Review",tool:"analyze_window",status:"complete",
     summary:"September baseline: normal law firm activity ($120K inflow, $102K outflow). December spike: single Harrison Industrial M&A closing. Prior 2022 alert cleared on identical basis · direct precedent. 7-year consistent history.",
     details:"Tool call: analyze_window(customer_id='C-6613-0112', window_1='2025-09-01:2025-09-30', window_2='2025-12-05:2025-12-12')\nalso: get_prior_alert_disposition(alert_id='ALERT-2022-0056')\n\nPrior alert (2022): Same rules triggered. Cleared after documentation review. Note on file: 'Attorney IOLTA · large round transfers are routine.'\n\nSep baseline: $120K inflow (3 client retainers + settlement), $102K outflow (payroll + court + operating)  normal\nDec spike: $300K Harrison Industrial M&A escrow deposit  single large matter drives spike\n\nConclusion: 7-year consistent history, prior alert cleared on same basis, all documentation present."},
    {n:8,type:"STEP",title:"Risk Factor Synthesis & Decision",tool:"evaluate_risk",status:"complete",
     summary:"1 technical suspicious indicator (round amounts, velocity) vs 7 strong mitigating factors. CLEAR with 85% confidence. False positive · IOLTA attorney trust account. Rule tuning recommendation submitted.",
     details:"Tool call: evaluate_risk(alert_id='ALERT-0112', include_factors=true)\n\nSuspicious Indicators:\n1. Round-number transactions and velocity spike · fully explained by legal billing and one-time M&A closing\n\nMitigating Factors:\n1. All 14 transactions fully documented (engagement letters, court orders, closing statements, fee agreements)\n2. IOLTA registration · Illinois IOLTA Fund compliant\n3. Illinois Bar license: Active, no disciplinary history\n4. 7-year account history: consistent, documented pattern\n5. Prior 2022 alert: identical pattern, cleared · direct precedent\n6. No adverse media, sanctions, or PEP flags\n7. Court-ordered disbursements confirm judicial oversight\n\nFinal Decision: CLEAR (False Positive)\nConfidence: 85%"},
    {n:9,type:"STEP",title:"Narrative Generation & Model Feedback",tool:"generate_narrative",status:"complete",
     summary:"CLEAR narrative generated. Rule tuning feedback submitted: IOLTA accounts should have elevated thresholds for RoundAmounts and VelocityIncrease rules.",
     details:"Tool call: generate_narrative(alert_id='ALERT-0112', decision='CLEAR')\nalso: submit_model_feedback(alert_id='ALERT-0112', feedback_type='false_positive', rules=['RoundAmounts','VelocityIncrease'], suggested_tuning='IOLTA accounts need elevated thresholds')\n\nNarrative: 714 words · Decision: CLEAR, False Positive\nModel feedback: Add IOLTA account exemption to RoundAmounts rule; use matter-adjusted velocity baseline for law firms\nExpected impact: ~40% reduction in false positives on attorney accounts\n\nNo case created. No SAR required.\nAccount C-6613-0112 recommendation: Tag as IOLTA type; apply attorney-specific rule thresholds"},
  ],
};

const CASES = [
  {id:"CASE-2025-001",alertId:"ALERT-0108",customerId:"C-7712-0108",title:"International Wire - High Risk Patterns",status:"OPEN",priority:"HIGH",assignee:"Sarah Chen",created:"2025-12-11",dueDate:"2025-12-18",stage:"AI Investigation",sarRequired:true,findings:"Multiple large international wire transfers to high-risk jurisdictions. Pattern consistent with trade-based money laundering.",documents:[
    {id:"doc1",type:"Transaction Records",name:"Wire Transfer Confirmations Q4-2025.pdf",size:"2.1 MB",uploaded:"2025-12-11",by:"Sarah Chen",status:"attached"},
    {id:"doc2",type:"Account Information",name:"Torres_KYC_Package_2021.pdf",size:"4.7 MB",uploaded:"2025-12-11",by:"System",status:"attached"},
    {id:"doc3",type:"Internal Analysis",name:"AML_Analyst_Notes_CASE-001.docx",size:"156 KB",uploaded:"2025-12-12",by:"Sarah Chen",status:"attached"},
  ]},
  {id:"CASE-2025-002",alertId:"ALERT-0109",customerId:"C-4490-0109",title:"Structuring & HighValue Deposits - Real Estate",status:"OPEN",priority:"CRITICAL",assignee:"Marcus Williams",created:"2025-12-12",dueDate:"2025-12-19",stage:"Compliance Review",sarRequired:true,findings:"Classic structuring pattern with deposits systematically below CTR threshold. Real estate connections suggest layering phase.",documents:[
    {id:"doc4",type:"Transaction Records",name:"Hall_Deposit_Records_Nov-Dec2025.pdf",size:"3.2 MB",uploaded:"2025-12-12",by:"Marcus Williams",status:"attached"},
    {id:"doc5",type:"Account Information",name:"Neal_Hall_KYC_Enhanced_2024.pdf",size:"6.1 MB",uploaded:"2025-12-12",by:"System",status:"attached"},
    {id:"doc6",type:"Correspondence & Emails",name:"Internal_Escalation_Email_Thread.pdf",size:"890 KB",uploaded:"2025-12-13",by:"Marcus Williams",status:"attached"},
    {id:"doc7",type:"Internal Analysis",name:"Structuring_Pattern_Analysis.xlsx",size:"445 KB",uploaded:"2025-12-14",by:"Marcus Williams",status:"attached"},
  ]},
  {id:"CASE-2025-003",alertId:"ALERT-0110",customerId:"C-3381-0110",title:"Circular Funds Movement - Financial Consultant",status:"UNDER_REVIEW",priority:"MEDIUM",assignee:"Jennifer Park",created:"2025-12-12",dueDate:"2025-12-22",stage:"Investigator Analysis",sarRequired:false,findings:"International wire activity with circular patterns. Further investigation required.",documents:[
    {id:"doc8",type:"Transaction Records",name:"Hall_David_Transaction_Export.csv",size:"234 KB",uploaded:"2025-12-12",by:"System",status:"attached"},
  ]},
];

const SARS = [
  {id:"SAR-2025-001",caseId:"CASE-2025-002",customerId:"C-4490-0109",status:"DRAFT",filingDeadline:"2026-01-12",preparedBy:"Marcus Williams",reviewedBy:null,qcScore:82,missingFields:["Supporting Document #3","Final Reviewer Signature"],
   narrative:"Subject Neal Hall, a Real Estate Developer, engaged in a structured cash deposit pattern across three branches with nine deposits ranging $8,900 to $9,800 over four consecutive days · totaling $87,200 below CTR thresholds. Network analysis reveals circular fund movement through linked shell entities (Nexus Realty LLC, Pacific Shell Corp). Pattern is consistent with placement and layering typologies under FinCEN guidance.",
   auditTrail:[
     {ts:"2025-12-12 14:32",user:"Themis AI",action:"Initial narrative generated",detail:"AI generated 847-word narrative based on investigation findings"},
     {ts:"2025-12-13 09:15",user:"Marcus Williams",action:"Edited Section 2 (Subject Information)",detail:"Updated occupation description and added LLC details"},
     {ts:"2025-12-13 11:42",user:"Marcus Williams",action:"Edited Section 4 (Transaction Timeline)",detail:"Added three additional flagged transactions from Nov 29"},
     {ts:"2025-12-14 16:20",user:"Themis AI",action:"QC check run",detail:"QC score 82/100. Flagged 2 missing fields."},
     {ts:"2025-12-15 10:05",user:"Marcus Williams",action:"Edited Section 5 (Reason for Suspicion)",detail:"Strengthened language around structuring pattern"},
   ]},
  {id:"SAR-2025-002",caseId:"CASE-2025-001",customerId:"C-7712-0108",status:"IN_REVIEW",filingDeadline:"2026-01-18",preparedBy:"Sarah Chen",reviewedBy:"Compliance Officer Kim",qcScore:91,missingFields:[],
   narrative:"Subject Ryan Torres, an Import/Export Consultant, reactivated a 14-month dormant account followed by $340,000 in international wire transfers to Panama and London with no documented business purpose. Trade invoice from 'Global Trade Partners Inc' could not be verified. Pattern is consistent with trade-based money laundering and dormant-account warm-up typologies.",
   auditTrail:[
     {ts:"2025-12-11 16:00",user:"Themis AI",action:"Initial narrative generated",detail:"AI generated 912-word narrative"},
     {ts:"2025-12-12 10:30",user:"Sarah Chen",action:"Edited Section 3 (Transaction Timeline)",detail:"Added wire transfer reference numbers"},
     {ts:"2025-12-13 14:15",user:"Compliance Officer Kim",action:"Review started",detail:"Compliance officer review initiated"},
     {ts:"2025-12-14 09:45",user:"Compliance Officer Kim",action:"Approved for submission",detail:"QC score 91/100. All required fields complete."},
   ]},
];

const ANOMALIES = [
  {id:"AN-001",type:"CRITICAL",title:"Circular Fund Movement",desc:"Circular fund movement detected across 4 accounts · Neal Hall network",accounts:["C-4490-0109","C-7712-0108","Nexus Realty LLC","Pacific Shell Corp"],detected:"2025-12-12",amount:"$430,000",alertId:"ALERT-0109",
   details:"Themis Graph ML detected a circular money movement pattern involving Neal Hall and 3 connected entities. Funds originate from Hall's account, pass through Nexus Realty LLC and Pacific Shell Corp, and a portion (approx. $30K) returns to the originating account via Ryan Torres. This round-trip pattern within 6 days is a strong indicator of layering · the second stage of money laundering where illicit funds are moved to obscure their origin.\n\nFlow: Hall  Nexus ($95K)  Pacific Shell ($40K)  Torres ($35K)  Hall ($30K)\nAdditional flow: Hall  Deutsche Bank Frankfurt ($200K) · possible placement exit\n\nML Model: Network Cluster Detector v0.9 | Confidence: 87%",
   recommendations:["Immediate SAR filing recommended","Freeze accounts pending investigation","Request transaction records from all connected entities","Issue RFI to correspondent banks for wire details"]},
  {id:"AN-002",type:"HIGH",title:"Structuring Pattern · 9 Deposits",desc:"9 deposits below $10K threshold · Neal Hall",accounts:["C-4490-0109"],detected:"2025-12-12",amount:"$87,200",alertId:"ALERT-0109",
   details:"ML model identified a systematic pattern of cash deposits where each transaction falls below the $10,000 Currency Transaction Report (CTR) filing threshold. Over 4 consecutive days, 9 deposits were made across 3 different branch locations.\n\nDeposit pattern:\n· Dec 1: $8,900 (Hollywood Branch)\n· Dec 2: $9,500 (Burbank Branch)\n· Dec 3: $9,800 (Downtown LA Branch)\n· Dec 4: $8,700 (Hollywood Branch)\n[...5 more deposits]\n\nTotal: $87,200 in structured deposits\nAvg per deposit: $9,689 · deliberately proximate to but below threshold\n\nML Model: AML Alert Classifier v2.4 | Confidence: 94%",
   recommendations:["File CTR for aggregated deposits exceeding $10K","Flag for structuring investigation","Cross-reference with other institution reports via FinCEN"]},
  {id:"AN-003",type:"HIGH",title:"Dormant Account Reactivation",desc:"Dormant account sudden activation · Ryan Torres (14 months inActive)",accounts:["C-7712-0108"],detected:"2025-12-11",amount:"$340,000",alertId:"ALERT-0108",
   details:"Account C-7712-0108 (Ryan Torres) showed zero transaction activity for 14 months (October 2024 · November 2025). The account was then activated with $210,000 credit from 'Global Trade Partners Inc' followed immediately by two large international wire transfers within 10 days.\n\nTimeline:\n· Oct 2024: Last transaction (account goes dormant)\n· Nov 28, 2025: $210,000 ACH credit · 'Trade Invoice'\n· Dec 5, 2025: $85,000 wire  Panama\n· Dec 8, 2025: $120,000 wire  London\n\nDormant-to-Active pattern is a known typology for accounts being 'warmed up' for use in layering schemes.\n\nML Model: Behavioral Risk Profiler v1.1 | Confidence: 82%",
   recommendations:["Enhanced customer due diligence immediately","Request documentation for trade invoice","Verify counterparties · Global Trade Partners Inc","Consider account restriction pending review"]},
  {id:"AN-004",type:"MEDIUM",title:"Velocity Spike · Garcia",desc:"Velocity spike 340% above 90-day baseline · Jeremiah Garcia",accounts:["C-8518-0100"],detected:"2025-12-01",amount:"$16,800",alertId:"ALERT-0100",
   details:"Customer Jeremiah Garcia's transaction velocity on Nov 29, 2025 was 340% above their established 90-day behavioral baseline. The spike was driven by 3 same-day cash deposits across 3 branches totaling $16,800.\n\nBaseline: $514 average transaction size, no cash deposits historically\nAnomaly: $5,600 average across 3 transactions, all cash deposits\n\nWhile the velocity spike is significant, investigation concluded this was likely a false positive given the customer's cash-intensive business nature and travel reimbursement patterns.\n\nML Model: Transaction Anomaly Detector v1.8 | Confidence: 73%",
   recommendations:["Alert has been cleared (false positive)","Monitor for recurrence over next 90 days","Consider adding explanatory note to customer profile"]},
];

const SCREENING_RESULTS = [
  {id:"scr1",type:"PEP",entity:"Neal Hall",entityId:"C-4490-0109",entityType:"customer",match:"POTENTIAL",score:72,source:"World-Check (LSEG)",details:"Name match in PEP Database",action:"Enhanced Monitoring",
   pepDetails:{positions:[{title:"Member, Los Angeles County Infrastructure Commission",from:"2019-02",to:"2022-08",jurisdiction:"Los Angeles County, CA",appointedBy:"County Board of Supervisors"},{title:"Advisor, CA State Real Estate Development Fund",from:"2017-06",to:"2019-01",jurisdiction:"State of California",appointedBy:"Governor's Office"}],familyLinks:[],riskNarrative:"Subject held appointed public positions giving access to infrastructure contract decisions and public fund allocations. Positions have concluded but PEP status persists for 5 years per FATF guidance."}},
  {id:"scr2",type:"Sanctions",entity:"Ryan Torres",entityId:"C-7712-0108",entityType:"customer",match:"NO_MATCH",score:0,source:"OFAC SDN",details:"No match found",action:"Clear",sanctionDetails:{hits:[],lastChecked:"2025-12-11 08:00"}},
  {id:"scr3",type:"Adverse Media",entity:"David Hall",entityId:"C-3381-0110",entityType:"customer",match:"POTENTIAL",score:58,source:"Dow Jones Risk Center",details:"Associated entity in fraud investigation",action:"Review Required",
   mediaDetails:{articles:[{headline:"Miami-Based Financial Firm Under State Investigation for Undisclosed Conflicts",publication:"Miami Herald",date:"2024-03-14",url:"https://miamiherald.com",snippet:"Investigators have subpoenaed records from several Miami-area financial consultants connected to the fund...",relevanceScore:72},{headline:"SEC Issues Wells Notice to Coastal Capital Group",publication:"Bloomberg Law",date:"2024-07-22",url:"https://bloomberglaw.com",snippet:"The SEC sent Wells notices to principals at Coastal Capital Group, where sources indicate David Hall served as an advisor...",relevanceScore:85}]}},
  {id:"scr4",type:"Sanctions",entity:"Jeremiah Garcia",entityId:"C-8518-0100",entityType:"customer",match:"NO_MATCH",score:0,source:"EU Consolidated Sanctions",details:"No match found",action:"Clear",sanctionDetails:{hits:[],lastChecked:"2025-12-01 06:00"}},
  {id:"scr5",type:"PEP",entity:"Marisol Nguyen-Kelley",entityId:"C-5502-0111",entityType:"customer",match:"NO_MATCH",score:0,source:"Refinitiv World-Check",details:"No match found",action:"Clear",pepDetails:{positions:[],familyLinks:[]}},
  {id:"scr6",type:"Enforcement",entity:"Nexus Realty LLC",entityId:"nexus-realty",entityType:"entity",match:"HIT",score:91,source:"CA DRE & FinCEN",details:"Regulatory enforcement action",action:"Escalate",
   enforcementDetails:{actions:[{authority:"California Department of Real Estate",type:"License Suspension",date:"2024-09-01",jurisdiction:"State of California",docketNumber:"2024-DRE-0491",description:"License suspended for 180 days following investigation into undisclosed dual agency relationships and commingling of client funds.",status:"Resolved (Dec 2024)",penaltyAmount:"$85,000 fine"},{authority:"FinCEN",type:"Civil Money Penalty",date:"2023-11-15",jurisdiction:"Federal",docketNumber:"2023-FMC-0112",description:"Failure to maintain adequate AML program and file required CTRs for real estate transactions exceeding $10,000.",status:"Final Order",penaltyAmount:"$250,000 civil money penalty"}]}},
  {id:"scr7",type:"Sanctions",entity:"HSBC Panama Branch",entityId:"hsbc-panama",entityType:"entity",match:"POTENTIAL",score:44,source:"FATF High-Risk Jurisdictions",details:"Correspondent bank in FATF-listed jurisdiction",action:"Enhanced Due Diligence",
   sanctionDetails:{hits:[{program:"FATF Jurisdiction Under Increased Monitoring",entity:"Panama (Jurisdiction)",status:"Grey List · Increased Monitoring",date:"2023-06-23",sanctioningBody:"FATF",reference:"https://www.fatf-gafi.org/en/topics/grey-and-black-lists.html",description:"Panama remains under FATF increased monitoring. Correspondent banking relationships require enhanced due diligence and documentation of business purpose."}],lastChecked:"2025-12-11 08:00"}},
  {id:"scr8",type:"Adverse Media",entity:"Pacific Shell Corp",entityId:"pacific-shell",entityType:"entity",match:"HIT",score:87,source:"OpenCorporates & Media Scan",details:"Shell company with no public business presence",action:"Escalate",
   mediaDetails:{articles:[{headline:"Panama Papers Leak References Pacific Shell Corp as Nominee Entity",publication:"ICIJ",date:"2016-04-05",url:"https://offshoreleaks.icij.org",snippet:"Records show Pacific Shell Corp was incorporated in BVI in 2011 as a nominee holding vehicle...",relevanceScore:87},{headline:"LA Real Estate Deals Scrutinized in Money Laundering Probe",publication:"LA Times",date:"2024-10-18",url:"https://latimes.com",snippet:"Investigators are examining a series of real estate transactions involving shell companies including Pacific Shell Corp...",relevanceScore:91}]}},
];



// --- DASHBOARD VIEW ------------------------------------------
function DashboardView({onNav}){
  const escalated=ALERTS.filter(a=>a.status==="ESCALATE").length;
  const cleared=ALERTS.filter(a=>a.status==="CLEAR").length;
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:21,fontWeight:800,color:"#0F172A",letterSpacing:"-0.02em"}}>Operations Overview</div>
        <div style={{fontSize:12,color:"#64748B",marginTop:3,display:"flex",alignItems:"center",gap:8}}>
          Real-time AML monitoring · Themis AI
          <Pill label="Live" color="#15803D" bg="#DCFCE7"/>
        </div>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <MCard label="Total Alerts" value={ALERTS.length} onClick={()=>onNav("alerts")}/>
        <MCard label="Escalated" value={escalated} color="#EF4444" onClick={()=>onNav("alerts")}/>
        <MCard label="Auto-Cleared" value={cleared} color="#10B981" sub="85% avg confidence"/>
        <MCard label="Open Cases" value={CASES.filter(c=>c.status!=="CLOSED").length} color={NAVY} onClick={()=>onNav("cases")}/>
        <MCard label="Pending SARs" value={SARS.length} color="#7C3AED" onClick={()=>onNav("sar-list")}/>
        <MCard label="Txns Analyzed" value="3,846" color="#D97706"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={{background:"white",borderRadius:12,padding:18,border:"1px solid #E2E8F0"}}>
          <SH title="L1 Agent  Alert Queue" sub={`${ALERTS.length} alerts · 81% avg confidence`}
            action={<button onClick={()=>onNav("alerts")} style={{fontSize:12,color:NAVY,border:"none",background:"none",cursor:"pointer",fontWeight:700}}>View All </button>}/>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>{["Alert","Customer","Decision","Risk","Action"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"5px 8px",color:"#94A3B8",fontWeight:600,fontSize:10}}>{h}</th>
            ))}</tr></thead>
            <tbody>{ALERTS.map(a=>{const c=CUSTOMERS[a.customerId];return(
              <tr key={a.id} onClick={()=>onNav("alert-detail",a.id)}
                onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                style={{borderBottom:"1px solid #F8FAFC",cursor:"pointer"}}>
                <td style={{padding:"7px 8px",color:NAVY,fontWeight:700,fontFamily:"monospace",fontSize:11}}>{a.id}</td>
                <td style={{padding:"7px 8px",color:"#0F172A",fontWeight:500}}>{c?.name}</td>
                <td style={{padding:"7px 8px"}}><Badge label={a.status} color={sc(a.status)} bg={a.status==="CLEAR"?"#D1FAE5":"#FEE2E2"}/></td>
                <td style={{padding:"7px 8px"}}>
                  <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:a.alertRisk>=70?"#EF4444":a.alertRisk>=50?"#F59E0B":"#10B981"}}>{a.alertRisk}</span>
                </td>
                <td style={{padding:"7px 8px"}}><button onClick={e=>{e.stopPropagation();onNav("alert-detail",a.id);}} style={{fontSize:10,padding:"2px 8px",borderRadius:4,border:`1px solid ${NAVY}`,background:"white",cursor:"pointer",color:NAVY,fontWeight:600}}>Open</button></td>
              </tr>
            );})}
          </tbody></table>
        </div>
        <div style={{background:"white",borderRadius:12,padding:18,border:"1px solid #E2E8F0"}}>
          <SH title="Dynamic Anomaly Detection" sub="4 anomalies detected · ML-driven"
            action={<Pill label="Live"/>}/>
          {ANOMALIES.map(an=>(
            <div key={an.id} onClick={()=>onNav("anomaly-detail",an.id)}
              style={{borderLeft:`3px solid ${sc(an.type)}`,paddingLeft:10,paddingTop:6,paddingBottom:6,marginBottom:8,cursor:"pointer",borderRadius:"0 6px 6px 0"}}
              onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <Badge label={an.type} color={sc(an.type)} bg={rb(an.type)}/>
                <span style={{fontFamily:"monospace",fontSize:11,color:"#64748B"}}>{an.amount}</span>
              </div>
              <div style={{fontSize:12,color:"#334155",fontWeight:500,marginTop:3}}>{an.desc}</div>
              <div style={{fontSize:10,color:NAVY,marginTop:2,fontWeight:600}}>Click for details ?</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"white",borderRadius:12,padding:18,border:"1px solid #E2E8F0"}}>
          <SH title="Active Cases" action={<button onClick={()=>onNav("cases")} style={{fontSize:12,color:NAVY,border:"none",background:"none",cursor:"pointer",fontWeight:700}}>View All </button>}/>
          {CASES.map(cs=>{const c=CUSTOMERS[cs.customerId];return(
            <div key={cs.id} onClick={()=>onNav("case-detail",cs.id)} style={{padding:"8px 0",borderBottom:"1px solid #F1F5F9",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.75"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontFamily:"monospace",color:NAVY,fontWeight:700,fontSize:11}}>{cs.id}</span>
                <Badge label={cs.priority} color={sc(cs.priority)} bg={rb(cs.priority)}/>
              </div>
              <div style={{fontSize:13,fontWeight:600,color:"#0F172A",marginTop:2}}>{c?.name}</div>
              <div style={{fontSize:11,color:"#64748B"}}>{cs.stage} · Due {fd(cs.dueDate)}</div>
            </div>
          );})}
        </div>
        <div style={{background:"white",borderRadius:12,padding:18,border:"1px solid #E2E8F0"}}>
          <SH title="Data Sources" action={<Pill label="Live"/>}/>
          {[{n:"Core Banking (Temenos T24)",s:"CONNECTED",t:"2 min ago"},{n:"SWIFT Wire System",s:"CONNECTED",t:"5 min ago"},{n:"Card Processing (FIS)",s:"CONNECTED",t:"1 min ago"},{n:"Kafka Streaming",s:"CONNECTED",t:"Real-time"},{n:"World-Check Sanctions",s:"CONNECTED",t:"06:00 AM"},{n:"PEP Database (Refinitiv)",s:"DISCONNECTED",t:"Never"}].map(ds=>(
            <div key={ds.n} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,padding:"5px 0",borderBottom:"1px solid #F8FAFC"}}>
              <span style={{fontWeight:500,color:"#334155"}}>{ds.n}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:10,color:"#94A3B8"}}>{ds.t}</span>
                <span style={{width:7,height:7,borderRadius:"50%",background:sc(ds.s),display:"inline-block"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- ANOMALY DETAIL VIEW --------------------------------------
function AnomalyDetailView({anomalyId,onNav}){
  const an=ANOMALIES.find(a=>a.id===anomalyId);
  if(!an)return null;
  const relatedAlert=ALERTS.find(a=>a.id===an.alertId);
  const relatedCustomer=relatedAlert?CUSTOMERS[relatedAlert.customerId]:null;
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{fontSize:12,color:"#64748B",marginBottom:14}}>
        <span style={{cursor:"pointer",color:NAVY,fontWeight:600}} onClick={()=>onNav("dashboard")}>? Dashboard</span>
        <span style={{margin:"0 6px"}}>·</span>
        <span style={{fontFamily:"monospace",fontWeight:700}}>{an.id}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <Badge label={an.type} color={sc(an.type)} bg={rb(an.type)}/>
            <span style={{fontSize:11,color:"#94A3B8",fontFamily:"monospace"}}>{an.id}</span>
          </div>
          <div style={{fontSize:20,fontWeight:800,color:"#0F172A"}}>{an.title}</div>
          <div style={{fontSize:13,color:"#64748B",marginTop:4}}>Detected {fd(an.detected)} · Amount: <strong style={{color:sc(an.type)}}>{an.amount}</strong></div>
        </div>
        {relatedAlert&&<button onClick={()=>onNav("alert-detail",relatedAlert.id)}
          style={{padding:"8px 16px",background:NAVY,color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:13}}>
          View Alert {relatedAlert.id} ?
        </button>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:18}}>
        <div>
          <div style={{background:"white",borderRadius:10,padding:20,border:"1px solid #E2E8F0",marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Anomaly Analysis</div>
            <div style={{fontSize:13,color:"#334155",lineHeight:1.8,whiteSpace:"pre-line"}}>{an.details}</div>
          </div>
          <div style={{background:"white",borderRadius:10,padding:20,border:"1px solid #E2E8F0",marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Recommended Actions</div>
            {an.recommendations.map((r,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderBottom:"1px solid #F8FAFC"}}>
                <span style={{width:22,height:22,borderRadius:"50%",background:NAVY,color:"white",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</span>
                <span style={{fontSize:13,color:"#334155"}}>{r}</span>
              </div>
            ))}
          </div>
          <div style={{background:"white",borderRadius:10,padding:20,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Accounts Involved</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {an.accounts.map(acc=>(
                <div key={acc} style={{padding:"6px 14px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:7,fontSize:12,fontWeight:500,color:"#334155",cursor:"pointer"}}
                  onClick={()=>{const c=Object.values(CUSTOMERS).find(x=>x.id===acc);if(c)onNav("customer-detail",acc);}}>
                  {acc}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:"white",borderRadius:10,padding:16,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:10,letterSpacing:"0.05em"}}>ANOMALY DETAILS</div>
            <KV label="Anomaly ID" value={an.id} mono/><div style={{marginBottom:8}}/>
            <KV label="Severity" value={<Badge label={an.type} color={sc(an.type)} bg={rb(an.type)}/>}/><div style={{marginBottom:8}}/>
            <KV label="Amount" value={an.amount} mono/><div style={{marginBottom:8}}/>
            <KV label="Detected" value={fd(an.detected)}/><div style={{marginBottom:8}}/>
            <KV label="Related Alert" value={<span style={{color:NAVY,cursor:"pointer",fontWeight:700}} onClick={()=>relatedAlert&&onNav("alert-detail",relatedAlert.id)}>{an.alertId}</span>}/>
          </div>
          {relatedCustomer&&(
            <div style={{background:"white",borderRadius:10,padding:16,border:"1px solid #E2E8F0"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:10,letterSpacing:"0.05em"}}>SUBJECT</div>
              <div style={{fontWeight:700,color:"#0F172A",fontSize:13,marginBottom:4}}>{relatedCustomer.name}</div>
              <div style={{fontSize:12,color:"#64748B",marginBottom:4}}>{relatedCustomer.occupation}</div>
              <Badge label={relatedCustomer.customerRiskLevel} color={rc(relatedCustomer.customerRiskLevel)} bg={rb(relatedCustomer.customerRiskLevel)}/><div style={{marginTop:8}}/>
              <button onClick={()=>onNav("customer-detail",relatedCustomer.id)} style={{width:"100%",marginTop:8,padding:"7px 0",background:NAVY,color:"white",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>View Customer Profile ?</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- TRANSACTION CHART (inline timeline) ---------------------
function TxnTimeline({Data,height=120}){
  if(!Data||!Data.length)return<div style={{height,display:"flex",alignItems:"center",justifyContent:"center",color:"#94A3B8",fontSize:12}}>No timeline Data</div>;
  const maxVal=Math.max(...Data.map(d=>Math.max(d.inflow,d.outflow)),1);
  const barW=Math.floor(580/Data.length)-6;
  return(
    <svg width="100%" viewBox={`0 0 600 ${height+30}`} style={{overflow:"visible"}}>
      {Data.map((d,i)=>{
        const x=10+i*(barW+6);
        const iH=(d.inflow/maxVal)*(height-10);
        const oH=(d.outflow/maxVal)*(height-10);
        const dateLabel=d.date.slice(5);
        return(
          <g key={i}>
            {d.inflow>0&&<rect x={x} y={height-iH} width={barW/2-1} height={iH} fill="#10B981" fillOpacity={0.85} rx={2}>
              <title>Inflow: {fm(d.inflow)} on {d.date}</title>
            </rect>}
            {d.outflow>0&&<rect x={x+barW/2+1} y={height-oH} width={barW/2-1} height={oH} fill="#EF4444" fillOpacity={0.85} rx={2}>
              <title>Outflow: {fm(d.outflow)} on {d.date}</title>
            </rect>}
            <text x={x+barW/2} y={height+16} textAnchor="middle" fontSize="9" fill="#94A3B8">{dateLabel}</text>
          </g>
        );
      })}
      <line x1={0} y1={height} x2={600} y2={height} stroke="#E2E8F0" strokeWidth={1}/>
      <rect x={460} y={4} width={8} height={8} fill="#10B981" fillOpacity={0.85} rx={1}/><text x={472} y={12} fontSize="9" fill="#64748B">Inflow</text>
      <rect x={510} y={4} width={8} height={8} fill="#EF4444" fillOpacity={0.85} rx={1}/><text x={522} y={12} fontSize="9" fill="#64748B">Outflow</text>
    </svg>
  );
}

// --- COUNTERPARTY NETWORK (inline) ---------------------------
function NetworkGraph({Data}){
  if(!Data)return null;
  const {nodes,edges}=Data;
  const nodeMap=Object.fromEntries(nodes.map(n=>[n.id,n]));
  const nodeColor=t=>({subject:NAVY,entity:"#F59E0B",branch:"#10B981",bank:"#8B5CF6",processor:"#64748B"})[t]||"#94A3B8";
  return(
    <svg width="100%" viewBox="0 0 600 300" style={{background:"#F8FAFC",borderRadius:8}}>
      <defs>
        <marker id="arrowGreen" markerWidth="7" markerHeight="7" refX="6" refY="2" orient="auto"><path d="M0,0 L0,4 L7,2 z" fill="#10B981"/></marker>
        <marker id="arrowRed" markerWidth="7" markerHeight="7" refX="6" refY="2" orient="auto"><path d="M0,0 L0,4 L7,2 z" fill="#EF4444"/></marker>
      </defs>
      {edges.map((e,i)=>{
        const from=nodeMap[e.from],to=nodeMap[e.to];
        if(!from||!to)return null;
        const mx=(from.x+to.x)/2,my=(from.y+to.y)/2;
        const color=e.dir==="in"?"#10B981":"#EF4444";
        return(
          <g key={i}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={1.5} strokeOpacity={0.7} markerEnd={e.dir==="in"?"url(#arrowGreen)":"url(#arrowRed)"}/>
            <rect x={mx-16} y={my-8} width={32} height={14} fill="white" rx={3} stroke={color} strokeWidth={0.5}/>
            <text x={mx} y={my+2} textAnchor="middle" fontSize="8" fill={color} fontWeight="700">{e.amount}</text>
          </g>
        );
      })}
      {nodes.map(node=>{
        const color=nodeColor(node.type);
        const r=node.type==="subject"?24:18;
        const words=node.label.split(" ");
        const line1=words.slice(0,2).join(" ");
        const line2=words.slice(2).join(" ");
        return(
          <g key={node.id}>
            {node.risk==="HIGH"&&<circle cx={node.x} cy={node.y} r={r+7} fill="none" stroke="#EF4444" strokeWidth={1} strokeDasharray="4,3"/>}
            {node.risk==="CRITICAL"&&<circle cx={node.x} cy={node.y} r={r+7} fill="none" stroke="#DC2626" strokeWidth={1.5} strokeDasharray="4,3"/>}
            <circle cx={node.x} cy={node.y} r={r} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2}/>
            <text x={node.x} y={node.y+(line2?-3:4)} textAnchor="middle" fontSize="9" fill={color} fontWeight="700">{line1}</text>
            {line2&&<text x={node.x} y={node.y+9} textAnchor="middle" fontSize="9" fill={color} fontWeight="700">{line2}</text>}
            <text x={node.x} y={node.y+r+12} textAnchor="middle" fontSize="9" fill="#64748B">{node.type}</text>
          </g>
        );
      })}
    </svg>
  );
}

// --- TRANSACTION DETAIL MODAL ---------------------------------
function TxnModal({txn,onClose}){
  if(!txn)return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:14,padding:28,width:540,maxHeight:"80vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#0F172A"}}>Transaction Details</div>
            <div style={{fontFamily:"monospace",fontSize:12,color:"#64748B",marginTop:2}}>{txn.id}</div>
          </div>
          <button onClick={onClose} style={{background:"#F1F5F9",border:"none",borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,color:"#64748B"}}>?</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
          <KV label="Date" value={`${txn.date} ${txn.time}`}/><KV label="Amount" value={<span style={{color:txn.amount>0?"#059669":"#EF4444",fontWeight:700}}>{txn.amount>0?"+":""}{fm(Math.abs(txn.amount))}</span>}/>
          <KV label="Category" value={txn.category} mono/><KV label="Country" value={txn.country}/>
          <KV label="Balance After" value={`$${txn.balance?.toLocaleString()}`} mono/><KV label="City" value={txn.city||"·"}/>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"#94A3B8",letterSpacing:"0.05em",marginBottom:6}}>COUNTERPARTY</div>
          <div style={{fontWeight:600,color:"#0F172A",fontSize:14}}>{txn.counterparty}</div>
          <div style={{fontSize:11,color:"#64748B",marginTop:2}}>Type: {txn.cpType}</div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"#94A3B8",letterSpacing:"0.05em",marginBottom:6}}>DESCRIPTION</div>
          <div style={{fontSize:13,color:"#334155"}}>{txn.desc}</div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"#94A3B8",letterSpacing:"0.05em",marginBottom:6}}>ANALYST NOTES</div>
          <div style={{fontSize:13,color:"#475569",lineHeight:1.6,background:"#F8FAFC",borderRadius:7,padding:10}}>{txn.notes}</div>
        </div>
        {txn.flagged&&(
          <div style={{background:"#FEF2F2",borderRadius:8,padding:12,border:"1px solid #FECACA",marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:"#991B1B",marginBottom:6}}> Flagged Transaction</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {txn.riskIndicators.map(r=>(
                <span key={r} style={{fontSize:11,background:"#FEE2E2",color:"#991B1B",padding:"2px 8px",borderRadius:4,fontWeight:600}}>{r}</span>
              ))}
            </div>
          </div>
        )}
        <div style={{background:"#EFF6FF",borderRadius:8,padding:12,border:"1px solid #BFDBFE"}}>
          <div style={{fontSize:11,fontWeight:700,color:NAVY,marginBottom:4}}> Explainability</div>
          <div style={{fontSize:12,color:"#1D4ED8"}}>
            This transaction was flagged because NAVY_MID {txn.flagged?`matches ${txn.riskIndicators.join(", ")} risk indicators. ${txn.notes}`:"is part of the transaction history for context."}</div>
        </div>
      </div>
    </div>
  );
}

// --- CUSTOMER RISK EXPLAINABILITY MODAL ---------------------
function RiskExplainModal({customer,type,onClose}){
  if(!customer)return null;
  const riskScore=type==="alert"?customer.alertRisk:customer.customerRisk;
  const riskLevel=type==="alert"?customer.alertRiskLevel:customer.customerRiskLevel;
  const factors=customer.riskFactors||[];
  const upFactors=factors.filter(f=>f.direction==="up");
  const downFactors=factors.filter(f=>f.direction==="down");
  const title=type==="alert"?"Alert Risk Score Explainability":"Customer Risk Score Explainability";
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:14,padding:28,width:580,maxHeight:"80vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#0F172A"}}> {title}</div>
            <div style={{fontSize:12,color:"#64748B",marginTop:2}}>{customer.name} · {customer.id}</div>
          </div>
          <button onClick={onClose} style={{background:"#F1F5F9",border:"none",borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16}}>?</button>
        </div>
        <div style={{textAlign:"center",padding:"16px 0 20px",background:rb(riskLevel),borderRadius:10,marginBottom:18,border:`2px solid ${rc(riskLevel)}`}}>
          <div style={{fontSize:48,fontWeight:900,fontFamily:"monospace",color:rc(riskLevel)}}>{riskScore}</div>
          <div style={{fontSize:12,color:"#64748B"}}>out of 100</div>
          <Badge label={riskLevel} color={rc(riskLevel)} bg={rb(riskLevel)}/> 
          <div style={{fontSize:11,color:"#64748B",marginTop:6}}>{type==="alert"?"Alert-level risk based on typologies and patterns":"Customer behavioral baseline risk"}</div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:10}}> Risk-Increasing Factors</div>
          {upFactors.map((f,i)=>(
            <div key={i} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:12,color:"#334155",fontWeight:500}}>? {f.factor}</span>
                <span style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#EF4444"}}>{(f.weight*100).toFixed(0)}%</span>
              </div>
              <div style={{height:6,background:"#F1F5F9",borderRadius:3,marginBottom:3}}>
                <div style={{height:"100%",width:`${f.weight*100}%`,background:"#EF4444",borderRadius:3}}/>
              </div>
              <div style={{fontSize:11,color:"#64748B"}}>{f.detail}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:10}}> Risk-Reducing Factors</div>
          {downFactors.map((f,i)=>(
            <div key={i} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:12,color:"#334155",fontWeight:500}}>? {f.factor}</span>
                <span style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#10B981"}}>{(f.weight*100).toFixed(0)}%</span>
              </div>
              <div style={{height:6,background:"#F1F5F9",borderRadius:3,marginBottom:3}}>
                <div style={{height:"100%",width:`${f.weight*100}%`,background:"#10B981",borderRadius:3}}/>
              </div>
              <div style={{fontSize:11,color:"#64748B"}}>{f.detail}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:14,padding:10,background:"#F0FDF4",borderRadius:7,border:"1px solid #BBF7D0",fontSize:12,color:"#064E3B"}}>
           Explanation generated by Themis AI Model v2.4 · Last retrained Nov 1, 2025 · Regulator-ready audit log maintained
        </div>
      </div>
    </div>
  );
}

// --- CUSTOMER DETAIL VIEW -------------------------------------
function CustomerDetailView({customerId,onNav}){
  const [riskModal,setRiskModal]=useState(null);
  const customer=CUSTOMERS[customerId];
  if(!customer)return null;
  const customerAlerts=ALERTS.filter(a=>a.customerId===customerId);
  const customerCases=CASES.filter(c=>c.customerId===customerId);
  const customerScreenings=SCREENING_RESULTS.filter(s=>s.entityId===customerId);
  return(
    <div style={{padding:"24px 28px"}}>
      {riskModal&&<RiskExplainModal customer={customer} type={riskModal} onClose={()=>setRiskModal(null)}/>}
      <div style={{fontSize:12,color:"#64748B",marginBottom:14}}>
        <span style={{cursor:"pointer",color:NAVY,fontWeight:600}} onClick={()=>onNav("dashboard")}>? Dashboard</span>
        <span style={{margin:"0 6px"}}>·</span>
        <span style={{fontFamily:"monospace",fontWeight:700}}>Customer: {customerId}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#0F172A"}}>{customer.name}</div>
          <div style={{fontSize:13,color:"#64748B",marginTop:4}}>{customer.occupation} · {customer.id}</div>
        </div>
        <Badge label={customer.amlStatus} color={customer.amlStatus==="Enhanced Monitoring"?"#D97706":customer.amlStatus==="Approved"?"#10B981":"#F59E0B"} bg={customer.amlStatus==="Enhanced Monitoring"?"#FEF3C7":customer.amlStatus==="Approved"?"#D1FAE5":"#FEF3C7"}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:18}}>
        <div>
          <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0",marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Customer Profile</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["Full Name",customer.name],["Customer ID",customer.id],["Date of Birth",customer.dob],["SSN (last 4)",customer.ssn],
                ["Phone",customer.phone],["Email",customer.email],["Nationality",customer.nationality],["Account Type",customer.accountType],
                ["Account Opened",customer.opened],["Stated Income",`$${customer.statedIncome?.toLocaleString()}/yr`],
                ["Address",customer.address]].map(([l,v])=><KV key={l} label={l} value={v}/>)}
            </div>
          </div>
          <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0",marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Risk Score Explainability</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div style={{padding:14,borderRadius:9,background:rb(customer.customerRiskLevel),border:`1px solid ${rc(customer.customerRiskLevel)}`,textAlign:"center"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#64748B",letterSpacing:"0.06em",marginBottom:4}}>CUSTOMER RISK SCORE</div>
                <div style={{fontSize:36,fontWeight:900,fontFamily:"monospace",color:rc(customer.customerRiskLevel)}}>{customer.customerRisk}</div>
                <Badge label={customer.customerRiskLevel} color={rc(customer.customerRiskLevel)} bg={rb(customer.customerRiskLevel)}/> 
                <button onClick={()=>setRiskModal("customer")} style={{display:"block",width:"100%",marginTop:8,padding:"5px 0",background:NAVY,color:"white",border:"none",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:600}}>Explain Score </button>
              </div>
              <div style={{padding:14,borderRadius:9,background:rb(customer.alertRiskLevel),border:`1px solid ${rc(customer.alertRiskLevel)}`,textAlign:"center"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#64748B",letterSpacing:"0.06em",marginBottom:4}}>ALERT RISK SCORE</div>
                <div style={{fontSize:36,fontWeight:900,fontFamily:"monospace",color:rc(customer.alertRiskLevel)}}>{customer.alertRisk}</div>
                <Badge label={customer.alertRiskLevel} color={rc(customer.alertRiskLevel)} bg={rb(customer.alertRiskLevel)}/> 
                <button onClick={()=>setRiskModal("alert")} style={{display:"block",width:"100%",marginTop:8,padding:"5px 0",background:NAVY,color:"white",border:"none",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:600}}>Explain Score </button>
              </div>
            </div>
            <div style={{marginTop:14}}>
              {customer.riskFactors?.map((f,i)=>(
                <div key={i} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:12,color:"#334155"}}>{f.direction==="up"?"?":"?"} {f.factor}</span>
                    <span style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:f.direction==="up"?"#EF4444":"#10B981"}}>{(f.weight*100).toFixed(0)}%</span>
                  </div>
                  <div style={{height:5,background:"#F1F5F9",borderRadius:3}}>
                    <div style={{height:"100%",width:`${f.weight*100}%`,background:f.direction==="up"?"#EF4444":"#10B981",borderRadius:3}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Alert History</div>
            {customerAlerts.length===0?<div style={{fontSize:13,color:"#94A3B8"}}>No alerts</div>:customerAlerts.map(a=>(
              <div key={a.id} onClick={()=>onNav("alert-detail",a.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F8FAFC",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div><span style={{fontFamily:"monospace",color:NAVY,fontWeight:700,fontSize:12}}>{a.id}</span> · <span style={{fontSize:12,color:"#64748B"}}>{fd(a.date)}</span></div>
                <div style={{display:"flex",gap:8}}><Badge label={a.status} color={sc(a.status)} bg={a.status==="CLEAR"?"#D1FAE5":"#FEE2E2"}/><Badge label={`Risk ${a.alertRisk}`} color={rc(a.alertRiskLevel)} bg={rb(a.alertRiskLevel)}/></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:"white",borderRadius:10,padding:16,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:10,letterSpacing:"0.05em"}}>QUICK ACTIONS</div>
            {[["View Alerts",()=>onNav("alerts"),NAVY],["Run Screening",()=>onNav("screening"),NAVY],["View Cases",()=>onNav("cases"),NAVY]].map(([l,fn,bg])=>(
              <button key={l} onClick={fn} style={{width:"100%",marginBottom:6,padding:"7px 0",background:bg,color:"white",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>{l}</button>
            ))}
          </div>
          <div style={{background:"white",borderRadius:10,padding:16,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:10}}>SCREENING STATUS</div>
            {customerScreenings.length===0?<div style={{fontSize:12,color:"#94A3B8"}}>No screening results</div>:customerScreenings.map(s=>(
              <div key={s.id} style={{padding:"6px 0",borderBottom:"1px solid #F8FAFC",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,color:"#334155"}}>{s.type}</span>
                <Badge label={s.match} color={s.match==="NO_MATCH"?"#065F46":"#D97706"} bg={s.match==="NO_MATCH"?"#D1FAE5":"#FEF3C7"}/>
              </div>
            ))}
          </div>
          {customerCases.length>0&&(
            <div style={{background:"white",borderRadius:10,padding:16,border:"1px solid #E2E8F0"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:10}}>LINKED CASES</div>
              {customerCases.map(cs=>(
                <div key={cs.id} onClick={()=>onNav("case-detail",cs.id)} style={{padding:"6px 0",cursor:"pointer",borderBottom:"1px solid #F8FAFC"}}>
                  <div style={{fontFamily:"monospace",fontSize:11,color:NAVY,fontWeight:700}}>{cs.id}</div>
                  <div style={{fontSize:11,color:"#64748B"}}>{cs.stage}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



// --- ALERT DETAIL VIEW ----------------------------------------
function AlertDetailView({alertId,onNav}){
  const [tab,setTab]=useState("overview");
  const [txnModal,setTxnModal]=useState(null);
  const [riskModal,setRiskModal]=useState(null);
  const [journalComment,setJournalComment]=useState("");
  const [journalComments,setJournalComments]=useState([]);
  const [narrativeComment,setNarrativeComment]=useState("");
  const [narrativeComments,setNarrativeComments]=useState([]);
  const [expandedSteps,setExpandedSteps]=useState({});
  const [txnFilter,setTxnFilter]=useState("all");

  const alert=ALERTS.find(a=>a.id===alertId);
  if(!alert)return null;
  const customer=CUSTOMERS[alert.customerId];
  const txns=TRANSACTIONS[alertId]||[];
  const tlData=TIMELINE_Data[alertId]||[];
  const netData=NETWORK_Data[alertId]||null;
  const journalSteps=JOURNAL_STEPS[alertId]||[];
  const linkedCase=CASES.find(c=>c.alertId===alertId);

  const filteredTxns=txnFilter==="flagged"?txns.filter(t=>t.flagged):txnFilter==="inflow"?txns.filter(t=>t.amount>0):txnFilter==="outflow"?txns.filter(t=>t.amount<0):txns;
  const flaggedTxns=txns.filter(t=>t.flagged);
  const inflows=txns.filter(t=>t.amount>0);
  const outflows=txns.filter(t=>t.amount<0);

  const tabs=["overview","journal","narrative","transactions","risk"];
  const tabL={overview:"Overview",journal:"Investigation Journal",narrative:"Final Narrative",transactions:"Transactions",risk:"Risk Factors"};

  const toggleStep=n=>setExpandedSteps(p=>({...p,[n]:!p[n]}));

  return(
    <div style={{padding:"24px 28px"}}>
      {txnModal&&<TxnModal txn={txnModal} onClose={()=>setTxnModal(null)}/>}
      {riskModal&&<RiskExplainModal customer={customer} type={riskModal} onClose={()=>setRiskModal(null)}/>}

      <div style={{fontSize:12,color:"#64748B",marginBottom:14}}>
        <span style={{cursor:"pointer",color:NAVY,fontWeight:600}} onClick={()=>onNav("alerts")}>? Alerts</span>
        <span style={{margin:"0 6px"}}>·</span>
        <span style={{fontFamily:"monospace",fontWeight:700}}>{alertId}</span>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{fontSize:19,fontWeight:800,color:"#0F172A"}}>Alert · {alertId}</div>
            <Badge label={alert.status} color={sc(alert.status)} bg={alert.status==="CLEAR"?"#D1FAE5":"#FEE2E2"}/>
          </div>
          <div style={{fontSize:13,color:"#64748B"}}>{customer?.name} · {fd(alert.date)} · Confidence {alert.confidence}%</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {linkedCase
            ?<button onClick={()=>onNav("case-detail",linkedCase.id)} style={{padding:"7px 14px",background:NAVY,color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>View Case ?</button>
            :alert.status==="ESCALATE"&&<button onClick={()=>onNav("cases")} style={{padding:"7px 14px",background:"#EF4444",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>Create Case</button>}
        </div>
      </div>

      <div style={{display:"flex",gap:0,borderBottom:"2px solid #E2E8F0",marginBottom:18}}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:"7px 14px",border:"none",borderBottom:tab===t?`2px solid ${NAVY}`:"2px solid transparent",marginBottom:-2,background:"none",cursor:"pointer",fontSize:12,fontWeight:tab===t?700:500,color:tab===t?NAVY:"#64748B"}}>
            {tabL[t]}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 290px",gap:18}}>
        <div>
          {/* -- OVERVIEW TAB -- */}
          {tab==="overview"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {/* Alert summary */}
              <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Alert Summary</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                  {[["Date",fd(alert.date)],["Rules Triggered",alert.typologies.length]].map(([l,v])=><KV key={l} label={l} value={v}/>)}
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:"#94A3B8",letterSpacing:"0.06em",marginBottom:3}}>INFLOW</div>
                    <div style={{fontWeight:700,color:"#10B981",fontSize:16,fontFamily:"monospace"}}>{fm(alert.inflow)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:"#94A3B8",letterSpacing:"0.06em",marginBottom:3}}>OUTFLOW</div>
                    <div style={{fontWeight:700,color:"#EF4444",fontSize:16,fontFamily:"monospace"}}>{fm(alert.outflow)}</div>
                  </div>
                </div>
                <div style={{marginTop:12}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#94A3B8",letterSpacing:"0.06em",marginBottom:6}}>RULES TRIGGERED</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {alert.typologies.map(t=><span key={t} style={{fontSize:11,background:"#EFF6FF",color:NAVY,padding:"3px 10px",borderRadius:4,fontWeight:500}}>{t}</span>)}
                  </div>
                </div>
              </div>

              {/* Transaction Overview · 4 navigable widgets */}
              <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Transaction Overview <span style={{fontSize:11,color:"#94A3B8",fontWeight:400}}>(click to filter)</span></div>
                <div style={{display:"flex",gap:12}}>
                  {[
                    {label:"Total Transactions",value:alert.txns,filter:"all",color:"#0F172A",bg:"#F8FAFC"},
                    {label:"Flagged",value:flaggedTxns.length,filter:"flagged",color:"#D97706",bg:"#FEF3C7"},
                    {label:"Inflows",value:inflows.length,filter:"inflow",color:"#059669",bg:"#F0FDF4"},
                    {label:"Outflows",value:outflows.length,filter:"outflow",color:"#EF4444",bg:"#FEF2F2"},
                  ].map(w=>(
                    <div key={w.label} onClick={()=>{setTxnFilter(w.filter);setTab("transactions");}}
                      style={{flex:1,textAlign:"center",padding:"14px 8px",borderRadius:9,background:txnFilter===w.filter&&tab==="transactions"?w.bg:"#F8FAFC",border:`1.5px solid ${txnFilter===w.filter&&tab==="transactions"?w.color:"#E2E8F0"}`,cursor:"pointer",transition:"all 0.15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background=w.bg;e.currentTarget.style.borderColor=w.color;}}
                      onMouseLeave={e=>{if(!(txnFilter===w.filter&&tab==="transactions")){e.currentTarget.style.background="#F8FAFC";e.currentTarget.style.borderColor="#E2E8F0";}}}>
                      <div style={{fontSize:24,fontWeight:800,fontFamily:"monospace",color:w.color}}>{w.value}</div>
                      <div style={{fontSize:11,color:"#64748B",marginTop:2}}>{w.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Timeline */}
              <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:10}}> Transaction Timeline</div>
                <TxnTimeline Data={tlData}/>
              </div>

              {/* Counterparty Network */}
              <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:6}}>? Entity / Counterparty Network</div>
                <div style={{display:"flex",gap:10,marginBottom:10,fontSize:11}}>
                  {[[" Subject",NAVY],[" Entity","#F59E0B"],[" Branch","#10B981"],[" Bank","#8B5CF6"],["? Other","#64748B"]].map(([l,c])=><span key={l} style={{color:c,fontWeight:600}}>{l}</span>)}
                  <span style={{marginLeft:"auto",color:"#94A3B8"}}> Inflow   Outflow</span>
                </div>
                {netData?<NetworkGraph Data={netData}/>:<div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",color:"#94A3B8",fontSize:12,background:"#F8FAFC",borderRadius:8}}>Network Data not available for this alert</div>}
              </div>
            </div>
          )}

          {/* -- INVESTIGATION JOURNAL TAB -- */}
          {tab==="journal"&&(
            <div>
              <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0",marginBottom:14}}>
                <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:4}}> Themis L1 Agent · Investigation Journal</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                  {[[`${journalSteps.length} steps`,""],["9 tool calls",""],[alert.status,""],[`${alert.confidence}% confidence`,""]].map(([l,i])=>(
                    <span key={l} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",padding:"3px 10px",borderRadius:5,color:"#334155",fontWeight:500,fontSize:11}}>{i} {l}</span>
                  ))}
                </div>

                {journalSteps.length>0?journalSteps.map((step,si)=>(
                  <div key={step.n} style={{marginBottom:10,border:"1px solid #E2E8F0",borderRadius:9,overflow:"hidden"}}>
                    <div onClick={()=>toggleStep(step.n)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 14px",background:expandedSteps[step.n]?"#EFF6FF":"#F8FAFC",cursor:"pointer"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{width:24,height:24,borderRadius:"50%",background:NAVY,color:"white",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{si+1}</span>
                        <div>
                          <div style={{display:"flex",alignItems:"center",gap:6}}><Badge label={step.type||"STEP"} color="white" bg={sc(step.type||"STEP")}/><span style={{fontSize:13,fontWeight:700,color:"#0F172A"}}>{step.title}</span></div>
                          <div style={{fontSize:11,color:"#64748B",marginTop:1}}>Tool: <code style={{background:"#F1F5F9",padding:"1px 5px",borderRadius:3,fontSize:10}}>{step.tool}</code></div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:10,background:"#D1FAE5",color:"#065F46",padding:"2px 7px",borderRadius:3,fontWeight:600}}>?{step.status.toUpperCase()}</span>
                        <span style={{fontSize:14,color:"#94A3B8"}}>{expandedSteps[step.n]?"?":"?"}</span>
                      </div>
                    </div>
                    <div style={{padding:"10px 14px",background:"#FFFBEB",borderLeft:"3px solid #F59E0B"}}>
                      <div style={{fontSize:12,color:"#78350F",fontStyle:"italic"}}>{step.summary}</div>
                    </div>
                    {expandedSteps[step.n]&&(
                      <div style={{padding:"14px",background:"#FAFAFA",borderTop:"1px solid #E2E8F0"}}>
                        <pre style={{fontSize:11,color:"#334155",lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"monospace",margin:0,background:"#F1F5F9",padding:12,borderRadius:7}}>{step.details}</pre>
                      </div>
                    )}
                  </div>
                )):(
                  /* Placeholder steps for alerts without full journal Data */
                  [{n:1,type:"STEP",title:"Alert Details Retrieval",tool:"get_alert_details",status:"complete",summary:`Alert triggered by ${alert.typologies.join(", ")}. ${alert.flagged} transactions flagged.`},
                   {n:2,type:"STEP",title:"Customer Profile & KYC Review",tool:"get_customer_details",status:"complete",summary:`Customer ${customer?.name} · Risk ${customer?.customerRisk} (${customer?.customerRiskLevel}). Stated income $${customer?.statedIncome?.toLocaleString()}.`},
                   {n:3,type:"STEP",title:"Flagged Transaction Retrieval",tool:"search_transactions",status:"complete",summary:`${alert.flagged} flagged transactions retrieved for review.`},
                   {n:4,type:"STEP",title:"Baseline Summary",tool:"get_baseline_summary",status:"complete",summary:"90-day behavioral baseline established. Comparison with flagged activity completed."},
                   {n:5,type:"STEP",title:"Income Verification",tool:"calculate",status:"complete",summary:"Annualized income ratio calculated and compared against stated income."},
                   {n:6,type:"STEP",title:"Keyword Search",tool:"search_keyword_transactions",status:"complete",summary:"High-risk keyword scan completed across representative windows."},
                   {n:7,type:"STEP",title:"Risk Factor Synthesis",tool:"evaluate_risk",status:"complete",summary:`Final decision: ${alert.status}. Confidence: ${alert.confidence}%.`},
                  ].map((step,si)=>(
                    <div key={step.n} style={{marginBottom:10,border:"1px solid #E2E8F0",borderRadius:9,overflow:"hidden"}}>
                      <div onClick={()=>toggleStep(step.n)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 14px",background:expandedSteps[step.n]?"#EFF6FF":"#F8FAFC",cursor:"pointer"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{width:24,height:24,borderRadius:"50%",background:NAVY,color:"white",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{si+1}</span>
                          <div>
                            <div style={{display:"flex",alignItems:"center",gap:6}}><Badge label={step.type||"STEP"} color="white" bg={sc(step.type||"STEP")}/><span style={{fontSize:13,fontWeight:700,color:"#0F172A"}}>{step.title}</span></div>
                            <div style={{fontSize:11,color:"#64748B",marginTop:1}}>Tool: <code style={{background:"#F1F5F9",padding:"1px 5px",borderRadius:3,fontSize:10}}>{step.tool}</code></div>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:10,background:"#D1FAE5",color:"#065F46",padding:"2px 7px",borderRadius:3,fontWeight:600}}>?{step.status.toUpperCase()}</span>
                          <span style={{fontSize:14,color:"#94A3B8"}}>{expandedSteps[step.n]?"?":"?"}</span>
                        </div>
                      </div>
                      <div style={{padding:"10px 14px",background:"#FFFBEB",borderLeft:"3px solid #F59E0B"}}>
                        <div style={{fontSize:12,color:"#78350F",fontStyle:"italic"}}>{step.summary}</div>
                      </div>
                      {expandedSteps[step.n]&&(
                        <div style={{padding:14,background:"#FAFAFA",borderTop:"1px solid #E2E8F0",fontSize:12,color:"#475569",lineHeight:1.7}}>
                          Expand the full investigation journal from ALERT-0100 to see detailed tool call outputs and analysis at each step.
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Human commentary on journal */}
              <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:10}}> Analyst Commentary on Journal</div>
                {journalComments.map((c,i)=>(
                  <div key={i} style={{marginBottom:10,padding:"10px 12px",background:"#EFF6FF",borderRadius:8,border:"1px solid #BFDBFE"}}>
                    <div style={{fontSize:11,color:"#64748B",marginBottom:4}}> <strong>John Smith</strong> · {new Date().toLocaleString()}</div>
                    <div style={{fontSize:13,color:"#1D4ED8"}}>{c}</div>
                  </div>
                ))}
                <textarea value={journalComment} onChange={e=>setJournalComment(e.target.value)} placeholder="Add commentary, observations, or questions about the investigation steps·"
                  style={{width:"100%",minHeight:80,fontSize:13,border:"1px solid #E2E8F0",borderRadius:8,padding:10,resize:"vertical",color:"#334155",outline:"none",boxSizing:"border-box"}}/>
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
                  <button onClick={()=>{if(journalComment.trim()){setJournalComments(p=>[...p,journalComment.trim()]);setJournalComment("");}}}
                    style={{padding:"7px 16px",background:NAVY,color:"white",border:"none",borderRadius:6,cursor:"pointer",fontWeight:600,fontSize:12}}>Add Commentary</button>
                </div>
              </div>
            </div>
          )}

          {/* -- FINAL NARRATIVE TAB -- */}
          {tab==="narrative"&&(
            <div>
              <div style={{background:"white",borderRadius:10,padding:20,border:"1px solid #E2E8F0",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#0F172A"}}> Themis Investigation Narrative</div>
                  <div style={{display:"flex",gap:8}}>
                    <Badge label={alert.status} color={sc(alert.status)} bg={alert.status==="CLEAR"?"#D1FAE5":"#FEE2E2"}/>
                    <Badge label={`${alert.confidence}% Confidence`} color={NAVY} bg="#EFF6FF"/>
                  </div>
                </div>
                <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:14,marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#065F46",marginBottom:6}}>? AI Summary · {alert.status==="CLEAR"?"False Positive":"Escalated for Investigation"}</div>
                  <div style={{fontSize:13,color:"#064E3B",lineHeight:1.7}}>
                    {alertId==="ALERT-0100"?"Themis concluded CLEAR (false positive) after required keyword and 1·3 day window analyses showed travel-related lodging/ride-share spend and reciprocal P2P reimbursements among a small stable group. Given payroll-funded account activity, baseline inflows aligning with stated income, consistent merchant lodging/ride-share activity in the flagged windows, and repeated reciprocal P2P reimbursements among a small, stable set of known counterparties with descriptive text indicating reimbursements/hotel splits/tourney fees, the most plausible explanation is benign cost-sharing for travel. The lone residual concern is the repeated use of the phrase 'green light' but representative context and reciprocal reimbursements mitigate that concern. Therefore the agent cleared the alert as a false positive."
                    :"Themis escalated this alert due to high-risk patterns including international wire transfers to elevated-risk jurisdictions, transaction velocity significantly exceeding the 90-day behavioral baseline, and patterns consistent with layering typologies in money laundering. Human investigator review is required before final disposition."}
                  </div>
                </div>

                {/* Full Narrative Sections */}
                <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:10}}>Investigation Log · {alertId} (Customer: {alert.customerId} / {customer?.name})</div>

                {[{title:"1. Mandatory Initialization & Tool Evidence",content:`· get_alert_details(${alertId}): Alert triggered by ${alert.typologies.join(", ")}. Flagged txns: ${txns.filter(t=>t.flagged).map(t=>t.id).join(", ")} [tool: get_alert_details]\n· get_customer_details(${alert.customerId}): Customer ${customer?.name}; Occupation: ${customer?.occupation}. Stated annual income = $${customer?.statedIncome?.toLocaleString()}. Risk score ${customer?.customerRisk} (${customer?.customerRiskLevel}). [tool: get_customer_details]\n· search_transactions(flagged=true): Flagged inflow = $${txns.filter(t=>t.flagged&&t.amount>0).reduce((s,t)=>s+t.amount,0).toLocaleString()} [tool: search_transactions]`},
                 {title:"2. Baseline & Income Verification",content:`· get_baseline_summary(lookback_days=90, exclude_flagged=True): Baseline established. Average monthly inflow aligns with stated income of $${customer?.statedIncome?.toLocaleString()}/yr.\n· calculate(income_verification): Combined observed inflows annualized. Ratio vs stated income = ${Math.round((alert.inflow*4/(customer?.statedIncome||1))*100)}% of stated annual income.\n· Note: For ${customer?.occupation}, this ratio is within/above expected range depending on business gross revenue.`},
                 {title:"3. Keyword & Pattern Analysis",content:`· search_keyword_transactions(high_risk_keywords): Scanned ${txns.length} transactions across representative windows.\n· ${alertId==="ALERT-0100"?"'green light' keyword identified in P2P transfers · investigated and resolved as Sacramento youth soccer tournament name.":"High-risk keywords found in transaction descriptions. Pattern consistent with flagged typologies."}\n· Representative 1·3 day windows analyzed for earliest and most recent flagged periods.`},
                 {title:"4. Risk Factor Assessment",content:`Suspicious Indicators (${alert.status==="CLEAR"?4:5}):\n${alert.typologies.map((t,i)=>`${i+1}. ${t} pattern detected in flagged transactions`).join("\n")}\n\nMitigating Factors:\n${alertId==="ALERT-0100"?"· KYC fully current · cash-intensive business owner profile consistent with cash deposits\n· Payroll ACHs consistently fund account ($5,210/month baseline)\n· Prior alert AL-0042 dismissed with receipts · favorable history\n· P2P counterparty group stable and reciprocal (reimbursement pattern)\n· 'Green light' confirmed as Sacramento youth soccer tournament name":"· No prior enforcement actions\n· Account maintained for multiple years with institution"}`},
                 {title:"5. Final Disposition",content:`Decision: ${alert.status} | Confidence: ${alert.confidence}%\n\nRationale: ${alert.status==="CLEAR"?"Weight of evidence supports legitimate business activity. Lone residual concern · keyword context · resolved by transaction description review. No substantive suspicious behavior confirmed. Alert cleared as false positive (dismiss).":"Multiple high-risk indicators without sufficient mitigating factors. Pattern is consistent with known money laundering typologies. Escalated for human investigator review and potential case creation."}\n\nAgent: Themis L1 | Model: AML Alert Classifier v2.4 | Timestamp: ${new Date().toISOString().slice(0,16)}`},
                ].map((s,i)=>(
                  <div key={i} style={{marginBottom:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#334155",marginBottom:6}}>{s.title}</div>
                    <pre style={{fontSize:12,color:"#475569",lineHeight:1.7,whiteSpace:"pre-wrap",background:"#F8FAFC",borderRadius:7,padding:12,fontFamily:"inherit",margin:0,border:"1px solid #E2E8F0"}}>{s.content}</pre>
                  </div>
                ))}
              </div>

              {/* Human commentary on narrative */}
              <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:10}}> Analyst Commentary on Narrative</div>
                {narrativeComments.map((c,i)=>(
                  <div key={i} style={{marginBottom:10,padding:"10px 12px",background:"#EFF6FF",borderRadius:8,border:"1px solid #BFDBFE"}}>
                    <div style={{fontSize:11,color:"#64748B",marginBottom:4}}> <strong>John Smith</strong> · {new Date().toLocaleString()}</div>
                    <div style={{fontSize:13,color:"#1D4ED8"}}>{c}</div>
                  </div>
                ))}
                <textarea value={narrativeComment} onChange={e=>setNarrativeComment(e.target.value)} placeholder="Add comments, clarifications, or disagree with AI narrative·"
                  style={{width:"100%",minHeight:80,fontSize:13,border:"1px solid #E2E8F0",borderRadius:8,padding:10,resize:"vertical",color:"#334155",outline:"none",boxSizing:"border-box"}}/>
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
                  <button onClick={()=>{if(narrativeComment.trim()){setNarrativeComments(p=>[...p,narrativeComment.trim()]);setNarrativeComment("");}}}
                    style={{padding:"7px 16px",background:NAVY,color:"white",border:"none",borderRadius:6,cursor:"pointer",fontWeight:600,fontSize:12}}>Add Commentary</button>
                </div>
              </div>
            </div>
          )}

          {/* -- TRANSACTIONS TAB -- */}
          {tab==="transactions"&&(
            <div style={{background:"white",borderRadius:10,border:"1px solid #E2E8F0",overflow:"hidden"}}>
              <div style={{padding:"12px 16px",background:"#F8FAFC",borderBottom:"1px solid #E2E8F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontWeight:700,color:"#0F172A"}}>Transactions <span style={{fontSize:12,color:"#64748B",fontWeight:400}}>· click row for details</span></div>
                <div style={{display:"flex",gap:6}}>
                  {[["all","All"],["flagged","Flagged"],["inflow","Inflows"],["outflow","Outflows"]].map(([f,l])=>(
                    <button key={f} onClick={()=>setTxnFilter(f)} style={{fontSize:11,padding:"3px 9px",borderRadius:4,border:"1px solid",cursor:"pointer",fontWeight:600,borderColor:txnFilter===f?NAVY:"#E2E8F0",background:txnFilter===f?NAVY:"white",color:txnFilter===f?"white":"#64748B"}}>{l}</button>
                  ))}
                </div>
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{background:"#F8FAFC"}}>
                  {["Date","Description","Counterparty","Amount","Balance","Flagged","Country"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"8px 12px",color:"#94A3B8",fontWeight:600,fontSize:10,borderBottom:"1px solid #E2E8F0"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{filteredTxns.map(t=>(
                  <tr key={t.id} onClick={()=>setTxnModal(t)}
                    style={{borderBottom:"1px solid #F1F5F9",cursor:"pointer",background:t.flagged?"#FFFBEB":"white"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#F0F9FF"}
                    onMouseLeave={e=>e.currentTarget.style.background=t.flagged?"#FFFBEB":"white"}>
                    <td style={{padding:"9px 12px",fontFamily:"monospace",color:"#64748B",fontSize:10}}>{t.date} {t.time}</td>
                    <td style={{padding:"9px 12px",fontWeight:500,color:"#334155"}}>{t.desc}</td>
                    <td style={{padding:"9px 12px",color:"#64748B",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.counterparty}</td>
                    <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:t.amount>0?"#059669":"#EF4444"}}>{t.amount>0?"+":""}{fm(Math.abs(t.amount))}</td>
                    <td style={{padding:"9px 12px",fontFamily:"monospace",color:"#334155",fontSize:11}}>${t.balance?.toLocaleString()}</td>
                    <td style={{padding:"9px 12px"}}>{t.flagged?<span style={{fontSize:10,background:"#FEE2E2",color:"#991B1B",padding:"2px 7px",borderRadius:3,fontWeight:600}}>YES</span>:<span style={{fontSize:10,color:"#94A3B8"}}>·</span>}</td>
                    <td style={{padding:"9px 12px",color:"#64748B"}}>{t.country}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* -- RISK FACTORS TAB -- */}
          {tab==="risk"&&(
            <div>
              <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0",marginBottom:14}}>
                <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:4}}> Risk Factors · Suspicious vs. Mitigating</div>
                <div style={{display:"flex",gap:8,marginBottom:14}}>
                  <Badge label={alert.status} color={sc(alert.status)} bg={alert.status==="CLEAR"?"#D1FAE5":"#FEE2E2"}/>
                  <Badge label={`Confidence ${alert.confidence}%`} color={NAVY} bg="#EFF6FF"/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div style={{background:"#FFF5F5",border:"1px solid #FECACA",borderRadius:8,padding:14}}>
                    <div style={{fontWeight:700,color:"#991B1B",marginBottom:10,fontSize:13}}> Suspicious Indicators</div>
                    {["Residual minor ambiguity: 'green light' keyword in P2P descriptions","No documentary hotel receipts obtained (optional per policy)","Cross-branch same-day deposits pattern matches structuring typology","Transaction velocity 340% above 90-day baseline"].map((f,i)=>(
                      <div key={i} style={{fontSize:12,color:"#7F1D1D",marginBottom:8,display:"flex",gap:6}}><span>?</span><span>{f}</span></div>
                    ))}
                  </div>
                  <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:14}}>
                    <div style={{fontWeight:700,color:"#065F46",marginBottom:10,fontSize:13}}> Mitigating Factors</div>
                    {["KYC fully current · cash-intensive business profile","Payroll ACHs align with $42K stated income","Prior alert AL-0042 dismissed with receipts","'Green light' confirmed as youth soccer tournament","P2P counterparty group stable and reciprocal","No adverse media, sanctions, or PEP flags","Representative windows show no suspicious patterns","Baseline inflow ratio within range for retail business"].map((f,i)=>(
                      <div key={i} style={{fontSize:12,color:"#064E3B",marginBottom:6,display:"flex",gap:6}}><span>?</span><span>{f}</span></div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{background:"#EFF6FF",borderRadius:10,padding:16,border:"1px solid #BFDBFE"}}>
                <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:8}}> Explainability · Why This Decision?</div>
                <div style={{fontSize:12,color:"#1D4ED8",lineHeight:1.7}}>The Themis AI model weighted {alert.status==="CLEAR"?"8 mitigating factors against 4 suspicious indicators":"5 suspicious indicators as outweighing available mitigating factors"}. The model assigns confidence {alert.confidence}% based on completeness of tool call evidence, pattern strength, and baseline deviation. {alert.status==="CLEAR"?"The structuring-like pattern was the primary trigger, but cash-intensive business context and consistent behavioral history resolved the ambiguity.":"The combination of international wire routing to FATF-listed jurisdictions, dormant account reactivation, and absence of documented business purpose drove the escalation decision."}</div>
              </div>
            </div>
          )}
        </div>

        {/* -- RIGHT SIDEBAR -- */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"white",borderRadius:10,padding:14,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:10,letterSpacing:"0.05em"}}>ALERT INFORMATION</div>
            <KV label="Alert ID" value={alertId} mono/><div style={{marginBottom:8}}/>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:700,color:"#94A3B8",letterSpacing:"0.06em",marginBottom:3}}>STATUS</div>
              <Badge label={alert.status} color={sc(alert.status)} bg={alert.status==="CLEAR"?"#D1FAE5":"#FEE2E2"}/>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:700,color:"#94A3B8",letterSpacing:"0.06em",marginBottom:3}}>ALERT RISK SCORE</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:"monospace",fontWeight:900,fontSize:22,color:rc(alert.alertRiskLevel)}}>{alert.alertRisk}</span>
                <Badge label={alert.alertRiskLevel} color={rc(alert.alertRiskLevel)} bg={rb(alert.alertRiskLevel)}/>
                <button onClick={()=>setRiskModal("alert")} title="Explain score" style={{background:"#EFF6FF",border:"none",borderRadius:4,cursor:"pointer",fontSize:11,color:NAVY,padding:"2px 7px",fontWeight:600}}> Why?</button>
              </div>
            </div>
            <KV label="Date" value={fd(alert.date)}/><div style={{marginBottom:8}}/>
            {linkedCase&&<button onClick={()=>onNav("case-detail",linkedCase.id)} style={{width:"100%",marginTop:6,padding:"6px 0",background:NAVY,color:"white",border:"none",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600}}> {linkedCase.id}</button>}
          </div>

          <div style={{background:"white",borderRadius:10,padding:14,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:10,letterSpacing:"0.05em"}}>CUSTOMER</div>
            <div style={{fontWeight:700,color:"#0F172A",fontSize:13,marginBottom:3}}>{customer?.name}</div>
            <div style={{fontSize:11,color:"#64748B",marginBottom:6}}>{customer?.occupation}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontFamily:"monospace",fontWeight:800,fontSize:18,color:rc(customer?.customerRiskLevel)}}>{customer?.customerRisk}</span>
              <Badge label={customer?.customerRiskLevel} color={rc(customer?.customerRiskLevel)} bg={rb(customer?.customerRiskLevel)}/>
              <button onClick={()=>setRiskModal("customer")} style={{background:"#EFF6FF",border:"none",borderRadius:4,cursor:"pointer",fontSize:11,color:NAVY,padding:"2px 7px",fontWeight:600}}> Why?</button>
            </div>
            <button onClick={()=>onNav("customer-detail",alert.customerId)} style={{width:"100%",padding:"6px 0",background:"white",color:NAVY,border:`1px solid ${NAVY}`,borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600}}>View Full Profile ?</button>
          </div>

          <div style={{background:"white",borderRadius:10,padding:14,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:8,letterSpacing:"0.05em"}}>TOP COUNTERPARTIES</div>
            {["Card Processor - Stripe (90 txns)","Safeway (13 txns)","Cash Withdrawal ATM (13 txns)","Local ATM (13 txns)","Local Restaurants (13 txns)","Various Local Vendors (9 txns)"].map(cp=>(
              <div key={cp} style={{fontSize:11,color:"#334155",padding:"4px 0",borderBottom:"1px solid #F8FAFC"}}>{cp}</div>
            ))}
          </div>
          <div style={{background:"#F0FDF4",borderRadius:10,padding:12,border:"1px solid #BBF7D0"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#065F46",marginBottom:4}}>? SOP Compliance</div>
            <div style={{height:5,background:"#BBF7D0",borderRadius:3}}><div style={{height:"100%",width:"100%",background:"#10B981",borderRadius:3}}/></div>
            <div style={{fontSize:11,color:"#065F46",marginTop:3,fontWeight:600}}>100% Complete</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- CASES VIEW -----------------------------------------------
function CasesView({onNav}){
  return(
    <div style={{padding:"24px 28px"}}>
      <SH title="Case Management" sub={`${ CASES.length} active cases · Themis AI-assisted`}/>
      {CASES.map(cs=>{const c=CUSTOMERS[cs.customerId];return(
        <div key={cs.id} onClick={()=>onNav("case-detail",cs.id)}
          style={{background:"white",borderRadius:12,padding:18,border:"1px solid #E2E8F0",cursor:"pointer",marginBottom:12,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}
          onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,0.11)"}
          onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{fontFamily:"monospace",fontWeight:700,color:NAVY,fontSize:12}}>{cs.id}</span>
                <Badge label={cs.priority} color={sc(cs.priority)} bg={rb(cs.priority)}/>
                <Badge label={cs.status} color={NAVY} bg="#EFF6FF"/>
              </div>
              <div style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>{cs.title}</div>
              <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Customer: <strong>{c?.name}</strong> · Alert: <span style={{color:NAVY,cursor:"pointer"}} onClick={e=>{e.stopPropagation();onNav("alert-detail",cs.alertId);}}>{cs.alertId}</span></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:"#94A3B8"}}>Assigned to</div>
              <div style={{fontWeight:600,color:"#334155",fontSize:13}}>{cs.assignee}</div>
              <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>Due {fd(cs.dueDate)}</div>
            </div>
          </div>
          <div style={{marginTop:10,padding:10,background:"#F8FAFC",borderRadius:7,fontSize:12,color:"#475569",borderLeft:`3px solid ${NAVY}`}}>{cs.findings}</div>
          <div style={{marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",gap:8}}>
              <span style={{fontSize:11,background:"#EFF6FF",color:NAVY,padding:"2px 9px",borderRadius:4,fontWeight:500}}>Stage: {cs.stage}</span>
              {cs.sarRequired&&<span style={{fontSize:11,background:"#FEF3C7",color:"#92400E",padding:"2px 9px",borderRadius:4,fontWeight:500}}>SAR Required</span>}
              <span style={{fontSize:11,background:"#F8FAFC",color:"#64748B",padding:"2px 9px",borderRadius:4}}>{cs.documents.length} docs</span>
            </div>
            <span style={{fontSize:12,color:NAVY,fontWeight:700}}>Open ?</span>
          </div>
        </div>
      );})}
    </div>
  );
}

// --- CASE DETAIL VIEW -----------------------------------------
function CaseDetailView({caseId,onNav}){
  const [tab,setTab]=useState("overview");
  const [uploading,setUploading]=useState(false);
  const [docs,setDocs]=useState(null);
  const fileInputRef=useRef(null);

  const cs=CASES.find(c=>c.id===caseId);
  if(!cs)return null;
  if(!docs)setDocs(cs.documents);

  const customer=CUSTOMERS[cs.customerId];
  const alert=ALERTS.find(a=>a.id===cs.alertId);
  const sar=SARS.find(s=>s.caseId===caseId);
  const txns=TRANSACTIONS[cs.alertId]||[];

  const DOC_TYPES=["Transaction Records","Account Information","Correspondence & Emails","Media & Records","Internal Analysis"];
  const DOC_ICONS={"Transaction Records":"","Account Information":"","Correspondence & Emails":"","Media & Records":"","Internal Analysis":""};

  const handleUpload=()=>{
    const fakeName=`Analyst_Upload_${Date.now()}.pdf`;
    const newDoc={id:"doc_new_"+Date.now(),type:"Internal Analysis",name:fakeName,size:"1.2 MB",uploaded:new Date().toLocaleDateString(),by:"John Smith",status:"attached"};
    setDocs(d=>[...(d||[]),newDoc]);
    setUploading(false);
  };

  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{fontSize:12,color:"#64748B",marginBottom:14}}>
        <span style={{cursor:"pointer",color:NAVY,fontWeight:600}} onClick={()=>onNav("cases")}>? Cases</span>
        <span style={{margin:"0 6px"}}>·</span>
        <span style={{fontFamily:"monospace",fontWeight:700}}>{caseId}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <div style={{fontSize:19,fontWeight:800,color:"#0F172A"}}>{cs.title}</div>
          <div style={{fontSize:13,color:"#64748B",marginTop:4}}>{customer?.name} · {cs.assignee} · Due {fd(cs.dueDate)}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {sar?<button onClick={()=>onNav("sar-detail",sar.id)} style={{padding:"7px 14px",background:"#7C3AED",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>View SAR ?</button>
            :<button onClick={()=>onNav("sar-list")} style={{padding:"7px 14px",background:"#7C3AED",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>Generate SAR</button>}
          <button onClick={()=>onNav("alert-detail",cs.alertId)} style={{padding:"7px 14px",background:NAVY,color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>View Alert ?</button>
        </div>
      </div>

      <div style={{display:"flex",gap:0,borderBottom:"2px solid #E2E8F0",marginBottom:18}}>
        {["overview","aml","transactions","documents","sar"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:"7px 14px",border:"none",borderBottom:tab===t?`2px solid ${NAVY}`:"2px solid transparent",marginBottom:-2,background:"none",cursor:"pointer",fontSize:12,fontWeight:tab===t?700:500,color:tab===t?NAVY:"#64748B"}}>
            {t==="overview"?"Overview":t==="aml"?"AML Analysis":t==="transactions"?"Transactions":t==="documents"?`Documents (${(docs||cs.documents).length})`:"SAR"}
          </button>
        ))}
      </div>

      {tab==="documents"&&(
        <div>
          <div style={{background:"white",borderRadius:10,border:"1px solid #E2E8F0",overflow:"hidden",marginBottom:14}}>
            <div style={{padding:"14px 18px",borderBottom:"1px solid #E2E8F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,color:"#0F172A",fontSize:14}}> Supporting Documents</div>
                <div style={{fontSize:12,color:"#64748B",marginTop:2}}>These documents will be submitted with the SAR if this case results in a filing</div>
              </div>
              <button onClick={()=>setUploading(true)} style={{padding:"7px 14px",background:NAVY,color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>+ Upload Document</button>
            </div>

            {uploading&&(
              <div style={{padding:20,background:"#F0F9FF",borderBottom:"1px solid #BFDBFE"}}>
                <div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>Upload Supporting Document</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <div>
                    <div style={{fontSize:11,color:"#64748B",marginBottom:4}}>Document Type</div>
                    <select style={{width:"100%",padding:"7px 10px",border:"1px solid #E2E8F0",borderRadius:6,fontSize:12,color:"#334155"}}>
                      {DOC_TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:"#64748B",marginBottom:4}}>File</div>
                    <div style={{padding:"7px 10px",border:"2px dashed #BFDBFE",borderRadius:6,fontSize:12,color:"#64748B",textAlign:"center",cursor:"pointer"}}
                      onClick={()=>fileInputRef.current?.click()}>Click to select file</div>
                    <input ref={fileInputRef} type="file" style={{display:"none"}}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={handleUpload} style={{padding:"6px 14px",background:NAVY,color:"white",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>Upload</button>
                  <button onClick={()=>setUploading(false)} style={{padding:"6px 14px",background:"white",color:"#64748B",border:"1px solid #E2E8F0",borderRadius:6,cursor:"pointer",fontSize:12}}>Cancel</button>
                </div>
              </div>
            )}

            {DOC_TYPES.map(dtype=>{
              const typeDocs=(docs||cs.documents).filter(d=>d.type===dtype);
              return(
                <div key={dtype}>
                  <div style={{padding:"10px 18px",background:"#F8FAFC",borderBottom:"1px solid #E2E8F0",fontSize:12,fontWeight:700,color:"#64748B"}}>
                    {DOC_ICONS[dtype]} {dtype}
                    <span style={{marginLeft:8,fontSize:11,color:"#94A3B8",fontWeight:400}}>
                      {dtype==="Transaction Records"?"Money transfer forms, receipts, checks, clearing records":
                       dtype==="Account Information"?"Account opening docs, signature cards, KYC records":
                       dtype==="Correspondence & Emails"?"Emails and correspondence related to suspicious activity":
                       dtype==="Media & Records"?"Surveillance, photos, electronic records (IP, timestamps)":
                       "Notes and documents explaining how activity was determined suspicious"}
                    </span>
                  </div>
                  {typeDocs.length===0?(
                    <div style={{padding:"10px 18px",fontSize:12,color:"#94A3B8",fontStyle:"italic"}}>No documents attached</div>
                  ):typeDocs.map(doc=>(
                    <div key={doc.id} style={{padding:"10px 18px",borderBottom:"1px solid #F8FAFC",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:18}}></span>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:"#0F172A"}}>{doc.name}</div>
                          <div style={{fontSize:11,color:"#94A3B8"}}>{doc.size} · Uploaded {doc.uploaded} by {doc.by}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{fontSize:10,background:"#D1FAE5",color:"#065F46",padding:"2px 7px",borderRadius:3,fontWeight:600}}>{doc.status}</span>
                        <button style={{fontSize:11,padding:"3px 9px",border:"1px solid #E2E8F0",borderRadius:4,background:"white",cursor:"pointer",color:"#64748B"}}>View</button>
                        <button onClick={()=>setDocs(d=>(d||cs.documents).filter(x=>x.id!==doc.id))} style={{fontSize:11,padding:"3px 9px",border:"1px solid #FECACA",borderRadius:4,background:"white",cursor:"pointer",color:"#EF4444"}}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab==="overview"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 290px",gap:18}}>
          <div>
            <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:16}}></span>
                <span style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>Themis AI Copilot Summary</span>
              </div>
              <div style={{fontSize:13,color:"#334155",lineHeight:1.7}}>
                <strong>{customer?.name}</strong>, {customer?.occupation}, triggered this case via {alert?.typologies.join(", ")} patterns.
                {cs.priority==="CRITICAL"&&" This is a CRITICAL priority case requiring immediate attention."}
                {" "}{cs.findings} Assigned to <strong>{cs.assignee}</strong>.
                {sar?" A SAR draft has been prepared.":" SAR filing may be required based on investigation outcome."}
              </div>
            </div>
            <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0",marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Subject Profile</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[["Name",customer?.name],["Customer ID",customer?.id],["Occupation",customer?.occupation],["Stated Income",`$${customer?.statedIncome?.toLocaleString()}`],["Risk Score",`${customer?.customerRisk} (${customer?.customerRiskLevel})`],["AML Status",customer?.amlStatus]].map(([l,v])=><KV key={l} label={l} value={v}/>)}
              </div>
              <button onClick={()=>onNav("customer-detail",cs.customerId)} style={{marginTop:12,padding:"6px 14px",background:"white",color:NAVY,border:`1px solid ${NAVY}`,borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>View Full Profile ?</button>
            </div>
            <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Investigation Checklist</div>
              {["Review flagged transactions for structuring patterns","Verify KYC/income against transaction activity","Check counterparty network for linked accounts","Assess adverse media and sanctions screening","Determine SAR filing requirement","Prepare final disposition memo"].map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid #F8FAFC"}}>
                  <input type="checkbox" defaultChecked={i<2} style={{accentColor:NAVY}}/>
                  <span style={{fontSize:12,color:"#334155"}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"white",borderRadius:10,padding:14,border:"1px solid #E2E8F0"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:10,letterSpacing:"0.05em"}}>CASE DETAILS</div>
              {[["Case ID",caseId],["Alert",cs.alertId],["Status",cs.status],["Priority",cs.priority],["Stage",cs.stage],["Assignee",cs.assignee],["Created",fd(cs.created)],["Due",fd(cs.dueDate)]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:7,fontSize:12}}>
                  <span style={{color:"#94A3B8"}}>{l}</span>
                  {["Status","Priority"].includes(l)?<Badge label={v} color={sc(v)} bg={rb(v)}/>
                    :<span style={{fontWeight:600,color:l==="Alert"?NAVY:"#334155",cursor:l==="Alert"?"pointer":"default"}} onClick={()=>l==="Alert"&&onNav("alert-detail",v)}>{v}</span>}
                </div>
              ))}
            </div>
            <div style={{background:"white",borderRadius:10,padding:14,border:"1px solid #E2E8F0"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:10}}>RISK OVERVIEW</div>
              <div style={{textAlign:"center",padding:14,background:rb(alert?.alertRiskLevel||"LOW"),borderRadius:8,border:`2px solid ${rc(alert?.alertRiskLevel||"LOW")}`}}>
                <div style={{fontSize:36,fontWeight:900,fontFamily:"monospace",color:rc(alert?.alertRiskLevel||"LOW")}}>{alert?.alertRisk}</div>
                <div style={{fontSize:11,color:"#64748B"}}>Alert Risk Score</div>
                <Badge label={alert?.alertRiskLevel||"LOW"} color={rc(alert?.alertRiskLevel||"LOW")} bg={rb(alert?.alertRiskLevel||"LOW")}/>
              </div>
            </div>
          </div>
        </div>
      )}
      {tab==="transactions"&&(
        <div style={{background:"white",borderRadius:10,border:"1px solid #E2E8F0",overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid #E2E8F0",fontWeight:700,color:"#0F172A",display:"flex",justifyContent:"space-between"}}>
            <div>Case Transactions</div><div style={{fontSize:12,color:"#64748B"}}>{txns.filter(t=>t.flagged).length} flagged / {alert?.txns} total</div>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"#F8FAFC"}}>{["Date","Description","Counterparty","Amount","Flagged","Country"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"8px 12px",color:"#94A3B8",fontWeight:600,fontSize:10,borderBottom:"1px solid #E2E8F0"}}>{h}</th>
            ))}</tr></thead>
            <tbody>{txns.map(t=>(
              <tr key={t.id} style={{borderBottom:"1px solid #F1F5F9",background:t.flagged?"#FFFBEB":"white"}}>
                <td style={{padding:"9px 12px",fontFamily:"monospace",color:"#64748B",fontSize:10}}>{t.date}</td>
                <td style={{padding:"9px 12px",fontWeight:500,color:"#334155"}}>{t.desc}</td>
                <td style={{padding:"9px 12px",color:"#64748B"}}>{t.counterparty}</td>
                <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:t.amount>0?"#059669":"#EF4444"}}>{t.amount>0?"+":""}{fm(t.amount)}</td>
                <td style={{padding:"9px 12px"}}>{t.flagged?<span style={{fontSize:10,background:"#FEE2E2",color:"#991B1B",padding:"2px 7px",borderRadius:3,fontWeight:600}}>YES</span>:<span style={{fontSize:10,color:"#94A3B8"}}>·</span>}</td>
                <td style={{padding:"9px 12px",color:"#64748B"}}>{t.country}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {tab==="aml"&&(
        <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:14}}> AML Deep Analysis</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            {[["Transaction Pattern",`${txns.filter(t=>t.flagged).length} flagged txns showing ${alert?.typologies[0]} pattern`,"HIGH"],
              ["Counterparty Risk","Multiple counterparties with limited history or offshore connections","HIGH"],
              ["Behavioral Baseline",`Deviation ${Math.round(((alert?.inflow||0)/44700-1)*100)}% above 90-day baseline`,"MEDIUM"],
              ["Geographic Risk","Transactions crossing multiple jurisdictions including high-risk territories","HIGH"]].map(([t,d,r])=>(
              <div key={t} style={{border:`1px solid ${r==="HIGH"?"#FECACA":"#FDE68A"}`,borderRadius:8,padding:12,background:r==="HIGH"?"#FFF5F5":"#FFFBEB"}}>
                <div style={{fontSize:12,fontWeight:700,color:r==="HIGH"?"#991B1B":"#92400E",marginBottom:4}}>{r==="HIGH"?"":""} {t}</div>
                <div style={{fontSize:12,color:"#475569"}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab==="sar"&&(sar?(
        <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0F172A"}}> {sar.id}</div>
            <button onClick={()=>onNav("sar-detail",sar.id)} style={{padding:"6px 12px",background:"#7C3AED",color:"white",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>Open SAR ?</button>
          </div>
          <div style={{background:"#F8FAFC",borderRadius:8,padding:12,fontSize:12,color:"#334155",lineHeight:1.7}}>{sar.narrative||"Narrative pending."}</div>
          <div style={{marginTop:10,display:"flex",gap:14,fontSize:12}}>
            <div><span style={{color:"#94A3B8"}}>QC: </span><strong style={{color:sar.qcScore>=90?"#10B981":"#F59E0B"}}>{sar.qcScore}/100</strong></div>
            <div><span style={{color:"#94A3B8"}}>Deadline: </span><strong>{fd(sar.filingDeadline)}</strong></div>
          </div>
        </div>
      ):(
        <div style={{background:"white",borderRadius:10,padding:40,border:"2px dashed #E2E8F0",textAlign:"center"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:8}}>No SAR Generated Yet</div>
          <button onClick={()=>onNav("sar-list")} style={{padding:"9px 22px",background:"#7C3AED",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}> Generate SAR with Themis AI</button>
        </div>
      ))}
    </div>
  );
}



// --- SAR LIST VIEW --------------------------------------------
function SARListView({onNav}){
  return(
    <div style={{padding:"24px 28px"}}>
      <SH title="SAR Management" sub="Suspicious Activity Reports · Themis AI-generated narratives"/>
      {SARS.map(sar=>{
        const c=CUSTOMERS[CASES.find(cs=>cs.id===sar.caseId)?.customerId];
        return(
          <div key={sar.id} onClick={()=>onNav("sar-detail",sar.id)}
            style={{background:"white",borderRadius:12,padding:18,border:"1px solid #E2E8F0",cursor:"pointer",marginBottom:12,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.1)"}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontFamily:"monospace",fontWeight:700,color:"#7C3AED",fontSize:13}}>{sar.id}</span>
                  <Badge label={sar.status} color={sar.status==="DRAFT"?"#92400E":"#1D4ED8"} bg={sar.status==="DRAFT"?"#FEF3C7":"#EFF6FF"}/>
                  <span style={{fontSize:11,background:sar.qcScore>=90?"#D1FAE5":"#FEF3C7",color:sar.qcScore>=90?"#065F46":"#92400E",padding:"2px 8px",borderRadius:3,fontWeight:600}}>QC: {sar.qcScore}/100</span>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>{c?.name} · {sar.caseId}</div>
                <div style={{fontSize:12,color:"#64748B",marginTop:2}}>By {sar.preparedBy} · Deadline: <strong>{fd(sar.filingDeadline)}</strong></div>
              </div>
              <div style={{textAlign:"right",fontSize:12}}>{sar.reviewedBy?<div style={{color:"#10B981"}}>? {sar.reviewedBy}</div>:<div style={{color:"#F59E0B"}}>? Awaiting review</div>}</div>
            </div>
            <div style={{marginTop:10,fontSize:12,color:"#475569",background:"#F8FAFC",borderRadius:7,padding:10}}>{(sar.narrative||"").substring(0,160)}{sar.narrative?"...":"Narrative pending."}</div>
            {sar.missingFields.length>0&&<div style={{marginTop:8,fontSize:11,color:"#92400E",background:"#FEF3C7",padding:"5px 10px",borderRadius:5}}> Missing: {sar.missingFields.join(" · ")}</div>}
          </div>
        );
      })}
    </div>
  );
}

// --- SAR DETAIL VIEW -----------------------------------------
function SARDetailView({sarId,onNav}){
  const [qcDone,setQcDone]=useState(false);
  const [editing,setEditing]=useState(false);
  const [narrative,setNarrative]=useState("");
  const [auditTrail,setAuditTrail]=useState(null);

  const sar=SARS.find(s=>s.id===sarId);
  if(!sar)return null;
  if(!auditTrail)setAuditTrail(sar.auditTrail);

  const cs=CASES.find(c=>c.id===sar.caseId);
  const customer=CUSTOMERS[cs?.customerId];
  const alert=ALERTS.find(a=>a.id===cs?.alertId);
  const txns=TRANSACTIONS[cs?.alertId]||[];

  const defaultNarrative=`SUSPICIOUS ACTIVITY REPORT · ${sar.id}\nGenerated by Themis AI · Incedo\n?\n\nSECTION 1 · SUBJECT INFORMATION\n?\nName: ${customer?.name}\nAddress: ${customer?.address}\nDate of Birth: ${customer?.dob}\nOccupation: ${customer?.occupation}\nAccount Number: ${customer?.id}\nSSN (last 4): ${customer?.ssn}\n\nSECTION 2 · SUMMARY OF SUSPICIOUS ACTIVITY\n?\n${customer?.name} engaged in suspicious financial activity between ${fd(alert?.date||"")} and the present that is consistent with ${alert?.typologies[0]||""} and potential money laundering. Total suspicious transaction volume: ${fm(alert?.inflow||0)}.\n\nSECTION 3 · TIMELINE OF TRANSACTIONS\n?\n${txns.filter(t=>t.flagged).map(t=>`· ${t.date} ${t.time}: ${t.desc} · ${fm(Math.abs(t.amount))} via ${t.counterparty} [${t.country}]`).join("\n")}\n\nSECTION 4 · REASON FOR SUSPICION\n?\n1. Transaction velocity significantly exceeded 90-day behavioral baseline\n2. Multiple deposits structured to avoid CTR reporting thresholds ($10,000)\n3. International wire transfers to high-risk jurisdictions without apparent documented business purpose\n4. Counterparty network analysis revealed linked accounts with limited transaction history\n5. Income verification ratio ${Math.round(((alert?.inflow||0)*4)/((customer?.statedIncome||1))*100)}% of stated annual income\n6. Pattern consistent with placement and layering typologies per FinCEN guidance\n\nSECTION 5 · LAW ENFORCEMENT CONTACT\n?\nNo current law enforcement contact. Institution has not disclosed this SAR to the subject.\n\nSECTION 6 · DISPOSITION\n?\nThemis AI recommends SAR submission to FinCEN.\nNo customer notification per 31 USC 5318(g)(2).\nFiling deadline: ${fd(sar.filingDeadline)}\nPrepared by: ${sar.preparedBy}\nReviewing officer: ${sar.reviewedBy||"Pending"}`;

  if(!narrative&&defaultNarrative)setNarrative(defaultNarrative);

  const saveEdit=()=>{
    const entry={ts:new Date().toLocaleString(),user:"John Smith",action:"Edited narrative",detail:"Manual edits made to narrative content"};
    setAuditTrail(a=>[...(a||sar.auditTrail),entry]);
    setEditing(false);
  };

  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{fontSize:12,color:"#64748B",marginBottom:14}}>
        <span style={{cursor:"pointer",color:NAVY,fontWeight:600}} onClick={()=>onNav("sar-list")}>? SARs</span>
        <span style={{margin:"0 6px"}}>·</span>
        <span style={{fontFamily:"monospace",fontWeight:700}}>{sarId}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <div style={{fontSize:19,fontWeight:800,color:"#0F172A"}}> {sarId}</div>
          <div style={{fontSize:13,color:"#64748B",marginTop:4}}>{customer?.name} · {sar.preparedBy}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setQcDone(true)} style={{padding:"7px 14px",background:qcDone?"#10B981":"#F59E0B",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>{qcDone?"? QC Passed":"Run QC Check"}</button>
          <button style={{padding:"7px 14px",background:"#7C3AED",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>Submit SAR ?</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 290px",gap:18}}>
        <div>
          <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:"#0F172A"}}> Themis AI-Generated SAR Narrative</div>
              <button onClick={()=>setEditing(!editing)} style={{padding:"5px 12px",background:editing?NAVY:"white",color:editing?"white":NAVY,border:`1px solid ${NAVY}`,borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600}}>
                {editing?" Save Edits":" Edit Narrative"}
              </button>
            </div>
            {editing?(
              <textarea value={narrative} onChange={e=>setNarrative(e.target.value)}
                style={{width:"100%",minHeight:500,fontFamily:"monospace",fontSize:11,color:"#334155",border:`2px solid ${NAVY}`,borderRadius:8,padding:14,lineHeight:1.7,resize:"vertical",background:"#FAFFFE",boxSizing:"border-box"}}/>
            ):(
              <pre style={{fontFamily:"monospace",fontSize:11,color:"#334155",lineHeight:1.7,whiteSpace:"pre-wrap",background:"#FAFAFA",borderRadius:8,padding:14,margin:0,border:"1px solid #E2E8F0"}}>{narrative}</pre>
            )}
            {editing&&<div style={{display:"flex",gap:8,marginTop:10}}>
              <button onClick={saveEdit} style={{padding:"6px 16px",background:NAVY,color:"white",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>Save Changes</button>
              <button onClick={()=>setEditing(false)} style={{padding:"6px 14px",background:"white",color:"#64748B",border:"1px solid #E2E8F0",borderRadius:6,cursor:"pointer",fontSize:12}}>Discard</button>
            </div>}
          </div>

          {qcDone&&(
            <div style={{background:"#F0FDF4",borderRadius:10,padding:16,border:"1px solid #BBF7D0",marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:700,color:"#065F46",marginBottom:10}}>? QC Review Complete</div>
              {["All required sections populated","Narrative clarity: PASS","Regulatory formatting: PASS","Transaction Data consistency: PASS","Income verification ratio included: PASS","Timeliness check: PASS"].map((item,i)=>(
                <div key={i} style={{fontSize:12,color:"#064E3B",marginBottom:5}}>? {item}</div>
              ))}
              {sar.missingFields.map((f,i)=><div key={i} style={{fontSize:12,color:"#92400E",marginBottom:5}}> {f} · Required before submission</div>)}
            </div>
          )}

          {/* Audit Trail */}
          <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Narrative Audit Trail</div>
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {(auditTrail||sar.auditTrail).map((entry,i)=>(
                <div key={i} style={{display:"flex",gap:12,paddingBottom:14,position:"relative"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:entry.user==="Themis AI"?NAVY:"#7C3AED",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:11,fontWeight:700,flexShrink:0}}>
                      {entry.user==="Themis AI"?"":""}
                    </div>
                    {i<(auditTrail||sar.auditTrail).length-1&&<div style={{width:2,flex:1,background:"#E2E8F0",margin:"4px 0"}}/>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#0F172A"}}>{entry.user}</div>
                    <div style={{fontSize:11,color:"#64748B",marginTop:1}}>{entry.ts}</div>
                    <div style={{fontSize:12,color:"#334155",marginTop:4,background:"#F8FAFC",borderRadius:6,padding:"6px 10px",border:"1px solid #E2E8F0"}}>
                      <strong>{entry.action}</strong> · {entry.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"white",borderRadius:10,padding:14,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:10,letterSpacing:"0.05em"}}>SAR DETAILS</div>
            {[["SAR ID",sarId],["Case",sar.caseId],["Status",sar.status],["Deadline",fd(sar.filingDeadline)],["Prepared by",sar.preparedBy],["Reviewer",sar.reviewedBy||"Pending"]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:7,fontSize:12}}>
                <span style={{color:"#94A3B8"}}>{l}</span>
                {l==="Status"?<Badge label={v} color="#7C3AED" bg="#EDE9FE"/>
                  :<span style={{fontWeight:600,color:"#334155",cursor:l==="Case"?"pointer":"default"}} onClick={()=>l==="Case"&&onNav("case-detail",v)}>{v}</span>}
              </div>
            ))}
          </div>
          <div style={{background:"white",borderRadius:10,padding:14,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:10}}>QC SCORE</div>
            <div style={{textAlign:"center",padding:12}}>
              <div style={{fontSize:38,fontWeight:900,fontFamily:"monospace",color:sar.qcScore>=90?"#10B981":"#F59E0B"}}>{sar.qcScore}</div>
              <div style={{fontSize:11,color:"#94A3B8"}}>out of 100</div>
              <div style={{height:5,background:"#E2E8F0",borderRadius:3,marginTop:8}}><div style={{height:"100%",width:`${sar.qcScore}%`,background:sar.qcScore>=90?"#10B981":"#F59E0B",borderRadius:3}}/></div>
            </div>
          </div>
          <div style={{background:"white",borderRadius:10,padding:14,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:8}}>SAR SECTIONS</div>
            {["1. Subject Information","2. Summary of Activity","3. Transaction Timeline","4. Reason for Suspicion","5. Law Enforcement Contact","6. Disposition"].map(s=>(
              <div key={s} style={{display:"flex",gap:6,alignItems:"center",fontSize:11,color:"#334155",padding:"4px 0",borderBottom:"1px solid #F8FAFC"}}>
                <span style={{color:"#10B981"}}>?</span>{s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SCREENING DETAIL MODAL -----------------------------------
function ScreeningDetailModal({result,onClose}){
  if(!result)return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:14,padding:28,width:600,maxHeight:"80vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#0F172A"}}>{result.type} · {result.entity}</div>
            <div style={{fontSize:12,color:"#64748B",marginTop:2}}>{result.source}</div>
          </div>
          <button onClick={onClose} style={{background:"#F1F5F9",border:"none",borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,color:"#64748B"}}>?</button>
        </div>

        {/* SANCTIONS */}
        {result.type==="Sanctions"&&result.sanctionDetails&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:10}}>Sanctions Screening Results</div>
            {result.sanctionDetails.hits.length===0?(
              <div style={{background:"#F0FDF4",borderRadius:8,padding:14,border:"1px solid #BBF7D0",fontSize:13,color:"#065F46"}}>? No sanctions matches found. Entity cleared against {result.source}.<br/><span style={{fontSize:11,color:"#64748B"}}>Last checked: {result.sanctionDetails.lastChecked}</span></div>
            ):result.sanctionDetails.hits.map((hit,i)=>(
              <div key={i} style={{marginBottom:12,border:"1px solid #FECACA",borderRadius:8,padding:14,background:"#FFF5F5"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#991B1B",marginBottom:6}}>{hit.program}</div>
                {[["Entity",hit.entity],["Status",hit.status],["Added",hit.date],["Sanctioning Body",hit.sanctioningBody],["Docket / Reference",hit.reference]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",gap:10,marginBottom:5,fontSize:12}}>
                    <span style={{color:"#94A3B8",minWidth:120,flexShrink:0}}>{l}:</span>
                    <span style={{color:"#334155",fontWeight:600}}>
                      {l.includes("Reference")?<a href={v} target="_blank" rel="noopener noreferrer" style={{color:NAVY}}>{v}</a>:v}
                    </span>
                  </div>
                ))}
                <div style={{marginTop:8,fontSize:12,color:"#7F1D1D",background:"#FEE2E2",borderRadius:6,padding:10}}>{hit.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* PEP */}
        {result.type==="PEP"&&result.pepDetails&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:10}}>Political Exposure Details</div>
            {result.pepDetails.positions.length===0?<div style={{fontSize:13,color:"#94A3B8"}}>No political positions on record.</div>:result.pepDetails.positions.map((pos,i)=>(
              <div key={i} style={{marginBottom:12,border:"1px solid #FDE68A",borderRadius:8,padding:14,background:"#FFFBEB"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#92400E",marginBottom:6}}>{pos.title}</div>
                {[["Jurisdiction",pos.jurisdiction],["Appointed by",pos.appointedBy],["From",pos.from],["To",pos.to],["Status",pos.to==="Present"?" Active":" Former"]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",gap:10,marginBottom:4,fontSize:12}}>
                    <span style={{color:"#94A3B8",minWidth:100,flexShrink:0}}>{l}:</span>
                    <span style={{color:"#334155",fontWeight:600}}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{background:"#FFFBEB",borderRadius:8,padding:12,border:"1px solid #FDE68A",fontSize:12,color:"#92400E",marginTop:8}}>
               FATF Recommendation 12: PEP status persists for a minimum of 5 years after leaving public position. Enhanced due diligence required.
            </div>
          </div>
        )}

        {/* ADVERSE MEDIA */}
        {result.type==="Adverse Media"&&result.mediaDetails&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:10}}>Adverse Media Findings</div>
            {result.mediaDetails.articles.map((art,i)=>(
              <div key={i} style={{marginBottom:12,border:"1px solid #E2E8F0",borderRadius:8,padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#0F172A"}}>{art.headline}</div>
                  <span style={{fontSize:10,background:"#FEF3C7",color:"#92400E",padding:"2px 7px",borderRadius:3,fontWeight:600,flexShrink:0,marginLeft:8}}>Relevance: {art.relevanceScore}%</span>
                </div>
                <div style={{fontSize:11,color:"#64748B",marginBottom:8}}>{art.publication} · {art.date}</div>
                <div style={{fontSize:12,color:"#475569",background:"#F8FAFC",borderRadius:6,padding:10,lineHeight:1.6,marginBottom:8}}>{art.snippet}</div>
                <a href={art.url} target="_blank" rel="noopener noreferrer"
                  style={{fontSize:11,color:NAVY,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
                   View Source at {new URL(art.url).hostname} ?
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ENFORCEMENT */}
        {result.type==="Enforcement"&&result.enforcementDetails&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:10}}>Regulatory Enforcement Actions</div>
            {result.enforcementDetails.actions.map((action,i)=>(
              <div key={i} style={{marginBottom:12,border:"1px solid #FECACA",borderRadius:8,padding:14,background:"#FFF5F5"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#991B1B"}}>{action.type}</div>
                  <Badge label={action.status} color={action.status.includes("Final")?"#991B1B":"#D97706"} bg={action.status.includes("Final")?"#FEE2E2":"#FEF3C7"}/>
                </div>
                {[["Authority",action.authority],["Jurisdiction",action.jurisdiction],["Date",action.date],["Docket Number",action.docketNumber],["Penalty",action.penaltyAmount]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",gap:10,marginBottom:4,fontSize:12}}>
                    <span style={{color:"#94A3B8",minWidth:100,flexShrink:0}}>{l}:</span>
                    <span style={{color:"#334155",fontWeight:600}}>{v}</span>
                  </div>
                ))}
                <div style={{marginTop:8,fontSize:12,color:"#7F1D1D",background:"#FEE2E2",borderRadius:6,padding:10}}>{action.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- SCREENING VIEW --------------------------------------------
function ScreeningView(){
  const [detailModal,setDetailModal]=useState(null);
  const [typeFilter,setTypeFilter]=useState("ALL");
  const [matchFilter,setMatchFilter]=useState("ALL");
  const [entityFilter,setEntityFilter]=useState("ALL");
  const [runNew,setRunNew]=useState(false);
  const [newEntityName,setNewEntityName]=useState("");
  const [newEntityType,setNewEntityType]=useState("Individual");
  const [newScreenType,setNewScreenType]=useState("All");
  const [runResults,setRunResults]=useState([]);

  const filters=[
    {label:"All",value:"ALL",field:"type"},
    {label:"Sanctions",value:"Sanctions",field:"type"},
    {label:"PEPs",value:"PEP",field:"type"},
    {label:"Adverse Media",value:"Adverse Media",field:"type"},
    {label:"Enforcement",value:"Enforcement",field:"type"},
  ];
  const matchFilters=[{label:"All Matches",value:"ALL"},{label:"Hits Only",value:"HIT"},{label:"Potential",value:"POTENTIAL"},{label:"No Match",value:"NO_MATCH"}];
  const entityFilters=[{label:"All",value:"ALL"},{label:"Customers",value:"customer"},{label:"Entities",value:"entity"}];

  const filtered=SCREENING_RESULTS.filter(r=>(
    (typeFilter==="ALL"||r.type===typeFilter)&&
    (matchFilter==="ALL"||r.match===matchFilter)&&
    (entityFilter==="ALL"||r.entityType===entityFilter)
  ));

  const runScreening=()=>{
    const result={id:"scr_new_"+Date.now(),type:newScreenType==="All"?"Sanctions":newScreenType,entity:newEntityName,entityId:"new",entityType:newEntityType==="Individual"?"customer":"entity",match:"NO_MATCH",score:0,source:"Themis AI Screen",details:"Screening completed · no matches found",action:"Clear"};
    setRunResults(r=>[...r,result]);
    setRunNew(false);
    setNewEntityName("");
  };

  return(
    <div style={{padding:"24px 28px"}}>
      {detailModal&&<ScreeningDetailModal result={detailModal} onClose={()=>setDetailModal(null)}/>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <div style={{fontSize:17,fontWeight:800,color:"#0F172A",letterSpacing:"-0.01em"}}>AML Screening & Intelligence</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:3,display:"flex",alignItems:"center",gap:8}}>
            Real-time sanctions · PEP · Adverse media · Enforcement
            <Pill label="Live"/>
          </div>
        </div>
        <button onClick={()=>setRunNew(true)} style={{padding:"8px 16px",background:NAVY,color:"white",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>
          + Run New Screening
        </button>
      </div>

      {/* Run New Screening Panel */}
      {runNew&&(
        <div style={{background:"#EFF6FF",border:`1px solid ${NAVY}`,borderRadius:10,padding:18,marginBottom:18}}>
          <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Run New Screening</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:12,alignItems:"end"}}>
            <div>
              <div style={{fontSize:11,color:"#64748B",marginBottom:4}}>Individual / Entity Name *</div>
              <input value={newEntityName} onChange={e=>setNewEntityName(e.target.value)} placeholder="e.g. John Smith or Nexus Corp"
                style={{width:"100%",padding:"8px 10px",border:"1px solid #E2E8F0",borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:"#64748B",marginBottom:4}}>Entity Type</div>
              <select value={newEntityType} onChange={e=>setNewEntityType(e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1px solid #E2E8F0",borderRadius:6,fontSize:12}}>
                {["Individual","Legal Entity","Vessel","Aircraft"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:"#64748B",marginBottom:4}}>Screen Against</div>
              <select value={newScreenType} onChange={e=>setNewScreenType(e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1px solid #E2E8F0",borderRadius:6,fontSize:12}}>
                {["All","Sanctions (OFAC SDN)","Sanctions (EU)","Sanctions (UN)","PEP Database","Adverse Media","Enforcement (FinCEN)","Enforcement (SEC)","Enforcement (Country-Specific)"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={runScreening} disabled={!newEntityName.trim()} style={{padding:"8px 16px",background:newEntityName.trim()?NAVY:"#94A3B8",color:"white",border:"none",borderRadius:7,cursor:newEntityName.trim()?"pointer":"not-allowed",fontWeight:700,fontSize:12}}>Screen Now</button>
              <button onClick={()=>setRunNew(false)} style={{padding:"8px 12px",background:"white",color:"#64748B",border:"1px solid #E2E8F0",borderRadius:7,cursor:"pointer",fontSize:12}}>Cancel</button>
            </div>
          </div>
         COMPLETE: {runResults.length>0&&<div style={{marginTop:12,padding:10,background:"#D1FAE5",borderRadius:7,fontSize:12,color:"#065F46"}}>?COMPLETE: {runResults.length} screening(s) completed. Results appear in the table below.</div>}
        </div>
      )}

      {/* KPI cards */}
      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <MCard label="Screened Today" value="1,247" color={NAVY}/>
        <MCard label="Potential/Hits" value={SCREENING_RESULTS.filter(r=>r.match!=="NO_MATCH").length.toString()} color="#EF4444"/>
        <MCard label="No Match" value={SCREENING_RESULTS.filter(r=>r.match==="NO_MATCH").length.toString()} color="#10B981"/>
        <MCard label="Entity Hits" value={SCREENING_RESULTS.filter(r=>r.entityType==="entity"&&r.match!=="NO_MATCH").length.toString()} color="#F59E0B"/>
        <MCard label="Customer Hits" value={SCREENING_RESULTS.filter(r=>r.entityType==="customer"&&r.match!=="NO_MATCH").length.toString()} color="#7C3AED"/>
      </div>

      {/* Filter bar */}
      <div style={{display:"flex",gap:20,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div>
          <div style={{fontSize:10,color:"#94A3B8",marginBottom:4,fontWeight:600}}>SCREEN TYPE</div>
          <div style={{display:"flex",gap:6}}>
            {filters.map(f=>(
              <button key={f.value} onClick={()=>setTypeFilter(f.value)}
                style={{padding:"4px 12px",borderRadius:5,border:"1px solid",cursor:"pointer",fontSize:11,fontWeight:600,
                  borderColor:typeFilter===f.value?NAVY:"#E2E8F0",background:typeFilter===f.value?NAVY:"white",color:typeFilter===f.value?"white":"#64748B"}}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontSize:10,color:"#94A3B8",marginBottom:4,fontWeight:600}}>MATCH STATUS</div>
          <div style={{display:"flex",gap:6}}>
            {matchFilters.map(f=>(
              <button key={f.value} onClick={()=>setMatchFilter(f.value)}
                style={{padding:"4px 12px",borderRadius:5,border:"1px solid",cursor:"pointer",fontSize:11,fontWeight:600,
                  borderColor:matchFilter===f.value?"#7C3AED":"#E2E8F0",background:matchFilter===f.value?"#7C3AED":"white",color:matchFilter===f.value?"white":"#64748B"}}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontSize:10,color:"#94A3B8",marginBottom:4,fontWeight:600}}>ENTITY TYPE</div>
          <div style={{display:"flex",gap:6}}>
            {entityFilters.map(f=>(
              <button key={f.value} onClick={()=>setEntityFilter(f.value)}
                style={{padding:"4px 12px",borderRadius:5,border:"1px solid",cursor:"pointer",fontSize:11,fontWeight:600,
                  borderColor:entityFilter===f.value?"#D97706":"#E2E8F0",background:entityFilter===f.value?"#D97706":"white",color:entityFilter===f.value?"white":"#64748B"}}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results table */}
      <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:"#F8FAFC"}}>
            {["Entity","Type","Entity Kind","Match","Score","Source","Details","Action"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"9px 14px",color:"#94A3B8",fontWeight:600,fontSize:10,letterSpacing:"0.04em",borderBottom:"1px solid #E2E8F0"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[...filtered,...runResults.filter(r=>(typeFilter==="ALL"||r.type===typeFilter)&&(matchFilter==="ALL"||r.match===matchFilter)&&(entityFilter==="ALL"||r.entityType===entityFilter))].map((r)=>(
              <tr key={r.id} onClick={()=>setDetailModal(r)}
                style={{borderBottom:"1px solid #F1F5F9",cursor:"pointer",background:r.match!=="NO_MATCH"?"#FFFBEB":"white"}}
                onMouseEnter={e=>e.currentTarget.style.background="#F0F9FF"}
                onMouseLeave={e=>e.currentTarget.style.background=r.match!=="NO_MATCH"?"#FFFBEB":"white"}>
                <td style={{padding:"11px 14px"}}>
                  <div style={{fontWeight:600,color:"#0F172A"}}>{r.entity}</div>
                  <div style={{fontSize:10,color:"#94A3B8",fontFamily:"monospace"}}>{r.entityId}</div>
                </td>
                <td style={{padding:"11px 14px"}}><span style={{fontSize:11,background:"#EFF6FF",color:NAVY,padding:"2px 8px",borderRadius:3,fontWeight:500}}>{r.type}</span></td>
                <td style={{padding:"11px 14px"}}>
                  <span style={{fontSize:10,background:r.entityType==="customer"?"#EDE9FE":"#FEF3C7",color:r.entityType==="customer"?"#7C3AED":"#92400E",padding:"2px 7px",borderRadius:3,fontWeight:600}}>
                    {r.entityType==="customer"?" Customer":" Entity"}
                  </span>
                </td>
                <td style={{padding:"11px 14px"}}><Badge label={r.match} color={r.match==="NO_MATCH"?"#065F46":r.match==="HIT"?"#991B1B":"#D97706"} bg={r.match==="NO_MATCH"?"#D1FAE5":r.match==="HIT"?"#FEE2E2":"#FEF3C7"}/></td>
                <td style={{padding:"11px 14px",fontFamily:"monospace",fontWeight:700,color:r.score>=70?"#EF4444":r.score>=40?"#F59E0B":"#10B981"}}>{r.score}</td>
                <td style={{padding:"11px 14px",color:"#64748B",fontSize:11}}>{r.source}</td>
                <td style={{padding:"11px 14px",color:"#475569",maxWidth:200}}>{r.details}</td>
                <td style={{padding:"11px 14px"}}>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={e=>{e.stopPropagation();setDetailModal(r);}} style={{fontSize:10,padding:"3px 8px",border:`1px solid ${NAVY}`,borderRadius:4,background:"white",cursor:"pointer",color:NAVY,fontWeight:600}}>Details</button>
                    <span style={{fontSize:11,fontWeight:600,color:r.action==="Clear"?"#10B981":r.action.includes("Escalate")?"#EF4444":"#D97706"}}>{r.action}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0&&<div style={{padding:30,textAlign:"center",color:"#94A3B8",fontSize:13}}>No results match the selected filters.</div>}
      </div>
    </div>
  );
}

// --- ALERTS VIEW ---------------------------------------------
function AlertsView({onNav}){
  const [filter,setFilter]=useState("ALL");
  const filtered=filter==="ALL"?ALERTS:ALERTS.filter(a=>a.status===filter);
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{fontSize:17,fontWeight:800,color:"#0F172A"}}>Alert Investigation Queue</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:3,display:"flex",alignItems:"center",gap:8}}>
            {ALERTS.length} alerts · AI-investigated by Themis
            <Pill label="Live"/>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["ALL","ESCALATE","CLEAR"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:5,border:"1px solid",cursor:"pointer",fontSize:11,fontWeight:600,borderColor:filter===f?NAVY:"#E2E8F0",background:filter===f?NAVY:"white",color:filter===f?"white":"#64748B"}}>
            {f==="ALL"?`All (${ALERTS.length})`:f==="ESCALATE"?`Escalated (${ALERTS.filter(a=>a.status==="ESCALATE").length})`:`Cleared (${ALERTS.filter(a=>a.status==="CLEAR").length})`}
          </button>
        ))}
      </div>
      <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:"#F8FAFC"}}>
            {["Alert ID","Date","Customer","Typologies","TXNs","AI Decision","Alert Risk","Cust Risk","Confidence","Action"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"9px 12px",color:"#64748B",fontWeight:600,fontSize:10,letterSpacing:"0.04em",borderBottom:"1px solid #E2E8F0"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(a=>{const c=CUSTOMERS[a.customerId];return(
              <tr key={a.id} style={{borderBottom:"1px solid #F1F5F9",cursor:"pointer"}}
                onClick={()=>onNav("alert-detail",a.id)}
                onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                onMouseLeave={e=>e.currentTarget.style.background="white"}>
                <td style={{padding:"10px 12px",color:NAVY,fontWeight:700,fontFamily:"monospace",fontSize:11}}>{a.id}</td>
                <td style={{padding:"10px 12px",color:"#64748B",fontSize:11}}>{fd(a.date)}</td>
                <td style={{padding:"10px 12px"}}>
                  <div style={{fontWeight:600,color:"#0F172A",fontSize:12}}>{c?.name}</div>
                  <div style={{fontSize:10,color:"#94A3B8",fontFamily:"monospace"}}>{a.customerId}</div>
                </td>
                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                    {a.typologies.slice(0,2).map(t=><span key={t} style={{fontSize:10,background:"#EFF6FF",color:NAVY,padding:"1px 5px",borderRadius:3}}>{t}</span>)}
                    {a.typologies.length>2&&<span style={{fontSize:10,color:"#94A3B8"}}>+{a.typologies.length-2}</span>}
                  </div>
                </td>
                <td style={{padding:"10px 12px",fontFamily:"monospace",color:"#334155"}}>{a.txns}</td>
                <td style={{padding:"10px 12px"}}><Badge label={a.status} color={sc(a.status)} bg={a.status==="CLEAR"?"#D1FAE5":"#FEE2E2"}/></td>
                <td style={{padding:"10px 12px"}}>
                  <span style={{fontFamily:"monospace",fontWeight:800,fontSize:13,color:rc(a.alertRiskLevel)}}>{a.alertRisk}</span>
                  <span style={{marginLeft:4}}><Badge label={a.alertRiskLevel} color={rc(a.alertRiskLevel)} bg={rb(a.alertRiskLevel)} small/></span>
                </td>
                <td style={{padding:"10px 12px"}}>
                  <span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:rc(c?.customerRiskLevel)}}>{c?.customerRisk}</span>
                </td>
                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{height:4,width:50,background:"#E2E8F0",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${a.confidence}%`,background:a.confidence>=80?"#10B981":"#F59E0B"}}/></div>
                    <span style={{fontSize:11}}>{a.confidence}%</span>
                  </div>
                </td>
                <td style={{padding:"10px 12px"}}><button onClick={e=>{e.stopPropagation();onNav("alert-detail",a.id);}} style={{fontSize:10,padding:"3px 8px",borderRadius:4,border:`1px solid ${NAVY}`,background:"white",cursor:"pointer",color:NAVY,fontWeight:600}}>Open</button></td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}



// --- REMAINING VIEWS ------------------------------------------

function NetworkView(){
  return(
    <div style={{padding:"24px 28px"}}>
      <SH title="Money Laundering Network Detection" sub="Themis Graph ML · Real-time relationship mapping" action={<Pill label="Live"/>}/>
      <div style={{background:"white",borderRadius:12,padding:20,border:"1px solid #E2E8F0",marginBottom:16}}>
        <div style={{display:"flex",gap:10,marginBottom:12,fontSize:11}}>
          {[[" Subject",NAVY],[" Entity","#F59E0B"],[" Branch","#10B981"],[" Bank","#8B5CF6"]].map(([l,c])=><span key={l} style={{color:c,fontWeight:600}}>{l}</span>)}
          <span style={{marginLeft:"auto",color:"#94A3B8"}}> Inflow   Outflow  - - - Potential</span>
        </div>
        <NetworkGraph Data={NETWORK_Data["ALERT-0109"]}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"white",borderRadius:10,padding:16,border:"1px solid #E2E8F0"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:10}}>? ML Anomaly Signals</div>
          {ANOMALIES.map(an=>(
            <div key={an.id} style={{padding:"8px 0",borderBottom:"1px solid #F8FAFC",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:12,color:"#334155"}}>{an.title}</div>
              <div style={{display:"flex",gap:8}}><Badge label={an.type} color={sc(an.type)} bg={rb(an.type)}/><span style={{fontSize:11,color:"#64748B",fontFamily:"monospace"}}>{an.amount}</span></div>
            </div>
          ))}
        </div>
        <div style={{background:"#FEF2F2",borderRadius:10,padding:16,border:"1px solid #FECACA"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#991B1B",marginBottom:8}}> Themis AI Alert</div>
          <div style={{fontSize:12,color:"#7F1D1D",lineHeight:1.7}}>Circular money movement confirmed across 4 accounts. Pattern matches trade-based money laundering typology with 87% confidence. Funds originated at Neal Hall  Nexus Realty LLC  Pacific Shell Corp  return to Hall via Ryan Torres. Recommend immediate SAR filing.</div>
        </div>
      </div>
    </div>
  );
}

function ModelGovernanceView(){
  const models=[
    {name:"AML Alert Classifier v2.4",type:"Classification",accuracy:91.3,precision:88.7,recall:93.1,fpr:8.2,status:"PRODUCTION",drift:"LOW",retrained:"2025-11-01"},
    {name:"Transaction Anomaly Detector v1.8",type:"Anomaly Detection",accuracy:87.5,precision:84.2,recall:90.0,fpr:12.1,status:"PRODUCTION",drift:"LOW",retrained:"2025-10-15"},
    {name:"SAR Likelihood Predictor v1.2",type:"Regression",accuracy:82.1,precision:79.8,recall:84.5,fpr:15.3,status:"STAGING",drift:"MEDIUM",retrained:"2025-11-20"},
    {name:"Network Cluster Detector v0.9",type:"Graph ML",accuracy:78.4,precision:76.1,recall:80.8,fpr:18.6,status:"DEVELOPMENT",drift:"N/A",retrained:"2025-12-01"},
  ];
  return(
    <div style={{padding:"24px 28px"}}>
      <SH title="AI Model Governance & Auditability" sub="Explainable AI · Bias monitoring · Regulator-ready documentation"/>
      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <MCard label="Active Models" value="2" sub="In production" color={NAVY}/>
        <MCard label="Avg Accuracy" value="89.4%" color="#10B981"/>
        <MCard label="False Positive Rate" value="10.2%" color="#F59E0B"/>
        <MCard label="Model Drift" value="LOW" color="#10B981"/>
        <MCard label="Audit Coverage" value="100%" color="#7C3AED"/>
      </div>
      <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",marginBottom:18,overflow:"hidden"}}>
        <div style={{padding:"12px 18px",borderBottom:"1px solid #E2E8F0",fontWeight:700,color:"#0F172A",fontSize:14}}>Themis Model Registry</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:"#F8FAFC"}}>{["Model","Type","Accuracy","Precision","Recall","FP Rate","Status","Drift","Last Retrained"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",color:"#94A3B8",fontWeight:600,fontSize:10,borderBottom:"1px solid #E2E8F0"}}>{h}</th>)}</tr></thead>
          <tbody>{models.map(m=>(
            <tr key={m.name} style={{borderBottom:"1px solid #F1F5F9"}}>
              <td style={{padding:"9px 12px",fontWeight:600,color:"#0F172A",fontSize:12}}>{m.name}</td>
              <td style={{padding:"9px 12px"}}><span style={{fontSize:10,background:"#EFF6FF",color:NAVY,padding:"2px 6px",borderRadius:3}}>{m.type}</span></td>
              <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:m.accuracy>=90?"#10B981":"#F59E0B"}}>{m.accuracy}%</td>
              <td style={{padding:"9px 12px",fontFamily:"monospace",color:"#334155"}}>{m.precision}%</td>
              <td style={{padding:"9px 12px",fontFamily:"monospace",color:"#334155"}}>{m.recall}%</td>
              <td style={{padding:"9px 12px",fontFamily:"monospace",color:m.fpr<12?"#10B981":"#F59E0B"}}>{m.fpr}%</td>
              <td style={{padding:"9px 12px"}}><Badge label={m.status} color={m.status==="PRODUCTION"?"#065F46":m.status==="STAGING"?"#92400E":"#1D4ED8"} bg={m.status==="PRODUCTION"?"#D1FAE5":m.status==="STAGING"?"#FEF3C7":"#EFF6FF"}/></td>
              <td style={{padding:"9px 12px"}}><Badge label={m.drift} color={rc(m.drift==="LOW"?"LOW":m.drift==="MEDIUM"?"MEDIUM":"HIGH")} bg={rb(m.drift==="LOW"?"LOW":m.drift==="MEDIUM"?"MEDIUM":"HIGH")}/></td>
              <td style={{padding:"9px 12px",color:"#64748B",fontSize:11}}>{fd(m.retrained)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Explainability · ALERT-0109</div>
          {[["Transaction Velocity (90d)",0.31],["Deposit Pattern (sub-threshold)",0.28],["Counterparty Risk Score",0.19],["Geographic Risk",0.14],["Historical Alert Count",0.08]].map(([f,w])=>(
            <div key={f} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}><span style={{color:"#334155"}}>? {f}</span><span style={{fontFamily:"monospace",fontWeight:700,color:"#EF4444"}}>{(w*100).toFixed(0)}%</span></div>
              <div style={{height:5,background:"#F1F5F9",borderRadius:3}}><div style={{height:"100%",width:`${w*100}%`,background:"#EF4444",borderRadius:3}}/></div>
            </div>
          ))}
        </div>
        <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}> Closed-Loop Learning</div>
          {[["Investigator decisions used","1,247",NAVY],["SAR outcomes incorporated","89","#7C3AED"],["Accuracy improvement (last cycle)","+2.3%","#10B981"],["FP reduction (last cycle)","-18%","#10B981"],["Next retraining","Jan 15, 2026","#F59E0B"]].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #F8FAFC",fontSize:12}}>
              <span style={{color:"#64748B"}}>{l}</span><span style={{fontWeight:700,color:c,fontFamily:"monospace"}}>{v}</span>
            </div>
          ))}
          <div style={{marginTop:12,padding:10,background:"#F0FDF4",borderRadius:7,border:"1px solid #BBF7D0",fontSize:12,color:"#064E3B"}}>? Model governance documentation is regulator-ready. Last audit: Nov 30, 2025.</div>
        </div>
      </div>
    </div>
  );
}

function SettingsView(){
  const DS=[
    {id:1,n:"Core Banking System",v:"Temenos T24",t:"Core Banking",s:"CONNECTED",vol:"2.1M txns/day",lat:"<100ms",sync:"2 min ago"},
    {id:2,n:"Wire Transfer System",v:"SWIFT Network",t:"Wire/Payments",s:"CONNECTED",vol:"45K wires/day",lat:"<200ms",sync:"5 min ago"},
    {id:3,n:"Card Processing",v:"FIS Worldpay",t:"Card",s:"CONNECTED",vol:"8.3M txns/day",lat:"<50ms",sync:"1 min ago"},
    {id:4,n:"Digital Banking",v:"Mambu",t:"Digital Banking",s:"CONNECTED",vol:"1.2M txns/day",lat:"<150ms",sync:"3 min ago"},
    {id:5,n:"Kafka Streaming",v:"Apache Kafka",t:"Streaming/ETL",s:"CONNECTED",vol:"12M events/day",lat:"<30ms",sync:"Real-time"},
    {id:6,n:"Sanctions Database",v:"World-Check (LSEG)",t:"Screening",s:"CONNECTED",vol:"Daily",lat:"N/A",sync:"06:00 AM"},
    {id:7,n:"Adverse Media Feed",v:"Dow Jones Risk",t:"Media/Intelligence",s:"CONNECTED",vol:"Continuous",lat:"N/A",sync:"Real-time"},
    {id:8,n:"PEP Database",v:"Refinitiv",t:"Screening",s:"DISCONNECTED",vol:"Weekly",lat:"N/A",sync:"Never"},
  ];
  const [sources,setSources]=useState(DS);
  return(
    <div style={{padding:"24px 28px"}}>
      <SH title="Data Source Configuration" sub="Transaction Data ingestion · ETL pipelines · Streaming platforms"/>
      <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden",marginBottom:18}}>
        <div style={{padding:"12px 18px",borderBottom:"1px solid #E2E8F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:700,color:"#0F172A",fontSize:14}}>Connected Data Sources</span>
          <button style={{fontSize:12,padding:"5px 12px",background:NAVY,color:"white",border:"none",borderRadius:5,cursor:"pointer",fontWeight:600}}>+ Add Source</button>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:"#F8FAFC"}}>{["Source","Vendor","Type","Volume","Latency","Status","Last Sync","Actions"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 14px",color:"#94A3B8",fontWeight:600,fontSize:10,borderBottom:"1px solid #E2E8F0"}}>{h}</th>)}</tr></thead>
          <tbody>{sources.map(ds=>(
            <tr key={ds.id} style={{borderBottom:"1px solid #F1F5F9"}}>
              <td style={{padding:"10px 14px",fontWeight:600,color:"#0F172A"}}>{ds.n}</td>
              <td style={{padding:"10px 14px",color:"#64748B"}}>{ds.v}</td>
              <td style={{padding:"10px 14px"}}><span style={{fontSize:10,background:"#EFF6FF",color:NAVY,padding:"2px 6px",borderRadius:3,fontWeight:500}}>{ds.t}</span></td>
              <td style={{padding:"10px 14px",color:"#64748B",fontFamily:"monospace",fontSize:11}}>{ds.vol}</td>
              <td style={{padding:"10px 14px",color:"#64748B",fontFamily:"monospace",fontSize:11}}>{ds.lat}</td>
              <td style={{padding:"10px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:sc(ds.s),display:"inline-block"}}/>
                  <span style={{fontSize:11,color:"#334155"}}>{ds.s}</span>
                </div>
              </td>
              <td style={{padding:"10px 14px",color:"#94A3B8",fontSize:11}}>{ds.sync}</td>
              <td style={{padding:"10px 14px"}}>
                <div style={{display:"flex",gap:5}}>
                  <button style={{fontSize:10,padding:"2px 8px",borderRadius:4,border:"1px solid #E2E8F0",background:"white",cursor:"pointer",color:"#334155"}}>Configure</button>
                  {ds.s==="DISCONNECTED"&&<button onClick={()=>setSources(x=>x.map(d=>d.id===ds.id?{...d,s:"CONNECTED",sync:"just now"}:d))} style={{fontSize:10,padding:"2px 8px",borderRadius:4,border:"none",background:NAVY,cursor:"pointer",color:"white",fontWeight:600}}>Connect</button>}
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionsView({onNav}){
  return(
    <div style={{padding:"24px 28px"}}>
      <SH title="Transaction Monitoring" sub="Real-time ingestion · Themis ML pattern detection · 3,846 analyzed" action={<Pill label="Live"/>}/>
      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <MCard label="Total Transactions" value="3,846" sub="Last 90 days"/>
        <MCard label="Flagged" value={Object.values(TRANSACTIONS).flat().filter(t=>t.flagged).length.toString()} color="#EF4444"/>
        <MCard label="Total Volume" value="$2.4M" color={NAVY}/>
        <MCard label="Countries" value="8" color="#7C3AED"/>
      </div>
      <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
        <div style={{padding:"12px 18px",borderBottom:"1px solid #E2E8F0",fontWeight:700,color:"#0F172A",fontSize:14}}>All Flagged Transactions</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:"#F8FAFC"}}>{["TX ID","Date","Customer","Description","Counterparty","Amount","Category","Alert","Country"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",color:"#94A3B8",fontWeight:600,fontSize:10,borderBottom:"1px solid #E2E8F0"}}>{h}</th>)}</tr></thead>
          <tbody>
            {Object.entries(TRANSACTIONS).flatMap(([alertId,txns])=>txns.filter(t=>t.flagged).map(t=>{
              const alert=ALERTS.find(a=>a.id===alertId);
              const customer=CUSTOMERS[alert?.customerId];
              return(
                <tr key={t.id} style={{borderBottom:"1px solid #F1F5F9",cursor:"pointer"}} onClick={()=>onNav("alert-detail",alertId)}
                  onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="white"}>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",color:"#64748B",fontSize:10}}>{t.id}</td>
                  <td style={{padding:"9px 12px",color:"#64748B",fontSize:11}}>{t.date}</td>
                  <td style={{padding:"9px 12px",fontWeight:500,color:"#0F172A"}}>{customer?.name}</td>
                  <td style={{padding:"9px 12px",color:"#475569"}}>{t.desc}</td>
                  <td style={{padding:"9px 12px",color:"#64748B",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.counterparty}</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:"#EF4444"}}>{fm(t.amount)}</td>
                  <td style={{padding:"9px 12px"}}><span style={{fontSize:10,background:"#F1F5F9",color:"#475569",padding:"2px 5px",borderRadius:3}}>{t.category}</span></td>
                  <td style={{padding:"9px 12px",color:NAVY,fontFamily:"monospace",fontSize:11}}>{alertId}</td>
                  <td style={{padding:"9px 12px",color:"#64748B"}}>{t.country}</td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- THEMIS CHAT ----------------------------------------------
function ThemisChat({onClose,view}){
  const [msgs,setMsgs]=useState([{role:"ai",text:`Hello! I'm **Themis**, your Incedo AI compliance copilot. I'm viewing the **${view}** screen with you. How can I help?`}]);
  const [input,setInput]=useState("");
  const [typing,setTyping]=useState(false);
  const bottom=useRef(null);
  const suggestions=["Summarize today's alert activity","Which alerts need immediate attention?","Explain the circular movement pattern","What is the current false positive rate?","Are any customers on the OFAC sanctions list?"];
  useEffect(()=>{bottom.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async(text)=>{
    if(!text.trim())return;
    const userMsg={role:"user",text};
    setMsgs(m=>[...m,userMsg]);setInput("");setTyping(true);
    try{
      const res=await fetch('/api/chat',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({view,messages:[...msgs,userMsg]})
      });
      const Data=await res.json();
      setMsgs(m=>[...m,{role:"ai",text:Data.text||Data.error||'Sorry, I could not generate a response.'}]);
    }catch(err){
      console.error('Chat API error:',err);
      setMsgs(m=>[...m,{role:"ai",text:`I'm analysing your question about **"${text}"** in the context of the current ${view} view. Based on Active alert queue Data, I've identified relevant patterns and findings. Would you like me to walk through the key risk indicators?`}]);
    }finally{
      setTyping(false);
    }
  };
  const renderText=t=>{const p=t.split(/(\*\*[^*]+\*\*)/g);return p.map((x,i)=>x.startsWith("**")?<strong key={i} style={{color:"#0F172A"}}>{x.slice(2,-2)}</strong>:<span key={i}>{x}</span>);};
  return(
    <div style={{position:"fixed",bottom:24,right:24,width:380,height:560,background:"white",borderRadius:16,boxShadow:"0 20px 60px rgba(0,0,0,0.22)",border:"1px solid #E2E8F0",display:"flex",flexDirection:"column",zIndex:1000,overflow:"hidden"}}>
      <div style={{background:`linear-gradient(135deg, ${NAVY} 0%, ${NAVY} 100%)`,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}></div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,color:"white",fontSize:14}}>Themis AI Copilot</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.6)"}}>by Incedo · {view}</div>
        </div>
        <Pill label="Live" color="#22C55E" bg="transparent"/>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"white",cursor:"pointer",fontSize:15,width:26,height:26,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center"}}>?</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:10,background:"#F8FAFC"}}>
        {msgs.map((msg,i)=>(
          <div key={i} style={{display:"flex",flexDirection:msg.role==="user"?"row-reverse":"row",gap:8,alignItems:"flex-start"}}>
            {msg.role==="ai"&&<div style={{width:26,height:26,borderRadius:7,background:`linear-gradient(135deg,${NAVY},${NAVY})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}></div>}
            <div style={{maxWidth:"80%",padding:"9px 12px",borderRadius:msg.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",background:msg.role==="user"?NAVY:"white",color:msg.role==="user"?"white":"#334155",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",fontSize:12,lineHeight:1.6,whiteSpace:"pre-line"}}>
              {msg.role==="ai"?renderText(msg.text):msg.text}
            </div>
          </div>
        ))}
        {typing&&<div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{width:26,height:26,borderRadius:7,background:`linear-gradient(135deg,${NAVY},${NAVY})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}></div><div style={{background:"white",padding:"9px 12px",borderRadius:"12px 12px 12px 2px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",display:"flex",gap:4}}>{[0,1,2].map(d=><span key={d} style={{width:5,height:5,borderRadius:"50%",background:"#94A3B8",display:"inline-block",animation:`bounce 1s ${d*0.15}s infinite`}}/>)}</div></div>}
        <div ref={bottom}/>
      </div>
      {msgs.length<=1&&<div style={{padding:"8px 12px",borderTop:"1px solid #E2E8F0",background:"white"}}>
        <div style={{fontSize:10,color:"#94A3B8",fontWeight:600,marginBottom:5,letterSpacing:"0.04em"}}>SUGGESTED QUESTIONS</div>
        {suggestions.slice(0,3).map(s=><button key={s} onClick={()=>send(s)} style={{display:"block",width:"100%",textAlign:"left",fontSize:11,padding:"5px 9px",borderRadius:5,border:"1px solid #E2E8F0",background:"#F8FAFC",cursor:"pointer",color:"#334155",marginBottom:4,fontWeight:500}}>{s}</button>)}
      </div>}
      <div style={{padding:"8px 10px",borderTop:"1px solid #E2E8F0",display:"flex",gap:7,background:"white"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send(input)} placeholder="Ask Themis anything·" style={{flex:1,padding:"7px 10px",borderRadius:7,border:"1px solid #E2E8F0",fontSize:12,color:"#334155",outline:"none",background:"#F8FAFC"}}/>
        <button onClick={()=>send(input)} style={{padding:"7px 12px",background:NAVY,color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:13}}>?</button>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}`}</style>
    </div>
  );
}

// --- DAILY BRIEFING (CHAT) ------------------------------------
function BriefingView({persona,personaLabel}){
  const escalated=ALERTS.filter(a=>a.status==="ESCALATE");
  const openCases=CASES.filter(c=>c.status!=="CLOSED");
  const draftSARs=SARS.filter(s=>s.status==="DRAFT");
  const today=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});

  const briefing=`Good morning. Here is your **Daily Briefing** for ${today}.

**Active Incidents**
· ${escalated.length} alert(s) escalated · highest risk: ${escalated.sort((a,b)=>b.alertRisk-a.alertRisk)[0]?.id||"·"} (${escalated[0]?.alertRiskLevel||"·"})
· ${openCases.length} open case(s) · ${openCases.filter(c=>c.priority==="CRITICAL").length} CRITICAL
· ${draftSARs.length} SAR(s) in draft · nearest deadline ${draftSARs.sort((a,b)=>a.filingDeadline.localeCompare(b.filingDeadline))[0]?.filingDeadline||"·"}

**What I can help with**
Ask me about open incidents, customer history, structuring patterns, network detections, or any case timeline.`;

  const suggestions=[
    "What incidents are open today?",
    "Tell me about Neal Hall's investigation history",
    "Why was ALERT-0109 escalated?",
    "Summarize this week's structuring patterns",
    "Which customers are on enhanced monitoring?",
    "Show me the timeline for CASE-2025-002",
  ];

  const [msgs,setMsgs]=useState([{role:"ai",text:briefing}]);
  const [input,setInput]=useState("");
  const [typing,setTyping]=useState(false);
  const bottom=useRef(null);
  useEffect(()=>{bottom.current?.scrollIntoView({behavior:"smooth"});},[msgs,typing]);

  const send=async(text)=>{
    if(!text.trim())return;
    const userMsg={role:"user",text};
    setMsgs(m=>[...m,userMsg]);setInput("");setTyping(true);
    try{
      const res=await fetch('/api/chat',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({view:`Daily Briefing (${personaLabel})`,messages:[...msgs,userMsg]})
      });
      const Data=await res.json();
      setMsgs(m=>[...m,{role:"ai",text:Data.text||Data.error||"Sorry, I could not generate a response."}]);
    }catch(err){
      console.error('Briefing chat error:',err);
      setMsgs(m=>[...m,{role:"ai",text:`I am offline from the agent right now, but based on platform context for "${text}" I would investigate the open escalated alerts (${escalated.map(a=>a.id).join(", ")||"none"}) and any related customer history. Try again in a moment.`}]);
    }finally{
      setTyping(false);
    }
  };

  const renderText=t=>{
    const lines=t.split("\n");
    return lines.map((line,li)=>{
      const parts=line.split(/(\*\*[^*]+\*\*)/g).map((x,i)=>x.startsWith("**")?<strong key={i} style={{color:"#0F172A"}}>{x.slice(2,-2)}</strong>:<span key={i}>{x}</span>);
      return <div key={li} style={{minHeight:line?undefined:8}}>{parts}</div>;
    });
  };

  return(
    <div style={{padding:"24px 28px",height:"100%",display:"flex",flexDirection:"column",boxSizing:"border-box"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexShrink:0}}>
        <div>
          <div style={{fontSize:21,fontWeight:800,color:"#0F172A",letterSpacing:"-0.02em"}}>Daily Briefing</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:4,display:"flex",alignItems:"center",gap:8}}>
            {today} · {personaLabel}
            <Pill label="Live" color="#15803D" bg="#DCFCE7"/>
          </div>
        </div>
        <button onClick={()=>setMsgs([{role:"ai",text:briefing}])}
          style={{padding:"6px 12px",background:"white",color:"#64748B",border:"1px solid #E2E8F0",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600}}>
          Reset conversation
        </button>
      </div>

      {/* Chat card */}
      <div style={{flex:1,minHeight:0,background:"white",borderRadius:12,border:"1px solid #E2E8F0",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Transcript */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          <div style={{maxWidth:900,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",flexDirection:m.role==="user"?"row-reverse":"row",gap:10,alignItems:"flex-start"}}>
                {m.role==="ai"&&(
                  <div style={{width:30,height:30,borderRadius:8,background:NAVY,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,letterSpacing:"0.04em"}}>TH</div>
                )}
                <div style={{
                  maxWidth:"78%",
                  padding:"10px 14px",
                  borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",
                  background:m.role==="user"?NAVY:"#F8FAFC",
                  color:m.role==="user"?"white":"#334155",
                  fontSize:13,
                  lineHeight:1.7,
                  border:m.role==="user"?"none":"1px solid #E2E8F0",
                  whiteSpace:"pre-wrap"
                }}>
                  {m.role==="ai"?renderText(m.text):m.text}
                </div>
              </div>
            ))}
            {typing&&(
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{width:30,height:30,borderRadius:8,background:NAVY,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,letterSpacing:"0.04em"}}>TH</div>
                <div style={{padding:"12px 14px",borderRadius:"12px 12px 12px 2px",background:"#F8FAFC",border:"1px solid #E2E8F0",display:"flex",gap:5,alignItems:"center"}}>
                  {[0,1,2].map(d=><span key={d} style={{width:6,height:6,borderRadius:"50%",background:"#94A3B8",animation:`bounce 1s ${d*0.15}s infinite`}}/>)}
                </div>
              </div>
            )}

            {/* Suggested prompts */}
            {msgs.length<=1&&!typing&&(
              <div style={{marginTop:6,padding:"14px 16px",background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:10}}>
                <div style={{fontSize:10,fontWeight:700,color:NAVY,letterSpacing:"0.08em",marginBottom:10}}>SUGGESTED QUESTIONS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {suggestions.map(s=>(
                    <button key={s} onClick={()=>send(s)}
                      style={{textAlign:"left",fontSize:12,padding:"8px 12px",borderRadius:6,border:"1px solid #E2E8F0",background:"white",color:"#334155",cursor:"pointer",transition:"all 0.15s",fontWeight:500}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=NAVY;e.currentTarget.style.color=NAVY;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#E2E8F0";e.currentTarget.style.color="#334155";}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottom}/>
          </div>
        </div>

        {/* Input */}
        <div style={{padding:"12px 16px",borderTop:"1px solid #E2E8F0",background:"#F8FAFC"}}>
          <div style={{maxWidth:900,margin:"0 auto",display:"flex",gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send(input)}
              placeholder="Ask about incidents, history, customers, cases..."
              style={{flex:1,padding:"10px 14px",borderRadius:8,border:"1px solid #E2E8F0",fontSize:13,color:"#334155",outline:"none",background:"white"}}/>
            <button onClick={()=>send(input)} disabled={!input.trim()||typing}
              style={{padding:"10px 18px",background:input.trim()&&!typing?NAVY:"#E2E8F0",color:input.trim()&&!typing?"white":"#94A3B8",border:"none",borderRadius:8,cursor:input.trim()&&!typing?"pointer":"not-allowed",fontWeight:600,fontSize:13,transition:"all 0.15s"}}>
              Send
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}`}</style>
    </div>
  );
}

// --- WORKBENCH HELPERS ----------------------------------------
function fileBaseName(path){
  const last=path.split("/").pop()||path;
  return last.replace(/\.[^.]+$/,"");
}

function parseFrontmatter(raw){
  const fm=raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if(!fm)return{meta:{},body:raw};
  const front=fm[1];
  const get=(k)=>{const m=front.match(new RegExp(`^${k}:\\s*(.+)$`,"m"));return m?m[1].trim().replace(/^['"]|['"]$/g,""):null;};
  const tagsMatch=front.match(/tags:\s*\[([^\]]+)\]/);
  const tags=tagsMatch?tagsMatch[1].split(",").map(s=>s.trim().replace(/['"]/g,"")):[];
  const catMatch=front.match(/category:\s*([\w-]+)/);
  return{
    meta:{
      name:get("name"),
      description:get("description"),
      version:get("version"),
      author:get("author"),
      tags,
      category:catMatch?catMatch[1]:null,
    },
    body:fm[2],
  };
}

// Tiny markdown renderer (h1-4, bold, italic, inline code, lists, code blocks, blank lines)
function MarkdownBlock({text}){
  const lines=text.split("\n");
  const out=[];
  let i=0;
  while(i<lines.length){
    const line=lines[i];
    if(/^```/.test(line)){
      const buf=[];i++;
      while(i<lines.length&&!/^```/.test(lines[i])){buf.push(lines[i]);i++;}
      i++;
      out.push(<pre key={`c${i}`} style={{background:"#0F172A",color:"#E2E8F0",padding:"12px 14px",borderRadius:8,fontSize:11,lineHeight:1.55,overflow:"auto",margin:"8px 0"}}>{buf.join("\n")}</pre>);
      continue;
    }
    const h=line.match(/^(#{1,4})\s+(.+)$/);
    if(h){
      const level=h[1].length;
      const sizes={1:18,2:15,3:13,4:12};
      const weights={1:800,2:700,3:700,4:600};
      out.push(<div key={`h${i}`} style={{fontSize:sizes[level],fontWeight:weights[level],color:"#0F172A",margin:`${level<=2?14:10}px 0 6px`,letterSpacing:level===1?"-0.01em":"0"}}>{h[2]}</div>);
      i++;continue;
    }
    if(/^[-*]\s+/.test(line)){
      const items=[];
      while(i<lines.length&&/^[-*]\s+/.test(lines[i])){items.push(lines[i].replace(/^[-*]\s+/,""));i++;}
      out.push(<ul key={`u${i}`} style={{margin:"4px 0 8px 18px",padding:0,fontSize:12,color:"#334155",lineHeight:1.7}}>
        {items.map((t,n)=><li key={n}>{renderInline(t)}</li>)}
      </ul>);
      continue;
    }
    if(/^\d+\.\s+/.test(line)){
      const items=[];
      while(i<lines.length&&/^\d+\.\s+/.test(lines[i])){items.push(lines[i].replace(/^\d+\.\s+/,""));i++;}
      out.push(<ol key={`o${i}`} style={{margin:"4px 0 8px 22px",padding:0,fontSize:12,color:"#334155",lineHeight:1.7}}>
        {items.map((t,n)=><li key={n}>{renderInline(t)}</li>)}
      </ol>);
      continue;
    }
    if(line.trim()===""){out.push(<div key={`b${i}`} style={{height:6}}/>);i++;continue;}
    out.push(<div key={`p${i}`} style={{fontSize:12,color:"#334155",lineHeight:1.7,margin:"3px 0"}}>{renderInline(line)}</div>);
    i++;
  }
  return<div>{out}</div>;
}
function renderInline(text){
  const parts=[];let rest=text;let key=0;
  const push=(node)=>parts.push(<span key={key++}>{node}</span>);
  while(rest.length){
    const codeM=rest.match(/`([^`]+)`/);
    const boldM=rest.match(/\*\*([^*]+)\*\*/);
    const next=[codeM,boldM].filter(Boolean).sort((a,b)=>a.index-b.index)[0];
    if(!next){push(rest);break;}
    if(next.index>0)push(rest.slice(0,next.index));
    if(next===codeM)parts.push(<code key={key++} style={{background:"#F1F5F9",border:"1px solid #E2E8F0",borderRadius:3,padding:"1px 5px",fontFamily:"'Consolas','Menlo',monospace",fontSize:11,color:"#0F172A"}}>{next[1]}</code>);
    else parts.push(<strong key={key++} style={{color:"#0F172A",fontWeight:700}}>{next[1]}</strong>);
    rest=rest.slice(next.index+next[0].length);
  }
  return parts;
}

// Pre-parse skills + prompts once so views are cheap to render
const SKILLS=Object.entries(SKILL_MODULES).map(([path,raw])=>{
  const{meta,body}=parseFrontmatter(raw);
  return{slug:fileBaseName(path),path,raw,body,...meta};
}).sort((a,b)=>a.slug.localeCompare(b.slug));

const PROMPTS=Object.entries(PROMPT_MODULES).map(([path,raw])=>{
  const get=(k)=>{const m=raw.match(new RegExp(`^${k}:\\s*(.+?)\\s*$`,"m"));return m?m[1].replace(/^['"]|['"]$/g,""):null;};
  return{
    slug:fileBaseName(path),
    path,
    raw,
    name:get("name")||fileBaseName(path),
    version:get("version"),
    role:get("role"),
    model:get("model"),
    owner:get("owner"),
    last_updated:get("last_updated"),
    status:get("status"),
  };
}).sort((a,b)=>a.slug.localeCompare(b.slug));

// --- AGENT STUDIO ---------------------------------------------
function AgentStudioView(){
  const agents=AGENTS_REGISTRY.agents;
  const [selectedId,setSelectedId]=useState(agents[0].id);
  const sel=agents.find(a=>a.id===selectedId);
  const linkedPrompt=PROMPTS.find(p=>p.slug===sel.promptFile.replace(/\.yaml$/,""));
  const linkedSkills=sel.skills.map(s=>SKILLS.find(sk=>sk.slug===s)).filter(Boolean);
  const statusColor=(s)=>s==="PRODUCTION"?"#065F46":s==="STAGING"?"#92400E":"#1D4ED8";
  const statusBg=(s)=>s==="PRODUCTION"?"#D1FAE5":s==="STAGING"?"#FEF3C7":"#EFF6FF";

  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{fontSize:12,color:"#64748B",marginBottom:14,letterSpacing:"0.02em"}}>Platform Workbench</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <div style={{fontSize:21,fontWeight:800,color:"#0F172A",letterSpacing:"-0.02em"}}>Agent Studio</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:4}}>
            Registry · {agents.length} agents · loaded from <code style={{background:"#F1F5F9",padding:"1px 6px",borderRadius:3,fontSize:11}}>agents/agents.json</code>
            <span style={{margin:"0 8px",color:"#CBD5E1"}}>·</span>
            schema {AGENTS_REGISTRY.version}
          </div>
        </div>
        <Pill label="Live" color="#15803D" bg="#DCFCE7"/>
      </div>

      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <MCard label="Agents Registered" value={agents.length} color={NAVY}/>
        <MCard label="In Production" value={agents.filter(a=>a.status==="PRODUCTION").length} color="#10B981"/>
        <MCard label="Calls (30d)" value={agents.reduce((s,a)=>s+a.metrics.calls_30d,0).toLocaleString()} color="#7C3AED"/>
        <MCard label="Avg Success Rate" value={`${(agents.reduce((s,a)=>s+a.metrics.success_rate,0)/agents.length*100).toFixed(1)}%`} color="#10B981"/>
      </div>

      <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden",marginBottom:18}}>
        <div style={{padding:"12px 18px",borderBottom:"1px solid #E2E8F0",fontWeight:700,color:"#0F172A",fontSize:14}}>Agent Registry</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:"#F8FAFC"}}>
            {["Agent","Role","Model","Skills","Tools","Status","p95","Calls 30d"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"9px 14px",color:"#94A3B8",fontWeight:600,fontSize:10,letterSpacing:"0.04em",borderBottom:"1px solid #E2E8F0"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {agents.map(a=>{
              const Active=a.id===selectedId;
              return(
                <tr key={a.id} onClick={()=>setSelectedId(a.id)}
                  style={{borderBottom:"1px solid #F1F5F9",cursor:"pointer",background:Active?"#EFF6FF":"white"}}
                  onMouseEnter={e=>!Active&&(e.currentTarget.style.background="#F8FAFC")}
                  onMouseLeave={e=>!Active&&(e.currentTarget.style.background="white")}>
                  <td style={{padding:"11px 14px"}}>
                    <div style={{fontWeight:600,color:"#0F172A"}}>{a.name}</div>
                    <div style={{fontFamily:"monospace",fontSize:10,color:"#94A3B8"}}>{a.id} · v{a.version}</div>
                  </td>
                  <td style={{padding:"11px 14px"}}><span style={{fontSize:10,background:a.role==="orchestrator"?"#FEF3C7":"#EFF6FF",color:a.role==="orchestrator"?"#92400E":NAVY,padding:"2px 8px",borderRadius:3,fontWeight:600}}>{a.role}</span></td>
                  <td style={{padding:"11px 14px",fontFamily:"monospace",fontSize:10,color:"#64748B"}}>{a.model.split(".").pop().split("-").slice(0,2).join("-")}</td>
                  <td style={{padding:"11px 14px",fontSize:11,color:"#334155"}}>{a.skills.length===0?<span style={{color:"#CBD5E1"}}>—</span>:a.skills.length}</td>
                  <td style={{padding:"11px 14px",fontSize:11,color:"#334155"}}>{a.tools.length===0?<span style={{color:"#CBD5E1"}}>—</span>:a.tools.length}</td>
                  <td style={{padding:"11px 14px"}}><Badge label={a.status} color={statusColor(a.status)} bg={statusBg(a.status)}/></td>
                  <td style={{padding:"11px 14px",fontFamily:"monospace",color:"#475569"}}>{a.metrics.p95_latency_ms}ms</td>
                  <td style={{padding:"11px 14px",fontFamily:"monospace",color:"#475569"}}>{a.metrics.calls_30d.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16}}>
        <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>{sel.name}</div>
              <div style={{fontSize:11,color:"#94A3B8",fontFamily:"monospace"}}>{sel.id} · v{sel.version} · {sel.owner}</div>
            </div>
            <Badge label={sel.status} color={statusColor(sel.status)} bg={statusBg(sel.status)}/>
          </div>
          <div style={{fontSize:12,color:"#475569",lineHeight:1.6,marginBottom:14}}>{sel.description}</div>

          <div style={{fontSize:11,fontWeight:700,color:"#64748B",letterSpacing:"0.06em",margin:"14px 0 6px"}}>PROMPT</div>
          <div style={{padding:"8px 12px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:6,fontSize:12}}>
            <span style={{fontFamily:"monospace",color:NAVY}}>prompts/{sel.promptFile}</span>
            {linkedPrompt&&<span style={{marginLeft:8,fontSize:10,color:"#64748B"}}>· v{linkedPrompt.version}</span>}
          </div>

          <div style={{fontSize:11,fontWeight:700,color:"#64748B",letterSpacing:"0.06em",margin:"14px 0 6px"}}>SKILLS</div>
          {linkedSkills.length===0?<div style={{fontSize:12,color:"#94A3B8",fontStyle:"italic"}}>No skills linked</div>:
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {linkedSkills.map(s=><span key={s.slug} style={{fontSize:11,background:"#EFF6FF",color:NAVY,padding:"3px 9px",borderRadius:4,fontWeight:500}}>{s.name||s.slug}{s.version&&<span style={{color:"#94A3B8",marginLeft:6}}>v{s.version}</span>}</span>)}
            </div>}

          <div style={{fontSize:11,fontWeight:700,color:"#64748B",letterSpacing:"0.06em",margin:"14px 0 6px"}}>TOOLS</div>
          {sel.tools.length===0?<div style={{fontSize:12,color:"#94A3B8",fontStyle:"italic"}}>No direct tools (orchestrator)</div>:
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {sel.tools.map(t=><span key={t} style={{fontSize:11,fontFamily:"monospace",background:"#F1F5F9",color:"#475569",padding:"3px 8px",borderRadius:3,border:"1px solid #E2E8F0"}}>{t}</span>)}
            </div>}

          {sel.routes&&sel.routes.length>0&&(
            <>
              <div style={{fontSize:11,fontWeight:700,color:"#64748B",letterSpacing:"0.06em",margin:"14px 0 6px"}}>ROUTES TO</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {sel.routes.map(r=><span key={r} style={{fontSize:11,background:"#FEF3C7",color:"#92400E",padding:"3px 8px",borderRadius:3,fontWeight:500}}>→ {r}</span>)}
              </div>
            </>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"white",borderRadius:10,padding:14,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:10,letterSpacing:"0.05em"}}>METRICS · 30 DAYS</div>
            {[["Calls",sel.metrics.calls_30d.toLocaleString()],["Success rate",`${(sel.metrics.success_rate*100).toFixed(1)}%`],["p50 latency",`${sel.metrics.p50_latency_ms} ms`],["p95 latency",`${sel.metrics.p95_latency_ms} ms`]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:"1px solid #F8FAFC"}}>
                <span style={{color:"#94A3B8"}}>{l}</span><span style={{fontWeight:600,color:"#334155",fontFamily:"monospace"}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{background:"white",borderRadius:10,padding:14,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:10,letterSpacing:"0.05em"}}>DEPLOYMENT</div>
            <div style={{fontSize:12,color:"#334155",marginBottom:6}}><span style={{color:"#94A3B8"}}>Last deploy:</span> {sel.lastDeployed}</div>
            <div style={{fontSize:12,color:"#334155",marginBottom:6}}><span style={{color:"#94A3B8"}}>Owner:</span> {sel.owner}</div>
            <div style={{fontSize:12,color:"#334155"}}><span style={{color:"#94A3B8"}}>Model:</span> <span style={{fontFamily:"monospace",fontSize:10}}>{sel.model}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SKILLS LIBRARY -------------------------------------------
function SkillsLibraryView(){
  const [selected,setSelected]=useState(SKILLS[0]?.slug||null);
  const sel=SKILLS.find(s=>s.slug===selected);
  const allTags=Array.from(new Set(SKILLS.flatMap(s=>s.tags))).sort();
  const [tagFilter,setTagFilter]=useState("ALL");
  const filtered=tagFilter==="ALL"?SKILLS:SKILLS.filter(s=>s.tags.includes(tagFilter));

  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{fontSize:12,color:"#64748B",marginBottom:14,letterSpacing:"0.02em"}}>Platform Workbench</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <div style={{fontSize:21,fontWeight:800,color:"#0F172A",letterSpacing:"-0.02em"}}>Skills Library</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:4}}>
            {SKILLS.length} skills · centralized in <code style={{background:"#F1F5F9",padding:"1px 6px",borderRadius:3,fontSize:11}}>skills/aml/*.md</code>
          </div>
        </div>
        <Pill label="Live" color="#15803D" bg="#DCFCE7"/>
      </div>

      <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <button onClick={()=>setTagFilter("ALL")} style={{padding:"4px 12px",borderRadius:5,border:"1px solid",cursor:"pointer",fontSize:11,fontWeight:600,borderColor:tagFilter==="ALL"?NAVY:"#E2E8F0",background:tagFilter==="ALL"?NAVY:"white",color:tagFilter==="ALL"?"white":"#64748B"}}>All ({SKILLS.length})</button>
        {allTags.map(t=>(
          <button key={t} onClick={()=>setTagFilter(t)} style={{padding:"4px 12px",borderRadius:5,border:"1px solid",cursor:"pointer",fontSize:11,fontWeight:500,borderColor:tagFilter===t?NAVY:"#E2E8F0",background:tagFilter===t?NAVY:"white",color:tagFilter===t?"white":"#64748B"}}>{t}</button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16}}>
        <div style={{background:"white",borderRadius:10,border:"1px solid #E2E8F0",overflow:"hidden",alignSelf:"flex-start"}}>
          <div style={{padding:"10px 14px",borderBottom:"1px solid #E2E8F0",fontSize:11,fontWeight:700,color:"#64748B",letterSpacing:"0.05em",background:"#F8FAFC"}}>SKILLS</div>
          {filtered.map(s=>{
            const Active=s.slug===selected;
            return(
              <button key={s.slug} onClick={()=>setSelected(s.slug)}
                style={{width:"100%",textAlign:"left",padding:"10px 14px",borderBottom:"1px solid #F1F5F9",border:"none",borderLeft:Active?`3px solid ${NAVY}`:"3px solid transparent",background:Active?"#EFF6FF":"white",cursor:"pointer"}}>
                <div style={{fontSize:12,fontWeight:600,color:"#0F172A"}}>{s.name||s.slug}</div>
                <div style={{fontSize:10,color:"#94A3B8",marginTop:2,fontFamily:"monospace"}}>v{s.version} · {s.author}</div>
              </button>
            );
          })}
          {filtered.length===0&&<div style={{padding:18,textAlign:"center",fontSize:12,color:"#94A3B8"}}>No skills match this tag.</div>}
        </div>

        {sel&&(
          <div style={{background:"white",borderRadius:10,padding:22,border:"1px solid #E2E8F0",minHeight:400}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{fontSize:17,fontWeight:800,color:"#0F172A"}}>{sel.name||sel.slug}</div>
                <div style={{fontSize:11,color:"#94A3B8",fontFamily:"monospace",marginTop:2}}>skills/aml/{sel.slug}.md · v{sel.version} · {sel.author}</div>
              </div>
              <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.06em",color:"#065F46",background:"#D1FAE5",padding:"3px 8px",borderRadius:4}}>LIBRARY</span>
            </div>
            <div style={{fontSize:12,color:"#64748B",margin:"6px 0 12px",lineHeight:1.6}}>{sel.description}</div>
            {sel.tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
              {sel.tags.map(t=><span key={t} style={{fontSize:10,background:"#F1F5F9",color:"#475569",padding:"2px 8px",borderRadius:3,fontWeight:500}}>{t}</span>)}
            </div>}
            <div style={{borderTop:"1px solid #F1F5F9",paddingTop:14,maxHeight:520,overflowY:"auto"}}>
              <MarkdownBlock text={sel.body}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- PROMPT STUDIO --------------------------------------------
function PromptStudioView(){
  const [selected,setSelected]=useState(PROMPTS[0]?.slug||null);
  const sel=PROMPTS.find(p=>p.slug===selected);

  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{fontSize:12,color:"#64748B",marginBottom:14,letterSpacing:"0.02em"}}>Platform Workbench</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <div style={{fontSize:21,fontWeight:800,color:"#0F172A",letterSpacing:"-0.02em"}}>Prompt Studio</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:4}}>
            {PROMPTS.length} prompts · centralized YAML library in <code style={{background:"#F1F5F9",padding:"1px 6px",borderRadius:3,fontSize:11}}>prompts/*.yaml</code>
          </div>
        </div>
        <Pill label="Read only" color="#92400E" bg="#FEF3C7"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16}}>
        <div style={{background:"white",borderRadius:10,border:"1px solid #E2E8F0",overflow:"hidden",alignSelf:"flex-start"}}>
          <div style={{padding:"10px 14px",borderBottom:"1px solid #E2E8F0",fontSize:11,fontWeight:700,color:"#64748B",letterSpacing:"0.05em",background:"#F8FAFC"}}>PROMPTS</div>
          {PROMPTS.map(p=>{
            const Active=p.slug===selected;
            return(
              <button key={p.slug} onClick={()=>setSelected(p.slug)}
                style={{width:"100%",textAlign:"left",padding:"10px 14px",borderBottom:"1px solid #F1F5F9",border:"none",borderLeft:Active?`3px solid ${NAVY}`:"3px solid transparent",background:Active?"#EFF6FF":"white",cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#0F172A"}}>{p.name}</div>
                  <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.04em",color:p.status==="production"?"#065F46":"#92400E",background:p.status==="production"?"#D1FAE5":"#FEF3C7",padding:"1px 6px",borderRadius:3}}>{(p.status||"draft").toUpperCase()}</span>
                </div>
                <div style={{fontSize:10,color:"#94A3B8",marginTop:2,fontFamily:"monospace"}}>v{p.version} · {p.role}</div>
              </button>
            );
          })}
        </div>

        {sel&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:"#0F172A"}}>{sel.name}</div>
                  <div style={{fontSize:11,color:"#94A3B8",fontFamily:"monospace",marginTop:2}}>{sel.path.replace("./","")} · v{sel.version}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <span style={{fontSize:10,fontWeight:600,color:NAVY,background:"#EFF6FF",padding:"2px 8px",borderRadius:3}}>{sel.role}</span>
                  <span style={{fontSize:10,fontWeight:600,color:"#475569",background:"#F1F5F9",padding:"2px 8px",borderRadius:3,fontFamily:"monospace"}}>{sel.model?.split(".").pop().split("-").slice(0,2).join("-")}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:18,fontSize:11,color:"#64748B",marginTop:8}}>
                <span><span style={{color:"#94A3B8"}}>Owner:</span> {sel.owner}</span>
                <span><span style={{color:"#94A3B8"}}>Updated:</span> {sel.last_updated}</span>
              </div>
            </div>
            <div style={{background:"white",borderRadius:10,border:"1px solid #E2E8F0",overflow:"hidden"}}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid #E2E8F0",fontSize:11,fontWeight:700,color:"#64748B",letterSpacing:"0.05em",background:"#F8FAFC",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>YAML SOURCE</span>
                <span style={{fontFamily:"monospace",fontSize:10,color:"#94A3B8"}}>{sel.raw.split("\n").length} lines</span>
              </div>
              <pre style={{margin:0,padding:"16px 18px",fontSize:11,fontFamily:"'Consolas','Menlo',monospace",color:"#0F172A",lineHeight:1.55,maxHeight:540,overflow:"auto",background:"white"}}>{sel.raw}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- COMING SOON VIEW ----------------------------------------
function ComingSoonView({title,category,blurb}){
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{fontSize:12,color:"#64748B",marginBottom:14,letterSpacing:"0.02em"}}>{category}</div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <div style={{fontSize:21,fontWeight:800,color:"#0F172A",letterSpacing:"-0.02em"}}>{title}</div>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#92400E",background:"#FEF3C7",padding:"3px 8px",borderRadius:4}}>COMING SOON</span>
      </div>
      <div style={{fontSize:13,color:"#64748B",marginBottom:24,maxWidth:680,lineHeight:1.6}}>{blurb}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:12,maxWidth:920}}>
        {[1,2,3,4].map(i=>(
          <div key={i} style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0",opacity:0.7}}>
            <div style={{height:8,width:"40%",background:"#E2E8F0",borderRadius:3,marginBottom:10}}/>
            <div style={{height:24,width:"60%",background:"#F1F5F9",borderRadius:4,marginBottom:8}}/>
            <div style={{height:6,width:"80%",background:"#F1F5F9",borderRadius:3,marginBottom:5}}/>
            <div style={{height:6,width:"55%",background:"#F1F5F9",borderRadius:3}}/>
          </div>
        ))}
      </div>
      <div style={{marginTop:24,padding:14,background:"#EFF6FF",borderRadius:10,border:"1px solid #BFDBFE",fontSize:12,color:"#1D4ED8",maxWidth:680}}>
        This module is under active development. Reach out to the Themis platform team for early-access details.
      </div>
    </div>
  );
}

// --- PERSONA CONFIG -------------------------------------------
const PERSONAS=[
  {id:"analyst",label:"AML Analyst",abbr:"AN",desc:"Investigates alerts",views:["dashboard","alerts","transactions","screening","customer-detail","alert-detail","anomaly-detail"]},
  {id:"investigator",label:"AML Investigator",abbr:"IN",desc:"Deep case investigation",views:["dashboard","alerts","cases","transactions","network","customer-detail","alert-detail","case-detail","anomaly-detail"]},
  {id:"compliance",label:"Compliance Officer",abbr:"CO",desc:"SAR review & submission",views:["dashboard","cases","sar-list","screening","alerts","case-detail","sar-detail","alert-detail","customer-detail"]},
  {id:"manager",label:"AML Ops Manager",abbr:"MG",desc:"Oversight dashboard",views:["dashboard","alerts","cases","sar-list","model","screening","transactions","network","alert-detail","case-detail","sar-detail","customer-detail","anomaly-detail"]},
  {id:"scientist",label:"Data Scientist",abbr:"DS",desc:"Model governance",views:["dashboard","model","settings","alerts","transactions","alert-detail"]},
  {id:"regulator",label:"Regulator",abbr:"RG",desc:"Receives SAR filings",views:["dashboard","sar-list","model","sar-detail"]},
];
const NAV_ITEMS=[
  {id:"dashboard",label:"Dashboard"},
  {id:"alerts",label:"Alerts",badge:ALERTS.filter(a=>a.status==="ESCALATE").length},
  {id:"cases",label:"Cases",badge:CASES.length},
  {id:"transactions",label:"Transactions"},
  {id:"network",label:"Network Detection"},
  {id:"sar-list",label:"SARs",badge:SARS.length},
  {id:"screening",label:"Screening"},
  {id:"model",label:"Model Governance"},
  {id:"settings",label:"Data Sources"},
];

const OBSERVABILITY_ITEMS=[
  {id:"obs-metrics",label:"Metrics & KPIs",blurb:"Real-time platform health metrics, alert throughput, and SLA tracking across all AML pipelines."},
  {id:"obs-logs",label:"System Logs",blurb:"Centralized log search across the agent, ingestion services, and downstream connectors."},
  {id:"obs-traces",label:"Distributed Traces",blurb:"End-to-end request tracing for alert investigations and SAR generation flows."},
  {id:"obs-uptime",label:"Service Uptime",blurb:"Per-service uptime, latency, and dependency health across the Themis stack."},
];

const AUDIT_ITEMS=[
  {id:"audit-events",label:"Event Log",blurb:"Immutable, regulator-ready log of every action taken on the platform."},
  {id:"audit-users",label:"User Activity",blurb:"Per-user activity timeline including logins, decisions, and data exports."},
  {id:"audit-changes",label:"Change History",blurb:"Track configuration, model, and policy changes with rollback support."},
  {id:"audit-access",label:"Access Reviews",blurb:"Quarterly access certifications and segregation-of-duties reporting."},
];

const WORKBENCH_ITEMS=[
  {id:"wb-agents",label:"Agent Studio",blurb:"Supervisor and specialist agents (alert triage, case investigator, SAR drafter, network analyst) with tool routing, prompt versions, and live trace inspection."},
  {id:"wb-skills",label:"Skills Library",blurb:"Reusable AML skills with telemetry, health scoring, and trigger analytics so platform engineers can evolve detection logic safely."},
  {id:"wb-prompts",label:"Prompt Studio",blurb:"Versioned prompt YAML editor with A/B comparison, regression playback against historical alerts, and approval workflow."},
  {id:"wb-pipelines",label:"Data Pipelines",blurb:"Ingestion + sync status across core banking, SWIFT, sanctions, and PEP feeds with per-source freshness, lag, and lineage."},
];

// --- MAIN APP -------------------------------------------------
export default function ThemisPlatform(){
  console.log(' ThemisPlatform component rendering...');
  
  const [view,setView]=useState("dashboard");
  const [selId,setSelId]=useState(null);
  const [persona,setPersona]=useState("analyst");
  const [showPersona,setShowPersona]=useState(false);
  const [chatOpen,setChatOpen]=useState(false);
  const [openCats,setOpenCats]=useState({amlops:true,observability:false,audit:false,workbench:false});
  const toggleCat=(k)=>setOpenCats(o=>({...o,[k]:!o[k]}));

  const curr=PERSONAS.find(p=>p.id===persona);
  console.log(' Current persona:', curr);
  const navBase=view==="briefing"?"briefing":view.includes("alert")?"alerts":view.includes("case")?"cases":view.includes("sar")?"sar-list":view.includes("customer")||view.includes("anomaly")?"dashboard":view;
  const nav=(v,id=null)=>{setView(v);setSelId(id);};
  const placeholderItem=[...OBSERVABILITY_ITEMS,...AUDIT_ITEMS,...WORKBENCH_ITEMS].find(i=>i.id===view);
  const viewLabel=placeholderItem?.label||NAV_ITEMS.find(n=>n.id===navBase)?.label||"Dashboard";
  const allowedNav=NAV_ITEMS.filter(n=>curr.views.some(v=>v===n.id||(n.id==="alerts"&&curr.views.includes("alert-detail"))||(n.id==="cases"&&curr.views.includes("case-detail"))||(n.id==="sar-list"&&curr.views.includes("sar-detail"))));

  const Caret=({open})=>(
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{flexShrink:0,transition:"transform 0.18s ease",transform:open?"rotate(90deg)":"rotate(0deg)"}}>
      <path d="M2.5 1.5L6 4.5L2.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const CategoryHeader=({label,open,onToggle})=>(
    <button onClick={onToggle}
      style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"6px 10px",borderRadius:6,fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#6b7280",textTransform:"uppercase",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}
      onMouseEnter={e=>e.currentTarget.style.color="#0F172A"}
      onMouseLeave={e=>e.currentTarget.style.color="#6b7280"}>
      <Caret open={open}/>
      <span>{label}</span>
    </button>
  );
  const PlaceholderItem=({item,category})=>{
    const Active=view===item.id;
    return(
      <button onClick={()=>nav(item.id)}
        style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 10px 6px 22px",borderRadius:8,fontSize:13,textAlign:"left",transition:"all 0.15s",
          background:Active?NAVY_LIGHT:"transparent",
          color:Active?NAVY:"#4b5563",
          fontWeight:Active?500:400,border:"none",cursor:"pointer"}}>
        {item.label}
        <span style={{marginLeft:"auto",fontSize:8,fontWeight:600,color:"#92400E",background:"#FEF3C7",padding:"1px 5px",borderRadius:3,letterSpacing:"0.04em"}}>SOON</span>
      </button>
    );
  };

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#F1F5F9",overflow:"hidden"}}>
      {/* SIDEBAR (Kratos style) */}
      <aside style={{width:220,background:"white",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Daily briefing chat terminal */}
        <div style={{padding:"12px 12px 4px 12px"}}>
          <button onClick={()=>nav("briefing")}
            style={{width:"100%",display:"flex",alignItems:"center",gap:8,borderRadius:8,padding:"8px 10px",marginBottom:2,fontSize:13,transition:"all 0.15s",
              background:navBase==="briefing"?NAVY_LIGHT:"transparent",
              color:navBase==="briefing"?NAVY:"#4b5563",
              fontWeight:navBase==="briefing"?500:400,border:"none",cursor:"pointer",textAlign:"left"}}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{flexShrink:0}}>
              <path d="M1 2.5h11M1 5.5h8M1 8.5h9M1 11.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Daily briefing
            <span style={{marginLeft:"auto",fontSize:9,fontWeight:700,letterSpacing:"0.06em",color:"#15803D",background:"#DCFCE7",padding:"2px 6px",borderRadius:3}}>LIVE</span>
          </button>
        </div>

        <div style={{margin:"0 12px",borderTop:"1px solid #f3f4f6"}} />

        {/* ACTING AS - global persona selector */}
        <div style={{padding:"10px 12px 8px"}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",color:"#9ca3af",marginBottom:6,paddingLeft:2}}>ACTING AS</div>
          <div style={{background:"#f3f4f6",borderRadius:8,padding:3,position:"relative"}}>
            <div style={{
              position:"absolute",
              background:NAVY,
              borderRadius:6,
              transition:"all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              top:3,
              left:3,
              width:"calc(33.333% - 2px)",
              height:"calc(50% - 2px)",
              transform:`translate(${(PERSONAS.findIndex(p=>p.id===persona)%3)*100}%, ${Math.floor(PERSONAS.findIndex(p=>p.id===persona)/3)*100}%)`,
              boxShadow:"0 1px 3px rgba(0,0,0,0.1)"
            }}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:2,position:"relative"}}>
              {PERSONAS.map(p=>(
                <button key={p.id} onClick={()=>{setPersona(p.id);nav("dashboard");}}
                  style={{padding:"8px 4px",background:"transparent",border:"none",borderRadius:6,cursor:"pointer",transition:"opacity 0.15s",textAlign:"center",position:"relative",zIndex:1}}
                  onMouseEnter={e=>persona!==p.id&&(e.currentTarget.style.opacity="0.7")}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  <div style={{fontSize:10,fontWeight:persona===p.id?600:500,color:persona===p.id?"white":"#6b7280",letterSpacing:"0.01em",transition:"color 0.2s"}}>{p.abbr}</div>
                  <div style={{fontSize:8,fontWeight:400,color:persona===p.id?"rgba(255,255,255,0.8)":"#9ca3af",marginTop:1,transition:"color 0.2s"}}>{p.label.split(" ").slice(-1)[0]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{margin:"0 12px",borderTop:"1px solid #f3f4f6"}} />

        {/* Categorized navigation */}
        <nav style={{flex:1,overflowY:"auto",padding:"10px 8px"}}>
          {/* AML Operations */}
          <div style={{marginBottom:6}}>
            <CategoryHeader label="AML Operations" open={openCats.amlops} onToggle={()=>toggleCat("amlops")}/>
            {openCats.amlops&&(
              <div style={{display:"flex",flexDirection:"column",gap:1,marginTop:2}}>
                {allowedNav.map(item=>{
                  const Active=navBase===item.id;
                  return(
                    <button key={item.id} onClick={()=>nav(item.id)}
                      style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 10px 6px 22px",borderRadius:8,fontSize:13,textAlign:"left",transition:"all 0.15s",
                        background:Active?NAVY_LIGHT:"transparent",
                        color:Active?NAVY:"#4b5563",
                        fontWeight:Active?500:400,border:"none",cursor:"pointer"}}>
                      {item.label}
                      {item.badge?<span style={{marginLeft:"auto",fontSize:10,background:"#fde8e8",color:"#b91c1c",fontWeight:500,padding:"1px 6px",borderRadius:20,minWidth:18,textAlign:"center"}}>{item.badge}</span>:null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Observability */}
          <div style={{marginBottom:6}}>
            <CategoryHeader label="Observability" open={openCats.observability} onToggle={()=>toggleCat("observability")}/>
            {openCats.observability&&(
              <div style={{display:"flex",flexDirection:"column",gap:1,marginTop:2}}>
                {OBSERVABILITY_ITEMS.map(item=><PlaceholderItem key={item.id} item={item} category="Observability"/>)}
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <div style={{marginBottom:6}}>
            <CategoryHeader label="Audit Trail" open={openCats.audit} onToggle={()=>toggleCat("audit")}/>
            {openCats.audit&&(
              <div style={{display:"flex",flexDirection:"column",gap:1,marginTop:2}}>
                {AUDIT_ITEMS.map(item=><PlaceholderItem key={item.id} item={item} category="Audit Trail"/>)}
              </div>
            )}
          </div>

          {/* Platform Workbench (tech surfaces) */}
          <div>
            <CategoryHeader label="Platform Workbench" open={openCats.workbench} onToggle={()=>toggleCat("workbench")}/>
            {openCats.workbench&&(
              <div style={{display:"flex",flexDirection:"column",gap:1,marginTop:2}}>
                {WORKBENCH_ITEMS.map(item=><PlaceholderItem key={item.id} item={item} category="Platform Workbench"/>)}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar (Kratos style) */}
        <div style={{height:52,background:NAVY,borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14,fontWeight:500,color:"white",letterSpacing:"-0.01em",whiteSpace:"nowrap"}}>
              AML Intelligence Platform Built for INCEDO
              <span style={{color:"rgba(255,255,255,.5)",fontWeight:300,margin:"0 6px"}}>·</span>
              Powered by <span style={{color:ORANGE}}>Themis</span>
            </span>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:11,color:"rgba(255,255,255,.3)",fontWeight:300}}>
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <button onClick={()=>setChatOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px",background:chatOpen?"rgba(232,93,32,.25)":"rgba(255,255,255,.12)",color:"white",border:`1px solid ${chatOpen?ORANGE:"rgba(255,255,255,.2)"}`,borderRadius:20,cursor:"pointer",fontWeight:500,fontSize:12,transition:"all 0.15s"}}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}>
                <path d="M12 2H2C1.45 2 1 2.45 1 3v7c0 .55.45 1 1 1h1v2l2.5-2H12c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1z" fill="rgba(255,255,255,0.7)" />
              </svg>
              <span>Themis</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",background:"#f9fafb"}}>
          {view==="briefing"&&<BriefingView persona={persona} personaLabel={curr.label}/>}
          {view==="dashboard"&&<DashboardView onNav={nav}/>}
          {view==="alerts"&&<AlertsView onNav={nav}/>}
          {view==="alert-detail"&&<AlertDetailView alertId={selId} onNav={nav}/>}
          {view==="cases"&&<CasesView onNav={nav}/>}
          {view==="case-detail"&&<CaseDetailView caseId={selId} onNav={nav}/>}
          {view==="transactions"&&<TransactionsView onNav={nav}/>}
          {view==="network"&&<NetworkView/>}
          {view==="sar-list"&&<SARListView onNav={nav}/>}
          {view==="sar-detail"&&<SARDetailView sarId={selId} onNav={nav}/>}
          {view==="screening"&&<ScreeningView/>}
          {view==="model"&&<ModelGovernanceView/>}
          {view==="settings"&&<SettingsView/>}
          {view==="customer-detail"&&<CustomerDetailView customerId={selId} onNav={nav}/>}
          {view==="anomaly-detail"&&<AnomalyDetailView anomalyId={selId} onNav={nav}/>}
          {OBSERVABILITY_ITEMS.find(i=>i.id===view)&&<ComingSoonView title={OBSERVABILITY_ITEMS.find(i=>i.id===view).label} category="Observability" blurb={OBSERVABILITY_ITEMS.find(i=>i.id===view).blurb}/>}
          {AUDIT_ITEMS.find(i=>i.id===view)&&<ComingSoonView title={AUDIT_ITEMS.find(i=>i.id===view).label} category="Audit Trail" blurb={AUDIT_ITEMS.find(i=>i.id===view).blurb}/>}
          {view==="wb-agents"&&<AgentStudioView/>}
          {view==="wb-skills"&&<SkillsLibraryView/>}
          {view==="wb-prompts"&&<PromptStudioView/>}
          {view==="wb-pipelines"&&<ComingSoonView title="Data Pipelines" category="Platform Workbench" blurb={WORKBENCH_ITEMS.find(i=>i.id==="wb-pipelines").blurb}/>}
        </div>
      </div>

      {chatOpen?<ThemisChat onClose={()=>setChatOpen(false)} view={viewLabel}/>:null}
    </div>
  );
}











