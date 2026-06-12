import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import {
  useAnalyzeStory,
  useGenerateSceneImage,
  useGenerateSceneVideo,
  useBatchGenerateVideos,
  useGetStoryboardAssets,
  useCreateMovieExport,
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
  type ImageProvider,
  type VideoProvider,
  type MovieExportFormat,
} from "@workspace/api-client-react";
const API_BASE_URL = import.meta.env.VITE_API_URL || "";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Sparkles, User, Clapperboard, RotateCcw, Video, Brain, Settings2, ChevronDown, Eye, Zap, Fingerprint, Clock, Moon, Lightbulb, ArrowLeftRight, BookOpen, MessageSquare, Swords, Heart, Music, Volume2, Waves, Mic2, Palette, CheckCircle2, AlertTriangle, XCircle, Trophy, ScrollText, Radio, Camera, Layers, BarChart3, Star, TrendingDown, Loader2, RefreshCw, ImageIcon, Wand2, Download, FileText, Package, Activity, List, Link2 } from "lucide-react";

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
    generateSceneImage: "Generate Scene Image",
    generatingImage: "Generating image...",
    regenerateImage: "Regenerate",
    retryGeneration: "Retry",
    generatedIn: "Generated in",
    seconds: "s",
    selectProvider: "Provider",
    imageGenerationFailed: "Generation Failed",
    generatedImage: "Generated Image",
    providerLabel: "via",
    characterRefLocked: "Character references locked",
    generateSceneVideo: "Generate Video Clip",
    generatingVideo: "Generating video clip...",
    videoGenerationFailed: "Video Generation Failed",
    retryVideo: "Retry",
    selectVideoProvider: "Video Provider",
    generatedVideoClip: "Generated Video Clip",
    videoDurationLabel: "Duration",
    motionDirected: "Motion directed",
    continuitySynced: "Continuity synced",
    videoProgress: "Processing...",
    generateAllVideos: "Generate All Videos",
    batchProgress: "Batch progress",
    batchComplete: "Batch complete",
    batchFailed: "Batch failed",
    batchRemaining: "remaining",
    batchPause: "Pause",
    batchResume: "Resume",
    batchCancel: "Cancel",
    batchRetry: "Retry Failed",
    batchPaused: "Paused",
    batchCancelled: "Cancelled",
    batchCompleted: "Completed",
    movieExport: "Export Movie",
    movieExportDesc: "Assemble scenes into a cinematic movie",
    movieExportFormat: "Format",
    movieExportProgress: "Exporting...",
    movieExportComplete: "Export Complete",
    movieExportFailed: "Export Failed",
    movieExportDownload: "Download",
    movieExportSubtitle: "Subtitles",
    movieExportMusic: "Background Music",
    movieExportVoice: "Voiceover",
    movieExportEffects: "Sound Effects",
    continuityPanel: "Character Continuity",
    continuityMatrix: "Continuity Matrix",
    clothingState: "Clothing",
    injuryState: "Injuries",
    timeOfDayState: "Time of Day",
    weatherState: "Weather",
    environmentContinuity: "Environment",
    productionInsights: "Production Insights",
    fullShotList: "Full Shot List",
    scenePacingLabel: "Scene Pacing",
    transitionPlanLabel: "Transition Plan",
    actingNotesLabel: "Character Acting Notes",
    avgTension: "Avg. Tension",
    peakTension: "Peak Scene",
    clientExportsLabel: "Download Data",
    exportJSON: "Export JSON",
    exportPromptPack: "Export Prompt Pack",
    exportCSV: "Export CSV",
    exportProductionPkg: "Export Production Package",
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
    generateSceneImage: "දර්ශන රූපය සාදන්න",
    generatingImage: "රූපය සාදමින්...",
    regenerateImage: "නැවත සාදන්න",
    retryGeneration: "නැවත උත්සාහ",
    generatedIn: "සාදන ලදී",
    seconds: "ත",
    selectProvider: "සේවා සපයන්නා",
    imageGenerationFailed: "රූප නිෂ්පාදනය අසාර්ථකයි",
    generatedImage: "සාදන ලද රූපය",
    providerLabel: "හරහා",
    characterRefLocked: "චරිත යොමු අගුළු දමා ඇත",
    generateSceneVideo: "වීඩියෝ ක්ලිප් සාදන්න",
    generatingVideo: "වීඩියෝ ක්ලිප් සාදමින්...",
    videoGenerationFailed: "වීඩියෝ නිෂ්පාදනය අසාර්ථකයි",
    retryVideo: "නැවත උත්සාහ",
    selectVideoProvider: "වීඩියෝ සේවා සපයන්නා",
    generatedVideoClip: "සාදන ලද වීඩියෝ",
    videoDurationLabel: "කාලය",
    motionDirected: "චලනය හසුරුවා ඇත",
    continuitySynced: "අඛණ්ඩතාව සමමුහුර්ත",
    videoProgress: "සකස් කරමින්...",
    generateAllVideos: "සියලු වීඩියෝ සාදන්න",
    batchProgress: "කාණ්ඩ ප්‍රගතිය",
    batchComplete: "කාණ්ඩය සම්පූර්ණයි",
    batchFailed: "කාණ්ඩය අසාර්ථකයි",
    batchRemaining: "ඉතිරිව ඇත",
    batchPause: "විරාමය",
    batchResume: "නැවත ආරම්භය",
    batchCancel: "අවලංගු",
    batchRetry: "අසාර්ථක නැවත උත්සාහය",
    batchPaused: "විරාමයේ",
    batchCancelled: "අවලංගු කළ",
    batchCompleted: "සම්පූර්ණයි",
    movieExport: "චිත්‍රපටය අපනයනය",
    movieExportDesc: "දර්ශන චිත්‍රපටයක් ලෙස සම්පාදනය කරන්න",
    movieExportFormat: "ආකෘතිය",
    movieExportProgress: "අපනයනය කරමින්...",
    movieExportComplete: "අපනයනය සම්පූර්ණයි",
    movieExportFailed: "අපනයනය අසාර්ථකයි",
    movieExportDownload: "බාගත කරන්න",
    movieExportSubtitle: "උපසිරැසි",
    movieExportMusic: "ප‍සුබ‍ර‍බ‍ම සංගීතය",
    movieExportVoice: "අවඥාන හඬ",
    movieExportEffects: "ධ‍වනි ප‍ර‍බ‍වයන්",
    continuityPanel: "චරිත අඛණ්ඩතාව",
    continuityMatrix: "අඛණ්ඩතා න්‍යාසය",
    clothingState: "ඇඳුම",
    injuryState: "තුවාල",
    timeOfDayState: "දිනය",
    weatherState: "කාලගුණය",
    environmentContinuity: "පරිසරය",
    productionInsights: "නිෂ්පාදන තොරතුරු",
    fullShotList: "සම්පූර්ණ රූ ලැයිස්තුව",
    scenePacingLabel: "දර්ශන ගමන",
    transitionPlanLabel: "සංක්‍රමණ සැලැස්ම",
    actingNotesLabel: "නළු සටහන්",
    avgTension: "මාධ්‍ය ආතතිය",
    peakTension: "ශිඛර දර්ශනය",
    clientExportsLabel: "දත්ත බාගත කරන්න",
    exportJSON: "JSON අපනයනය",
    exportPromptPack: "Prompt Pack අපනයනය",
    exportCSV: "CSV අපනයනය",
    exportProductionPkg: "නිෂ්පාදන පැකේජය",
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
    generateSceneImage: "காட்சி படம் உருவாக்கு",
    generatingImage: "படம் உருவாக்குகிறோம்...",
    regenerateImage: "மீண்டும் உருவாக்கு",
    retryGeneration: "மீண்டும் முயற்சி",
    generatedIn: "உருவாக்கப்பட்டது",
    seconds: "வி",
    selectProvider: "வழங்குநர்",
    imageGenerationFailed: "படம் உருவாக்கல் தோல்வி",
    generatedImage: "உருவாக்கப்பட்ட படம்",
    providerLabel: "மூலம்",
    characterRefLocked: "கதாபாத்திர குறிப்புகள் பூட்டப்பட்டன",
    generateSceneVideo: "வீடியோ கிளிப் உருவாக்கு",
    generatingVideo: "வீடியோ கிளிப் உருவாக்குகிறோம்...",
    videoGenerationFailed: "வீடியோ உருவாக்கல் தோல்வி",
    retryVideo: "மீண்டும் முயற்சி",
    selectVideoProvider: "வீடியோ வழங்குநர்",
    generatedVideoClip: "உருவாக்கப்பட்ட வீடியோ",
    videoDurationLabel: "கால அளவு",
    motionDirected: "இயக்கம் வழிநடத்தப்பட்டது",
    continuitySynced: "தொடர்ச்சி ஒத்திசைக்கப்பட்டது",
    videoProgress: "செயலாக்குகிறோம்...",
    generateAllVideos: "அனைத்து வீடியோக்களை உருவாக்கு",
    batchProgress: "குழு முன்னேற்றம்",
    batchComplete: "குழு முழுமையானது",
    batchFailed: "குழு தோல்வி",
    batchRemaining: "மீதமுள்ள",
    batchPause: "இடைநிறுத்து",
    batchResume: "தொடர்க",
    batchCancel: "ரத்து",
    batchRetry: "தோல்விகளை மீண்டும் முயற்சி",
    batchPaused: "இடைநிறுத்தப்பட்டது",
    batchCancelled: "ரத்து செய்யப்பட்டது",
    batchCompleted: "முடிந்தது",
    movieExport: "படம் எடுத்து",
    movieExportDesc: "காட்சிகளை சினிமா படமாக உருவாக்கு",
    movieExportFormat: "வடிவம்",
    movieExportProgress: "எடுத்துகொண்டுள்ளது...",
    movieExportComplete: "எடுத்தல் முழுமையானது",
    movieExportFailed: "எடுத்தல் தொல்வி",
    movieExportDownload: "பதிவிறக்க",
    movieExportSubtitle: "உபதைரிசைகள்",
    movieExportMusic: "பின்னணி இசை",
    movieExportVoice: "குரல்",
    movieExportEffects: "ஒலி பழங்கள்",
    continuityPanel: "கதாபாத்திர தொடர்ச்சி",
    continuityMatrix: "தொடர்ச்சி அட்டவணை",
    clothingState: "உடை",
    injuryState: "காயங்கள்",
    timeOfDayState: "நாள் நேரம்",
    weatherState: "வானிலை",
    environmentContinuity: "சூழல்",
    productionInsights: "தயாரிப்பு நுண்ணறிவு",
    fullShotList: "முழு ஷாட் பட்டியல்",
    scenePacingLabel: "காட்சி வேகம்",
    transitionPlanLabel: "மாற்ற திட்டம்",
    actingNotesLabel: "நடிப்பு குறிப்புகள்",
    avgTension: "சராசரி பதற்றம்",
    peakTension: "உச்ச காட்சி",
    clientExportsLabel: "தரவு பதிவிறக்க",
    exportJSON: "JSON ஏற்றுமதி",
    exportPromptPack: "Prompt Pack ஏற்றுமதி",
    exportCSV: "CSV ஏற்றுமதி",
    exportProductionPkg: "தயாரிப்பு தொகுப்பு",
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

