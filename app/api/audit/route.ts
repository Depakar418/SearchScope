import { auditURL } from '../../../lib/audit-service';
import { boundedText } from '../../../lib/web-fetch';
export async function POST(request:Request){try{const {url,keyword=''}=JSON.parse(await boundedText(new Response(request.body),1100000)) as {url?:unknown;keyword?:unknown};if(typeof url!=='string'||typeof keyword!=='string'||keyword.length>200)throw new Error('Enter a valid URL and a target phrase under 200 characters.');return Response.json(await auditURL(url,keyword));}catch(e){return Response.json({error:e instanceof Error?e.message:'Unable to audit this page.'},{status:400});}}
