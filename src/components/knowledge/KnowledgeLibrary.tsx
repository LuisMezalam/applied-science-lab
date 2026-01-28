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
    ],
    sourceDocument: 'General_Translation_Template_For_All_Work_disciplines_wrt_loading_2.pdf',
  },
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
                        {concept.equations.slice(0, 2).map((eq, i) => (
                          <div key={i} className="text-primary/80">{eq}</div>
                        ))}
                        {concept.equations.length > 2 && (
                          <div className="text-muted-foreground">
                            +{concept.equations.length - 2} more equations
                          </div>
                        )}
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
