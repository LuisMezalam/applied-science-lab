import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

interface EquationRendererProps {
  equation: string;
}

/**
 * Renders equation strings with mixed LaTeX and plain text.
 * LaTeX segments are delimited by \( ... \).
 */
export function EquationRenderer({ equation }: EquationRendererProps) {
  // Split on \(...\) delimiters, capturing the content
  const parts = equation.split(/\\\((.+?)\\\)/g);

  if (parts.length === 1) {
    // No LaTeX found, render as plain text
    return <span>{equation}</span>;
  }

  return (
    <span className="inline leading-relaxed">
      {parts.map((part, i) => {
        // Odd indices are LaTeX content (captured groups)
        if (i % 2 === 1) {
          return (
            <span key={i} className="inline-block align-middle">
              <InlineMath math={part} />
            </span>
          );
        }
        // Even indices are plain text
        return part ? <span key={i}>{part}</span> : null;
      })}
    </span>
  );
}
