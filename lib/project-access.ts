import {database} from '../db';
import {ownedProject} from './projects';
import {syncAccount,recipientEmail} from './accounts';
import {PublicError,mutationOrigin} from './app-errors';
type Invitation={id:string;project:string;email:string;role:string;kind:string;inviter:string;status:string;expires:string;name:string;owner:string};
const roles=['admin','editor','viewer'];
function event(project:string,actor:string,action:string,details:unknown){return database().prepare('INSERT INTO project_events (id,project,actor,action,details,created) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),project,actor,action,JSON.stringify(details),new Date().toISOString());}
export async function accessList(project:string,user:string){
 const p=await ownedProject(project,user),db=database();
 const members=await db.prepare(`SELECT p.owner AS user,'owner' AS role,a.name,a.email FROM projects p LEFT JOIN accounts a ON a.id=p.owner WHERE p.id=? UNION ALL SELECT m.user,m.role,a.name,a.email FROM project_members m LEFT JOIN accounts a ON a.id=m.user WHERE m.project=? AND m.user<>?`).bind(project,project,p.owner).all();
 const manage=['owner','admin'].includes(p.role!);
 const invitations=manage?(await db.prepare("SELECT id,email,role,kind,status,expires,created FROM project_invites WHERE project=? ORDER BY created DESC LIMIT 100").bind(project).all()).results:[];
 const events=manage?(await db.prepare('SELECT actor,action,details,created FROM project_events WHERE project=? ORDER BY created DESC LIMIT 50').bind(project).all()).results:[];
 return{project:p,members:members.results,invitations:invitations.map((i:any)=>({...i,status:i.status==='pending'&&Date.parse(i.expires)<=Date.now()?'expired':i.status})),events};
}
export async function manageAccess(request:Request,project:string,input:Record<string,unknown>){
 mutationOrigin(request);const user=await syncAccount(request),p=await ownedProject(project,user.id,'manage'),db=database(),now=new Date().toISOString();
 if(input.action==='invite'||input.action==='transfer'){
  const transfer=input.action==='transfer';
  if(transfer){await ownedProject(project,user.id,'owner');if(input.confirm!==p.name)throw new PublicError('Type the project name to confirm the transfer invitation.');}
  const email=recipientEmail(input.email),role=transfer?'owner':String(input.role);
  if(!transfer&&!roles.includes(role))throw new PublicError('Choose Admin, Editor or Viewer.');
  if(role==='admin'&&p.role!=='owner')throw new PublicError('Only the owner can invite an Admin.',403,'ACCESS_DENIED');
  if(email===user.email)throw new PublicError('Choose another recipient.');
  if(p.role!=='owner'&&await db.prepare("SELECT id FROM project_invites WHERE project=? AND email=? AND role='admin' AND status='pending'").bind(project,email).first())throw new PublicError('Only the owner may replace an Admin invitation.',403);
  const count=await db.prepare("SELECT COUNT(*) AS total FROM project_invites WHERE project=? AND status='pending' AND expires>?").bind(project,now).first<{total:number}>();if((count?.total||0)>=100)throw new PublicError('There are too many pending invitations. Revoke an older invitation first.',429,'INVITATION_LIMIT');
  const id=crypto.randomUUID(),expires=new Date(Date.now()+7*86400000).toISOString();
  await db.batch([
   db.prepare("UPDATE project_invites SET status='revoked' WHERE project=? AND status='pending' AND ((?='transfer' AND kind='transfer') OR (?='invite' AND kind='membership' AND email=?))").bind(project,input.action,input.action,email),
   db.prepare("INSERT INTO project_invites (id,project,email,role,kind,inviter,status,created,expires) VALUES (?,?,?,?,?,?,'pending',?,?)").bind(id,project,email,role,transfer?'transfer':'membership',user.id,now,expires),
   event(project,user.id,transfer?'transfer_invited':'member_invited',{email,role,invitation:id})
  ]);return{ok:true,invitation:{id,email,expires},link:'/profile?invitation='+encodeURIComponent(id),message:'Invitation created. Share the link with the recipient; no email was sent. They must sign in with the invited email and explicitly accept.'};
 }
 if(input.action==='revoke'){
  const invite=await db.prepare('SELECT kind,role,status FROM project_invites WHERE id=? AND project=?').bind(String(input.invitation),project).first<{kind:string;role:string;status:string}>();if(!invite)throw new PublicError('Invitation not found.',404);
  if((invite.kind==='transfer'||invite.role==='admin')&&p.role!=='owner')throw new PublicError('Only the owner may revoke a transfer or Admin invitation.',403);
  if(invite.status!=='pending')throw new PublicError('This invitation is no longer pending.');
  await db.batch([db.prepare("UPDATE project_invites SET status='revoked' WHERE id=? AND project=? AND status='pending'").bind(String(input.invitation),project),event(project,user.id,'invitation_revoked',{invitation:input.invitation})]);return{ok:true};
 }
 if(input.action==='role'||input.action==='remove'){
  const target=String(input.user||'');if(target===p.owner||target===user.id)throw new PublicError('You cannot change the owner or your own access here.');
  const member=await db.prepare('SELECT role FROM project_members WHERE project=? AND user=?').bind(project,target).first<{role:string}>();if(!member)throw new PublicError('Member not found.',404);
  const role=String(input.role||'');if(input.action==='role'&&!roles.includes(role))throw new PublicError('Choose a valid member role.');
  if(p.role!=='owner'&&(member.role==='admin'||role==='admin'))throw new PublicError('Only the owner may manage Admin roles.',403);
  const statement=input.action==='remove'?db.prepare('DELETE FROM project_members WHERE project=? AND user=?').bind(project,target):db.prepare('UPDATE project_members SET role=? WHERE project=? AND user=?').bind(role,project,target);
  await db.batch([statement,event(project,user.id,input.action==='remove'?'member_removed':'role_changed',{user:target,previous:member.role,role:input.action==='remove'?null:role})]);return{ok:true};
 }
 throw new PublicError('Unknown access action.');
}
export async function acceptInvitation(request:Request,id:string,confirm:unknown){
 mutationOrigin(request);const user=await syncAccount(request),db=database(),now=new Date().toISOString();
 const invite=await db.prepare('SELECT i.*,p.name,p.owner FROM project_invites i JOIN projects p ON p.id=i.project WHERE i.id=? AND i.email=?').bind(id,user.email||'').first<Invitation>();
 if(!invite)throw new PublicError('Invitation not found for this signed-in email. Use the invited account or ask the sender for a new invitation.',404,'INVITATION_NOT_FOUND');
 if(invite.status!=='pending')throw new PublicError('This invitation has already been used or revoked.',400,'INVITATION_USED');
 if(Date.parse(invite.expires)<=Date.now())throw new PublicError('This invitation has expired. Ask the project owner for a new one.',400,'INVITATION_EXPIRED');
 if(confirm!==invite.name)throw new PublicError('Confirm acceptance by typing the project name.');
 if(user.id===invite.owner)throw new PublicError('You already own this project.');
 const transfer=invite.kind==='transfer';if(!transfer&&await db.prepare('SELECT id FROM project_members WHERE project=? AND user=?').bind(invite.project,user.id).first())throw new PublicError('You already have access. Ask the owner to change your role through Access & Members.');
 const inviter=await ownedProject(invite.project,invite.inviter,transfer||invite.role==='admin'?'owner':'manage');
 if(!transfer&&!roles.includes(invite.role))throw new PublicError('This invitation has an invalid role.');
 if(transfer&&await db.prepare('SELECT id FROM projects WHERE owner=? AND site=(SELECT site FROM projects WHERE id=?) AND id<>?').bind(user.id,invite.project,invite.project).first())throw new PublicError('You already own another project for this website. This transfer cannot proceed; neither project has been changed.');
 const acceptance=crypto.randomUUID();
 const guard="EXISTS (SELECT 1 FROM project_invites WHERE id=? AND acceptance=? AND accepted_by=?)";
 const batch=[db.prepare(`UPDATE project_invites SET status='accepted',accepted_by=?,accepted_at=?,acceptance=? WHERE id=? AND status='pending' AND expires>? AND email=? AND (kind='transfer' OR NOT EXISTS (SELECT 1 FROM project_members existing WHERE existing.project=project_invites.project AND existing.user=?)) AND EXISTS (SELECT 1 FROM projects p WHERE p.id=project_invites.project AND (p.owner=project_invites.inviter OR (project_invites.kind='membership' AND project_invites.role IN ('editor','viewer') AND EXISTS (SELECT 1 FROM project_members m WHERE m.project=p.id AND m.user=project_invites.inviter AND m.role='admin'))))`).bind(user.id,now,acceptance,id,now,user.email,user.id)];
 if(transfer){
  batch.push(db.prepare(`UPDATE projects SET owner=?,updated=? WHERE id=? AND owner=? AND ${guard}`).bind(user.id,now,invite.project,inviter.owner,id,acceptance,user.id));
  batch.push(db.prepare(`INSERT INTO project_members (id,project,user,role,created) SELECT ?,?,?,'admin',? WHERE ${guard} ON CONFLICT(project,user) DO UPDATE SET role='admin'`).bind(crypto.randomUUID(),invite.project,inviter.owner,now,id,acceptance,user.id));
 }
 batch.push(db.prepare(`INSERT INTO project_members (id,project,user,role,created) SELECT ?,?,?,?,? WHERE ${guard} ON CONFLICT(project,user) DO UPDATE SET role=excluded.role`).bind(crypto.randomUUID(),invite.project,user.id,invite.role,now,id,acceptance,user.id));
 batch.push(db.prepare(`INSERT INTO project_events (id,project,actor,action,details,created) SELECT ?,?,?,?,?,? WHERE ${guard}`).bind(crypto.randomUUID(),invite.project,user.id,transfer?'ownership_transferred':'invitation_accepted',JSON.stringify({invitation:id,previousOwner:transfer?invite.owner:undefined,newOwner:transfer?user.id:undefined,role:invite.role}),now,id,acceptance,user.id));
 await db.batch(batch);
 const accepted=await db.prepare('SELECT acceptance FROM project_invites WHERE id=?').bind(id).first<{acceptance:string}>();if(accepted?.acceptance!==acceptance)throw new PublicError('The invitation changed or was already used. Reload your invitations.',400,'INVITATION_CHANGED');
 return{ok:true,project:invite.project,message:transfer?'Ownership transferred. All audit history is preserved. The previous owner is now an Admin.':'Project access accepted.'};
}
