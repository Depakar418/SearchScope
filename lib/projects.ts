import {PublicError} from './app-errors';
import {database} from '../db';
import {normalizeURL,websiteOrigin} from './url-normalization';
export type Project={id:string;owner?:string;role?:'owner'|'admin'|'editor'|'viewer';name:string;type:'website';site:string;description:string;status:string;created:string;updated:string;lastAudit?:string|null;audits?:number;latestScores?:Record<string,number|null>|null};
export async function ownedProject(id:string,user:string,permission:'read'|'edit'|'manage'|'owner'='read'){
 const p=await database().prepare(`SELECT p.*,CASE WHEN p.owner=? THEN 'owner' ELSE m.role END AS role FROM projects p LEFT JOIN project_members m ON m.project=p.id AND m.user=? WHERE p.id=? AND (p.owner=? OR m.role IN ('admin','editor','viewer'))`).bind(user,user,id,user).first<Project>();
 if(!p)throw new PublicError('Project not found or you do not have access.',404,'PROJECT_NOT_FOUND');
 const allowed=permission==='read'?['owner','admin','editor','viewer']:permission==='edit'?['owner','admin','editor']:permission==='manage'?['owner','admin']:['owner'];
 if(!allowed.includes(p.role!))throw new PublicError('Access denied. Your project role does not allow this action.',403,'ACCESS_DENIED');return p;
}
export function projectInput(input:Record<string,unknown>){if(input.type&&input.type!=='website')throw new PublicError('Only Website projects are supported.');const name=typeof input.name==='string'?input.name.trim():'';const description=typeof input.description==='string'?input.description.trim():'';if(!name||name.length>100||typeof input.site!=='string'||input.site.length>2048||description.length>2000)throw new PublicError('Enter a project name, website URL and description under 2,000 characters.');return{name,site:websiteOrigin(input.site),description};}
/** Explicit, owner-scoped legacy import; malformed sites remain unassigned. Idempotent and atomic. */
export async function importLegacy(user:string){
 const db=database();const rows=await db.prepare('SELECT id,site,created FROM audit_runs WHERE owner=? AND project IS NULL').bind(user).all<{id:string;site:string;created:string}>();let imported=0;const ambiguous:string[]=[];
 const groups=new Map<string,typeof rows.results>();for(const row of rows.results||[]){try{const site=new URL(normalizeURL(row.site)).origin;groups.set(site,[...(groups.get(site)||[]),row]);}catch{ambiguous.push(row.id);}}
 for(const [site,runs] of groups){const existing=await db.prepare('SELECT id FROM projects WHERE owner=? AND site=?').bind(user,site).first<{id:string}>();const id=existing?.id||crypto.randomUUID();const now=new Date().toISOString();const statements=[];if(!existing)statements.push(db.prepare('INSERT INTO projects (id,owner,name,type,site,description,status,created,updated) VALUES (?,?,?,\'website\',?,\'Imported existing audits\',\'active\',?,?)').bind(id,user,new URL(site).hostname,site,runs[0].created,now));for(const r of runs)statements.push(db.prepare('UPDATE audit_runs SET project=? WHERE id=? AND owner=? AND project IS NULL').bind(id,r.id,user));await db.batch(statements);imported+=runs.length;}
 return{imported,ambiguous};
}
