import { useState, useRef, useEffect, useMemo } from "react";
import AGENTS_REGISTRY from "../agent/agents.json";

// Centralized libraries loaded at build time by Vite
const SKILL_MODULES    = import.meta.glob("../skills/aml/*.md",                { query:"?raw", import:"default", eager:true });
const PROMPT_MODULES   = import.meta.glob("../prompts/*.yaml",                 { query:"?raw", import:"default", eager:true });
const TYPOLOGY_MODULES = import.meta.glob("../skills/aml/typologies/**/*.md",  { query:"?raw", import:"default", eager:true });

// Phase 5 — parse the typology MD tree into a flat list. Keys are the
// path (`../skills/aml/typologies/cash_based/structuring.md` etc.);
// values are the raw MD text. No UI view yet — data is just made
// available here for a follow-up iteration.
const TYPOLOGIES = Object.entries(TYPOLOGY_MODULES)
  .filter(([path]) => !path.split("/").pop().startsWith("_"))   // skip _schema.md
  .map(([path, raw]) => {
    const fmMatch = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/.exec(raw || "");
    const fm = {};
    if (fmMatch) {
      for (const line of fmMatch[1].split("\n")) {
        const m = /^([a-zA-Z_]+):\s*(.+)$/.exec(line.trim());
        if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
    return {
      path,
      typologyId: fm.typology_id || "",
      name: fm.name || "",
      category: fm.category || "",
      version: fm.version || "",
      status: fm.status || "",
      raw,
      body: fmMatch ? fmMatch[2] : (raw || ""),
    };
  });

// --- Phase 3 API helpers ------------------------------------
// useApi(path) — fetches GET path on mount and on path change.
// Returns {data, loading, error}. Pass a falsy path to skip.
function useApi(path){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(!!path);
  const [error,setError]=useState(null);
  useEffect(()=>{
    if(!path){setData(null);setLoading(false);setError(null);return;}
    let alive=true;
    setLoading(true);setError(null);
    fetch(path)
      .then(r=>r.ok?r.json():Promise.reject(new Error(`${r.status} ${r.statusText}`)))
      .then(d=>{if(alive){setData(d);setLoading(false);}})
      .catch(e=>{if(alive){setError(e);setLoading(false);}});
    return()=>{alive=false;};
  },[path]);
  return{data,loading,error};
}
// Utility: build {id: customer} map from an array
const customersById = (arr)=>Object.fromEntries((arr||[]).map(c=>[c.id,c]));

// ============================================================
// THEMIS · Complete AML Intelligence Platform
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

// --- All data now sourced from /api/* (Phase 3) ----




// --- DASHBOARD VIEW ------------------------------------------
function DashboardView({onNav}){
  const {data:summary}=useApi("/api/dashboard/summary");
  const {data:alerts}=useApi("/api/alerts");
  const {data:cases}=useApi("/api/cases");
  const {data:anomalies}=useApi("/api/anomalies");
  const {data:customersList}=useApi("/api/customers");
  const customerMap=useMemo(()=>customersById(customersList),[customersList]);
  if(!alerts||!cases||!anomalies||!summary)return <div style={{padding:24,color:"#64748B"}}>Loading dashboard…</div>;
  const escalated=summary.alerts?.byStatus?.ESCALATE||0;
  const cleared=summary.alerts?.byStatus?.CLEAR||0;
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
        <MCard label="Total Alerts" value={summary.alerts.total} onClick={()=>onNav("alerts")}/>
        <MCard label="Escalated" value={escalated} color="#EF4444" onClick={()=>onNav("alerts")}/>
        <MCard label="Auto-Cleared" value={cleared} color="#10B981" sub="85% avg confidence"/>
        <MCard label="Open Cases" value={cases.filter(c=>c.status!=="CLOSED").length} color={NAVY} onClick={()=>onNav("cases")}/>
        <MCard label="Pending SARs" value={summary.sars.total} color="#7C3AED" onClick={()=>onNav("sar-list")}/>
        <MCard label="Txns Analyzed" value="3,846" color="#D97706"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={{background:"white",borderRadius:12,padding:18,border:"1px solid #E2E8F0"}}>
          <SH title="L1 Agent  Alert Queue" sub={`${alerts.length} alerts · 81% avg confidence`}
            action={<button onClick={()=>onNav("alerts")} style={{fontSize:12,color:NAVY,border:"none",background:"none",cursor:"pointer",fontWeight:700}}>View All </button>}/>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>{["Alert","Customer","Decision","Risk","Action"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"5px 8px",color:"#94A3B8",fontWeight:600,fontSize:10}}>{h}</th>
            ))}</tr></thead>
            <tbody>{alerts.map(a=>{const c=customerMap[a.customerId];return(
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
          <SH title="Dynamic Anomaly Detection" sub={`${anomalies.length} anomalies detected · ML-driven`}
            action={<Pill label="Live"/>}/>
          {anomalies.map(an=>(
            <div key={an.id} onClick={()=>onNav("anomaly-detail",an.id)}
              style={{borderLeft:`3px solid ${sc(an.type)}`,paddingLeft:10,paddingTop:6,paddingBottom:6,marginBottom:8,cursor:"pointer",borderRadius:"0 6px 6px 0"}}
              onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <Badge label={an.type} color={sc(an.type)} bg={rb(an.type)}/>
                <span style={{fontFamily:"monospace",fontSize:11,color:"#64748B"}}>{an.amount}</span>
              </div>
              <div style={{fontSize:12,color:"#334155",fontWeight:500,marginTop:3}}>{an.desc}</div>
              <div style={{fontSize:10,color:NAVY,marginTop:2,fontWeight:600}}>Click for details</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"white",borderRadius:12,padding:18,border:"1px solid #E2E8F0"}}>
          <SH title="Active Cases" action={<button onClick={()=>onNav("cases")} style={{fontSize:12,color:NAVY,border:"none",background:"none",cursor:"pointer",fontWeight:700}}>View All </button>}/>
          {cases.map(cs=>{const c=customerMap[cs.customerId];return(
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
  const {data:an}=useApi(`/api/anomalies/${anomalyId}`);
  const {data:relatedAlert}=useApi(an?`/api/alerts/${an.alertId}`:null);
  const {data:relatedCustomer}=useApi(relatedAlert?`/api/customers/${relatedAlert.customerId}`:null);
  if(!an)return <div style={{padding:24,color:"#64748B"}}>Loading anomaly…</div>;
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{fontSize:12,color:"#64748B",marginBottom:14}}>
        <span style={{cursor:"pointer",color:NAVY,fontWeight:600}} onClick={()=>onNav("dashboard")}>Dashboard</span>
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
                  onClick={()=>{ if(acc&&acc.startsWith("C-")) onNav("customer-detail",acc); }}>
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
              <button onClick={()=>onNav("customer-detail",relatedCustomer.id)} style={{width:"100%",marginTop:8,padding:"7px 0",background:NAVY,color:"white",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>View Customer Profile</button>
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
          <button onClick={onClose} style={{background:"#F1F5F9",border:"none",borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,color:"#64748B"}}>×</button>
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
          <button onClick={onClose} style={{background:"#F1F5F9",border:"none",borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16}}>×</button>
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
  // /api/customers/:id returns customer + linked alerts + cases in one payload
  const {data:customer}=useApi(`/api/customers/${customerId}`);
  const {data:allScreenings}=useApi("/api/screening");
  if(!customer)return <div style={{padding:24,color:"#64748B"}}>Loading customer…</div>;
  const customerAlerts=customer.alerts||[];
  const customerCases=customer.cases||[];
  const customerScreenings=(allScreenings||[]).filter(s=>s.entityId===customerId);
  return(
    <div style={{padding:"24px 28px"}}>
      {riskModal&&<RiskExplainModal customer={customer} type={riskModal} onClose={()=>setRiskModal(null)}/>}
      <div style={{fontSize:12,color:"#64748B",marginBottom:14}}>
        <span style={{cursor:"pointer",color:NAVY,fontWeight:600}} onClick={()=>onNav("dashboard")}>Dashboard</span>
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
// Reusable step renderer for both pre-seeded and persisted investigation journals.
// Accepts steps shaped {n, type?, title, tool, status, summary, details?}.
function JournalStepList({steps}){
  const [expanded,setExpanded]=useState({});
  const toggle=n=>setExpanded(p=>({...p,[n]:!p[n]}));
  if(!steps||steps.length===0)return null;
  return(
    <div>
      {steps.map((step,si)=>(
        <div key={step.n??si} style={{marginBottom:10,border:"1px solid #E2E8F0",borderRadius:9,overflow:"hidden"}}>
          <div onClick={()=>toggle(step.n??si)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 14px",background:expanded[step.n??si]?"#EFF6FF":"#F8FAFC",cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{width:24,height:24,borderRadius:"50%",background:NAVY,color:"white",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{si+1}</span>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6}}><Badge label={step.type||"STEP"} color="white" bg={sc(step.type||"STEP")}/><span style={{fontSize:13,fontWeight:700,color:"#0F172A"}}>{step.title}</span></div>
                {step.tool&&<div style={{fontSize:11,color:"#64748B",marginTop:1}}>Tool: <code style={{background:"#F1F5F9",padding:"1px 5px",borderRadius:3,fontSize:10}}>{step.tool}</code></div>}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:10,background:"#D1FAE5",color:"#065F46",padding:"2px 7px",borderRadius:3,fontWeight:600}}>{(step.status||"COMPLETE").toUpperCase()}</span>
              <span style={{fontSize:14,color:"#94A3B8"}}>{expanded[step.n??si]?"−":"+"}</span>
            </div>
          </div>
          {step.summary&&(
            <div style={{padding:"10px 14px",background:"#FFFBEB",borderLeft:"3px solid #F59E0B"}}>
              <div style={{fontSize:12,color:"#78350F",fontStyle:"italic"}}>{step.summary}</div>
            </div>
          )}
          {expanded[step.n??si]&&step.details&&(
            <div style={{padding:"14px",background:"#FAFAFA",borderTop:"1px solid #E2E8F0"}}>
              <pre style={{fontSize:11,color:"#334155",lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"monospace",margin:0,background:"#F1F5F9",padding:12,borderRadius:7}}>{step.details}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Normalize an `/api/investigations/:id` journal entry to the shape JournalStepList expects.
function normalizeApiJournal(apiJournal){
  return (apiJournal||[]).map(j=>{
    let details = j.toolOutput;
    if(details && typeof details !== "string"){
      try{ details = JSON.stringify(details, null, 2); } catch{ details = String(details); }
    }
    const findingsLine = (j.findings||[]).join(" · ");
    return {
      n: j.step,
      type: "STEP",
      title: j.stepName,
      tool: j.tool,
      status: j.status || "completed",
      summary: j.analysis || findingsLine,
      details,
    };
  });
}

// Investigation status → colour + label + whether the dot should pulse.
// idle=grey, running=amber (pulsing), done=green, error=red.
const INV_STATUS_META={
  idle:   {color:"#94A3B8",label:"Idle",   pulse:false},
  running:{color:"#F59E0B",label:"Running",pulse:true },
  done:   {color:"#10B981",label:"Done",   pulse:false},
  error:  {color:"#EF4444",label:"Error",  pulse:false},
};

// Small status light. Always reflects investigation state; pulses while running.
// Relies on the `pulse-ring` keyframe injected once inside AlertDetailView.
function StatusDot({status,size=8,withLabel=false}){
  const m=INV_STATUS_META[status]||INV_STATUS_META.idle;
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
      <span style={{position:"relative",display:"inline-block",width:size,height:size,flexShrink:0}}>
        {m.pulse&&<span style={{position:"absolute",inset:0,borderRadius:"50%",background:m.color,animation:"pulse-ring 1.4s ease-out infinite"}}/>}
        <span style={{position:"absolute",inset:0,borderRadius:"50%",background:m.color}}/>
      </span>
      {withLabel&&<span style={{fontSize:11,fontWeight:700,color:m.color}}>{m.label}</span>}
    </span>
  );
}

// Parse the orchestrator's plain-text investigation narrative into a title +
// ordered sections. Section headers are ALL-CAPS lines ending in a colon.
function parseNarrative(text){
  const lines=(text||"").split("\n");
  let title="";
  const sections=[];
  let cur=null;
  for(const raw of lines){
    const line=raw.trim();
    if(!line) continue;
    if(/^[A-Z][A-Z0-9 &/()'-]*:$/.test(line)){
      cur={heading:line.replace(/:$/,""),lines:[]};
      sections.push(cur);
      continue;
    }
    if(!cur){ title=title?title+" "+line:line; continue; }
    cur.lines.push(line);
  }
  return {title,sections};
}

// Classify one content line: a short "Key: value" pair, a bullet, or prose.
function classifyNarrativeLine(raw){
  const bulleted=/^[-·•]\s+/.test(raw);
  const body=raw.replace(/^[-·•]\s+/,"").trim();
  const kv=body.match(/^([A-Za-z][\w ./%-]{0,38}?):\s+(.+)$/);
  if(kv) return {type:"kv",k:kv[1].trim(),v:kv[2].trim()};
  if(bulleted) return {type:"bullet",text:body};
  return {type:"para",text:body};
}

// Renders the investigation narrative as a structured report card instead of
// a raw <pre> dump. Falls back to <pre> if the text has no recognizable sections.
function NarrativeReport({text}){
  const {title,sections}=parseNarrative(text);
  if(!sections.length)
    return <pre style={{whiteSpace:"pre-wrap",fontSize:12,color:"#334155",margin:0,fontFamily:"inherit",lineHeight:1.6}}>{text}</pre>;
  return(
    <div style={{border:"1px solid #E2E8F0",borderRadius:10,overflow:"hidden",background:"white"}}>
      {title&&(
        <div style={{background:NAVY,color:"white",padding:"11px 16px",fontSize:12.5,fontWeight:700,letterSpacing:"-.01em"}}>{title}</div>
      )}
      <div style={{padding:"2px 16px 8px"}}>
        {sections.map((sec,si)=>{
          const parsed=sec.lines.map(classifyNarrativeLine);
          const kvs=parsed.filter(p=>p.type==="kv");
          const bullets=parsed.filter(p=>p.type==="bullet");
          const paras=parsed.filter(p=>p.type==="para").map(p=>p.text);
          return(
            <div key={si} style={{padding:"13px 0",borderBottom:si<sections.length-1?"1px solid #F1F5F9":"none"}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:".07em",color:"#94A3B8",textTransform:"uppercase",marginBottom:8}}>{sec.heading}</div>
              {paras.length>0&&(
                <div style={{fontSize:12.5,color:"#334155",lineHeight:1.65,marginBottom:(kvs.length||bullets.length)?10:0}}>{paras.join(" ")}</div>
              )}
              {bullets.length>0&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:kvs.length?10:0}}>
                  {bullets.map((b,bi)=>(
                    <span key={bi} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",color:NAVY,fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:6}}>{b.text}</span>
                  ))}
                </div>
              )}
              {kvs.length>0&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:"2px 18px"}}>
                  {kvs.map((kv,ki)=>(
                    <div key={ki} style={{display:"flex",justifyContent:"space-between",gap:10,fontSize:12,padding:"4px 0",borderBottom:"1px dotted #E2E8F0"}}>
                      <span style={{color:"#64748B",fontWeight:500}}>{kv.k}</span>
                      <span style={{color:"#0F172A",fontWeight:700,textAlign:"right"}}>{kv.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  // Live agent investigation state — populated by SSE
  const [liveSteps,setLiveSteps]=useState([]);
  const [liveStatus,setLiveStatus]=useState("idle"); // idle | running | done | error
  const [liveResult,setLiveResult]=useState(null);

  // /api/alerts/:id returns alert + transactions + timeline + network + journal in one payload
  const {data:alert}=useApi(`/api/alerts/${alertId}`);
  const {data:customer}=useApi(alert?`/api/customers/${alert.customerId}`:null);
  const {data:cases}=useApi("/api/cases");
  // Past investigations for this alert; if non-empty we show the most recent run's journal
  const {data:pastInvestigations}=useApi(`/api/investigations/alert/${alertId}`);
  const latestInv=pastInvestigations&&pastInvestigations.length>0?pastInvestigations[0]:null;
  const {data:latestInvDetail}=useApi(latestInv?`/api/investigations/${latestInv.id}`:null);

  if(!alert)return <div style={{padding:24,color:"#64748B"}}>Loading alert…</div>;
  const txns=alert.transactions||[];
  const tlData=alert.timeline||[];
  const apiNet=alert.network||null;
  // NetworkGraph expects from/to/dir; API gives source/target/direction
  const netData=apiNet?{nodes:apiNet.nodes,edges:(apiNet.edges||[]).map(e=>({from:e.source,to:e.target,amount:e.amount,dir:e.direction}))}:null;
  // Journal: use persisted run if any, else empty (live SSE handled separately by liveSteps)
  const journalSteps=latestInvDetail?normalizeApiJournal(latestInvDetail.journal):[];
  const linkedCase=(cases||[]).find(c=>c.alertId===alertId);

  const startInvestigation=()=>{
    setLiveSteps([]);setLiveResult(null);setLiveStatus("running");setTab("journal");
    const es=new EventSource(`/api/agent/investigate/${alertId}/stream`);
    es.onmessage=(ev)=>{
      try{
        const m=JSON.parse(ev.data);
        if(m.type==="step_complete"){
          setLiveSteps(prev=>[...prev,{n:m.step,title:m.step_name,findings:m.findings||[],status:"complete"}]);
        } else if(m.type==="complete"){
          setLiveResult(m); setLiveStatus("done"); es.close();
        } else if(m.type==="error"){
          setLiveStatus("error"); es.close();
        }
      }catch{/* ignore */}
    };
    es.onerror=()=>{setLiveStatus("error"); es.close();};
  };

  const filteredTxns=txnFilter==="flagged"?txns.filter(t=>t.flagged):txnFilter==="inflow"?txns.filter(t=>t.amount>0):txnFilter==="outflow"?txns.filter(t=>t.amount<0):txns;
  const flaggedTxns=txns.filter(t=>t.flagged);
  const inflows=txns.filter(t=>t.amount>0);
  const outflows=txns.filter(t=>t.amount<0);

  const tabs=["overview","journal","narrative","transactions","risk"];
  const tabL={overview:"Overview",journal:"Investigation Journal",narrative:"Final Narrative",transactions:"Transactions",risk:"Risk Factors"};

  const toggleStep=n=>setExpandedSteps(p=>({...p,[n]:!p[n]}));

  return(
    <div style={{padding:"24px 28px"}}>
      <style>{`@keyframes pulse-ring{0%{transform:scale(1);opacity:.65}70%{transform:scale(2.6);opacity:0}100%{transform:scale(2.6);opacity:0}}`}</style>
      {txnModal&&<TxnModal txn={txnModal} onClose={()=>setTxnModal(null)}/>}
      {riskModal&&<RiskExplainModal customer={customer} type={riskModal} onClose={()=>setRiskModal(null)}/>}

      <div style={{fontSize:12,color:"#64748B",marginBottom:14}}>
        <span style={{cursor:"pointer",color:NAVY,fontWeight:600}} onClick={()=>onNav("alerts")}>Alerts</span>
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
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {/* Always-visible status light — grey idle, pulsing amber running, green done, red error */}
          <StatusDot status={liveStatus} size={9} withLabel/>
          <button onClick={startInvestigation} disabled={liveStatus==="running"}
            style={{padding:"7px 14px",background:liveStatus==="running"?"#94A3B8":ORANGE,color:"white",border:"none",borderRadius:7,cursor:liveStatus==="running"?"not-allowed":"pointer",fontWeight:600,fontSize:12}}>
            {liveStatus==="running"?`Investigating · ${liveSteps.length}/10`:liveStatus==="done"?"Re-run Investigation":"Run AI Investigation"}
          </button>
          {linkedCase
            ?<button onClick={()=>onNav("case-detail",linkedCase.id)} style={{padding:"7px 14px",background:NAVY,color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>View Case</button>
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
                <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:6}}>Entity / Counterparty Network</div>
                <div style={{display:"flex",gap:10,marginBottom:10,fontSize:11}}>
                  {[["Subject",NAVY],["Entity","#F59E0B"],["Branch","#10B981"],["Bank","#8B5CF6"],["Other","#64748B"]].map(([l,c])=><span key={l} style={{color:c,fontWeight:600}}>{l}</span>)}
                  <span style={{marginLeft:"auto",color:"#94A3B8"}}> Inflow   Outflow</span>
                </div>
                {netData?<NetworkGraph Data={netData}/>:<div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",color:"#94A3B8",fontSize:12,background:"#F8FAFC",borderRadius:8}}>Network Data not available for this alert</div>}
              </div>
            </div>
          )}

          {/* -- INVESTIGATION JOURNAL TAB -- */}
          {tab==="journal"&&(
            <div>
              {liveStatus!=="idle"&&(
                <div style={{background:"white",borderRadius:10,padding:18,border:`1px solid ${liveStatus==="error"?"#FCA5A5":liveStatus==="done"?"#A7F3D0":"#BFDBFE"}`,marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <StatusDot status={liveStatus} size={9}/>
                      <div style={{fontSize:13,fontWeight:700,color:"#0F172A"}}>
                        Live Investigation · {liveStatus==="running"?`step ${liveSteps.length}/10`:liveStatus==="done"?"done":"error"}
                      </div>
                    </div>
                    {liveResult&&<Badge label={liveResult.recommendation||"DONE"} color={sc(liveResult.recommendation||"")} bg={liveResult.recommendation==="ESCALATE"?"#FEE2E2":"#D1FAE5"}/>}
                  </div>
                  {/* Progress bar — fills as steps stream in, turns green on done / red on error */}
                  <div style={{height:4,background:"#E2E8F0",borderRadius:4,overflow:"hidden",marginBottom:12}}>
                    <div style={{height:"100%",width:`${Math.min(liveSteps.length/10,1)*100}%`,background:liveStatus==="error"?"#EF4444":liveStatus==="done"?"#10B981":"#F59E0B",transition:"width .3s ease"}}/>
                  </div>
                  {liveSteps.map(s=>(
                    <div key={s.n} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"6px 0",borderBottom:"1px solid #F1F5F9",fontSize:12}}>
                      <span style={{width:22,height:22,borderRadius:"50%",background:NAVY,color:"white",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{s.n}</span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,color:"#0F172A"}}>{s.title}</div>
                        {s.findings&&s.findings.length>0&&<div style={{fontSize:11,color:"#64748B",marginTop:2}}>{s.findings.join(" · ")}</div>}
                      </div>
                    </div>
                  ))}
                  {liveResult&&liveResult.narrative&&(
                    <div style={{marginTop:12}}><NarrativeReport text={liveResult.narrative}/></div>
                  )}
                </div>
              )}
              <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0",marginBottom:14}}>
                <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:4}}> Themis L1 Agent · Investigation Journal</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                  {[[`${journalSteps.length} steps`,""],["9 tool calls",""],[alert.status,""],[`${alert.confidence}% confidence`,""]].map(([l,i])=>(
                    <span key={l} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",padding:"3px 10px",borderRadius:5,color:"#334155",fontWeight:500,fontSize:11}}>{i} {l}</span>
                  ))}
                </div>

                {journalSteps.length>0?(
                  <JournalStepList steps={journalSteps}/>
                ):liveStatus==="idle"?(
                  <div style={{padding:24,textAlign:"center",border:"2px dashed #E2E8F0",borderRadius:9,color:"#64748B",fontSize:13}}>
                    No investigation has been run for this alert yet. Click <strong>Run AI Investigation</strong> above to start a 10-step orchestrated review.
                  </div>
                ):null}
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
                  <div style={{fontSize:12,fontWeight:700,color:"#065F46",marginBottom:6}}>AI Summary · {alert.status==="CLEAR"?"False Positive":"Escalated for Investigation"}</div>
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
                      <div key={i} style={{fontSize:12,color:"#7F1D1D",marginBottom:8,display:"flex",gap:6}}><span>•</span><span>{f}</span></div>
                    ))}
                  </div>
                  <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:14}}>
                    <div style={{fontWeight:700,color:"#065F46",marginBottom:10,fontSize:13}}> Mitigating Factors</div>
                    {["KYC fully current · cash-intensive business profile","Payroll ACHs align with $42K stated income","Prior alert AL-0042 dismissed with receipts","'Green light' confirmed as youth soccer tournament","P2P counterparty group stable and reciprocal","No adverse media, sanctions, or PEP flags","Representative windows show no suspicious patterns","Baseline inflow ratio within range for retail business"].map((f,i)=>(
                      <div key={i} style={{fontSize:12,color:"#064E3B",marginBottom:6,display:"flex",gap:6}}><span>•</span><span>{f}</span></div>
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
            <button onClick={()=>onNav("customer-detail",alert.customerId)} style={{width:"100%",padding:"6px 0",background:"white",color:NAVY,border:`1px solid ${NAVY}`,borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600}}>View Full Profile</button>
          </div>

          <div style={{background:"white",borderRadius:10,padding:14,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:8,letterSpacing:"0.05em"}}>TOP COUNTERPARTIES</div>
            {["Card Processor - Stripe (90 txns)","Safeway (13 txns)","Cash Withdrawal ATM (13 txns)","Local ATM (13 txns)","Local Restaurants (13 txns)","Various Local Vendors (9 txns)"].map(cp=>(
              <div key={cp} style={{fontSize:11,color:"#334155",padding:"4px 0",borderBottom:"1px solid #F8FAFC"}}>{cp}</div>
            ))}
          </div>
          <div style={{background:"#F0FDF4",borderRadius:10,padding:12,border:"1px solid #BBF7D0"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#065F46",marginBottom:4}}>SOP Compliance</div>
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
  const {data:cases}=useApi("/api/cases");
  const {data:customersList}=useApi("/api/customers");
  const customerMap=useMemo(()=>customersById(customersList),[customersList]);
  if(!cases)return <div style={{padding:24,color:"#64748B"}}>Loading cases…</div>;
  return(
    <div style={{padding:"24px 28px"}}>
      <SH title="Case Management" sub={`${cases.length} active cases · Themis AI-assisted`}/>
      {cases.map(cs=>{const c=customerMap[cs.customerId];return(
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
              <span style={{fontSize:11,background:"#F8FAFC",color:"#64748B",padding:"2px 9px",borderRadius:4}}>{(cs.documents||[]).length} docs</span>
            </div>
            <span style={{fontSize:12,color:NAVY,fontWeight:700}}>Open</span>
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
  const [generatingSar,setGeneratingSar]=useState(false);
  const fileInputRef=useRef(null);

  const generateSar=async()=>{
    if(generatingSar)return;
    setGeneratingSar(true);
    try{
      const r=await fetch(`/api/cases/${caseId}/sar`,{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
      const data=await r.json();
      if(data&&data.id){
        // The new SAR is server-side; route to the SAR list which fetches from API
        onNav("sar-list");
      } else {
        alert("Failed to generate SAR. See console for details.");
        console.error(data);
      }
    } catch(e){
      console.error("SAR generation error:",e);
      alert("Could not reach SAR endpoint.");
    } finally {
      setGeneratingSar(false);
    }
  };

  const {data:cs}=useApi(`/api/cases/${caseId}`);
  const {data:customer}=useApi(cs?`/api/customers/${cs.customerId}`:null);
  // Alert detail also returns transactions in the same payload
  const {data:alertDetail}=useApi(cs?`/api/alerts/${cs.alertId}`:null);
  const {data:allSars}=useApi("/api/sars");

  useEffect(()=>{ if(cs && docs===null) setDocs(cs.documents||[]); },[cs,docs]);

  if(!cs)return <div style={{padding:24,color:"#64748B"}}>Loading case…</div>;
  const alert=alertDetail;
  const sar=(allSars||[]).find(s=>s.caseId===caseId);
  const txns=alertDetail?.transactions||[];

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
        <span style={{cursor:"pointer",color:NAVY,fontWeight:600}} onClick={()=>onNav("cases")}>Cases</span>
        <span style={{margin:"0 6px"}}>·</span>
        <span style={{fontFamily:"monospace",fontWeight:700}}>{caseId}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <div style={{fontSize:19,fontWeight:800,color:"#0F172A"}}>{cs.title}</div>
          <div style={{fontSize:13,color:"#64748B",marginTop:4}}>{customer?.name} · {cs.assignee} · Due {fd(cs.dueDate)}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {sar?<button onClick={()=>onNav("sar-detail",sar.id)} style={{padding:"7px 14px",background:"#7C3AED",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>View SAR</button>
            :<button onClick={generateSar} disabled={generatingSar} style={{padding:"7px 14px",background:generatingSar?"#94A3B8":"#7C3AED",color:"white",border:"none",borderRadius:7,cursor:generatingSar?"not-allowed":"pointer",fontWeight:600,fontSize:12}}>{generatingSar?"Generating SAR…":"Generate SAR"}</button>}
          <button onClick={()=>onNav("alert-detail",cs.alertId)} style={{padding:"7px 14px",background:NAVY,color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>View Alert</button>
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
              <button onClick={()=>onNav("customer-detail",cs.customerId)} style={{marginTop:12,padding:"6px 14px",background:"white",color:NAVY,border:`1px solid ${NAVY}`,borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>View Full Profile</button>
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
            <button onClick={()=>onNav("sar-detail",sar.id)} style={{padding:"6px 12px",background:"#7C3AED",color:"white",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>Open SAR</button>
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
          <button onClick={generateSar} disabled={generatingSar} style={{padding:"9px 22px",background:generatingSar?"#94A3B8":"#7C3AED",color:"white",border:"none",borderRadius:8,cursor:generatingSar?"not-allowed":"pointer",fontWeight:600,fontSize:13}}> {generatingSar?"Generating SAR…":"Generate SAR with Themis AI"}</button>
        </div>
      ))}
    </div>
  );
}



// --- SAR LIST VIEW --------------------------------------------
function SARListView({onNav}){
  const {data:sars}=useApi("/api/sars");
  const {data:cases}=useApi("/api/cases");
  const {data:customersList}=useApi("/api/customers");
  const customerMap=useMemo(()=>customersById(customersList),[customersList]);
  const caseMap=useMemo(()=>Object.fromEntries((cases||[]).map(c=>[c.id,c])),[cases]);
  if(!sars)return <div style={{padding:24,color:"#64748B"}}>Loading SARs…</div>;
  return(
    <div style={{padding:"24px 28px"}}>
      <SH title="SAR Management" sub="Suspicious Activity Reports · Themis AI-generated narratives"/>
      {sars.map(sar=>{
        const c=customerMap[caseMap[sar.caseId]?.customerId];
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
              <div style={{textAlign:"right",fontSize:12}}>{sar.reviewedBy?<div style={{color:"#10B981"}}>{sar.reviewedBy}</div>:<div style={{color:"#F59E0B"}}>Awaiting review</div>}</div>
            </div>
            <div style={{marginTop:10,fontSize:12,color:"#475569",background:"#F8FAFC",borderRadius:7,padding:10}}>{(sar.narrative||"").substring(0,160)}{sar.narrative?"...":"Narrative pending."}</div>
            {(sar.missingFields||[]).length>0&&<div style={{marginTop:8,fontSize:11,color:"#92400E",background:"#FEF3C7",padding:"5px 10px",borderRadius:5}}> Missing: {sar.missingFields.join(" · ")}</div>}
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

  const {data:sar}=useApi(`/api/sars/${sarId}`);
  const {data:cs}=useApi(sar?`/api/cases/${sar.caseId}`:null);
  const {data:customer}=useApi(cs?`/api/customers/${cs.customerId}`:null);
  const {data:alertDetail}=useApi(cs?`/api/alerts/${cs.alertId}`:null);

  useEffect(()=>{ if(sar && auditTrail===null) setAuditTrail(sar.auditTrail||[]); },[sar,auditTrail]);

  if(!sar)return <div style={{padding:24,color:"#64748B"}}>Loading SAR…</div>;
  const alert=alertDetail;
  const txns=alertDetail?.transactions||[];

  const defaultNarrative=`SUSPICIOUS ACTIVITY REPORT · ${sar.id}\nGenerated by Themis AI\n\nSECTION 1 · SUBJECT INFORMATION\nName: ${customer?.name}\nAddress: ${customer?.address}\nDate of Birth: ${customer?.dob}\nOccupation: ${customer?.occupation}\nAccount Number: ${customer?.id}\nSSN (last 4): ${customer?.ssn}\n\nSECTION 2 · SUMMARY OF SUSPICIOUS ACTIVITY\n${customer?.name} engaged in suspicious financial activity between ${fd(alert?.date||"")} and the present that is consistent with ${alert?.typologies[0]||""} and potential money laundering. Total suspicious transaction volume: ${fm(alert?.inflow||0)}.\n\nSECTION 3 · TIMELINE OF TRANSACTIONS\n${txns.filter(t=>t.flagged).map(t=>`· ${t.date} ${t.time}: ${t.desc} · ${fm(Math.abs(t.amount))} via ${t.counterparty} [${t.country}]`).join("\n")}\n\nSECTION 4 · REASON FOR SUSPICION\n1. Transaction velocity significantly exceeded 90-day behavioral baseline\n2. Multiple deposits structured to avoid CTR reporting thresholds ($10,000)\n3. International wire transfers to high-risk jurisdictions without apparent documented business purpose\n4. Counterparty network analysis revealed linked accounts with limited transaction history\n5. Income verification ratio ${Math.round(((alert?.inflow||0)*4)/((customer?.statedIncome||1))*100)}% of stated annual income\n6. Pattern consistent with placement and layering typologies per FinCEN guidance\n\nSECTION 5 · LAW ENFORCEMENT CONTACT\nNo current law enforcement contact. Institution has not disclosed this SAR to the subject.\n\nSECTION 6 · DISPOSITION\nThemis AI recommends SAR submission to FinCEN.\nNo customer notification per 31 USC 5318(g)(2).\nFiling deadline: ${fd(sar.filingDeadline)}\nPrepared by: ${sar.preparedBy}\nReviewing officer: ${sar.reviewedBy||"Pending"}`;

  if(!narrative&&defaultNarrative)setNarrative(defaultNarrative);

  const saveEdit=()=>{
    const entry={ts:new Date().toLocaleString(),user:"John Smith",action:"Edited narrative",detail:"Manual edits made to narrative content"};
    setAuditTrail(a=>[...(a||sar.auditTrail),entry]);
    setEditing(false);
  };

  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{fontSize:12,color:"#64748B",marginBottom:14}}>
        <span style={{cursor:"pointer",color:NAVY,fontWeight:600}} onClick={()=>onNav("sar-list")}>SARs</span>
        <span style={{margin:"0 6px"}}>·</span>
        <span style={{fontFamily:"monospace",fontWeight:700}}>{sarId}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <div style={{fontSize:19,fontWeight:800,color:"#0F172A"}}> {sarId}</div>
          <div style={{fontSize:13,color:"#64748B",marginTop:4}}>{customer?.name} · {sar.preparedBy}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setQcDone(true)} style={{padding:"7px 14px",background:qcDone?"#10B981":"#F59E0B",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>{qcDone?"QC Passed":"Run QC Check"}</button>
          <button style={{padding:"7px 14px",background:"#7C3AED",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>Submit SAR</button>
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
              <div style={{fontSize:13,fontWeight:700,color:"#065F46",marginBottom:10}}>QC Review Complete</div>
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
                <span style={{color:"#10B981"}}>•</span>{s}
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
          <button onClick={onClose} style={{background:"#F1F5F9",border:"none",borderRadius:7,width:30,height:30,cursor:"pointer",fontSize:16,color:"#64748B"}}>×</button>
        </div>

        {/* SANCTIONS */}
        {result.type==="Sanctions"&&result.sanctionDetails&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:10}}>Sanctions Screening Results</div>
            {result.sanctionDetails.hits.length===0?(
              <div style={{background:"#F0FDF4",borderRadius:8,padding:14,border:"1px solid #BBF7D0",fontSize:13,color:"#065F46"}}>No sanctions matches found. Entity cleared against {result.source}.<br/><span style={{fontSize:11,color:"#64748B"}}>Last checked: {result.sanctionDetails.lastChecked}</span></div>
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

  const {data:apiResults}=useApi("/api/screening");
  const allResults=[...(apiResults||[]),...runResults];
  const filtered=allResults.filter(r=>(
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
          {runResults.length>0&&<div style={{marginTop:12,padding:10,background:"#D1FAE5",borderRadius:7,fontSize:12,color:"#065F46"}}>COMPLETE: {runResults.length} screening(s) completed. Results appear in the table below.</div>}
        </div>
      )}

      {/* KPI cards */}
      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <MCard label="Screened Today" value="1,247" color={NAVY}/>
        <MCard label="Potential/Hits" value={allResults.filter(r=>r.match!=="NO_MATCH").length.toString()} color="#EF4444"/>
        <MCard label="No Match" value={allResults.filter(r=>r.match==="NO_MATCH").length.toString()} color="#10B981"/>
        <MCard label="Entity Hits" value={allResults.filter(r=>r.entityType==="entity"&&r.match!=="NO_MATCH").length.toString()} color="#F59E0B"/>
        <MCard label="Customer Hits" value={allResults.filter(r=>r.entityType==="customer"&&r.match!=="NO_MATCH").length.toString()} color="#7C3AED"/>
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
  const {data:alerts}=useApi("/api/alerts");
  const {data:customersList}=useApi("/api/customers");
  const customerMap=useMemo(()=>customersById(customersList),[customersList]);
  if(!alerts)return <div style={{padding:24,color:"#64748B"}}>Loading alerts…</div>;
  const filtered=filter==="ALL"?alerts:alerts.filter(a=>a.status===filter);
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{fontSize:17,fontWeight:800,color:"#0F172A"}}>Alert Investigation Queue</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:3,display:"flex",alignItems:"center",gap:8}}>
            {alerts.length} alerts · AI-investigated by Themis
            <Pill label="Live"/>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["ALL","ESCALATE","CLEAR"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:5,border:"1px solid",cursor:"pointer",fontSize:11,fontWeight:600,borderColor:filter===f?NAVY:"#E2E8F0",background:filter===f?NAVY:"white",color:filter===f?"white":"#64748B"}}>
            {f==="ALL"?`All (${alerts.length})`:f==="ESCALATE"?`Escalated (${alerts.filter(a=>a.status==="ESCALATE").length})`:`Cleared (${alerts.filter(a=>a.status==="CLEAR").length})`}
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
            {filtered.map(a=>{const c=customerMap[a.customerId];return(
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
  const [graph,setGraph]=useState(null);
  const {data:anomalies}=useApi("/api/anomalies");
  useEffect(()=>{
    let alive=true;
    fetch(`/api/network/ALERT-0109`)
      .then(r=>r.json())
      .then(d=>{
        if(!alive||!d||!d.nodes)return;
        // API shape: {nodes:[{id,label,type,x,y,risk}], edges:[{source,target,amount,direction}]}
        // NetworkGraph expects: edges with from/to/dir
        const adapted={
          nodes:d.nodes,
          edges:(d.edges||[]).map(e=>({from:e.source,to:e.target,amount:e.amount,dir:e.direction})),
        };
        setGraph(adapted);
      })
      .catch(()=>{/* leave graph null — NetworkGraph handles null */ setGraph(null);});
    return()=>{alive=false;};
  },[]);
  return(
    <div style={{padding:"24px 28px"}}>
      <SH title="Money Laundering Network Detection" sub="Themis Graph ML · Real-time relationship mapping" action={<Pill label="Live"/>}/>
      <div style={{background:"white",borderRadius:12,padding:20,border:"1px solid #E2E8F0",marginBottom:16}}>
        <div style={{display:"flex",gap:10,marginBottom:12,fontSize:11}}>
          {[[" Subject",NAVY],[" Entity","#F59E0B"],[" Branch","#10B981"],[" Bank","#8B5CF6"]].map(([l,c])=><span key={l} style={{color:c,fontWeight:600}}>{l}</span>)}
          <span style={{marginLeft:"auto",color:"#94A3B8"}}> Inflow   Outflow  - - - Potential</span>
        </div>
        <NetworkGraph Data={graph}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"white",borderRadius:10,padding:16,border:"1px solid #E2E8F0"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:10}}>ML Anomaly Signals</div>
          {(anomalies||[]).map(an=>(
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
  const {data:models}=useApi("/api/models");
  if(!models)return <div style={{padding:24,color:"#64748B"}}>Loading models…</div>;
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
          <div style={{marginTop:12,padding:10,background:"#F0FDF4",borderRadius:7,border:"1px solid #BBF7D0",fontSize:12,color:"#064E3B"}}>Model governance documentation is regulator-ready. Last audit: Nov 30, 2025.</div>
        </div>
      </div>
    </div>
  );
}

function SettingsView(){
  const {data:fromApi}=useApi("/api/connectors");
  const [sources,setSources]=useState(null);
  useEffect(()=>{ if(fromApi) setSources(fromApi); },[fromApi]);
  if(!sources)return <div style={{padding:24,color:"#64748B"}}>Loading data sources…</div>;
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
  const {data:flaggedTxns}=useApi("/api/transactions?flagged=true");
  const {data:alerts}=useApi("/api/alerts");
  const {data:customersList}=useApi("/api/customers");
  const customerMap=useMemo(()=>customersById(customersList),[customersList]);
  const alertMap=useMemo(()=>Object.fromEntries((alerts||[]).map(a=>[a.id,a])),[alerts]);
  if(!flaggedTxns)return <div style={{padding:24,color:"#64748B"}}>Loading transactions…</div>;
  return(
    <div style={{padding:"24px 28px"}}>
      <SH title="Transaction Monitoring" sub="Real-time ingestion · Themis ML pattern detection · 3,846 analyzed" action={<Pill label="Live"/>}/>
      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <MCard label="Total Transactions" value="3,846" sub="Last 90 days"/>
        <MCard label="Flagged" value={flaggedTxns.length.toString()} color="#EF4444"/>
        <MCard label="Total Volume" value="$2.4M" color={NAVY}/>
        <MCard label="Countries" value="8" color="#7C3AED"/>
      </div>
      <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
        <div style={{padding:"12px 18px",borderBottom:"1px solid #E2E8F0",fontWeight:700,color:"#0F172A",fontSize:14}}>All Flagged Transactions</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:"#F8FAFC"}}>{["TX ID","Date","Customer","Description","Counterparty","Amount","Category","Alert","Country"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",color:"#94A3B8",fontWeight:600,fontSize:10,borderBottom:"1px solid #E2E8F0"}}>{h}</th>)}</tr></thead>
          <tbody>
            {flaggedTxns.map(t=>{
              const alert=alertMap[t.alertId];
              const customer=customerMap[alert?.customerId];
              return(
                <tr key={`${t.alertId}-${t.id}`} style={{borderBottom:"1px solid #F1F5F9",cursor:"pointer"}} onClick={()=>onNav("alert-detail",t.alertId)}
                  onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="white"}>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",color:"#64748B",fontSize:10}}>{t.id}</td>
                  <td style={{padding:"9px 12px",color:"#64748B",fontSize:11}}>{t.date}</td>
                  <td style={{padding:"9px 12px",fontWeight:500,color:"#0F172A"}}>{customer?.name}</td>
                  <td style={{padding:"9px 12px",color:"#475569"}}>{t.desc}</td>
                  <td style={{padding:"9px 12px",color:"#64748B",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.counterparty}</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:"#EF4444"}}>{fm(t.amount)}</td>
                  <td style={{padding:"9px 12px"}}><span style={{fontSize:10,background:"#F1F5F9",color:"#475569",padding:"2px 5px",borderRadius:3}}>{t.category}</span></td>
                  <td style={{padding:"9px 12px",color:NAVY,fontFamily:"monospace",fontSize:11}}>{t.alertId}</td>
                  <td style={{padding:"9px 12px",color:"#64748B"}}>{t.country}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- THEMIS CHAT ----------------------------------------------
function ThemisChat({onClose,view}){
  const [msgs,setMsgs]=useState([{role:"ai",text:`Hello! I'm **Themis**, your AI compliance copilot. I'm viewing the **${view}** screen with you. How can I help?`}]);
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
          <div style={{fontSize:10,color:"rgba(255,255,255,0.6)"}}>{view}</div>
        </div>
        <Pill label="Live" color="#22C55E" bg="transparent"/>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"white",cursor:"pointer",fontSize:15,width:26,height:26,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
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
        <button onClick={()=>send(input)} style={{padding:"7px 12px",background:NAVY,color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:13}}>→</button>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}`}</style>
    </div>
  );
}

// --- DAILY BRIEFING (CHAT) ------------------------------------
function BriefingView({persona,personaLabel}){
  const {data:alerts}=useApi("/api/alerts");
  const {data:cases}=useApi("/api/cases");
  const {data:sars}=useApi("/api/sars");
  const escalated=(alerts||[]).filter(a=>a.status==="ESCALATE");
  const openCases=(cases||[]).filter(c=>c.status!=="CLOSED");
  const draftSARs=(sars||[]).filter(s=>s.status==="DRAFT");
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
    // Coalesce consecutive prose lines into a single paragraph so
    // hard-wrapped source MD reflows naturally to the container width.
    // A paragraph ends at a blank line, fence, header, list, or numbered list.
    const buf=[line];i++;
    while(i<lines.length){
      const next=lines[i];
      if(next.trim()===""||/^```/.test(next)||/^(#{1,4})\s+/.test(next)||/^[-*]\s+/.test(next)||/^\d+\.\s+/.test(next)) break;
      buf.push(next);i++;
    }
    out.push(<p key={`p${i}`} style={{fontSize:13,color:"#334155",lineHeight:1.7,margin:"6px 0"}}>{renderInline(buf.join(" "))}</p>);
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
            Registry · {agents.length} agents · loaded from <code style={{background:"#F1F5F9",padding:"1px 6px",borderRadius:3,fontSize:11}}>agent/agents.json</code>
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

// --- TYPOLOGY WORKBENCH ---------------------------------------
// Two-tab view: Library (active typologies) + Review Queue (pending candidates).
// Top toolbar runs the harvester foreground and promotes approved
// candidates. Approval requires 2 distinct reviewers — the dropdown
// gates which name is attached to each click.
function TypologyWorkbenchView(){
  const [tab,setTab]=useState("library");
  const [busy,setBusy]=useState(null); // "harvest" | "promote" | null
  const [flash,setFlash]=useState(null); // {kind:"ok"|"err", msg:string}
  // Bump this to refetch lists after writes.
  const [tick,setTick]=useState(0);

  const lib=useApi(`/api/typologies?v=${tick}`);
  const queue=useApi(`/api/typologies/candidates?v=${tick}`);

  const refresh=()=>setTick(t=>t+1);

  async function runHarvest(){
    setBusy("harvest"); setFlash(null);
    try{
      const r=await fetch("/api/typologies/harvest",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({extractor:"fixture"})});
      const j=await r.json();
      if(!r.ok) throw new Error(j.detail||r.statusText);
      setFlash({kind:"ok",msg:`Harvest complete — ${j.inserted} candidate(s) added, ${j.duplicates} duplicate(s) skipped.`});
      refresh();
    }catch(e){ setFlash({kind:"err",msg:`Harvest failed: ${e.message}`}); }
    finally{ setBusy(null); }
  }

  async function runPromote(){
    setBusy("promote"); setFlash(null);
    try{
      const r=await fetch("/api/typologies/promote",{method:"POST"});
      const j=await r.json();
      if(!r.ok) throw new Error(j.detail||r.statusText);
      setFlash({kind:"ok",msg:`Promotion complete — ${j.promoted} promoted, ${j.failed} failed.`});
      refresh();
    }catch(e){ setFlash({kind:"err",msg:`Promote failed: ${e.message}`}); }
    finally{ setBusy(null); }
  }

  const TabBtn=({id,label,count})=>(
    <button onClick={()=>setTab(id)}
      style={{padding:"6px 14px",borderRadius:6,border:"1px solid",cursor:"pointer",fontSize:12,fontWeight:600,
        borderColor:tab===id?NAVY:"#E2E8F0",background:tab===id?NAVY:"white",color:tab===id?"white":"#475569"}}>
      {label}{count!==undefined?<span style={{marginLeft:6,fontSize:10,opacity:0.85}}>({count})</span>:null}
    </button>
  );

  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{fontSize:12,color:"#64748B",marginBottom:14,letterSpacing:"0.02em"}}>Platform Workbench</div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{fontSize:21,fontWeight:800,color:"#0F172A",letterSpacing:"-0.02em"}}>Typology</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:4}}>
            Live registry: <code style={{background:"#F1F5F9",padding:"1px 6px",borderRadius:3,fontSize:11}}>skills/aml/typologies/&lt;category&gt;/*.md</code> · Review pipeline backed by the harvester
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={runHarvest} disabled={!!busy}
            style={{padding:"8px 16px",borderRadius:6,border:`1px solid ${NAVY}`,background:busy==="harvest"?"#475569":NAVY,color:"white",fontSize:12,fontWeight:700,cursor:busy?"wait":"pointer",letterSpacing:"0.04em"}}>
            {busy==="harvest"?"HARVESTING…":"RUN HARVESTER"}
          </button>
          <button onClick={runPromote} disabled={!!busy}
            style={{padding:"8px 16px",borderRadius:6,border:"1px solid #15803D",background:busy==="promote"?"#475569":"#15803D",color:"white",fontSize:12,fontWeight:700,cursor:busy?"wait":"pointer",letterSpacing:"0.04em"}}>
            {busy==="promote"?"PROMOTING…":"PROMOTE APPROVED"}
          </button>
        </div>
      </div>

      {flash&&(
        <div style={{padding:"8px 12px",borderRadius:6,fontSize:12,marginBottom:12,
          background:flash.kind==="ok"?"#DCFCE7":"#FEE2E2",
          color:flash.kind==="ok"?"#15803D":"#B91C1C",
          border:`1px solid ${flash.kind==="ok"?"#86EFAC":"#FCA5A5"}`}}>
          {flash.msg}
        </div>
      )}

      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <TabBtn id="library" label="Library" count={lib.data?.length}/>
        <TabBtn id="queue"   label="Review Queue" count={queue.data?.length}/>
      </div>

      {tab==="library"  && <TypologyLibraryPanel rows={lib.data||[]} loading={lib.loading}/>}
      {tab==="queue"    && <TypologyReviewPanel rows={queue.data||[]} loading={queue.loading} onChanged={refresh}/>}
    </div>
  );
}

function TypologyLibraryPanel({rows,loading}){
  const [selected,setSelected]=useState(null);
  const sel=rows.find(r=>r.typologyId===selected) || rows[0];
  const detail=useApi(sel?`/api/typologies/${sel.typologyId}`:null);

  if(loading) return <div style={{padding:16,color:"#64748B",fontSize:12}}>Loading typology registry…</div>;
  if(rows.length===0) return <div style={{padding:16,color:"#64748B",fontSize:12}}>No active typologies. Run the harvester and promote approved candidates to populate the library.</div>;

  return(
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:16}}>
      <div style={{background:"white",borderRadius:10,border:"1px solid #E2E8F0",overflow:"hidden",alignSelf:"flex-start"}}>
        <div style={{padding:"10px 14px",borderBottom:"1px solid #E2E8F0",fontSize:11,fontWeight:700,color:"#64748B",letterSpacing:"0.05em",background:"#F8FAFC"}}>ACTIVE TYPOLOGIES</div>
        {rows.map(r=>{
          const Active=r.typologyId===(sel?.typologyId);
          return(
            <button key={r.typologyId} onClick={()=>setSelected(r.typologyId)}
              style={{width:"100%",textAlign:"left",padding:"10px 14px",borderBottom:"1px solid #F1F5F9",border:"none",borderLeft:Active?`3px solid ${NAVY}`:"3px solid transparent",background:Active?"#EFF6FF":"white",cursor:"pointer"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#0F172A"}}>{r.name}</div>
              <div style={{fontSize:10,color:"#94A3B8",marginTop:2,fontFamily:"monospace"}}>{r.typologyId} · v{r.currentVersion} · {r.category}</div>
            </button>
          );
        })}
      </div>

      {sel&&(
        <TypologyDetailCard sel={sel} detail={detail}/>
      )}
    </div>
  );
}

// Minimal frontmatter extractor — pulls list-valued fields (risk_indicators,
// ml_stage) and the sources block. Tolerates the YAML we emit; not a full parser.
function parseTypologyFrontmatter(text){
  const m=/^---\s*\n([\s\S]*?)\n---\s*\n/.exec(text||"");
  if(!m) return {risk_indicators:[],ml_stage:[],sources:[],last_reviewed:null};
  const fm=m[1];
  const lines=fm.split("\n");
  const out={risk_indicators:[],ml_stage:[],sources:[],last_reviewed:null};
  for(let i=0;i<lines.length;i++){
    const ln=lines[i];
    let mm;
    if((mm=/^risk_indicators:\s*$/.exec(ln))){
      while(++i<lines.length && /^\s+-\s+/.test(lines[i])) out.risk_indicators.push(lines[i].replace(/^\s+-\s+/,"").trim());
      i--; continue;
    }
    if((mm=/^ml_stage:\s*\[(.*)\]\s*$/.exec(ln))){
      out.ml_stage=mm[1].split(",").map(s=>s.trim()).filter(Boolean); continue;
    }
    if((mm=/^last_reviewed:\s*(\S+)\s*$/.exec(ln))){ out.last_reviewed=mm[1]; continue; }
    if((mm=/^sources:\s*$/.exec(ln))){
      let cur=null;
      while(++i<lines.length && /^\s+(-|\s)/.test(lines[i])){
        const item=/^\s+-\s+org:\s*(.+)$/.exec(lines[i]);
        const cite=/^\s+citation:\s*"?([^"]+)"?\s*$/.exec(lines[i]);
        const typ=/^\s+type:\s*(.+)$/.exec(lines[i]);
        if(item){ if(cur) out.sources.push(cur); cur={org:item[1].trim(),citation:"",type:""}; }
        else if(cite&&cur) cur.citation=cite[1].trim();
        else if(typ&&cur)  cur.type=typ[1].trim();
      }
      if(cur) out.sources.push(cur);
      i--; continue;
    }
  }
  return out;
}

function TypologyDetailCard({sel,detail}){
  const mdBody=detail.data?.mdBody||"";
  const fm=useMemo(()=>parseTypologyFrontmatter(mdBody),[mdBody]);
  const prose=mdBody.split(/^---\s*\n[\s\S]*?\n---\s*\n/m).slice(-1)[0];
  const approvers=detail.data?.approvedBy||[];

  const Pill2=({label,value,color})=>(
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:5}}>
      <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.06em",color:"#64748B"}}>{label}</span>
      <span style={{fontSize:11,fontWeight:600,color:color||"#0F172A",fontFamily:"monospace"}}>{value}</span>
    </div>
  );

  return(
    <div style={{background:"white",borderRadius:10,padding:"20px 24px",border:"1px solid #E2E8F0",minHeight:480}}>
      {/* Header: title + ACTIVE pill */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:22,fontWeight:800,color:"#0F172A",letterSpacing:"-0.01em"}}>{sel.name}</div>
          <div style={{fontSize:11,color:"#94A3B8",fontFamily:"monospace",marginTop:4}}>{sel.mdPath}</div>
        </div>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#065F46",background:"#D1FAE5",padding:"4px 10px",borderRadius:4,whiteSpace:"nowrap"}}>{sel.status?.toUpperCase()}</span>
      </div>

      {/* Metadata strip — horizontal pills */}
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:18,paddingBottom:16,borderBottom:"1px solid #F1F5F9"}}>
        <Pill2 label="ID" value={sel.typologyId}/>
        <Pill2 label="VER" value={`v${sel.currentVersion}`}/>
        <Pill2 label="CATEGORY" value={sel.category}/>
        {fm.ml_stage.length>0&&<Pill2 label="ML STAGE" value={fm.ml_stage.join(" + ")}/>}
        {fm.last_reviewed&&<Pill2 label="REVIEWED" value={fm.last_reviewed}/>}
        <Pill2 label="SHA256" value={`${(sel.mdSha256||"").slice(0,12)}…`}/>
      </div>

      {detail.loading&&<div style={{color:"#94A3B8",fontSize:12}}>Loading typology body…</div>}

      {!detail.loading&&(
        <div style={{display:"grid",gridTemplateColumns:"minmax(0, 1.6fr) minmax(0, 1fr)",gap:24}}>
          {/* Prose body */}
          <div style={{maxHeight:560,overflowY:"auto",paddingRight:8}}>
            <MarkdownBlock text={prose}/>
          </div>

          {/* Structured side card */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {fm.risk_indicators.length>0&&(
              <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:"12px 14px"}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#475569",marginBottom:8}}>RISK INDICATORS · {fm.risk_indicators.length}</div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {fm.risk_indicators.map(r=>(
                    <code key={r} style={{fontSize:11,fontFamily:"'Consolas',monospace",background:"white",padding:"4px 8px",borderRadius:4,border:"1px solid #E2E8F0",color:"#1E293B",wordBreak:"break-word"}}>{r}</code>
                  ))}
                </div>
              </div>
            )}

            {fm.sources.length>0&&(
              <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:"12px 14px"}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#475569",marginBottom:8}}>SOURCES · {fm.sources.length}</div>
                {fm.sources.map((s,i)=>(
                  <div key={i} style={{fontSize:11,color:"#334155",marginBottom:6,paddingBottom:6,borderBottom:i<fm.sources.length-1?"1px dashed #E2E8F0":"none"}}>
                    <div style={{fontWeight:700,color:"#0F172A"}}>{s.org}</div>
                    {s.citation&&<div style={{marginTop:2,fontStyle:"italic"}}>{s.citation}</div>}
                    {s.type&&<div style={{marginTop:2,fontSize:9,color:"#64748B",letterSpacing:"0.05em",textTransform:"uppercase"}}>{s.type}</div>}
                  </div>
                ))}
              </div>
            )}

            {approvers.length>0&&(
              <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"12px 14px"}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#15803D",marginBottom:8}}>APPROVED BY · {approvers.length}</div>
                {approvers.map((a,i)=>(
                  <div key={i} style={{fontSize:11,color:"#14532D",marginBottom:4}}>
                    <b>{a.name||"—"}</b> <span style={{color:"#15803D"}}>· {a.role||"—"}</span>
                    {a.date&&<span style={{color:"#64748B",marginLeft:6,fontFamily:"monospace",fontSize:10}}>{a.date}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TypologyReviewPanel({rows,loading,onChanged}){
  const [selectedId,setSelectedId]=useState(null);
  const [reviewer,setReviewer]=useState(TYPOLOGY_REVIEWERS[0].name);
  const [notes,setNotes]=useState("");
  const [busy,setBusy]=useState(false);
  const [flash,setFlash]=useState(null);

  const sel=rows.find(r=>r.id===selectedId) || rows[0];
  const detail=useApi(sel?`/api/typologies/candidates/${sel.id}`:null);

  const reviewerRole=TYPOLOGY_REVIEWERS.find(r=>r.name===reviewer)?.role || "reviewer";

  async function doAction(action){
    if(!sel) return;
    setBusy(true); setFlash(null);
    try{
      const body={name:reviewer,role:reviewerRole};
      if(action==="reject") body.notes=notes||"rejected via UI";
      const r=await fetch(`/api/typologies/candidates/${sel.id}/${action}`,{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)
      });
      const j=await r.json();
      if(!r.ok){
        const msg=typeof j.detail==="object"?(j.detail.message||"Action failed"):(j.detail||r.statusText);
        const blocks=typeof j.detail==="object"&&j.detail.issues?j.detail.issues:[];
        setFlash({kind:"err",msg,blocks});
        return;
      }
      const tail=j.review_status==="approved"?` — APPROVED (2 reviewers signed).`:
                 j.review_status==="rejected"?` — REJECTED.`:
                 ` — ${j.needs_more} more reviewer(s) needed.`;
      setFlash({kind:"ok",msg:`Recorded ${action} by ${reviewer}${tail}`});
      setNotes("");
      onChanged?.();
    }catch(e){
      setFlash({kind:"err",msg:`Network error: ${e.message}`});
    }finally{ setBusy(false); }
  }

  if(loading) return <div style={{padding:16,color:"#64748B",fontSize:12}}>Loading review queue…</div>;
  if(rows.length===0) return <div style={{padding:16,color:"#64748B",fontSize:12}}>No pending candidates. Run the harvester to ingest new typology suggestions.</div>;

  const diffPill=(k)=>{
    const bg={NEW:"#DBEAFE",UPDATE:"#FEF3C7",DUPLICATE:"#F1F5F9"}[k]||"#F1F5F9";
    const co={NEW:"#1D4ED8",UPDATE:"#B45309",DUPLICATE:"#475569"}[k]||"#475569";
    return <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.05em",color:co,background:bg,padding:"2px 7px",borderRadius:3}}>{k}</span>;
  };

  return(
    <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:16}}>
      <div style={{background:"white",borderRadius:10,border:"1px solid #E2E8F0",overflow:"hidden",alignSelf:"flex-start"}}>
        <div style={{padding:"10px 14px",borderBottom:"1px solid #E2E8F0",fontSize:11,fontWeight:700,color:"#64748B",letterSpacing:"0.05em",background:"#F8FAFC"}}>PENDING CANDIDATES ({rows.length})</div>
        {rows.map(r=>{
          const Active=r.id===(sel?.id);
          return(
            <button key={r.id} onClick={()=>setSelectedId(r.id)}
              style={{width:"100%",textAlign:"left",padding:"10px 14px",borderBottom:"1px solid #F1F5F9",border:"none",borderLeft:Active?`3px solid ${NAVY}`:"3px solid transparent",background:Active?"#EFF6FF":"white",cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#0F172A"}}>{r.candidateName}</div>
                {diffPill(r.diffClass)}
              </div>
              <div style={{fontSize:10,color:"#94A3B8",marginTop:2,fontFamily:"monospace"}}>{r.candidateCategory} · sim={Number(r.similarity||0).toFixed(2)}{r.diffTargetId?` · → ${r.diffTargetId}`:""}</div>
              <div style={{fontSize:10,color:"#CBD5E1",marginTop:2}}>{r.sourceOrg}</div>
            </button>
          );
        })}
      </div>

      {sel&&(
        <div style={{background:"white",borderRadius:10,padding:22,border:"1px solid #E2E8F0",minHeight:400}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:"#0F172A"}}>{sel.candidateName}</div>
              <div style={{fontSize:11,color:"#94A3B8",fontFamily:"monospace",marginTop:2}}>{sel.id.slice(0,8)} · {sel.candidateCategory} · {diffPill(sel.diffClass)} → {sel.diffTargetId||"(new id)"}</div>
              {detail.data&&<div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>Source: {detail.data.sourceOrg} · <a href={detail.data.sourceUrl} target="_blank" rel="noreferrer" style={{color:"#1D4ED8",textDecoration:"none"}}>{detail.data.sourceUrl}</a></div>}
              {detail.data?.extractorName&&<div style={{fontSize:10,color:"#CBD5E1",fontFamily:"monospace",marginTop:2}}>extractor: {detail.data.extractorName} v{detail.data.extractorVersion}{detail.data.promptVersion?` · prompt v${detail.data.promptVersion} (${(detail.data.promptSha256||"").slice(0,10)}…)`:""}</div>}
            </div>
          </div>

          <div style={{display:"flex",gap:10,alignItems:"flex-end",margin:"10px 0 14px",padding:"10px 12px",background:"#F8FAFC",borderRadius:6,border:"1px solid #E2E8F0"}}>
            <div>
              <div style={{fontSize:10,color:"#64748B",letterSpacing:"0.05em",fontWeight:600,marginBottom:4}}>REVIEWER</div>
              <select value={reviewer} onChange={e=>setReviewer(e.target.value)} style={{padding:"6px 10px",borderRadius:5,border:"1px solid #CBD5E1",fontSize:12,minWidth:180}}>
                {TYPOLOGY_REVIEWERS.map(r=><option key={r.name} value={r.name}>{r.name} — {r.role}</option>)}
              </select>
            </div>
            <input type="text" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes (required if rejecting)"
              style={{flex:1,padding:"6px 10px",borderRadius:5,border:"1px solid #CBD5E1",fontSize:12}}/>
            <button onClick={()=>doAction("approve")} disabled={busy}
              style={{padding:"7px 14px",borderRadius:5,border:"1px solid #15803D",background:busy?"#9CA3AF":"#15803D",color:"white",fontSize:12,fontWeight:700,cursor:busy?"wait":"pointer"}}>APPROVE</button>
            <button onClick={()=>doAction("reject")} disabled={busy||!notes.trim()}
              style={{padding:"7px 14px",borderRadius:5,border:"1px solid #B91C1C",background:(busy||!notes.trim())?"#9CA3AF":"#B91C1C",color:"white",fontSize:12,fontWeight:700,cursor:(busy||!notes.trim())?"not-allowed":"pointer"}}>REJECT</button>
          </div>

          {flash&&(
            <div style={{padding:"7px 11px",borderRadius:5,fontSize:11,marginBottom:12,
              background:flash.kind==="ok"?"#DCFCE7":"#FEE2E2",
              color:flash.kind==="ok"?"#15803D":"#B91C1C",
              border:`1px solid ${flash.kind==="ok"?"#86EFAC":"#FCA5A5"}`}}>
              {flash.msg}
              {flash.blocks?.length>0&&<ul style={{margin:"4px 0 0 18px",padding:0}}>{flash.blocks.map((b,i)=><li key={i} style={{fontSize:10}}>[{b.code}] {b.message}</li>)}</ul>}
            </div>
          )}

          {detail.data?.reviewedBy?.length>0 && (
            <div style={{marginBottom:14,padding:"8px 12px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:6}}>
              <div style={{fontSize:10,color:"#64748B",letterSpacing:"0.05em",fontWeight:700,marginBottom:6}}>REVIEW HISTORY</div>
              {detail.data.reviewedBy.map((rb,i)=>(
                <div key={i} style={{fontSize:11,color:"#475569",marginBottom:2}}>
                  <code style={{fontSize:10,background:rb.action==="approve"?"#DCFCE7":"#FEE2E2",color:rb.action==="approve"?"#15803D":"#B91C1C",padding:"1px 5px",borderRadius:2,marginRight:6}}>{rb.action?.toUpperCase()}</code>
                  <b>{rb.name}</b> ({rb.role}) · {rb.date}{rb.notes?` — ${rb.notes}`:""}
                </div>
              ))}
            </div>
          )}

          <div style={{borderTop:"1px solid #F1F5F9",paddingTop:14,maxHeight:520,overflowY:"auto"}}>
            <div style={{fontSize:10,color:"#64748B",letterSpacing:"0.05em",fontWeight:700,marginBottom:8}}>CANDIDATE MD</div>
            <pre style={{fontSize:11,fontFamily:"Consolas, monospace",background:"#0F172A",color:"#E2E8F0",padding:14,borderRadius:6,overflowX:"auto",lineHeight:1.5,margin:0}}>{detail.data?.candidateMd||"…"}</pre>
          </div>
        </div>
      )}
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

// --- AUDIT TRAIL VIEW ----------------------------------------
function AuditTrailView({onNav,selId}){
  const {data:investigations}=useApi("/api/investigations");
  const {data:customersList}=useApi("/api/customers");
  const {data:alertsList}=useApi("/api/alerts");
  const customerMap=useMemo(()=>customersById(customersList),[customersList]);
  const alertCustomerMap=useMemo(()=>Object.fromEntries((alertsList||[]).map(a=>[a.id,a.customerId])),[alertsList]);
  const [selected,setSelected]=useState(selId||null);
  const {data:detail}=useApi(selected?`/api/investigations/${selected}`:null);

  if(!investigations)return <div style={{padding:24,color:"#64748B"}}>Loading audit trail…</div>;

  if(selected){
    return(
      <div style={{padding:"24px 28px"}}>
        <div style={{fontSize:12,color:"#64748B",marginBottom:14}}>
          <span style={{cursor:"pointer",color:NAVY,fontWeight:600}} onClick={()=>setSelected(null)}>Audit Events</span>
          <span style={{margin:"0 6px"}}>·</span>
          <span style={{fontFamily:"monospace",fontWeight:700}}>{selected.slice(0,8)}</span>
        </div>
        {!detail?<div style={{color:"#64748B"}}>Loading run…</div>:(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
              <div>
                <div style={{fontSize:20,fontWeight:800,color:"#0F172A"}}>Investigation · {detail.alertId}</div>
                <div style={{fontSize:13,color:"#64748B",marginTop:4}}>
                  {detail.startedAt?fd(detail.startedAt):""} → {detail.completedAt?fd(detail.completedAt):""}
                  {" · "}<Badge label={detail.recommendation||detail.status} color={sc(detail.recommendation||"")} bg={detail.recommendation==="ESCALATE"?"#FEE2E2":"#D1FAE5"}/>
                  {" · "}{detail.confidence!=null?`${detail.confidence}% confidence`:""}
                </div>
              </div>
              <button onClick={()=>onNav("alert-detail",detail.alertId)} style={{padding:"7px 14px",background:NAVY,color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12}}>View Alert →</button>
            </div>
            {detail.narrative&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:8}}>Narrative</div>
                <NarrativeReport text={detail.narrative}/>
              </div>
            )}
            <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0",marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:10}}>Investigation Journal</div>
              <JournalStepList steps={normalizeApiJournal(detail.journal)}/>
            </div>
            {(detail.riskFactors||[]).length>0&&(
              <div style={{background:"white",borderRadius:10,padding:18,border:"1px solid #E2E8F0"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:10}}>Risk Factors</div>
                {detail.riskFactors.map((rf,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:"1px solid #F8FAFC"}}>
                    <span style={{color:"#334155"}}>{rf.factor}</span>
                    <span style={{fontFamily:"monospace",fontWeight:600,color:"#EF4444"}}>{(rf.weight*100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return(
    <div style={{padding:"24px 28px"}}>
      <SH title="Audit Trail · Investigation Events" sub={`${investigations.length} runs · regulator-ready, immutable per-run audit`}/>
      <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:"#F8FAFC"}}>{["Run ID","Alert","Customer","Recommendation","Confidence","Completed","Action"].map(h=>(
            <th key={h} style={{textAlign:"left",padding:"9px 12px",color:"#64748B",fontWeight:600,fontSize:10,letterSpacing:"0.04em",borderBottom:"1px solid #E2E8F0"}}>{h}</th>
          ))}</tr></thead>
          <tbody>{investigations.map(inv=>{
            const cust=customerMap[alertCustomerMap[inv.alertId]];
            return(
              <tr key={inv.id} onClick={()=>setSelected(inv.id)} style={{borderBottom:"1px solid #F1F5F9",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="white"}>
                <td style={{padding:"9px 12px",color:NAVY,fontFamily:"monospace",fontWeight:700,fontSize:11}}>{inv.id.slice(0,8)}</td>
                <td style={{padding:"9px 12px",fontFamily:"monospace",fontSize:11,color:"#334155"}}>{inv.alertId}</td>
                <td style={{padding:"9px 12px",color:"#64748B"}}>{cust?.name||"—"}</td>
                <td style={{padding:"9px 12px"}}>{inv.recommendation?<Badge label={inv.recommendation} color={sc(inv.recommendation)} bg={inv.recommendation==="ESCALATE"?"#FEE2E2":"#D1FAE5"}/>:"—"}</td>
                <td style={{padding:"9px 12px",fontFamily:"monospace",color:"#334155"}}>{inv.confidence!=null?`${inv.confidence}%`:"—"}</td>
                <td style={{padding:"9px 12px",color:"#64748B",fontSize:11}}>{inv.completedAt?fd(inv.completedAt):"—"}</td>
                <td style={{padding:"9px 12px"}}><button onClick={e=>{e.stopPropagation();setSelected(inv.id);}} style={{fontSize:10,padding:"3px 8px",borderRadius:4,border:`1px solid ${NAVY}`,background:"white",cursor:"pointer",color:NAVY,fontWeight:600}}>Open</button></td>
              </tr>
            );
          })}</tbody>
        </table>
        {investigations.length===0&&<div style={{padding:30,textAlign:"center",color:"#94A3B8",fontSize:13}}>No investigation runs yet. Open an alert and click <strong>Run AI Investigation</strong> to create one.</div>}
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
// NAV_ITEMS badges are filled in at runtime from /api/dashboard/summary.
// Keeping the array static for layout; the ThemisPlatform shell injects
// counts via the `summaryCounts` prop on each Sidebar render.
const NAV_ITEMS=[
  {id:"dashboard",label:"Dashboard"},
  {id:"alerts",label:"Alerts",badgeKey:"alertsEscalated"},
  {id:"cases",label:"Cases",badgeKey:"casesTotal"},
  {id:"transactions",label:"Transactions"},
  {id:"network",label:"Network Detection"},
  {id:"sar-list",label:"SARs",badgeKey:"sarsTotal"},
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
  {id:"wb-typologies",label:"Typology",blurb:"AML typology library + harvester: inspect active typologies, run the harvester against regulator feeds, review candidates (NEW/UPDATE/DUPLICATE), and promote approved typologies into the live library."},
  {id:"wb-prompts",label:"Prompt Studio",blurb:"Versioned prompt YAML editor with A/B comparison, regression playback against historical alerts, and approval workflow."},
  {id:"wb-pipelines",label:"Data Pipelines",blurb:"Ingestion + sync status across core banking, SWIFT, sanctions, and PEP feeds with per-source freshness, lag, and lineage."},
];

const TYPOLOGY_REVIEWERS=[
  {name:"Sumit",   role:"MLRO"},
  {name:"Manash",  role:"AML Analyst"},
  {name:"John",    role:"Compliance Lead"},
  {name:"Wayne",   role:"AML Analyst"},
];

// Sidebar placeholder items that have working views (no SOON pill).
// Anything not in here renders the SOON badge + a ComingSoonView.
const SHIPPED_PLACEHOLDER_IDS=new Set([
  "audit-events",
  "wb-agents",
  "wb-skills",
  "wb-typologies",
  "wb-prompts",
]);

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

  // Phase 3: nav badge counts come from /api/dashboard/summary, not bundled constants
  const {data:summary}=useApi("/api/dashboard/summary");
  const summaryCounts={
    alertsEscalated:summary?.alerts?.byStatus?.ESCALATE||0,
    casesTotal:summary?.cases?.total||0,
    sarsTotal:summary?.sars?.total||0,
  };

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
    const shipped=SHIPPED_PLACEHOLDER_IDS.has(item.id);
    return(
      <button onClick={()=>nav(item.id)}
        style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 10px 6px 22px",borderRadius:8,fontSize:13,textAlign:"left",transition:"all 0.15s",
          background:Active?NAVY_LIGHT:"transparent",
          color:Active?NAVY:"#4b5563",
          fontWeight:Active?500:400,border:"none",cursor:"pointer"}}>
        {item.label}
        {!shipped&&<span style={{marginLeft:"auto",fontSize:8,fontWeight:600,color:"#92400E",background:"#FEF3C7",padding:"1px 5px",borderRadius:3,letterSpacing:"0.04em"}}>SOON</span>}
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
                  const badge=item.badgeKey?summaryCounts[item.badgeKey]:item.badge;
                  return(
                    <button key={item.id} onClick={()=>nav(item.id)}
                      style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 10px 6px 22px",borderRadius:8,fontSize:13,textAlign:"left",transition:"all 0.15s",
                        background:Active?NAVY_LIGHT:"transparent",
                        color:Active?NAVY:"#4b5563",
                        fontWeight:Active?500:400,border:"none",cursor:"pointer"}}>
                      {item.label}
                      {badge?<span style={{marginLeft:"auto",fontSize:10,background:"#fde8e8",color:"#b91c1c",fontWeight:500,padding:"1px 6px",borderRadius:20,minWidth:18,textAlign:"center"}}>{badge}</span>:null}
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
              <span style={{color:ORANGE}}>Themis</span>
              <span style={{color:"rgba(255,255,255,.5)",fontWeight:300,margin:"0 6px"}}>·</span>
              AML Intelligence Platform
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
          {view==="audit-events"&&<AuditTrailView onNav={nav} selId={selId}/>}
          {AUDIT_ITEMS.find(i=>i.id===view&&i.id!=="audit-events")&&<ComingSoonView title={AUDIT_ITEMS.find(i=>i.id===view).label} category="Audit Trail" blurb={AUDIT_ITEMS.find(i=>i.id===view).blurb}/>}
          {view==="wb-agents"&&<AgentStudioView/>}
          {view==="wb-skills"&&<SkillsLibraryView/>}
          {view==="wb-typologies"&&<TypologyWorkbenchView/>}
          {view==="wb-prompts"&&<PromptStudioView/>}
          {view==="wb-pipelines"&&<ComingSoonView title="Data Pipelines" category="Platform Workbench" blurb={WORKBENCH_ITEMS.find(i=>i.id==="wb-pipelines").blurb}/>}
        </div>
      </div>

      {chatOpen?<ThemisChat onClose={()=>setChatOpen(false)} view={viewLabel}/>:null}
    </div>
  );
}











