import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-8 w-8 text-destructive shrink-0 mt-0.5" aria-hidden />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                The page you're looking for doesn't exist or was moved.
              </p>
              <Button asChild className="mt-4">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to dashboard
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
