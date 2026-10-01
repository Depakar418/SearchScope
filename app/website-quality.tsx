import type {PageAudit} from '../lib/history';
import {comparePages} from '../lib/cross-page';
export function WebsiteQuality({pages}:{pages:PageAudit[]}){
 const result=comparePages(pages.filter(p=>p.status==='completed'));
 return <details className="panel detail-accordion"><summary><div><strong>Cross-page review · {result.groups.length} comparison groups</strong><p>Duplicate titles, descriptions, H1 text and similar main content across {result.compared} audited pages.</p></div><span>⌄</span></summary><div className="detail-accordion-content"><p>{result.method}</p>{result.groups.map((g,i)=><section className="link-result" key={i}><strong>{g.kind}{g.similarity!==undefined?` · ${g.similarity}% overlap`:''}</strong><p>{g.value}</p><ul>{g.urls.map(url=><li key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>)}</ul></section>)}{!result.groups.length&&<p>No matching groups found in the available reports. Unavailable legacy main-content data is excluded from similarity comparison.</p>}</div></details>;
}
