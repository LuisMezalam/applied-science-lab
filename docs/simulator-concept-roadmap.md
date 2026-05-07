# Simulator Concept Roadmap

This roadmap maps the expanded Library atlas against the simulator surface that exists today. The goal is not to make every Library entry interactive. The goal is to choose the concepts where a user can manipulate an intensity field and immediately see resultant, centroid, spread, localization, and sign policy become intuitive.

## Current Interactive Coverage

- 1D simulator: line, time, and parameter profiles with uniform, triangular, Gaussian, step, pressure, dynamics, circuit, propulsion, and signed-field examples.
- 2D simulator: rectangle, circle, and triangle surface domains with uniform, linear, radial, and parabolic intensities.
- 3D simulator: box, sphere, and cylinder volume domains with uniform, linear, radial, parabolic, and exponential intensities.
- Cross-domain comparison: six engineering domains compared through normalized moments and inverse-moment localization.
- Balance-law backbone: structures, heat, fluids, dynamics, circuits, and propulsion mapped to density, flux, source, and intensity language.
- Roadmap Labs hub: section properties, beam energy, frequency spectra, heat fin/boundary transfer, propulsion burn/maps, and stress hotspot fields.

## Priority Legend

- Interactive P1: should become an actual simulator module soon. It has clear controls, visible field geometry, and high teaching value.
- Interactive P2: worth making interactive after P1. It is useful but needs more assumptions, specialized geometry, or additional setup.
- Library-only: keep as reference unless the app later gains a more specialized solver or imported dataset workflow.

## Cross-Cutting Modules

| Concept | Atlas IDs | Decision | Why |
| --- | --- | --- | --- |
| Signed-field policy lab | M-001, M-002, M-006, M-011, M-020, M-057 | Interactive P1 | The project repeatedly needs magnitude, square, and positive/negative split choices. A dedicated module would make sign policy visible instead of hidden in notes. |
| Point-load and footprint regularization | M-019 plus localization foundation | Interactive P1 | This is central to inverse moments. Users should see a delta idealization become finite as epsilon or contact footprint changes. |
| Generic graph moment ladder | M-010, M-011, M-047, M-048, M-055, M-056, M-084 | Implemented | Added Graph Moment Lab for circuits, FEA error indicators, and element compliance over embedded node-edge domains. |
| Frequency-domain moment ladder | M-036, M-059, M-078, M-079 | Implemented | Added Frequency-Domain Moment Lab with peaks, bandwidth, noise floor, spectral centroid, spread, and localization. |

## Structures

| Concept | Atlas IDs | Decision | Proposed module |
| --- | --- | --- | --- |
| Section centroid and second moments of area | M-041, M-042 | Implemented | Added Section Properties Lab with composite area, holes, centroid shift, second moments, spread radii, and principal axes. |
| Beam load to shear, moment, and energy density | M-001, M-020, M-023, M-065, M-066, M-067 | Implemented | Added Beam Energy Ladder with distributed/point loads, reactions, moment magnitude, and nonnegative strain-energy intensity. |
| Aerodynamic or distributed span load | M-039 | Interactive P1 | Span Load Lab: lift/drag distribution, resultant, center of pressure, root moment tendency. |
| Thin-wall shear flow around a section | M-068 | Interactive P2 | Thin-Wall Flow Lab: open/closed paths, shear flow magnitude, centroid around wall coordinate. |
| Contact, bearing, traction, and body-force fields | M-017, M-018, M-022 | Interactive P2 | Surface/Volume Load Presets: add domain-specific presets to existing 2D/3D simulators. |
| Concentrated force idealization | M-019 | Interactive P1 via cross-cutting module | Better handled as the point-load regularization lab than as a standalone structures-only tool. |

Library-only for now: detailed product-of-inertia sign conventions beyond the section lab, highly specific support reactions without a beam solver, and specialty loading cases that duplicate the same line-load moment ladder.

## Heat And Mass Transfer

