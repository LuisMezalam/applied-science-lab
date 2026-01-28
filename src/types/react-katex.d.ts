declare module 'react-katex' {
  import { ReactNode } from 'react';

  interface KatexProps {
    children?: string;
    math?: string;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: Error) => ReactNode;
    settings?: object;
  }

  export const InlineMath: React.FC<KatexProps>;
  export const BlockMath: React.FC<KatexProps>;
}
