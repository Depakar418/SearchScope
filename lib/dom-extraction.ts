import {parse,serializeOuter,type DefaultTreeAdapterTypes as T} from 'parse5';
export type SectionKind='content'|'navigation'|'footer'|'sidebar'|'cookie-banner'|'hidden'|'head';
export type ElementRecord={tag:string;rawText:string;attrs:Record<string,string>;selector:string;snippet:string;text:string;context:string;section:SectionKind;sectionLabel:string;index:number};
export type EvidenceItem={kind:'element'|'absence'|'document';element:string;selector:string|null;snippet:string;text:string;context:string;section:string;pageURL?:string;classification?:SectionKind|'document';attributes?:Record<string,string>;snippetTruncated?:boolean;expectedSelector?:string;asset?:string};
const ignored=new Set(['script','style','template','noscript']);
const element=(node:T.Node):node is T.Element=>'tagName' in node;
const attrs=(node:T.Element)=>Object.fromEntries(node.attrs.map(a=>[a.name,a.value]));
function ownSection(node:T.Element):SectionKind|null{
 const a=attrs(node),role=a.role?.toLowerCase(),tokens=`${a.id||''} ${a.class||''}`.toLowerCase();
 if('hidden' in a||a['aria-hidden']==='true'||/display\s*:\s*none|visibility\s*:\s*(hidden|collapse)/i.test(a.style||'')||ignored.has(node.tagName))return 'hidden';
 if(node.tagName==='head')return 'head';
 if(/(cookie|consent)[-_ ]*(banner|notice|popup|modal|dialog|manager|overlay)|onetrust-banner-sdk|cookiebot|cookieyes/.test(tokens))return 'cookie-banner';
 if(node.tagName==='nav'||role==='navigation'||/(^|[\s_-])breadcrumbs?([\s_-]|$)/.test(tokens))return 'navigation';
 if(role==='banner')return 'navigation';
 if(node.tagName==='header'){let parent:T.Node|null=node.parentNode;let contentHeader=false;while(parent&&element(parent)){if(['main','article'].includes(parent.tagName)){contentHeader=true;break;}parent=parent.parentNode;}if(!contentHeader)return 'navigation';}
 if(node.tagName==='footer'||role==='contentinfo')return 'footer';
 if(node.tagName==='aside'||role==='complementary'||/(^|[\s_-])sidebar([\s_-]|$)/.test(tokens))return 'sidebar';
 return null;
}
function section(node:T.Element):SectionKind{
 let current:T.Node|null=node,found:SectionKind='content';
 while(current&&element(current)){const kind=ownSection(current);if(kind==='hidden')return kind;if(kind&&found==='content')found=kind;current=current.parentNode;}
 return found;
}
function text(node:T.Node,contentOnly=false):string{
 if(element(node)&&(ignored.has(node.tagName)||section(node)==='hidden'||contentOnly&&section(node)!=='content'))return '';
 if('value' in node&&node.nodeName==='#text')return node.value;
 return 'childNodes' in node?node.childNodes.map(n=>text(n,contentOnly)).join(' '):'';
}
const normalize=(value:string)=>value.replace(/\s+/g,' ').trim();
function locator(node:T.Element):string{
 const parts:string[]=[];let current:T.Node|null=node;
 while(current&&element(current)){
  const siblings=current.parentNode&&'childNodes' in current.parentNode?current.parentNode.childNodes.filter(element).filter(e=>e.tagName===current!.nodeName):[];
  parts.unshift(`${current.tagName}:nth-of-type(${Math.max(1,siblings.indexOf(current)+1)})`);current=current.parentNode;
 }
 return parts.join(' > ');
}
export function extractDocument(html:string,pageURL=''){
 const document=parse(html,{sourceCodeLocationInfo:true});const nodes:T.Element[]=[];
 const visit=(node:T.Node)=>{if(element(node))nodes.push(node);if('childNodes' in node)node.childNodes.forEach(visit);};visit(document);
 const candidates=nodes.filter(n=>section(n)==='content'&&(n.tagName==='main'||attrs(n).role==='main'||n.tagName==='article'));
 const roots=candidates.filter(n=>!candidates.some(other=>other!==n&&contains(other,n)));
 const fallback=nodes.find(n=>n.tagName==='body')!;const contentRoots=roots.length?roots:[fallback];
 const inContent=(n:T.Element)=>section(n)==='content'&&contentRoots.some(root=>contains(root,n));
 const elements:ElementRecord[]=nodes.map((n,index)=>{const a=attrs(n),s=section(n);let parent:T.Node|null=n;let label=s==='head'?'Document head':s==='content'?'Main content':s;while(parent&&element(parent)){if(['section','article','main','nav','aside','footer'].includes(parent.tagName)){const pa=attrs(parent);label=pa['aria-label']||pa.id||parent.tagName;break;}parent=parent.parentNode;}return {tag:n.tagName,attrs:a,selector:locator(n),rawText:n.childNodes.filter(c=>c.nodeName==='#text').map(c=>'value' in c?c.value:'').join(''),snippet:n.sourceCodeLocation?html.slice(n.sourceCodeLocation.startOffset,Math.min(n.sourceCodeLocation.endOffset,n.sourceCodeLocation.startOffset+2000)):serializeOuter(n).slice(0,2000),text:normalize(text(n)),context:normalize(text(n.parentNode||n)).slice(0,400),section:s,sectionLabel:label,index};});
 const contentElements=elements.filter((_,i)=>inContent(nodes[i]));
 const visibleElements=elements.filter(e=>e.section!=='hidden'&&e.section!=='head');
 const mainText=normalize(contentRoots.map(n=>text(n,true)).join(' '));
 const headings=contentElements.filter(e=>/^h[1-6]$/.test(e.tag)).map(e=>({level:+e.tag[1],text:e.text,selector:e.selector,section:e.sectionLabel,context:e.context}));
 let baseURL=pageURL;const base=elements.find(e=>e.tag==='base'&&e.attrs.href);try{if(base)baseURL=new URL(base.attrs.href,pageURL).href;}catch{}
 const links=visibleElements.filter(e=>e.tag==='a'&&'href' in e.attrs).map(e=>{let url:string|null=null;let internal:boolean|null=null;const raw=e.attrs.href.trim();let type='non-page';try{const u=new URL(raw,baseURL);if(['http:','https:'].includes(u.protocol)){u.hash='';url=u.href;internal=u.origin===new URL(pageURL).origin;type=raw.startsWith('#')?'fragment':internal?'internal':'external';}else if(['mailto:','tel:','javascript:'].includes(u.protocol))type=u.protocol.slice(0,-1);}catch{}return {...e,url,internal,type,sourcePage:pageURL,rawHref:e.attrs.href,rel:e.attrs.rel||'',target:e.attrs.target||''};});
 const headingInventory=elements.filter(e=>/^h[1-6]$/.test(e.tag)).map(e=>({level:+e.tag[1],text:e.text,selector:e.selector,section:e.sectionLabel,classification:e.section,context:e.context,order:e.index,content:contentElements.includes(e)}));
 // Source-ordered blocks share the same DOM and boilerplate classification as checks.
 const contentHeadings=contentElements.filter(e=>/^h[1-6]$/.test(e.tag));
 const blocks=contentElements.filter(e=>['section','article','p','ul','ol','dl','table'].includes(e.tag)).map(e=>{
  const node=nodes[e.index];const preceding=contentHeadings.filter(h=>h.index<e.index).at(-1);
  const descendants=['ul','ol','dl','table'].includes(e.tag)?contentElements.filter(child=>child.index!==e.index&&contains(node,nodes[child.index])):[];
  return {...asEvidence(e),order:e.index,headingSelector:preceding?.selector||null,
   text:normalize(text(node,true)),
   items:['ul','ol','dl'].includes(e.tag)?descendants.filter(child=>['li','dt','dd'].includes(child.tag)&&nodes[child.index].parentNode===node).map(child=>({text:normalize(text(nodes[child.index],true)),selector:child.selector})):undefined,
   rows:e.tag==='table'?descendants.filter(child=>child.tag==='tr'&&nearest(nodes[child.index],'table')===node).map(row=>descendants.filter(cell=>['td','th'].includes(cell.tag)&&nodes[cell.index].parentNode===nodes[row.index]).map(cell=>({text:normalize(text(nodes[cell.index],true)),selector:cell.selector,header:cell.tag==='th'}))):undefined};
 });
 const headingContext=contentHeadings.map((h,i)=>({selector:h.selector,level:+h.tag[1],text:h.text,section:h.sectionLabel,precedingHeading:contentHeadings[i-1]?.selector||null,parentHeading:contentHeadings.slice(0,i).reverse().find(p=>+p.tag[1]<+h.tag[1])?.selector||null,followingContent:blocks.filter(b=>b.order>h.index&&b.order<(contentHeadings[i+1]?.index??Infinity)&&b.element!=='section'&&b.element!=='article').map(b=>b.selector)}));
 const content={mainContent:mainText,headings:headingContext,sections:blocks.filter(b=>['section','article'].includes(b.element)),paragraphs:blocks.filter(b=>b.element==='p'),lists:blocks.filter(b=>['ul','ol','dl'].includes(b.element)),tables:blocks.filter(b=>b.element==='table'),questions:headingContext.filter(h=>/\?\s*$/.test(h.text))};
 const chrome=Object.fromEntries(['navigation','footer','sidebar','cookie-banner'].map(s=>[s,normalize(nodes.filter(n=>section(n)===s&&(!element(n.parentNode!)||section(n.parentNode as T.Element)!==s)).map(n=>text(n)).join(' '))]));
 const confidence=roots.length?'high':'medium';
 const pageDocument={url:pageURL,baseURL,title:elements.find(e=>e.tag==='title')?.text||'',meta:elements.filter(e=>e.tag==='meta').map(e=>e.attrs),canonical:elements.filter(e=>e.tag==='link'&&e.attrs.rel?.split(/\s+/).includes('canonical')).map(e=>e.attrs.href||''),mainText,chrome,headings:headingInventory,images:visibleElements.filter(e=>e.tag==='img'),links,structuredData:elements.filter(e=>e.tag==='script'&&e.attrs.type==='application/ld+json').map(e=>e.rawText),confidence,method:roots.length?'semantic landmarks':'body excluding known boilerplate'};
 return {elements,contentElements,visibleElements,mainText,headings,headingInventory,pageDocument:{...pageDocument,documentVersion:'1.1',content,language:elements.find(e=>e.tag==='html')?.attrs.lang||null,contentSelector:contentRoots.map(locator).join(', ')},links,confidence,contentSelector:contentRoots.map(locator).join(', '),contentMethod:roots.length?'semantic landmarks':'body excluding known boilerplate',excludedCounts:Object.fromEntries(['navigation','footer','sidebar','cookie-banner','hidden'].map(s=>[s,elements.filter(e=>e.section===s).length])),notes:['Initial HTML only. External CSS and JavaScript visibility are not evaluated.','Cookie-banner and fallback content classification are structural heuristics.']};
}
function nearest(node:T.Element,tag:string){let parent:T.Node|null=node.parentNode;while(parent&&element(parent)){if(parent.tagName===tag)return parent;parent=parent.parentNode;}return null;}
function contains(parent:T.Element,node:T.Element){let current:T.Node|null=node;while(current){if(current===parent)return true;current='parentNode' in current?current.parentNode:null;}return false;}
export function asEvidence(e:ElementRecord):EvidenceItem{const candidates=[e.attrs.src,e.attrs['data-src'],e.attrs['data-lazy-src'],e.attrs['data-original'],e.attrs['data-url'],e.attrs['data-srcset']?.split(',')[0].trim().split(/\s+/)[0],e.attrs.srcset?.split(',')[0].trim().split(/\s+/)[0]];return {kind:'element',element:e.tag,selector:e.selector,snippet:e.snippet,snippetTruncated:e.snippet.length>=2000,text:e.text,context:e.context,section:e.sectionLabel,classification:e.section,attributes:e.attrs,asset:e.tag==='img'?candidates.find(v=>v&&!/^data:/i.test(v)):undefined};}
