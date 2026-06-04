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
import { Film, Sparkles, User, Clapperboard, RotateCcw, Video, Brain, Settings2, ChevronDown } from "lucide-react";

const queryClient = new QueryClient();

if (typeof window !== "undefined") {
  document.documentElement.classList.add("dark");
}

type UILang = "en" | "si" | "ta";
type StoryLang = "auto" | "en" | "si" | "ta";
type NotesLang = "en" | "si" | "ta";

const UI_LANG_NAMES: Record<UILang, string> = {
  en: "English",
  si: "සිංහල",
  ta: "தமிழ்",
};

const translations: Record<UILang, Record<string, string>> = {
  en: {
    subtitle: "Step into the director's chair. Paste your story and watch it transform into a cinematic storyboard in seconds.",
    generateBtn: "Generate Storyboard",
    productionDraft: "Production Draft",
    castTitle: "Cast & Characters",
    scenesTitle: "Scene Breakdown",
    directorNote: "Director's Note",
    thoughts: "Thoughts",
    startOver: "Start Over",
    storyTooShort: "Story too short",
    storyTooShortDesc: "Please enter at least 10 characters to generate a storyboard.",
    errorTitle: "Error generating storyboard",
    errorDesc: "An unexpected error occurred. Please try again.",
    settingsTitle: "Language Settings",
    storyLangLabel: "Story Language",
    uiLangLabel: "UI Language",
    notesLangLabel: "Director Notes Language",
    autoDetect: "Auto-detect",
    analyzing: "Analyzing your story...",
    extracting: "Extracting characters...",
    visualizing: "Visualizing scenes...",
    generating: "Generating director notes...",
    finalizing: "Finalizing storyboard...",
    scene: "Scene",
  },
  si: {
    subtitle: "අධ්‍යක්ෂකගේ පුටුවට ඇතුළු වන්න. ඔබේ කතාව ඇතුළු කර ක්ෂණිකව ස්ටෝරිබෝර්ඩ් එකක් ලබා ගන්න.",
    generateBtn: "ස්ටෝරිබෝර්ඩ් සාදන්න",
    productionDraft: "නිෂ්පාදන කෙටුම්",
    castTitle: "චරිත",
    scenesTitle: "දර්ශන විශ්ලේෂණය",
    directorNote: "අධ්‍යක්ෂකගේ සටහන",
    thoughts: "සිතුවිලි",
    startOver: "නැවත ආරම්භ කරන්න",
    storyTooShort: "කතාව ඉතා කෙටියි",
    storyTooShortDesc: "ස්ටෝරිබෝර්ඩ් සෑදීමට අවම වශයෙන් අකුරු 10ක් ඇතුළු කරන්න.",
    errorTitle: "ස්ටෝරිබෝර්ඩ් සෑදීමේ දෝෂයක්",
    errorDesc: "අනපේක්ෂිත දෝෂයක් සිදු විය. නැවත උත්සාහ කරන්න.",
    settingsTitle: "භාෂා සැකසුම්",
    storyLangLabel: "කතා භාෂාව",
    uiLangLabel: "UI භාෂාව",
    notesLangLabel: "අධ්‍යක්ෂක සටහන් භාෂාව",
    autoDetect: "ස්වයං හඳුනාගැනීම",
    analyzing: "කතාව විශ්ලේෂණය කරමින්...",
    extracting: "චරිත හඳුනා ගනිමින්...",
    visualizing: "දර්ශන සිතිජය...",
    generating: "අධ්‍යක්ෂක සටහන් සාදමින්...",
    finalizing: "ස්ටෝරිබෝර්ඩ් සම්පූර්ණ කරමින්...",
    scene: "දර්ශනය",
  },
  ta: {
    subtitle: "இயக்குனரின் இருக்கையில் அமருங்கள். உங்கள் கதையை ஒட்டவும், நொடியில் திரைக்கதை உருவாகும்.",
    generateBtn: "திரைக்கதை உருவாக்கு",
    productionDraft: "தயாரிப்பு வரைவு",
    castTitle: "கதாபாத்திரங்கள்",
    scenesTitle: "காட்சி விவரம்",
    directorNote: "இயக்குனர் குறிப்பு",
    thoughts: "எண்ணங்கள்",
    startOver: "மீண்டும் தொடங்கு",
    storyTooShort: "கதை மிகவும் குறைவு",
    storyTooShortDesc: "திரைக்கதை உருவாக்க குறைந்தது 10 எழுத்துகள் தேவை.",
    errorTitle: "திரைக்கதை உருவாக்குவதில் பிழை",
    errorDesc: "எதிர்பாராத பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",
    settingsTitle: "மொழி அமைப்புகள்",
    storyLangLabel: "கதை மொழி",
    uiLangLabel: "UI மொழி",
    notesLangLabel: "இயக்குனர் குறிப்பு மொழி",
    autoDetect: "தானாக கண்டறி",
    analyzing: "உங்கள் கதையை பகுப்பாய்வு செய்கிறோம்...",
    extracting: "கதாபாத்திரங்களை பிரித்தெடுக்கிறோம்...",
    visualizing: "காட்சிகளை காட்சிப்படுத்துகிறோம்...",
    generating: "இயக்குனர் குறிப்புகளை உருவாக்குகிறோம்...",
    finalizing: "திரைக்கதையை இறுதி செய்கிறோம்...",
    scene: "காட்சி",
  },
};

