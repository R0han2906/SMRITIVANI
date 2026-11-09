import { useCallback, useEffect, useRef, useState } from "react";

const mimeCandidates = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"];
const targetSampleRate = 16000;

function writeText(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
}

async function convertToWav(recording) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("This browser cannot prepare audio for transcription.");
  const context = new AudioContextClass();
  let decoded;
  try {
    decoded = await context.decodeAudioData(await recording.arrayBuffer());
  } finally {
    await context.close();
  }

  const channels = decoded.numberOfChannels;
  const mono = new Float32Array(decoded.length);
  for (let channel = 0; channel < channels; channel += 1) {
    const samples = decoded.getChannelData(channel);
    for (let index = 0; index < samples.length; index += 1) mono[index] += samples[index] / channels;
  }

  const outputLength = Math.max(1, Math.round(decoded.length * targetSampleRate / decoded.sampleRate));
  const output = new Float32Array(outputLength);
  const ratio = decoded.sampleRate / targetSampleRate;
  for (let index = 0; index < outputLength; index += 1) {
    const position = index * ratio;
    const left = Math.min(Math.floor(position), mono.length - 1);
    const right = Math.min(left + 1, mono.length - 1);
    const fraction = position - left;
    output[index] = mono[left] + (mono[right] - mono[left]) * fraction;
  }

  const wav = new ArrayBuffer(44 + output.length * 2);
  const view = new DataView(wav);
  writeText(view, 0, "RIFF");
  view.setUint32(4, 36 + output.length * 2, true);
  writeText(view, 8, "WAVE");
  writeText(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(view, 36, "data");
  view.setUint32(40, output.length * 2, true);
  for (let index = 0; index < output.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, output[index]));
    view.setInt16(44 + index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return new Blob([wav], { type: "audio/wav" });
}

export default function useVoiceRecorder() {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const maxDurationTimerRef = useRef(null);
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
      setError("Audio recording is not supported in this browser.");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream; setPermissionState("granted");
      const mimeType = mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data?.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        window.clearTimeout(maxDurationTimerRef.current);
        const actualMime = recorder.mimeType || chunksRef.current[0]?.type || "application/octet-stream";
        try {
          const recording = new Blob(chunksRef.current, { type: actualMime });
          setAudioBlob(await convertToWav(recording));
        } catch {
          setError("I couldn’t prepare the recording. Please try again or use a supported browser.");
        } finally {
          setDuration(Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)));
          setIsRecording(false); releaseTracks();
        }
      };
      startedAtRef.current = Date.now(); recorder.start(250); setIsRecording(true);
      maxDurationTimerRef.current = window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 28000);
      return true;
    } catch (reason) {
      setPermissionState(reason?.name === "NotAllowedError" ? "denied" : "error");
      setError(reason?.name === "NotAllowedError" ? "Please allow microphone access in your browser settings." : "The microphone could not be opened. Please try again.");
      releaseTracks(); return false;
    }
  }, [releaseTracks]);

  const stop = useCallback(() => {
    window.clearTimeout(maxDurationTimerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else { setIsRecording(false); releaseTracks(); }
  }, [releaseTracks]);

  const cancel = useCallback(() => {
    window.clearTimeout(maxDurationTimerRef.current);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null; recorder.stop();
    }
    chunksRef.current = []; setAudioBlob(null); setIsRecording(false); releaseTracks();
  }, [releaseTracks]);

  useEffect(() => () => {
    window.clearTimeout(maxDurationTimerRef.current);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") { recorder.onstop = null; recorder.stop(); }
    releaseTracks();
  }, [releaseTracks]);

  return { isRecording, audioBlob, duration, error, permissionState, start, stop, cancel };
}
