import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import { useAnalyzeStory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Sparkles, User, Clapperboard, RotateCcw, Video } from "lucide-react";

const queryClient = new QueryClient();

// Add dark class to document body always
if (typeof window !== "undefined") {
  document.documentElement.classList.add("dark");
}

function LoadingState() {
  const messages = [
    "Analyzing your story...",
    "Extracting characters...",
    "Visualizing scenes...",
    "Generating render prompts...",
    "Finalizing storyboard..."
  ];
  
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-8">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 rounded-full border-t-2 border-primary border-r-2 border-r-accent border-b-2 border-transparent border-l-2 border-transparent opacity-50"
        />
        <motion.div
          animate={{ scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Film className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="text-xl font-light text-muted-foreground"
        >
          {messages[msgIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function Home() {
  const { toast } = useToast();
  const analyzeMutation = useAnalyzeStory();
  
  const [story, setStory] = useState("");
  const [storyboard, setStoryboard] = useState<any>(null);

  const handleGenerate = () => {
    if (story.trim().length < 10) {
      toast({
        title: "Story too short",
        description: "Please enter at least 10 characters to generate a storyboard.",
        variant: "destructive"
      });
      return;
    }

    analyzeMutation.mutate(
      { data: { story } },
      {
        onSuccess: (data) => {
          setStoryboard(data);
        },
        onError: (error) => {
          toast({
            title: "Error generating storyboard",
            description: "An unexpected error occurred. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleReset = () => {
    setStoryboard(null);
    setStory("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Cinematic Gradient Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[50vw] h-[50vh] bg-primary/10 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
        <div className="absolute bottom-0 right-1/4 w-[60vw] h-[60vh] bg-accent/10 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]"></div>
      </div>

      <main className="relative z-10 container mx-auto px-4 py-12 md:py-24 max-w-5xl">
        {!analyzeMutation.isPending && !storyboard && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/50">
              DreamFrame AI
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl font-light">
              Step into the director's chair. Paste your story and watch it transform into a cinematic storyboard in seconds.
            </p>

            <div className="w-full max-w-3xl mt-12 space-y-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                <Textarea 
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="The scene opens in a dimly lit cyberpunk alley. Rain pours relentlessly as Kael, a rogue replicant, clutches a glowing data drive. Suddenly, neon-drenched enforcers block the exit..."
                  className="relative w-full h-64 bg-card/80 backdrop-blur-sm border-card-border focus:border-primary/50 text-lg p-6 resize-none rounded-xl"
                  data-testid="textarea-story"
                />
              </div>
              <Button 
                onClick={handleGenerate} 
                size="lg" 
                className="w-full h-16 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all shadow-[0_0_40px_-10px_hsl(var(--primary))]"
                data-testid="button-generate"
              >
                Generate Storyboard <Film className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {analyzeMutation.isPending && <LoadingState />}

        {storyboard && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-16"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-8">
              <div className="space-y-4">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-sm uppercase tracking-widest">
                  Production Draft
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold">{storyboard.title}</h2>
              </div>
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="border-white/10 hover:bg-white/5"
                data-testid="button-reset"
              >
                <RotateCcw className="mr-2 w-4 h-4" /> Start Over
              </Button>
            </motion.div>

            {/* Characters */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-accent" />
                <h3 className="text-2xl font-semibold">Cast & Characters</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {storyboard.characters.map((char: any, i: number) => (
                  <Card key={i} className="bg-card/50 border-white/5 backdrop-blur-sm" data-testid={`card-character-${i}`}>
                    <CardContent className="p-5 flex flex-col gap-2">
                      <div className="font-bold text-lg text-primary-foreground">{char.name}</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">{char.description}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Scenes */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-3">
                <Clapperboard className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-semibold">Scene Breakdown</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {storyboard.scenes.map((scene: any, i: number) => (
                  <motion.div key={i} variants={itemVariants}>
                    <Card className="h-full bg-card/60 border-white/5 backdrop-blur-md overflow-hidden flex flex-col" data-testid={`card-scene-${i}`}>
                      <div className="p-6 border-b border-white/5 flex-grow space-y-4">
                        <div className="flex justify-between items-start">
                          <Badge className="bg-white/10 text-white hover:bg-white/20">
                            Scene {scene.sceneNumber.toString().padStart(2, '0')}
                          </Badge>
                        </div>
                        <h4 className="text-xl font-bold">{scene.title}</h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {scene.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 pt-2">
                          {scene.characters.map((charName: string, ci: number) => (
                            <Badge key={ci} variant="outline" className="border-accent/30 text-accent/90 bg-accent/5">
                              {charName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Visual Prompt Section */}
                      <div className="p-6 bg-black/40 relative">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                        <div className="flex items-center gap-2 mb-3">
                          <Video className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">Director's Note</span>
                        </div>
                        <div className="font-mono text-sm text-primary-foreground/80 leading-relaxed p-4 rounded-lg bg-black/50 border border-primary/20 shadow-[inset_0_0_20px_rgba(109,40,217,0.1)]">
                          {scene.visualPrompt}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
