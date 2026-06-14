import { useState, useCallback, useRef } from 'react';

/**
 * Web Speech API の SpeechSynthesis を使った日本語音声再生フック
 * Requirements: 2.2, 2.5, 2.6
 */
export function useSpeechSynthesis(): {
  speak: (text: string, onEnd?: () => void) => void;
  isSpeaking: boolean;
  cancel: () => void;
} {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFallback = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    clearFallback();
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, [clearFallback]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    // 再生中の音声があればキャンセルしてから開始
    clearFallback();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';

    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      clearFallback();
      setIsSpeaking(false);
      utteranceRef.current = null;
      onEnd?.();
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    utteranceRef.current = utterance;
    setIsSpeaking(true);

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      // ブラウザ実装差異で speak が例外を投げても UI を復帰させる
      finish();
      return;
    }

    // フォールバック: 音声合成がブロックされ onstart/onend が一切来ない場合、
    // 5秒後に強制的に完了扱いにする
    fallbackTimerRef.current = setTimeout(() => {
      if (!completed) {
        finish();
      }
    }, 5000);
  }, [clearFallback]);

  return { speak, isSpeaking, cancel };
}