| Concept | Atlas IDs | Decision | Proposed module |
| --- | --- | --- | --- |
| Surface and volumetric heat source fields | M-003, M-004 | Already interactive | Existing 1D, 2D, and 3D simulators cover the generic moment ladder for heat flux and heat generation. |
| Boundary heat transfer: conduction, convection, radiation | M-035, M-050, M-051 | Implemented | Added Heat Boundary And Fin Lab with boundary heat-flux equations and explicit incoming/outgoing sign policy. |
| Fin heat-loss density | M-070 | Implemented | Added Fin Line controls for base excess temperature, hP scale, decay length, heat-loss centroid, and active spread. |
| Thermal-gradient and temperature-excess fields | M-049, M-069, M-085 | Interactive P2 | Thermal Field Lab: compare temperature, stored energy, and gradient-energy intensities over the same domain. |
| Species concentration, diffusive flux, and reaction rate | M-052, M-071, M-072 | Interactive P2 | Transport Lab: concentration plume, Fick flux through a boundary, production/consumption split. |
| Entropy generation density | M-034 | Library-only | Excellent reference concept, but a meaningful interactive version needs a thermodynamic model with heat, flow, and irreversibility assumptions. |

## Fluids

| Concept | Atlas IDs | Decision | Proposed module |
| --- | --- | --- | --- |
| Pressure and wall shear fields | M-002, M-005, M-064 | Already partial; Interactive P1 extension | Extend 2D surface simulator with Cp/suction/pressure split and center-of-pressure controls. |
| Mass flux, kinetic energy, viscous dissipation, turbulent kinetic energy | M-025, M-026, M-027, M-028 | Interactive P2 | Flow Energy Field Lab: choose velocity profile and density, then compare mass flux, kinetic energy, and dissipation fields. |
| Vorticity and enstrophy | M-053 | Interactive P2 | Vortex Activity Lab: vortex cores, shear layers, enstrophy centroid, spread, and localization. |
| Pipe/duct head loss and pressure-loss coefficient | M-073, M-074 | Interactive P1 | Flow-Path Loss Lab: pipe segments and fittings as line/parameter intensities; show where head is spent. |
| Buoyancy force distribution | existing 3D fluids mapping | Interactive P2 | Add as a clearer 3D preset with center of buoyancy and stability interpretation. |

Library-only for now: full CFD stress tensors, turbulence model details, and multidimensional flow fields that need a real solver rather than a pedagogical intensity field.

## Dynamics And Control

| Concept | Atlas IDs | Decision | Proposed module |
| --- | --- | --- | --- |
| Force, torque, damping, impulse, and harmonic time fields | M-006, M-007, M-008, M-009 | Already interactive | Existing 1D time-domain profiles handle these well. |
| Mass density and mass moment of inertia | M-024, M-043 | Interactive P1 | Rigid-Body Inertia Lab: shape, density distribution, inertia tensor, radius of gyration, and localization. |
| Control effort, tracking error, and state energy | M-058, M-076, M-077 | Interactive P1 | Control Cost Lab: tune pulse, damping, controller strength, Q/R weights, and compare effort versus error centroids. |
| Shock, response, and vibration spectra | M-036, M-059, M-078, M-079 | Implemented | Covered by the Frequency-Domain Moment Lab. |

Library-only for now: complete state-space derivations, multi-DOF modal coupling, and controller design theory beyond the intensity/cost fields.

## Circuits And Electromagnetics

| Concept | Atlas IDs | Decision | Proposed module |
| --- | --- | --- | --- |
| Branch current, power dissipation, and Joule heating | M-010, M-011, M-030 | Already partial; Interactive P1 extension | Move from 1D approximation to graph circuit module with branch positions and component types. |
| Capacitor and inductor stored energy | M-055, M-056 | Interactive P1 | Circuit Graph Energy Lab: resistor/capacitor/inductor elements, graph centroid of energy and dissipation. |
| Charge-delivery waveform | M-054 | Interactive P2 | Time Signal Lab: current pulse, charge throughput, polarity split, pulse width. |
| Surface charge, electric flux, magnetic flux, EM energy density | M-031, M-057, M-075 | Interactive P2 | EM Field Footprint Lab: surface/volume toy fields without pretending to solve Maxwell equations. |
| Current density field | M-029 | Interactive P2 | Add surface/volume current-density presets to existing 2D/3D simulators. |

