import type {Report} from './audit';
import {asEvidence,type EvidenceItem} from './dom-extraction';

export type DetectionConfidence='High'|'Medium'|'Low';
export const SIGNAL_VERSION='1.0.0';
const compact=(s:string)=>s.replace(/\s+/g,' ').trim();
export const isQuestion=(s:string)=>/\?|^(how|what|why|when|where|who|which|can|does|do|is|are)\b/i.test(s.trim());
/** Calendar validation first: Date.parse alone silently rolls February 30 forward. */
export function normalizedSourceDate(value:string):string|null{
 const raw=value.trim(),m=raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:$|T|\s)/);
 if(!m)return null;
 const year=+m[1],month=+m[2],day=+m[3];
 const calendar=new Date(0);calendar.setUTCFullYear(year,month,0);
 if(month<1||month>12||day<1||day>calendar.getUTCDate())return null;
 const dateOnly=/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(raw);
 if(dateOnly)return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
 // A timestamp without a zone has no known timezone; retain its local representation.
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(raw))return null;
 if(+raw.slice(11,13)>23||+raw.slice(14,16)>59||+(raw.slice(17,19)||0)>59)return null;
 const time=Date.parse(raw);return Number.isNaN(time)?null:/Z$|[+-]\d{2}:\d{2}$/.test(raw)?new Date(time).toISOString():raw;
}
type FreshnessSignal={source:string;type:'published'|'modified'|'unspecified';raw:string;date:string|null;valid:boolean;evidence:EvidenceItem;confidence:DetectionConfidence};
export type FreshnessAnalysis={status:'FRESHNESS_SIGNAL_DETECTED'|'MULTIPLE_FRESHNESS_SIGNALS'|'FRESHNESS_SIGNAL_CONFLICT'|'NO_FRESHNESS_SIGNAL'|'INVALID_DATE_SIGNAL';signals:FreshnessSignal[];conflicts:string[];limitation:string};
type DOM=ReturnType<typeof import('./dom-extraction').extractDocument>;
export function freshnessSignals(dom:DOM,page:string):FreshnessAnalysis{
 const signals:FreshnessSignal[]=[];
 const add=(source:string,type:FreshnessSignal['type'],raw:string,evidence:EvidenceItem)=>{
  if(signals.length>=200)return;const date=normalizedSourceDate(raw);
  signals.push({source,type,raw,date,valid:date!==null,evidence:{...evidence,pageURL:page},confidence:'High'});
 };
 for(const e of dom.elements){const key=(e.attrs.name||e.attrs.property||'').toLowerCase();
  if(e.tag==='meta'&&/^(article:published_time|article:modified_time|date|dc.date)$/.test(key))add(`meta ${key}`,key.includes('modified')?'modified':key.includes('published')?'published':'unspecified',e.attrs.content||'',asEvidence(e));
  if(e.tag==='time'&&e.section==='content')add('time element',/updated|modified/i.test(e.text+' '+e.context)?'modified':/published|posted/i.test(e.text+' '+e.context)?'published':'unspecified',e.attrs.datetime||e.text,asEvidence(e));
  if(e.section==='content'&&['p','span'].includes(e.tag)&&/^(?:last\s+)?(?:updated|modified|published|posted)\s*:/i.test(e.text)){
   const raw=e.text.match(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:T\S+)?\b/)?.[0];
   if(raw)add('visible publication/update label',/updated|modified/i.test(e.text)?'modified':'published',raw,asEvidence(e));
  }
  if(e.tag==='script'&&e.attrs.type?.toLowerCase()==='application/ld+json'){
   try{walkSchema(JSON.parse(e.rawText),(node)=>{for(const key of ['datePublished','dateModified'])if(typeof node[key]==='string')add(`JSON-LD ${key}`,key==='datePublished'?'published':'modified',node[key] as string,asEvidence(e));});}catch{/* Syntax is reported by the existing schema check. */}
  }
 }
 const valid=signals.filter(s=>s.valid),conflicts:string[]=[];
 for(const type of ['published','modified'] as const)if(new Set(valid.filter(s=>s.type===type).map(s=>s.date!.slice(0,10))).size>1)conflicts.push(`Different ${type} calendar dates declared; review source agreement.`);
 const published=valid.filter(s=>s.type==='published'),modified=valid.filter(s=>s.type==='modified');
 if(published.some(p=>modified.some(m=>m.date!.slice(0,10)<p.date!.slice(0,10))))conflicts.push('An update date precedes a publication date.');
 return {status:conflicts.length?'FRESHNESS_SIGNAL_CONFLICT':!valid.length?signals.length?'INVALID_DATE_SIGNAL':'NO_FRESHNESS_SIGNAL':valid.length>1?'MULTIPLE_FRESHNESS_SIGNALS':'FRESHNESS_SIGNAL_DETECTED',signals,conflicts,limitation:'Declared dates do not prove that content is current, accurate or recently edited. Different publication and update dates are not inherently a conflict. Date formats outside the supported ISO-like grammar remain invalid/uninterpreted.'};
}
/** Bounded traversal over captured JSON-LD, including nested author/product/context objects. */
function walkSchema(value:unknown,visit:(node:Record<string,unknown>)=>void,depth=0,budget={left:1000}):void{
 if(depth>8||budget.left--<=0||!value||typeof value!=='object')return;
 if(Array.isArray(value)){for(const v of value)walkSchema(v,visit,depth+1,budget);return;}
 const node=value as Record<string,unknown>;visit(node);
 for(const v of Object.values(node))if(v&&typeof v==='object')walkSchema(v,visit,depth+1,budget);
}
export type AnswerCandidate={question:string;signal:'Direct answer'|'Structured answer'|'Weak answer'|'No clear answer';format:'Paragraph'|'List'|'Table'|'Mixed'|'None';status:'REVIEW';confidence:DetectionConfidence;page:string;section:string;nearestHeading:string|null;selector:string|null;distance:number|null;answer:string;questionEvidence:EvidenceItem;evidence:EvidenceItem[];supportingExplanation:boolean;supportingLinks:{text:string;url:string}[];attributionSignals:string[];completenessSignals:string[];claritySignals:string[];limitation:string};
export function questionCandidates(doc:NonNullable<Report['pageDocument']>){
 const content=doc.content;
 const candidates:{text:string;selector:string;section:string;following:string[];order:number;remainder?:string}[]=content.headings.filter(h=>isQuestion(h.text)).map(h=>({text:h.text,selector:h.selector,section:h.section,following:h.followingContent.filter((v):v is string=>!!v),order:doc.headings.find(x=>x.selector===h.selector)?.order??0}));
 for(const p of content.paragraphs){const m=p.text.match(/(?:^|[.!]\s+)([^.!?]{8,150}\?)/);if(m&&!candidates.some(q=>q.text.toLowerCase()===compact(m[1]).toLowerCase()))candidates.push({text:compact(m[1]),selector:p.selector!,section:p.section,following:[p.selector!],order:p.order,remainder:compact(p.text.slice((m.index||0)+m[0].length))});}
 return candidates.slice(0,200);
}
export function answerSignals(report:Report):AnswerCandidate[]{
 const doc=report.pageDocument;if(!doc)return [];
 const content=doc.content,blocks=[...content.paragraphs,...content.lists,...content.tables].sort((a,b)=>a.order-b.order);
 const candidates=questionCandidates(doc);
 return candidates.slice(0,200).map(q=>{
  const adjacent=blocks.filter(b=>q.following.includes(b.selector!)).slice(0,3);
  const answer=compact(q.remainder!==undefined?q.remainder:adjacent.map(b=>b.text).join(' ')).slice(0,1200);
  const meaningful=adjacent.filter(b=>compact(b.text)&&!(q.remainder!==undefined&&!q.remainder));
  const formats=new Set(meaningful.map(b=>b.element==='table'?'Table':['ul','ol','dl'].includes(b.element)?'List':'Paragraph'));
  const format:AnswerCandidate['format']=formats.size>1?'Mixed':formats.size?[...formats][0] as AnswerCandidate['format']:'None';
  const questionTerms=q.text.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)?.filter(t=>!['what','does','which','where','when','with','that','this','how','why','can','are','the'].includes(t))||[];
  const related=questionTerms.some(t=>new RegExp(`\\b${t}\\b`,'iu').test(answer));
  const direct=answer.length>=50&&answer.length<=1200&&related;
  const structured=answer.length>=30&&['List','Table','Mixed'].includes(format);
  const signal:AnswerCandidate['signal']=!answer?'No clear answer':structured?'Structured answer':direct?'Direct answer':'Weak answer';
  const links=doc.links.filter(l=>l.url&&meaningful.some(b=>l.selector.startsWith(b.selector+' > '))).slice(0,10).map(l=>({text:l.text||l.accessibleName||l.rawHref,url:l.url!}));
  const attribution=(report.checks.find(c=>c.id==='content-attribution')?.occurrences||[]).slice(0,5);
  return {question:q.text,signal,format,status:'REVIEW',confidence:answer?'Medium':'High',page:report.label,section:q.section,nearestHeading:q.remainder===undefined?q.text:doc.headings.filter(h=>h.content&&h.order<q.order).at(-1)?.text||null,selector:q.selector,distance:meaningful.length?Math.max(0,meaningful[0].order-q.order):null,answer,questionEvidence:report.checks.find(c=>c.id==='content-question')?.evidenceItems?.find(e=>e.selector===q.selector)||{kind:'document',element:q.remainder===undefined?'heading':'paragraph',selector:q.selector,snippet:'',text:q.text,context:q.text,section:q.section,pageURL:report.label},evidence:meaningful.map(b=>({...b,text:q.remainder!==undefined?q.remainder:b.text,pageURL:report.label})),supportingExplanation:meaningful.length>1,supportingLinks:links,attributionSignals:attribution,completenessSignals:[`${answer.length} adjacent characters`,`${meaningful.length} adjacent source blocks`,`${links.length} links inside those blocks`],claritySignals:[format==='None'?'No adjacent answer format':`${format} source structure`,related?'Question term repeated in adjacent content':'No literal question term overlap'],limitation:'Adjacency, source order, format, length and literal term overlap are deterministic review cues. SearchScope does not establish semantic correctness, completeness, factual support, snippet selection or AI visibility. Attribution is page-level and may not apply to this answer.'};
 });
}
export type EntitySignal={type:'Organization'|'Product'|'Service'|'Person/author'|'Location'|'Industry'|'Technology'|'Topic'|'Regulatory subject'|'Business context';value:string;source:string;evidence:EvidenceItem;confidence:DetectionConfidence;page:string;section:string;classification:'OBSERVATION';limitation:string};
export function entitySignals(report:Report):EntitySignal[]{
 const doc=report.pageDocument;if(!doc)return [];
 const signals:EntitySignal[]=[],seen=new Set<string>();
 const add=(type:EntitySignal['type'],value:string,source:string,evidence:EvidenceItem,confidence:DetectionConfidence)=>{
  value=compact(value).slice(0,180);const key=[type,value,source].join(':');if(!value||seen.has(key)||signals.length>=200)return;seen.add(key);
  signals.push({type,value,source,evidence:{...evidence,pageURL:report.label},confidence,page:report.label,section:evidence.section,classification:'OBSERVATION',limitation:confidence==='High'?'Confident detection of a declaration; identity and recognition by search/AI systems are not verified.':'Literal wording suggests context; classification requires editorial review.'});
 };
 const documentEvidence=(text:string,source:string):EvidenceItem=>({kind:'document',element:source,selector:null,snippet:'',text,context:'Captured document metadata',section:'Document head',pageURL:report.label});
 const typeMap:Record<string,EntitySignal['type']>={Organization:'Organization',Corporation:'Organization',LocalBusiness:'Organization',Product:'Product',SoftwareApplication:'Product',Service:'Service',Person:'Person/author',Place:'Location',PostalAddress:'Location',City:'Location',Country:'Location'};
 for(const raw of doc.structuredData.slice(0,100)){try{walkSchema(JSON.parse(raw),node=>{
  const types=Array.isArray(node['@type'])?node['@type']:[node['@type']];
  for(const type of types)if(typeof type==='string'&&typeMap[type]&&typeof node.name==='string')add(typeMap[type],node.name,'JSON-LD '+type,{...documentEvidence(JSON.stringify(node).slice(0,1000),'JSON-LD'),snippet:raw.slice(0,2000),snippetTruncated:raw.length>2000},'High');
  for(const field of ['author','publisher']){const v=node[field];const name=typeof v==='string'?v:v&&typeof v==='object'&&!Array.isArray(v)?(v as Record<string,unknown>).name:null;if(typeof name==='string')add(field==='author'?'Person/author':'Organization',name,'JSON-LD '+field,documentEvidence(JSON.stringify(v).slice(0,1000),'JSON-LD'),'High');}
  if(typeof node.addressLocality==='string')add('Location',node.addressLocality,'JSON-LD addressLocality',documentEvidence(JSON.stringify(node).slice(0,1000),'JSON-LD'),'High');
  if(typeof node.addressCountry==='string')add('Location',node.addressCountry,'JSON-LD addressCountry',documentEvidence(JSON.stringify(node).slice(0,1000),'JSON-LD'),'High');
  if(typeof node.industry==='string')add('Industry',node.industry,'JSON-LD industry',documentEvidence(node.industry,'JSON-LD'),'High');
  if(typeof node.serviceType==='string')add('Service',node.serviceType,'JSON-LD serviceType',documentEvidence(node.serviceType,'JSON-LD'),'High');
 });}catch{/* Existing schema check owns syntax errors. */}}
 for(const m of doc.meta){const key=(m.name||m.property||'').toLowerCase();if(key==='author')add('Person/author',m.content||'','meta author',documentEvidence(m.content||'','meta'),'High');if(key==='og:site_name')add('Organization',m.content||'','OpenGraph site name',documentEvidence(m.content||'','meta'),'Medium');if(key==='keywords')for(const v of (m.content||'').split(',').slice(0,12))add('Topic',v,'meta keywords',documentEvidence(m.content||'','meta'),'Low');}
 if(report.title)add('Topic',report.title,'document title',documentEvidence(report.title,'title'),'Medium');
 for(const h of doc.content.headings.slice(0,40))add('Topic',h.text,'visible heading',{kind:'element',element:'h'+h.level,selector:h.selector,snippet:'',text:h.text,context:h.text,section:h.section},'Medium');
 const terms:[EntitySignal['type'],RegExp][]=[['Technology',/\b(?:WordPress|JavaScript|TypeScript|React|Next\.js|PHP|Azure|API)\b/gi],['Regulatory subject',/\b(?:GDPR|DPDPA|HIPAA|data protection|code of conduct)\b/gi],['Business context',/\b(?:compliance training|employee training|learning management|workplace safety)\b/gi],['Industry',/\b(?:healthcare|banking|manufacturing|education|hospitality)\b/gi]];
 for(const p of doc.content.paragraphs.slice(0,80))for(const [type,pattern] of terms)for(const m of p.text.matchAll(pattern))add(type,m[0],'visible content',p,'Medium');
 const labelled:Record<string,EntitySignal['type']>={organization:'Organization',company:'Organization',product:'Product',service:'Service',author:'Person/author',location:'Location',industry:'Industry',technology:'Technology',topic:'Topic'};
 for(const p of doc.content.paragraphs.slice(0,80)){const match=p.text.match(/^(organization|company|product|service|author|location|industry|technology|topic)\s*:\s*(.{2,150})$/i);if(match)add(labelled[match[1].toLowerCase()],match[2],'visible labelled context',p,'Medium');}
 for(const l of doc.links.filter(l=>l.section==='content'&&l.text).slice(0,20))add('Topic',l.text,'link anchor text',asEvidence(l),'Low');
 return signals;
}
export type SourceSignals={version:string;answers:AnswerCandidate[];entities:EntitySignal[];freshness:FreshnessAnalysis|null;scope:string};
export function sourceSignals(report:Report):SourceSignals{
 return report.sourceSignals||{version:SIGNAL_VERSION,answers:answerSignals(report),entities:entitySignals(report),freshness:null,scope:'Observable initial-source signals; semantic quality, identity, rankings and AI visibility are not measured.'};
}
