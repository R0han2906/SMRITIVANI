import { useCallback, useEffect, useRef, useState } from "react";

const mimeCandidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/wav"];

export default function useVoiceRecorder() {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [permissionState, setPermissionState] = useState("unknown");

  const releaseTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(""); setAudioBlob(null); setDuration(0); chunksRef.current = [];
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Audio recording is not supported in this browser. Use the speech button instead.");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream; setPermissionState("granted");
      const mimeType = mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data?.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const actualMime = recorder.mimeType || chunksRef.current[0]?.type || "application/octet-stream";
        setAudioBlob(new Blob(chunksRef.current, { type: actualMime }));
        setDuration(Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)));
        setIsRecording(false); releaseTracks();
      };
      startedAtRef.current = Date.now(); recorder.start(250); setIsRecording(true); return true;
    } catch (reason) {
      setPermissionState(reason?.name === "NotAllowedError" ? "denied" : "error");
      setError(reason?.name === "NotAllowedError" ? "Please allow microphone access in your browser settings." : "The microphone could not be opened. Please try again.");
      releaseTracks(); return false;
    }
  }, [releaseTracks]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else { setIsRecording(false); releaseTracks(); }
  }, [releaseTracks]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null; recorder.stop();
    }
    chunksRef.current = []; setAudioBlob(null); setIsRecording(false); releaseTracks();
  }, [releaseTracks]);

  useEffect(() => () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") { recorder.onstop = null; recorder.stop(); }
    releaseTracks();
  }, [releaseTracks]);

  return { isRecording, audioBlob, duration, error, permissionState, start, stop, cancel };
}
