# Deep Book Scan Coverage

Scanned 18 PDFs from `D:\Books`. This report records coverage signals and candidate intensity fields; it intentionally avoids copying textbook passages.

## Strongest Topic Clusters

- heat_transfer: 10379
- geometry_math_support: 8879
- engineering_economy: 6261
- propulsion: 5141
- rigid_body_dynamics: 3437
- stress_strain_failure: 2676
- geometry_moments: 2546
- mass_transfer_fluids: 1525
- vibration_control_signals: 1159
- circuits_em: 719
- distributed_structures: 433
- finite_elements: 374

## Promotion Decisions

The deep scan was used to expand the Library only where a term can be treated as a nonnegative intensity field over a declared domain. This pass promoted the strongest missing physics and engineering kernels into atlas entries M-065 through M-085:

- Structure and mechanics energy kernels: bending, torsion, axial strain energy, and thin-wall shear flow.
- Heat and transport kernels: thermal-gradient energy, fin heat loss, diffusive species flux, reaction rate, and temperature excess.
- Fluids and propulsion kernels: pressure-loss coefficient, hydraulic head loss, turbomachinery stage work, blade loading, and emission mass rate.
- Circuits, control, waves, and FEA kernels: magnetic flux, tracking error, state energy, sensor-noise spectrum, response spectrum, failure utilization, and element compliance.

Engineering-economy cash-flow and pure school-geometry signals were scanned and recorded, but not promoted into the physics atlas because they do not serve the current simulator mission as directly as the engineering-physics fields above.

## Candidate Intensity Fields

