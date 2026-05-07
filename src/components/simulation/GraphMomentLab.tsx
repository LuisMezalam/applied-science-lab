import { useEffect, useMemo, useState, type ElementType } from 'react';
import {
  Atom,
  Box,
  Calculator,
  CircleDot,
  Gauge,
  GitBranch,
  Network,
  Sigma,
  Target,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EquationRenderer } from '@/components/knowledge/EquationRenderer';
import { readEnumParam, readNumberParam, writeQueryParams } from '@/lib/urlState';

type GraphScenarioId = 'circuit-energy' | 'fea-error' | 'fea-compliance';

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  ref: string;
  baseIntensity: number;
}

interface GraphScenario {
  id: GraphScenarioId;
  name: string;
  shortName: string;
  icon: ElementType;
  color: string;
  domain: string;
  atlasRefs: string[];
  quantity: string;
  domainText: string;
  note: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphMomentResults {
  resultant: number;
  centroidX: number;
  centroidY: number;
  sigmaXX: number;
  sigmaYY: number;
  sigmaXY: number;
  principal1: number;
  principal2: number;
  theta: number;
  spread: number;
  anisotropy: number;
  inverseMoment: number;
  effectiveRadius: number;
  points: Array<GraphEdge & { intensity: number; midX: number; midY: number; probability: number }>;
}

const SVG_WIDTH = 720;
const SVG_HEIGHT = 420;
const SVG_PADDING = 58;

const GRAPH_SCENARIOS: GraphScenario[] = [
  {
    id: 'circuit-energy',
    name: 'Circuit Graph Energy',
    shortName: 'Circuits',
    icon: Zap,
    color: 'hsl(var(--accent))',
    domain: 'Circuits',
    atlasRefs: ['M-010', 'M-011', 'M-055', 'M-056'],
    quantity: 'Branch intensity $I_e\\in\\{|i_e|,\\;P_e,\\;\\frac{1}{2}C_ev_e^2,\\;\\frac{1}{2}L_ei_e^2\\}$',
    domainText: '$e\\in E$ with midpoint embedding $\\phi(e)$',
    note: 'A circuit becomes a graph measure when every component or branch is assigned an intensity and a drawn position.',
    nodes: [
      { id: 'source', label: 'Vs', x: 0.08, y: 0.52 },
      { id: 'r1', label: 'R1', x: 0.28, y: 0.28 },
      { id: 'c1', label: 'C', x: 0.5, y: 0.3 },
      { id: 'l1', label: 'L', x: 0.72, y: 0.45 },
      { id: 'load', label: 'Load', x: 0.92, y: 0.58 },
      { id: 'r2', label: 'R2', x: 0.42, y: 0.78 },
    ],
    edges: [
      { id: 'e1', from: 'source', to: 'r1', label: 'R1 loss', ref: 'M-011', baseIntensity: 7.8 },
      { id: 'e2', from: 'r1', to: 'c1', label: 'C energy', ref: 'M-055', baseIntensity: 3.7 },
      { id: 'e3', from: 'c1', to: 'l1', label: 'L energy', ref: 'M-056', baseIntensity: 5.4 },
      { id: 'e4', from: 'l1', to: 'load', label: 'load power', ref: 'M-011', baseIntensity: 4.2 },
      { id: 'e5', from: 'r1', to: 'r2', label: 'branch current', ref: 'M-010', baseIntensity: 2.6 },
      { id: 'e6', from: 'r2', to: 'load', label: 'return loss', ref: 'M-011', baseIntensity: 3.1 },
    ],
  },
  {
    id: 'fea-error',
    name: 'FEA Error Indicator Graph',
    shortName: 'FEA Error',
    icon: Box,
    color: 'hsl(var(--accent))',
    domain: 'Materials / FEA',
    atlasRefs: ['M-047', 'M-048'],
    quantity: 'Element intensity $I_e=\\eta_e^2\\ge0$ or nodal force intensity $I_i=\\|\\mathbf{F}_i\\|$',
    domainText: '$e\\in\\mathcal{E}$ with element centroid embedding $\\phi(e)$',
    note: 'A mesh refinement indicator is already a graph intensity: it says where discretization error lives.',
    nodes: [
      { id: 'n1', label: '1', x: 0.1, y: 0.18 },
      { id: 'n2', label: '2', x: 0.38, y: 0.12 },
      { id: 'n3', label: '3', x: 0.68, y: 0.18 },
      { id: 'n4', label: '4', x: 0.9, y: 0.34 },
      { id: 'n5', label: '5', x: 0.18, y: 0.55 },
      { id: 'n6', label: '6', x: 0.48, y: 0.52 },
      { id: 'n7', label: '7', x: 0.78, y: 0.68 },
      { id: 'n8', label: '8', x: 0.3, y: 0.86 },
      { id: 'n9', label: '9', x: 0.62, y: 0.9 },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2', label: 'eta 1', ref: 'M-048', baseIntensity: 1.8 },
      { id: 'e2', from: 'n2', to: 'n3', label: 'eta 2', ref: 'M-048', baseIntensity: 2.4 },
      { id: 'e3', from: 'n3', to: 'n4', label: 'eta 3', ref: 'M-048', baseIntensity: 4.9 },
      { id: 'e4', from: 'n1', to: 'n5', label: 'eta 4', ref: 'M-048', baseIntensity: 2.1 },
      { id: 'e5', from: 'n2', to: 'n6', label: 'eta 5', ref: 'M-048', baseIntensity: 6.8 },
      { id: 'e6', from: 'n3', to: 'n6', label: 'eta 6', ref: 'M-048', baseIntensity: 7.5 },
      { id: 'e7', from: 'n4', to: 'n7', label: 'eta 7', ref: 'M-048', baseIntensity: 5.7 },
      { id: 'e8', from: 'n5', to: 'n8', label: 'eta 8', ref: 'M-048', baseIntensity: 1.4 },
      { id: 'e9', from: 'n6', to: 'n8', label: 'eta 9', ref: 'M-047', baseIntensity: 3.2 },
      { id: 'e10', from: 'n6', to: 'n9', label: 'eta 10', ref: 'M-048', baseIntensity: 4.1 },
      { id: 'e11', from: 'n7', to: 'n9', label: 'eta 11', ref: 'M-048', baseIntensity: 3.4 },
    ],
  },
  {
    id: 'fea-compliance',
    name: 'Element Compliance Graph',
    shortName: 'Compliance',
    icon: GitBranch,
    color: 'hsl(var(--primary))',
    domain: 'Materials / Optimization',
    atlasRefs: ['M-021', 'M-084'],
    quantity: 'Element intensity $I_e=\\mathbf{u}_e^T\\mathbf{k}_e\\mathbf{u}_e\\ge0$',
    domainText: '$e\\in\\mathcal{E}$ with element centroid embedding $\\phi(e)$',
    note: 'Compliance contribution is a graph intensity that exposes weak regions before a full topology optimizer is needed.',
    nodes: [
      { id: 'a', label: 'A', x: 0.08, y: 0.22 },
      { id: 'b', label: 'B', x: 0.28, y: 0.12 },
      { id: 'c', label: 'C', x: 0.5, y: 0.16 },
      { id: 'd', label: 'D', x: 0.72, y: 0.24 },
      { id: 'e', label: 'E', x: 0.92, y: 0.42 },
      { id: 'f', label: 'F', x: 0.16, y: 0.7 },
      { id: 'g', label: 'G', x: 0.4, y: 0.58 },
      { id: 'h', label: 'H', x: 0.66, y: 0.68 },
      { id: 'i', label: 'I', x: 0.86, y: 0.84 },
    ],
    edges: [
      { id: 'e1', from: 'a', to: 'b', label: 'stiff rib', ref: 'M-084', baseIntensity: 1.1 },
      { id: 'e2', from: 'b', to: 'c', label: 'low comp.', ref: 'M-084', baseIntensity: 1.9 },
      { id: 'e3', from: 'c', to: 'd', label: 'hinge band', ref: 'M-084', baseIntensity: 5.2 },
      { id: 'e4', from: 'd', to: 'e', label: 'edge flex', ref: 'M-084', baseIntensity: 7.1 },
      { id: 'e5', from: 'a', to: 'f', label: 'support', ref: 'M-021', baseIntensity: 1.4 },
      { id: 'e6', from: 'b', to: 'g', label: 'web', ref: 'M-084', baseIntensity: 2.8 },
      { id: 'e7', from: 'c', to: 'g', label: 'web', ref: 'M-084', baseIntensity: 3.5 },
      { id: 'e8', from: 'd', to: 'h', label: 'hot flex', ref: 'M-084', baseIntensity: 8.4 },
      { id: 'e9', from: 'f', to: 'g', label: 'lower web', ref: 'M-084', baseIntensity: 2.2 },
      { id: 'e10', from: 'g', to: 'h', label: 'load path', ref: 'M-084', baseIntensity: 6.1 },
      { id: 'e11', from: 'h', to: 'i', label: 'tip flex', ref: 'M-084', baseIntensity: 7.8 },
      { id: 'e12', from: 'e', to: 'i', label: 'edge comp.', ref: 'M-084', baseIntensity: 4.9 },
    ],
  },
];

const GRAPH_SCENARIO_VALUES = GRAPH_SCENARIOS.map(scenario => scenario.id) as GraphScenarioId[];

function getNodeMap(nodes: GraphNode[]) {
  return new Map(nodes.map(node => [node.id, node]));
}

function toSvgX(x: number) {
  return SVG_PADDING + x * (SVG_WIDTH - SVG_PADDING * 2);
}

function toSvgY(y: number) {
  return SVG_PADDING + y * (SVG_HEIGHT - SVG_PADDING * 2);
}

function calculateGraphMoments(scenario: GraphScenario, scale: number, epsilonPercent: number): GraphMomentResults {
  const nodeMap = getNodeMap(scenario.nodes);
  const points = scenario.edges.map(edge => {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to) {
      throw new Error(`Missing node for edge ${edge.id}`);
    }
    return {
      ...edge,
      intensity: edge.baseIntensity * scale,
      midX: (from.x + to.x) / 2,
      midY: (from.y + to.y) / 2,
      probability: 0,
    };
  });

