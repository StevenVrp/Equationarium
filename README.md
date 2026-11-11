# Equationarium

Prepare for the BPhO and other physics olympiads, one experiment at a time.

Equationarium is an interactive physics workbench for BPhO preparation. It opens in the orbital mechanics experiment. Choose a module in the left rail or press **/** to find a subject or physical quantity. The curriculum’s coverage table lives in `dist/coverage.html`.

## Run locally

The release contains all web assets, including equation typesetting. A modern browser and a static web server are sufficient. From the unpacked project directory:

```sh
python3 -m http.server 8000 --directory dist
```

Open **http://localhost:8000**. Windows users can substitute `py -m http.server 8000 --directory dist`. No packages, accounts, API keys, or remote scripts are required. Serving over HTTP lets the browser load the ES modules.

## Using the workbench

- **Parameters** controls initial conditions. The number and slider share one value. Changing settings starts a new run at the same fractional time. Recorded observations retain the settings used for each reading. Save them to the notebook before switching experiments.
- **Equations** shows native MathML generated from the original LaTeX, symbol definitions, units, derivations, and numerical examples. Selecting a mapped input opens and highlights the corresponding control. Selecting a derived quantity identifies it on the scene.
- **Model** records physical assumptions and limitations. Alternative models appear as named choices under Parameters.
- Drag a spatial scene to rotate it. Shift-drag to pan. Use the zoom and camera reset buttons in the viewport. A highlighted drag handle in a plane diagram adjusts its physical parameter. The orbit and projectile rulers report physical distance in the calibrated 2D views. The ray protractor uses three points, with the vertex selected second.
- Press **Space** outside a control to play or pause. Scrub or step to inspect the same instant across views. Long-duration models use a compressed clock. The rate selector gives the conversion in its tooltip and the Model panel lists it numerically.
- **Graphs** supports multiple quantities with separate labeled axes. Hover to inspect a reading, click to jump to its time, zoom with the buttons or Ctrl-wheel, and drag to pan. The first selected series drives the centered finite-difference slope and optional trapezoidal integral. CSV exports the full run in the displayed units.
- **Data** records readings and includes a simulation stopwatch. Selected models also expose physical events for one-click navigation. **Challenges** accepts numerical answers, provides progressive hints, and lets students specify a target for a reverse experiment.
- **Notebook** saves configurations, comments, and recorded data in this browser's local storage. Restoring a setup reconstructs its model. The notebook, bookmarks and progress are specific to the browser and origin.
- Open **Curriculum → Concept connections** to explore relationships. The coverage page identifies implemented experiments, reduced-order models, and remaining topics.

## Architecture

| File | Responsibility |
| --- | --- |
| `dist/index.html`, `styles.css` | Semantic shell, dark/light palette, responsive panels, reduced-motion rules |
| `dist/app.mjs` | Current lab, parameters, model instance, clock, interactions, camera, notebook, graph cursor and export |
| `dist/lib/registry.mjs` | Imports independent experiment definitions and orders them by curriculum module |
| Experiment modules in `dist/lib/` | Model builders, experiment-specific scientific SVG scenes, assumptions, worked text, and challenges |
| `dist/lib/plot.mjs` | Shared time sampling, graph coordinates, ticks, inspection, cursor and trace rendering |
| `dist/lib/instruments.mjs` | Calibrated plane-view measurements and clock events |
| `dist/lib/curriculum.mjs` | Curriculum organization and explained links between concepts |
| `dist/lib/math.mjs` | Precompiled MathML for equations and symbols |
| `tests/` | Node regression tests for conservation, boundary cases, agreement with analytical solutions, SVG geometry and registry consistency |

Each experiment defines its own parameter bounds and display units. Its pure `build(parameters, mode, config)` method returns a positive duration in seconds and `at(t)`. The latter returns a named state in the explicitly labeled display units. Renderers, tabulated values, and graphs all read that same model. Models convert engineering units at input/output boundaries. Some query functions interpolate a precomputed numerical trajectory. Browser frames advance the physical clock independently from the integrator step.

The spatial renderer uses an orthographic camera. Geometry is projected from 3D into SVG, with additional ordering and visibility handling in the orbital scene. This keeps diagrams selectable and readable without a graphics-library dependency. A schematic globe texture is generated locally. Graph curves are sampled representations; the clock readout and inspection values query the model at the selected time. Numerical derivatives at a discontinuity reflect the differentiation interval.

## Add or edit a lab

1. Add a module that exports a `labs` array and import it into the registry. Each experiment has a stable `id`, `title`, numbered `module`, parameter descriptors, `build`, `scene`, `metrics`, `series`, `formulas`, `challenges`, and explanatory text. Follow an existing experiment with a similar model.
2. Keep physical calculations in the model. A scene consumes the active state, model, parameters, clock, view, and projection function. The common viewBox is 760 × 390. Enable spatial cameras with `spatial: true`. Editable instruments may additionally supply `defaultConfig`, `workbench`, and `act`.
3. Define every symbol in each formula. The optional fourth entry in a variable definition names the interactive parameter. Challenge tolerances are absolute and use the displayed answer unit.
4. Add model tests, regenerate equation data, and update the coverage table.

## Validate and deploy

Use Node.js 22 or newer to run tests. Pandoc is required only when regenerating MathML after editing equations.

```sh
npm run math
npm test
```

Deploy the contents of **dist/** to a static host. Keep relative paths intact and serve `.mjs` with a JavaScript MIME type. Hash links select experiments without server rewrites. Publishing under a new origin creates a separate local notebook.

The course follows the subject scope in the brief. Models, problems, and solutions are original. The challenge problems are unofficial practice. Physical background reading is available in OpenStax *University Physics*, volumes 1–3.

Regenerate the curriculum coverage page with `node scripts/coverage.mjs`. To package a downloadable copy, run `python3 scripts/source-archive.py`. The archive excludes its own bytes and site-specific hosting identity.

## GitHub Pages

The `main` branch contains the source and tests. The `gh-pages` branch serves the contents of `dist/` from its root. After changing the application, run the tests, regenerate the source archive and publish the updated `dist/` directory to the publishing branch.
