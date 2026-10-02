import {database} from '../db';
import {PublicError} from './app-errors';
export function identity(request:Request){
 const id=request.headers.get('oai-authenticated-user-id');if(!id)throw new PublicError('Sign in to continue. Your session may have expired.',401,'SIGN_IN_REQUIRED');
 const email=request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase()||null;
 let name='';if(request.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8')try{name=decodeURIComponent(request.headers.get('oai-authenticated-user-full-name')||'');}catch{}
 return{id,email,name:name.slice(0,120)};
}
export async function syncAccount(request:Request){const user=identity(request),now=new Date().toISOString();await database().prepare(`INSERT INTO accounts (id,email,name,company,timezone,image,created,updated) VALUES (?,?,?,'','UTC','',?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,updated=excluded.updated`).bind(user.id,user.email,user.name,now,now).run();await database().prepare("INSERT OR IGNORE INTO project_members (id,project,user,role,created) SELECT 'owner:'||id,id,owner,'owner',created FROM projects WHERE owner=?").bind(user.id).run();return user;}
export function recipientEmail(value:unknown){if(typeof value!=='string'||value.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(value.trim()))throw new PublicError('Enter a valid recipient email.');return value.trim().toLowerCase();}
