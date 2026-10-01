'use client';
import {CircleAlert,Lightbulb,FileCheck,TriangleAlert} from 'lucide-react';
import type {PageAudit} from '../lib/history';
import type {Report} from '../lib/audit';
import {websiteScores} from '../lib/website-scores';
import {ScoreGauge} from './score-gauge';

export function WebsiteOverview({pages,discovered,selected}:{pages:PageAudit[];discovered:number;selected:number}){
  const reports=pages.filter(p=>p.status==='completed'&&p.report).map(p=>p.report as Report);
  const {scores,overall}=websiteScores(reports);
  const count=(severity:string)=>reports.reduce((n,r)=>n+r.checks.filter(c=>c.severity===severity).length,0);
  const cards=[{label:'Errors',value:count('error'),note:'Confirmed source problems',tone:'error',Icon:CircleAlert},{label:'Warnings',value:count('warning'),note:'Checks needing contextual review',tone:'warning',Icon:TriangleAlert},{label:'Opportunities',value:count('opportunity'),note:'Suggested improvements',tone:'opportunity',Icon:Lightbulb},{label:'Audited pages',value:reports.length,note:`${selected} selected · ${discovered} discovered`,tone:'pass',Icon:FileCheck}];
  return <section className="website-overview" aria-label="Website audit overview">
    <div className="website-overview-heading"><div><h3>Website score overview</h3><p>Based on {reports.length} audited {reports.length===1?'page':'pages'} of {discovered} discovered. Updates as pages finish or are re-audited.</p></div><span className="website-coverage">{discovered?Math.round(reports.length/discovered*100):0}% audited</span></div>
    <div className="score-grid website-score-grid">{[{category:'Overall',score:overall,count:reports.length},...scores].map(s=><div className="score-card" key={s.category}><div><span className="score-label">{s.category==='Overall'?'Overall checklist':s.category+' checklist'}</span><div className="score-number">{s.score??'—'}<small>/100</small></div><p>{s.category==='Overall'?'Average of available categories':`${s.count} pages with a measured score`}</p></div><ScoreGauge score={s.score} category={'Website '+s.category}/></div>)}</div>
    <p className="website-score-note">Category scores average available page scores equally. Pending, failed and unmeasured scores are excluded. These scores describe audited pages, not the entire discovered website.</p>
    <div className="site-counts website-stat-cards">{cards.map(({label,value,note,tone,Icon})=><div className={'website-stat website-stat--'+tone} key={label}><div className="website-stat-heading"><span>{label}</span><Icon size={19}/></div><strong>{value}</strong><p>{note}</p><small>{tone==='pass'?'Completed reports':'Finding groups across audited pages'}</small></div>)}</div>
  </section>;
}
