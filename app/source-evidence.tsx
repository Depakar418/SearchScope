'use client';
import {useState} from 'react';
import type {Report} from '../lib/audit';
import type {EvidenceItem} from '../lib/dom-extraction';
import {HeadingIssueCue} from './heading-issue-cue';

const elementName=(tag:string)=>({a:'Link',img:'Image',button:'Button',input:'Input',meta:'Meta tag',link:'Canonical / link tag',time:'Time',script:'Structured data',title:'Page title'} as Record<string,string>)[tag]||(/^h[1-6]$/.test(tag)?`H${tag[1]} heading`:tag.toUpperCase());
const locationName=(e:EvidenceItem)=>e.classification==='content'?'Main content':e.classification==='navigation'?'Navigation / header':e.classification==='footer'?'Footer':e.classification==='sidebar'?'Sidebar':e.classification==='cookie-banner'?'Cookie banner':e.classification==='head'?'Document head':e.section&&e.section!=='Document'?e.section:'Not determined';
const safeURL=(raw:string,base:string)=>{try{const url=new URL(raw,base);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}catch{return null;}};
// Snippets are rendered as escaped React text, never inserted as live HTML.
const snippetText=(value:string)=>value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').slice(0,2000);
const schemaType=(snippet:string)=>{const match=snippet.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);if(!match)return null;try{const data=JSON.parse(match[1]);const type=Array.isArray(data)?data[0]?.['@type']:data?.['@type'];return typeof type==='string'?type:null;}catch{return null;}};

