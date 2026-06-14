import { useState, useCallback, useEffect, useRef } from 'react';
import type { Grade, Step, SlideData, HistoryEntry } from '../../types/index';
import { useSlideApi } from '../../hooks/useSlideApi';
import { useSpeechRecognizer } from '../../hooks/useSpeechRecognizer';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { SlidePreview } from '../SlidePreview/SlidePreview';
import ProgressBar from './ProgressBar';
import { MicButton } from './MicButton';
import { AICharacter } from './AICharacter';

/**
 * MainScreen コンポーネント Props
 */
export interface MainScreenProps {
  grade: Grade;
  history: HistoryEntry[];
  onComplete: (slides: SlideData[], script: string) => void;
  onChangeGrade: () => void;
  onHistoryUpdate: (userSpeech: string, aiVoice: string) => void;
}

/** 初期起動時のウェルカムメッセージ */
const WELCOME_MESSAGE = 'いっしょに はっぴょうを つくろう！なにについて おはなしする？';

/** エラー・空レスポンス時の再試行メッセージ */
const RETRY_MESSAGE = 'もう一度 やってみてね';

/**
 * メイン画面コンポーネント
 *
 * useSlideApi, useSpeechRecognizer, useSpeechSynthesis フックを組み合わせ、
 * 音声対話によるスライド作成フローを実装する。
 *
 * Requirements: 2.1, 2.2, 2.5, 2.6, 3.2, 3.4, 3.5, 3.6, 3.7, 6.2, 6.3, 8.1
 */
