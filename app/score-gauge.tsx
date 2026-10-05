'use client';
import {useId, type CSSProperties} from 'react';

export function ScoreGauge({score,category}:{score:number|null;category:string}){
  const id=useId().replace(/:/g,'');
  const value=score===null?null:Math.min(100,Math.max(0,score));
  const label=value===null?'Not measured':value>=80?'Strong':value>=50?'Review':'Low';
  return <div className="score-gauge" role={value===null?'img':'meter'} aria-label={`${category} checklist: ${value===null?'not measured':`${value} out of 100, ${label}`}`} aria-valuemin={value===null?undefined:0} aria-valuemax={value===null?undefined:100} aria-valuenow={value??undefined}>
    <svg viewBox="0 0 150 90" aria-hidden="true" style={{'--gauge-offset':100-(value??0)} as CSSProperties}>
      <defs><mask id={id}><path className="gauge-reveal" d="M10 80 A65 65 0 0 1 140 80" pathLength="100" fill="none" stroke="white" strokeWidth="14" strokeDasharray="100" strokeDashoffset={100-(value??0)}/></mask></defs>
      <path d="M10 80 A65 65 0 0 1 140 80" fill="none" stroke="#e8edef" strokeWidth="12" strokeLinecap="round"/>
      <g mask={`url(#${id})`} fill="none" strokeWidth="12" strokeLinecap="round">
        <path d="M10 80 A65 65 0 0 1 40 25.2" stroke="#ef5350"/>
        <path d="M44 22.7 A65 65 0 0 1 106 22.7" stroke="#f5a623"/>
        <path d="M110 25.2 A65 65 0 0 1 140 80" stroke="#36ad68"/>
      </g>
      <text x="75" y="78" textAnchor="middle" className="gauge-label">{label}</text>
    </svg>
  </div>;
}
