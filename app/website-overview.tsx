'use client';
import {CircleAlert,CheckCircle,Layers,TriangleAlert,ListChecks} from 'lucide-react';
import type {PageAudit} from '../lib/history';
import type {Report} from '../lib/audit';
import {websiteAuditSummary} from '../lib/audit-result';
import {websiteScores} from '../lib/website-scores';
import {ScoreGauge} from './score-gauge';

export function WebsiteOverview({pages,discovered,selected}:{pages:PageAudit[];discovered:number;selected:number}){
  const reports=pages.filter(p=>p.status==='completed'&&p.report).map(p=>p.report as Report);
  const {scores,overall}=websiteScores(reports);
  const summary=websiteAuditSummary(pages,discovered,selected);
  const count=(severity:string)=>reports.reduce((n,r)=>n+r.checks.filter(c=>c.severity===severity).length,0);
  const cards=[{label:'Errors',value:summary.checks.FAIL,note:'Confirmed source problems',tone:'error',Icon:CircleAlert},{label:'Warnings',value:count('warning'),note:'Checks needing contextual review',tone:'warning',Icon:TriangleAlert},{label:'Passed',value:summary.checks.PASS,note:'Source checks that passed',tone:'pass',Icon:CheckCircle},{label:'All checks',value:Object.values(summary.checks).reduce((a,b)=>a+b,0),note:'Includes unmeasured checks',tone:'all',Icon:Layers},{label:'Needs attention',value:count('error')+count('warning')+count('opportunity'),note:'Errors, warnings and suggested improvements',tone:'attention',Icon:ListChecks}];
  return <section className="website-overview" aria-label="Website audit overview">
    <div className="website-overview-heading"><div><h3>Website score overview</h3><p>Based on {reports.length} audited {reports.length===1?'page':'pages'} · {selected} selected · {discovered} discovered. Updates as pages finish or are re-audited.</p></div><span className="website-coverage">{discovered?`${Math.round(reports.length/discovered*100)}% audited`:'No pages discovered'}</span></div>
    {!reports.length&&<p role="status">No completed page reports yet. Scores will appear as pages finish.</p>}
    <div className="score-grid website-score-grid">{[{category:'Overall',score:overall,count:reports.length},...scores].map(s=><div className="score-card" key={s.category}><div><span className="score-label">{s.category==='Overall'?'Overall checklist':s.category+' checklist'}</span><div className="score-number">{s.score??'—'}<small>/100</small></div><p>{s.category==='Overall'?'Average of available categories':`${s.count} pages with a measured score`}</p></div><ScoreGauge score={s.score} category={'Website '+s.category}/></div>)}</div>
    {(summary.failed>0||summary.remaining>0)&&<p className="website-score-note">{summary.failed} failed attempts ({summary.blocked} access-limited) · {summary.remaining} pending. Failed and blocked pages have no score.</p>}
    <p className="website-score-note">Category scores average available page scores equally. Pending, failed and unmeasured scores are excluded. These scores describe audited pages, not the entire discovered website.</p>
    <div className="site-counts website-stat-cards">{cards.map(({label,value,note,tone,Icon})=><div className={'website-stat website-stat--'+tone} key={label}><div className="website-stat-heading"><span>{label}</span><Icon size={19}/></div><strong>{value}</strong><p>{note}</p><small>Finding groups across audited pages</small></div>)}</div>
  </section>;
}
