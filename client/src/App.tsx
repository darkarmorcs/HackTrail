import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Layout } from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import SubdomainFinder from "@/pages/subdomain-finder";
import ParameterDiscovery from "@/pages/parameter-discovery";
import VulnerabilityScanner from "@/pages/vulnerability-scanner";
import ScanHistory from "@/pages/scan-history";
import ScanResults from "@/pages/scan-results/[id]";

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Dashboard */}
        <Route path="/" component={Dashboard} />
        
        {/* Scan History */}
        <Route path="/scan-history" component={ScanHistory} />
        <Route path="/scan-results/:id" component={ScanResults} />
        
        {/* Tools */}
        <Route path="/subdomain-finder" component={SubdomainFinder} />
        <Route path="/parameter-discovery" component={ParameterDiscovery} />
        <Route path="/vulnerability-scanner" component={VulnerabilityScanner} />
        
        {/* Placeholder routes */}
        <Route path="/port-scanner">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Port Scanner</h2>
            <p className="text-slate-400">This feature is coming soon!</p>
          </div>
        </Route>
        <Route path="/tech-detector">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Technology Detector</h2>
            <p className="text-slate-400">This feature is coming soon!</p>
          </div>
        </Route>
        <Route path="/content-discovery">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Content Discovery</h2>
            <p className="text-slate-400">This feature is coming soon!</p>
          </div>
        </Route>
        <Route path="/reports">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Report Generator</h2>
            <p className="text-slate-400">This feature is coming soon!</p>
          </div>
        </Route>
        <Route path="/settings">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p className="text-slate-400">This feature is coming soon!</p>
          </div>
        </Route>
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
