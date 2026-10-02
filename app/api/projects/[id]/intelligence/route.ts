import {database} from '../../../../../db';
import {PublicError,mutationOrigin} from '../../../../../lib/app-errors';
import {completedSnapshot} from '../../../../../lib/audit-snapshot';
import {websiteIntelligence,type PageIntelligence} from '../../../../../lib/content-intelligence';
import {owner,ownedRun,readJSON,routeError,runPages} from '../../../../../lib/history';

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params,user=owner(request),query=new URL(request.url).searchParams,runId=query.get('run');
  if(!runId)throw new PublicError('Choose an audit to analyze.');
  const run=await ownedRun(runId,user,id);
  const snapshot=query.get('snapshot')==='1';
  const pages=snapshot?(await completedSnapshot(run)).pages:await runPages(runId);
  const ids=pages.filter(p=>p.report&&p.status==='completed').map(p=>p.id);
  // An explicit current-revision join prevents older re-audits from leaking into this view.
  const rows=ids.length?(await database().prepare('SELECT revision,payload FROM page_intelligence WHERE project=? AND run=?').bind(id,runId).all<{revision:string;payload:string}>()).results:[];
  const allowed=new Set(ids);
  const data=rows.filter(r=>allowed.has(r.revision)).map(r=>JSON.parse(r.payload) as PageIntelligence);
  const actions=(await database().prepare('SELECT id,status FROM intelligence_actions WHERE project=? AND revision IN (SELECT revision FROM page_intelligence WHERE project=? AND run=?)').bind(id,id,runId).all<{id:string;status:string}>()).results;
  return Response.json({...websiteIntelligence(run,pages,data),statuses:Object.fromEntries(actions.map(a=>[a.id,a.status]))},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return routeError(e);}
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  mutationOrigin(request);const {id}=await params,user=owner(request),input=await readJSON(request);
  const runId=String(input.run||''),opportunity=String(input.opportunity||''),status=String(input.status||'');
  if(!runId||opportunity.length>200||!['Open','In Progress','Resolved','Dismissed'].includes(status))throw new PublicError('Choose a valid opportunity and status.');
  await ownedRun(runId,user,id,'edit');
  const row=await database().prepare('SELECT revision,payload FROM page_intelligence WHERE project=? AND run=? AND revision=?').bind(id,runId,opportunity.split(':')[0]).first<{revision:string;payload:string}>();
  if(!row||(JSON.parse(row.payload) as PageIntelligence).opportunities.every(o=>o.id!==opportunity))throw new PublicError('Opportunity not found for this audit.',404);
  await database().prepare('INSERT INTO intelligence_actions (id,project,revision,status,actor,updated) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,actor=excluded.actor,updated=excluded.updated WHERE project=excluded.project AND revision=excluded.revision').bind(opportunity,id,row.revision,status,user,new Date().toISOString()).run();
  return Response.json({ok:true,id:opportunity,status});
 }catch(e){return routeError(e);}
}