function LangSelect<T extends string>({
  value,
  onChange,
  label,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  label: string;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full appearance-none bg-card/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground cursor-pointer hover:border-white/20 focus:outline-none focus:border-primary/50 pr-8"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-background">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

function LoadingState({ t }: { t: Record<string, string> }) {
  const messages = [t.analyzing, t.extracting, t.visualizing, t.generating, t.finalizing];
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
  const [uiLanguage, setUiLanguage] = useState<UILang>("en");
  const [storyLanguage, setStoryLanguage] = useState<StoryLang>("auto");
  const [directorNotesLanguage, setDirectorNotesLanguage] = useState<NotesLang>("en");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const t = translations[uiLanguage];

  const storyLangOptions: { value: StoryLang; label: string }[] = [
    { value: "auto", label: t.autoDetect },
    { value: "en", label: "English" },
    { value: "si", label: "සිංහල" },
    { value: "ta", label: "தமிழ்" },
  ];

  const uiLangOptions: { value: UILang; label: string }[] = [
    { value: "en", label: "English" },
    { value: "si", label: "සිංහල" },
    { value: "ta", label: "தமிழ்" },
  ];

  const notesLangOptions: { value: NotesLang; label: string }[] = [
    { value: "en", label: "English" },
    { value: "si", label: "සිංහල" },
    { value: "ta", label: "தமிழ்" },
  ];

  const handleGenerate = () => {
    if (story.trim().length < 10) {
      toast({ title: t.storyTooShort, description: t.storyTooShortDesc, variant: "destructive" });
      return;
    }
    analyzeMutation.mutate(
      { data: { story, storyLanguage, directorNotesLanguage } },
      {
        onSuccess: (data) => setStoryboard(data),
        onError: () => toast({ title: t.errorTitle, description: t.errorDesc, variant: "destructive" }),
      }
    );
  };

  const handleReset = () => {
    setStoryboard(null);
    setStory("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[50vw] h-[50vh] bg-primary/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-[60vw] h-[60vh] bg-accent/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
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
              {t.subtitle}
            </p>

            <div className="w-full max-w-3xl mt-12 space-y-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-500" />
                <Textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="The scene opens in a dimly lit cyberpunk alley. Rain pours relentlessly as Kael, a rogue replicant, clutches a glowing data drive. Suddenly, neon-drenched enforcers block the exit..."
                  className="relative w-full h-64 bg-card/80 backdrop-blur-sm border-card-border focus:border-primary/50 text-lg p-6 resize-none rounded-xl"
                  data-testid="textarea-story"
                />
              </div>

              {/* Language Settings Panel */}
              <div className="rounded-xl border border-white/8 bg-card/40 backdrop-blur-sm overflow-hidden">
                <button
                  onClick={() => setSettingsOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    <span className="font-medium">{t.settingsTitle}</span>
                  </div>
                  <motion.div animate={{ rotate: settingsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {settingsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/8">
                        <LangSelect
                          value={storyLanguage}
                          onChange={setStoryLanguage}
                          label={t.storyLangLabel}
                          options={storyLangOptions}
                        />
                        <LangSelect
                          value={uiLanguage}
                          onChange={setUiLanguage}
                          label={t.uiLangLabel}
                          options={uiLangOptions}
                        />
                        <LangSelect
                          value={directorNotesLanguage}
                          onChange={setDirectorNotesLanguage}
                          label={t.notesLangLabel}
                          options={notesLangOptions}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                onClick={handleGenerate}
                size="lg"
                className="w-full h-16 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all shadow-[0_0_40px_-10px_hsl(var(--primary))]"
                data-testid="button-generate"
              >
                {t.generateBtn} <Film className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {analyzeMutation.isPending && <LoadingState t={t} />}

        {storyboard && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-16">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-8">
              <div className="space-y-4">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-sm uppercase tracking-widest">
                  {t.productionDraft}
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold">{storyboard.title}</h2>
              </div>
              <Button variant="outline" onClick={handleReset} className="border-white/10 hover:bg-white/5" data-testid="button-reset">
                <RotateCcw className="mr-2 w-4 h-4" /> {t.startOver}
              </Button>
            </motion.div>

            {/* Characters */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-accent" />
                <h3 className="text-2xl font-semibold">{t.castTitle}</h3>
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
                <h3 className="text-2xl font-semibold">{t.scenesTitle}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {storyboard.scenes.map((scene: any, i: number) => (
                  <motion.div key={i} variants={itemVariants}>
                    <Card className="h-full bg-card/60 border-white/5 backdrop-blur-md overflow-hidden flex flex-col" data-testid={`card-scene-${i}`}>
                      <div className="p-6 border-b border-white/5 flex-grow space-y-4">
                        <div className="flex justify-between items-start">
                          <Badge className="bg-white/10 text-white hover:bg-white/20">
                            {t.scene} {scene.sceneNumber.toString().padStart(2, "0")}
                          </Badge>
                        </div>
                        <h4 className="text-xl font-bold">{scene.title}</h4>
                        <p className="text-muted-foreground leading-relaxed">{scene.description}</p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {scene.characters.map((charName: string, ci: number) => (
                            <Badge key={ci} variant="outline" className="border-accent/30 text-accent/90 bg-accent/5">
                              {charName}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Internal Thoughts */}
                      {scene.thoughts && scene.thoughts.length > 0 && (
                        <div className="px-6 pb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">{t.thoughts}</span>
                          </div>
                          <div className="space-y-2">
                            {scene.thoughts.map((th: any, ti: number) => (
                              <div key={ti} className="flex gap-3 p-3 rounded-lg bg-amber-950/30 border border-amber-400/10">
                                <span className="text-xs font-semibold text-amber-400/80 whitespace-nowrap pt-0.5">{th.character}</span>
                                <span className="text-sm text-amber-100/70 italic leading-relaxed">"{th.thought}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Director's Note */}
                      <div className="p-6 bg-black/40 relative">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                        <div className="flex items-center gap-2 mb-3">
                          <Video className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">{t.directorNote}</span>
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
