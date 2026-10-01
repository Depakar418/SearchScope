import {parse,serializeOuter,type DefaultTreeAdapterTypes as T} from 'parse5';
export type SectionKind='content'|'navigation'|'footer'|'sidebar'|'cookie-banner'|'hidden'|'head';
export type ElementRecord={tag:string;rawText:string;attrs:Record<string,string>;selector:string;snippet:string;text:string;context:string;section:SectionKind;sectionLabel:string;index:number};
export type EvidenceItem={kind:'element'|'absence'|'document';element:string;selector:string|null;snippet:string;text:string;context:string;section:string;expectedSelector?:string;asset?:string};
const ignored=new Set(['script','style','template','noscript']);
const element=(node:T.Node):node is T.Element=>'tagName' in node;
const attrs=(node:T.Element)=>Object.fromEntries(node.attrs.map(a=>[a.name,a.value]));
function ownSection(node:T.Element):SectionKind|null{
 const a=attrs(node),role=a.role?.toLowerCase(),tokens=`${a.id||''} ${a.class||''}`.toLowerCase();
 if('hidden' in a||a['aria-hidden']==='true'||/display\s*:\s*none|visibility\s*:\s*(hidden|collapse)/i.test(a.style||'')||ignored.has(node.tagName))return 'hidden';
 if(node.tagName==='head')return 'head';
 if(/(cookie|consent)[-_ ]*(banner|notice|popup|modal|dialog|manager|overlay)|onetrust-banner-sdk|cookiebot|cookieyes/.test(tokens))return 'cookie-banner';
 if(node.tagName==='nav'||role==='navigation')return 'navigation';
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
 const links=visibleElements.filter(e=>e.tag==='a'&&'href' in e.attrs).map(e=>{let url:string|null=null;let internal:boolean|null=null;try{const u=new URL(e.attrs.href,baseURL);if(['http:','https:'].includes(u.protocol)){u.hash='';url=u.href;internal=u.origin===new URL(pageURL).origin;}}catch{}return {...e,url,internal};});
 return {elements,contentElements,visibleElements,mainText,headings,links,contentSelector:contentRoots.map(locator).join(', '),contentMethod:roots.length?'semantic landmarks':'body excluding known boilerplate',excludedCounts:Object.fromEntries(['navigation','footer','sidebar','cookie-banner','hidden'].map(s=>[s,elements.filter(e=>e.section===s).length])),notes:['Initial HTML only. External CSS and JavaScript visibility are not evaluated.','Cookie-banner and fallback content classification are structural heuristics.']};
}
function contains(parent:T.Element,node:T.Element){let current:T.Node|null=node;while(current){if(current===parent)return true;current='parentNode' in current?current.parentNode:null;}return false;}
export function asEvidence(e:ElementRecord):EvidenceItem{const candidates=[e.attrs.src,e.attrs['data-src'],e.attrs['data-lazy-src'],e.attrs['data-original'],e.attrs.srcset?.split(',')[0].trim().split(/\s+/)[0]];return {kind:'element',element:e.tag,selector:e.selector,snippet:e.snippet,text:e.text,context:e.context,section:e.sectionLabel,asset:e.tag==='img'?candidates.find(v=>v&&!/^data:/i.test(v)):undefined};}
