import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, createElderResource, getCurrentElderId, sendVoice, sendVoiceText } from "../services/api";
import useVoiceRecorder from "./useVoiceRecorder";

const browserFallbackEnabled = import.meta.env.VITE_ENABLE_BROWSER_FALLBACK !== "false";

const localIntent = (text, language = "hi-IN") => {
  const q = text.toLowerCase();
  const english = language.toLowerCase().startsWith("en");
  if ((q.includes("nahi") || q.includes("nahin") || q.includes("नहीं") || q.includes(" not ")) && ["dard", "pain", "chakkar", "bukhar", "दर्द", "चक्कर"].some((term) => q.includes(term))) {
    return { intent: "general", type: "none", path: "", reply: "Theek hai, aap keh rahe hain ki abhi dard ya takleef nahi hai." };
  }
  const routes = [
    { terms: ["madad", "help", "bachao", "gir gayi", "gir gaya", "emergency", "मदद", "बचाओ", "गिर गई"], intent: "emergency", type: "emergency", path: "/elderly/emergency", reply: "Main madad khol rahi hoon. Kripya shaant rahiye aur apne parivaar ke paas rahiye." },
    { terms: ["ruk jao", "ruko", "band karo", "pause", "stop the music", "रुक जाओ", "रुको", "बंद करो"], intent: "pause", type: "pause", path: "/elderly/bhajan", reply: "Bhajan rok rahi hoon." },
    { terms: ["dawai", "dawa", "medicine", "tablet", "goli", "दवाई", "दवा", "गोली"], intent: "medicine", type: "navigate", path: "/elderly/medicine", reply: "Aapki dawai ki jaankari khol rahi hoon." },
    { terms: ["beti", "beta", "parivaar", "family", "phone kar", "call kar", "yaad aa rahi", "परिवार", "बेटी"], intent: "family", type: "navigate", path: "/elderly/family", reply: "Aapke parivaar ki jaankari khol rahi hoon." },
    { terms: ["bhajan", "aarti", "chalisa", "kirtan", "भजन", "आरती"], intent: "bhajan", type: "play", path: "/elderly/bhajan", reply: "Aapke bhajan khol rahi hoon." },
    { terms: ["dard", "chakkar", "bukhar", "pain", "दर्द", "चक्कर"], intent: "symptom", type: "navigate", path: "/elderly/medicine", reply: "Mujhe afsos hai ki aapko takleef hai. Kripya apne parivaar ya doctor se bhi baat karein." },
    { terms: ["akela", "akeli", "udaas", "dukhi", "lonely", "अकेला", "उदास"], intent: "loneliness", type: "none", path: "", reply: "Main aapki baat sun rahi hoon. Kya aap kisi apne ko phone karna chahenge?" },
  ];
  const found = routes.find((route) => route.terms.some((word) => q.includes(word)));
  return found ?? { intent: "general", type: "none", path: "", reply: english ? "I’m listening. Tell me a little more about what you mean." : "Main sun rahi hoon. Aap jo keh rahe hain, uske baare mein thoda aur bataiye." };
};

