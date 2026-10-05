'use client';
import {SourceSignalReport} from './source-signal-report';
import {useState} from 'react';
import {ArrowLeft,Check,ChevronDown,CircleAlert,Code,Download,FileText,Search} from 'lucide-react';
import type {Category,Check as Finding,Report} from '../lib/audit';
import {checkCounts} from '../lib/audit-result';
import {scopedFindings} from '../lib/report-tabs';
import {reportCSV,reportMarkdown,reportJSON} from '../lib/report-export';
import {FindingDetails} from './report-panels';
import {CategoryExplanation,PageDetail,ReportTabButton} from './page-detail';
import {LinkStatusReport} from './link-status-report';
import {ScoreGauge} from './score-gauge';

export const REPORT_MENU=['All issues','Fix first','SEO','AEO','GEO','Page details'] as const;
const categories:Category[]=['SEO','AEO','GEO'];
type ReportTab=typeof REPORT_MENU[number];
const statusLabels={error:'Error',warning:'Warning',opportunity:'Opportunity',pass:'Passed',unavailable:'Unavailable'};

function FindingList({report,findings,prefix}:{report:Report;findings:Finding[];prefix:string}){
  const [expanded,setExpanded]=useState<string|null>(null);
  return <div className="unified-finding-list">{findings.map(c=><div className={'check check--'+c.severity} key={c.id}>
    <button className="check-row" aria-expanded={expanded===c.id} aria-controls={prefix+'-'+c.id} onClick={()=>setExpanded(expanded===c.id?null:c.id)}>
      <div className="check-name"><span className={'status-icon '+c.status}>{c.status==='pass'?<Check size={17}/>:c.status==='na'?'—':<CircleAlert size={17}/>}</span><div><strong>{c.name}</strong><small>{c.evidence}</small><span className="row-priority">{c.priority} priority · {c.confidence==='heuristic'?'Contextual check':'Source observation'}</span></div></div>
      <span className={'category-badge '+c.category.toLowerCase()}>{c.category}</span><span className={'status-badge '+c.severity}>{statusLabels[c.severity]}</span><ChevronDown size={17} className={expanded===c.id?'rotated':''}/>
    </button>
    {expanded===c.id&&<div id={prefix+'-'+c.id}><FindingDetails finding={c} report={report}/></div>}
  </div>)}{!findings.length&&<div className="no-findings">No findings match this view.</div>}</div>;
}

