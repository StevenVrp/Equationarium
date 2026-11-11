import {writeFileSync} from 'node:fs';
import {labs} from '../dist/lib/registry.mjs';
import {chapters} from '../dist/lib/curriculum.mjs';
import {escape as e} from '../dist/lib/plot.mjs';
const pending=[
 'General dimensional-analysis solver, significant-figure arithmetic, and arbitrary Cartesian/polar transformations.',
 'Moving reference-frame workbench and general 3D nonuniform motion.',
 'Free construction of arbitrary rigid-body mechanisms, rotating frames and independent force sensors.',
 'General dissipative work, powertrain efficiency and arbitrary user-specified potential functions.',
 'Rolling constraints, static truss equilibrium, elastic deformation, unbound escape and multi-body gravitation.',
 'Viscous pipe networks, boundary layers and quantitative wing aerodynamics.',
 'Acoustic intensity, beats and coupled-oscillator normal modes.',
 'Conduction, convection, radiative heat exchange, and a spatial molecular collision gas.',
 'Arbitrary conducting boundaries, dielectric polarization surfaces and fringing fields.',
 'Larger topologies, nonlinear components and wire resistivity versus temperature.',
 'RL transients, transformers, time-dependent coupled fields and propagating electromagnetic waves.',
 'Curved mirrors, prisms, broadband dispersion, gratings, polarization and instrument resolution.',
 'Blackbody spectra, de Broglie waves, atomic spectra, quantum uncertainty, nuclear energetics, particle physics and astrophysics.'
];
const limits=[
 'Rotating vectors and a prescribed repeated-measurement experiment.',
 'Point projectile over flat ground in a uniform gravitational field.',
 'Each machine follows the supported rigid, taut-rope and contact constraints.',
 'One-dimensional impacts and prescribed one-dimensional conservative potentials.',
 'Bound two-body ellipses, schematic body artwork and selected rigid-body inertia models.',
 'Venturi flow is an incompressible, inviscid reduced model. Hydrostatic force uses an ideal fluid.',
 'Small-displacement strings, prescribed drives, and selected point-mass pendulum geometries.',
 'Quasistatic ideal-gas paths and idealized thermal mixing. Molecular illustrations have a stated interpretation.',
 'Point charges, ideal dielectric and wide parallel plates have stated boundary assumptions.',
 'The builder supports four nets and eight branches with explicit source, meter, and switch impedances.',
 'Field geometry and induced voltage depend on stated coil, dipole and field approximations.',
 'Paraxial lens trains, planar dielectric boundaries and far-field monochromatic slit patterns.',
 'Selected special-relativistic, photoelectric and radioactive-decay experiments.'
];
const rows=chapters.map(([name,_icon,_full,scope],i)=>'<tr><th>'+e(name)+'</th><td>'+labs.filter(l=>l.module===i+1).map(l=>'<a href="./#'+l.id+'">'+e(l.title)+'</a>').join('<br>')+'</td><td>'+e(limits[i])+'</td><td>'+e(pending[i])+'</td></tr>').join('');
writeFileSync('dist/coverage.html','<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Curriculum coverage · Equationarium</title><link rel="stylesheet" href="./styles.css"><style>main{max-width:1200px;margin:auto;padding:32px 20px}h1{font-size:32px;letter-spacing:-.04em}p{color:var(--muted);line-height:1.6}table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;vertical-align:top;padding:13px 11px;border:1px solid var(--line);line-height:1.6}th{background:var(--panel)}td{color:var(--muted)}table a{display:inline-block;margin-bottom:4px}header{display:flex;justify-content:space-between}.scroll{overflow-x:auto}h2{margin-top:26px}</style><main><header><a href="./">← Return to laboratory</a><a download href="./equationarium-source.zip">Download source and tests</a></header><h1>Curriculum coverage</h1><p>'+labs.length+' runnable experiments across 13 modules. Each linked experiment includes a model, a diagram, equations, numerical examples and calculation challenges. Modules remain partially covered wherever the last column names an outstanding topic.</p><div class="scroll"><table><thead><tr><th>Module</th><th>Implemented experiments</th><th>Model scope</th><th>Pending topics and extensions</th></tr></thead><tbody>'+rows+'</tbody></table></div><h2>Numerical methods</h2><p>Experiments use analytical solutions where available. Examples include the exact exponential RC response, Fresnel power coefficients for a lossless interface, and a root solve for Kepler’s equation. Quadratic drag and driven oscillator modes use numerical integration. The circuit builder solves nodal equations with capacitor history and a finite time step. Inspect the Model tab and the experiment source for assumptions.</p><h2>Development</h2><p>The source archive includes installation and deployment instructions, a description of the application architecture, each experiment’s model and regression tests. Notebook entries and recorded measurements are stored on the device.</p></main></html>');