  const resultant = points.reduce((sum, edge) => sum + edge.intensity, 0);
  const centroidX = points.reduce((sum, edge) => sum + edge.midX * edge.intensity, 0) / resultant;
  const centroidY = points.reduce((sum, edge) => sum + edge.midY * edge.intensity, 0) / resultant;

  const normalized = points.map(edge => ({ ...edge, probability: edge.intensity / resultant }));
  const sigmaXX = normalized.reduce((sum, edge) => sum + (edge.midX - centroidX) ** 2 * edge.probability, 0);
  const sigmaYY = normalized.reduce((sum, edge) => sum + (edge.midY - centroidY) ** 2 * edge.probability, 0);
  const sigmaXY = normalized.reduce((sum, edge) => sum + (edge.midX - centroidX) * (edge.midY - centroidY) * edge.probability, 0);
  const traceHalf = (sigmaXX + sigmaYY) / 2;
  const diffHalf = (sigmaXX - sigmaYY) / 2;
  const radius = Math.sqrt(diffHalf * diffHalf + sigmaXY * sigmaXY);
  const principal1 = traceHalf + radius;
  const principal2 = Math.max(0, traceHalf - radius);
  const theta = 0.5 * Math.atan2(2 * sigmaXY, sigmaXX - sigmaYY);
  const spread = Math.sqrt(Math.max(0, sigmaXX + sigmaYY));
  const anisotropy = principal2 > 1e-6 ? Math.sqrt(principal1 / principal2) : 99;
  const epsilon = (epsilonPercent / 100) * Math.SQRT2;
  const inverseMoment = normalized.reduce((sum, edge) => {
    const distanceSquared = (edge.midX - centroidX) ** 2 + (edge.midY - centroidY) ** 2;
    return sum + edge.probability / Math.sqrt(distanceSquared + epsilon * epsilon);
  }, 0);

