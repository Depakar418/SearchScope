import {database} from '../db';
import type {PageAudit,Run} from './history';

// A manifest references immutable revisions; it does not duplicate report/evidence blobs.
export function snapshotStatements(run:string,provenance='completed audit'){
 const db=database();
 return [db.prepare(`INSERT OR IGNORE INTO audit_revisions (id,run,url,audited,status,error,fetch,report)
 SELECT 'snapshot:'||p.run||':'||p.id||':'||p.audited,p.run,p.url,p.audited,p.status,p.error,p.fetch,p.report FROM page_audits p
 WHERE p.run=? AND NOT EXISTS (SELECT 1 FROM audit_revisions r WHERE r.run=p.run AND r.url=p.url AND r.audited=p.audited AND r.report IS p.report AND r.error IS p.error AND r.fetch IS p.fetch)` ).bind(run),
 db.prepare(`INSERT OR IGNORE INTO audit_snapshots (run,sealed,provenance,inventory,selected,config,manifest)
 SELECT id,COALESCE(finished,created),?,inventory,selected,config,
 (SELECT json_group_array(json_object('revision',(SELECT r.id FROM audit_revisions r WHERE r.run=p.run AND r.url=p.url AND r.audited=p.audited AND r.report IS p.report AND r.error IS p.error AND r.fetch IS p.fetch ORDER BY r.id DESC LIMIT 1),'type',p.type,'typeSource',p.type_source)) FROM page_audits p WHERE p.run=a.id)
 FROM audit_runs a WHERE id=? AND status='complete'`).bind(provenance,run)];
}
export async function completedSnapshot(run:Run){
 const db=database();
 let row=await db.prepare('SELECT * FROM audit_snapshots WHERE run=?').bind(run.id).first<Record<string,string>>();
 if(!row){
  if(run.status!=='complete')throw Error('Only completed audits can be compared or opened as snapshots.');
  await db.batch(snapshotStatements(run.id,'Legacy baseline captured from currently stored results; earlier overwritten states cannot be reconstructed.'));
  row=await db.prepare('SELECT * FROM audit_snapshots WHERE run=?').bind(run.id).first<Record<string,string>>();
 }
 if(!row)throw Error('Audit snapshot is temporarily unavailable.');
 const entries=JSON.parse(row.manifest) as {revision:string;type:string;typeSource:string}[];
 const rows=await db.prepare(`SELECT r.*,json_extract(m.value,'$.type') AS type,json_extract(m.value,'$.typeSource') AS type_source
 FROM audit_snapshots s,json_each(s.manifest) m JOIN audit_revisions r ON r.id=json_extract(m.value,'$.revision') AND r.run=s.run
 WHERE s.run=? ORDER BY r.url`).bind(run.id).all<Record<string,string|null>>();
 if(rows.results.length!==entries.length)throw Error('Stored snapshot is incomplete; historical evidence could not be loaded.');
 const pages:PageAudit[]=rows.results.map(r=>({id:r.id!,url:r.url!,audited:r.audited!,status:r.status as PageAudit['status'],error:r.error,type:r.type!,typeSource:r.type_source!,fetch:r.fetch?JSON.parse(r.fetch):null,report:r.report?JSON.parse(r.report):null}));
 return {run:{...run,status:'complete',finished:row.sealed,inventory:JSON.parse(row.inventory),selected:JSON.parse(row.selected),config:row.config?JSON.parse(row.config):null},pages,snapshot:{sealed:row.sealed,provenance:row.provenance,immutable:true}};
}
