"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [recording, setRecording] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 녹음 시작
  const startRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    let chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", blob, "voice.webm");

      const res = await fetch("/api/voice", {
        method: "POST",
        body: formData,
      });

      // 서버에서 음성 파일 반환 → 재생
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    };

    mediaRecorder.start();
    setTimeout(() => {
      mediaRecorder.stop();
      setRecording(false);
    }, 5000); // 5초 녹음 후 자동 종료
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <button
        onClick={startRecording}
        className="px-6 py-3 rounded-xl bg-blue-500 text-white"
      >
        {recording ? "Recording..." : "Start Talking"}
      </button>
      <audio ref={audioRef} autoPlay />
    </main>
  );
}
