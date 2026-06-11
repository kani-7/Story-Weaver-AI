import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import {
  useAnalyzeStory,
  type Storyboard,
  type CharacterProfile,
  type Scene,
  type DialogueLine,
  type InternalThought,
  type InternalMonologueLine,
  type CharacterAction,
  type CharacterEmotion,
  type CinematicCamera,
  type ShotListItem,
  type TensionAnalysis,
  type SceneContinuityMemory,
  type ExportReadiness,
  type SceneImagePrompt,
  type StoryboardFrameMetadata,
  type VisualProductionReport,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Sparkles, User, Clapperboard, RotateCcw, Video, Brain, Settings2, ChevronDown, Eye, Zap, Fingerprint, Clock, Moon, Lightbulb, ArrowLeftRight, BookOpen, MessageSquare, Swords, Heart, Music, Volume2, Waves, Mic2, Palette, CheckCircle2, AlertTriangle, XCircle, Trophy, ScrollText, Radio, Camera, Layers, BarChart3, Star, TrendingDown } from "lucide-react";

const queryClient = new QueryClient();

if (typeof window !== "undefined") {
  document.documentElement.classList.add("dark");
}

type UILang = "en" | "si" | "ta";
type OutputLang = "en" | "si" | "ta";

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
    uiLangLabel: "UI Language",
    outputLangLabel: "Output Language",
    analyzing: "Analyzing your story...",
    extracting: "Building character profiles...",
    visualizing: "Visualizing scenes...",
    generating: "Generating director notes...",
    finalizing: "Finalizing storyboard...",
    scene: "Scene",
    profileAppearance: "Appearance",
    profileClothing: "Clothing",
    profilePersonality: "Personality",
    profileFeatures: "Distinctive Features",
    consistencyProfile: "Character Consistency Profile",
    sceneTypePresent: "Present",
    sceneTypeFlashback: "Flashback",
    sceneTypeDream: "Dream",
    sceneTypeImagination: "Imagination",
    flashbackIndicator: "Flashback Indicator",
    transitionIn: "Transition In",
    returnToPresent: "Return to Present",
    narration: "Narration",
    dialogue: "Dialogue",
    actions: "Actions",
    emotions: "Emotions",
    audioIntelligence: "Audio Intelligence",
    backgroundAmbience: "Background Ambience",
    backgroundMusic: "Background Music",
    soundEffects: "Sound Effects",
    speaker: "Speaker",
    dialogueLabel: "Dialogue",
    character: "Character",
    thoughtLabel: "Thought",
    actionLabel: "Action",
    emotionLabel: "Emotion",
    confidenceLabel: "Confidence",
    narratorLabel: "Narrator",
    internalMonologue: "Internal Monologue",
    monologueLabel: "Monologue",
    voiceStyle: "Voice Style",
    flashbackVisualStyle: "Flashback Visual Style",
    flashbackAudioStyle: "Flashback Audio Style",
    dreamVisualStyle: "Dream Visual Style",
    dreamAudioStyle: "Dream Audio Style",
    continuityCheck: "Continuity Check",
    continuityPass: "Pass",
    continuityWarning: "Warning",
    continuityFail: "Fail",
    continuityIssues: "Issues",
    productionScore: "Production Readiness Score",
    movieReport: "Movie Readiness Report",
    reportStrengths: "Strengths",
    reportWeaknesses: "Weaknesses",
    reportMissing: "Missing Elements",
    reportNotes: "Production Notes",
    outOf100: "/ 100",
    voicePerformance: "Voice Performance",
    vocalEmotion: "Emotion",
    vocalIntensity: "Intensity",
    speechSpeed: "Speed",
    pauseTiming: "Pause",
    cinematicCamera: "Cinematic Direction",
    shotType: "Shot Type",
    cameraAngle: "Angle",
    cameraMovement: "Movement",
    lensStyle: "Lens",
    framingStyle: "Framing",
    lightingStyle: "Lighting",
    pacingStyle: "Pacing",
    shotList: "Shot List",
    tensionAnalysis: "Tension Analysis",
    emotionalIntensity: "Intensity",
    tensionCurve: "Tension Curve",
    pacingBalance: "Pacing",
    continuityWarnings: "Continuity Warnings",
    continuityMemoryState: "Scene Memory",
    exportReadiness: "Export Readiness",
    screenplayReady: "Screenplay",
    storyboardReady: "Storyboard",
    animationReady: "Animation",
    voicePipelineReady: "Voice Pipeline",
    editingReady: "Editing",
    ready: "Ready",
    notReady: "Not Ready",
    imageGeneration: "Image Generation",
    sceneImagePromptLabel: "Scene Image Prompt",
    colorPaletteLabel: "Color Palette",
    environmentDetailLabel: "Environment",
    charPositioningLabel: "Character Positioning",
    facialExpressionsLabel: "Facial Expressions",
    cinematicMoodLabel: "Cinematic Mood",
    visualEffectsLabel: "Visual Effects",
    renderStyleLabel: "Render Style",
    animationStyleLabel: "Animation Style",
    visualEngineLabel: "Visual Engine",
    charVisualContinuityLabel: "Visual Continuity",
    frameMetadataLabel: "Frame Metadata",
    aspectRatioLabel: "Aspect Ratio",
    focalLengthLabel: "Focal Length",
    depthOfFieldLabel: "Depth of Field",
    lensStyleFrameLabel: "Lens Style",
    compositionNotesLabel: "Composition Notes",
    imageGenScoreLabel: "Image Generation Score",
    visualProductionReportLabel: "Visual Production Report",
    strongestScenesLabel: "Strongest Visual Scenes",
    weakestScenesLabel: "Weakest Visual Scenes",
    consistencyRisksLabel: "Consistency Risks",
    animationComplexityLabel: "Animation Complexity",
    renderingDifficultyLabel: "Rendering Difficulty",
    cinematicStrengthsLabel: "Cinematic Strengths",
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
    uiLangLabel: "UI භාෂාව",
    outputLangLabel: "ප්‍රතිදාන භාෂාව",
    analyzing: "කතාව විශ්ලේෂණය කරමින්...",
    extracting: "චරිත පැතිකඩ සාදමින්...",
    visualizing: "දර්ශන සිතිජය...",
    generating: "අධ්‍යක්ෂක සටහන් සාදමින්...",
    finalizing: "ස්ටෝරිබෝර්ඩ් සම්පූර්ණ කරමින්...",
    scene: "දර්ශනය",
    profileAppearance: "පෙනුම",
    profileClothing: "ඇඳුම",
    profilePersonality: "පෞරුෂය",
    profileFeatures: "විශේෂ ලක්ෂණ",
    consistencyProfile: "චරිත ස්ථාවරතා පැතිකඩ",
    sceneTypePresent: "වර්තමාන",
    sceneTypeFlashback: "ෆ්ලෑෂ්බෑක්",
    sceneTypeDream: "සිහිනය",
    sceneTypeImagination: "සිතීම",
    flashbackIndicator: "ෆ්ලෑෂ්බෑක් සංඥාව",
    transitionIn: "ආරම්භක සංක්‍රමණය",
    returnToPresent: "වර්තමානයට ආපසු",
    narration: "කථනය",
    dialogue: "සංවාදය",
    actions: "ක්‍රියා",
    emotions: "හැඟීම්",
    audioIntelligence: "ශ්‍රව්‍ය බුද්ධිය",
    backgroundAmbience: "පසුබිම් ශබ්ද",
    backgroundMusic: "පසුබිම් සංගීතය",
    soundEffects: "ශබ්ද ප්‍රභාව",
    speaker: "කථිකයා",
    dialogueLabel: "සංවාදය",
    character: "චරිතය",
    thoughtLabel: "සිතුවිල්ල",
    actionLabel: "ක්‍රියාව",
    emotionLabel: "හැඟීම",
    confidenceLabel: "විශ්වාසය",
    narratorLabel: "කථකයා",
    internalMonologue: "අභ්‍යන්තර indiscernment",
    monologueLabel: "ඒකාලාපය",
    voiceStyle: "කටහඬ ශෛලිය",
    flashbackVisualStyle: "ෆ්ලෑෂ්බෑක් දෘශ්‍ය ශෛලිය",
    flashbackAudioStyle: "ෆ්ලෑෂ්බෑක් ශ්‍රව්‍ය ශෛලිය",
    dreamVisualStyle: "සිහිනය දෘශ්‍ය ශෛලිය",
    dreamAudioStyle: "සිහිනය ශ්‍රව්‍ය ශෛලිය",
    continuityCheck: "අඛණ්ඩතා පරීක්ෂාව",
    continuityPass: "සාර්ථකයි",
    continuityWarning: "අවවාදය",
    continuityFail: "අසාර්ථකයි",
    continuityIssues: "ගැටළු",
    productionScore: "නිෂ්පාදන සූදානම් ලකුණ",
    movieReport: "චිත්‍රපට සූදානම් වාර්තාව",
    reportStrengths: "ශක්තීන්",
    reportWeaknesses: "දුර්වලතා",
    reportMissing: "අස්ථාන අංග",
    reportNotes: "නිෂ්පාදන සටහන්",
    outOf100: "/ 100",
    voicePerformance: "කටහඬ රූපකරණය",
    vocalEmotion: "හැඟීම",
    vocalIntensity: "තීව්‍රතාව",
    speechSpeed: "වේගය",
    pauseTiming: "විරාමය",
    cinematicCamera: "චිත්‍රමය දිශාව",
    shotType: "රූ වර්ගය",
    cameraAngle: "කෝණය",
    cameraMovement: "චලනය",
    lensStyle: "ලෙන්ස",
    framingStyle: "රාමුව",
    lightingStyle: "ආලෝකය",
    pacingStyle: "ගමන",
    shotList: "රූ ලැයිස්තුව",
    tensionAnalysis: "ආතතිය",
    emotionalIntensity: "හැඟීම් තීව්‍රතාව",
    tensionCurve: "ආතතිය රේඛාව",
    pacingBalance: "ගමන සමතුලිතතාව",
    continuityWarnings: "අඛණ්ඩතා අනතුරු",
    continuityMemoryState: "දර්ශන මතකය",
    exportReadiness: "අපනයන සූදානම",
    screenplayReady: "තිරකතාව",
    storyboardReady: "ස්ටෝරිබෝඩ්",
    animationReady: "ඇනිමේෂන්",
    voicePipelineReady: "කටහඬ",
    editingReady: "සංස්කරණය",
    ready: "සූදානම්",
    notReady: "සූදානම් නැත",
    imageGeneration: "රූප නිෂ්පාදනය",
    sceneImagePromptLabel: "දර්ශන රූප ප්‍රොම්ට්",
    colorPaletteLabel: "වර්ණ පාලිත්‍රය",
    environmentDetailLabel: "පරිසරය",
    charPositioningLabel: "චරිත ස්ථාන",
    facialExpressionsLabel: "මුහුණු ප්‍රකාශනය",
    cinematicMoodLabel: "චිත්‍රමය හැඟීම",
    visualEffectsLabel: "දෘශ්‍ය ප්‍රභාව",
    renderStyleLabel: "රෙන්ඩර් ශෛලිය",
    animationStyleLabel: "ඇනිමේෂන් ශෛලිය",
    visualEngineLabel: "දෘශ්‍ය එන්ජිම",
    charVisualContinuityLabel: "දෘශ්‍ය අඛණ්ඩතාව",
    frameMetadataLabel: "රාමු පාර-දත්ත",
    aspectRatioLabel: "අස්පෙක්ට් රේෂ්යෝ",
    focalLengthLabel: "ෆෝකල් දිග",
    depthOfFieldLabel: "ක්ෂේත්‍ර ගැඹුර",
    lensStyleFrameLabel: "ලෙන්ස් ශෛලිය",
    compositionNotesLabel: "රචනා සටහන්",
    imageGenScoreLabel: "රූප නිෂ්පාදන ලකුණ",
    visualProductionReportLabel: "දෘශ්‍ය නිෂ්පාදන වාර්තාව",
    strongestScenesLabel: "ශක්තිමත් දෘශ්‍ය දර්ශන",
    weakestScenesLabel: "දුර්වල දෘශ්‍ය දර්ශන",
    consistencyRisksLabel: "ස්ථාවරතා අවදානම්",
    animationComplexityLabel: "ඇනිමේෂන් සංකීර්ණතාව",
    renderingDifficultyLabel: "රෙන්ඩරිං දුෂ්කරතාව",
    cinematicStrengthsLabel: "චිත්‍රමය ශක්තීන්",
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
    uiLangLabel: "UI மொழி",
    outputLangLabel: "வெளியீட்டு மொழி",
    analyzing: "உங்கள் கதையை பகுப்பாய்வு செய்கிறோம்...",
    extracting: "கதாபாத்திர விவரங்களை உருவாக்குகிறோம்...",
    visualizing: "காட்சிகளை காட்சிப்படுத்துகிறோம்...",
    generating: "இயக்குனர் குறிப்புகளை உருவாக்குகிறோம்...",
    finalizing: "திரைக்கதையை இறுதி செய்கிறோம்...",
    scene: "காட்சி",
    profileAppearance: "தோற்றம்",
    profileClothing: "உடை",
    profilePersonality: "குணாதிசயம்",
    profileFeatures: "தனித்துவ அம்சங்கள்",
    consistencyProfile: "கதாபாத்திர நிலைத்தன்மை விவரம்",
    sceneTypePresent: "நிகழ்காலம்",
    sceneTypeFlashback: "ஃபிளாஷ்பேக்",
    sceneTypeDream: "கனவு",
    sceneTypeImagination: "கற்பனை",
    flashbackIndicator: "ஃபிளாஷ்பேக் குறிகாட்டி",
    transitionIn: "நுழைவு மாற்றம்",
    returnToPresent: "நிகழ்காலத்திற்கு திரும்பு",
    narration: "கதைச்சொல்லல்",
    dialogue: "உரையாடல்",
    actions: "செயல்கள்",
    emotions: "உணர்வுகள்",
    audioIntelligence: "ஒலி நுண்ணறிவு",
    backgroundAmbience: "பின்னணி சூழல் ஒலி",
    backgroundMusic: "பின்னணி இசை",
    soundEffects: "ஒலி விளைவுகள்",
    speaker: "பேசுபவர்",
    dialogueLabel: "உரையாடல்",
    character: "கதாபாத்திரம்",
    thoughtLabel: "எண்ணம்",
    actionLabel: "செயல்",
    emotionLabel: "உணர்வு",
    confidenceLabel: "நம்பகத்தன்மை",
    narratorLabel: "கதைசொல்லி",
    internalMonologue: "உள் மனவோட்டம்",
    monologueLabel: "மனவோட்டம்",
    voiceStyle: "குரல் நடை",
    flashbackVisualStyle: "ஃபிளாஷ்பேக் காட்சி நடை",
    flashbackAudioStyle: "ஃபிளாஷ்பேக் ஒலி நடை",
    dreamVisualStyle: "கனவு காட்சி நடை",
    dreamAudioStyle: "கனவு ஒலி நடை",
    continuityCheck: "தொடர்ச்சி சோதனை",
    continuityPass: "தேர்ச்சி",
    continuityWarning: "எச்சரிக்கை",
    continuityFail: "தோல்வி",
    continuityIssues: "சிக்கல்கள்",
    productionScore: "தயாரிப்பு தயார்நிலை மதிப்பெண்",
    movieReport: "திரைப்பட தயார்நிலை அறிக்கை",
    reportStrengths: "வலிமைகள்",
    reportWeaknesses: "பலவீனங்கள்",
    reportMissing: "விடுபட்ட கூறுகள்",
    reportNotes: "தயாரிப்பு குறிப்புகள்",
    outOf100: "/ 100",
    voicePerformance: "குரல் நடிப்பு",
    vocalEmotion: "உணர்வு",
    vocalIntensity: "தீவிரம்",
    speechSpeed: "வேகம்",
    pauseTiming: "இடைவெளி",
    cinematicCamera: "திரையரங்க திசை",
    shotType: "ஷாட் வகை",
    cameraAngle: "கோணம்",
    cameraMovement: "இயக்கம்",
    lensStyle: "லென்ஸ்",
    framingStyle: "சட்டம்",
    lightingStyle: "வெளிச்சம்",
    pacingStyle: "வேகம்",
    shotList: "ஷாட் பட்டியல்",
    tensionAnalysis: "பதற்ற பகுப்பாய்வு",
    emotionalIntensity: "உணர்வு தீவிரம்",
    tensionCurve: "பதற்ற வளைவு",
    pacingBalance: "வேக சமநிலை",
    continuityWarnings: "தொடர்ச்சி எச்சரிக்கைகள்",
    continuityMemoryState: "காட்சி நினைவு",
    exportReadiness: "ஏற்றுமதி தயார்நிலை",
    screenplayReady: "திரைக்கதை",
    storyboardReady: "ஸ்டோரிபோர்ட்",
    animationReady: "அனிமேஷன்",
    voicePipelineReady: "குரல்",
    editingReady: "திருத்தம்",
    ready: "தயார்",
    notReady: "தயாரில்லை",
    imageGeneration: "படப்பிடிப்பு",
    sceneImagePromptLabel: "காட்சி படம் புரோம்ட்",
    colorPaletteLabel: "வண்ண தட்டு",
    environmentDetailLabel: "சூழல்",
    charPositioningLabel: "கதாபாத்திர நிலை",
    facialExpressionsLabel: "முக வெளிப்பாடுகள்",
    cinematicMoodLabel: "திரையரங்க மனநிலை",
    visualEffectsLabel: "காட்சி விளைவுகள்",
    renderStyleLabel: "ரெண்டர் நடை",
    animationStyleLabel: "அனிமேஷன் நடை",
    visualEngineLabel: "காட்சி இயந்திரம்",
    charVisualContinuityLabel: "காட்சி தொடர்ச்சி",
    frameMetadataLabel: "சட்ட மேப்-பட்டியல்",
    aspectRatioLabel: "விகிதாசாரம்",
    focalLengthLabel: "குவிய நீளம்",
    depthOfFieldLabel: "புல ஆழம்",
    lensStyleFrameLabel: "லென்ஸ் நடை",
    compositionNotesLabel: "அமைப்பு குறிப்புகள்",
    imageGenScoreLabel: "படப்பிடிப்பு மதிப்பெண்",
    visualProductionReportLabel: "காட்சி தயாரிப்பு அறிக்கை",
    strongestScenesLabel: "வலுவான காட்சிகள்",
    weakestScenesLabel: "பலவீனமான காட்சிகள்",
    consistencyRisksLabel: "நிலைத்தன்மை அபாயங்கள்",
    animationComplexityLabel: "அனிமேஷன் சிக்கல்",
    renderingDifficultyLabel: "ரெண்டரிங் சிரமம்",
    cinematicStrengthsLabel: "திரையரங்க வலிமைகள்",
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
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [uiLanguage, setUiLanguage] = useState<UILang>("en");
  const [outputLanguage, setOutputLanguage] = useState<OutputLang>("en");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedSceneSections, setExpandedSceneSections] = useState<Record<string, boolean>>({});
  const toggleSceneSection = (key: string) =>
    setExpandedSceneSections(prev => ({ ...prev, [key]: !prev[key] }));

  const t = translations[uiLanguage];

  const uiLangOptions: { value: UILang; label: string }[] = [
    { value: "en", label: "English" },
    { value: "si", label: "සිංහල" },
    { value: "ta", label: "தமிழ்" },
  ];

  const outputLangOptions: { value: OutputLang; label: string }[] = [
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
      { data: { story, outputLanguage } },
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
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
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
                      <div className="px-5 pb-5 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/8">
                        <LangSelect
                          value={uiLanguage}
                          onChange={(v) => setUiLanguage(v as UILang)}
                          label={t.uiLangLabel}
                          options={uiLangOptions}
                        />
                        <LangSelect
                          value={outputLanguage}
                          onChange={(v) => setOutputLanguage(v as OutputLang)}
                          label={t.outputLangLabel}
                          options={outputLangOptions}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {storyboard.characters.map((char: CharacterProfile, i: number) => (
                  <Card key={i} className="bg-card/50 border-white/5 backdrop-blur-sm overflow-hidden flex flex-col" data-testid={`card-character-${i}`}>
                    {/* Profile header */}
                    <div className="px-5 pt-5 pb-4 border-b border-white/5 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xl leading-tight text-primary-foreground">{char.name}</div>
                        {char.species && (
                          <Badge className="mt-1.5 bg-accent/15 text-accent border-accent/20 text-xs">
                            {char.species}
                          </Badge>
                        )}
                      </div>
                      {char.characterId && (
                        <span className="text-[10px] font-mono text-white/25 mt-0.5 shrink-0 bg-white/5 px-2 py-1 rounded border border-white/8">
                          #{char.characterId}
                        </span>
                      )}
                    </div>

                    {/* Profile fields */}
                    <CardContent className="p-5 space-y-4 flex-1">
                      {char.appearance && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-3 h-3 text-muted-foreground" />
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.profileAppearance}</div>
                          </div>
                          <p className="text-sm text-foreground/75 leading-relaxed pl-4 border-l border-white/8">{char.appearance}</p>
                        </div>
                      )}
                      {char.clothing && char.clothing !== "—" && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-[18px]">{t.profileClothing}</div>
                          <p className="text-sm text-foreground/75 leading-relaxed pl-4 border-l border-white/8">{char.clothing}</p>
                        </div>
                      )}
                      {char.personality && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-muted-foreground" />
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.profilePersonality}</div>
                          </div>
                          <p className="text-sm text-foreground/75 leading-relaxed pl-4 border-l border-white/8">{char.personality}</p>
                        </div>
                      )}
                      {char.distinctiveFeatures && (
                        <div className="rounded-lg overflow-hidden border border-primary/20 bg-primary/8 mt-2">
                          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-primary/15 bg-primary/10">
                            <Fingerprint className="w-3.5 h-3.5 text-primary/80" />
                            <div className="text-[10px] font-bold uppercase tracking-widest text-primary/80">{t.profileFeatures}</div>
                          </div>
                          <p className="text-sm text-foreground/85 leading-relaxed px-3 py-3">{char.distinctiveFeatures}</p>
                        </div>
                      )}
                      {char.voiceStyle && (
                        <div className="rounded-lg overflow-hidden border border-cyan-400/20 bg-cyan-950/15 mt-2">
                          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-cyan-400/15 bg-cyan-950/20">
                            <Mic2 className="w-3.5 h-3.5 text-cyan-400/80" />
                            <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">{t.voiceStyle}</div>
                          </div>
                          <p className="text-sm text-foreground/75 leading-relaxed px-3 py-3 italic">{char.voiceStyle}</p>
                        </div>
                      )}
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
                {storyboard.scenes.map((scene: Scene, i: number) => {
                  const sceneType = scene.sceneType;
                  const isNonPresent = sceneType !== "Present";

                  const sceneTypeMeta: Record<string, { label: string; icon: React.ReactNode; color: string; border: string; bg: string }> = {
                    Present: { label: t.sceneTypePresent, icon: <Film className="w-3 h-3" />, color: "text-white", border: "border-white/20", bg: "bg-white/10" },
                    Flashback: { label: t.sceneTypeFlashback, icon: <Clock className="w-3 h-3" />, color: "text-amber-300", border: "border-amber-400/30", bg: "bg-amber-950/40" },
                    Dream: { label: t.sceneTypeDream, icon: <Moon className="w-3 h-3" />, color: "text-violet-300", border: "border-violet-400/30", bg: "bg-violet-950/40" },
                    Imagination: { label: t.sceneTypeImagination, icon: <Lightbulb className="w-3 h-3" />, color: "text-sky-300", border: "border-sky-400/30", bg: "bg-sky-950/40" },
                  };
                  const meta = sceneTypeMeta[sceneType] ?? sceneTypeMeta.Present;

                  const cardBorder = isNonPresent
                    ? sceneType === "Flashback" ? "border-amber-400/15" : sceneType === "Dream" ? "border-violet-400/15" : "border-sky-400/15"
                    : "border-white/5";

                  return (
                  <motion.div key={i} variants={itemVariants}>
                    <Card className={`h-full bg-card/60 backdrop-blur-md overflow-hidden flex flex-col border ${cardBorder}`} data-testid={`card-scene-${i}`}>
                      <div className="p-6 border-b border-white/5 flex-grow space-y-4">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <Badge className="bg-white/10 text-white hover:bg-white/20">
                            {t.scene} {scene.sceneNumber.toString().padStart(2, "0")}
                          </Badge>
                          <Badge className={`flex items-center gap-1.5 ${meta.bg} ${meta.color} border ${meta.border}`}>
                            {meta.icon}
                            {meta.label}
                          </Badge>
                        </div>

                        {/* Flashback indicator banner */}
                        {isNonPresent && scene.flashbackIndicator && (
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${meta.border} ${meta.bg}`}>
                            <ArrowLeftRight className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
                            <span className={`text-xs font-bold uppercase tracking-widest ${meta.color}`}>
                              {scene.flashbackIndicator}
                            </span>
                          </div>
                        )}

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

                      {/* Transition Instructions (non-present scenes) */}
                      {isNonPresent && (scene.transitionInstructions || scene.returnToPresentInstructions) && (
                        <div className={`px-6 py-4 border-b ${cardBorder} space-y-3`}>
                          {scene.transitionInstructions && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <ArrowLeftRight className={`w-3 h-3 ${meta.color}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color}`}>{t.transitionIn}</span>
                              </div>
                              <p className="text-xs text-foreground/65 leading-relaxed pl-4 border-l border-white/10 italic">
                                {scene.transitionInstructions}
                              </p>
                            </div>
                          )}
                          {scene.returnToPresentInstructions && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <ArrowLeftRight className={`w-3 h-3 ${meta.color} rotate-180`} />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color}`}>{t.returnToPresent}</span>
                              </div>
                              <p className="text-xs text-foreground/65 leading-relaxed pl-4 border-l border-white/10 italic">
                                {scene.returnToPresentInstructions}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Flashback Visual + Audio Style */}
                      {sceneType === "Flashback" && (scene.flashbackVisualStyle || scene.flashbackAudioStyle) && (
                        <div className={`px-6 py-4 border-b ${cardBorder} bg-amber-950/10 space-y-3`}>
                          {scene.flashbackVisualStyle && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <Palette className="w-3 h-3 text-amber-400/70" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">{t.flashbackVisualStyle}</span>
                              </div>
                              <p className="text-xs text-amber-100/55 leading-relaxed pl-4 border-l border-amber-400/15 italic">{scene.flashbackVisualStyle}</p>
                            </div>
                          )}
                          {scene.flashbackAudioStyle && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <Radio className="w-3 h-3 text-amber-400/70" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">{t.flashbackAudioStyle}</span>
                              </div>
                              <p className="text-xs text-amber-100/55 leading-relaxed pl-4 border-l border-amber-400/15 italic">{scene.flashbackAudioStyle}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dream Visual + Audio Style */}
                      {sceneType === "Dream" && (scene.dreamVisualStyle || scene.dreamAudioStyle) && (
                        <div className={`px-6 py-4 border-b ${cardBorder} bg-violet-950/10 space-y-3`}>
                          {scene.dreamVisualStyle && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <Palette className="w-3 h-3 text-violet-400/70" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400/70">{t.dreamVisualStyle}</span>
                              </div>
                              <p className="text-xs text-violet-100/55 leading-relaxed pl-4 border-l border-violet-400/15 italic">{scene.dreamVisualStyle}</p>
                            </div>
                          )}
                          {scene.dreamAudioStyle && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <Radio className="w-3 h-3 text-violet-400/70" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400/70">{t.dreamAudioStyle}</span>
                              </div>
                              <p className="text-xs text-violet-100/55 leading-relaxed pl-4 border-l border-violet-400/15 italic">{scene.dreamAudioStyle}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Story Intelligence Layers */}
                      {(() => {
                        const hasNarration = scene.narration && scene.narration.length > 0;
                        const hasDialogue = scene.dialogue && scene.dialogue.length > 0;
                        const hasThoughts = scene.thoughts && scene.thoughts.length > 0;
                        const hasMonologue = scene.internalMonologue && scene.internalMonologue.length > 0;
                        const hasActions = scene.actions && scene.actions.length > 0;
                        const hasEmotions = scene.emotions && scene.emotions.length > 0;
                        const hasAudio = scene.audio && (
                          (scene.audio.backgroundAmbience && scene.audio.backgroundAmbience.length > 0) ||
                          scene.audio.backgroundMusic ||
                          (scene.audio.soundEffects && scene.audio.soundEffects.length > 0)
                        );
                        if (!hasNarration && !hasDialogue && !hasThoughts && !hasMonologue && !hasActions && !hasEmotions && !hasAudio) return null;
                        return (
                          <div className="border-t border-white/5 divide-y divide-white/5">

                            {/* Narration */}
                            {hasNarration && (
                              <div className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.narration}</span>
                                </div>
                                <div className="space-y-2">
                                  {scene.narration.map((line: string, ni: number) => (
                                    <div key={ni} className="p-3 rounded-lg bg-slate-900/40 border border-slate-500/10">
                                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{t.narratorLabel}</span>
                                      <p className="text-sm text-slate-300/75 italic leading-relaxed">{line}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Dialogue */}
                            {hasDialogue && (
                              <div className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{t.dialogue}</span>
                                </div>
                                <div className="space-y-2">
                                  {scene.dialogue.map((dl: DialogueLine, di: number) => (
                                    <div key={di} className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-400/10 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70">{t.speaker}:</span>
                                        <span className="text-xs font-semibold text-emerald-400/90">{dl.character}</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70 pt-0.5 shrink-0">{t.dialogueLabel}:</span>
                                        <span className="text-sm text-emerald-100/80 leading-relaxed">"{dl.line}"</span>
                                      </div>
                                      {/* Voice Performance Metadata */}
                                      {(dl.vocalEmotion || dl.vocalIntensity !== undefined || dl.speechSpeed || dl.whisperDetection || dl.shoutDetection) && (
                                        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 mt-0.5 border-t border-emerald-400/10">
                                          {dl.vocalEmotion && (
                                            <span className="text-[8px] font-semibold uppercase tracking-wider text-emerald-200/55 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-400/12 italic">
                                              {dl.vocalEmotion}
                                            </span>
                                          )}
                                          {dl.vocalIntensity !== undefined && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-[7px] text-emerald-500/40 uppercase tracking-wider">{t.vocalIntensity}</span>
                                              <div className="w-10 h-1 bg-emerald-950/60 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-400/50 rounded-full" style={{ width: `${Math.round(dl.vocalIntensity * 100)}%` }} />
                                              </div>
                                              <span className="text-[7px] font-mono text-emerald-400/40">{Math.round(dl.vocalIntensity * 100)}%</span>
                                            </div>
                                          )}
                                          {dl.speechSpeed && (
                                            <span className={`text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                              dl.speechSpeed === "slow" ? "text-sky-300/60 border-sky-400/15 bg-sky-950/20" :
                                              dl.speechSpeed === "fast" ? "text-orange-300/60 border-orange-400/15 bg-orange-950/20" :
                                              "text-emerald-400/40 border-emerald-400/10"
                                            }`}>
                                              {dl.speechSpeed}
                                            </span>
                                          )}
                                          {dl.whisperDetection && (
                                            <span className="text-[7px] font-bold uppercase tracking-wider text-sky-300/60 border-sky-400/15 bg-sky-950/20 px-1.5 py-0.5 rounded border flex items-center gap-0.5">
                                              <Mic2 className="w-2 h-2" /> whisper
                                            </span>
                                          )}
                                          {dl.shoutDetection && (
                                            <span className="text-[7px] font-bold uppercase tracking-wider text-red-300/60 border-red-400/15 bg-red-950/20 px-1.5 py-0.5 rounded border">
                                              shout
                                            </span>
                                          )}
                                          {dl.pauseTiming && dl.pauseTiming !== "no pause" && (
                                            <span className="text-[7px] text-emerald-500/35 italic">⏸ {dl.pauseTiming}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Internal Thoughts */}
                            {hasThoughts && (
                              <div className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Brain className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">{t.thoughts}</span>
                                </div>
                                <div className="space-y-2">
                                  {scene.thoughts.map((th: InternalThought, ti: number) => (
                                    <div key={ti} className="p-3 rounded-lg bg-amber-950/30 border border-amber-400/10 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500/70">{t.character}:</span>
                                        <span className="text-xs font-semibold text-amber-400/90">{th.character}</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500/70 pt-0.5 shrink-0">{t.thoughtLabel}:</span>
                                        <span className="text-sm text-amber-100/75 italic leading-relaxed">"{th.thought}"</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Internal Monologue */}
                            {hasMonologue && (
                              <div className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <ScrollText className="w-3.5 h-3.5 text-purple-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">{t.internalMonologue}</span>
                                </div>
                                <div className="space-y-2">
                                  {scene.internalMonologue.map((ml: InternalMonologueLine, mi: number) => (
                                    <div key={mi} className="p-3 rounded-lg bg-purple-950/25 border border-purple-400/10 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-purple-500/70">{t.character}:</span>
                                        <span className="text-xs font-semibold text-purple-400/90">{ml.character}</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-purple-500/70 pt-0.5 shrink-0">{t.monologueLabel}:</span>
                                        <span className="text-sm text-purple-100/75 italic leading-relaxed">{ml.monologue}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            {hasActions && (
                              <div className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Swords className="w-3.5 h-3.5 text-orange-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">{t.actions}</span>
                                </div>
                                <div className="space-y-2">
                                  {scene.actions.map((ac: CharacterAction, ai: number) => (
                                    <div key={ai} className="p-3 rounded-lg bg-orange-950/25 border border-orange-400/10 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500/70">{t.character}:</span>
                                        <span className="text-xs font-semibold text-orange-400/90">{ac.character}</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500/70 pt-0.5 shrink-0">{t.actionLabel}:</span>
                                        <span className="text-sm text-orange-100/75 leading-relaxed">{ac.action}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Emotions */}
                            {hasEmotions && (
                              <div className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">{t.emotions}</span>
                                </div>
                                <div className="space-y-2">
                                  {scene.emotions.map((em: CharacterEmotion, ei: number) => {
                                    const conf: number = em.confidence;
                                    const pct = Math.round(conf * 100);
                                    const barColor = conf >= 0.8 ? "bg-rose-400" : conf >= 0.5 ? "bg-rose-400/60" : "bg-rose-400/30";
                                    return (
                                      <div key={ei} className="p-3 rounded-lg bg-rose-950/25 border border-rose-400/10 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500/70">{t.character}:</span>
                                          <span className="text-xs font-semibold text-rose-400/90">{em.character}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500/70 shrink-0">{t.emotionLabel}:</span>
                                          <span className="text-sm text-rose-100/80 italic">{em.emotion}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500/70 shrink-0">{t.confidenceLabel}:</span>
                                          <div className="flex items-center gap-1.5 flex-1">
                                            <div className="flex-1 h-1 rounded-full bg-rose-950/60 overflow-hidden">
                                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-[10px] font-mono text-rose-300/60 tabular-nums">{conf.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Audio Intelligence */}
                            {hasAudio && (
                              <div className="px-6 py-4 bg-indigo-950/10">
                                <div className="flex items-center gap-2 mb-4">
                                  <Music className="w-3.5 h-3.5 text-indigo-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{t.audioIntelligence}</span>
                                </div>
                                <div className="space-y-3">
                                  {scene.audio?.backgroundAmbience && scene.audio.backgroundAmbience.length > 0 && (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <Waves className="w-3 h-3 text-indigo-400/60" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400/60">{t.backgroundAmbience}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 pl-4">
                                        {scene.audio.backgroundAmbience.map((a: string, ai: number) => (
                                          <span key={ai} className="text-[11px] px-2 py-1 rounded bg-indigo-950/40 border border-indigo-400/10 text-indigo-200/60">
                                            {a}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {scene.audio?.backgroundMusic && (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <Music className="w-3 h-3 text-indigo-400/60" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400/60">{t.backgroundMusic}</span>
                                      </div>
                                      <p className="text-xs text-indigo-200/60 italic leading-relaxed pl-4 border-l border-indigo-500/15">
                                        {scene.audio.backgroundMusic}
                                      </p>
                                    </div>
                                  )}
                                  {scene.audio?.soundEffects && scene.audio.soundEffects.length > 0 && (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <Volume2 className="w-3 h-3 text-indigo-400/60" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400/60">{t.soundEffects}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 pl-4">
                                        {scene.audio.soundEffects.map((sfx: string, si: number) => (
                                          <span key={si} className="text-[11px] px-2 py-1 rounded bg-indigo-950/40 border border-indigo-400/10 text-indigo-200/60">
                                            {sfx}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })()}

                      {/* Continuity Check */}
                      {scene.continuityCheck && (
                        <div className="px-6 py-4 border-t border-white/5">
                          {(() => {
                            const cc = scene.continuityCheck;
                            const statusMeta: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
                              Pass: { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />, color: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-400/15", label: t.continuityPass },
                              Warning: { icon: <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />, color: "text-yellow-400", bg: "bg-yellow-950/20", border: "border-yellow-400/15", label: t.continuityWarning },
                              Fail: { icon: <XCircle className="w-3.5 h-3.5 text-red-400" />, color: "text-red-400", bg: "bg-red-950/20", border: "border-red-400/15", label: t.continuityFail },
                            };
                            const sm = statusMeta[cc.status] ?? statusMeta.Warning;
                            return (
                              <div className={`rounded-lg border ${sm.border} ${sm.bg} p-3 space-y-2`}>
                                <div className="flex items-center gap-2">
                                  {sm.icon}
                                  <span className={`text-[10px] font-bold uppercase tracking-widest ${sm.color}`}>{t.continuityCheck} — {sm.label}</span>
                                </div>
                                {cc.issues && cc.issues.length > 0 && (
                                  <ul className="space-y-1 pl-5">
                                    {cc.issues.map((issue: string, ii: number) => (
                                      <li key={ii} className={`text-xs ${sm.color} opacity-75 list-disc leading-relaxed`}>{issue}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Continuity Memory Warnings */}
                      {scene.continuityMemory && scene.continuityMemory.continuityWarnings && scene.continuityMemory.continuityWarnings.length > 0 && (
                        <div className="px-6 py-4 border-t border-white/5">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">{t.continuityWarnings}</span>
                          </div>
                          <div className="space-y-1.5">
                            {scene.continuityMemory.continuityWarnings.map((w: string, wi: number) => (
                              <div key={wi} className="flex items-start gap-2 px-3 py-1.5 rounded bg-amber-950/20 border border-amber-400/10">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-400/60 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-100/65 leading-relaxed">{w}</p>
                              </div>
                            ))}
                            {scene.continuityMemory.continuityResolutionSuggestions && scene.continuityMemory.continuityResolutionSuggestions.length > 0 && (
                              <div className="mt-2 space-y-1 pl-1">
                                {scene.continuityMemory.continuityResolutionSuggestions.map((s: string, sri: number) => (
                                  <p key={sri} className="text-[10px] text-amber-300/45 italic pl-3 border-l border-amber-400/15">{s}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Cinematic Camera */}
                      {scene.cinematicCamera && (
                        <div className="px-6 py-4 border-t border-white/5">
                          <div className="flex items-center gap-2 mb-3">
                            <Video className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">{t.cinematicCamera}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {([
                              { label: t.shotType, value: scene.cinematicCamera.shotType },
                              { label: t.cameraAngle, value: scene.cinematicCamera.cameraAngle },
                              { label: t.cameraMovement, value: scene.cinematicCamera.cameraMovement },
                              { label: t.lensStyle, value: scene.cinematicCamera.lensStyle },
                              { label: t.framingStyle, value: scene.cinematicCamera.framingStyle },
                              { label: t.lightingStyle, value: scene.cinematicCamera.lightingStyle },
                            ] as { label: string; value: string | undefined }[]).filter(item => item.value).map((item, idx) => (
                              <div key={idx} className="rounded-md bg-cyan-950/20 border border-cyan-400/10 px-2.5 py-1.5">
                                <div className="text-[8px] font-bold uppercase tracking-wider text-cyan-500/55 mb-0.5">{item.label}</div>
                                <div className="text-[11px] text-cyan-100/70 leading-tight">{item.value}</div>
                              </div>
                            ))}
                          </div>
                          {scene.cinematicCamera.pacingStyle && (
                            <p className="text-xs text-cyan-200/45 italic leading-relaxed mt-2.5 pl-3 border-l border-cyan-400/15">{scene.cinematicCamera.pacingStyle}</p>
                          )}
                        </div>
                      )}

                      {/* Shot List */}
                      {scene.shotList && scene.shotList.length > 0 && (
                        <div className="px-6 py-4 border-t border-white/5">
                          <div className="flex items-center gap-2 mb-3">
                            <Clapperboard className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{t.shotList}</span>
                          </div>
                          <div className="space-y-2">
                            {(scene.shotList as ShotListItem[]).map((shot, si) => (
                              <div key={si} className="rounded-lg bg-indigo-950/15 border border-indigo-400/10 px-3 py-2 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-indigo-400/70 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-400/15 font-mono">
                                      #{String(shot.shotNumber).padStart(2, "0")}
                                    </span>
                                    <span className="text-[9px] text-indigo-400/50 uppercase tracking-wider">{shot.estimatedDuration}</span>
                                  </div>
                                  <span className="text-[8px] font-bold uppercase tracking-wider text-indigo-300/45 bg-indigo-950/25 px-1.5 py-0.5 rounded border border-indigo-400/10">
                                    → {shot.transitionType}
                                  </span>
                                </div>
                                <p className="text-xs text-indigo-100/60 leading-relaxed">{shot.shotDescription}</p>
                                <p className="text-[10px] text-indigo-300/40 italic">{shot.shotPurpose}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tension Analysis */}
                      {scene.tensionAnalysis && (
                        <div className="px-6 py-4 border-t border-white/5">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">{t.tensionAnalysis}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-bold uppercase tracking-wider text-yellow-500/55 w-16 shrink-0">{t.emotionalIntensity}</span>
                              <div className="flex-1 h-1.5 bg-yellow-950/40 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.round(scene.tensionAnalysis.emotionalIntensity * 100)}%`,
                                    background: `hsl(${45 + (1 - scene.tensionAnalysis.emotionalIntensity) * 40}, 85%, 58%)`,
                                  }}
                                />
                              </div>
                              <span className="text-[9px] font-mono text-yellow-400/50 w-7 text-right tabular-nums">
                                {Math.round(scene.tensionAnalysis.emotionalIntensity * 100)}%
                              </span>
                            </div>
                            {scene.tensionAnalysis.tensionCurve && (
                              <p className="text-xs text-yellow-100/55 italic leading-relaxed pl-3 border-l border-yellow-400/15">
                                {scene.tensionAnalysis.tensionCurve}
                              </p>
                            )}
                            {scene.tensionAnalysis.pacingBalance && (
                              <p className="text-[10px] text-yellow-300/40 leading-relaxed">{scene.tensionAnalysis.pacingBalance}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Image Generation — collapsible, open by default */}
                      {scene.imagePrompt && (() => {
                        const ip: SceneImagePrompt = scene.imagePrompt;
                        const imgKey = `img-${i}`;
                        const isOpen = expandedSceneSections[imgKey] !== false;
                        const engineColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
                          PresentEngine:    { bg: "bg-emerald-950/25", text: "text-emerald-300", border: "border-emerald-400/20", dot: "bg-emerald-400" },
                          FlashbackEngine:  { bg: "bg-amber-950/25",   text: "text-amber-300",   border: "border-amber-400/20",   dot: "bg-amber-400" },
                          DreamEngine:      { bg: "bg-violet-950/25",  text: "text-violet-300",  border: "border-violet-400/20",  dot: "bg-violet-400" },
                          ImaginationEngine:{ bg: "bg-sky-950/25",     text: "text-sky-300",     border: "border-sky-400/20",     dot: "bg-sky-400" },
                        };
                        const ec = engineColors[ip.visualEngine] ?? engineColors.PresentEngine;
                        return (
                          <div className="border-t border-white/5">
                            {/* Toggle header */}
                            <button
                              onClick={() => toggleSceneSection(imgKey)}
                              className="w-full px-6 py-3.5 flex items-center justify-between gap-2 hover:bg-white/[0.02] transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Camera className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400">{t.imageGeneration}</span>
                                <div className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${ec.border} ${ec.bg}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ec.dot}`} />
                                  <span className={`text-[9px] font-bold uppercase tracking-wider ${ec.text}`}>{ip.visualEngine}</span>
                                </div>
                              </div>
                              <ChevronDown className={`w-3.5 h-3.5 text-fuchsia-400/50 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                            </button>

                            {/* Expanded content */}
                            {isOpen && (
                              <div className="px-6 pb-5 space-y-3">
                                {/* Engine badge (mobile fallback) */}
                                <div className={`sm:hidden inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${ec.border} ${ec.bg}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ec.dot}`} />
                                  <span className={`text-[9px] font-bold uppercase tracking-wider ${ec.text}`}>{ip.visualEngine}</span>
                                </div>

                                {/* Main prompt */}
                                <div className="rounded-lg bg-fuchsia-950/15 border border-fuchsia-400/10 p-3">
                                  <div className="text-[8px] font-bold uppercase tracking-wider text-fuchsia-500/55 mb-1.5">{t.sceneImagePromptLabel}</div>
                                  <p className="text-xs text-fuchsia-100/75 leading-relaxed font-mono">{ip.sceneImagePrompt}</p>
                                </div>

                                {/* Camera Shot · Movement · Lighting (from cinematicCamera) */}
                                {(scene.cinematicCamera?.shotType || scene.cinematicCamera?.cameraMovement || scene.cinematicCamera?.lightingStyle) && (
                                  <div className="grid grid-cols-3 gap-2">
                                    {([
                                      { label: t.shotType, value: scene.cinematicCamera?.shotType },
                                      { label: t.cameraMovement, value: scene.cinematicCamera?.cameraMovement },
                                      { label: t.lightingStyle, value: scene.cinematicCamera?.lightingStyle },
                                    ] as { label: string; value: string | undefined }[]).filter(item => item.value).map((item, idx) => (
                                      <div key={idx} className="rounded-md bg-fuchsia-950/10 border border-fuchsia-400/8 px-2.5 py-1.5">
                                        <div className="text-[8px] font-bold uppercase tracking-wider text-fuchsia-500/45 mb-0.5">{item.label}</div>
                                        <div className="text-[11px] text-fuchsia-100/65 leading-tight">{item.value}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Color Palette · Cinematic Mood */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="rounded-md bg-fuchsia-950/15 border border-fuchsia-400/10 px-2.5 py-1.5">
                                    <div className="text-[8px] font-bold uppercase tracking-wider text-fuchsia-500/55 mb-0.5">{t.colorPaletteLabel}</div>
                                    <div className="text-[11px] text-fuchsia-100/70 leading-tight">{ip.colorPalette}</div>
                                  </div>
                                  <div className="rounded-md bg-fuchsia-950/15 border border-fuchsia-400/10 px-2.5 py-1.5">
                                    <div className="text-[8px] font-bold uppercase tracking-wider text-fuchsia-500/55 mb-0.5">{t.cinematicMoodLabel}</div>
                                    <div className="text-[11px] text-fuchsia-100/70 leading-tight italic">{ip.cinematicMood}</div>
                                  </div>
                                </div>

                                {/* Render Style · Animation Style */}
                                <div className="grid grid-cols-2 gap-2">
                                  {ip.renderStyle && (
                                    <div className="rounded-md bg-fuchsia-950/10 border border-fuchsia-400/8 px-2.5 py-1.5">
                                      <div className="text-[8px] font-bold uppercase tracking-wider text-fuchsia-500/45 mb-0.5">{t.renderStyleLabel}</div>
                                      <div className="text-[11px] text-fuchsia-100/60 leading-tight">{ip.renderStyle}</div>
                                    </div>
                                  )}
                                  {ip.animationStyle && (
                                    <div className="rounded-md bg-fuchsia-950/10 border border-fuchsia-400/8 px-2.5 py-1.5">
                                      <div className="text-[8px] font-bold uppercase tracking-wider text-fuchsia-500/45 mb-0.5">{t.animationStyleLabel}</div>
                                      <div className="text-[11px] text-fuchsia-100/60 leading-tight">{ip.animationStyle}</div>
                                    </div>
                                  )}
                                </div>

                                {/* Detail fields */}
                                <div className="space-y-1.5">
                                  {([
                                    { label: t.environmentDetailLabel, value: ip.environmentDetail },
                                    { label: t.charPositioningLabel, value: ip.characterPositioning },
                                    { label: t.facialExpressionsLabel, value: ip.facialExpressionDetail },
                                    { label: t.charVisualContinuityLabel, value: ip.characterVisualContinuity },
                                  ] as { label: string; value: string }[]).filter(item => item.value).map((item, idx) => (
                                    <div key={idx} className="rounded-md bg-fuchsia-950/10 border border-fuchsia-400/8 px-2.5 py-1.5">
                                      <div className="text-[8px] font-bold uppercase tracking-wider text-fuchsia-500/45 mb-0.5">{item.label}</div>
                                      <div className="text-[11px] text-fuchsia-100/60 leading-relaxed">{item.value}</div>
                                    </div>
                                  ))}
                                </div>

                                {/* Visual Effects chips */}
                                {ip.visualEffects && ip.visualEffects.length > 0 && (
                                  <div>
                                    <div className="text-[8px] font-bold uppercase tracking-wider text-fuchsia-500/45 mb-1.5">{t.visualEffectsLabel}</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {ip.visualEffects.map((fx: string, fxi: number) => (
                                        <span key={fxi} className="inline-flex items-center gap-1 text-[9px] font-medium text-fuchsia-300/65 bg-fuchsia-950/20 border border-fuchsia-400/12 px-2 py-0.5 rounded-full">
                                          ✦ {fx}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Storyboard Frame Metadata — collapsible, closed by default */}
                      {scene.storyboardFrameMetadata && (() => {
                        const fm: StoryboardFrameMetadata = scene.storyboardFrameMetadata;
                        const frameKey = `frame-${i}`;
                        const isOpen = !!expandedSceneSections[frameKey];
                        return (
                          <div className="border-t border-white/5">
                            <button
                              onClick={() => toggleSceneSection(frameKey)}
                              className="w-full px-6 py-3.5 flex items-center justify-between gap-2 hover:bg-white/[0.02] transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <Layers className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">{t.frameMetadataLabel}</span>
                                {!isOpen && fm.aspectRatio && (
                                  <span className="hidden sm:inline text-[9px] text-rose-400/40 font-mono">{fm.aspectRatio}</span>
                                )}
                              </div>
                              <ChevronDown className={`w-3.5 h-3.5 text-rose-400/50 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                            {isOpen && (
                              <div className="px-6 pb-4 space-y-2">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {([
                                    { label: t.aspectRatioLabel, value: fm.aspectRatio },
                                    { label: t.focalLengthLabel, value: fm.focalLength },
                                    { label: t.depthOfFieldLabel, value: fm.depthOfField },
                                    { label: t.lensStyleFrameLabel, value: fm.lensStyle },
                                  ] as { label: string; value: string }[]).map((item, idx) => (
                                    <div key={idx} className="rounded-md bg-rose-950/15 border border-rose-400/10 px-2.5 py-1.5">
                                      <div className="text-[8px] font-bold uppercase tracking-wider text-rose-500/55 mb-0.5">{item.label}</div>
                                      <div className="text-[11px] text-rose-100/70 leading-tight">{item.value}</div>
                                    </div>
                                  ))}
                                </div>
                                {fm.cinematicCompositionNotes && (
                                  <p className="text-xs text-rose-200/50 italic leading-relaxed pl-3 border-l border-rose-400/15">{fm.cinematicCompositionNotes}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

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
                  );
                })}
              </div>
            </motion.div>

            {/* Production Readiness Score + Movie Readiness Report */}
            {(storyboard.productionReadinessScore !== undefined || storyboard.movieReadinessReport) && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-2xl font-semibold">{t.movieReport}</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Score card */}
                  {storyboard.productionReadinessScore !== undefined && (
                    <Card className="bg-card/60 backdrop-blur-md border-yellow-400/15 overflow-hidden flex flex-col items-center justify-center p-8 text-center">
                      <div className="mb-3">
                        <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/70">{t.productionScore}</div>
                      </div>
                      <div className="flex items-end gap-1">
                        <span className="text-7xl font-black text-yellow-300 tabular-nums leading-none">{storyboard.productionReadinessScore}</span>
                        <span className="text-2xl font-bold text-yellow-400/50 mb-2">{t.outOf100}</span>
                      </div>
                      <div className="w-full mt-4 h-2 rounded-full bg-yellow-950/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300"
                          style={{ width: `${storyboard.productionReadinessScore}%` }}
                        />
                      </div>
                      <div className="mt-3 text-xs text-yellow-400/50">
                        {storyboard.productionReadinessScore >= 90 ? "Festival Ready" :
                          storyboard.productionReadinessScore >= 70 ? "Solid Draft" :
                          storyboard.productionReadinessScore >= 50 ? "Promising" : "Needs Development"}
                      </div>
                    </Card>
                  )}

                  {/* Report detail */}
                  {storyboard.movieReadinessReport && (
                    <div className={`${storyboard.productionReadinessScore !== undefined ? "lg:col-span-2" : "lg:col-span-3"} space-y-4`}>
                      <Card className="bg-card/60 backdrop-blur-md border-white/5 overflow-hidden">
                        <CardContent className="p-5 space-y-5">
                          {storyboard.movieReadinessReport.strengths && storyboard.movieReadinessReport.strengths.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{t.reportStrengths}</span>
                              </div>
                              <ul className="space-y-1 pl-5">
                                {storyboard.movieReadinessReport.strengths.map((s: string, si: number) => (
                                  <li key={si} className="text-sm text-emerald-200/65 list-disc leading-relaxed">{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {storyboard.movieReadinessReport.weaknesses && storyboard.movieReadinessReport.weaknesses.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">{t.reportWeaknesses}</span>
                              </div>
                              <ul className="space-y-1 pl-5">
                                {storyboard.movieReadinessReport.weaknesses.map((w: string, wi: number) => (
                                  <li key={wi} className="text-sm text-yellow-200/65 list-disc leading-relaxed">{w}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {storyboard.movieReadinessReport.missingElements && storyboard.movieReadinessReport.missingElements.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">{t.reportMissing}</span>
                              </div>
                              <ul className="space-y-1 pl-5">
                                {storyboard.movieReadinessReport.missingElements.map((m: string, mi: number) => (
                                  <li key={mi} className="text-sm text-red-200/65 list-disc leading-relaxed">{m}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {storyboard.movieReadinessReport.productionNotes && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <ScrollText className="w-3.5 h-3.5 text-sky-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">{t.reportNotes}</span>
                              </div>
                              <p className="text-sm text-sky-200/65 leading-relaxed pl-4 border-l border-sky-400/15 italic">
                                {storyboard.movieReadinessReport.productionNotes}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Export Readiness */}
            {storyboard.exportReadiness && (
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Film className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-2xl font-semibold">{t.exportReadiness}</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {([
                    { label: t.screenplayReady, value: storyboard.exportReadiness.screenplayReady },
                    { label: t.storyboardReady, value: storyboard.exportReadiness.storyboardReady },
                    { label: t.animationReady, value: storyboard.exportReadiness.animationPipelineReady },
                    { label: t.voicePipelineReady, value: storyboard.exportReadiness.voicePipelineReady },
                    { label: t.editingReady, value: storyboard.exportReadiness.editingPipelineReady },
                  ] as { label: string; value: boolean }[]).map((item, idx) => (
                    <Card key={idx} className={`backdrop-blur-md border overflow-hidden ${item.value ? "bg-emerald-950/20 border-emerald-400/15" : "bg-red-950/10 border-red-400/10"}`}>
                      <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                        {item.value
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          : <XCircle className="w-5 h-5 text-red-400/55" />
                        }
                        <p className={`text-[9px] font-bold uppercase tracking-wider leading-tight ${item.value ? "text-emerald-300/70" : "text-red-300/45"}`}>
                          {item.label}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[8px] px-1.5 py-0 ${item.value ? "bg-emerald-400/15 text-emerald-300/80 border-emerald-400/20" : "bg-red-400/8 text-red-300/50 border-red-400/10"}`}
                        >
                          {item.value ? t.ready : t.notReady}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Visual Production Report */}
            {(storyboard.imageGenerationScore !== undefined || storyboard.visualProductionReport) && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-fuchsia-400" />
                  <h3 className="text-2xl font-semibold">{t.visualProductionReportLabel}</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Image Generation Score */}
                  {storyboard.imageGenerationScore !== undefined && (
                    <Card className="bg-card/60 backdrop-blur-md border-fuchsia-400/15 overflow-hidden flex flex-col items-center justify-center p-8 text-center">
                      <div className="mb-3">
                        <Camera className="w-8 h-8 text-fuchsia-400 mx-auto mb-2" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400/70">{t.imageGenScoreLabel}</div>
                      </div>
                      <div className="flex items-end gap-1">
                        <span className="text-7xl font-black text-fuchsia-300 tabular-nums leading-none">{storyboard.imageGenerationScore as number}</span>
                        <span className="text-2xl font-bold text-fuchsia-400/50 mb-2">{t.outOf100}</span>
                      </div>
                      <div className="w-full mt-4 h-2 rounded-full bg-fuchsia-950/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-300"
                          style={{ width: `${storyboard.imageGenerationScore as number}%` }}
                        />
                      </div>
                      <div className="mt-3 text-xs text-fuchsia-400/50">
                        {(storyboard.imageGenerationScore as number) >= 90 ? "Paste-Ready" :
                          (storyboard.imageGenerationScore as number) >= 70 ? "Minor Gaps" :
                          (storyboard.imageGenerationScore as number) >= 50 ? "Moderate" : "Needs Refinement"}
                      </div>
                    </Card>
                  )}

                  {/* Visual Production Report detail */}
                  {storyboard.visualProductionReport && (() => {
                    const vpr: VisualProductionReport = storyboard.visualProductionReport as VisualProductionReport;
                    return (
                      <div className={`${storyboard.imageGenerationScore !== undefined ? "lg:col-span-2" : "lg:col-span-3"} space-y-4`}>
                        <Card className="bg-card/60 backdrop-blur-md border-white/5 overflow-hidden">
                          <CardContent className="p-5 space-y-5">
                            {vpr.strongestVisualScenes && vpr.strongestVisualScenes.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Star className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{t.strongestScenesLabel}</span>
                                </div>
                                <ul className="space-y-1 pl-5">
                                  {vpr.strongestVisualScenes.map((s: string, si: number) => (
                                    <li key={si} className="text-sm text-emerald-200/65 list-disc leading-relaxed">{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {vpr.weakestVisualScenes && vpr.weakestVisualScenes.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <TrendingDown className="w-3.5 h-3.5 text-yellow-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">{t.weakestScenesLabel}</span>
                                </div>
                                <ul className="space-y-1 pl-5">
                                  {vpr.weakestVisualScenes.map((w: string, wi: number) => (
                                    <li key={wi} className="text-sm text-yellow-200/65 list-disc leading-relaxed">{w}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {vpr.consistencyRisks && vpr.consistencyRisks.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">{t.consistencyRisksLabel}</span>
                                </div>
                                <ul className="space-y-1 pl-5">
                                  {vpr.consistencyRisks.map((r: string, ri: number) => (
                                    <li key={ri} className="text-sm text-orange-200/65 list-disc leading-relaxed">{r}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {vpr.animationComplexityNotes && vpr.animationComplexityNotes.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{t.animationComplexityLabel}</span>
                                </div>
                                <ul className="space-y-1 pl-5">
                                  {vpr.animationComplexityNotes.map((n: string, ni: number) => (
                                    <li key={ni} className="text-sm text-indigo-200/65 list-disc leading-relaxed">{n}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {vpr.renderingDifficultyNotes && vpr.renderingDifficultyNotes.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-3.5 h-3.5 text-red-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">{t.renderingDifficultyLabel}</span>
                                </div>
                                <ul className="space-y-1 pl-5">
                                  {vpr.renderingDifficultyNotes.map((d: string, di: number) => (
                                    <li key={di} className="text-sm text-red-200/65 list-disc leading-relaxed">{d}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {vpr.cinematicStrengths && vpr.cinematicStrengths.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Film className="w-3.5 h-3.5 text-fuchsia-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400">{t.cinematicStrengthsLabel}</span>
                                </div>
                                <ul className="space-y-1 pl-5">
                                  {vpr.cinematicStrengths.map((cs: string, csi: number) => (
                                    <li key={csi} className="text-sm text-fuchsia-200/65 list-disc leading-relaxed">{cs}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}

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
