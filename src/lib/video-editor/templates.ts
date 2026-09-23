import {
  AudioMixerTrackConfig,
  CANVAS_PRESETS,
  CanvasRatio,
  GraphicOverlayItem,
  VideoClipItem,
  VideoProject,
  VideoTemplate,
  VideoTemplateId,
} from "@/types/video-studio";

export const VIDEO_TEMPLATES: Record<VideoTemplateId, VideoTemplate> = {
  "breaking-news": {
    templateId: "breaking-news",
    nameMarathi: "तातडीचे वृत्त (Breaking News)",
    nameEnglish: "Breaking News",
    description: "ठळक लाल ब्रेकिंग बॅनर, वेगाने धावणारा न्यूज टिकर, मुख्य व्हिडिओ व लोकेशन टॅग.",
    canvasRatio: "16:9",
    defaultDurationSeconds: 45,
    badge: "ब्रेकिंग न्यूज",
  },
  "ground-report": {
    templateId: "ground-report",
    nameMarathi: "थेट ग्राउंड रिपोर्ट (Ground Report)",
    nameEnglish: "Ground Report",
    description: "वार्ताहर लोअर थर्ड, प्रत्यक्ष घटनास्थळ व्हॉईसओव्हर, बी-रोल दृश्ये व लोगो वॉटरमार्क.",
    canvasRatio: "16:9",
    defaultDurationSeconds: 60,
    badge: "थेट वार्तांकन",
  },
  "reporter-package": {
    templateId: "reporter-package",
    nameMarathi: "विशेष वृत्त पॅकेज (Reporter Package)",
    nameEnglish: "Reporter Package",
    description: "सविस्तर मथळा कार्ड, विश्लेषणात्मक व्हॉईसओव्हर, पार्श्वभूमी संगीत व सबटायटल्स.",
    canvasRatio: "16:9",
    defaultDurationSeconds: 90,
    badge: "विशेष वृत्तांत",
  },
  "local-news": {
    templateId: "local-news",
    nameMarathi: "स्थानिक घडामोडी (Local News)",
    nameEnglish: "Local News",
    description: "तालुका व गावनिहाय बातम्या, संक्षिप्त टिकर आणि स्वच्छ प्रादेशिक ग्राफिक लेआउट.",
    canvasRatio: "16:9",
    defaultDurationSeconds: 60,
    badge: "तालुका विशेष",
  },
  "event-coverage": {
    templateId: "event-coverage",
    nameMarathi: "कार्यक्रम व सभा कव्हरेज (Event Coverage)",
    nameEnglish: "Event Coverage",
    description: "सभा, मेळावे व उत्सवांचे चित्रीकरण, पार्श्वसंगीत ऑटो-डकिंग आणि कोट्स कार्ड.",
    canvasRatio: "16:9",
    defaultDurationSeconds: 75,
    badge: "थेट कव्हरेज",
  },
  interview: {
    templateId: "interview",
    nameMarathi: "मुलाखत विशेष (Interview Special)",
    nameEnglish: "Interview Special",
    description: "मुलाखतकार व पाहुण्यांचे स्वतंत्र लोअर थर्ड, प्रश्न कार्ड आणि शांत पार्श्वभूमी.",
    canvasRatio: "16:9",
    defaultDurationSeconds: 120,
    badge: "मुलाखत",
  },
  "photo-news": {
    templateId: "photo-news",
    nameMarathi: "छायाचित्र बुलेटिन (Photo News Slideshow)",
    nameEnglish: "Photo News",
    description: "महत्त्वाच्या छायाचित्रांची आकर्षक मालिका, पॅन-झूम इफेक्ट आणि व्हॉईसओव्हर.",
    canvasRatio: "16:9",
    defaultDurationSeconds: 45,
    badge: "फोटो स्टोरी",
  },
  exclusive: {
    templateId: "exclusive",
    nameMarathi: "एक्सक्लुझिव्ह बातमी (Exclusive Bulletin)",
    nameEnglish: "Exclusive",
    description: "सुवर्ण-लाल एक्सक्लुझिव्ह बॅज, ठळक फॉन्ट आणि सत्यशोधक इन्व्हेस्टिगेटिव्ह ग्राफिक.",
    canvasRatio: "16:9",
    defaultDurationSeconds: 60,
    badge: "एक्सक्लुझिव्ह",
  },
  "live-news": {
    templateId: "live-news",
    nameMarathi: "थेट प्रक्षेपण बुलेटिन (Live Broadcast)",
    nameEnglish: "Live Broadcast",
    description: "लाईव्ह बग, वेळ व तारीख पट्टा, अखंड स्क्रोलिंग टिकर आणि टीव्ही वृत्त चॅनेल लुक.",
    canvasRatio: "16:9",
    defaultDurationSeconds: 60,
    badge: "थेट प्रक्षेपण",
  },
  "shorts-reel": {
    templateId: "shorts-reel",
    nameMarathi: "मोबाईल रील व शॉर्ट्स (Shorts / Reels 9:16)",
    nameEnglish: "Shorts / Reel (9:16)",
    description: "९:१६ उभ्या स्क्रीनसाठी अनुकूलित, मध्यवर्ती मथळा, ऑटो-कॅप्शन आणि गतिमान टिकर.",
    canvasRatio: "9:16",
    defaultDurationSeconds: 30,
    badge: "रील्स / शॉर्ट्स",
  },
};

