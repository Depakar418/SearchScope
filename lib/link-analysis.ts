import type {Report} from './audit';
import {publicFetch,robotPolicy,type RedirectHop} from './web-fetch';
import {publicURL,robotsAllowed} from './url-safety';
export type LinkResult={url:string;internal:boolean;status:number|null;state:'ok'|'broken'|'http-error'|'restricted'|'unverified'|'unchecked';finalURL:string|null;redirects:RedirectHop[];error:string|null;checkedAt:string|null;method:string|null};
export async function checkLinks(report:Report,{maxLinks=20,budgetMs=15000}:{maxLinks?:number;budgetMs?:number}={}){
 const unique=new Map<string,boolean>();for(const link of report.linkInventory||[])if(link.url&&link.internal!==null)unique.set(link.url,link.internal);
 const deadline=Date.now()+budgetMs,policies=new Map<string,Promise<string>>();
 const beforeRequest=async(u:URL)=>{let policy=policies.get(u.origin);if(!policy){policy=robotPolicy(u);policies.set(u.origin,policy);}if(!robotsAllowed(await policy,u.pathname+u.search))throw Error('robots.txt disallows link verification.');};
 const results:LinkResult[]=[];
 for(const [url,internal] of unique){const result:LinkResult={url,internal,status:null,state:'unchecked',finalURL:null,redirects:[],error:null,checkedAt:null,method:null};results.push(result);if(results.length>maxLinks||Date.now()>=deadline){result.error='Per-page link verification budget reached.';continue;}
  try{publicURL(url);result.method='HEAD';let fetched=await publicFetch(url,4000,{method:'HEAD',beforeRequest,deadline});if([405,501].includes(fetched.r.status)){await fetched.r.body?.cancel();result.method='GET';fetched=await publicFetch(url,4000,{beforeRequest,deadline});}result.status=fetched.r.status;result.finalURL=fetched.u.href;result.redirects=fetched.redirects;result.checkedAt=new Date().toISOString();result.state=[404,410].includes(result.status)?'broken':[401,403,429].includes(result.status)?'restricted':result.status>=400?'http-error':result.status>=200&&result.status<300?'ok':'unverified';await fetched.r.body?.cancel();
  }catch(e){result.state='unverified';result.error=e instanceof Error?e.message:'Link could not be verified.';result.redirects=(e as {redirects?:RedirectHop[]})?.redirects||[];result.checkedAt=new Date().toISOString();}
 }return results;
}
