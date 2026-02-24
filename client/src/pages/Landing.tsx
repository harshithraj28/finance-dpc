import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Zap, BarChart3, LineChart } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <LineChart className="w-8 h-8" />
            <span className="font-display font-bold text-xl tracking-tight text-foreground">FinTrack</span>
          </div>
          <Button asChild variant="default" className="rounded-full px-6 shadow-md shadow-primary/20">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
            <div className="flex-1 max-w-2xl text-center lg:text-left animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                <span>The modern way to track finances</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-display font-extrabold text-foreground leading-[1.1] mb-6">
                Take control of your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">financial future</span>.
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed">
                Beautiful, fast, and secure financial tracking. Monitor your income, analyze expenses, and generate reports with zero friction.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  <a href="/api/login">
                    Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <ShieldCheck className="w-5 h-5 text-positive" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full max-w-3xl relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 blur-3xl -z-10 rounded-full"></div>
              <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-black/10 bg-card p-2">
                {/* Landing page abstract dashboard UI placeholder */}
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop" 
                  alt="Financial Dashboard Preview" 
                  className="w-full h-auto rounded-xl border border-border/30 opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>

          <div className="mt-32 grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-card border border-border/50 shadow-lg shadow-black/5 hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 rounded-2xl bg-positive/10 flex items-center justify-center text-positive mb-6">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3 text-foreground">Real-time Analytics</h3>
              <p className="text-muted-foreground">Instantly see your outstanding balances and net changes dynamically computed.</p>
            </div>
            <div className="p-8 rounded-3xl bg-card border border-border/50 shadow-lg shadow-black/5 hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <LineChart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3 text-foreground">Daily Reports</h3>
              <p className="text-muted-foreground">Automated historical snapshots. Export beautiful PDF or PNG reports in seconds.</p>
            </div>
            <div className="p-8 rounded-3xl bg-card border border-border/50 shadow-lg shadow-black/5 hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3 text-foreground">Cloud Synced</h3>
              <p className="text-muted-foreground">Your financial data securely isolated and synchronized across all your devices.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-border bg-card/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} FinTrack SaaS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
