import { Zap, LayoutGrid, Target, BarChart3, Clock, CheckSquare, Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: LayoutGrid,
    title: "Drag & Drop Dashboards",
    description: "Organize your workspace with customizable widget layouts across multiple desktops.",
  },
  {
    icon: Target,
    title: "Priority Tracking",
    description: "Keep your top 3 priorities per venture front and center for focused execution.",
  },
  {
    icon: BarChart3,
    title: "Revenue Insights",
    description: "Track customer payments, invoices, and monthly revenue trends with charts.",
  },
  {
    icon: Clock,
    title: "Time Management",
    description: "Block your day, set timers, and maintain focused work sessions.",
  },
  {
    icon: CheckSquare,
    title: "Habit Tracking",
    description: "Build streaks with a visual GitHub-style habit grid and daily journaling.",
  },
  {
    icon: Brain,
    title: "Quick Capture & CRM",
    description: "Capture ideas instantly and manage your pipeline from lead to close.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">HunterOS</span>
          </div>
          <Button asChild data-testid="button-login-nav">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </nav>

      <main>
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Your Personal Command Center
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              A modular dashboard built for solopreneurs. Track priorities, revenue, habits, time blocks, and more — all in one place.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild data-testid="button-get-started">
                <a href="/api/login">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Free to use. No credit card required.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10">
              Everything you need to stay on track
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f) => (
                <Card key={f.title} className="hover-elevate">
                  <CardContent className="pt-6">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 border-t border-border">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to take control?</h2>
            <p className="text-muted-foreground mb-6">
              Start building your personalized dashboard today.
            </p>
            <Button size="lg" asChild data-testid="button-cta-bottom">
              <a href="/api/login">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          HunterOS &mdash; Built for solopreneurs
        </div>
      </footer>
    </div>
  );
}