// ─── Image Generation Types ────────────────────────────────────────────────────

type SceneImageStatus = "idle" | "loading" | "success" | "error";
// ─── Video Generation Types ────────────────────────────────────────────────────

type SceneVideoStatus = "idle" | "loading" | "success" | "error";

interface SceneVideoState {
  status: SceneVideoStatus;
  videoUrl?: string;
  videoProvider?: string;
  videoDuration?: number;
  generationTime?: number;
  generationProgress?: number;
  generationError?: string;
}

const VIDEO_PROVIDERS: { value: VideoProvider; label: string; description: string }[] = [
  { value: "luma",      label: "Luma AI Dream Machine", description: "LUMAAI_API_KEY" },
  { value: "runway",    label: "Runway Gen-4 Turbo",    description: "RUNWAY_API_KEY" },
  { value: "kling",     label: "Kling AI v1.6",         description: "KLING_ACCESS_KEY + KLING_SECRET_KEY" },
  { value: "pika",      label: "Pika 2.0",             description: "PIKA_API_KEY" },
  { value: "haiper",    label: "Haiper 2.0",           description: "HAIPER_API_KEY" },
  { value: "stability", label: "Stability Video",      description: "STABILITY_VIDEO_KEY" },
  { value: "pixverse",  label: "PixVerse V4",          description: "PIXVERSE_API_KEY" },
];

interface SceneImageState {
  status: SceneImageStatus;
  imageUrl?: string;
  imageProvider?: string;
  generationTime?: number;
  generationError?: string;
}

const IMAGE_PROVIDERS: { value: ImageProvider; label: string; free: boolean }[] = [
  { value: "pollinations", label: "Pollinations (Free)", free: true },
  { value: "openai", label: "OpenAI DALL-E 3", free: false },
  { value: "stability", label: "Stability AI Ultra", free: false },
  { value: "replicate", label: "Replicate FLUX", free: false },
  { value: "fal", label: "Fal.ai FLUX", free: false },
];

