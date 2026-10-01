import {owner,ownedRun,runPages,routeError} from '../../../../../lib/history';
import {ownedProject} from '../../../../../lib/projects';
import {compareRuns} from '../../../../../lib/project-analysis';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params,user=owner(request);await ownedProject(id,user);const query=new URL(request.url).searchParams,a=query.get('before'),b=query.get('after');if(!a||!b||a===b)throw Error('Select two different audit runs.');const before=await ownedRun(a,user,id),after=await ownedRun(b,user,id);return Response.json({comparison:compareRuns({run:before,pages:await runPages(a)},{run:after,pages:await runPages(b)})});}catch(e){return routeError(e);}}
