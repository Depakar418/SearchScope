'use client';
import {useMemo} from 'react';
import type {PageAudit,Run} from '../lib/history';
import {websiteAuditSummary} from '../lib/audit-result';
import {currentPageAttempts,websiteFindingGroups} from '../lib/website-findings';
import {websiteScores} from '../lib/website-scores';
import {comparePages} from '../lib/cross-page';
import {issueTopic} from '../lib/project-analysis';
import {ScoreGauge} from './score-gauge';

export function AuditDashboard({run,pages,onNavigate}:{run:Run;pages:PageAudit[];onNavigate:(view:string)=>void}){
 const summary=useMemo(()=>websiteAuditSummary(pages,run.inventory.pages.length,run.selected.length),[pages,run]);
 const reports=useMemo(()=>currentPageAttempts(pages).filter(p=>p.status==='completed'&&p.report).map(p=>p.report!),[pages]);
 const chosenLimit=typeof run.config?.limit==='number'?run.config.limit:null;
 const scores=useMemo(()=>websiteScores(reports),[reports]);
 const groups=useMemo(()=>websiteFindingGroups(pages).filter(g=>['error','warning','opportunity'].includes(g.severity)),[pages]);
 const comparisons=useMemo(()=>comparePages(pages),[pages]);
 const checkIds=new Set(reports.flatMap(r=>r.checks.map(c=>c.id)));
 const uniformlyPassed=[...checkIds].filter(id=>reports.every(r=>r.checks.find(c=>c.id===id)?.status==='pass')).length;
 const areas=[...scores.scores.map(s=>({label:s.category,value:s.score===null?'Not measured':`${s.score}/100`,detail:`${groups.filter(g=>g.category===s.category).length} actionable finding groups`,view:'Issues',description:s.category==='SEO'?'Search markup and topic signals':s.category==='AEO'?'Answer-oriented source structure':'Attribution and supporting-source signals'})),{label:'Technical',value:`${groups.filter(g=>issueTopic(g.id)==='Technical').length} groups`,detail:'Observed technical and source checks',view:'Issues',description:'Review actual affected pages'},{label:'Cross-page Analysis',value:`${comparisons.groups.length} groups`,detail:`${comparisons.compared} pages compared`,view:'Cross-page Analysis',description:'Metadata, H1 and content relationships'},{label:'Issues',value:`${summary.findings.needsAttention} groups`,detail:`${summary.findings.affectedPages} affected pages`,view:'Issues',description:'Errors, warnings and suggestions'}];
 return <section className="audit-dashboard" aria-label="Selected audit overview">
  <div className="audit-dashboard-status"><div><strong>Selected audit · {new Date(run.created).toLocaleString()}</strong><p>{run.status} · {summary.completed}/{run.selected.length} selected pages audited · {run.inventory.pages.length} discovered</p></div><span>{summary.remaining?'In progress or paused':summary.failed?'Completed with failed pages':'Selection complete'}</span></div>
  <div className="audit-dashboard-scores">{scores.scores.map(s=><div className="score-card" key={s.category}><div><span className="score-label">{s.category} checklist</span><div className="score-number">{s.score??'—'}{s.score!==null&&<small>/100</small>}</div><p>{s.count} measured pages</p></div><ScoreGauge score={s.score} category={'Website '+s.category}/></div>)}<div className="audit-check-card"><strong>Checks</strong><span>{reports.length?`${uniformlyPassed} / ${checkIds.size}`:'—'}</span><p>{reports.length?'Check definitions passing on every audited page':'No completed page reports yet'}</p></div></div>
  <div className="audit-dashboard-coverage"><strong>Coverage</strong><span>{summary.discovered} discovered</span><span>{summary.selected} selected{chosenLimit?` / ${chosenLimit} page limit`:''}</span><span>{summary.completed} audited</span><span>{summary.remaining} pending</span><span>{summary.failed} failed ({summary.blocked} access-limited)</span><span>{Math.max(0,summary.discovered-summary.selected)} outside selection</span></div>
  <h2>Audit areas</h2><div className="audit-area-grid">{areas.map(area=><article key={area.label}><div><strong>{area.label}</strong><span>{area.value}</span></div><p>{area.description}</p><small>{area.detail}</small><button type="button" onClick={()=>onNavigate(area.view)}>View {area.label} →</button></article>)}</div>
  <div className="audit-dashboard-footer"><p><strong>Needs attention:</strong> {summary.findings.errors} error groups · {summary.findings.warnings} warning groups · {summary.findings.needsAttention} actionable groups. Counts are unique check types and severities across audited pages, not check evaluations or distinct DOM elements.</p><div><button className="secondary" onClick={()=>onNavigate('Pages')}>View pages →</button><button className="secondary" onClick={()=>onNavigate('Issues')}>View issues →</button></div></div>
  <details className="website-technical-details"><summary>Technical audit details</summary><p>{summary.technical.evaluations} per-page check evaluations: {summary.technical.checks.PASS} pass · {summary.technical.checks.REVIEW} review · {summary.technical.checks.FAIL} fail · {summary.technical.checks.NOT_MEASURED} not measured. Historical runs are separate.</p></details>
  <p className="website-score-note">Scores average measured source checklists. They do not represent rankings, indexing, traffic or AI visibility. Cross-page matches are source-only candidates.</p>
 </section>;
}