function Home() {
  const { toast } = useToast();
  const analyzeMutation = useAnalyzeStory();
  const generateImageMutation = useGenerateSceneImage();
  const generateVideoMutation = useGenerateSceneVideo();
  const createMovieExportMutation = useCreateMovieExport();

  const [story, setStory] = useState("");
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);

  const assetsQuery = useGetStoryboardAssets(
    { storyboardId: storyboard?.storyboardId ?? "" },
    { query: { queryKey: ["storyboardAssets", storyboard?.storyboardId ?? ""], enabled: !!storyboard?.storyboardId } }
  );
  const [uiLanguage, setUiLanguage] = useState<UILang>("en");
  const [outputLanguage, setOutputLanguage] = useState<OutputLang>("en");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedSceneSections, setExpandedSceneSections] = useState<Record<string, boolean>>({});
  const toggleSceneSection = (key: string) =>
    setExpandedSceneSections(prev => ({ ...prev, [key]: !prev[key] }));

  const [imageStates, setImageStates] = useState<Record<number, SceneImageState>>(() => {
    try {
      const saved = localStorage.getItem("dreamframe-image-states");
      if (!saved) return {};
      const parsed = JSON.parse(saved) as Record<number, SceneImageState>;
      // Only restore successful images
      const restored: Record<number, SceneImageState> = {};
      for (const [key, val] of Object.entries(parsed)) {
        if (val.status === "success" && val.imageUrl) {
          restored[Number(key)] = val;
        }
      }
      return restored;
    } catch {
      return {};
    }
  });

  const [selectedProvider, setSelectedProvider] = useState<ImageProvider>("pollinations");

  const [videoStates, setVideoStates] = useState<Record<number, SceneVideoState>>(() => {
    try {
      const saved = localStorage.getItem("dreamframe-video-states");
      if (!saved) return {};
      const parsed = JSON.parse(saved) as Record<number, SceneVideoState>;
      const restored: Record<number, SceneVideoState> = {};
      for (const [key, val] of Object.entries(parsed)) {
        if (val.status === "success" && val.videoUrl) {
          restored[Number(key)] = val;
        }
      }
      return restored;
    } catch {
      return {};
    }
  });

  const [selectedVideoProvider, setSelectedVideoProvider] = useState<VideoProvider>("luma");
  const [videoDuration, setVideoDuration] = useState<5 | 10>(5);
  const [movieExportFormat, setMovieExportFormat] = useState<MovieExportFormat>("mp4");
  const [movieExportSubtitle, setMovieExportSubtitle] = useState<boolean>(false);
  const [movieExportMusic, setMovieExportMusic] = useState<boolean>(true);
  const [movieExportVoice, setMovieExportVoice] = useState<boolean>(false);
  const [movieExportEffects, setMovieExportEffects] = useState<boolean>(true);
  const [movieExportState, setMovieExportState] = useState<{ status: string; progress: number; exportUrl?: string; exportError?: string } | null>(null);
  const [continuityPanelOpen, setContinuityPanelOpen] = useState(false);
  const [insightsPanelOpen, setInsightsPanelOpen] = useState(false);

  const downloadBlob = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = (sb: Storyboard) => {
    downloadBlob(JSON.stringify(sb, null, 2), `${sb.title ?? "storyboard"}.json`, "application/json");
  };

  const downloadPromptPack = (sb: Storyboard) => {
    const lines: string[] = [`# ${sb.title ?? "Storyboard"} — Cinematic Prompt Pack\n\n`];
    for (const scene of sb.scenes) {
      lines.push(`## Scene ${scene.sceneNumber}: ${scene.title ?? ""}\n`);
      lines.push(`**Type:** ${scene.sceneType}  |  **Setting:** ${scene.setting ?? ""}\n\n`);
      if (scene.sceneImagePrompt?.sceneImagePrompt) {
        lines.push(`### Image Prompt\n${scene.sceneImagePrompt.sceneImagePrompt}\n\n`);
      }
      if (scene.directorNote) {
        lines.push(`### Director's Note\n${scene.directorNote}\n\n`);
      }
      if (scene.cinematicCamera) {
        const cc = scene.cinematicCamera;
        lines.push(`### Camera Direction\n`);
        if (cc.shotType) lines.push(`- Shot Type: ${cc.shotType}\n`);
        if (cc.cameraAngle) lines.push(`- Angle: ${cc.cameraAngle}\n`);
        if (cc.cameraMovement) lines.push(`- Movement: ${cc.cameraMovement}\n`);
        if (cc.lightingStyle) lines.push(`- Lighting: ${cc.lightingStyle}\n`);
        lines.push("\n");
      }
      lines.push("---\n\n");
    }
    downloadBlob(lines.join(""), `${sb.title ?? "storyboard"}-prompts.md`, "text/markdown");
  };

  const downloadCSV = (sb: Storyboard) => {
    const headers = ["Scene", "Type", "Title", "Setting", "Shot Type", "Camera Movement", "Lighting Style", "Tension", "Image Prompt"];
    const rows = sb.scenes.map(s => [
      s.sceneNumber,
      s.sceneType,
      `"${(s.title ?? "").replace(/"/g, '""')}"`,
      `"${(s.setting ?? "").replace(/"/g, '""')}"`,
      s.cinematicCamera?.shotType ?? "",
      s.cinematicCamera?.cameraMovement ?? "",
      s.cinematicCamera?.lightingStyle ?? "",
      s.tensionAnalysis?.emotionalIntensity ?? "",
      `"${(s.sceneImagePrompt?.sceneImagePrompt ?? "").replace(/"/g, '""').slice(0, 200)}"`,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    downloadBlob(csv, `${sb.title ?? "storyboard"}-scenes.csv`, "text/csv");
  };

  const downloadProductionPkg = (sb: Storyboard) => {
    const pkg = {
      meta: { title: sb.title, genre: sb.genre, logline: sb.logline, storyboardId: sb.storyboardId, exportedAt: new Date().toISOString() },
      characters: sb.characters,
      scenes: sb.scenes.map(s => ({
        sceneNumber: s.sceneNumber, sceneType: s.sceneType, title: s.title, setting: s.setting,
        imagePrompt: s.sceneImagePrompt?.sceneImagePrompt,
        directorNote: s.directorNote,
        camera: s.cinematicCamera,
        continuityMemory: s.continuityMemory,
        shotList: s.shotList,
        tensionAnalysis: s.tensionAnalysis,
      })),
      shotList: sb.scenes.flatMap(s => (s.shotList ?? []).map(sh => ({ ...sh, sceneNumber: s.sceneNumber }))),
      productionScore: sb.productionScore,
      movieReadinessReport: sb.movieReadinessReport,
    };
    downloadBlob(JSON.stringify(pkg, null, 2), `${sb.title ?? "storyboard"}-production-package.json`, "application/json");
  };

  useEffect(() => {
    try {
      const toSave: Record<number, SceneImageState> = {};
      for (const [key, val] of Object.entries(imageStates)) {
        if (val.status === "success" && val.imageUrl) {
          toSave[Number(key)] = val;
        }
      }
      localStorage.setItem("dreamframe-image-states", JSON.stringify(toSave));
    } catch {
      // localStorage unavailable
    }
  }, [imageStates]);

  useEffect(() => {
    try {
      const toSave: Record<number, SceneVideoState> = {};
      for (const [key, val] of Object.entries(videoStates)) {
        if (val.status === "success" && val.videoUrl) {
          toSave[Number(key)] = val;
        }
      }
      localStorage.setItem("dreamframe-video-states", JSON.stringify(toSave));
    } catch {
      // localStorage unavailable
    }
  }, [videoStates]);

  // Load persisted assets from DB when storyboard changes
  useEffect(() => {
    if (!assetsQuery.data || !storyboard) return;
    const data = assetsQuery.data;
    if (data.scenes && data.scenes.length > 0) {
      setImageStates(prev => {
        const next = { ...prev };
        for (const s of data.scenes) {
          if (s.imageUrl && s.imageStatus === "success") {
            next[s.sceneNumber] = {
              status: "success",
              imageUrl: s.imageUrl,
              imageProvider: s.imageProvider,
              generationTime: s.generationTime,
            };
          }
        }
        return next;
      });
      setVideoStates(prev => {
        const next = { ...prev };
        for (const s of data.scenes) {
          if (s.videoUrl && s.videoStatus === "success") {
            next[s.sceneNumber] = {
              status: "success",
              videoUrl: s.videoUrl,
              videoProvider: s.videoProvider,
              videoDuration: s.videoDuration,
              generationTime: s.generationTime,
              generationProgress: 100,
            };
          } else if (s.videoStatus === "error") {
            next[s.sceneNumber] = {
              status: "error",
              videoProvider: s.videoProvider,
              generationTime: s.generationTime,
              generationProgress: 0,
              generationError: s.generationError,
            };
          } else if (s.videoStatus === "processing") {
            next[s.sceneNumber] = {
              status: "loading",
              videoProvider: s.videoProvider,
              generationProgress: s.generationProgress ?? 0,
            };
          }
        }
        return next;
      });
    }
    if (data.batchQueue) {
      setVideoQueue({
        status: data.batchQueue.status as QueueStatus,
        completedScenes: data.batchQueue.completedScenes ?? [],
        failedScenes: data.batchQueue.failedScenes ?? [],
        activeScene: data.batchQueue.activeScene ?? null,
        queueProgress: data.batchQueue.queueProgress ?? 0,
        estimatedRemainingTime: data.batchQueue.estimatedRemainingTime ?? 0,
        totalScenes: data.batchQueue.totalScenes ?? 0,
      });
    }
  }, [assetsQuery.data, storyboard]);

  const handleGenerateImage = (scene: Scene) => {
    const sceneNum = scene.sceneNumber;
    if (imageStates[sceneNum]?.status === "loading") return;
    if (!scene.sceneImagePrompt?.sceneImagePrompt) {
      toast({ title: "No image prompt", description: "This scene has no image prompt data.", variant: "destructive" });
      return;
    }

    setImageStates(prev => ({ ...prev, [sceneNum]: { status: "loading" } }));

    generateImageMutation.mutate(
      {
        data: {
          storyboardId: storyboard?.storyboardId,
          sceneNumber: sceneNum,
          sceneImagePrompt: scene.sceneImagePrompt.sceneImagePrompt,
          provider: selectedProvider,
          characterProfiles: storyboard?.characters,
          characterVisualContinuity: scene.sceneImagePrompt.characterVisualContinuity,
          colorPalette: scene.sceneImagePrompt.colorPalette,
          cinematicMood: scene.sceneImagePrompt.cinematicMood,
          renderStyle: scene.sceneImagePrompt.renderStyle,
          visualEngine: scene.sceneImagePrompt.visualEngine,
        },
      },
      {
        onSuccess: (data) => {
          if (data.imageStatus === "success" && data.imageUrl) {
            setImageStates(prev => ({
              ...prev,
              [sceneNum]: {
                status: "success",
                imageUrl: data.imageUrl,
                imageProvider: data.imageProvider,
                generationTime: data.generationTime,
              },
            }));
          } else {
            setImageStates(prev => ({
              ...prev,
              [sceneNum]: {
                status: "error",
                imageProvider: data.imageProvider,
                generationTime: data.generationTime,
                generationError: data.generationError ?? "Generation failed",
              },
            }));
          }
        },
        onError: (err) => {
          setImageStates(prev => ({
            ...prev,
            [sceneNum]: {
              status: "error",
              generationError: err instanceof Error ? err.message : "Generation failed",
            },
          }));
        },
      }
    );
  };

  const handleGenerateVideo = (scene: Scene) => {
    const sceneNum = scene.sceneNumber;
    if (videoStates[sceneNum]?.status === "loading") return;

    const videoPrompt = scene.sceneImagePrompt?.sceneImagePrompt ?? scene.setting ?? `Scene ${sceneNum}`;

    // Scene-to-Video Intelligence: extract dominant emotion
    let dominantEmotion: string | undefined;
    let emotionalIntensity: number | undefined;
    if (scene.characterEmotions && scene.characterEmotions.length > 0) {
      const sorted = [...scene.characterEmotions].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
      dominantEmotion = sorted[0]?.emotion;
      emotionalIntensity = sorted[0]?.confidence;
    }

    // Motion Direction: character movements from actions
    const characterMovements: string[] = (scene.characterActions ?? []).map(
      (a: CharacterAction) => `${a.character}: ${a.action}`
    );

    // Environmental motion from continuity state
    const environmentalMotion = scene.continuityMemory?.weatherState;

    // Cinematic transition from last shot
    const lastShot = scene.shotList?.[scene.shotList.length - 1];
    const cinematicTransition = lastShot?.transitionType;

    // Video Continuity: carry state from continuity memory
    const mem = scene.continuityMemory;
    const clothingState = mem?.clothingState;

    // Increment retry count on error
    const prevRetry = videoStates[sceneNum]?.status === "error" ? (videoStates[sceneNum]?.generationProgress ?? 0) : 0;
    const retryCount = videoStates[sceneNum]?.status === "error" ? (prevRetry < 0 ? Math.abs(prevRetry) : 0) + 1 : 0;
    // Use a temporary negative progress value to track retry count
    setVideoStates(prev => ({ ...prev, [sceneNum]: { status: "loading", generationProgress: retryCount > 0 ? -retryCount : 0 } }));

    // Start client-side progress ticker
    let progressTick = 0;
    const progressInterval = setInterval(() => {
      progressTick = Math.min(progressTick + 2, 90);
      setVideoStates(prev => {
        if (prev[sceneNum]?.status !== "loading") {
          clearInterval(progressInterval);
          return prev;
        }
        return { ...prev, [sceneNum]: { ...prev[sceneNum], generationProgress: progressTick } };
      });
    }, 3000);

    generateVideoMutation.mutate(
      {
        data: {
          storyboardId: storyboard?.storyboardId,
          sceneNumber: sceneNum,
          videoPrompt,
          provider: selectedVideoProvider,
          imageUrl: imageStates[sceneNum]?.imageUrl,
          duration: videoDuration,
          // Scene intelligence
          characterProfiles: storyboard?.characters,
          characterVisualContinuity: scene.sceneImagePrompt?.characterVisualContinuity,
          cameraMovement: scene.cinematicCamera?.cameraMovement,
          cinematicMood: scene.sceneImagePrompt?.cinematicMood,
          lightingStyle: scene.cinematicCamera?.lightingStyle,
          animationStyle: scene.sceneImagePrompt?.animationStyle,
          dominantEmotion,
          emotionalIntensity,
          shotType: scene.cinematicCamera?.shotType,
          pacingStyle: scene.cinematicCamera?.pacingStyle,
          // Motion direction
          characterMovements,
          environmentalMotion,
          cinematicTransition,
          // Video continuity
          clothingState,
          lightingState: mem?.lightingState,
          environmentState: mem?.environmentState,
          emotionalCarryOver: mem?.emotionalCarryOver,
        },
      },
      {
        onSuccess: (data) => {
          clearInterval(progressInterval);
          if (data.videoStatus === "success" && data.videoUrl) {
            setVideoStates(prev => ({
              ...prev,
              [sceneNum]: {
                status: "success",
                videoUrl: data.videoUrl,
                videoProvider: data.videoProvider,
                videoDuration: data.videoDuration,
                generationTime: data.generationTime,
                generationProgress: 100,
              },
            }));
          } else {
            setVideoStates(prev => ({
              ...prev,
              [sceneNum]: {
                status: "error",
                videoProvider: data.videoProvider,
                generationTime: data.generationTime,
                generationProgress: 0,
                generationError: data.generationError ?? "Video generation failed",
              },
            }));
          }
        },
        onError: (err) => {
          clearInterval(progressInterval);
          setVideoStates(prev => ({
            ...prev,
            [sceneNum]: {
              status: "error",
              generationProgress: 0,
              generationError: err instanceof Error ? err.message : "Video generation failed",
            },
          }));
        },
      }
    );
  };

  // Batch generate all scene videos (sequential)
  // ─── Global Video Queue Manager ───────────────────────────────────
  type QueueStatus = "idle" | "running" | "paused" | "completed" | "cancelled";

  interface VideoQueueState {
    status: QueueStatus;
    completedScenes: number[];
    failedScenes: number[];
    activeScene: number | null;
    queueProgress: number;
    estimatedRemainingTime: number;
    totalScenes: number;
  }

  const [videoQueue, setVideoQueue] = useState<VideoQueueState>({
    status: "idle",
    completedScenes: [],
    failedScenes: [],
    activeScene: null,
    queueProgress: 0,
    estimatedRemainingTime: 0,
    totalScenes: 0,
  });

  const batchVideoMutation = useBatchGenerateVideos();

  // ─── Cinematic Continuity Engine Helpers ───────────────────────
  function extractDominantEmotion(scene: Scene): { emotion: string; intensity: number } | null {
    if (!scene.characterEmotions || scene.characterEmotions.length === 0) return null;
    const sorted = [...scene.characterEmotions].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
    const top = sorted[0];
    if (!top) return null;
    return { emotion: top.emotion, intensity: top.confidence ?? 0.5 };
  }

  function extractTimelineMemory(scene: Scene): {
    cameraMovement: string | undefined;
    emotionalState: string | undefined;
    visualPalette: string | undefined;
    environmentState: string | undefined;
  } {
    const emo = extractDominantEmotion(scene);
    return {
      cameraMovement: scene.cinematicCamera?.cameraMovement,
      emotionalState: emo ? `${emo.emotion} (${emo.intensity >= 0.8 ? "intense" : emo.intensity >= 0.5 ? "moderate" : "subtle"})` : undefined,
      visualPalette: scene.sceneImagePrompt?.colorPalette ?? scene.cinematicCamera?.lightingStyle,
      environmentState: scene.continuityMemory?.environmentState ?? scene.continuityMemory?.weatherState,
    };
  }

  function determineTransitionType(
    prevScene: Scene | undefined,
    currScene: Scene
  ): "fade" | "dissolve" | "whip_pan" | "cinematic_cut" | "dream_dissolve" | "flashback_blur" | "match_cut" {
    // If explicit transition type exists on last shot, use it
    const lastShot = currScene.shotList?.[currScene.shotList.length - 1];
    const explicitTransition = lastShot?.transitionType;
    if (explicitTransition) {
      const map: Record<string, "fade" | "dissolve" | "whip_pan" | "cinematic_cut" | "dream_dissolve" | "flashback_blur" | "match_cut"> = {
        "Fade": "fade",
        "Dissolve": "dissolve",
        "Whip Pan": "whip_pan",
        "Cinematic Cut": "cinematic_cut",
        "Dream Ripple": "dream_dissolve",
        "Flashback Blur": "flashback_blur",
        "Match Cut": "match_cut",
      };
      if (map[explicitTransition]) return map[explicitTransition]!;
    }

    // Scene type based transitions
    const currType = currScene.sceneType;
    if (currType === "Flashback") return "flashback_blur";
    if (currType === "Dream") return "dream_dissolve";
    if (currType === "Imagination") return "dissolve";

    // Transition from previous scene type
    if (prevScene) {
      const prevType = prevScene.sceneType;
      if (prevType === "Dream" && currType === "Present") return "fade";
      if (prevType === "Flashback" && currType === "Present") return "flashback_blur";
      if (prevType === "Imagination" && currType === "Present") return "dissolve";
    }

    // Default: cinematic cut for Present scenes
    return "cinematic_cut";
  }

  // ─── Batch Video Generation with Queue Manager ───────────────
  const handleGenerateAllVideos = () => {
    if (!storyboard || storyboard.scenes.length === 0) return;
    const scenes = storyboard.scenes;

    // Build cinematic timeline: extract previous scene memory for each scene
    const timelineScenes = scenes.map((scene, idx) => {
      const prevScene = idx > 0 ? scenes[idx - 1] : undefined;
      const prevMemory = prevScene ? extractTimelineMemory(prevScene) : undefined;
      const emo = extractDominantEmotion(scene);
      const transitionType = determineTransitionType(prevScene, scene);
      const lastShot = scene.shotList?.[scene.shotList.length - 1];
      const characterMovements = (scene.characterActions ?? []).map((a) => `${a.character}: ${a.action}`);
      const mem = scene.continuityMemory;

      return {
        sceneNumber: scene.sceneNumber,
        videoPrompt: scene.sceneImagePrompt?.sceneImagePrompt ?? scene.setting ?? `Scene ${scene.sceneNumber}`,
        imageUrl: imageStates[scene.sceneNumber]?.imageUrl,
        characterProfiles: storyboard.characters,
        characterVisualContinuity: scene.sceneImagePrompt?.characterVisualContinuity,
        cameraMovement: scene.cinematicCamera?.cameraMovement,
        cinematicMood: scene.sceneImagePrompt?.cinematicMood,
        lightingStyle: scene.cinematicCamera?.lightingStyle,
        animationStyle: scene.sceneImagePrompt?.animationStyle,
        dominantEmotion: emo?.emotion,
        emotionalIntensity: emo?.intensity,
        shotType: scene.cinematicCamera?.shotType,
        pacingStyle: scene.cinematicCamera?.pacingStyle,
        characterMovements,
        environmentalMotion: mem?.weatherState,
        cinematicTransition: lastShot?.transitionType,
        clothingState: mem?.clothingState,
        lightingState: mem?.lightingState,
        environmentState: mem?.environmentState,
        emotionalCarryOver: mem?.emotionalCarryOver,
        // Timeline memory (cinematic continuity)
        previousCameraMovement: prevMemory?.cameraMovement,
        previousEmotionalState: prevMemory?.emotionalState,
        previousVisualPalette: prevMemory?.visualPalette,
        previousEnvironmentState: prevMemory?.environmentState,
        // Transition intelligence
        transitionType,
      };
    });

    // Set initial queue state
    setVideoQueue({
      status: "running",
      completedScenes: [],
      failedScenes: [],
      activeScene: null,
      queueProgress: 0,
      estimatedRemainingTime: scenes.length * 45,
      totalScenes: scenes.length,
    });

    // Mark all scenes as loading initially
    for (const s of scenes) {
      setVideoStates(prev => ({ ...prev, [s.sceneNumber]: { ...prev[s.sceneNumber], status: "loading" as SceneVideoStatus, generationProgress: 0 } }));
    }

    batchVideoMutation.mutate(
      {
        data: {
          storyboardId: storyboard?.storyboardId,
          scenes: timelineScenes,
          provider: selectedVideoProvider,
          duration: videoDuration,
        },
      },
      {
        onSuccess: (data) => {
          setVideoQueue({
            status: data.batchVideoStatus as QueueStatus,
            completedScenes: data.completedScenes,
            failedScenes: data.failedScenes,
            activeScene: data.activeScene ?? null,
            queueProgress: data.queueProgress,
            estimatedRemainingTime: data.estimatedRemainingTime ?? 0,
            totalScenes: scenes.length,
          });
          // Start polling for status updates
          startQueuePolling();
        },
        onError: () => {
          setVideoQueue(prev => ({ ...prev, status: "idle" }));
          // Clear loading states
          for (const s of scenes) {
            const sn = s.sceneNumber;
            setVideoStates(prev => ({ ...prev, [sn]: { ...prev[sn], status: "idle" as SceneVideoStatus } }));
          }
        },
      }
    );
  };

  // Queue polling for status updates
  const startQueuePolling = () => {
    const pollInterval = setInterval(() => {
      fetch(`${API_BASE_URL}/storyboard/batch-generate-videos/status`, { method: "GET" })
        .then(res => res.json())
        .then((data: {
          batchVideoStatus: string;
          completedScenes: number[];
          failedScenes: number[];
          activeScene: number | null;
          queueProgress: number;
          estimatedRemainingTime: number;
          sceneResults: Record<number, {
            videoStatus: string;
            videoUrl?: string;
            videoProvider?: string;
            videoDuration?: number;
            generationTime?: number;
            generationError?: string;
          }>;
        }) => {
          setVideoQueue(prev => ({
            ...prev,
            status: data.batchVideoStatus as QueueStatus,
            completedScenes: data.completedScenes,
            failedScenes: data.failedScenes,
            activeScene: data.activeScene,
            queueProgress: data.queueProgress,
            estimatedRemainingTime: data.estimatedRemainingTime,
          }));

          // Update per-scene video states from results
          for (const [sceneNumStr, result] of Object.entries(data.sceneResults)) {
            const sceneNum = Number(sceneNumStr);
            if (result.videoStatus === "success" && result.videoUrl) {
              setVideoStates(prev => ({
                ...prev,
                [sceneNum]: {
                  status: "success",
                  videoUrl: result.videoUrl,
                  videoProvider: result.videoProvider,
                  videoDuration: result.videoDuration,
                  generationTime: result.generationTime,
                  generationProgress: 100,
                },
              }));
            } else if (result.videoStatus === "error") {
              setVideoStates(prev => ({
                ...prev,
                [sceneNum]: {
                  status: "error",
                  videoProvider: result.videoProvider,
                  generationTime: result.generationTime,
                  generationProgress: 0,
                  generationError: result.generationError ?? "Video generation failed",
                },
              }));
            }
          }

          // Stop polling when done
          if (data.batchVideoStatus === "completed" || data.batchVideoStatus === "cancelled") {
            clearInterval(pollInterval);
            setTimeout(() => setVideoQueue(prev => ({ ...prev, status: "idle" })), 4000);
          }
        })
        .catch(() => {
          // Silently ignore poll errors
        });
    }, 2000);
  };

  // Queue control handlers
  const handlePauseQueue = () => {
    fetch(`${API_BASE_URL}/storyboard/batch-generate-videos/pause`, { method: "POST" });
    setVideoQueue(prev => ({ ...prev, status: "paused" }));
  };

  const handleResumeQueue = () => {
    fetch(`${API_BASE_URL}/storyboard/batch-generate-videos/resume`, { method: "POST" });
    setVideoQueue(prev => ({ ...prev, status: "running" }));
  };

  const handleCancelQueue = () => {
    fetch(`${API_BASE_URL}/storyboard/batch-generate-videos/cancel`, { method: "POST" });
    setVideoQueue(prev => ({ ...prev, status: "cancelled" }));
  };

  const handleRetryFailedScenes = () => {
    if (!storyboard || videoQueue.failedScenes.length === 0) return;
    const failedSceneNums = videoQueue.failedScenes;
    const scenes = storyboard.scenes.filter(s => failedSceneNums.includes(s.sceneNumber));
    // Reset failed states to idle
    for (const sn of failedSceneNums) {
      setVideoStates(prev => ({ ...prev, [sn]: { ...prev[sn], status: "idle" as SceneVideoStatus } }));
    }
    // Re-run batch with only failed scenes
    const timelineScenes = scenes.map((scene, idx) => {
      const sceneIdx = storyboard.scenes.indexOf(scene);
      const prevScene = sceneIdx > 0 ? storyboard.scenes[sceneIdx - 1] : undefined;
      const prevMemory = prevScene ? extractTimelineMemory(prevScene) : undefined;
      const emo = extractDominantEmotion(scene);
      const transitionType = determineTransitionType(prevScene, scene);
      const lastShot = scene.shotList?.[scene.shotList.length - 1];
      const characterMovements = (scene.characterActions ?? []).map((a) => `${a.character}: ${a.action}`);
      const mem = scene.continuityMemory;

      return {
        sceneNumber: scene.sceneNumber,
        videoPrompt: scene.sceneImagePrompt?.sceneImagePrompt ?? scene.setting ?? `Scene ${scene.sceneNumber}`,
        imageUrl: imageStates[scene.sceneNumber]?.imageUrl,
        characterProfiles: storyboard.characters,
        characterVisualContinuity: scene.sceneImagePrompt?.characterVisualContinuity,
        cameraMovement: scene.cinematicCamera?.cameraMovement,
        cinematicMood: scene.sceneImagePrompt?.cinematicMood,
        lightingStyle: scene.cinematicCamera?.lightingStyle,
        animationStyle: scene.sceneImagePrompt?.animationStyle,
        dominantEmotion: emo?.emotion,
        emotionalIntensity: emo?.intensity,
        shotType: scene.cinematicCamera?.shotType,
        pacingStyle: scene.cinematicCamera?.pacingStyle,
        characterMovements,
        environmentalMotion: mem?.weatherState,
        cinematicTransition: lastShot?.transitionType,
        clothingState: mem?.clothingState,
        lightingState: mem?.lightingState,
        environmentState: mem?.environmentState,
        emotionalCarryOver: mem?.emotionalCarryOver,
        previousCameraMovement: prevMemory?.cameraMovement,
        previousEmotionalState: prevMemory?.emotionalState,
        previousVisualPalette: prevMemory?.visualPalette,
        previousEnvironmentState: prevMemory?.environmentState,
        transitionType,
      };
    });

    setVideoQueue({
      status: "running",
      completedScenes: [],
      failedScenes: [],
      activeScene: null,
      queueProgress: 0,
      estimatedRemainingTime: failedSceneNums.length * 45,
      totalScenes: failedSceneNums.length,
    });

    for (const s of scenes) {
      setVideoStates(prev => ({ ...prev, [s.sceneNumber]: { ...prev[s.sceneNumber], status: "loading" as SceneVideoStatus, generationProgress: 0 } }));
    }

    batchVideoMutation.mutate(
      {
        data: {
          storyboardId: storyboard?.storyboardId,
          scenes: timelineScenes,
          provider: selectedVideoProvider,
          duration: videoDuration,
        },
      },
      {
        onSuccess: () => startQueuePolling(),
        onError: () => setVideoQueue(prev => ({ ...prev, status: "idle" })),
      }
    );
  };

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

  const handleMovieExport = () => {
    if (!storyboard?.storyboardId) {
      toast({ title: "No storyboard", description: "Generate a storyboard first", variant: "destructive" });
      return;
    }
    setMovieExportState({ status: "processing", progress: 0 });
    createMovieExportMutation.mutate(
      {
        data: {
          storyboardId: storyboard.storyboardId,
          format: movieExportFormat,
          subtitleConfig: {
            enabled: movieExportSubtitle,
            language: outputLanguage,
          },
          audioLayer: {
            musicEnabled: movieExportMusic,
            voiceEnabled: movieExportVoice,
            effectsEnabled: movieExportEffects,
          },
        },
      },
      {
        onSuccess: (data) => {
          setMovieExportState({ status: data.status, progress: data.exportProgress ?? 0 });
          // Start polling for progress
          const pollInterval = setInterval(() => {
            fetch(`${API_BASE_URL}/storyboard/movie-export/${data.exportId}`, { method: "GET" })
              .then(res => res.json())
              .then((exportData: { status: string; exportProgress?: number; exportUrl?: string; exportError?: string }) => {
                setMovieExportState({ status: exportData.status, progress: exportData.exportProgress ?? 0, exportUrl: exportData.exportUrl, exportError: exportData.exportError });
                if (exportData.status === "completed" || exportData.status === "failed") {
                  clearInterval(pollInterval);
                }
              })
              .catch(() => {
                clearInterval(pollInterval);
                setMovieExportState(prev => ({ ...prev!, status: "failed", exportError: "Failed to check export status" }));
              });
          }, 2000);
        },
        onError: () => {
          setMovieExportState({ status: "failed", progress: 0, exportError: "Export request failed" });
        },
      }
    );
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

            {/* Character Continuity Panel */}
            {storyboard.scenes.some(s => s.continuityMemory || s.continuityCheck) && (
              <motion.div variants={itemVariants} className="space-y-4">
                <button
                  onClick={() => setContinuityPanelOpen(p => !p)}
                  className="w-full flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <Link2 className="w-6 h-6 text-teal-400" />
                    <h3 className="text-2xl font-semibold">{t.continuityPanel}</h3>
                    <Badge className="bg-teal-400/15 text-teal-300 border-teal-400/20 text-xs">
                      {storyboard.scenes.filter(s => s.continuityMemory).length} scenes tracked
                    </Badge>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-teal-400/50 transition-transform duration-200 ${continuityPanelOpen ? "rotate-180" : ""}`} />
                </button>
                {continuityPanelOpen && (
                  <div className="space-y-5">
                    {/* Continuity Matrix */}
                    {storyboard.scenes.some(s => s.continuityMemory) && (
                      <div className="overflow-x-auto rounded-xl border border-teal-400/10 bg-card/40 backdrop-blur-md">
                        <table className="w-full text-xs min-w-[600px]">
                          <thead>
                            <tr className="border-b border-teal-400/10">
                              <th className="px-4 py-3 text-left text-teal-400/50 font-bold uppercase tracking-wider whitespace-nowrap">Scene</th>
                              {storyboard.characters.slice(0, 4).map((c, ci) => (
                                <th key={ci} className="px-4 py-3 text-left text-teal-400/50 font-bold uppercase tracking-wider whitespace-nowrap">{c.name.split(" ")[0]}</th>
                              ))}
                              <th className="px-4 py-3 text-left text-teal-400/50 font-bold uppercase tracking-wider">{t.weatherState}</th>
                              <th className="px-4 py-3 text-left text-teal-400/50 font-bold uppercase tracking-wider">{t.timeOfDayState}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {storyboard.scenes.filter(s => s.continuityMemory).map((scene, si) => {
                              const cm = scene.continuityMemory!;
                              return (
                                <tr key={si} className={`border-b border-teal-400/5 ${si % 2 === 0 ? "bg-teal-950/5" : ""}`}>
                                  <td className="px-4 py-3 text-teal-300/70 font-mono font-semibold whitespace-nowrap">
                                    S{scene.sceneNumber.toString().padStart(2, "0")}
                                    <span className="text-teal-400/30 ml-1.5 text-[9px] font-normal">{scene.sceneType}</span>
                                  </td>
                                  {storyboard.characters.slice(0, 4).map((char, ci) => {
                                    const firstName = char.name.split(" ")[0].toLowerCase();
                                    const clothingArr = cm.clothingState ?? [];
                                    const entry = clothingArr.find((c: string) => c.toLowerCase().includes(firstName));
                                    return (
                                      <td key={ci} className="px-4 py-3 text-white/45 max-w-[160px] leading-tight text-[10px]">
                                        {entry ?? <span className="text-white/15">—</span>}
                                      </td>
                                    );
                                  })}
                                  <td className="px-4 py-3 text-white/45 text-[10px]">{cm.weatherState ?? <span className="text-white/15">—</span>}</td>
                                  <td className="px-4 py-3 text-white/45 text-[10px]">{cm.timeOfDay ?? <span className="text-white/15">—</span>}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Continuity check badges */}
                    {storyboard.scenes.some(s => s.continuityCheck) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {storyboard.scenes.filter(s => s.continuityCheck).map((scene, i) => {
                          const cc = scene.continuityCheck!;
                          const status = cc.status;
                          const issues = cc.issues ?? [];
                          const colorMap: Record<string, string> = {
                            Pass: "border-emerald-400/15 bg-emerald-950/10 text-emerald-300",
                            Warning: "border-yellow-400/15 bg-yellow-950/10 text-yellow-300",
                            Fail: "border-red-400/15 bg-red-950/10 text-red-300",
                          };
                          const color = colorMap[status] ?? colorMap["Warning"];
                          return (
                            <div key={i} className={`rounded-lg border px-3 py-2.5 space-y-1 ${color}`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-mono opacity-60">Scene {scene.sceneNumber}</span>
                                <span className="text-[8px] font-bold uppercase tracking-wider opacity-70">
                                  {status === "Pass" ? t.continuityPass : status === "Warning" ? t.continuityWarning : t.continuityFail}
                                </span>
                              </div>
                              {issues.slice(0, 2).map((issue: string, ii: number) => (
                                <p key={ii} className="text-[9px] opacity-60 leading-snug">• {issue}</p>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Scenes */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <Clapperboard className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-semibold">{t.scenesTitle}</h3>
                </div>
                <Button
                  size="sm"
                  onClick={handleGenerateAllVideos}
                  disabled={!storyboard || storyboard.scenes.length === 0 || videoQueue.status === "running"}
                  className="bg-gradient-to-r from-cyan-700 to-indigo-600 hover:from-cyan-600 hover:to-indigo-500 text-white border-0 text-xs font-semibold gap-1.5"
                >
                  <Film className="w-3.5 h-3.5" />
                  {t.generateAllVideos}
                </Button>
              </div>
              {/* Batch queue status panel */}
              {videoQueue.status !== "idle" && (
                <div className="rounded-lg bg-cyan-950/20 border border-cyan-400/15 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-cyan-200/70 font-medium">
                      {videoQueue.status === "paused" ? t.batchPaused
                        : videoQueue.status === "cancelled" ? t.batchCancelled
                        : videoQueue.status === "completed" ? t.batchCompleted
                        : t.batchProgress}
                    </span>
                    <span className="text-[9px] text-cyan-400/40 tabular-nums">
                      {videoQueue.completedScenes.length} / {videoQueue.totalScenes}
                    </span>
                  </div>
                  <div className="h-2 bg-cyan-950/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${videoQueue.totalScenes > 0
                          ? (videoQueue.completedScenes.length / videoQueue.totalScenes) * 100
                          : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[9px] text-cyan-400/40">
                    <span>{t.batchComplete}: {videoQueue.completedScenes.length}</span>
                    <span>{t.batchFailed}: {videoQueue.failedScenes.length}</span>
                    <span>{videoQueue.totalScenes - videoQueue.completedScenes.length - videoQueue.failedScenes.length} {t.batchRemaining}</span>
                    <span>{videoQueue.estimatedRemainingTime > 0 ? `~${videoQueue.estimatedRemainingTime}s` : ""}</span>
                  </div>
                  {/* Pause / Resume / Cancel controls */}
                  <div className="flex items-center gap-2 pt-1">
                    {videoQueue.status === "running" && (
                      <button
                        onClick={handlePauseQueue}
                        className="text-[9px] bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300/60 px-2 py-0.5 rounded border border-cyan-400/10 transition-colors"
                      >
                        {t.batchPause}
                      </button>
                    )}
                    {videoQueue.status === "paused" && (
                      <button
                        onClick={handleResumeQueue}
                        className="text-[9px] bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300/60 px-2 py-0.5 rounded border border-cyan-400/10 transition-colors"
                      >
                        {t.batchResume}
                      </button>
                    )}
                    {(videoQueue.status === "running" || videoQueue.status === "paused") && (
                      <button
                        onClick={handleCancelQueue}
                        className="text-[9px] bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300/60 px-2 py-0.5 rounded border border-cyan-400/10 transition-colors"
                      >
                        {t.batchCancel}
                      </button>
                    )}
                    {videoQueue.failedScenes.length > 0 && videoQueue.status === "completed" && (
                      <button
                        onClick={handleRetryFailedScenes}
                        className="text-[9px] bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300/60 px-2 py-0.5 rounded border border-cyan-400/10 transition-colors"
                      >
                        {t.batchRetry}
                      </button>
                    )}
                  </div>
                </div>
              )}
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
                        <p className="text-muted-foreground leading-relaxed">{scene.setting}</p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {[...new Set([
                            ...(scene.characterEmotions ?? []).map(e => e.character),
                            ...(scene.characterActions ?? []).map(a => a.character),
                          ])].map((charName: string, ci: number) => (
                            <Badge key={ci} variant="outline" className="border-accent/30 text-accent/90 bg-accent/5">
                              {charName}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Transition Instructions (non-present scenes) */}
                      {isNonPresent && (scene.transitionIn || scene.returnToPresent) && (
                        <div className={`px-6 py-4 border-b ${cardBorder} space-y-3`}>
                          {scene.transitionIn && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <ArrowLeftRight className={`w-3 h-3 ${meta.color}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color}`}>{t.transitionIn}</span>
                              </div>
                              <p className="text-xs text-foreground/65 leading-relaxed pl-4 border-l border-white/10 italic">
                                {scene.transitionIn}
                              </p>
                            </div>
                          )}
                          {scene.returnToPresent && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <ArrowLeftRight className={`w-3 h-3 ${meta.color} rotate-180`} />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color}`}>{t.returnToPresent}</span>
                              </div>
                              <p className="text-xs text-foreground/65 leading-relaxed pl-4 border-l border-white/10 italic">
                                {scene.returnToPresent}
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
                        const hasThoughts = scene.internalThoughts && scene.internalThoughts.length > 0;
                        const hasMonologue = scene.internalMonologue && scene.internalMonologue.length > 0;
                        const hasActions = scene.characterActions && scene.characterActions.length > 0;
                        const hasEmotions = scene.characterEmotions && scene.characterEmotions.length > 0;
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
                                  <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-500/10">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{t.narratorLabel}</span>
                                    <p className="text-sm text-slate-300/75 italic leading-relaxed">{scene.narration}</p>
                                  </div>
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
                                  {scene.internalThoughts.map((th: InternalThought, ti: number) => (
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
                                  {scene.characterActions.map((ac: CharacterAction, ai: number) => (
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
                                  {scene.characterEmotions.map((em: CharacterEmotion, ei: number) => {
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
                            {scene.shotList.map((shot, si) => (
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

                      {/* ── Scene Image Generator ────────────────────────── */}
                      {scene.sceneImagePrompt && (() => {
                        const sceneNum = scene.sceneNumber;
                        const imgState = imageStates[sceneNum];
                        const hasCharRefs = storyboard.characters && storyboard.characters.length > 0;

                        return (
                          <div className="border-t border-white/5 px-6 py-4 space-y-3">
                            {/* Header row */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Wand2 className="w-3.5 h-3.5 text-fuchsia-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400">{t.generateSceneImage}</span>
                                {hasCharRefs && (
                                  <span className="hidden sm:flex items-center gap-1 text-[8px] text-emerald-400/60 bg-emerald-950/20 border border-emerald-400/15 px-1.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-2.5 h-2.5" />{t.characterRefLocked}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Idle / no image: show provider selector + generate button */}
                            {(!imgState || imgState.status === "idle") && (
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="relative flex-1">
                                  <select
                                    value={selectedProvider}
                                    onChange={(e) => setSelectedProvider(e.target.value as ImageProvider)}
                                    className="w-full appearance-none bg-fuchsia-950/20 border border-fuchsia-400/20 rounded-lg px-3 py-2 text-xs text-fuchsia-200 cursor-pointer hover:border-fuchsia-400/40 focus:outline-none focus:border-fuchsia-400/60 pr-7"
                                  >
                                    {IMAGE_PROVIDERS.map((p) => (
                                      <option key={p.value} value={p.value} className="bg-background text-foreground">
                                        {p.label}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-fuchsia-400/50 pointer-events-none" />
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleGenerateImage(scene)}
                                  className="bg-gradient-to-r from-fuchsia-700 to-fuchsia-500 hover:from-fuchsia-600 hover:to-fuchsia-400 text-white border-0 text-xs font-semibold gap-1.5 shrink-0"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  {t.generateSceneImage}
                                </Button>
                              </div>
                            )}

                            {/* Loading state */}
                            {imgState?.status === "loading" && (
                              <div className="flex items-center gap-3 rounded-lg bg-fuchsia-950/20 border border-fuchsia-400/15 px-4 py-3">
                                <Loader2 className="w-4 h-4 text-fuchsia-400 animate-spin shrink-0" />
                                <span className="text-sm text-fuchsia-200/70">{t.generatingImage}</span>
                              </div>
                            )}

                            {/* Success state: show image */}
                            {imgState?.status === "success" && imgState.imageUrl && (
                              <div className="space-y-2">
                                <div className="relative rounded-xl overflow-hidden border border-fuchsia-400/20 bg-fuchsia-950/10 group">
                                  <img
                                    src={imgState.imageUrl}
                                    alt={`Scene ${sceneNum} generated image`}
                                    className="w-full object-cover max-h-72 rounded-xl"
                                    loading="eager"
                                    onError={(e) => {
                                      const el = e.currentTarget;
                                      el.style.opacity = "0.3";
                                      el.title = "Image failed to load — try regenerating";
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {imgState.imageProvider && (
                                      <Badge className="text-[9px] bg-fuchsia-950/30 text-fuchsia-300/70 border-fuchsia-400/20 gap-1">
                                        <span className="text-fuchsia-500/50">{t.providerLabel}</span> {imgState.imageProvider}
                                      </Badge>
                                    )}
                                    {imgState.generationTime !== undefined && (
                                      <span className="text-[9px] text-fuchsia-400/40">{t.generatedIn} {imgState.generationTime.toFixed(1)}{t.seconds}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="relative">
                                      <select
                                        value={selectedProvider}
                                        onChange={(e) => setSelectedProvider(e.target.value as ImageProvider)}
                                        className="appearance-none bg-fuchsia-950/15 border border-fuchsia-400/15 rounded-md px-2 py-1 text-[10px] text-fuchsia-200/60 cursor-pointer hover:border-fuchsia-400/30 focus:outline-none pr-5"
                                      >
                                        {IMAGE_PROVIDERS.map((p) => (
                                          <option key={p.value} value={p.value} className="bg-background text-foreground">
                                            {p.label}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-fuchsia-400/40 pointer-events-none" />
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleGenerateImage(scene)}
                                      className="h-7 px-2 text-[10px] border-fuchsia-400/20 text-fuchsia-300/60 hover:bg-fuchsia-950/30 hover:text-fuchsia-200 gap-1"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      {t.regenerateImage}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Error state */}
                            {imgState?.status === "error" && (
                              <div className="space-y-2">
                                <div className="flex items-start gap-2 rounded-lg bg-red-950/20 border border-red-400/20 px-3 py-2.5">
                                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[9px] font-bold uppercase tracking-wider text-red-400 mb-0.5">{t.imageGenerationFailed}</div>
                                    <p className="text-xs text-red-200/60 leading-relaxed break-words">{imgState.generationError}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <select
                                      value={selectedProvider}
                                      onChange={(e) => setSelectedProvider(e.target.value as ImageProvider)}
                                      className="w-full appearance-none bg-fuchsia-950/20 border border-fuchsia-400/20 rounded-lg px-3 py-2 text-xs text-fuchsia-200 cursor-pointer hover:border-fuchsia-400/40 focus:outline-none pr-7"
                                    >
                                      {IMAGE_PROVIDERS.map((p) => (
                                        <option key={p.value} value={p.value} className="bg-background text-foreground">
                                          {p.label}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-fuchsia-400/50 pointer-events-none" />
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleGenerateImage(scene)}
                                    className="bg-red-900/40 hover:bg-red-800/50 text-red-200 border border-red-400/20 text-xs font-semibold gap-1.5 shrink-0"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {t.retryGeneration}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* ── Scene Video Generator ────────────────────────── */}
                      {(() => {
                        const sceneNum = scene.sceneNumber;
                        const vidState = videoStates[sceneNum];
                        const hasMotion = !!(scene.cinematicCamera?.cameraMovement);
                        const hasContinuity = !!(scene.continuityMemory);
                        const hasFirstFrame = !!(imageStates[sceneNum]?.imageUrl);

                        return (
                          <div className="border-t border-white/5 px-6 py-4 space-y-3">
                            {/* Header row */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Video className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">{t.generateSceneVideo}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {hasMotion && (
                                  <span className="hidden sm:flex items-center gap-1 text-[8px] text-indigo-400/60 bg-indigo-950/20 border border-indigo-400/15 px-1.5 py-0.5 rounded-full">
                                    <Zap className="w-2.5 h-2.5" />{t.motionDirected}
                                  </span>
                                )}
                                {hasContinuity && (
                                  <span className="hidden sm:flex items-center gap-1 text-[8px] text-emerald-400/60 bg-emerald-950/20 border border-emerald-400/15 px-1.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-2.5 h-2.5" />{t.continuitySynced}
                                  </span>
                                )}
                                {hasFirstFrame && (
                                  <span className="hidden sm:flex items-center gap-1 text-[8px] text-fuchsia-400/60 bg-fuchsia-950/20 border border-fuchsia-400/15 px-1.5 py-0.5 rounded-full">
                                    <ImageIcon className="w-2.5 h-2.5" />first frame
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Idle: show controls */}
                            {(!vidState || vidState.status === "idle") && (
                              <div className="flex flex-col gap-2">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                  <div className="relative flex-1">
                                    <select
                                      value={selectedVideoProvider}
                                      onChange={(e) => setSelectedVideoProvider(e.target.value as VideoProvider)}
                                      className="w-full appearance-none bg-cyan-950/20 border border-cyan-400/20 rounded-lg px-3 py-2 text-xs text-cyan-200 cursor-pointer hover:border-cyan-400/40 focus:outline-none focus:border-cyan-400/60 pr-7"
                                    >
                                      {VIDEO_PROVIDERS.map((p) => (
                                        <option key={p.value} value={p.value} className="bg-background text-foreground">
                                          {p.label}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-cyan-400/50 pointer-events-none" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-cyan-950/15 border border-cyan-400/15 rounded-lg p-0.5">
                                      {([5, 10] as const).map((d) => (
                                        <button
                                          key={d}
                                          onClick={() => setVideoDuration(d)}
                                          className={`px-2.5 py-1 text-xs rounded-md transition-colors font-medium ${videoDuration === d ? "bg-cyan-600 text-white" : "text-cyan-400/60 hover:text-cyan-300"}`}
                                        >
                                          {d}s
                                        </button>
                                      ))}
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => handleGenerateVideo(scene)}
                                      className="bg-gradient-to-r from-cyan-700 to-indigo-600 hover:from-cyan-600 hover:to-indigo-500 text-white border-0 text-xs font-semibold gap-1.5 shrink-0"
                                    >
                                      <Film className="w-3.5 h-3.5" />
                                      {t.generateSceneVideo}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Loading state with progress bar */}
                            {vidState?.status === "loading" && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 rounded-lg bg-cyan-950/20 border border-cyan-400/15 px-4 py-3">
                                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-cyan-200/70 mb-1.5">{t.generatingVideo}</div>
                                    <div className="h-1.5 bg-cyan-950/40 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${vidState.generationProgress ?? 0}%` }}
                                      />
                                    </div>
                                    <div className="text-[9px] text-cyan-400/40 mt-1 tabular-nums">{vidState.generationProgress ?? 0}% — {t.videoProgress}</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Success: video player */}
                            {vidState?.status === "success" && vidState.videoUrl && (
                              <div className="space-y-2">
                                <div className="relative rounded-xl overflow-hidden border border-cyan-400/20 bg-black group">
                                  <video
                                    src={vidState.videoUrl}
                                    controls
                                    autoPlay={false}
                                    loop
                                    className="w-full max-h-72 rounded-xl object-contain bg-black"
                                    playsInline
                                  />
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {vidState.videoProvider && (
                                      <Badge className="text-[9px] bg-cyan-950/30 text-cyan-300/70 border-cyan-400/20 gap-1">
                                        <span className="text-cyan-500/50">{t.providerLabel}</span> {vidState.videoProvider}
                                      </Badge>
                                    )}
                                    {vidState.videoDuration !== undefined && vidState.videoDuration > 0 && (
                                      <span className="text-[9px] text-cyan-400/40">{t.videoDurationLabel}: {vidState.videoDuration}s</span>
                                    )}
                                    {vidState.generationTime !== undefined && (
                                      <span className="text-[9px] text-cyan-400/40">{t.generatedIn} {vidState.generationTime.toFixed(1)}{t.seconds}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="relative">
                                      <select
                                        value={selectedVideoProvider}
                                        onChange={(e) => setSelectedVideoProvider(e.target.value as VideoProvider)}
                                        className="appearance-none bg-cyan-950/15 border border-cyan-400/15 rounded-md px-2 py-1 text-[10px] text-cyan-200/60 cursor-pointer hover:border-cyan-400/30 focus:outline-none pr-5"
                                      >
                                        {VIDEO_PROVIDERS.map((p) => (
                                          <option key={p.value} value={p.value} className="bg-background text-foreground">
                                            {p.label}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-cyan-400/40 pointer-events-none" />
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleGenerateVideo(scene)}
                                      className="h-7 px-2 text-[10px] border-cyan-400/20 text-cyan-300/60 hover:bg-cyan-950/30 hover:text-cyan-200 gap-1"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      {t.retryVideo}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Error state */}
                            {vidState?.status === "error" && (
                              <div className="space-y-2">
                                <div className="flex items-start gap-2 rounded-lg bg-red-950/20 border border-red-400/20 px-3 py-2.5">
                                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[9px] font-bold uppercase tracking-wider text-red-400 mb-0.5">{t.videoGenerationFailed}</div>
                                    <p className="text-xs text-red-200/60 leading-relaxed break-words">{vidState.generationError}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <select
                                      value={selectedVideoProvider}
                                      onChange={(e) => setSelectedVideoProvider(e.target.value as VideoProvider)}
                                      className="w-full appearance-none bg-cyan-950/20 border border-cyan-400/20 rounded-lg px-3 py-2 text-xs text-cyan-200 cursor-pointer hover:border-cyan-400/40 focus:outline-none pr-7"
                                    >
                                      {VIDEO_PROVIDERS.map((p) => (
                                        <option key={p.value} value={p.value} className="bg-background text-foreground">
                                          {p.label}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-cyan-400/50 pointer-events-none" />
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleGenerateVideo(scene)}
                                    className="bg-red-900/40 hover:bg-red-800/50 text-red-200 border border-red-400/20 text-xs font-semibold gap-1.5 shrink-0"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {t.retryVideo}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Image Generation — collapsible, open by default */}
                      {scene.sceneImagePrompt && (() => {
                        const ip: SceneImagePrompt = scene.sceneImagePrompt;
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
                                      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-fuchsia-300/65 bg-fuchsia-950/20 border border-fuchsia-400/12 px-2 py-0.5 rounded-full">
                                          ✦ {ip.visualEffects}
                                        </span>
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
                                    { label: t.lensStyleFrameLabel, value: fm.lensStyleFrame },
                                  ] as { label: string; value: string }[]).map((item, idx) => (
                                    <div key={idx} className="rounded-md bg-rose-950/15 border border-rose-400/10 px-2.5 py-1.5">
                                      <div className="text-[8px] font-bold uppercase tracking-wider text-rose-500/55 mb-0.5">{item.label}</div>
                                      <div className="text-[11px] text-rose-100/70 leading-tight">{item.value}</div>
                                    </div>
                                  ))}
                                </div>
                                {fm.compositionNotes && (
                                  <p className="text-xs text-rose-200/50 italic leading-relaxed pl-3 border-l border-rose-400/15">{fm.compositionNotes}</p>
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
                          {scene.directorNote}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Production Insights Panel */}
            {storyboard.scenes.length > 0 && (
              <motion.div variants={itemVariants} className="space-y-4">
                <button
                  onClick={() => setInsightsPanelOpen(p => !p)}
                  className="w-full flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-6 h-6 text-orange-400" />
                    <h3 className="text-2xl font-semibold">{t.productionInsights}</h3>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-orange-400/50 transition-transform duration-200 ${insightsPanelOpen ? "rotate-180" : ""}`} />
                </button>
                {insightsPanelOpen && (
                  <div className="space-y-5">

                    {/* Scene Pacing / Tension Bar Chart */}
                    {storyboard.scenes.some(s => s.tensionAnalysis?.emotionalIntensity !== undefined) && (
                      <Card className="bg-card/60 backdrop-blur-md border-orange-400/10 overflow-hidden">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">{t.scenePacingLabel}</span>
                          </div>
                          <div className="flex items-end gap-1 h-20">
                            {storyboard.scenes.map((scene, i) => {
                              const intensity = scene.tensionAnalysis?.emotionalIntensity ?? 5;
                              const pct = Math.max(6, Math.min(100, (intensity / 10) * 100));
                              const sceneType = scene.sceneType;
                              const barColor = sceneType === "Flashback" ? "from-amber-600/60 to-amber-400/40" :
                                sceneType === "Dream" ? "from-violet-600/60 to-violet-400/40" :
                                sceneType === "Imagination" ? "from-sky-600/60 to-sky-400/40" :
                                "from-orange-600/60 to-orange-400/40";
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default" title={`Scene ${scene.sceneNumber}: intensity ${intensity}/10${scene.tensionAnalysis?.tensionCurve ? ` — ${scene.tensionAnalysis.tensionCurve}` : ""}`}>
                                  <div className={`w-full rounded-sm bg-gradient-to-t ${barColor} transition-all group-hover:brightness-125`} style={{ height: `${pct}%` }} />
                                  <span className="text-[7px] text-white/25 tabular-nums">{scene.sceneNumber}</span>
                                </div>
                              );
                            })}
                          </div>
                          {(() => {
                            const scores = storyboard.scenes.map(s => s.tensionAnalysis?.emotionalIntensity ?? 0).filter(n => n > 0);
                            if (scores.length === 0) return null;
                            const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
                            const peak = storyboard.scenes.reduce((best, s) =>
                              (s.tensionAnalysis?.emotionalIntensity ?? 0) > (best.tensionAnalysis?.emotionalIntensity ?? 0) ? s : best,
                              storyboard.scenes[0]
                            );
                            return (
                              <div className="flex items-center gap-5 text-[9px] text-orange-400/40 pt-1">
                                <span>{t.avgTension}: <span className="text-orange-300/50">{avg}/10</span></span>
                                <span>{t.peakTension}: <span className="text-orange-300/50">Scene {peak.sceneNumber}</span></span>
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    )}

                    {/* Full Shot List */}
                    {storyboard.scenes.some(s => s.shotList && s.shotList.length > 0) && (
                      <Card className="bg-card/60 backdrop-blur-md border-white/5 overflow-hidden">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <List className="w-3.5 h-3.5 text-sky-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">{t.fullShotList}</span>
                            <span className="text-[9px] text-sky-400/30 tabular-nums">
                              {storyboard.scenes.reduce((n, s) => n + (s.shotList?.length ?? 0), 0)} shots
                            </span>
                          </div>
                          <div className="divide-y divide-white/[0.03]">
                            {storyboard.scenes.flatMap((scene, si) =>
                              (scene.shotList ?? []).map((shot: ShotListItem, shi: number) => (
                                <div key={`${si}-${shi}`} className="flex items-start gap-3 py-2">
                                  <span className="text-[9px] font-mono text-sky-400/35 shrink-0 pt-0.5 w-14">
                                    S{scene.sceneNumber.toString().padStart(2, "0")}.{(shi + 1).toString().padStart(2, "0")}
                                  </span>
                                  <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className="flex flex-wrap gap-1">
                                      {shot.shotNumber && <span className="text-[8px] font-bold text-sky-300/50 font-mono">#{shot.shotNumber}</span>}
                                      {shot.transitionType && <span className="text-[8px] text-sky-300/40 bg-sky-950/15 border border-sky-400/8 px-1.5 py-0.5 rounded">{shot.transitionType}</span>}
                                      {shot.estimatedDuration && <span className="text-[8px] text-sky-300/30 font-mono">{shot.estimatedDuration}</span>}
                                    </div>
                                    {shot.shotDescription && <p className="text-[10px] text-white/35 leading-snug">{shot.shotDescription}</p>}
                                    {shot.shotPurpose && <p className="text-[9px] text-white/20 leading-snug italic">{shot.shotPurpose}</p>}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Transition Plan */}
                    {storyboard.scenes.some(s => s.transitionIn || s.returnToPresent) && (
                      <Card className="bg-card/60 backdrop-blur-md border-white/5 overflow-hidden">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <ArrowLeftRight className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">{t.transitionPlanLabel}</span>
                          </div>
                          <div className="divide-y divide-white/[0.03]">
                            {storyboard.scenes.filter(s => s.transitionIn || s.returnToPresent).map((scene, i) => (
                              <div key={i} className="flex items-start gap-3 py-2">
                                <span className="text-[9px] font-mono text-violet-400/35 shrink-0 pt-0.5 w-10">S{scene.sceneNumber.toString().padStart(2, "0")}</span>
                                <div className="flex-1 space-y-1">
                                  {scene.transitionIn && <p className="text-[10px] text-violet-200/50 leading-snug"><span className="text-violet-400/40 mr-1">↳</span>{scene.transitionIn}</p>}
                                  {scene.returnToPresent && <p className="text-[10px] text-violet-200/35 leading-snug"><span className="text-violet-400/30 mr-1">↵</span>{scene.returnToPresent}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Character Acting Notes */}
                    {storyboard.scenes.some(s => (s.characterActions ?? []).length > 0) && (
                      <Card className="bg-card/60 backdrop-blur-md border-white/5 overflow-hidden">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{t.actingNotesLabel}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {storyboard.scenes.filter(s => (s.characterActions ?? []).length > 0).map((scene, i) => (
                              <div key={i} className="rounded-lg border border-emerald-400/8 bg-emerald-950/8 px-3 py-2.5 space-y-1.5">
                                <span className="text-[9px] font-mono text-emerald-400/40">Scene {scene.sceneNumber}</span>
                                {(scene.characterActions ?? []).map((a: CharacterAction, ai: number) => (
                                  <div key={ai} className="text-[10px] text-white/45 leading-snug">
                                    <span className="text-emerald-300/55 font-semibold">{a.character}:</span> {a.action}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  </div>
                )}
              </motion.div>
            )}

            {/* Production Readiness Score + Movie Readiness Report */}
            {(storyboard.productionScore !== undefined || storyboard.movieReadinessReport) && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-2xl font-semibold">{t.movieReport}</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Score card */}
                  {storyboard.productionScore !== undefined && (
                    <Card className="bg-card/60 backdrop-blur-md border-yellow-400/15 overflow-hidden flex flex-col items-center justify-center p-8 text-center">
                      <div className="mb-3">
                        <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/70">{t.productionScore}</div>
                      </div>
                      <div className="flex items-end gap-1">
                        <span className="text-7xl font-black text-yellow-300 tabular-nums leading-none">{storyboard.productionScore}</span>
                        <span className="text-2xl font-bold text-yellow-400/50 mb-2">{t.outOf100}</span>
                      </div>
                      <div className="w-full mt-4 h-2 rounded-full bg-yellow-950/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300"
                          style={{ width: `${storyboard.productionScore}%` }}
                        />
                      </div>
                      <div className="mt-3 text-xs text-yellow-400/50">
                        {storyboard.productionScore >= 90 ? "Festival Ready" :
                          storyboard.productionScore >= 70 ? "Solid Draft" :
                          storyboard.productionScore >= 50 ? "Promising" : "Needs Development"}
                      </div>
                    </Card>
                  )}

                  {/* Report detail */}
                  {storyboard.movieReadinessReport && (
                    <div className={`${storyboard.productionScore !== undefined ? "lg:col-span-2" : "lg:col-span-3"} space-y-4`}>
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
            {storyboard.scenes[0]?.exportReadiness && (
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Film className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-2xl font-semibold">{t.exportReadiness}</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(() => {
                    const er = storyboard.scenes[0]?.exportReadiness;
                    if (!er) return null;
                    return ([
                      { label: t.screenplayReady, value: er.screenplayReady },
                      { label: t.storyboardReady, value: er.storyboardReady },
                      { label: t.animationReady, value: er.animationPipelineReady },
                      { label: t.voicePipelineReady, value: er.voicePipelineReady },
                      { label: t.editingReady, value: er.editingPipelineReady },
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
                  ));
                  })()}
                </div>
              </motion.div>
            )}

            {/* Movie Export */}
            {storyboard.scenes.length > 0 && (
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Film className="w-6 h-6 text-rose-400" />
                  <h3 className="text-2xl font-semibold">{t.movieExport}</h3>
                </div>
                <Card className="bg-card/60 backdrop-blur-md border-white/5 overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                    <p className="text-sm text-white/50">{t.movieExportDesc}</p>

                    {/* Format Select */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t.movieExportFormat}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {([
                          { value: "mp4" as const, label: "MP4" },
                          { value: "vertical_shorts" as const, label: "Shorts" },
                          { value: "youtube" as const, label: "YouTube" },
                          { value: "tiktok" as const, label: "TikTok" },
                          { value: "cinematic_widescreen" as const, label: "Cinema" },
                        ] as { value: MovieExportFormat; label: string }[]).map((fmt) => (
                          <button
                            key={fmt.value}
                            onClick={() => setMovieExportFormat(fmt.value)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                              movieExportFormat === fmt.value
                                ? "bg-rose-400/20 text-rose-300 border-rose-400/30"
                                : "bg-white/5 text-white/50 border-white/5 hover:bg-white/10"
                            }`}
                          >
                            {fmt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Audio / Subtitle Toggles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: t.movieExportSubtitle, value: movieExportSubtitle, set: setMovieExportSubtitle },
                        { label: t.movieExportMusic, value: movieExportMusic, set: setMovieExportMusic },
                        { label: t.movieExportVoice, value: movieExportVoice, set: setMovieExportVoice },
                        { label: t.movieExportEffects, value: movieExportEffects, set: setMovieExportEffects },
                      ].map((toggle) => (
                        <button
                          key={toggle.label}
                          onClick={() => toggle.set(!toggle.value)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                            toggle.value
                              ? "bg-amber-400/15 text-amber-300 border-amber-400/25"
                              : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${toggle.value ? "bg-amber-400 border-amber-400" : "border-white/30"}`}>
                            {toggle.value && <CheckCircle2 className="w-3 h-3 text-black" />}
                          </span>
                          {toggle.label}
                        </button>
                      ))}
                    </div>

                    {/* Export Button / Progress */}
                    <div className="flex items-center gap-3">
                      {movieExportState?.status === "processing" ? (
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-amber-300">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t.movieExportProgress}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${movieExportState.progress}%` }} />
                          </div>
                        </div>
                      ) : movieExportState?.status === "completed" ? (
                        <div className="flex-1 flex items-center gap-3">
                          <div className="flex items-center gap-2 text-sm text-emerald-300">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{t.movieExportComplete}</span>
                          </div>
                          {movieExportState.exportUrl && (
                            <a
                              href={movieExportState.exportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/25 hover:bg-emerald-400/30 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {t.movieExportDownload}
                            </a>
                          )}
                        </div>
                      ) : movieExportState?.status === "failed" ? (
                        <div className="flex-1 flex items-center gap-2 text-sm text-red-300">
                          <XCircle className="w-4 h-4" />
                          <span>{t.movieExportFailed}</span>
                          <span className="text-xs text-red-300/50">{movieExportState.exportError}</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleMovieExport}
                          disabled={createMovieExportMutation.isPending}
                          className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-400/20 text-rose-300 border border-rose-400/30 hover:bg-rose-400/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {createMovieExportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                          {t.movieExport}
                        </button>
                      )}
                    </div>

                    {/* Client-side Data Exports */}
                    {storyboard && (
                      <div className="space-y-2 pt-3 border-t border-white/5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">{t.clientExportsLabel}</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => downloadJSON(storyboard)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-400/10 text-sky-300/80 border border-sky-400/15 hover:bg-sky-400/20 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {t.exportJSON}
                          </button>
                          <button
                            onClick={() => downloadPromptPack(storyboard)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-400/10 text-violet-300/80 border border-violet-400/15 hover:bg-violet-400/20 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {t.exportPromptPack}
                          </button>
                          <button
                            onClick={() => downloadCSV(storyboard)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-400/10 text-emerald-300/80 border border-emerald-400/15 hover:bg-emerald-400/20 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {t.exportCSV}
                          </button>
                          <button
                            onClick={() => downloadProductionPkg(storyboard)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400/10 text-amber-300/80 border border-amber-400/15 hover:bg-amber-400/20 transition-colors"
                          >
                            <Package className="w-3.5 h-3.5" />
                            {t.exportProductionPkg}
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Visual Production Report */}
            {storyboard.visualProductionReport && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-fuchsia-400" />
                  <h3 className="text-2xl font-semibold">{t.visualProductionReportLabel}</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Visual Production Report detail */}
                  {storyboard.visualProductionReport && (() => {
                    const vpr = storyboard.visualProductionReport;
                    const scores = storyboard.scenes.map(s => s.sceneImagePrompt?.imageGenerationScore ?? 0).filter(n => n > 0);
                    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : undefined;
                    return (
                      <>
                      {avgScore !== undefined && (
                        <Card className="bg-card/60 backdrop-blur-md border-fuchsia-400/15 overflow-hidden flex flex-col items-center justify-center p-8 text-center">
                          <div className="mb-3">
                            <Camera className="w-8 h-8 text-fuchsia-400 mx-auto mb-2" />
                            <div className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400/70">{t.imageGenScoreLabel}</div>
                          </div>
                          <div className="flex items-end gap-1">
                            <span className="text-7xl font-black text-fuchsia-300 tabular-nums leading-none">{avgScore}</span>
                            <span className="text-2xl font-bold text-fuchsia-400/50 mb-2">{t.outOf100}</span>
                          </div>
                          <div className="w-full mt-4 h-2 rounded-full bg-fuchsia-950/40 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-300" style={{ width: `${avgScore}%` }} />
                          </div>
                          <div className="mt-3 text-xs text-fuchsia-400/50">
                            {avgScore >= 90 ? "Paste-Ready" : avgScore >= 70 ? "Minor Gaps" : avgScore >= 50 ? "Moderate" : "Needs Refinement"}
                          </div>
                        </Card>
                      )}
                      <div className={`${avgScore !== undefined ? "lg:col-span-2" : "lg:col-span-3"} space-y-4`}>
                        <Card className="bg-card/60 backdrop-blur-md border-white/5 overflow-hidden">
                          <CardContent className="p-5 space-y-5">
                            {vpr.strongestVisualScenes && vpr.strongestVisualScenes.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Star className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{t.strongestScenesLabel}</span>
                                </div>
                                <ul className="space-y-1 pl-5">
                                  {vpr.strongestVisualScenes.map((s: number, si: number) => (
                                    <li key={si} className="text-sm text-emerald-200/65 list-disc leading-relaxed">Scene {s}</li>
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
                                  {vpr.weakestVisualScenes.map((w: number, wi: number) => (
                                    <li key={wi} className="text-sm text-yellow-200/65 list-disc leading-relaxed">Scene {w}</li>
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
                            {vpr.animationComplexity && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{t.animationComplexityLabel}</span>
                                </div>
                                <p className="text-sm text-indigo-200/65 pl-4 border-l border-indigo-400/15 leading-relaxed">{vpr.animationComplexity}</p>
                              </div>
                            )}
                            {vpr.renderingDifficulty && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-3.5 h-3.5 text-red-400" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">{t.renderingDifficultyLabel}</span>
                                </div>
                                <p className="text-sm text-red-200/65 pl-4 border-l border-red-400/15 leading-relaxed">{vpr.renderingDifficulty}</p>
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
                      </>
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
