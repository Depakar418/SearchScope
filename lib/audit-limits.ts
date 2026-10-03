/** Current testing entitlement. No billing provider or account plan is connected yet. */
export const AUDIT_LIMITS={label:'Pro testing',pageLimit:200,choices:[10,25,50,100,200] as readonly number[],discoverySafetyCap:1000,recursiveSafetyCap:200} as const;
export function permittedPageLimit(value:unknown):value is number{return typeof value==='number'&&AUDIT_LIMITS.choices.includes(value);}
