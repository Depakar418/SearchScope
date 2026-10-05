import type {Report} from './audit';
export function auditDiff(before:Report|null,after:Report|null){
 if(!before||!after)return {baseline:!before,resolved:[] as string[],introduced:[] as string[],unchanged:[] as string[],transitions:[] as {checkId:string;before:string;after:string;state:string}[],scoreChanges:null};
 if(before.version!==after.version||before.keyword!==after.keyword)return {baseline:false,scopeChanged:true,resolved:[] as string[],introduced:[] as string[],unchanged:[] as string[],transitions:[] as {checkId:string;before:string;after:string;state:string}[],scoreChanges:null};
 const issue=(r:Report)=>new Set(r.checks.filter(c=>['error','warning','opportunity'].includes(c.severity)).map(c=>c.id));const a=issue(before),b=issue(after);
 const transitions=after.checks.flatMap(c=>{const old=before.checks.find(p=>p.id===c.id);if(!old)return [];const state=a.has(c.id)&&c.status==='pass'?'RESOLVED':b.has(c.id)&&!a.has(c.id)?'NEW':'UNCHANGED';return [{checkId:c.id,before:old.status.toUpperCase(),after:c.status.toUpperCase(),state}];});
 return {baseline:false,unchanged:[...b].filter(id=>a.has(id)),transitions,resolved:[...a].filter(id=>!b.has(id)&&after.checks.find(c=>c.id===id)?.severity==='pass'),introduced:[...b].filter(id=>!a.has(id)),scoreChanges:Object.fromEntries((['SEO','AEO','GEO'] as const).map(c=>[c,before.scores[c]===null||after.scores[c]===null?null:after.scores[c]!-before.scores[c]!]))};
}
