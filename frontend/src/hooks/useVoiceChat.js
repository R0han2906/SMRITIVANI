import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, createElderResource, getCurrentElderId, sendVoiceText } from "../services/api";
const browserFallbackEnabled = import.meta.env.VITE_ENABLE_BROWSER_FALLBACK !== "false";

const localIntent = (text) => {
  const q = text.toLowerCase();
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
  return found ?? { intent: "general", type: "none", path: "", reply: `Maine suna: ${text}. Aap dawai, parivaar, bhajan ya madad ke baare mein bol sakte hain.` };
};

export default function useVoiceChat(language = "hi-IN") {
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const [state, setState] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [limitedMode, setLimitedMode] = useState(false);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
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

  const processText = useCallback(async (text) => {
    const cleaned = text.trim();
    if (!cleaned) { setState("idle"); return; }
    setTranscript(cleaned); setState("processing"); setError("");
    let result;
    try {
      result = await sendVoiceText(cleaned, language);
      setLimitedMode(Boolean(result.degraded_mode));
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        setState("error"); setError("This device needs to be paired again. Please enter the code from your caregiver."); return;
      }
      const intent = localIntent(cleaned);
      result = { transcript: cleaned, intent: { intent: intent.intent }, assistant_text: intent.reply, action: { type: intent.type, target: intent.path }, degraded_mode: true };
      setLimitedMode(true);
      if (intent.type === "emergency") {
        try { await createElderResource(getCurrentElderId() ?? "", "alerts", { type: "distress", transcript: cleaned.slice(0, 12000) }); }
        catch { setError("I heard an emergency phrase, but could not save an alert. Please use the phone button to call a saved contact."); }
      }
    }
    const message = typeof result.assistant_text === "string" ? result.assistant_text : "Main sun rahi hoon. Kripya phir se boliye.";
    setResponse(message);
    sessionStorage.setItem("smritivani.last_spoken_response", message);
    sessionStorage.setItem("smritivani.voice_intent", result.intent?.intent || "general");
    setState("speaking");
    const action = result.action ?? {};
    let actionHandled = false;
    const finish = () => {
      if (actionHandled) return;
      actionHandled = true;
      if (action.type === "emergency") navigate("/elderly/emergency");
      else if (action.type === "navigate" && typeof action.target === "string") navigate(action.target, { state: { fromVoice: true } });
      else if (action.type === "pause") navigate("/elderly/bhajan", { state: { autoplay: false, fromVoice: true } });
      else if (action.type === "play") navigate("/elderly/bhajan", { state: { autoplay: true, fromVoice: true } });
      else setState("idle");
    };
    speak(message, language, finish);
    window.setTimeout(finish, 10000);
  }, [language, navigate, speak]);

  const start = useCallback(() => {
    setError(""); setResponse(""); setTranscript(""); setLimitedMode(false);
    if (!browserFallbackEnabled) { setError("Voice recognition is turned off for this app. Please use the large care buttons below."); setState("error"); return; }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setError("Voice recognition is not available in this browser. Please open this page in Chrome or Edge."); setState("error"); return; }
    const recognition = new Recognition();
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
  }, [language, processText]);

  const stop = useCallback(() => { recognitionRef.current?.stop?.(); setState("idle"); }, []);
  return { state, transcript, response, error, limitedMode, start, stop, speak };
}
