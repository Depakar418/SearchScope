import type {Report} from './audit';
import type {PageAudit,Run} from './history';
import {comparePages} from './cross-page';
import {normalizeURL} from './url-normalization';

export const INTELLIGENCE_VERSION='2.0.0';
export const RECOMMENDATION_VERSION='1.0.0';
export type Confidence='High'|'Medium'|'Low';
export type Observation={text:string;selector:string|null;section:string;source:'observed'|'inferred';confidence:Confidence};
export type Opportunity={id:string;type:'Topic'|'Question'|'Content'|'Internal Linking'|'Answer Readiness'|'Support';title:string;why:string;action:string;page:string;selector:string|null;evidence:string;confidence:Confidence;priority:'High'|'Medium'|'Low'};
export type Question={text:string;selector:string|null;section:string;answer:string;state:'covered'|'partial'|'unanswered'};
export type PageIntelligence={pageId:string;projectId:string;auditId:string;url:string;pageType:string;analyzedAt:string;analysisVersion:string;crawlVersion:string;extractionVersion:string;recommendationVersion:string;coverage:{mainContent:boolean;sectionCount:number;paragraphCount:number;listCount:number;tableCount:number;contentLinks:number;supportLinks:number;note:string};contentStrength:{label:'Evidence available'|'Review content'|'Insufficient data';signals:{label:string;state:'observed'|'review'|'not measured';evidence:string;selector:string|null}[]};topic:{primary:string|null;related:Observation[];confidence:Confidence;basis:string};intent:{likely:'Informational'|'Commercial'|'Transactional'|'Navigational'|'Mixed'|'Unknown';confidence:Confidence;signals:string[]};questions:Question[];answerReadiness:{label:'Observed answer structure'|'Review answer structure'|'Insufficient data';signals:string[]};concepts:Observation[];trustSignals:Observation[];internalLinking:{contextual:string[];incoming:string[]|null;note:string};opportunities:Opportunity[];limitations:string[]};

const compact=(s:string)=>s.replace(/\s+/g,' ').trim();
const unique=(values:string[])=>[...new Set(values.map(compact).filter(Boolean))];
const normalize=(s:string)=>compact(s).toLocaleLowerCase();
const phrase=(s:string)=>compact(s).slice(0,150);

