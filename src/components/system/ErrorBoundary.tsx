import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application render failure', error, errorInfo);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-background px-4 py-12 text-foreground">
        <div className="mx-auto max-w-2xl rounded-lg border border-destructive/30 bg-card/90 p-6 shadow-lg">
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">The lab hit a runtime error.</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Reload the app to recover. If this repeats, the error message below can help diagnose the failing tab.
              </p>
            </div>
          </div>

          <pre className="mb-4 max-h-48 overflow-auto rounded-md border border-border bg-background/70 p-3 text-xs text-muted-foreground">
            {this.state.error.message}
          </pre>

          <Button onClick={() => window.location.reload()} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reload Lab
          </Button>
        </div>
      </div>
    );
  }
}