export default function useVoiceChat(language = "hi-IN") {
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const replyAudioRef = useRef(null);
  const replyAudioUrlRef = useRef(null);
  const playbackTimerRef = useRef(null);
  const captureModeRef = useRef(null);
  const processedAudioRef = useRef(null);
  const pressActiveRef = useRef(false);
  const { audioBlob, start: startRecording, stop: stopRecording, cancel: cancelRecording } = useVoiceRecorder();
  const [state, setState] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [limitedMode, setLimitedMode] = useState(false);
  const [fallbackReason, setFallbackReason] = useState("");

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    replyAudioRef.current?.pause?.();
    if (replyAudioUrlRef.current) URL.revokeObjectURL(replyAudioUrlRef.current);
    if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback((message, lang = language, onEnd = () => {}) => {
    if (!("speechSynthesis" in window)) { window.setTimeout(onEnd, 100); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const presentResult = useCallback((result) => {
    replyAudioRef.current?.pause?.();
    if (replyAudioUrlRef.current) URL.revokeObjectURL(replyAudioUrlRef.current);
    replyAudioRef.current = null;
    replyAudioUrlRef.current = null;
    if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
    const message = typeof result.assistant_text === "string" ? result.assistant_text : "Main sun rahi hoon. Kripya phir se boliye.";
    setResponse(message);
    sessionStorage.setItem("smritivani.last_spoken_response", message);
    sessionStorage.setItem("smritivani.voice_intent", result.intent?.intent || "general");
    if (result.assistant_audio_base64 && result.audio_mime) {
      sessionStorage.setItem("smritivani.last_spoken_audio", result.assistant_audio_base64);
      sessionStorage.setItem("smritivani.last_spoken_audio_mime", result.audio_mime);
    } else {
      sessionStorage.removeItem("smritivani.last_spoken_audio");
      sessionStorage.removeItem("smritivani.last_spoken_audio_mime");
    }
    setState("speaking");
    const action = result.action ?? {};
    let actionHandled = false;
    const finish = () => {
      if (actionHandled) return;
      actionHandled = true;
      if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
      replyAudioRef.current?.pause?.();
      replyAudioRef.current = null;
      if (replyAudioUrlRef.current) URL.revokeObjectURL(replyAudioUrlRef.current);
      replyAudioUrlRef.current = null;
      if (action.type === "emergency") navigate("/elderly/emergency");
      else if (action.type === "navigate" && typeof action.target === "string") navigate(action.target, { state: { fromVoice: true } });
      else if (action.type === "pause") navigate("/elderly/bhajan", { state: { autoplay: false, fromVoice: true } });
      else if (action.type === "play") navigate("/elderly/bhajan", { state: { autoplay: true, fromVoice: true } });
      else setState("idle");
    };
    const speakFallback = () => speak(message, language, finish);
    const encodedAudio = result.assistant_audio_base64;
    if (typeof encodedAudio === "string" && result.audio_mime) {
      try {
        const binary = window.atob(encodedAudio);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        const audioUrl = URL.createObjectURL(new Blob([bytes], { type: result.audio_mime }));
        const audio = new Audio(audioUrl);
        replyAudioUrlRef.current = audioUrl;
        replyAudioRef.current = audio;
        audio.onended = finish;
        audio.onerror = speakFallback;
        void audio.play().catch(speakFallback);
      } catch {
        speakFallback();
      }
    } else {
      speakFallback();
    }
    playbackTimerRef.current = window.setTimeout(finish, 30000);
  }, [language, navigate, speak]);

  const processText = useCallback(async (text) => {
    const cleaned = text.trim();
    if (!cleaned) { setState("idle"); return; }
    setTranscript(cleaned); setState("processing"); setError("");
    let result;
    try {
      result = await sendVoiceText(cleaned, language);
      setLimitedMode(Boolean(result.degraded_mode));
      setFallbackReason(getFallbackReason(result));
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        setState("error"); setError("This device needs to be paired again. Please enter the code from your caregiver."); return;
      }
      const intent = localIntent(cleaned, language);
      result = { transcript: cleaned, intent: { intent: intent.intent }, assistant_text: intent.reply, action: { type: intent.type, target: intent.path }, degraded_mode: true };
      setLimitedMode(true);
      setFallbackReason("The backend could not be reached, so this is a brief on-device reply.");
      if (intent.type === "emergency") {
        try { await createElderResource(getCurrentElderId() ?? "", "alerts", { type: "distress", transcript: cleaned.slice(0, 12000) }); }
        catch { setError("I heard an emergency phrase, but could not save an alert. Please use the phone button to call a saved contact."); }
      }
    }
    presentResult(result);
  }, [language, presentResult]);

  const processAudio = useCallback(async (audio) => {
    setState("processing"); setError(""); setLimitedMode(false);
    try {
      const result = await sendVoice(audio, language);
      const recognized = typeof result.transcript === "string" ? result.transcript.trim() : "";
      if (!recognized) throw new Error("No speech was detected. Please speak closer to the microphone and try again.");
      setTranscript(recognized);
      setLimitedMode(Boolean(result.degraded_mode));
      setFallbackReason(getFallbackReason(result));
      presentResult(result);
    } catch (requestError) {
      setState("error");
      if (requestError instanceof ApiError && requestError.status === 401) {
        setError("This device needs to be paired again. Please enter the code from your caregiver.");
      } else {
        setError(requestError instanceof Error ? requestError.message : "Audio transcription failed. Please try again.");
      }
    }
  }, [language, presentResult]);

  useEffect(() => {
    if (!audioBlob || processedAudioRef.current === audioBlob) return;
    processedAudioRef.current = audioBlob;
    void processAudio(audioBlob);
  }, [audioBlob, processAudio]);

  const start = useCallback(async () => {
    if (pressActiveRef.current) return;
    pressActiveRef.current = true;
    captureModeRef.current = null;
    setError(""); setResponse(""); setTranscript(""); setLimitedMode(false); setFallbackReason("");
    if (navigator.mediaDevices?.getUserMedia && window.MediaRecorder) {
      const started = await startRecording();
      if (started) {
        if (!pressActiveRef.current) { cancelRecording(); return; }
        captureModeRef.current = "media"; setState("recording"); return;
      }
    }
    if (!pressActiveRef.current) return;
    if (!browserFallbackEnabled) { setError("Microphone recording is unavailable. Please allow microphone access and try again."); setState("error"); return; }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setError("Microphone recording is unavailable in this browser. Please open this page in Chrome or Edge."); setState("error"); return; }
    const recognition = new Recognition();
    captureModeRef.current = "browser";
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setState("recording");
    recognition.onresult = (event) => {
      const finalResult = Array.from(event.results).find((item) => item.isFinal);
      if (finalResult) void processText(finalResult[0]?.transcript ?? "");
      else setTranscript(Array.from(event.results).map((item) => item[0]?.transcript ?? "").join(" ").trim());
    };
    recognition.onerror = (event) => { setState("error"); setError(event.error === "not-allowed" ? "Please allow microphone access in your browser settings, then try again." : "I couldn’t hear that clearly. Please try speaking again."); };
    recognition.onend = () => setState((current) => current === "recording" ? "idle" : current);
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { setState("error"); setError("The microphone is busy. Please try again in a moment."); }
  }, [cancelRecording, language, processText, startRecording]);

  const stop = useCallback(() => {
    pressActiveRef.current = false;
    const captureMode = captureModeRef.current;
    captureModeRef.current = null;
    if (captureMode === "media") {
      stopRecording(); setState("processing"); return;
    }
    recognitionRef.current?.stop?.();
    setState("idle");
  }, [stopRecording]);

  return { state, transcript, response, error, limitedMode, fallbackReason, start, stop, speak };
}

function getFallbackReason(result) {
  if (result?.providers_used?.llm === "local_rules" && result?.emergency?.is_emergency !== true) {
    return "Conversational AI was not used for this reply; this is a short local fallback.";
  }
  if (result?.providers_used?.tts && result.providers_used.tts !== "gnani") {
    return "Gnani speech is unavailable; playing the reply with browser speech.";
  }
  return "";
}
