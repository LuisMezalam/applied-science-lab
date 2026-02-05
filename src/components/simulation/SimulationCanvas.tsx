import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IntensityField, MomentResults, DomainType, NegativeOrderMoments } from '@/types/physics';

interface SimulationCanvasProps {
  field: IntensityField;
  moments: MomentResults;
  domain: DomainType;
  showCentroid?: boolean;
  showDispersion?: boolean;
  showEffectiveWidth?: boolean;
  negativeOrderMoments?: NegativeOrderMoments;
  animated?: boolean;
}

const domainColors = {
  structures: { fill: 'rgba(59, 130, 246, 0.3)', stroke: '#3B82F6', glow: '#60A5FA' },
  heat: { fill: 'rgba(249, 115, 22, 0.3)', stroke: '#F97316', glow: '#FB923C' },
  fluids: { fill: 'rgba(20, 184, 166, 0.3)', stroke: '#14B8A6', glow: '#2DD4BF' },
};

export function SimulationCanvas({
  field,
  moments,
  domain,
  showCentroid = true,
  showDispersion = true,
  showEffectiveWidth = false,
  negativeOrderMoments,
  animated = true,
}: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  const colors = domainColors[domain];

  const draw = useCallback((ctx: CanvasRenderingContext2D, time: number, negMoments?: NegativeOrderMoments) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.fillStyle = 'hsl(222, 47%, 6%)';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'hsl(220, 20%, 15%)';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (i / 10) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = padding.top + (i / 8) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Calculate scales
    const maxValue = Math.max(...field.values, 1);
    const domainStart = field.domain[0];
    const domainEnd = field.domain[1];
    const domainRange = domainEnd - domainStart;

    const xScale = (x: number) => padding.left + ((x - domainStart) / domainRange) * plotWidth;
    const yScale = (y: number) => height - padding.bottom - (y / maxValue) * plotHeight;

    // Draw filled area under curve with gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, colors.fill);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.moveTo(xScale(field.positions[0]), yScale(0));
    
    field.positions.forEach((pos, i) => {
      ctx.lineTo(xScale(pos), yScale(field.values[i]));
    });
    
    ctx.lineTo(xScale(field.positions[field.positions.length - 1]), yScale(0));
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw intensity curve with glow effect
    if (animated) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 10 + 5 * Math.sin(time * 0.002);
    }
    
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xScale(field.positions[0]), yScale(field.values[0]));
    
    field.positions.forEach((pos, i) => {
      ctx.lineTo(xScale(pos), yScale(field.values[i]));
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw centroid line
    if (showCentroid && moments.zerothMoment > 0) {
      const centroidX = xScale(moments.centroid);
      
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(centroidX, padding.top);
      ctx.lineTo(centroidX, height - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Centroid marker
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.moveTo(centroidX, height - padding.bottom + 5);
      ctx.lineTo(centroidX - 8, height - padding.bottom + 18);
      ctx.lineTo(centroidX + 8, height - padding.bottom + 18);
      ctx.closePath();
      ctx.fill();

      // Centroid label
      ctx.font = '12px JetBrains Mono';
      ctx.fillStyle = '#FBBF24';
      ctx.textAlign = 'center';
      ctx.fillText('x̄ = ' + moments.centroid.toFixed(2), centroidX, height - padding.bottom + 32);
    }

    // Draw dispersion region (±σ from centroid)
    if (showDispersion && moments.standardDeviation > 0 && moments.zerothMoment > 0) {
      const sigma = moments.standardDeviation;
      const leftBound = xScale(Math.max(domainStart, moments.centroid - sigma));
      const rightBound = xScale(Math.min(domainEnd, moments.centroid + sigma));
      
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.fillRect(leftBound, padding.top, rightBound - leftBound, plotHeight);
      
      // σ markers
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      
      [moments.centroid - sigma, moments.centroid + sigma].forEach(x => {
        if (x >= domainStart && x <= domainEnd) {
          const px = xScale(x);
          ctx.beginPath();
          ctx.moveTo(px, padding.top);
          ctx.lineTo(px, height - padding.bottom);
          ctx.stroke();
        }
      });
      ctx.setLineDash([]);
    }

    // Draw effective width region (from negative-order moments)
    if (showEffectiveWidth && negMoments && negMoments.effectiveWidth2 < Infinity && moments.zerothMoment > 0) {
      const wEff = negMoments.effectiveWidth2;
      const leftBound = xScale(Math.max(domainStart, moments.centroid - wEff / 2));
      const rightBound = xScale(Math.min(domainEnd, moments.centroid + wEff / 2));
      
      // Fill region with cyan/teal color
      ctx.fillStyle = 'rgba(34, 211, 238, 0.12)';
      ctx.fillRect(leftBound, padding.top, rightBound - leftBound, plotHeight);
      
      // Draw w_eff boundary lines
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      
      const wEffLeft = moments.centroid - wEff / 2;
      const wEffRight = moments.centroid + wEff / 2;
      
      [wEffLeft, wEffRight].forEach(x => {
        if (x >= domainStart && x <= domainEnd) {
          const px = xScale(x);
          ctx.beginPath();
          ctx.moveTo(px, padding.top);
          ctx.lineTo(px, height - padding.bottom);
          ctx.stroke();
        }
      });
      ctx.setLineDash([]);

      // Draw w_eff label with bracket
      const labelY = padding.top + 20;
      const leftPx = xScale(Math.max(domainStart, wEffLeft));
      const rightPx = xScale(Math.min(domainEnd, wEffRight));
      const midX = (leftPx + rightPx) / 2;
      
      // Bracket lines
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftPx, labelY);
      ctx.lineTo(leftPx, labelY - 8);
      ctx.lineTo(rightPx, labelY - 8);
      ctx.lineTo(rightPx, labelY);
      ctx.stroke();
      
      // w_eff label
      ctx.font = '11px JetBrains Mono';
      ctx.fillStyle = '#22D3EE';
      ctx.textAlign = 'center';
      ctx.fillText(`w_eff = ${wEff.toFixed(3)}`, midX, labelY - 12);
    }

    // Draw axes
    ctx.strokeStyle = 'hsl(210, 40%, 70%)';
    ctx.lineWidth = 1.5;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();

    // Axis labels
    ctx.font = '12px Inter';
    ctx.fillStyle = 'hsl(210, 40%, 70%)';
    ctx.textAlign = 'center';
    
    // X-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = domainStart + (i / 5) * domainRange;
      const x = xScale(value);
      ctx.fillText(value.toFixed(1), x, height - padding.bottom + 20);
    }
    
    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = (i / 4) * maxValue;
      const y = yScale(value);
      ctx.fillText(value.toFixed(1), padding.left - 10, y + 4);
    }

    // Axis titles
    ctx.font = '14px Inter';
    ctx.fillStyle = 'hsl(210, 40%, 80%)';
    ctx.textAlign = 'center';
    ctx.fillText('Position x', width / 2, height - 10);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Intensity I(x)', 0, 0);
    ctx.restore();

    // Domain indicator
    ctx.font = 'bold 11px Inter';
    ctx.fillStyle = colors.stroke;
    ctx.textAlign = 'left';
    const domainLabel = domain.charAt(0).toUpperCase() + domain.slice(1);
    ctx.fillText(domainLabel, width - padding.right - 70, padding.top - 15);

  }, [field, moments, domain, colors, showCentroid, showDispersion, showEffectiveWidth, animated]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (animated) {
      const animate = () => {
        timeRef.current += 16;
        draw(ctx, timeRef.current, negativeOrderMoments);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      draw(ctx, 0, negativeOrderMoments);
    }
  }, [draw, animated, negativeOrderMoments]);

  // Redraw on resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      draw(ctx, timeRef.current, negativeOrderMoments);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="simulation-canvas w-full h-full min-h-[400px]"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </motion.div>
  );
}