/** Uses only the saved Sprint 1 DOM projection. Null/empty fields stay unmeasured. */
export function analyzePageIntelligence(report:Report,pageType:string,incoming:string[]|null=null):PageIntelligence{
 const doc=report.pageDocument,content=doc?.content,context=report.auditContext;
 if(!context?.projectId||!context.pageId)throw new Error('Project-bound page evidence is required for intelligence.');
 const paragraphs=content?.paragraphs||[],headings=content?.headings||[],lists=content?.lists||[],tables=content?.tables||[];
 const main=content?.mainContent||'',hasContent=main.length>0;
 const blockBySelector=new Map([...paragraphs,...lists,...tables].map(b=>[b.selector,b]));
 const contentLinks=(doc?.links||[]).filter(l=>l.type==='internal'&&l.section==='content'&&!!l.url);
 const supportLinks=(doc?.links||[]).filter(l=>l.type==='external'&&l.section==='content'&&!!l.url);
 const h1=headings.find(h=>h.level===1&&h.text)?.text||'';
 const title=report.title||'';
 const primary=phrase(h1||title)||null;
 const related=headings.filter(h=>h.text&&h.text!==h1&&h.level>1).slice(0,20).map(h=>({text:phrase(h.text),selector:h.selector,section:h.section,source:'observed' as const,confidence:'High' as const}));
 const questions:Question[]=headings.filter(h=>/\?\s*$/.test(h.text)).map(h=>{
  const blocks=h.followingContent.map(selector=>blockBySelector.get(selector)).filter((b):b is NonNullable<typeof b>=>!!b);
  const answer=compact(blocks.map(b=>b.text).join(' ')).slice(0,350);
  return{text:h.text,selector:h.selector,section:h.section,answer,state:answer.length>=50?'covered' as const:answer.length?'partial' as const:'unanswered' as const};
 });
 for(const p of paragraphs){const matches=p.text.matchAll(/(?:^|[.!]\s+)([^.!?]{8,150}\?)/g);for(const match of matches){const text=compact(match[1]),answer=compact(p.text.slice((match.index||0)+match[0].length)).slice(0,350);if(!questions.some(q=>normalize(q.text)===normalize(text)))questions.push({text,selector:p.selector,section:p.section,answer,state:answer.length>=50?'covered':answer.length?'partial':'unanswered'});}}
 const intentSignals:string[]=[];const words=normalize([title,h1,...headings.map(h=>h.text)].join(' '));
 const information=/\b(what|why|how|guide|learn|explained|overview|faq)\b/.test(words);
 const commercial=/\b(best|compare|comparison|pricing|plans|services|solutions)\b/.test(words);
 const transactional=/\b(buy|purchase|checkout|enroll|register|book|request a quote)\b/.test(words);
 if(information)intentSignals.push('Explanatory words in page title or headings');if(commercial)intentSignals.push('Comparison, pricing or service wording in title/headings');if(transactional)intentSignals.push('Transaction or signup wording in title/headings');
 const intentKinds=[information,commercial,transactional].filter(Boolean).length;
 const likely=intentKinds>1?'Mixed':information?'Informational':commercial?'Commercial':transactional?'Transactional':'Unknown';
 const intentConfidence:Confidence=intentKinds===1&&headings.length>=2?'Medium':'Low';
 const sourceMeta=(doc?.meta||[]).filter(m=>/^(author|article:published_time|article:modified_time|date)$/i.test(m.name||m.property||'')&&m.content);
 const trustSignals:Observation[]=[...sourceMeta.map(m=>({text:`${m.name||m.property}: ${m.content}`,selector:'head meta',section:'Document head',source:'observed' as const,confidence:'High' as const})),...supportLinks.slice(0,15).map(l=>({text:`External link: ${l.url}`,selector:l.selector,section:l.sectionLabel,source:'observed' as const,confidence:'High' as const}))];
 const signals:PageIntelligence['contentStrength']['signals']=[
  {label:'Main content',state:hasContent?'observed':'review',evidence:hasContent?`Extracted ${main.length} characters from ${doc?.contentSelector||'the document'}.`:'No extractable main content in initial HTML.',selector:doc?.contentSelector||null},
  {label:'Content sections',state:headings.length>1?'observed':'review',evidence:`${headings.length} content headings observed.`,selector:headings[0]?.selector||null},
  {label:'Explanatory blocks',state:paragraphs.length?'observed':'review',evidence:`${paragraphs.length} paragraphs in extracted content.`,selector:paragraphs[0]?.selector||null},
  {label:'Question coverage',state:questions.length?questions.some(q=>q.state!=='covered')?'review':'observed':'not measured',evidence:questions.length?`${questions.filter(q=>q.state==='covered').length} of ${questions.length} detected questions have at least 50 characters of adjacent content; length is a review cue, not answer quality.`:'No explicit question text found.',selector:questions[0]?.selector||null},
  {label:'Contextual internal links',state:contentLinks.length?'observed':'review',evidence:`${contentLinks.length} internal links found in extracted content.`,selector:contentLinks[0]?.selector||null},
  {label:'Supporting sources',state:supportLinks.length?'observed':'not measured',evidence:supportLinks.length?`${supportLinks.length} external content links observed. Quality not assessed.`:'No external content links observed; some page types do not need them.',selector:supportLinks[0]?.selector||null},
  {label:'Freshness',state:sourceMeta.some(m=>/date|time/.test(m.name||m.property||''))?'observed':'not measured',evidence:'Publication/update metadata only; factual freshness is not verified.',selector:null}
 ];
 const opportunities:Opportunity[]=[];
 const add=(type:Opportunity['type'],title:string,why:string,action:string,evidence:string,selector:string|null,confidence:Confidence,priority:Opportunity['priority']='Medium')=>opportunities.push({id:`${context.pageId}:${type}:${opportunities.length}`,type,title,why,action,page:report.label,selector,evidence,confidence,priority});
 if(!hasContent)add('Content','Review extractable main content','The initial HTML did not provide readable main content for analysis.','Inspect whether the content is rendered by JavaScript or excluded by page structure.','No main content text extracted.',doc?.contentSelector||null,'High','High');
 for(const q of questions.filter(q=>q.state!=='covered').slice(0,12))add('Question',`Review the answer to “${phrase(q.text)}”`,'The detected question has little or no adjacent answer text in the initial HTML.','Add a direct answer if this question is relevant, then support it with useful detail.',`${q.state}: ${q.answer||'No adjacent answer block detected.'}`,q.selector,'Medium');
 if(hasContent&&headings.length>0&&!contentLinks.length)add('Internal Linking','Review contextual internal links','No internal links were found inside extracted main content.','Add a relevant link to another audited page if it helps readers continue the topic.','0 internal content links; navigation links were excluded.',headings[0].selector,'Medium','Low');
 const answerSignals=[...(questions.length?[`${questions.length} explicit questions; ${questions.filter(q=>q.state==='covered').length} have adjacent answer text.`]:[]),...(lists.length?[`${lists.length} lists in main content.`]:[]),...(tables.length?[`${tables.length} tables in main content.`]:[])];
 return {pageId:context.pageId,projectId:context.projectId,auditId:context.auditId,url:report.label,pageType,analyzedAt:report.date,analysisVersion:INTELLIGENCE_VERSION,crawlVersion:report.version,extractionVersion:doc?.documentVersion||'legacy',recommendationVersion:RECOMMENDATION_VERSION,
  coverage:{mainContent:hasContent,sectionCount:content?.sections.length||0,paragraphCount:paragraphs.length,listCount:lists.length,tableCount:tables.length,contentLinks:contentLinks.length,supportLinks:supportLinks.length,note:'Initial HTML only. Counts describe observed elements and do not measure quality or ranking.'},
  contentStrength:{label:!doc?'Insufficient data':!hasContent||signals.some(s=>s.state==='review')?'Review content':'Evidence available',signals},
  topic:{primary,related,confidence:h1&&title&&normalize(title).includes(normalize(h1))?'Medium':'Low',basis:h1?'Inferred from the first content H1.':'Inferred from the document title; no content H1 observed.'},
  intent:{likely,confidence:intentConfidence,signals:intentSignals},questions,
  answerReadiness:{label:!doc?'Insufficient data':questions.some(q=>q.state!=='covered')?'Review answer structure':answerSignals.length?'Observed answer structure':'Insufficient data',signals:answerSignals},
  concepts:related.slice(0,12),trustSignals,
  internalLinking:{contextual:unique(contentLinks.map(l=>l.url!)),incoming,note:'Links are classified from initial HTML. Incoming links require other audited pages.'},opportunities,
  limitations:['Topic and intent are editorial inferences, not search engine classifications.','Question adjacency and length do not establish answer quality.','External links and metadata do not establish expertise or factual accuracy.']};
}