export const DEFAULT_AUDIO_MIXER: AudioMixerTrackConfig[] = [
  { trackId: "A1", label: "मुख्य आवाज (Main Audio)", volume: 100, mute: false, solo: false, duckingEnabled: false, duckingAmountPercent: 0 },
  { trackId: "A2", label: "ElevenLabs AI व्हॉईस", volume: 100, mute: false, solo: false, duckingEnabled: false, duckingAmountPercent: 0 },
  { trackId: "A3", label: "रिपोर्टर रेकॉर्डिंग (Mic)", volume: 100, mute: false, solo: false, duckingEnabled: false, duckingAmountPercent: 0 },
  { trackId: "A4", label: "पार्श्वसंगीत (Music)", volume: 30, mute: false, solo: false, duckingEnabled: true, duckingAmountPercent: 15 },
];

/**
 * Creates a clean default project initialized with template graphics, canvas, and tracks
 */
export function createProjectFromTemplate(
  templateId: VideoTemplateId,
  title?: string,
  articleMeta?: {
    headline?: string;
    location?: string;
    reporterName?: string;
    articleId?: string;
    imageUrl?: string;
  }
): VideoProject {
  const template = VIDEO_TEMPLATES[templateId] || VIDEO_TEMPLATES["ground-report"];
  const canvas = CANVAS_PRESETS[template.canvasRatio] || CANVAS_PRESETS["16:9"];

  const projectId = `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const projectTitle = title || `आवाज जामखेडचा - ${template.nameMarathi}`;
  const totalDuration = template.defaultDurationSeconds;

  const graphics: GraphicOverlayItem[] = [];
  let gId = 1;

  // 1. Logo Bug / Watermark (Always V4 top-right)
  graphics.push({
    id: `${projectId}_g_${gId++}`,
    trackId: "V4",
    type: "logo-watermark",
    title: "आवाज जामखेडचा",
    subtitle: "डिजिटल न्यूजरूम",
    startTime: 0,
    duration: totalDuration,
    fontKey: "tiro-press",
    fontSize: 16,
    fontWeight: "black",
    textColor: "#FFFFFF",
    bgColor: "rgba(153, 27, 27, 0.9)",
    accentColor: "#FBBF24",
    positionX: 85,
    positionY: 8,
    animation: "fade",
    opacity: 0.95,
    scale: 1,
  });

  // 2. Running News Ticker (V3 bottom)
  graphics.push({
    id: `${projectId}_g_${gId++}`,
    trackId: "V3",
    type: "running-ticker",
    title: articleMeta?.headline
      ? `🔴 ब्रेकिंग | ${articleMeta.headline} • आवाज जामखेडचा थेट वार्तांकन`
      : "🔴 आवाज जामखेडचा • जामखेड आणि अहिल्यानगर परिसरातील ताज्या व विश्वासार्ह बातम्या • थेट ग्राऊंड रिपोर्ट",
    startTime: 0,
    duration: totalDuration,
    tickerSpeed: "normal",
    fontKey: "noto-sans",
    fontSize: 18,
    fontWeight: "bold",
    textColor: "#FFFFFF",
    bgColor: "#991B1B",
    accentColor: "#FBBF24",
    positionX: 0,
    positionY: 92,
    animation: "ticker-scroll",
    opacity: 1,
    scale: 1,
  });

  // 3. Location Tag
  const loc = articleMeta?.location || "जामखेड";
  graphics.push({
    id: `${projectId}_g_${gId++}`,
    trackId: "V3",
    type: "location-tag",
    title: `📍 ${loc}`,
    startTime: 2,
    duration: 12,
    fontKey: "mukta",
    fontSize: 16,
    fontWeight: "bold",
    textColor: "#FFFFFF",
    bgColor: "#111827",
    accentColor: "#EF4444",
    positionX: 5,
    positionY: 10,
    animation: "slide-down",
    opacity: 0.95,
    scale: 1,
  });

  // 4. Lower Third (Reporter / Main Headline)
  if (templateId === "breaking-news") {
    graphics.push({
      id: `${projectId}_g_${gId++}`,
      trackId: "V3",
      type: "breaking-bar",
      title: articleMeta?.headline || "जामखेड शहरात आज मोठी घटना; प्रशासनाकडून दखल",
      subtitle: "थेट वृत्त • सविस्तर माहिती",
      startTime: 1,
      duration: 25,
      fontKey: "tiro-press",
      fontSize: 24,
      fontWeight: "black",
      textColor: "#FFFFFF",
      bgColor: "#991B1B",
      accentColor: "#FBBF24",
      positionX: 5,
      positionY: 78,
      animation: "slide-up",
      opacity: 1,
      scale: 1,
    });
  } else {
    graphics.push({
      id: `${projectId}_g_${gId++}`,
      trackId: "V3",
      type: "lower-third",
      title: articleMeta?.reporterName || "नासिर पठाण",
      subtitle: `विशेष बातमीदार, ${loc}`,
      startTime: 3,
      duration: 10,
      fontKey: "tiro-press",
      fontSize: 22,
      fontWeight: "black",
      textColor: "#FFFFFF",
      bgColor: "rgba(17, 24, 39, 0.92)",
      accentColor: "#991B1B",
      positionX: 5,
      positionY: 78,
      animation: "reveal",
      opacity: 1,
      scale: 1,
    });
  }

  // 5. Initial video clips (or image slide if image provided)
  const videoClips: VideoClipItem[] = [];
  if (articleMeta?.imageUrl) {
    videoClips.push({
      id: `${projectId}_clip_1`,
      trackId: "V1",
      assetUrl: articleMeta.imageUrl,
      title: articleMeta.headline || "मुख्य छायाचित्र दृश्य",
      startTime: 0,
      duration: Math.min(15, totalDuration),
      sourceIn: 0,
      sourceOut: Math.min(15, totalDuration),
      speed: 1,
      volume: 0,
      mute: true,
      opacity: 1,
      scale: 1,
      positionX: 0,
      positionY: 0,
      rotation: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      mediaType: "image",
    });
  }

  return {
    id: projectId,
    title: projectTitle,
    description: template.description,
    canvasRatio: template.canvasRatio,
    width: canvas.width,
    height: canvas.height,
    fps: 30,
    duration: totalDuration,
    videoClips,
    graphics,
    audioClips: [],
    audioMixer: DEFAULT_AUDIO_MIXER,
    articleId: articleMeta?.articleId,
    status: "DRAFT",
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
