'use client';
import {useState} from 'react';
import {Check,ChevronDown,CircleAlert,Code,Download,FileText,Search} from 'lucide-react';
import type {Category,Check as Finding,Report} from '../lib/audit';
import {checkCounts} from '../lib/audit-result';
import {scopedFindings} from '../lib/report-tabs';
import {reportCSV,reportMarkdown} from '../lib/report-export';
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

export default function AuditReport({report,onBack}:{report:Report;onBack?:()=>void}){
  const [tab,setTab]=useState<ReportTab>('Fix first');
  const [filter,setFilter]=useState('Needs attention');
  const [search,setSearch]=useState('');
  const counts=checkCounts(report);
  const passed=counts.PASS;
  const summaryCards=[{key:'error',label:'Errors',filter:'Errors',count:counts.FAIL},{key:'warning',label:'Warnings',filter:'Warnings',count:report.checks.filter(c=>c.severity==='warning').length},{key:'pass',label:'Passed',filter:'Passed',count:passed},{key:'all',label:'All checks',filter:'All checks',count:Object.values(counts).reduce((a,b)=>a+b,0)},{key:'attention',label:'Needs attention',filter:'Needs attention',count:report.checks.filter(c=>['error','warning','opportunity'].includes(c.severity)).length}];
  function download(kind:'md'|'csv'|'json'){
    const data=kind==='md'?reportMarkdown(report):kind==='csv'?reportCSV(report):JSON.stringify(report,null,2);
    const url=URL.createObjectURL(new Blob([data],{type:kind==='json'?'application/json':kind==='md'?'text/markdown':'text/csv'}));
    const link=document.createElement('a');link.href=url;link.download='searchscope-audit.'+kind;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const matches=(c:Finding)=>(filter==='All checks'||filter==='Needs attention'&&['error','warning','opportunity'].includes(c.severity)||filter===statusLabels[c.severity]||filter==='Errors'&&c.severity==='error'||filter==='Warnings'&&c.severity==='warning'||filter==='Opportunities'&&c.severity==='opportunity')&&`${c.name} ${c.evidence} ${c.fix}`.toLowerCase().includes(search.toLowerCase());
  const fixFirst=scopedFindings(report,'fix-first').slice(0,5).filter(matches);
  function categoryCard(category:Category,showAction:boolean){
    const findings=scopedFindings(report,category,true).filter(matches);
    return <section className="unified-category-card" key={category}>
      <CategoryExplanation report={report} category={category} showAction={showAction}/>{category==='SEO'&&<LinkStatusReport report={report}/>}
      <FindingList key={category+filter+search} report={report} findings={findings} prefix={'category-'+category}/>
    </section>;
  }
  function fixFirstCard(showAction:boolean){return <section className="unified-category-card"><div className="unified-card-heading"><div><h3>Fix first</h3><p>Start with these {fixFirst.length} highest-priority findings.</p></div>{showAction&&<ReportTabButton report={report} scope="fix-first"/>}</div><FindingList key={'fix-'+filter+search} report={report} findings={fixFirst} prefix="priority"/></section>;}
  return <div className="results unified-report">
    {onBack&&<button className="secondary report-back" onClick={onBack}>Back to website pages</button>}
    <div className="report-heading"><div><div className="eyebrow">AUDIT REPORT {report.label.startsWith('Sample')&&<span className="sample-tag">SAMPLE DATA</span>}</div><h2>{report.label}</h2><p>{new Date(report.date).toLocaleString()} · {report.words.toLocaleString()} extracted words {report.status&&` · HTTP ${report.status}`}</p></div><div className="export"><button className="secondary" onClick={()=>download('md')}><FileText size={16}/> Full report</button><button className="secondary" onClick={()=>download('csv')}><Download size={16}/> Export CSV</button><button className="icon-button" aria-label="Export JSON" onClick={()=>download('json')}><Code size={18}/></button></div></div>
    <div className="score-grid">{categories.map(c=><div className="score-card" key={c}><div><span className="score-label">{c} checklist</span><div className="score-number">{report.scores[c]??'—'}<small>/100</small></div><p>{c==='SEO'?'Page fundamentals':c==='AEO'?'Answer structure':'Credibility signals'}</p></div><ScoreGauge score={report.scores[c]} category={c}/></div>)}<div className="score-card summary-card"><span className="score-label">Checks completed</span><div className="score-number">{counts.PASS+counts.FAIL+counts.REVIEW}<small>/{report.checks.length}</small></div><p>{passed} passed · {counts.REVIEW+counts.FAIL} need attention</p></div></div>
    <section className="unified-report-body"><div className="report-navigation"><div className="report-tabs" role="tablist" aria-label="Report sections">{REPORT_MENU.map(name=><button key={name} role="tab" aria-selected={tab===name} aria-controls="report-section" className={tab===name?'selected':''} onClick={()=>{setTab(name);setFilter('Needs attention');setSearch('');}}>{name}</button>)}</div>
        {tab!=='Page details'&&<div className="unified-controls"><div className="search-field"><Search size={16}/><input aria-label="Search findings" placeholder="Search findings" value={search} onChange={e=>setSearch(e.target.value)}/></div><select aria-label="Filter findings" value={filter} onChange={e=>setFilter(e.target.value)}>{['Needs attention','All checks','Errors','Warnings','Opportunities','Passed','Unavailable'].map(item=><option key={item}>{item}</option>)}</select></div>}
      </div><div id="report-section" role="tabpanel" aria-label={tab}>
        {tab!=='Page details'&&<><div className="issue-summary">{summaryCards.map(card=><button className={'issue-total issue-total--'+card.key} key={card.key} aria-pressed={tab==='All issues'&&filter===card.filter} onClick={()=>{setTab('All issues');setFilter(card.filter);setSearch('');}}><span>{card.label}</span><strong>{card.count}</strong><small>Finding groups</small><span className="summary-action">View {card.label.toLowerCase()} →</span></button>)}</div><p className="issue-summary-note">Counts represent finding groups across this page, not individual affected images or links. Select a card to filter All issues. Needs attention includes errors, warnings and suggested improvements; All checks also includes unmeasured checks.</p></>}
        {tab==='Page details'?<PageDetail report={report}/>:tab==='All issues'?<div className="unified-all">{fixFirstCard(false)}{categories.map(c=>categoryCard(c,false))}</div>:tab==='Fix first'?fixFirstCard(true):categoryCard(tab,true)}
      </div>
    </section><div className="disclaimer"><CircleAlert size={16}/><p>{report.notice}</p></div>
  </div>;
}
