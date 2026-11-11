import test from 'node:test';
import assert from 'node:assert/strict';
import {labs} from '../dist/lib/network.mjs';
const lab=labs[0];
const make=(kind,id,a,b,value)=>({kind,id,a,b,value});
const model=(parts,extra={})=>lab.build({window:5},null,{parts:JSON.stringify(parts),...extra});
const near=(x,y,tol=1e-9)=>assert.ok(Math.abs(x-y)<=tol,`${x} vs ${y} (±${tol})`);
test('RC transient follows analytical charge curve and enforces node balances',()=>{
  const m=lab.build({window:5});
  for(const t of [0,0.01,0.2,1,3.5,5]) {
    const s=m.at(t);near(s.probeV,6*(1-Math.exp(-t/1.001)),0.018);
    near(s.currents[0]+s.currents[1],0); near(s.currents[1]-s.currents[2],0);
    near(s.energy,0.0005*s.probeV**2,4e-7);
  }
});
test('closed and open switch preserve passive sign and loaded battery voltage',()=>{
  const series=[make('source',1,1,0,6),make('switch',2,1,2,1),make('resistor',3,2,0,18.98)];
  const s=model(series).at(1);near(s.currents[0],-0.3);near(s.currents[2],0.3);near(s.volts[1],5.7);
  series[1].value=0;const opened=model(series).at(1);near(opened.volts[1],6);near(opened.currents[2],0);
});
test('10 MΩ meter measurably loads high-impedance divider',()=>{
  const m=model([make('source',1,1,0,10),make('resistor',2,1,2,1e7),make('resistor',3,2,0,1e7),make('voltmeter',4,2,0,1e7)]);
  near(m.at(1).probeV,10*5e6/(1.5e7+1));
});
test('ammeter shunt across battery yields finite short-circuit current',()=>{
  const m=model([make('source',1,1,0,6),make('ammeter',2,1,0,0.1)],{probeA:'1'});near(m.at(0).probeI,6/1.1);
});
test('disconnected networks produce a recoverable warning and retain component list',()=>{
  const parts=[make('resistor',1,1,2,100)];const m=model(parts);
  assert.match(m.warning,/Floating/);assert.deepEqual(m.parts,parts);assert.equal(m.invalid,true);
});
test('builder can add, rewire, toggle and remove a branch',()=>{
  const c=lab.act('commit',{...lab.defaultConfig,kind:'switch',a:'1',b:'0',value:'1'});
  const id=JSON.parse(c.parts).at(-1).id;
  const toggled=lab.act('toggle-'+id,c);assert.equal(JSON.parse(toggled.parts).at(-1).value,0);
  const editor=lab.act('edit-'+id,toggled);assert.equal(editor.kind,'switch');
  const moved=lab.act('commit',{...editor,b:'2'});assert.equal(JSON.parse(moved.parts).at(-1).b,2);
  const removed=lab.act('remove-'+id,moved);assert.equal(JSON.parse(removed.parts).length,3);
  assert.match(lab.act('commit',{...removed,a:'1',b:'1'}).message,/different/);
});
test('dimensional time step and energy stay finite at extreme permitted settings',()=>{
  const m=model([make('source',1,1,0,24),make('resistor',2,1,2,1e7),make('capacitor',3,2,0,1e5)]);
  for(const t of [0,0.001,1,5]){assert.ok(Number.isFinite(m.at(t).energy));near(m.at(t).probeV,24*(1-Math.exp(-t/1000000.1)),2e-9);}
});
