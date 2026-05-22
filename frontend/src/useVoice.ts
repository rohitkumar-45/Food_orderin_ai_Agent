import { useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string; isFinal?: boolean }>>;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useVoice(onFinalTranscript: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const callbackRef = useRef(onFinalTranscript);
  callbackRef.current = onFinalTranscript;

  const Recognition = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return window.SpeechRecognition ?? window.webkitSpeechRecognition;
  }, []);

  useEffect(() => {
    setSupported(Boolean(Recognition));
  }, [Recognition]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  function start() {
    if (!Recognition || listening) return;
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      let finalText = "";
      let interim = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index][0];
        if (result.isFinal) finalText += result.transcript;
        else interim += result.transcript;
      }
      setInterimText(interim);
      if (finalText.trim()) callbackRef.current(finalText.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stop() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return { supported, listening, interimText, start, stop };
}
