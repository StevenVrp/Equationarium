import test from 'node:test';
import assert from 'node:assert/strict';
import {labs} from '../dist/lib/charges.mjs';
const l=labs[0],d=Object.fromEntries(l.params.map(p=>[p.key,p.value])),c=l.defaultConfig;
const config=s=>({...c,sources:JSON.stringify(s.map((v,i)=>({id:i+1,q:v[0],x:v[1],y:v[2],z:v[3]})))});
const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol, a+' vs '+b);
test('field, signed potential and force magnitude agree with Coulomb superposition in three dimensions',()=>{
 const m=l.build({...d,px:0,py:0,pz:0,travel:0,test:-2},'Field lines',config([[1,.3,0,0],[1,0,.3,0],[1,0,0,.3]])),s=m.at(0);
 near(s.ex,-8.9875517923/.09);near(s.ey,s.ex);near(s.ez,s.ex);near(s.V,3*8.9875517923/.3);near(s.force,2*Math.hypot(s.ex,s.ey,s.ez));
});
test('enclosed charge controls flux, boundary and probe singularity are diagnosed',()=>{
 const conf=config([[3,.2,0,0],[-1,-.3,0,0],[7,.8,0,0]]);
 const small=l.build({...d,radius:.6},'Gaussian sphere',conf).at(0),large=l.build({...d,radius:.9},'Gaussian sphere',conf).at(0);
 near(large.flux-small.flux,7*4*Math.PI*8.9875517923);
 assert.equal(l.build({...d,radius:.3},'Gaussian sphere',conf).invalid,true);
 assert.equal(l.build({...d,px:0,py:0,pz:0,travel:.4},'Field lines',conf).invalid,true);
});
test('edits, moves, count limit, overlap and empty configurations are recoverable',()=>{
 let cfg=l.act('edit-1',c);cfg=l.act('commit',{...cfg,x:'0.8'});near(JSON.parse(cfg.sources)[0].x,.8);
 const q=JSON.parse(cfg.sources)[0];assert.match(l.act('commit',{...cfg,x:String(q.x),y:String(q.y),z:String(q.z)}).message,/coincident/);
 for(const s of JSON.parse(cfg.sources))cfg=l.act('remove-'+s.id,cfg);near(l.build(d,'Field lines',cfg).at(0).E,0);
 for(let i=0;i<8;i++)cfg=l.act('commit',{...cfg,x:String(i/9),y:'.5',z:'0',q:'2'});
 assert.equal(JSON.parse(cfg.sources).length,8);assert.match(l.act('commit',{...cfg,x:'1'}).message,/eight/);
});
test('rendered views and slice contours remain finite across all display modes',()=>{
 for(const mode of l.modes){const model=l.build(d,mode,c),state=model.at(3);
 if(mode==='Equipotential slice')assert.ok(model.contours.length>0);
 for(const view of ['2D','3D'])assert.doesNotMatch(l.scene({p:d,mode,model,state,t:3,view,project:(x,y,z)=>[380+120*x+50*z,195-100*y],showPath:true,showVectors:true}),/NaN|Infinity|undefined/);}
});
