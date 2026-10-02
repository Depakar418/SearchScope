export function HeadingIssueCue({actual,previous,previousText,expected}:{actual:number;previous:number;previousText:string;expected:number}){
 return <div className="heading-issue-cue" role="group" aria-label="Heading structure issue and suggested fix">
  <div className="heading-issue-cue__problem"><strong>Issue · Heading level skipped</strong><p><b>H{actual}</b> follows <b>H{previous}</b>{previousText?<> (“{previousText}”)</>:null} in the extracted heading order.</p></div>
  <div className="heading-issue-cue__fix"><strong>Suggested fix · Review H{expected}</strong><p>If this heading is a direct subsection, use <b>H{expected}</b> here. Check the surrounding outline before editing; adjust its visual size with CSS.</p></div>
 </div>;
}