export function SourceEvidence({items,report,findingId}:{items:EvidenceItem[];report:Report;findingId:string}){
 const [limit,setLimit]=useState(20);
 const pageURL=safeURL(report.label,report.label);
 return <div className="element-evidence">
  <div className="element-evidence-heading"><div><h4>Affected elements & source context</h4><p>Read the element and location first. Technical selectors describe this audit snapshot and may change after an edit.</p></div><span>{Math.min(limit,items.length)} of {items.length} shown</span></div>
  {items.slice(0,limit).map((e,i)=>{
   const heading=report.headings.findIndex(h=>h.selector===e.selector);
   const issue=findingId==='heading-order'?report.headingIssues?.find(h=>h.index===heading+1):undefined;
   const asset=e.asset?safeURL(e.asset,report.label):null;
   const anchored=e.stableId||e.sectionAnchor;
   const pageLink=pageURL?(anchored?`${pageURL.split('#')[0]}#${encodeURIComponent(anchored)}`:pageURL):null;
   const isLink=e.element==='a',isImage=e.element==='img',isHeading=/^h[1-6]$/.test(e.element),isHead=e.classification==='head';
   const identity=e.text||e.accessibleName||e.attributes?.alt||e.attributes?.content||e.attributes?.href||e.asset||e.attributes?.src||e.attributes?.name||e.attributes?.property||e.attributes?.type||e.attributes?.placeholder||e.attributes?.value||e.attributes?.title||(e.kind==='absence'?'Expected element not found':'No visible text');
   const path=e.sectionPath?.length?e.sectionPath.join(' → '):locationName(e);
   return <article className={'element-preview'+(issue?' element-preview--heading-problem':'')} key={(e.selector||e.element)+'-'+i}>
    <div className="element-preview-label"><span>Affected element · {elementName(e.element)}</span><strong>{issue?'Heading structure to review':locationName(e)}</strong></div>
    <div className="evidence-identity"><strong>{identity}</strong><span>{e.kind==='absence'?'Expected element not found':`<${e.element}>`}</span></div>
    <dl className="evidence-facts">
     {(isLink||e.element==='button'||e.element==='input')&&<><div><dt>Visible text</dt><dd>{e.text||'No visible text'}</dd></div><div><dt>Accessible name</dt><dd>{e.accessibleName?`${e.accessibleName} (${e.nameSource||'detected'})`:'None detected in initial HTML'}</dd></div></>}
     {isLink&&<div><dt>Destination</dt><dd><code>{e.attributes?.href??'Not present'}</code></dd></div>}
     {isImage&&<><div><dt>Alt text</dt><dd>{e.attributes&&'alt' in e.attributes?e.attributes.alt||'Empty alt attribute':'Missing alt attribute'}</dd></div><div><dt>Source</dt><dd><code>{e.asset||e.attributes?.src||'Not present'}</code></dd></div><div><dt>Declared dimensions</dt><dd>{e.attributes?.width&&e.attributes?.height?`${e.attributes.width} × ${e.attributes.height}`:'Not detected in HTML'}</dd></div></>}
     {isHeading&&<div><dt>Heading</dt><dd>{e.element.toUpperCase()}: {e.text||'Empty heading'}</dd></div>}
     {e.element==='input'&&<div><dt>Input identity</dt><dd>{e.attributes?.name||e.attributes?.placeholder||e.attributes?.type||'Not detected'}</dd></div>}
     {e.element==='meta'&&<><div><dt>Meta tag</dt><dd>{e.attributes?.name||e.attributes?.property||e.attributes?.['http-equiv']||'Not detected'}</dd></div><div><dt>Current value</dt><dd>{e.attributes?.content||'Empty or not detected'}</dd></div></>}
     {e.element==='link'&&<><div><dt>Relationship</dt><dd>{e.attributes?.rel||'Not detected'}</dd></div><div><dt>URL</dt><dd>{e.attributes?.href||'Empty or not detected'}</dd></div></>}
     {e.element==='script'&&<><div><dt>Structured data format</dt><dd>{e.attributes?.type||'Not detected'}</dd></div><div><dt>Schema type</dt><dd>{schemaType(e.snippet)||'Not detected in captured JSON-LD'}</dd></div></>}
     <div><dt>Location</dt><dd>{path}</dd></div>
     <div><dt>Nearest heading</dt><dd>{e.nearestHeading?`H${e.nearestHeading.level}: ${e.nearestHeading.text}`:'Not determined'}</dd></div>
     {e.context&&e.context!==e.text&&<div><dt>Nearby context</dt><dd>{e.context}</dd></div>}
    </dl>
    {issue&&heading>0&&<HeadingIssueCue actual={issue.actual} previous={report.headings[heading-1].level} previousText={report.headings[heading-1].text} expected={issue.expected}/>}
    {isImage&&(asset?<a className="element-image-preview" href={asset} target="_blank" rel="noreferrer"><img src={asset} alt={`Preview of affected image: ${identity}`} loading="lazy"/></a>:<p className="evidence-preview-unavailable">Image preview unavailable. Source details are shown above.</p>)}
    {!isImage&&!isHead&&<div className="evidence-dom-preview"><strong>DOM context preview</strong><p>{e.context||e.text||'No surrounding text was captured.'}</p><small>Visual preview unavailable; this is captured source text, not a screenshot.</small></div>}
    <div className="element-preview-actions">{pageLink&&<a href={pageLink} target="_blank" rel="noreferrer">{anchored?'View in page at captured section':'Open audited page'} ↗</a>}{asset&&<a href={asset} target="_blank" rel="noreferrer">Open image ↗</a>}</div>
    {findingId==='link-href'&&isLink&&<p className="evidence-interpretation">If this link triggers an action, a button may fit better. If it navigates, use a real destination URL. Check the page behavior before changing it.</p>}
    <details className="evidence-technical"><summary>Technical details</summary><div><strong>CSS selector</strong><code>{e.selector||e.expectedSelector||'Not available'}</code>{e.stableId&&<p>Element ID: <code>{e.stableId}</code></p>}{e.stableHint&&<p>Data identifier: <code>{e.stableHint}</code></p>}{e.sourceOrder&&<p>DOM source order: {e.sourceOrder}</p>}{e.fingerprint&&<p>Snapshot fingerprint: <code>{e.fingerprint}</code></p>}<p>Selector reflects the audited HTML and is not guaranteed to remain valid.</p><strong>Actual HTML snippet{e.snippetTruncated?' (truncated)':''}</strong>{e.snippet?<pre><code>{snippetText(e.snippet)}</code></pre>:<p>Unavailable in captured DOM</p>}</div></details>
   </article>;
  })}
  {items.length>limit&&<button className="secondary" onClick={()=>setLimit(n=>n+20)}>Show 20 more elements</button>}
 </div>;
}
