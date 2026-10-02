import {PublicError,mutationOrigin} from '../../../lib/app-errors';
import { auditURL } from '../../../lib/audit-service';
import {owner,routeError} from '../../../lib/history';
import {ownedProject} from '../../../lib/projects';
import { boundedText } from '../../../lib/web-fetch';
export async function POST(request:Request){try{mutationOrigin(request);const {url,keyword='',project}=JSON.parse(await boundedText(new Response(request.body),1100000)) as {url?:unknown;keyword?:unknown;project?:unknown};if(project){if(typeof project!=='string')throw new PublicError('Invalid project.');await ownedProject(project,owner(request),'edit');}if(typeof url!=='string'||typeof keyword!=='string'||keyword.length>200)throw new PublicError('Enter a valid URL and a target phrase under 200 characters.');return Response.json(await auditURL(url,keyword));}catch(e){return routeError(e);}}
