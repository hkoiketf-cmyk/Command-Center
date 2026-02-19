import { useEffect, useRef, useState } from "react";
import {
  Zap, LayoutGrid, Target, BarChart3, Clock, CheckSquare, Brain,
  ArrowRight, Sparkles, Shield, Monitor, Smartphone, ChevronDown,
  Timer, BookOpen, TrendingUp, Kanban, MessageSquare,
  DollarSign, Users, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const landingImages = {
  hero: "/landing/hero-dashboard.png",
  featureWidgets: "/landing/feature-widgets.png",
  featureHunterAi: "/landing/feature-hunter-ai.png?v=2",
  featureAnalytics: "/landing/feature-analytics.png",
  featureBusiness: "/landing/feature-business.png",
  featureEmbedCustom: "/landing/feature-embed-custom.png",
  setupWizardRole: "/landing/setup-wizard-role.png",
  setupWizardTools: "/landing/setup-wizard-tools.png",
};

const WIDGET_COUNT = 19;

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

const widgetTypes = [
  { icon: LayoutGrid, name: "Notes" },
  { icon: Target, name: "Priorities" },
  { icon: BarChart3, name: "Revenue" },
  { icon: Timer, name: "Timer" },
  { icon: CheckSquare, name: "Habits" },
  { icon: BookOpen, name: "Journal" },
  { icon: TrendingUp, name: "KPIs" },
  { icon: Kanban, name: "CRM" },
  { icon: Target, name: "Focus Mode" },
  { icon: Clock, name: "Time Blocks" },
  { icon: DollarSign, name: "Expenses" },
  { icon: Users, name: "Meetings" },
  { icon: Brain, name: "Quick Capture" },
  { icon: MessageSquare, name: "AI Chat" },
  { icon: Monitor, name: "Embed Web Address" },
  { icon: Sparkles, name: "Context Mode" },
  { icon: TrendingUp, name: "Scorecard" },
  { icon: Clock, name: "Waiting For" },
  { icon: Monitor, name: "Code Block" },
];

function FeatureShowcase({
  title,
  subtitle,
  description,
  image,
  imageClassName,
  imageWrapperClassName,
  reverse,
  items,
}: {
  title: string;
  subtitle: string;
  description: string;
  image?: string;
  imageClassName?: string;
  imageWrapperClassName?: string;
  reverse?: boolean;
  items: string[];
}) {
  const { ref, isVisible } = useInView();

  return (
    <div
      ref={ref}
      className={`flex flex-col ${image && (reverse ? "lg:flex-row-reverse" : "lg:flex-row")} items-center gap-8 lg:gap-16 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className={`flex-1 ${image ? "max-w-xl" : "max-w-2xl mx-auto text-center"}`}>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{subtitle}</p>
        <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{title}</h3>
        <p className="text-base text-muted-foreground mb-6 leading-relaxed">{description}</p>
        <ul className={`space-y-3 ${!image ? "inline-block text-left" : ""}`}>
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>
      {image && (
        <div className="flex-1 max-w-2xl w-full">
          <div className={`rounded-md overflow-hidden border border-border/50 ${imageWrapperClassName ?? ""}`}>
            <img
              src={image}
              alt={title}
              className={imageClassName ?? "w-full h-auto"}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const heroAnim = useInView(0.05);
  const widgetGridAnim = useInView();
  const ctaAnim = useInView();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2 flex-shrink-0 rounded-md hover:opacity-90 transition-opacity" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} data-testid="link-home">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">MallenniumDash</span>
          </a>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="ghost" asChild>
              <a href="#features" data-testid="link-features">Features</a>
            </Button>
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <a href="#widgets" data-testid="link-widgets">Widgets</a>
            </Button>
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <a href="#pricing" data-testid="link-pricing">Pricing</a>
            </Button>
            <Button asChild data-testid="button-login-nav">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative py-20 sm:py-28 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />

          <div
            ref={heroAnim.ref}
            className={`relative max-w-5xl mx-auto text-center transition-all duration-500 ease-out ${heroAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm text-muted-foreground mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{WIDGET_COUNT} productivity widgets in one dashboard</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Your Personal
              <br />
              <span className="text-primary">Command Center</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              The all-in-one modular dashboard for solopreneurs. Track priorities, revenue, habits, time blocks, CRM, and more. Drag, drop, and customize everything.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild data-testid="button-get-started" className="text-base px-8">
                <a href="/api/login">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-learn-more" className="text-base px-8">
                <a href="#features">See How It Works</a>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              3-day free trial. Add your card—you're charged when the trial ends.
            </p>

            <div className="mt-12 sm:mt-16 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-lg blur-xl opacity-60" />
              <div className="relative rounded-md overflow-hidden border border-border/50 bg-card">
                <img
                  src={landingImages.hero}
                  alt="MallenniumDash dashboard"
                  className="w-full h-auto min-h-[200px]"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  data-testid="img-hero-dashboard"
                />
              </div>
            </div>

            <a
              href="#features"
              className="inline-flex items-center gap-1 mt-10 text-sm text-muted-foreground animate-bounce"
              data-testid="link-scroll-down"
            >
              <ChevronDown className="w-5 h-5" />
            </a>
          </div>
        </section>

        <section className="py-16 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { value: String(WIDGET_COUNT), label: "Widget Types" },
                { value: "100%", label: "Customizable" },
                { value: "Multi", label: "Desktop Layouts" },
                { value: "Real-time", label: "Data Sync" },
              ].map((stat) => (
                <div key={stat.label} data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                  <p className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-20 sm:py-28 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 sm:mb-20">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">Features</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Built for how you actually work
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Every widget is designed to solve a real problem solopreneurs face daily. No fluff, just tools that make a difference.
              </p>
            </div>

            <div className="space-y-24 sm:space-y-32">
              <FeatureShowcase
                subtitle="Organize"
                title="Drag & Drop Everything"
                description="Make it your own. Pick colors for every widget, arrange your layout, and resize from any edge—so your dashboard looks and works the way you want. See how colorful it can get when you personalize it."
                image={landingImages.featureWidgets}
                items={[
                  "Personalize each widget with its own color—make it your own",
                  "Multiple desktops with custom backgrounds",
                  "Resize and collapse widgets on the fly",
                  "Full mobile-responsive experience",
                ]}
              />

              <FeatureShowcase
                subtitle="AI-Powered"
                title="HunterAI Knows Your Dashboard"
                description="Ask HunterAI about your priorities, journal entries, revenue, or who to follow up with. It reads your widgets and answers in context—no copying data into a chat."
                image={landingImages.featureHunterAi}
                imageWrapperClassName="flex items-center justify-center p-4"
                imageClassName="h-[420px] sm:h-[520px] w-auto max-w-full object-contain mx-auto"
                reverse
                items={[
                  "Ask about tasks, journal, revenue, or follow-ups",
                  "Answers pulled from your actual dashboard data",
                  "Optional: add your OpenAI API key for full AI",
                  "Setup Wizard and AI Widget Builder for custom widgets",
                ]}
              />

              <FeatureShowcase
                subtitle="Analyze"
                title="Revenue & KPI Tracking"
                description="Keep a pulse on your business with revenue charts, KPI dashboards with color-coded thresholds, and weekly scorecards that show trends at a glance."
                image={landingImages.featureAnalytics}
                items={[
                  "Monthly revenue charts per venture",
                  "KPI progress bars with green/yellow/red thresholds",
                  "Weekly scorecard with trend indicators",
                  "Expense tracking with monthly burn rate",
                ]}
              />

              <FeatureShowcase
                subtitle="Manage"
                title="CRM & Business Tools"
                description="Run your business from one screen. A 5-column CRM pipeline, meeting prep workflows, expense tracking, and a waiting-for list that warns you when items go stale."
                image={landingImages.featureBusiness}
                reverse
                items={[
                  "Drag-and-drop CRM pipeline (Lead to Closed)",
                  "Meeting prep with talking points and action items",
                  "Recurring and variable expense tracking",
                  "Delegated task tracking with overdue warnings",
                ]}
              />

              <FeatureShowcase
                subtitle="Integrate"
                title="Embed Web Addresses & Custom Widgets"
                description="Load any website by URL in an Embed Web Address widget, or build custom widgets with the AI Widget Builder. One dashboard for your tools and your code."
                image={landingImages.featureEmbedCustom}
                items={[
                  "Embed Web Address: any URL in your dashboard",
                  "Code Block: edit HTML/JS with live preview",
                  "AI Widget Builder: describe a widget, get working code",
                  "Custom widgets with Preview and Code tabs",
                ]}
              />
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28 px-4 border-t border-border bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">Quick setup</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Pre-built templates, not a blank canvas
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Other dashboards hand you an empty grid and expect you to spend hours configuring everything. We give you a Setup Wizard: pick your role, choose your tools, and get a ready-to-use dashboard in under a minute.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
              <div className="flex-1 max-w-sm w-full rounded-md overflow-hidden border border-border/50 bg-card shadow-sm">
                <img
                  src={landingImages.setupWizardRole}
                  alt="Setup Wizard: choose your role (Content Creator, Sales, Freelancer, etc.)"
                  className="w-full h-auto"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex-1 max-w-sm w-full rounded-md overflow-hidden border border-border/50 bg-card shadow-sm">
                <img
                  src={landingImages.setupWizardTools}
                  alt="Setup Wizard: pick your tools (Timer, Journal, CRM, etc.)"
                  className="w-full h-auto"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6 max-w-xl mx-auto">
              Answer a few questions → we build the perfect dashboard for you. No manual widget hunting, no starting from zero.
            </p>
          </div>
        </section>

        <section
          id="widgets"
          className="py-20 sm:py-28 px-4 border-t border-border relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background to-background" />

          <div className="relative max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">Widgets</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                {WIDGET_COUNT} widgets. One dashboard.
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                From quick notes to CRM pipelines, every tool you need is a widget away.
              </p>
            </div>

            <div
              ref={widgetGridAnim.ref}
              className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 transition-all duration-500 ease-out ${widgetGridAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              {widgetTypes.map((w, i) => (
                <Card
                  key={w.name + i}
                  className="hover-elevate"
                  data-testid={`card-widget-type-${i}`}
                >
                  <CardContent className="flex flex-col items-center justify-center py-5 px-3 text-center">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                      <w.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm font-medium">{w.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">How It Works</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Up and running in minutes
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  icon: Shield,
                  title: "Sign in securely",
                  desc: "Use Google, GitHub, or email. Your workspace is created instantly.",
                },
                {
                  step: "2",
                  icon: LayoutGrid,
                  title: "Add your widgets",
                  desc: `Pick from ${WIDGET_COUNT} widget types. Drag, drop, and resize to build your layout.`,
                },
                {
                  step: "3",
                  icon: Sparkles,
                  title: "Run your day",
                  desc: "Switch between desktops, enter focus mode, and track everything in one place.",
                },
              ].map((s) => (
                <Card key={s.step} className="relative overflow-visible" data-testid={`card-step-${s.step}`}>
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {s.step}
                    </div>
                    <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <s.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">Mobile Ready</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Your dashboard, everywhere
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                A fully responsive experience on any device. Bottom sheet navigation, stacked card layout, and touch-optimized controls on mobile.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
              <div className="flex items-center gap-3" data-testid="info-desktop-support">
                <Monitor className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold">Desktop</p>
                  <p className="text-sm text-muted-foreground">Drag & drop grid layout</p>
                </div>
              </div>
              <div className="flex items-center gap-3" data-testid="info-mobile-support">
                <Smartphone className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold">Mobile</p>
                  <p className="text-sm text-muted-foreground">Stacked cards, bottom bar</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 sm:py-28 px-4 border-t border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background to-background" />

          <div className="relative max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Add your card for a 3-day free trial. You're charged when the trial ends.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card className="relative" data-testid="card-pricing-monthly">
                <CardContent className="pt-6 pb-6">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Monthly</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold">$6</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {[`All ${WIDGET_COUNT} widgets`, "Unlimited desktops", "Embed web addresses & AI tools", "Priority support"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full" asChild data-testid="button-pricing-monthly">
                    <a href="/api/login">Start Free Trial</a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="relative border-primary/30" data-testid="card-pricing-yearly">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full" data-testid="badge-save-yearly">
                    Save 17%
                  </span>
                </div>
                <CardContent className="pt-6 pb-6">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Yearly</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold">$60</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {["Everything in Monthly", "Save $12/year", "Embed web addresses & AI tools", "Priority support"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" asChild data-testid="button-pricing-yearly">
                    <a href="/api/login">Start Free Trial</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6 max-w-lg mx-auto" data-testid="text-cancel-anytime">
              Cancel anytime during your trial—you won't be charged. After trial, manage or cancel from Billing in your account.
            </p>
          </div>
        </section>

        <section className="py-20 sm:py-28 px-4 border-t border-border">
          <div
            ref={ctaAnim.ref}
            className={`max-w-3xl mx-auto text-center transition-all duration-500 ease-out ${ctaAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
              Ready to take control of your day?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join solopreneurs who use MallenniumDash to stay organized, focused, and productive. Your command center awaits.
            </p>
            <Button size="lg" asChild data-testid="button-cta-bottom" className="text-base px-8">
              <a href="/api/login">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              3-day free trial. Cancel anytime during trial—no charge. You're charged only if you continue after the trial.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold" data-testid="text-footer-logo">MallenniumDash</span>
          </div>
          <p className="text-sm text-muted-foreground" data-testid="text-footer-tagline">
            Built for solopreneurs who mean business.
          </p>
        </div>
      </footer>
    </div>
  );
}