| Candidate | Domain | Kind | Signal hits | Top source signals | Status |
| --- | --- | --- | ---: | --- | --- |
| Fin heat-loss density $hP(T(x)-T_\infty)$ | heat | line | 3172 | Heat and Mass Transfer_ Fundamentals and (2920); Introduction to Geometry (141); Finite Element Analysis for Design Engineers (48); ENVISION MATHEMATICS 2021 COMMON CORE STUDENT EDITION GRADE (30); Elements of Propulsion, Gas Turbines and Rockets 2nd edition (19) | covered or adjacent |
| Radiative exchange density $\varepsilon\sigma(T^4-T_{sur}^4)$ | heat | surface | 2580 | Heat and Mass Transfer_ Fundamentals and (2537); Finite Element Analysis for Design Engineers (24); Elements of Propulsion, Gas Turbines and Rockets 2nd edition (5); FE Mechanical Practice Exam (5); Introduction to Mechatronics and Measurement Systems (5) | covered or adjacent |
| Beam bending strain-energy density $M(x)^2/(2EI)$ | structures | line | 2139 | Mechanics of Materials - Instructor Solutions Manual (1169); Mechanics of Materials (853); Engineering_Mechanics_Statics_15th_Edition_by_Russell_C._Hibbeler (1) (26); Engineering_Mechanics_Statics_15th_Edition_by_Russell_C._Hibbeler (26); Engineering Mechanics Dynamics (17) | covered or adjacent |
| Turbomachinery stage-work density $\Delta h_0(\xi)$ | propulsion | parameter | 1945 | Elements of Propulsion, Gas Turbines and Rockets 2nd edition (1825); Dynamic systems _ modeling, simulation, and control (39); Heat and Mass Transfer_ Fundamentals and (20); Engineering Mechanics Dynamics (14); Engineering Mechanics_ Dynamics 8th Edition (14) | covered or adjacent |
| Cash-flow magnitude over time $\|C(t)\|$ | parameter | time | 1827 | Engineering Economy, 8th edition (2018) (1727); 8th edition solutions (95); FE Mechanical Practice Exam (4); Heat and Mass Transfer_ Fundamentals and (1) | covered or adjacent |
| Shaft torsional strain-energy density $T(x)^2/(2GJ)$ | structures | line | 1477 | Mechanics of Materials (591); Mechanics of Materials - Instructor Solutions Manual (366); Introduction to Mechatronics and Measurement Systems (154); Dynamic systems _ modeling, simulation, and control (104); Engineering Mechanics Dynamics (71) | covered or adjacent |
| Axial member strain-energy density $N(x)^2/(2EA)$ | structures | line | 880 | Mechanics of Materials (315); Mechanics of Materials - Instructor Solutions Manual (207); Engineering_Mechanics_Statics_15th_Edition_by_Russell_C._Hibbeler (1) (109); Engineering_Mechanics_Statics_15th_Edition_by_Russell_C._Hibbeler (109); Engineering Mechanics Dynamics (40) | covered or adjacent |
| Thermal-gradient energy $k\\|\nabla T\\|^2$ | heat | volume | 768 | Heat and Mass Transfer_ Fundamentals and (734); Finite Element Analysis for Design Engineers (12); Introduction to Mechatronics and Measurement Systems (7); Mechanics of Materials - Instructor Solutions Manual (6); Circuit Engineering_ The Beginner's Guide to Electronic (5) | covered or adjacent |
| Shock or response spectrum ordinate $S_a(f)$ | waves | frequency | 664 | Dynamic systems _ modeling, simulation, and control (154); Finite Element Analysis for Design Engineers (154); Engineering Mechanics_ Dynamics 8th Edition (130); Engineering Mechanics Dynamics (126); Introduction to Mechatronics and Measurement Systems (85) | covered or adjacent |
| Sensor-noise spectral density $S_n(f)$ | waves | frequency | 595 | Introduction to Mechatronics and Measurement Systems (357); Heat and Mass Transfer_ Fundamentals and (59); Dynamic systems _ modeling, simulation, and control (54); Finite Element Analysis for Design Engineers (16); Circuit Engineering_ The Beginner's Guide to Electronic (15) | covered or adjacent |
| Shear-force diagram magnitude $\|V(x)\|$ | structures | line | 468 | Mechanics of Materials (145); Engineering_Mechanics_Statics_15th_Edition_by_Russell_C._Hibbeler (1) (95); Engineering_Mechanics_Statics_15th_Edition_by_Russell_C._Hibbeler (95); Mechanics of Materials - Instructor Solutions Manual (92); Introduction to Mechatronics and Measurement Systems (20) | covered or adjacent |
| Diffusive species flux $\|\mathbf{j}_A\cdot\mathbf{n}\|$ | heat | surface | 443 | Heat and Mass Transfer_ Fundamentals and (399); Elements of Propulsion, Gas Turbines and Rockets 2nd edition (40); Introduction to Mechatronics and Measurement Systems (3); Engineering Economy, 8th edition (2018) (1) | covered or adjacent |
| Bending-moment diagram magnitude $\|M(x)\|$ | structures | line | 442 | Mechanics of Materials - Instructor Solutions Manual (172); Mechanics of Materials (150); Engineering_Mechanics_Statics_15th_Edition_by_Russell_C._Hibbeler (1) (41); Engineering_Mechanics_Statics_15th_Edition_by_Russell_C._Hibbeler (41); Engineering Mechanics Dynamics (16) | covered or adjacent |
| Principal stress magnitude field $\max_i\|\sigma_i\|$ | materials | volume | 388 | Mechanics of Materials - Instructor Solutions Manual (194); Mechanics of Materials (182); Introduction to Mechatronics and Measurement Systems (6); FE Mechanical Practice Exam (5); Finite Element Analysis for Design Engineers (1) | covered or adjacent |
| Element residual norm $\\|\mathbf{r}_e\\|^2$ | materials | graph | 352 | Finite Element Analysis for Design Engineers (268); Mechanics of Materials (53); Mechanics of Materials - Instructor Solutions Manual (16); Introduction to Mechatronics and Measurement Systems (6); Heat and Mass Transfer_ Fundamentals and (5) | covered or adjacent |
| Element compliance contribution $\mathbf{u}_e^T\mathbf{k}_e\mathbf{u}_e$ | materials | graph | 307 | Mechanics of Materials (182); Mechanics of Materials - Instructor Solutions Manual (77); Heat and Mass Transfer_ Fundamentals and (24); Finite Element Analysis for Design Engineers (22); Engineering Economy, 8th edition (2018) (2) | covered or adjacent |
| Resistor heat generation $i_e^2R_e$ | circuits | graph | 306 | Introduction to Mechatronics and Measurement Systems (184); Dynamic systems _ modeling, simulation, and control (48); Circuit Engineering_ The Beginner's Guide to Electronic (39); Heat and Mass Transfer_ Fundamentals and (30); FE Mechanical Practice Exam (5) | covered or adjacent |
| Thin-wall shear flow magnitude $\|q_s(s)\|$ | structures | line | 252 | Mechanics of Materials (153); Mechanics of Materials - Instructor Solutions Manual (48); Heat and Mass Transfer_ Fundamentals and (45); Introduction to Mechatronics and Measurement Systems (3); Engineering Mechanics Dynamics (1) | covered or adjacent |
| Curve curvature magnitude $\|\kappa(s)\|$ | unified | line | 239 | Engineering Mechanics Dynamics (66); Engineering Mechanics_ Dynamics 8th Edition (66); Mechanics of Materials (48); Mechanics of Materials - Instructor Solutions Manual (26); Finite Element Analysis for Design Engineers (18) | covered or adjacent |
| Reaction-rate density $\dot{\omega}_A(\mathbf{x})$ | heat | volume | 236 | Heat and Mass Transfer_ Fundamentals and (202); Elements of Propulsion, Gas Turbines and Rockets 2nd edition (25); Engineering Economy, 8th edition (2018) (3); Mechanics of Materials (3); 8th edition solutions (1) | covered or adjacent |
| Pressure-loss coefficient density $K(\xi)$ | fluids | parameter | 194 | Heat and Mass Transfer_ Fundamentals and (126); Elements of Propulsion, Gas Turbines and Rockets 2nd edition (62); Dynamic systems _ modeling, simulation, and control (3); Engineering Economy, 8th edition (2018) (1); Engineering Mechanics Dynamics (1) | covered or adjacent |
| Failure index or utilization field $U(\mathbf{x})$ | materials | volume | 172 | Mechanics of Materials (91); Mechanics of Materials - Instructor Solutions Manual (74); Finite Element Analysis for Design Engineers (4); Heat and Mass Transfer_ Fundamentals and (2); Elements of Propulsion, Gas Turbines and Rockets 2nd edition (1) | covered or adjacent |
| Tracking-error cost $e(t)^TQe(t)$ | dynamics | time | 163 | Dynamic systems _ modeling, simulation, and control (110); Introduction to Mechatronics and Measurement Systems (20); Elements of Propulsion, Gas Turbines and Rockets 2nd edition (15); Engineering Economy, 8th edition (2018) (7); Engineering Mechanics Dynamics (4) | covered or adjacent |
| Hydraulic head-loss density $dh_L/dx$ | fluids | line | 123 | Heat and Mass Transfer_ Fundamentals and (115); Dynamic systems _ modeling, simulation, and control (5); Engineering Economy, 8th edition (2018) (1); Engineering Mechanics Dynamics (1); Engineering Mechanics_ Dynamics 8th Edition (1) | covered or adjacent |
| Magnetic flux density magnitude $\\|\mathbf{B}\cdot\mathbf{n}\\|$ | circuits | surface | 118 | Dynamic systems _ modeling, simulation, and control (62); Introduction to Mechatronics and Measurement Systems (34); Circuit Engineering_ The Beginner's Guide to Electronic (19); Engineering Mechanics Dynamics (1); Engineering Mechanics_ Dynamics 8th Edition (1) | covered or adjacent |
| Temperature-excess field $\|T(\mathbf{x})-T_{ref}\|$ | heat | volume | 86 | Heat and Mass Transfer_ Fundamentals and (79); Elements of Propulsion, Gas Turbines and Rockets 2nd edition (4); Finite Element Analysis for Design Engineers (3) | covered or adjacent |
| Emission mass-rate history $\dot{m}_{em}(t)$ | propulsion | time | 82 | Heat and Mass Transfer_ Fundamentals and (52); Elements of Propulsion, Gas Turbines and Rockets 2nd edition (9); Engineering Mechanics Dynamics (5); Engineering Mechanics_ Dynamics 8th Edition (5); FE Mechanical Practice Exam (5) | covered or adjacent |
| State-energy measure $x(t)^TPx(t)$ | dynamics | time | 79 | Dynamic systems _ modeling, simulation, and control (79) | covered or adjacent |
| Blade loading distribution $\Delta p(s)$ or $f(s)$ | propulsion | line | 49 | Elements of Propulsion, Gas Turbines and Rockets 2nd edition (20); Engineering_Mechanics_Statics_15th_Edition_by_Russell_C._Hibbeler (1) (10); Engineering_Mechanics_Statics_15th_Edition_by_Russell_C._Hibbeler (10); Heat and Mass Transfer_ Fundamentals and (5); Dynamic systems _ modeling, simulation, and control (1) | covered or adjacent |
| Vorticity magnitude $\\|\boldsymbol{\omega}\\|$ | fluids | volume | 42 | Elements of Propulsion, Gas Turbines and Rockets 2nd edition (34); Heat and Mass Transfer_ Fundamentals and (8) | covered or adjacent |
| Squared signal energy $x(t)^2$ | waves | time | 37 | Introduction to Mechatronics and Measurement Systems (29); Finite Element Analysis for Design Engineers (5); Dynamic systems _ modeling, simulation, and control (2); Engineering Economy, 8th edition (2018) (1) | covered or adjacent |