export function websiteIntelligence(run:Run,pages:PageAudit[],stored:PageIntelligence[]){
 const byRevision=new Map(stored.map(p=>[p.pageId,p]));const current=pages.filter(p=>p.report&&p.status==='completed').flatMap(p=>byRevision.get(p.id)?[byRevision.get(p.id)!]:[]);
 const graph=new Map<string,Set<string>>();for(const p of pages)for(const l of p.report?.linkInventory||[]){if(l.type!=='internal'||l.section!=='content'||!l.url)continue;const target=normalizeURL(l.url),from=normalizeURL(p.url);if(target===from)continue;const sources=graph.get(target)||new Set<string>();sources.add(p.url);graph.set(target,sources);}
 const rows=current.map(p=>({...p,internalLinking:{...p.internalLinking,incoming:[...(graph.get(normalizeURL(p.url))||[])]}}));
 const comparisons=comparePages(pages);const relationships:{kind:string;urls:string[];evidence:string;confidence:Confidence;note:string}[]=comparisons.groups.map(g=>({kind:g.kind,urls:g.urls,evidence:g.value,confidence:g.kind==='Similar content'?'Medium':'High',note:g.kind==='Similar content'?'Potential overlap for editorial review.':'Exact normalized text match; intent and context still require review.'}));
 const topics=rows.filter(p=>p.topic.primary).map(p=>({topic:p.topic.primary!,url:p.url,confidence:p.topic.confidence,related:p.topic.related}));
 const byTopic=new Map<string,typeof topics>();for(const t of topics){const key=normalize(t.topic);byTopic.set(key,[...(byTopic.get(key)||[]),t]);}
 const clusters=[...byTopic.values()].filter(group=>group.length>1).map(group=>({topic:group[0].topic,pages:group.map(p=>p.url),evidence:'Exact normalized primary topic inferred from headings or titles.',confidence:'Low' as const,note:'Potential topic cluster; compare page roles and intent manually.'}));
 const audited=new Set(rows.map(p=>normalizeURL(p.url)));for(const [to,sources] of graph)if(audited.has(to))for(const from of sources)if(audited.has(normalizeURL(from)))relationships.push({kind:'Contextual link',urls:[from,rows.find(p=>normalizeURL(p.url)===to)!.url],evidence:'Internal link in extracted main content.',confidence:'High',note:'Observed link relationship; no topical relevance judgment.'});
 const opportunities=rows.flatMap(p=>p.opportunities);
 return {auditId:run.id,projectId:run.project||null,analysisVersion:INTELLIGENCE_VERSION,coverage:{discovered:run.inventory.pages.length,audited:pages.filter(p=>p.report).length,analyzed:rows.length,selected:run.selected.length,note:'Only current successful page revisions with saved intelligence are included. Cross-page comparisons use successful reports in the selected audit.'},pages:rows,topics,clusters,relationships,opportunities,questions:rows.flatMap(p=>p.questions.map(q=>({page:p.url,...q}))),limitations:['No keyword volume, ranking, traffic, AI citations or competitor data are measured.','Potential relationships and gaps require editorial review.','Partial crawl coverage cannot prove a page is orphaned.']};
}
export type WebsiteIntelligence=ReturnType<typeof websiteIntelligence> & {statuses:Record<string,string>};
