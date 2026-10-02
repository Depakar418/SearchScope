import type {Report} from '../lib/audit';
import {HeadingIssueCue} from './heading-issue-cue';

export function HeadingEvidence({report,findingId}:{report:Report;findingId:string}){
  const headings=report.headings.map((heading,i)=>({heading,index:i+1,issue:report.headingIssues?.find(h=>h.index===i+1),previous:report.headings[i-1]})).filter(row=>findingId==='heading-empty'?!row.heading.text:!!row.issue);
  return <section className="heading-evidence"><h4>Heading structure · highlighted problems</h4><p>{headings.length} affected headings. Compare each current level with the suggested structure before editing.</p><div className="heading-outline">{headings.map(({heading,index,issue,previous})=><div className="heading-line has-issue" key={index}><span className="heading-number">{index}</span><span className="heading-level">H{heading.level}</span><div><strong>{heading.text||'(Empty heading)'}</strong>{findingId!=='heading-empty'&&issue&&previous&&<HeadingIssueCue actual={issue.actual} previous={previous.level} previousText={previous.text} expected={issue.expected}/>} {!heading.text&&<p><mark>Issue · Empty heading.</mark> Add a useful label or remove it.</p>}</div><span className="outline-state">Review</span></div>)}</div></section>;
}
