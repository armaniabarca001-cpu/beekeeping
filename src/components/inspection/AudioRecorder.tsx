"use client";

import { useRef, useState } from "react";

const MAX_RECORDING_MS = 60_000;

interface AudioRecorderProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function AudioRecorder({ value, onChange }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = () => onChange(reader.result as string);
      reader.readAsDataURL(blob);
      setRecording(false);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    stopTimeoutRef.current = setTimeout(() => recorder.stop(), MAX_RECORDING_MS);
  }

  function stopRecording() {
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    mediaRecorderRef.current?.stop();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
          recording ? "bg-red-600 text-white" : "bg-slate-100 text-navy-500 hover:bg-honey-100"
        }`}
      >
        {recording ? "Stop recording" : "🎙 Record voice note"}
      </button>
      {value && !recording && (
        <>
          <audio controls src={value} className="h-9" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        </>
      )}
    </div>
  );
}
