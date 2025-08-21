import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  // 1) 음성 → 텍스트 (STT)
  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: file,
  });

  // 2) 텍스트 → 답변 생성
  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: transcription.text }],
  });

  const answer = chat.choices[0].message.content!;

  // 3) 답변 → 음성 변환 (TTS)
  const speechFile = path.join("/tmp", "reply.mp3");
  const mp3 = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    input: answer,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);

  // 4) 결과 반환
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": 'inline; filename="reply.mp3"',
    },
  });
}
