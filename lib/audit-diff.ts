import type {Report} from './audit';
export function auditDiff(before:Report|null,after:Report|null){
 if(!before||!after)return {baseline:!before,resolved:[] as string[],introduced:[] as string[],scoreChanges:null};
 if(before.version!==after.version||before.keyword!==after.keyword)return {baseline:false,scopeChanged:true,resolved:[] as string[],introduced:[] as string[],scoreChanges:null};
 const issue=(r:Report)=>new Set(r.checks.filter(c=>['error','warning','opportunity'].includes(c.severity)).map(c=>c.id));const a=issue(before),b=issue(after);
 return {baseline:false,resolved:[...a].filter(id=>!b.has(id)&&after.checks.find(c=>c.id===id)?.severity==='pass'),introduced:[...b].filter(id=>!a.has(id)),scoreChanges:Object.fromEntries((['SEO','AEO','GEO'] as const).map(c=>[c,before.scores[c]===null||after.scores[c]===null?null:after.scores[c]!-before.scores[c]!]))};
}
