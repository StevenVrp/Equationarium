import test from 'node:test';
import assert from 'node:assert/strict';
import { labs } from '../dist/lib/expansion.mjs';

const lab = id => labs.find(item => item.id === id);
const defaults = id => Object.fromEntries(lab(id).params.map(param => [param.key, param.value]));
const evaluate = (id, settings={}, mode) => lab(id).build({...defaults(id),...settings},mode || lab(id).modes?.[0]);
const near = (actual, expected, tol=1e-9) =>
  assert.ok(Math.abs(actual-expected)<tol,`${actual} vs ${expected}`);

test('Orthogonal 3:4 vectors give a 3-4-5 triangle and signed right-handed cross product',()=>{
  const m=evaluate('vector',{ax:3,ay:0,az:0,b:4,phi:90,el:0,spin:0}),s=m.at(0);
  near(s.dot,0);near(s.result,5);near(s.area,12);near(s.nz,12);near(s.angle,90);
});
test('Collinear subtraction can cancel two vectors',()=>{
  const s=evaluate('vector',{ax:2,ay:0,az:0,b:2,phi:0,el:0,spin:0},'Subtraction').at(5);
  near(s.area,0);near(s.dot,4);near(s.result,0);
});
test('Static and kinetic friction differ at the slope transition',()=>{
  const staticLab=evaluate('incline',{theta:15,mu:.25,gap:.12});
  const stationary=staticLab.at(2);near(stationary.acc,0);near(stationary.friction,stationary.parallel);
  const slide=evaluate('incline',{theta:30,mu:.25,gap:.12}),final=slide.at(slide.duration);
  near(final.acc,9.81*(.5-.25*Math.cos(Math.PI/6)));near(final.distance,4);
  near(final.speed**2*.5*2+final.heat,2*9.81*4*.5);
});
test('Frictionless mode removes static threshold even with high input coefficients',()=>{
  const m=evaluate('incline',{theta:5,mu:.65,gap:.4},'Frictionless');
  near(m.at(m.duration).friction,0);near(m.at(m.duration).distance,4);
});
test('Restitution, momentum, lost energy and continuity hold across impact',()=>{
  for(const e of [0,.25,1]){
    const m=evaluate('collision',{m1:2,m2:3,u1:4,u2:-1,e});
    const left=m.at(m.hit-1e-10),right=m.at(m.hit);
    near(right.x1,left.x1);near(right.x2,left.x2);near(right.x2-right.x1,.5);
    near(right.v2-right.v1,5*e);near(right.p1+right.p2,5);
    near(right.loss,.5*(2*3/5)*25*(1-e**2));
    near(m.at(m.duration).cm,m.at(0).cm+m.duration*right.vc);
  }
});
test('Equal cart velocities never generate an impulse',()=>{
  const m=evaluate('collision',{u1:1,u2:1});
  assert.equal(m.hit,Infinity);near(m.at(m.duration).loss,0);near(m.at(m.duration).x2-m.at(m.duration).x1,4);
});
test('Venturi conserves volume and stagnation pressure along the tracer flight',()=>{
  const m=evaluate('flow',{area:20,beta:.4,pin:110,rho:1000,u:2});
  near(m.duration,1.4);near(m.at(0).x,0);near(m.at(m.duration).x,4);
  for(const t of [0,.1,m.duration/2,m.duration]){
    const s=m.at(t);
    near(s.area*1e-4*s.speed,.004);near(s.pressure*1000+500*s.speed**2,112000,1e-6);
  }
  near(m.at(m.duration/2).x,2);near(m.at(m.duration/2).speed,5);
});
test('A uniform tube has uniform pressure and linear travel',()=>{
  const m=evaluate('flow',{beta:1,u:2});near(m.at(.75).x,1.5);near(m.at(.75).dp,0);
});
test('Decay ensemble halves precisely and counted trial is reproducible and monotone',()=>{
  const m=evaluate('decay',{n:128,half:4,seed:4});
  assert.deepEqual(m.times,evaluate('decay',{n:128,half:4,seed:4}).times);
  assert.notDeepEqual(m.times,evaluate('decay',{n:128,half:4,seed:5}).times);
  near(m.at(0).count,128);near(m.at(8).expected,32);near(m.at(4).activity,64*Math.LN2/4);
  let last=128;
  for(let i=0;i<=50;i++){
    const s=m.at(m.duration*i/50);
    assert.ok(s.count<=last);assert.equal(s.count+s.daughters,128);last=s.count;
  }
});
test('Every model renders finite outputs at extrema, each mode and scene view',()=>{
  for(const exp of labs){
    for(const selection of ['min','max','value']){
      const p=Object.fromEntries(exp.params.map(knob=>[knob.key,knob[selection]]));
      for(const mode of exp.modes || ['']){
        const model=exp.build(p,mode);
        assert.ok(Number.isFinite(model.duration)&&model.duration>0);
        for(const t of [0,model.duration/2,model.duration]){
          const state=model.at(t);
          for(const {key} of [...exp.metrics,...exp.series])assert.ok(Number.isFinite(state[key]),exp.id+' '+key);
          for(const view of ['2D','3D']){
            const svg=exp.scene({p,mode,model,state,t,view,showVectors:true,showPath:true,project:(x,y,z)=>[380+150*(x-z*.4),195-130*(y+z*.3)]});
            assert.doesNotMatch(svg,/NaN|undefined|Infinity/);
          }
        }
      }
    }
  }
});
