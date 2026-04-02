import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Atom, 
  BookOpen, 
  FlaskConical,
  Square,
  Box,
  TableProperties,
  ArrowLeftRight
} from 'lucide-react';

export type ActiveTab = 'simulator' | 'surface2d' | 'volume3d' | 'comparison' | 'dictionary' | 'library';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full" />
              <div className="relative p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                <Atom className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                Unified Moment Calculus
              </h1>
              <p className="text-xs text-muted-foreground">
                Physics & Engineering Simulation Lab
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
            <Button
              variant={activeTab === 'simulator' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('simulator')}
              className="gap-2"
            >
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">1D</span>
            </Button>
            <Button
              variant={activeTab === 'surface2d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('surface2d')}
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              <span className="hidden sm:inline">2D</span>
            </Button>
            <Button
              variant={activeTab === 'volume3d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('volume3d')}
              className="gap-2"
            >
              <Box className="h-4 w-4" />
              <span className="hidden sm:inline">3D</span>
            </Button>
            <Button
              variant={activeTab === 'comparison' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('comparison')}
              className="gap-2"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
            </Button>
            <Button
              size="sm"
              onClick={() => onTabChange('dictionary')}
              className="gap-2"
            >
              <TableProperties className="h-4 w-4" />
              <span className="hidden sm:inline">Dictionary</span>
            </Button>
            <Button
              variant={activeTab === 'library' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('library')}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Knowledge</span>
            </Button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/30">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-success font-medium">Engine Active</span>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
