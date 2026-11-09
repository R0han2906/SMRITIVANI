/**
 * Hook to add voice routing awareness to elderly screens.
 * Screens can listen for voice intents and auto-navigate or trigger actions.
 * 
 * Usage:
 *   const { isFromVoice, voiceIntent, markVoiceHandled } = useScreenVoiceRouter();
 *   useEffect(() => {
 *     if (isFromVoice && voiceIntent === 'medicine') {
 *       // React to voice routing — maybe auto-scroll to next dose
 *       markVoiceHandled();
 *     }
 *   }, [isFromVoice, voiceIntent]);
 */

import { useEffect, useState } from "react";

export default function useScreenVoiceRouter() {
  const [isFromVoice, setIsFromVoice] = useState(false);
  const [voiceIntent, setVoiceIntent] = useState(null);

  useEffect(() => {
    // Check if navigation came from voice routing
    const voiceSource = sessionStorage.getItem("smritivani.voice_intent");
    if (voiceSource) {
      setVoiceIntent(voiceSource);
      setIsFromVoice(true);
    }

    return () => {
      // Clear on unmount to prevent intent bleeding to other screens
    };
  }, []);

  const markVoiceHandled = () => {
    sessionStorage.removeItem("smritivani.voice_intent");
    setIsFromVoice(false);
    setVoiceIntent(null);
  };

  return { isFromVoice, voiceIntent, markVoiceHandled };
}
