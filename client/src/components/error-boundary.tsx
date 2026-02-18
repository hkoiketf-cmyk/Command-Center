import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-background p-4"
          role="alert"
          aria-live="assertive"
        >
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h1 className="text-lg font-semibold">Something went wrong</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. Please try again.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              )}
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.assign("/")}
              >
                Go to home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
