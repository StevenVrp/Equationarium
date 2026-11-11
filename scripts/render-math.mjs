import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {labs} from '../dist/lib/registry.mjs';
const expressions=[...new Set(labs.flatMap(l=>l.formulas.flatMap(f=>[f.tex,...f.variables.map(v=>v[0])])) )];
const math={};
for(const expr of expressions){
 const converted=spawnSync('pandoc',['-f','markdown','-t','html5','--mathml','--wrap=none'],{input:'$$'+expr.replace(/\{\\rm\s+([^{}]+)\}/g,'{\\mathrm{$1}}')+'$$',encoding:'utf8'});
 const m=converted.stdout?.match(/<math[\s\S]*?<\/math>/);
 if(!m)throw Error('Could not typeset '+expr+': '+converted.stderr);
 math[expr]=m[0];
}
writeFileSync(new URL('../dist/lib/math.mjs',import.meta.url),'export default '+JSON.stringify(math)+';\n');
console.log('Typeset '+expressions.length+' unique expressions and symbols.');