  return {
    resultant,
    centroidX,
    centroidY,
    sigmaXX,
    sigmaYY,
    sigmaXY,
    principal1,
    principal2,
    theta,
    spread,
    anisotropy,
    inverseMoment,
    effectiveRadius: inverseMoment > 0 ? 1 / inverseMoment : 0,
    points: normalized,
  };
}

function formatNumber(value: number, digits = 3) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function GraphMomentLab() {
  const [scenarioId, setScenarioId] = useState<GraphScenarioId>(() =>
    readEnumParam('graphScenario', GRAPH_SCENARIO_VALUES, 'circuit-energy'),
  );
  const [intensityScale, setIntensityScale] = useState(() => readNumberParam('graphScale', 100));
  const [epsilonPercent, setEpsilonPercent] = useState(() => readNumberParam('graphEps', 8));

  const scenario = useMemo(
    () => GRAPH_SCENARIOS.find(item => item.id === scenarioId) ?? GRAPH_SCENARIOS[0],
    [scenarioId],
  );
  const results = useMemo(
    () => calculateGraphMoments(scenario, intensityScale / 100, epsilonPercent),
    [scenario, intensityScale, epsilonPercent],
  );

  useEffect(() => {
    writeQueryParams({
      graphScenario: scenarioId,
      graphScale: intensityScale,
      graphEps: epsilonPercent,
    });
  }, [scenarioId, intensityScale, epsilonPercent]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Network className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Graph Moment Lab</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Node-Edge Intensities As Moment Fields</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Turn circuit branches, finite-element mesh quantities, and compliance contributions into a graph measure.
            Every edge gets an intensity, an embedded location, and the same resultant, centroid, spread, and localization ladder.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {scenario.atlasRefs.map(ref => (
            <Badge key={ref} variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              {ref}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs value={scenarioId} onValueChange={value => setScenarioId(value as GraphScenarioId)}>
        <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted/50">
          {GRAPH_SCENARIOS.map(item => {
            const Icon = item.icon;
            return (
              <TabsTrigger key={item.id} value={item.id} className="gap-2">
                <Icon className="h-4 w-4" />
                {item.shortName}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4 text-primary" />
              Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-foreground">Intensity scale</label>
                <span className="font-mono text-xs text-muted-foreground">{intensityScale}%</span>
              </div>
              <Slider
                value={[intensityScale]}
                min={50}
                max={160}
                step={5}
                onValueChange={([value]) => setIntensityScale(value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-foreground">Localization epsilon</label>
                <span className="font-mono text-xs text-muted-foreground">{epsilonPercent}%</span>
              </div>
              <Slider
                value={[epsilonPercent]}
                min={3}
                max={24}
                step={1}
                onValueChange={([value]) => setEpsilonPercent(value)}
              />
            </div>

            <div className="rounded-md border border-border/40 bg-muted/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{scenario.domain}</p>
              <div className="mt-2 text-sm leading-relaxed text-foreground">
                <EquationRenderer equation={scenario.quantity} />
              </div>
              <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
                <EquationRenderer equation={scenario.domainText} />
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{scenario.note}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span className="flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-primary" />
                {scenario.name}
              </span>
              <Badge variant="secondary" className="font-mono text-xs">
                {scenario.edges.length} edges
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GraphCanvas scenario={scenario} results={results} epsilonPercent={epsilonPercent} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile title="Resultant" icon={Gauge} value={formatNumber(results.resultant)} detail={'$I_0=\\sum I_e$'} />
        <MetricTile
          title="Centroid"
          icon={Atom}
          value={`(${formatNumber(results.centroidX)}, ${formatNumber(results.centroidY)})`}
          detail={'$\\bar{\\phi}=\\sum \\phi p$'}
        />
        <MetricTile
          title="Spread"
          icon={Sigma}
          value={formatNumber(results.spread)}
          detail={'$\\sigma=\\sqrt{\\operatorname{tr}\\Sigma}$'}
        />
        <MetricTile
          title="Effective radius"
          icon={Target}
          value={formatNumber(results.effectiveRadius)}
          detail={'$w_{eff}=1/\\mu_{-1,\\varepsilon}$'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Edge Intensities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border border-border/40">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Edge</th>
                    <th className="px-3 py-2 text-left">Atlas</th>
                    <th className="px-3 py-2 text-right">Intensity</th>
                    <th className="px-3 py-2 text-right">Density</th>
                    <th className="px-3 py-2 text-right">Embedding</th>
                  </tr>
                </thead>
                <tbody>
                  {results.points.map(edge => (
                    <tr key={edge.id} className="border-t border-border/40">
                      <td className="px-3 py-2 font-medium text-foreground">{edge.label}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                          {edge.ref}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-foreground">{formatNumber(edge.intensity)}</td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">{formatNumber(edge.probability)}</td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                        ({formatNumber(edge.midX)}, {formatNumber(edge.midY)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Moment Ladder</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              '$I_0=\\sum_{e\\in E}I_e$',
              '$p_e=I_e/I_0,\\;\\sum_{e\\in E}p_e=1$',
              '$\\bar{\\phi}=\\sum_{e\\in E}\\phi(e)p_e$',
              '$\\Sigma=\\sum_{e\\in E}(\\phi(e)-\\bar{\\phi})(\\phi(e)-\\bar{\\phi})^T p_e$',
              '$\\mu_{-1,\\varepsilon}=\\sum_{e\\in E}(\\|\\phi(e)-\\bar{\\phi}\\|^2+\\varepsilon^2)^{-1/2}p_e$',
            ].map(equation => (
              <div key={equation} className="equation-box text-xs text-primary/85">
                <EquationRenderer equation={equation} />
              </div>
            ))}
            <div className="rounded-md border border-border/40 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
              Sign policy: graph entries use nonnegative branch, element, or node intensities. Signed currents,
              residual components, or force components should be split before the graph ladder is evaluated.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GraphCanvas({
  scenario,
  results,
  epsilonPercent,
}: {
  scenario: GraphScenario;
  results: GraphMomentResults;
  epsilonPercent: number;
}) {
  const nodeMap = getNodeMap(scenario.nodes);
  const maxIntensity = Math.max(...results.points.map(edge => edge.intensity));
  const centroidX = toSvgX(results.centroidX);
  const centroidY = toSvgY(results.centroidY);
  const effectiveRadius = results.effectiveRadius * (SVG_WIDTH - SVG_PADDING * 2);
  const axisLength = Math.max(40, results.spread * 520);
  const axisDX = Math.cos(results.theta) * axisLength;
  const axisDY = Math.sin(results.theta) * axisLength;

  return (
    <div className="overflow-hidden rounded-lg border border-border/40 bg-background/50">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label={`${scenario.name} graph moment visualization`}
        className="aspect-[12/7] w-full"
      >
        <defs>
          <radialGradient id="centroid-glow">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="hsl(var(--background))" />

        {results.points.map(edge => {
          const from = nodeMap.get(edge.from)!;
          const to = nodeMap.get(edge.to)!;
          const strokeWidth = 2 + (edge.intensity / maxIntensity) * 10;
          const opacity = 0.3 + (edge.intensity / maxIntensity) * 0.62;
          const x1 = toSvgX(from.x);
          const y1 = toSvgY(from.y);
          const x2 = toSvgX(to.x);
          const y2 = toSvgY(to.y);
          return (
            <g key={edge.id}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--muted))" strokeWidth="14" opacity="0.18" />
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={scenario.color} strokeWidth={strokeWidth} opacity={opacity} strokeLinecap="round" />
              <text
                x={toSvgX(edge.midX)}
                y={toSvgY(edge.midY) - 9}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px] font-medium"
              >
                {formatNumber(edge.intensity, 1)}
              </text>
            </g>
          );
        })}

        <circle cx={centroidX} cy={centroidY} r={effectiveRadius} fill="none" stroke="hsl(var(--success))" strokeDasharray="7 7" strokeOpacity="0.45" />
        <circle cx={centroidX} cy={centroidY} r={epsilonPercent * 1.2} fill="url(#centroid-glow)" />
        <line
          x1={centroidX - axisDX / 2}
          y1={centroidY - axisDY / 2}
          x2={centroidX + axisDX / 2}
          y2={centroidY + axisDY / 2}
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeOpacity="0.7"
        />
        <g>
          <circle cx={centroidX} cy={centroidY} r="9" fill="hsl(var(--success))" />
          <circle cx={centroidX} cy={centroidY} r="16" fill="none" stroke="hsl(var(--success))" strokeOpacity="0.45" />
          <text x={centroidX + 18} y={centroidY - 12} className="fill-success text-[12px] font-semibold">
            centroid
          </text>
        </g>

        {scenario.nodes.map(node => (
          <g key={node.id}>
            <circle cx={toSvgX(node.x)} cy={toSvgY(node.y)} r="15" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
            <text x={toSvgX(node.x)} y={toSvgY(node.y) + 4} textAnchor="middle" className="fill-foreground text-[11px] font-semibold">
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function MetricTile({
  title,
  icon: Icon,
  value,
  detail,
}: {
  title: string;
  icon: ElementType;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <div className="text-xl font-semibold text-foreground">{value}</div>
      <div className="mt-2 overflow-x-auto whitespace-nowrap text-xs text-primary/85">
        <EquationRenderer equation={detail} />
      </div>
    </div>
  );
}
