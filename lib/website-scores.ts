import type {Category,Report} from './audit';

export function websiteScores(reports:Report[]){
  const categories:Category[]=['SEO','AEO','GEO'];
  const scores=categories.map(category=>{
    const values=reports.map(r=>r.scores[category]).filter((v):v is number=>typeof v==='number'&&Number.isFinite(v));
    return {category,count:values.length,score:values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null};
  });
  const available=scores.filter(s=>s.score!==null);
  return {scores,overall:available.length?Math.round(available.reduce((n,s)=>n+s.score!,0)/available.length):null};
}
