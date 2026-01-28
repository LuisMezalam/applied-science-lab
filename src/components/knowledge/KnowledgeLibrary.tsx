import { motion } from 'framer-motion';
import { KnowledgeConcept } from '@/types/physics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Beaker, Lightbulb, Building2, Flame, Droplets, Calculator } from 'lucide-react';

// Initial knowledge base from the PDF
const initialConcepts: KnowledgeConcept[] = [
  {
    id: 'unified-formulation',
    title: 'Unified Intensity-Field Moment Calculus',
    category: 'theory',
    domain: 'unified',
    content: 'Let Ω ⊂ ℝᵈ be a domain (d ∈ {1, 2, 3}). Let I(x) be a nonnegative intensity field on Ω. By normalizing an intensity field into a probability density, statistical moments become identical (up to scaling) to the rigidized moments used in mechanics.',
    equations: [
      'I(x) ≥ 0, x ∈ Ω',
      'I₀ = ∫ I(x) dx',
      'f(x) = I(x)/I₀, ∫ f(x) dx = 1',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  {
    id: 'moment-ladder',
    title: 'The n-Moment Ladder',
    category: 'theory',
    domain: 'unified',
    content: 'A systematic hierarchy of moments: n=0 gives the resultant I₀, n=1 (raw) gives the centroid x̄, n=1 (central) is identically zero, n=2 (central) gives dispersion Σ, and n≥3 quantify asymmetry and tails.',
    equations: [
      'n=0: I₀ = ∫ I(x) dx (resultant)',
      'n=1 (raw): x̄ = I₁/I₀ (centroid)',
      'n=1 (central): ∫(x-x̄)f(x)dx = 0',
      'n=2 (central): σ² = ∫(x-x̄)²f(x)dx',
      'n=3: γ₁ = μ₃/σ³ (skewness)',
      'n=4: γ₂ = μ₄/σ⁴ (kurtosis)',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  // ============ DIMENSIONAL HIERARCHY ============
  {
    id: 'dim-1d-loading',
    title: '1-D Loading: Lines & Walls',
    category: 'theory',
    domain: 'unified',
    content: 'For one-dimensional domains Ω = [a, b] ⊂ ℝ¹, the intensity field I(x) represents line loads (N/m), linear heat sources (W/m), or pressure along edges. Integration reduces to single integrals over the line segment.',
    equations: [
      'Ω = [a, b] ⊂ ℝ¹ (line segment)',
      'I₀ = ∫ₐᵇ I(x) dx',
      'x̄ = (1/I₀) ∫ₐᵇ x·I(x) dx',
      'σ² = (1/I₀) ∫ₐᵇ (x-x̄)²·I(x) dx',
      'Examples: beam line loads, wall heat flux',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  {
    id: 'dim-2d-elementary',
    title: '2-D Loading: Elementary Shapes',
    category: 'theory',
    domain: 'unified',
    content: 'For two-dimensional domains Ω ⊂ ℝ², elementary shapes (rectangles, circles, triangles) allow closed-form moment calculations. The intensity field I(x,y) represents surface pressure (Pa), heat flux (W/m²), or distributed loads.',
    equations: [
      'Ω ⊂ ℝ² (rectangle, circle, triangle)',
      'I₀ = ∬_Ω I(x,y) dA',
      'x̄ = (1/I₀) ∬_Ω x·I(x,y) dA',
      'ȳ = (1/I₀) ∬_Ω y·I(x,y) dA',
      'Σ = (1/I₀) ∬_Ω (r-r̄)(r-r̄)ᵀ I(x,y) dA',
      'Iₓₓ = ∬ y²·I dA, Iᵧᵧ = ∬ x²·I dA, Iₓᵧ = ∬ xy·I dA',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  {
    id: 'dim-2d-complex',
    title: '2-D Loading: Complex Shapes',
    category: 'theory',
    domain: 'unified',
    content: 'Complex 2D domains with irregular boundaries require numerical integration (FEM mesh, Monte Carlo). The moment tensor Σ becomes a 2×2 matrix describing principal axes of dispersion.',
    equations: [
      'Ω = arbitrary 2D region',
      'I₀ ≈ Σᵢ I(xᵢ,yᵢ)·ΔAᵢ (numerical)',
      'Σ = [σₓₓ  σₓᵧ; σₓᵧ  σᵧᵧ] (covariance matrix)',
      'Principal moments: eigenvalues of Σ',
      'Principal axes: eigenvectors of Σ',
      'Iₚ₁, Iₚ₂ = principal second moments',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  {
    id: 'dim-3d-surfaces',
    title: '3-D Loading: Surfaces',
    category: 'theory',
    domain: 'unified',
    content: 'For loading on 3D surfaces S ⊂ ℝ³, the intensity I(x,y,z) integrates over the surface area. Common in aerodynamic pressure distributions, thermal radiation on curved bodies, and shell structures.',
    equations: [
      'S ⊂ ℝ³ (curved surface)',
      'I₀ = ∬_S I(r) dS',
      'r̄ = (x̄, ȳ, z̄) = (1/I₀) ∬_S r·I(r) dS',
      'Σ = 3×3 covariance tensor',
      'dS = |∂r/∂u × ∂r/∂v| du dv (parametric)',
      'Applications: pressure on aircraft wings, solar irradiance on curved panels',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  {
    id: 'dim-3d-volumes',
    title: '3-D Loading: Volumes',
    category: 'theory',
    domain: 'unified',
    content: 'Volumetric intensity fields I(x,y,z) on V ⊂ ℝ³ represent body forces (N/m³), volumetric heat generation (W/m³), or density distributions. Triple integrals yield 3D moments and inertia tensors.',
    equations: [
      'V ⊂ ℝ³ (3D volume)',
      'I₀ = ∭_V I(x,y,z) dV',
      'r̄ = (1/I₀) ∭_V r·I(r) dV (centroid)',
      'Iⱼₖ = ∭_V rⱼrₖ·I(r) dV (inertia tensor)',
      'J = Tr(I)·𝟙 - I (inertia about centroid)',
      'Applications: mass distribution, self-weight, heat generation in reactors',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  // ============ DOMAIN-SPECIFIC APPLICATIONS ============
  {
    id: 'structures-interpretation',
    title: 'Structures: Line Load Moments',
    category: 'application',
    domain: 'structures',
    content: 'For a line load w(x) on [0, L], the zeroth moment gives the resultant force, and the first moment divided by the resultant gives the point of application where the resultant effectively acts.',
    equations: [
      'I₀ = ∫₀ᴸ w(x) dx (resultant force)',
      'x̄ = (1/I₀) ∫₀ᴸ x·w(x) dx',
      'E[M] = (L²/8)·E[w] for simply supported beam',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  {
    id: 'structures-2d',
    title: 'Structures: 2D Plate Loading',
    category: 'application',
    domain: 'structures',
    content: 'For pressure p(x,y) on a plate Ω, moments determine equivalent point load location and load dispersion affecting plate bending moments.',
    equations: [
      'F = ∬_Ω p(x,y) dA (total force)',
      '(x̄, ȳ) = center of pressure',
      'Mₓ = ∬_Ω y·p dA, Mᵧ = ∬_Ω x·p dA',
      'Plate bending: D∇⁴w = p(x,y)',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  {
    id: 'heat-interpretation',
    title: 'Heat Transfer: Thermal Loading',
    category: 'application',
    domain: 'heat',
    content: 'Let q″(x,y) ≥ 0 be a surface heat flux on area A. The integral gives total heating power (resultant), the first moment yields the "center of heating", and the second moment measures spatial nonuniformity.',
    equations: [
      'Q̇ = ∫ q″ dA (total power)',
      'x̄ = (1/Q̇) ∫ x·q″ dA (center of heating)',
      'Σ = (1/Q̇) ∫(x-x̄)(x-x̄)ᵀ q″ dA',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  {
    id: 'heat-3d-generation',
    title: 'Heat Transfer: Volumetric Generation',
    category: 'application',
    domain: 'heat',
    content: 'Volumetric heat generation q‴(x,y,z) in W/m³ occurs in nuclear reactors, Joule heating, and chemical reactions. 3D moments locate the thermal centroid and characterize heat distribution.',
    equations: [
      'Q̇ = ∭_V q‴(r) dV (total generation)',
      'r̄ = (1/Q̇) ∭_V r·q‴(r) dV',
      '-k∇²T = q‴ (steady-state heat equation)',
      'Σ = dispersion tensor of heat source',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  {
    id: 'fluids-interpretation',
    title: 'Fluids/Aerodynamics: Pressure Loading',
    category: 'application',
    domain: 'fluids',
    content: 'Let p(x) ≥ 0 be pressure magnitude on a surface A. The centroid of pressure intensity is closely related to center-of-pressure concepts when the traction direction is approximately uniform.',
    equations: [
      'I₀ = ∫ₐ p dA',
      'x̄ = (1/I₀) ∫ₐ x·p dA',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  {
    id: 'fluids-3d-pressure',
    title: 'Fluids: 3D Pressure Surfaces',
    category: 'application',
    domain: 'fluids',
    content: 'Aerodynamic and hydrodynamic pressure on curved 3D surfaces requires surface integration. The center of pressure and moment coefficients depend on loading distribution over wings, hulls, or bluff bodies.',
    equations: [
      'F = ∬_S p(r)·n̂ dS (force vector)',
      'r_cp = (1/|F|) ∬_S r·|p| dS (center of pressure)',
      'M = ∬_S r × (p·n̂) dS (moment about origin)',
      'Cₚ = (p - p∞)/(½ρV²) (pressure coefficient)',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  // ============ THEORY ============
  {
    id: 'signed-field-rule',
    title: 'Signed-Field Rule (Rigor)',
    category: 'theory',
    domain: 'unified',
    content: 'If an engineering field S(x) can change sign, it cannot define a probability density directly. Two rigorous options: (1) Intensity transform using |S|, S², energy density, etc., or (2) Jordan decomposition S = S⁺ - S⁻.',
    equations: [
      'S = S⁺ - S⁻ with S± ≥ 0',
      'Option 1: |S| or S²',
      'Option 2: Jordan decomposition',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
  {
    id: 'elementary-shapes-formulas',
    title: 'Elementary Shape Centroids',
    category: 'example',
    domain: 'unified',
    content: 'Closed-form centroid and second moment formulas for common shapes with uniform loading intensity.',
    equations: [
      'Rectangle: x̄ = L/2, ȳ = H/2, Iₓₓ = LH³/12',
      'Triangle: x̄ = (a+b+c)/3 from vertices',
      'Circle: x̄ = ȳ = 0 (centered), I = πR⁴/4',
      'Semicircle: ȳ = 4R/(3π) from diameter',
      'Ellipse: Iₓₓ = πab³/4, Iᵧᵧ = πa³b/4',
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
];

const categoryIcons = {
  theory: BookOpen,
  application: Beaker,
  example: Lightbulb,
};

const domainIcons = {
  unified: Calculator,
  structures: Building2,
  heat: Flame,
  fluids: Droplets,
};

const domainColors = {
  unified: 'bg-math/20 text-math border-math/30',
  structures: 'bg-structures/20 text-structures border-structures/30',
  heat: 'bg-heat/20 text-heat border-heat/30',
  fluids: 'bg-fluids/20 text-fluids border-fluids/30',
};

interface KnowledgeLibraryProps {
  onConceptSelect?: (concept: KnowledgeConcept) => void;
}

export function KnowledgeLibrary({ onConceptSelect }: KnowledgeLibraryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Knowledge Library</h2>
        <Badge variant="outline" className="text-xs">
          {initialConcepts.length} concepts loaded
        </Badge>
      </div>

      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="space-y-3 pr-4">
          {initialConcepts.map((concept, index) => {
            const CategoryIcon = categoryIcons[concept.category];
            const DomainIcon = domainIcons[concept.domain];

            return (
              <motion.div
                key={concept.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="border-border/50 bg-card/60 backdrop-blur cursor-pointer hover:bg-card/80 transition-colors"
                  onClick={() => onConceptSelect?.(concept)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${domainColors[concept.domain]}`}>
                          <DomainIcon className="h-3.5 w-3.5" />
                        </div>
                        <CardTitle className="text-sm font-medium">{concept.title}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {concept.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {concept.content}
                    </p>
                    {concept.equations.length > 0 && (
                      <div className="equation-box text-xs space-y-1">
                        {concept.equations.map((eq, i) => (
                          <div key={i} className="text-primary/80">{eq}</div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
