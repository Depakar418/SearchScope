/** Preserve meaningful query parameters, scheme and slash distinctions until redirects prove equivalence. */
export function normalizeURL(value:string,base?:string){
 const u=new URL(value,base);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Enter a public HTTP or HTTPS website URL.');
 u.hash='';for(const key of [...u.searchParams.keys()])if(/^utm_/i.test(key)||['gclid','fbclid','msclkid'].includes(key.toLowerCase()))u.searchParams.delete(key);
 // URL handles host casing and default ports. Decode only unreserved path characters.
 u.pathname=u.pathname.replace(/%[0-9a-f]{2}/gi,s=>{const c=String.fromCharCode(parseInt(s.slice(1),16));return /[a-z0-9._~-]/i.test(c)?c:s.toUpperCase();});
 return u.href;
}
export function websiteOrigin(value:string){return new URL(normalizeURL(/^https?:\/\//i.test(value)?value:'https://'+value)).origin;}
