import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";
import NotFound from "@/pages/not-found";

import { Nav } from "@/components/Nav";
import Landing from "@/pages/Landing";
import About from "@/pages/About";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Contact from "@/pages/Contact";

const queryClient = new QueryClient();

function SharedNavLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-serif selection:bg-primary selection:text-primary-foreground">
      <Nav />
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 md:px-12 pb-24">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      
      <Route path="/about">
        <SharedNavLayout><About /></SharedNavLayout>
      </Route>
      
      <Route path="/blog">
        <SharedNavLayout><Blog /></SharedNavLayout>
      </Route>
      
      <Route path="/blog/:slug">
        <SharedNavLayout><BlogPost /></SharedNavLayout>
      </Route>
      
      <Route path="/contact">
        <SharedNavLayout><Contact /></SharedNavLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
