# Formula QA Checklist

This ledger is the review trail for Library atlas entries before production use. Each entry must be checked for:

- Equation: resultant and recommended intensity are complete for the stated domain.
- Units: intensity, domain measure, resultant, centroid, and spread units are dimensionally consistent.
- Moments: centroid and spread definitions match the selected domain measure.
- Sign policy: signed quantities specify magnitude, square, energy, or Jordan split.
- Source safety: wording is paraphrased, equations are standard/derived, and no textbook prose is copied.

Status values:

- Open: needs human technical review.
- Reviewed: equations, units, moments, sign policy, and source safety checked.
- Needs revision: review found a problem to fix before release.

| ID | Domain | Kind | Quantity | Equation | Units | Moments | Sign/source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M-001 | structures | line | Distributed line load $w(x)$ [N/m] | Open | Open | Open | Open |
| M-002 | fluids | surface | Pressure magnitude $p(x,y)$ [Pa] | Open | Open | Open | Open |
| M-003 | heat | surface | Surface heat flux $q''(x,y)$ [W/m^2] | Open | Open | Open | Open |
| M-004 | heat | volume | Volumetric heat generation $q'''(x,y,z)$ [W/m^3] | Open | Open | Open | Open |
| M-005 | fluids | surface | Wall shear stress magnitude $|\tau_w(x,y)|$ | Open | Open | Open | Open |
| M-006 | dynamics | time | Force input $F(t)$ | Open | Open | Open | Open |
| M-007 | dynamics | time | Torque input $\tau(t)$ | Open | Open | Open | Open |
| M-008 | dynamics | time | Translational damper dissipation | Open | Open | Open | Open |
| M-009 | dynamics | time | Rotational damper dissipation | Open | Open | Open | Open |
| M-010 | circuits | graph | Circuit branch current magnitude | Open | Open | Open | Open |
| M-011 | circuits | graph | Circuit component power dissipation $P_e$ | Open | Open | Open | Open |
| M-012 | propulsion | parameter | Performance coefficient curve $C_F(\xi)$ | Open | Open | Open | Open |
| M-013 | propulsion | parameter | Mach flow parameter kernel $MFP(M)$ | Open | Open | Open | Open |
| M-014 | propulsion | surface | Nacelle pressure-drag integrand | Open | Open | Open | Open |
| M-015 | propulsion | surface | Pressure-thrust density $|p-p_a|$ | Open | Open | Open | Open |
| M-016 | propulsion | surface | Momentum-flux density $\rho u^2$ | Open | Open | Open | Open |
| M-017 | structures | volume | Body force density $\mathbf{b}(x,y,z)$ | Open | Open | Open | Open |
| M-018 | structures | surface | Traction magnitude $\|\mathbf{t}(x,y)\|$ | Open | Open | Open | Open |
| M-019 | structures | point | Concentrated force idealization $F\delta(z-z_0)$ | Open | Open | Open | Open |
| M-020 | structures | line | Distributed moment or torque density $m(x)$ | Open | Open | Open | Open |
| M-021 | materials | volume | Elastic strain energy density $u_s=\frac{1}{2}\sigma:\varepsilon$ | Open | Open | Open | Open |
| M-022 | structures | surface | Contact or bearing pressure $p_c(x,y)$ | Open | Open | Open | Open |
| M-023 | structures | line | Foundation reaction $q(x)$ [N/m] | Open | Open | Open | Open |
| M-024 | materials | volume | Mass density $\rho(x,y,z)$ | Open | Open | Open | Open |
| M-025 | fluids | surface | Mass flux density $\rho\mathbf{u}\cdot\mathbf{n}$ | Open | Open | Open | Open |
| M-026 | fluids | volume | Kinetic energy density $\frac{1}{2}\rho\|\mathbf{u}\|^2$ | Open | Open | Open | Open |
| M-027 | fluids | volume | Viscous dissipation rate $\Phi(x,y,z)$ [W/m^3] | Open | Open | Open | Open |
| M-028 | fluids | volume | Turbulent kinetic energy density $\rho k$ | Open | Open | Open | Open |
| M-029 | circuits | surface | Current density magnitude $\|\mathbf{J}(x,y)\|$ | Open | Open | Open | Open |
| M-030 | circuits | volume | Joule heating density $\sigma\|\mathbf{E}\|^2$ | Open | Open | Open | Open |
| M-031 | circuits | volume | Electromagnetic energy density | Open | Open | Open | Open |
| M-032 | waves | surface | Acoustic intensity magnitude | Open | Open | Open | Open |
| M-033 | propulsion | volume | Combustor heat-release rate $\dot{q}_{chem}$ | Open | Open | Open | Open |
| M-034 | heat | volume | Entropy generation density $\dot{s}_{gen}$ | Open | Open | Open | Open |
| M-035 | heat | surface | Radiative heat flux or irradiance $G(x,y)$ | Open | Open | Open | Open |
| M-036 | waves | frequency | Power spectral density $S_{xx}(f)$ | Open | Open | Open | Open |
| M-037 | materials | line | Crack-front energy release rate $G(s)$ | Open | Open | Open | Open |
| M-038 | propulsion | surface | Mass-flow density at nozzle or inlet | Open | Open | Open | Open |
| M-039 | structures | line | Aerodynamic lift or drag distribution $l(x),d(x)$ [N/m] | Open | Open | Open | Open |
| M-040 | materials | volume | Damage or fatigue density $D(x)$ | Open | Open | Open | Open |
| M-041 | structures | surface | Section area density for centroids $dA$ | Open | Open | Open | Open |
| M-042 | structures | surface | Second moment of area kernel $(y-y_0)^2$ or $r^2$ | Open | Open | Open | Open |
| M-043 | dynamics | volume | Mass moment of inertia density $\rho r_\perp^2$ | Open | Open | Open | Open |
| M-044 | materials | volume | Equivalent stress field $\sigma_{eq}(\mathbf{x})$ | Open | Open | Open | Open |
| M-045 | materials | volume | Plastic work density $w_p(\mathbf{x})$ | Open | Open | Open | Open |
| M-046 | materials | volume | Equivalent strain or strain-rate magnitude | Open | Open | Open | Open |
| M-047 | materials | graph | Finite-element nodal force magnitude $\|\mathbf{F}_i\|$ | Open | Open | Open | Open |
| M-048 | materials | graph | Finite-element error indicator $\eta_e^2$ | Open | Open | Open | Open |
| M-049 | heat | volume | Thermal energy storage density $\rho c_p(T-T_{ref})$ | Open | Open | Open | Open |
| M-050 | heat | surface | Convective heat-transfer density $q''_{conv}$ | Open | Open | Open | Open |
| M-051 | heat | surface | Conductive normal heat flux $\mathbf{q}\cdot\mathbf{n}$ | Open | Open | Open | Open |
| M-052 | heat | volume | Species concentration or mass fraction field | Open | Open | Open | Open |
| M-053 | fluids | volume | Enstrophy or vorticity intensity $\frac{1}{2}\|\boldsymbol{\omega}\|^2$ | Open | Open | Open | Open |
| M-054 | circuits | time | Charge-delivery waveform from current $i(t)$ | Open | Open | Open | Open |
| M-055 | circuits | graph | Capacitor stored energy $\frac{1}{2}C_ev_e^2$ | Open | Open | Open | Open |
| M-056 | circuits | graph | Inductor stored energy $\frac{1}{2}L_ei_e^2$ | Open | Open | Open | Open |
| M-057 | circuits | surface | Surface charge density $\sigma_s(x,y)$ | Open | Open | Open | Open |
| M-058 | dynamics | time | Control effort density $u(t)^TRu(t)$ | Open | Open | Open | Open |
| M-059 | waves | frequency | Frequency-response output power density $|H(f)|^2S_{xx}(f)$ | Open | Open | Open | Open |
| M-060 | propulsion | time | Thrust history $T(t)$ | Open | Open | Open | Open |
| M-061 | propulsion | time | Propellant mass-flow history $\dot{m}_p(t)$ | Open | Open | Open | Open |
| M-062 | propulsion | surface | Combustor or nozzle wall heat flux $q''_w$ | Open | Open | Open | Open |
| M-063 | propulsion | parameter | Compressor or turbine loss coefficient map $\zeta(\xi)$ | Open | Open | Open | Open |
| M-064 | fluids | surface | Drag or lift pressure coefficient magnitude $|C_p-C_{p,ref}|$ | Open | Open | Open | Open |
| M-065 | structures | line | Beam bending strain-energy density $M(x)^2/(2EI)$ | Open | Open | Open | Open |
| M-066 | structures | line | Shaft torsional strain-energy density $T(x)^2/(2GJ)$ | Open | Open | Open | Open |
| M-067 | structures | line | Axial member strain-energy density $N(x)^2/(2EA)$ | Open | Open | Open | Open |
| M-068 | structures | line | Thin-wall shear flow magnitude $|q_s(s)|$ | Open | Open | Open | Open |
| M-069 | heat | volume | Thermal-gradient energy $k\|\nabla T\|^2$ | Open | Open | Open | Open |
| M-070 | heat | line | Fin heat-loss density $hP(T(x)-T_\infty)$ | Open | Open | Open | Open |
| M-071 | heat | surface | Diffusive species flux $|\mathbf{j}_A\cdot\mathbf{n}|$ | Open | Open | Open | Open |
| M-072 | heat | volume | Reaction-rate density $\dot{\omega}_A(\mathbf{x})$ | Open | Open | Open | Open |
| M-073 | fluids | parameter | Pressure-loss coefficient density $K(\xi)$ | Open | Open | Open | Open |
| M-074 | fluids | line | Hydraulic head-loss density $dh_L/dx$ | Open | Open | Open | Open |
| M-075 | circuits | surface | Magnetic flux density magnitude $|\mathbf{B}\cdot\mathbf{n}|$ | Open | Open | Open | Open |
| M-076 | dynamics | time | Tracking-error cost $e(t)^TQe(t)$ | Open | Open | Open | Open |
| M-077 | dynamics | time | State-energy measure $x(t)^TPx(t)$ | Open | Open | Open | Open |
| M-078 | waves | frequency | Sensor-noise spectral density $S_n(f)$ | Open | Open | Open | Open |
| M-079 | waves | frequency | Shock or response spectrum ordinate $S_a(f)$ | Open | Open | Open | Open |
| M-080 | propulsion | parameter | Turbomachinery stage-work density $\Delta h_0(\xi)$ | Open | Open | Open | Open |
| M-081 | propulsion | line | Blade loading distribution $\Delta p(s)$ or $f(s)$ | Open | Open | Open | Open |
| M-082 | propulsion | time | Emission mass-rate history $\dot{m}_{em}(t)$ | Open | Open | Open | Open |
| M-083 | materials | volume | Failure index or utilization field $U(\mathbf{x})$ | Open | Open | Open | Open |
| M-084 | materials | graph | Element compliance contribution $\mathbf{u}_e^T\mathbf{k}_e\mathbf{u}_e$ | Open | Open | Open | Open |
| M-085 | heat | volume | Temperature-excess field $|T(\mathbf{x})-T_{ref}|$ | Open | Open | Open | Open |