## Per-Book Signal Summary

### 8th edition solutions
- Pages: 380; extracted characters: 399555
- engineering_economy: 503
- geometry_math_support: 19
- rigid_body_dynamics: 14
- stress_strain_failure: 2
- mass_transfer_fluids: 1

### Circuit Engineering_ The Beginner's Guide to Electronic
- Pages: 99; extracted characters: 117159
- rigid_body_dynamics: 101
- circuits_em: 81
- geometry_math_support: 12
- heat_transfer: 5
- engineering_economy: 3
- vibration_control_signals: 2
- stress_strain_failure: 1
- finite_elements: 1

### Dynamic systems _ modeling, simulation, and control
- Pages: 499; extracted characters: 1114311
- vibration_control_signals: 649
- circuits_em: 225
- geometry_math_support: 211
- rigid_body_dynamics: 156
- heat_transfer: 47
- propulsion: 39
- geometry_moments: 24
- distributed_structures: 3

### ENVISION MATHEMATICS 2021 COMMON CORE STUDENT EDITION GRADE
- Pages: 300; extracted characters: 350754
- geometry_math_support: 298
- engineering_economy: 87
- rigid_body_dynamics: 27
- mass_transfer_fluids: 1

### Elements of Propulsion, Gas Turbines and Rockets 2nd edition
- Pages: 928; extracted characters: 1306728
- propulsion: 4452
- geometry_math_support: 677
- rigid_body_dynamics: 470
- mass_transfer_fluids: 83
- heat_transfer: 51
- engineering_economy: 28
- stress_strain_failure: 11
- vibration_control_signals: 9

