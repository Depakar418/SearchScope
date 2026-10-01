import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'searchscope-doc-'));
try{const raw=await fs.readFile('lib/releases.ts','utf8');const output=ts.transpileModule(raw,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;const file=path.join(dir,'releases.mjs');await fs.writeFile(file,output);const {developmentMarkdown}=await import(file);await fs.writeFile('public/SearchScope-Development-Log.md',developmentMarkdown());console.log('Development document generated from versioned release inventory.');}finally{await fs.rm(dir,{recursive:true,force:true});}