Library-only for now: full circuit differential equation solving, electromagnetic wave propagation, and field solutions that require boundary-value solvers.

## Propulsion

| Concept | Atlas IDs | Decision | Proposed module |
| --- | --- | --- | --- |
| Momentum flux and pressure thrust | M-015, M-016, M-038 | Already partial; Interactive P1 extension | Nozzle Exit Plane Lab: radial profiles, asymmetry, thrust center, effective radius. |
| Thrust history and propellant mass-flow history | M-060, M-061 | Implemented | Added Propulsion Burn And Map Lab with thrust curve, total impulse, propellant use, and burn centroid. |
| Performance maps, Mach flow parameter, losses, and stage work | M-012, M-013, M-063, M-080 | Implemented | Added parameter-map intensity with operating point, robust band width, and performance-map centroid. |
| Blade loading distribution | M-081 | Interactive P2 | Blade Loading Lab: span/chord line field, center of loading, root-heavy versus tip-heavy distribution. |
| Combustor/nozzle wall heat flux and heat release | M-033, M-062 | Interactive P2 | Engine Thermal Load Lab: wall heat map and combustor heat-release footprint. |
| Emission mass-rate history | M-082 | Interactive P2 | Mission Emissions Lab: time-domain emission rates with total mass and centroid. |

Library-only for now: full Brayton-cycle analysis, rocket performance derivations, detailed compressor/turbine maps, and combustor chemistry.

## Materials And FEA

| Concept | Atlas IDs | Decision | Proposed module |
| --- | --- | --- | --- |
| Equivalent stress, strain, plastic work, and failure utilization | M-044, M-045, M-046, M-083 | Implemented | Added Stress Hotspot And FEA Lab with equivalent stress demand, utilization threshold, violation intensity, centroid, and spread. |
| Elastic strain energy and compliance | M-021, M-084 | Implemented | Covered by the Graph Moment Lab compliance scenario and stress/energy intensity framing. |
| Nodal force and element error indicators | M-047, M-048 | Interactive P1 via graph module | Mesh Graph Lab: nodes/elements with force, error, and refinement priorities. |
| Damage and fatigue density | M-040 | Interactive P2 | Damage Evolution Lab: cycle accumulation, hot-spot migration, total damage proxy. |
| Crack-front energy release rate | M-037 | Interactive P2 | Crack-Front Line Lab: line coordinate along crack front, energy-release centroid, localization. |

Library-only for now: full finite-element solving, material constitutive laws, fracture criteria, and fatigue standards.

## Waves And Acoustics

| Concept | Atlas IDs | Decision | Proposed module |
| --- | --- | --- | --- |
| Power spectral density and response spectra | M-036, M-059, M-078, M-079 | Implemented | Added Frequency-Domain Moment Lab with peaks, bandwidth, noise floor, centroid frequency, and spread. |
| Acoustic intensity magnitude | M-032 | Interactive P2 | Acoustic Surface Lab: source footprint, total acoustic power proxy, intensity center, spread. |

Library-only for now: full wave equation solvers, room acoustics, modal analysis, and propagation models.

## Recommended Build Order

1. Graph Moment Lab: implemented for circuits, FEA error indicators, compliance, and graph-based intensity fields.
2. Section Properties Lab: implemented in the Roadmap Labs hub.
3. Beam Energy Ladder: implemented in the Roadmap Labs hub.
4. Frequency-Domain Moment Lab: implemented in the Roadmap Labs hub.
5. Heat Boundary/Fin Lab: implemented in the Roadmap Labs hub.
6. Propulsion Burn/Map Lab: implemented in the Roadmap Labs hub.
7. Stress Hotspot/FEA Lab: implemented in the Roadmap Labs hub.

## Library-Only Criteria

Keep an entry Library-only when it is primarily a definition, requires a full external solver, duplicates a simpler moment-ladder shape, or depends on discipline-specific standards that would distract from the simulator mission. Promote an entry when a user can manipulate a field directly and immediately see the moment ladder clarify the engineering meaning.