type AuditRunContext={id:string;created:string;status:string;attempted:number;selected:number};
type AuditOption={id:string;created:string;status:string;selectedCount:number};
export default function AuditReport({report,onBack,projectName,projectSite,auditRun,availableRuns,onChangeAudit,onExportAudit}:{report:Report;onBack?:()=>void;projectName?:string;projectSite?:string;auditRun?:AuditRunContext;availableRuns?:AuditOption[];onChangeAudit?:(id:string)=>void;onExportAudit?:()=>void}){
  const [tab,setTab]=useState<ReportTab>('Fix first');
  const [filter,setFilter]=useState('Needs attention');
  const [search,setSearch]=useState('');
  const counts=checkCounts(report);
  const passed=counts.PASS;
  const attention=report.checks.filter(c=>['error','warning','opportunity'].includes(c.severity)).length;
  const projectURL=projectSite&&/^https?:\/\//i.test(projectSite)?projectSite:null;
  const pageURL=/^https?:\/\//i.test(report.label)?report.label:null;
  const siteURL=projectURL||pageURL;
  const auditOptions=availableRuns?.length?availableRuns:[];
  const selectableRuns=auditRun&&!auditOptions.some(r=>r.id===auditRun.id)?[{id:auditRun.id,created:auditRun.created,status:auditRun.status,selectedCount:auditRun.selected},...auditOptions]:auditOptions;
  const summaryCards=[{key:'error',label:'Errors',filter:'Errors',count:counts.FAIL},{key:'warning',label:'Warnings',filter:'Warnings',count:report.checks.filter(c=>c.severity==='warning').length},{key:'pass',label:'Passed',filter:'Passed',count:passed},{key:'all',label:'All checks',filter:'All checks',count:Object.values(counts).reduce((a,b)=>a+b,0)},{key:'attention',label:'Needs attention',filter:'Needs attention',count:attention}];
  function download(kind:'md'|'csv'|'json'){
    const data=kind==='md'?reportMarkdown(report):kind==='csv'?reportCSV(report):reportJSON(report);
    const url=URL.createObjectURL(new Blob([data],{type:kind==='json'?'application/json':kind==='md'?'text/markdown':'text/csv'}));
    const link=document.createElement('a');link.href=url;link.download='searchscope-audit.'+kind;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const matches=(c:Finding)=>(filter==='All checks'||filter==='Needs attention'&&['error','warning','opportunity'].includes(c.severity)||filter===statusLabels[c.severity]||filter==='Errors'&&c.severity==='error'||filter==='Warnings'&&c.severity==='warning')&&`${c.name} ${c.evidence} ${c.fix}`.toLowerCase().includes(search.toLowerCase());
  const fixFirst=scopedFindings(report,'fix-first').slice(0,5).filter(matches);
  function categoryCard(category:Category,showAction:boolean){
    const findings=scopedFindings(report,category,true).filter(matches);
    return <section className="unified-category-card" key={category}>
      <CategoryExplanation report={report} category={category} showAction={showAction}/>{category!=="SEO"&&<SourceSignalReport report={report} category={category}/>}{category==='SEO'&&<LinkStatusReport report={report}/>}
      <FindingList key={category+filter+search} report={report} findings={findings} prefix={'category-'+category}/>
    </section>;
  }
  function fixFirstCard(showAction:boolean){return <section className="unified-category-card"><div className="unified-card-heading"><div><h3>Fix first</h3><p>{fixFirst.length?`Start with these ${fixFirst.length} highest-priority findings.`:'No findings match the current filter.'}</p></div>{showAction&&<ReportTabButton report={report} scope="fix-first"/>}</div><FindingList key={'fix-'+filter+search} report={report} findings={fixFirst} prefix="priority"/></section>;}
  return <div className="results unified-report">
    <div className="audit-compact-header"><nav className="audit-breadcrumb" aria-label="Audit breadcrumb">{projectName&&<><span>{projectName}</span><span aria-hidden="true">/</span></>}<span>{projectName?'Audits':'Audit report'}</span>{onBack&&<button onClick={onBack}><ArrowLeft size={14}/> Website pages</button>}</nav><div className="report-heading"><div><div className="eyebrow">PAGE AUDIT {report.label.startsWith('Sample')&&<span className="sample-tag">SAMPLE DATA</span>}</div><h2>{projectName||report.title||report.label}</h2><p>{projectSite||report.label}</p></div><div className="export">{onExportAudit&&<button className="secondary" onClick={onExportAudit}><Download size={16}/> Export audit</button>}<button className="secondary" onClick={()=>download('md')}><FileText size={16}/> Full report</button><button className="secondary" onClick={()=>download('csv')}><Download size={16}/> CSV</button><button className="icon-button" aria-label="Export JSON" onClick={()=>download('json')}><Code size={18}/></button>{siteURL&&<a className="secondary audit-site-link" href={siteURL} target="_blank" rel="noreferrer">Open site ↗</a>}</div></div></div>
    <div className="audit-meta-bar"><p><strong>Audit:</strong> {new Date(auditRun?.created||report.date).toLocaleString()} {auditRun?<><span aria-hidden="true"> · </span><span className="audit-run-status">{auditRun.status}</span><span aria-hidden="true"> · </span><span>Audit coverage: {auditRun.attempted} of {auditRun.selected} pages attempted</span></>:<><span aria-hidden="true"> · </span><span>Page report</span></>}{projectSite&&report.label!==projectSite&&<><span aria-hidden="true"> · </span><span className="audit-page-identity">Page: {pageURL?<a href={pageURL} target="_blank" rel="noreferrer">{report.label}</a>:report.label}</span></>}</p>{onChangeAudit&&selectableRuns.length>1&&<label className="audit-run-select">Change audit<select aria-label="Change audit" value={auditRun?.id||''} onChange={e=>onChangeAudit(e.target.value)}><option value="" disabled>Select audit</option>{selectableRuns.map(r=><option key={r.id} value={r.id}>{new Date(r.created).toLocaleString()} · {r.status} · {r.selectedCount} selected</option>)}</select></label>}</div>
    <div className="score-grid">{categories.map(c=><div className="score-card" key={c}><div><span className="score-label">{c} checklist</span><div className="score-number">{report.scores[c]??'—'}{report.scores[c]!==null&&<small>/100</small>}</div><span className="audit-score-status">{report.scores[c]===null?'Not measured':report.scores[c]>=80?'Strong checklist result':report.scores[c]>=50?'Checklist needs review':'Low checklist result'}</span><p>{c==='SEO'?'Page fundamentals':c==='AEO'?'Answer structure':'Credibility signals'}</p></div><ScoreGauge score={report.scores[c]} category={c}/></div>)}<div className="score-card summary-card"><span className="score-label">Checks completed</span><div className="score-number">{counts.PASS+counts.FAIL+counts.REVIEW}<small>/{report.checks.length}</small></div><p>{passed} passed · {counts.REVIEW+counts.FAIL} need attention</p></div></div>
    <section className="unified-report-body"><div className="report-navigation"><div className="report-tabs" role="tablist" aria-label="Report sections">{REPORT_MENU.map(name=><button key={name} role="tab" aria-selected={tab===name} aria-controls="report-section" className={tab===name?'selected':''} onClick={()=>{setTab(name);setFilter('Needs attention');setSearch('');}}>{name}</button>)}</div>
        {tab!=='Page details'&&<div className="unified-controls"><div className="search-field"><Search size={16}/><input aria-label="Search findings" placeholder="Search findings" value={search} onChange={e=>setSearch(e.target.value)}/></div><select aria-label="Filter findings" value={filter} onChange={e=>setFilter(e.target.value)}>{['Needs attention','All checks','Errors','Warnings','Passed'].map(item=><option key={item}>{item}</option>)}</select></div>}
      </div><div id="report-section" role="tabpanel" aria-label={tab}>
        {tab!=='Page details'&&<><div className="issue-summary">{summaryCards.map(card=><button className={'issue-total issue-total--'+card.key} key={card.key} aria-pressed={tab==='All issues'&&filter===card.filter} onClick={()=>{setTab('All issues');setFilter(card.filter);setSearch('');}}><span>{card.label}</span><strong>{card.count}</strong><small>Finding groups</small><span className="summary-action">View {card.label.toLowerCase()} →</span></button>)}</div><p className="issue-summary-note">Counts represent finding groups across this page, not individual affected images or links. Select a card to filter All issues. Needs attention includes errors, warnings and suggested improvements; All checks also includes unmeasured checks.</p></>}
        {tab==='Page details'?<PageDetail report={report}/>:tab==='All issues'?<div className="unified-all">{fixFirstCard(false)}{categories.map(c=>categoryCard(c,false))}</div>:tab==='Fix first'?fixFirstCard(true):categoryCard(tab,true)}
      </div>
    </section><div className="disclaimer"><CircleAlert size={16}/><p>{report.notice}</p></div>
  </div>;
}
