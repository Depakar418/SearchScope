import {owner,readJSON,routeError} from '../../../../../lib/history';
import {accessList,manageAccess} from '../../../../../lib/project-access';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{return Response.json(await accessList((await params).id,owner(request)),{headers:{'Cache-Control':'no-store'}});}catch(e){return routeError(e);}}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{return Response.json(await manageAccess(request,(await params).id,await readJSON(request)));}catch(e){return routeError(e);}}
