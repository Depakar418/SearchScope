import type {Report} from './audit';
// Versioned projection over the stored extraction, not a second parser or stored blob.
// Unknown historical fields remain null. Incoming links must come from the audit graph.
export function normalizedPage(report:Report,incoming:string[]|null=null){
 const doc=report.pageDocument,context=report.auditContext;
 const meta=(key:string)=>doc?.meta.filter(m=>(m.name||m.property||'').toLowerCase()===key).map(m=>m.content||'')??null;
 return {documentVersion:doc?.documentVersion||'legacy',projectId:context?.projectId??null,auditId:context?.auditId??null,pageId:context?.pageId??null,
  url:report.label,requestedUrl:report.fetch?.requestedURL||context?.requestedURL||report.label,finalUrl:report.fetch?.finalURL??null,pageType:context?.pageType??null,
  metadata:{title:report.title,description:report.description,canonical:doc?.canonical??null,robots:meta('robots'),xRobotsTag:report.xRobotsTag??null,language:doc?.language??null,viewport:meta('viewport'),openGraph:doc?.meta.filter(m=>m.property?.startsWith('og:'))??null},
  content:doc?.content??null,extraction:report.extraction??null,
  links:{internal:doc?.links.filter(l=>l.type==='internal')??null,external:doc?.links.filter(l=>l.type==='external')??null,incoming,outgoing:doc?.links??null,validation:report.linkResults??null},
  images:doc?.images??null,structuredData:doc?.structuredData??null,
  crawl:{depth:context?.depth??null,discoverySource:context?.discoverySource??null,referringUrl:context?.referringURL??null,status:report.fetch?'fetched':'not measured',httpStatus:report.fetch?.status??null,redirected:report.fetch?report.fetch.redirects.length>0:null,redirectChain:report.fetch?.redirects??null},
  source:{extractedAt:report.date,reportVersion:report.version,mode:report.mode}};
}
export type NormalizedPageDocument=ReturnType<typeof normalizedPage>;