export function MainScreen({
  grade,
  history,
  onComplete,
  onChangeGrade,
  onHistoryUpdate,
}: MainScreenProps) {
  // --- State ---
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);
  const [slides, setSlides] = useState<(SlideData | null)[]>([null, null, null]);
  const [aiText, setAiText] = useState<string>(WELCOME_MESSAGE);
  const [micDisabled, setMicDisabled] = useState<boolean>(true);

  // --- Hooks ---
  const { call: callSlideApi, loading: apiLoading } = useSlideApi();
  const { speak, isSpeaking, cancel: cancelSpeech } = useSpeechSynthesis();

  // ウェルカムメッセージ再生済みフラグ
  const welcomePlayedRef = useRef(false);

  // --- ウェルカムメッセージ再生（画面起動時に1回だけ） ---
  // ブラウザのオートプレイポリシーにより音声が再生されない場合、
  // onEnd が発火せずマイクが永久に無効のままになるため、
  // フォールバックタイムアウト（3秒）で強制的にマイクを有効化する。
  useEffect(() => {
    if (!welcomePlayedRef.current) {
      welcomePlayedRef.current = true;
      let enabledByCallback = false;

      speak(WELCOME_MESSAGE, () => {
        enabledByCallback = true;
        setMicDisabled(false);
      });

      // フォールバック: 3秒以内に onEnd が来なければ強制有効化
      // cancel() で isSpeaking も false に戻す
      const fallbackTimer = setTimeout(() => {
        if (!enabledByCallback) {
          cancelSpeech();
          setMicDisabled(false);
        }
      }, 3000);

      return () => {
        clearTimeout(fallbackTimer);
        cancelSpeech();
      };
    }
    return () => {
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 音声認識結果後のAPI呼び出し処理 ---
  const handleSpeechResult = useCallback(
    async (userSpeech: string) => {
      // MicButton を無効化（APIリクエスト中）
      setMicDisabled(true);

      try {
        const response = await callSlideApi({
          grade,
          current_step: currentStep,
          user_speech: userSpeech,
          history,
        });

        // スライドデータを更新
        const newSlide: SlideData = {
          step: currentStep,
          slide_title: response.slide_title,
          slide_text: response.slide_text,
          image_keyword: response.image_keyword,
        };
        setSlides((prev) => {
          const updated = [...prev];
          updated[currentStep - 1] = newSlide;
          return updated;
        });

        // 完了ステップを更新
        setCompletedSteps((prev) =>
          prev.includes(currentStep) ? prev : [...prev, currentStep]
        );

        // 会話履歴を更新
        onHistoryUpdate(userSpeech, response.ai_response_voice);

        // next_step === 4 のとき完成
        if (response.next_step === 4) {
          // 全スライドを構築して完了コールバック
          const finalSlides: SlideData[] = slides.map((s, i) =>
            i === currentStep - 1 ? newSlide : s!
          ) as SlideData[];
          // AI発話を再生してから完了遷移
          setAiText(response.ai_response_voice);
          speak(response.ai_response_voice, () => {
            onComplete(finalSlides, response.script);
          });
          return;
        }

        // ai_response_voice が空文字列のとき → エラーとして再試行を促す
        if (response.ai_response_voice === '') {
          setAiText(RETRY_MESSAGE);
          speak(RETRY_MESSAGE, () => {
            setMicDisabled(false);
          });
          return;
        }

        // 正常系: AI発話を再生し、次のステップへ
        setCurrentStep(response.next_step as Step);
        setAiText(response.ai_response_voice);
        speak(response.ai_response_voice, () => {
          setMicDisabled(false);
        });
      } catch {
        // API エラー・タイムアウト
        setAiText(RETRY_MESSAGE);
        speak(RETRY_MESSAGE, () => {
          setMicDisabled(false);
        });
      }
    },
    [
      grade,
      currentStep,
      history,
      callSlideApi,
      speak,
      slides,
      onComplete,
      onHistoryUpdate,
    ]
  );

  // --- 音声認識タイムアウト処理 ---
  const handleTimeout = useCallback(() => {
    setAiText(RETRY_MESSAGE);
    speak(RETRY_MESSAGE, () => {
      setMicDisabled(false);
    });
  }, [speak]);

  // --- 音声認識エラー処理 ---
  const handleSpeechError = useCallback(
    (retryCount: number) => {
      if (retryCount <= 2) {
        const msg = 'もう一度 話してみてね';
        setAiText(msg);
        speak(msg, () => {
          setMicDisabled(false);
        });
      } else {
        const msg = 'うまく きけなかったよ。もう一度 はじめから';
        setAiText(msg);
        speak(msg);
      }
    },
    [speak]
  );

  // --- useSpeechRecognizer ---
  const { state: recognizerState, start: startRecognition } = useSpeechRecognizer({
    lang: 'ja-JP',
    timeoutMs: 10000,
    maxRetries: 2,
    onResult: handleSpeechResult,
    onTimeout: handleTimeout,
    onError: handleSpeechError,
  });

  // --- MicButton クリック ---
  const handleMicClick = useCallback(() => {
    const started = startRecognition();
    setMicDisabled(started);
  }, [startRecognition]);

  // 認識開始に失敗したケースは音声再生なしでマイク再試行可能にする
  useEffect(() => {
    if (
      recognizerState.error === 'このブラウザは音声認識に対応していません' ||
      recognizerState.error === '音声認識の開始に失敗しました'
    ) {
      setAiText(recognizerState.error);
      setMicDisabled(false);
    }
  }, [recognizerState.error]);

  // --- MicButton の無効化条件 ---
  // AI発話中、API処理中、音声認識中はすべて無効
  const isMicDisabled = micDisabled || isSpeaking || apiLoading || recognizerState.isListening;

  return (
    <div style={containerStyle}>
      {/* 進捗バー */}
      <ProgressBar currentStep={currentStep} completedSteps={completedSteps} />

      {/* スライドプレビュー */}
      <SlidePreview
        slides={slides}
        currentStep={currentStep}
        loading={apiLoading}
      />

      {/* AIキャラクター吹き出し */}
      <AICharacter text={aiText} isSpeaking={isSpeaking} />

      {/* マイクボタン */}
      <div style={micAreaStyle}>
        <MicButton
          disabled={isMicDisabled}
          recording={recognizerState.isListening}
          onClick={handleMicClick}
        />
      </div>

      {/* 学年変更ボタン */}
      <div style={footerStyle}>
        <button
          type="button"
          onClick={onChangeGrade}
          style={changeGradeButtonStyle}
          aria-label="学年を えらびなおす"
        >
          学年を えらびなおす
        </button>
      </div>
    </div>
  );
}

// --- Styles ---

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  minHeight: '100vh',
};

const micAreaStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '16px 0',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '8px 0',
};

const changeGradeButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: '16px',
  borderRadius: '8px',
  border: '2px solid #2196f3',
  backgroundColor: '#ffffff',
  color: '#2196f3',
  cursor: 'pointer',
};
