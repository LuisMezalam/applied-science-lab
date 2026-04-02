import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header, ActiveTab } from '@/components/layout/Header';
import { MomentSimulator } from '@/components/simulation/MomentSimulator';
import { CrossDomainComparison } from '@/components/simulation/CrossDomainComparison';
import { Surface2DSimulator } from '@/components/simulation/Surface2DSimulator';
import { Volume3DSimulator } from '@/components/simulation/Volume3DSimulator';
import { KnowledgeLibrary } from '@/components/knowledge/KnowledgeLibrary';
import { MasterDictionary } from '@/components/knowledge/MasterDictionary';
import { Atom, ArrowRight, Layers, TrendingUp, Binary } from 'lucide-react';
import heroImage from '@/assets/hero-physics.jpg';

const Index = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [showHero, setShowHero] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {showHero && activeTab === 'simulator' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              {/* Hero Section */}
              <div className="relative rounded-2xl overflow-hidden border border-border/50">
                <div className="absolute inset-0">
                  <img
                    src={heroImage}
                    alt="Physics simulation visualization"
                    className="w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>
                
                <div className="relative z-10 p-8 md:p-12">
                  <div className="max-w-2xl">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm mb-4">
                        <Atom className="h-4 w-4" />
                        <span>Unified Moment Calculus Framework</span>
                      </div>
                    </motion.div>
                    
                    <motion.h2
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                    >
                      Explore Applied Mathematics
                      <br />
                      <span className="text-gradient-primary">Across Engineering Domains</span>
                    </motion.h2>
                    
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-muted-foreground mb-6 max-w-lg"
                    >
                      Interactive simulations demonstrating that structures, fluids, heat transfer, 
                      propulsion, dynamics, and circuits are fundamentally the same mathematical object—a 
                      nonnegative intensity field on a domain with moment ladder analysis.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex flex-wrap gap-3"
                    >
                      <button
                        onClick={() => setShowHero(false)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                      >
                        Start Simulating
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setActiveTab('library')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
                      >
                        View Knowledge Base
                      </button>
                    </motion.div>
                  </div>

                  {/* Feature Cards */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
                  >
                    <FeatureCard
                      icon={<Layers className="h-5 w-5" />}
                      title="Cross-Domain Unity"
                      description="Structures, heat, fluids, dynamics, circuits"
                      color="structures"
                    />
                    <FeatureCard
                      icon={<TrendingUp className="h-5 w-5" />}
                      title="n-Moment Ladder"
                      description="Zeroth through higher moments"
                      color="heat"
                    />
                    <FeatureCard
                      icon={<Binary className="h-5 w-5" />}
                      title="Rigorous Physics"
                      description="Real integral calculations"
                      color="fluids"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'simulator' && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[600px]"
            >
              <MomentSimulator />
            </motion.div>
          )}
          {activeTab === 'surface2d' && (
            <motion.div
              key="surface2d"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[600px]"
            >
              <Surface2DSimulator />
            </motion.div>
          )}
          {activeTab === 'volume3d' && (
            <motion.div
              key="volume3d"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[600px]"
            >
              <Volume3DSimulator />
            </motion.div>
          )}
          {activeTab === 'comparison' && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[600px]"
            >
              <CrossDomainComparison />
            </motion.div>
          )}
          {activeTab === 'dictionary' && (
            <motion.div
              key="dictionary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MasterDictionary />
            </motion.div>
          )}
          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <KnowledgeLibrary />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Based on "A Total Unification of Engineering Loads via Moment Calculus" • Feb 2026</p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              Physics Engine v1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'structures' | 'heat' | 'fluids';
}) {
  const colorClasses = {
    structures: 'border-structures/30 bg-structures/5 text-structures',
    heat: 'border-heat/30 bg-heat/5 text-heat',
    fluids: 'border-fluids/30 bg-fluids/5 text-fluids',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} backdrop-blur-sm`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h3 className="font-medium text-foreground text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default Index;
