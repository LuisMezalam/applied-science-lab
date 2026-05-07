import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShareStateButton } from '@/components/layout/ShareStateButton';
import { 
  Atom, 
  BookOpen, 
  FlaskConical,
  Square,
  Box,
  ArrowLeftRight,
  Layers,
  Network,
  Zap,
} from 'lucide-react';

export type ActiveTab = 'simulator' | 'surface2d' | 'volume3d' | 'graph' | 'labs' | 'comparison' | 'balance' | 'library';

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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Logo & Title */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full" />
              <div className="relative p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                <Atom className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                Unified Moment Calculus
              </h1>
              <p className="text-xs text-muted-foreground">
                Physics & Engineering Simulation Lab
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav
            aria-label="Primary simulator sections"
            className="flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1 lg:w-auto lg:overflow-visible"
          >
            <Button
              variant={activeTab === 'simulator' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('simulator')}
              aria-label="Open 1D intensity field simulator"
              aria-current={activeTab === 'simulator' ? 'page' : undefined}
              className="shrink-0 gap-2"
            >
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">1D</span>
            </Button>
            <Button
              variant={activeTab === 'surface2d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('surface2d')}
              aria-label="Open 2D surface field simulator"
              aria-current={activeTab === 'surface2d' ? 'page' : undefined}
              className="shrink-0 gap-2"
            >
              <Square className="h-4 w-4" />
              <span className="hidden sm:inline">2D</span>
            </Button>
            <Button
              variant={activeTab === 'volume3d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('volume3d')}
              aria-label="Open 3D volume field simulator"
              aria-current={activeTab === 'volume3d' ? 'page' : undefined}
              className="shrink-0 gap-2"
            >
              <Box className="h-4 w-4" />
              <span className="hidden sm:inline">3D</span>
            </Button>
            <Button
              variant={activeTab === 'graph' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('graph')}
              aria-label="Open graph moment lab"
              aria-current={activeTab === 'graph' ? 'page' : undefined}
              className="shrink-0 gap-2"
            >
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Graph</span>
            </Button>
            <Button
              variant={activeTab === 'labs' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('labs')}
              aria-label="Open engineering intensity modules"
              aria-current={activeTab === 'labs' ? 'page' : undefined}
              className="shrink-0 gap-2"
            >
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Labs</span>
            </Button>
            <Button
              variant={activeTab === 'comparison' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('comparison')}
              aria-label="Open cross-domain comparison"
              aria-current={activeTab === 'comparison' ? 'page' : undefined}
              className="shrink-0 gap-2"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
            </Button>
            <Button
              variant={activeTab === 'balance' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('balance')}
              aria-label="Open balance-law backbone"
              aria-current={activeTab === 'balance' ? 'page' : undefined}
              className="shrink-0 gap-2"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Balance</span>
            </Button>
            <Button
              variant={activeTab === 'library' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('library')}
              aria-label="Open engineering physics library"
              aria-current={activeTab === 'library' ? 'page' : undefined}
              className="shrink-0 gap-2"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Library</span>
            </Button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <ShareStateButton />
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/30">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-success font-medium">Engine Active</span>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