### Engineering Economy, 8th edition (2018)
- Pages: 654; extracted characters: 1993922
- engineering_economy: 5419
- geometry_math_support: 280
- rigid_body_dynamics: 101
- distributed_structures: 22
- propulsion: 16
- stress_strain_failure: 15
- vibration_control_signals: 6
- mass_transfer_fluids: 6

### Engineering Mechanics Dynamics
- Pages: 717; extracted characters: 1424682
- rigid_body_dynamics: 671
- geometry_math_support: 599
- geometry_moments: 280
- propulsion: 123
- vibration_control_signals: 111
- distributed_structures: 11
- engineering_economy: 6
- circuits_em: 2

### Engineering Mechanics_ Dynamics 8th Edition
- Pages: 735; extracted characters: 1462049
- rigid_body_dynamics: 695
- geometry_math_support: 613
- geometry_moments: 286
- propulsion: 125
- vibration_control_signals: 111
- distributed_structures: 15
- engineering_economy: 6
- circuits_em: 2

### Engineering_Mechanics_Statics_15th_Edition_by_Russell_C._Hibbeler (1)
- Pages: 677; extracted characters: 983338
- geometry_math_support: 872
- geometry_moments: 691
- rigid_body_dynamics: 83
- distributed_structures: 43
- propulsion: 20
- heat_transfer: 1
- circuits_em: 1

### Engineering_Mechanics_Statics_15th_Edition_by_Russell_C._Hibbeler
- Pages: 677; extracted characters: 983338
- geometry_math_support: 872
- geometry_moments: 691
- rigid_body_dynamics: 83
- distributed_structures: 43
- propulsion: 20
- heat_transfer: 1
- circuits_em: 1

### FE Mechanical Practice Exam
- Pages: 126; extracted characters: 85029
- geometry_math_support: 39
- rigid_body_dynamics: 27
- heat_transfer: 21
- engineering_economy: 17
- stress_strain_failure: 14
- geometry_moments: 12
- propulsion: 9
- circuits_em: 6

### Finite Element Analysis for Design Engineers
- Pages: 287; extracted characters: 419939
- finite_elements: 290
- heat_transfer: 127
- geometry_math_support: 102
- stress_strain_failure: 91
- vibration_control_signals: 67
- distributed_structures: 29
- rigid_body_dynamics: 26
- engineering_economy: 19

### Heat and Mass Transfer_ Fundamentals and
- Pages: 1057; extracted characters: 3444224
- heat_transfer: 10098
- geometry_math_support: 1628
- mass_transfer_fluids: 1360
- rigid_body_dynamics: 349
- propulsion: 271
- engineering_economy: 135
- stress_strain_failure: 81
- circuits_em: 33

### Introduction to Geometry
- Pages: 576; extracted characters: 1037494
- geometry_math_support: 1294
- rigid_body_dynamics: 98
- geometry_moments: 40
- engineering_economy: 2
- distributed_structures: 1

### Introduction to Geometry Solutions Manual
- Pages: 235; extracted characters: 1

### Introduction to Mechatronics and Measurement Systems
- Pages: 609; extracted characters: 1254180
- rigid_body_dynamics: 447
- circuits_em: 340
- vibration_control_signals: 199
- geometry_math_support: 57
- engineering_economy: 32
- heat_transfer: 26
- stress_strain_failure: 24
- propulsion: 6

### Mechanics of Materials - Instructor Solutions Manual
- Pages: 1598; extracted characters: 1664553
- stress_strain_failure: 1120
- geometry_math_support: 348
- geometry_moments: 238
- distributed_structures: 80
- rigid_body_dynamics: 29
- propulsion: 29
- finite_elements: 16
- mass_transfer_fluids: 9

### Mechanics of Materials
- Pages: 917; extracted characters: 1510134
- stress_strain_failure: 1315
- geometry_math_support: 958
- geometry_moments: 272
- distributed_structures: 163
- rigid_body_dynamics: 60
- finite_elements: 53
- mass_transfer_fluids: 51
- propulsion: 30
