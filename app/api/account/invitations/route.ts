import {readJSON,routeError} from '../../../../lib/history';
import {acceptInvitation} from '../../../../lib/project-access';
export async function POST(request:Request){try{const input=await readJSON(request);return Response.json(await acceptInvitation(request,String(input.id||''),input.confirm));}catch(e){return routeError(e);}}
