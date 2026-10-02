export class PublicError extends Error {constructor(message:string,public status=400,public code='INVALID_REQUEST'){super(message);}}
export function mutationOrigin(request:Request){
 const origin=request.headers.get('origin');
 if(request.headers.get('sec-fetch-site')==='cross-site'||origin&&origin!==new URL(request.url).origin)throw new PublicError('This request came from another website. Return to SearchScope and try again.',403,'CROSS_SITE_REQUEST');
}
export const ERROR_STATES:Record<number,{title:string;description:string}>={
 400:{title:'Check your request',description:'Some information is missing or invalid. Review the form and try again.'},
 401:{title:'Sign in to continue',description:'Your sign-in is missing or has expired. Sign in again to access your projects.'},
 403:{title:'Access denied',description:'Your account does not have permission for this action. Ask the project owner for access.'},
 404:{title:'Not found',description:'This page or project is unavailable, or your account does not have access.'},
 408:{title:'Request timed out',description:'The request took too long. Try again when your connection is ready.'},
 429:{title:'Please wait before trying again',description:'Too many requests arrived at once. Wait briefly, then retry.'},
 500:{title:'Something went wrong',description:'SearchScope could not complete this request. Your saved data has not been intentionally removed.'},
 502:{title:'Service connection failed',description:'A required service did not respond correctly. Please try again shortly.'},
 503:{title:'Temporarily unavailable',description:'SearchScope cannot reach a required service right now. Try again shortly.'},
 504:{title:'Service timed out',description:'A required service took too long to respond. Please try again shortly.'}
};
