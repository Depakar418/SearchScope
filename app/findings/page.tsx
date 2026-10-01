'use client';
import {useEffect,useState} from 'react';
import {ChevronDown,CircleAlert} from 'lucide-react';
import type {Report} from '../../lib/audit';
import {REPORT_TAB_KEY,scopedFindings,type ReportScope} from '../../lib/report-tabs';
import {FindingDetails} from '../report-panels';

export default function FindingsPage(){
  const [report,setReport]=useState<Report|null>(null);
  const [scope,setScope]=useState<ReportScope>('fix-first');
  const [ready,setReady]=useState(false);
  const [expanded,setExpanded]=useState<string|null>(null);
  const [allChecks,setAllChecks]=useState(false);
  useEffect(()=>{
    try{
      const query=new URLSearchParams(window.location.search);
      const requested=query.get('scope');
      if(requested==='SEO'||requested==='AEO'||requested==='GEO')setScope(requested);
      const raw=sessionStorage.getItem(REPORT_TAB_KEY+query.get('report'));
      if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed.checks)&&typeof parsed.label==='string')setReport(parsed);}
    }catch{}finally{setReady(true);}
  },[]);
  const title=scope==='fix-first'?'Fix first':`${scope} issues`;
  if(!ready)return <div className="standalone-report"><p role="status">Opening report…</p></div>;
  if(!report)return <div className="standalone-report"><h1>Report unavailable in this tab</h1><p>Return to your dashboard and use “Open report in new tab”. No new audit is required.</p><a href="/" className="secondary">Open dashboard</a></div>;
  const findings=scopedFindings(report,scope,allChecks);
  return <div className="standalone-report">
    <header className="standalone-heading"><div><span className="eyebrow">SEARCHSCOPE · PAGE REPORT</span><h1>{title}</h1><p className="standalone-url">{report.label}</p><p>Audited {new Date(report.date).toLocaleString()} · Existing audit snapshot; no new scan.</p></div><a className="secondary" href="/">Open dashboard</a></header>
    <section className="checks-panel"><div className="checks-toolbar"><div><h3>{findings.length} finding groups</h3></div>{scope!=='fix-first'&&<label className="standalone-filter"><input type="checkbox" checked={allChecks} onChange={e=>{setAllChecks(e.target.checked);setExpanded(null);}}/> Include passed and unavailable checks</label>}</div>
      {findings.map(c=><div className={'check check--'+c.severity} key={c.id}>
        <button className="check-row" aria-expanded={expanded===c.id} aria-controls={'detail-'+c.id} onClick={()=>setExpanded(expanded===c.id?null:c.id)}>
          <div className="check-name"><span className={'status-icon '+c.status}><CircleAlert size={17}/></span><div><strong>{c.name}</strong><small>{c.evidence}</small><span className="row-priority">{c.priority} priority · {c.affectedCount} affected-element occurrences</span></div></div>
          <span className={'category-badge '+c.category.toLowerCase()}>{c.category}</span><span className={'status-badge '+c.severity}>{c.severity}</span><ChevronDown size={17} className={expanded===c.id?'rotated':''}/>
        </button>
        {expanded===c.id&&<div id={'detail-'+c.id}><FindingDetails finding={c} report={report}/></div>}
      </div>)}
      {!findings.length&&<div className="no-findings">No findings need attention in this category. Other areas may remain untested.</div>}
    </section><div className="disclaimer"><CircleAlert size={16}/><p>{report.notice}</p></div>
  </div>;
}
