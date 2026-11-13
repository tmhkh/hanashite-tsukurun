import { useEffect, useRef, useState } from 'react';
import { Eraser, Mic, Scissors, Square, Trash2, X } from 'lucide-react';
import { useSpeechRecognizer } from '../../hooks/useSpeechRecognizer';
import { LONG_CARD, splitText, type Card } from './makeModel';

/* ---------- 声でもキーボードでも入れられる入力らん ---------- */

function speechSupported(): boolean {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function VoiceInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const { label, value, onChange, placeholder, rows = 3 } = props;
  const [trouble, setTrouble] = useState('');
  const supported = speechSupported();

  const { state, start, stop } = useSpeechRecognizer({
    // きいた言葉は、いま入っている言葉の うしろに つなげる
    onResult: (text) => {
      setTrouble('');
      onChange(value ? `${value}${text}` : text);
    },
    onTimeout: () => setTrouble('こえが きこえなかったよ。もういちど おしてね'),
    onError: () => setTrouble('うまく きけなかったよ。もういちど 話すか、キーボードで 書いてね'),
  });

  return (
    <div className="mk-voice">
      {supported && (
        <button
          type="button"
          className={`mk-mic${state.isListening ? ' is-recording' : ''}`}
          onClick={() => (state.isListening ? stop() : start())}
          aria-label={state.isListening ? '話すのを やめる' : 'マイクで話す'}
        >
          {state.isListening ? <Square size={44} aria-hidden /> : <Mic size={52} aria-hidden />}
        </button>
      )}
      <p className="mk-note" role="status">
        {state.isListening
          ? 'きいているよ… ゆっくり 話してね'
          : trouble ||
            (supported
              ? 'マイクを おして 話すか、下に 書いてね'
              : 'この ブラウザは マイクが つかえないので、下に 書いてね')}
      </p>
      <textarea
        className="mk-input"
        aria-label={label}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* ---------- ダイアログの外わく ---------- */

function Dialog(props: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { title, onClose, children } = props;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="mk-overlay">
      <div className="mk-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mk-row mk-between">
          <h2 className="mk-h2">{title}</h2>
          <button type="button" className="mk-chip" onClick={onClose} aria-label="とじる">
            <X size={16} aria-hidden /> とじる
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- カードを なおす ---------- */

export function CardEditor(props: {
  card: Card;
  onSave: (patch: Pick<Card, 'text' | 'keyword'>) => void;
  onSplit: (first: string, second: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { card, onSave, onSplit, onDelete, onClose } = props;
  const [text, setText] = useState(card.text);
  const [keyword, setKeyword] = useState(card.keyword);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const clean = text.trim();

  return (
    <Dialog title="カードを なおす" onClose={onClose}>
      <label className="mk-field">
        <span className="mk-note">カードの ことば（話した ことばを なおせるよ）</span>
        <textarea
          className="mk-input"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      {clean.length > LONG_CARD && (
        <p className="mk-note">ちょっと 長いよ。2まいに 分けると 話しやすく なるよ</p>
      )}
      <label className="mk-field">
        <span className="mk-note">おぼえる ことば（れんしゅうと ほんばんで 見る みじかい ことば）</span>
        <input
          className="mk-input"
          value={keyword}
          maxLength={20}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </label>
      <div className="mk-row mk-between">
        <div className="mk-row">
          <button
            type="button"
            className="mk-chip"
            disabled={clean.length < 8}
            onClick={() => onSplit(...splitText(clean))}
          >
            <Scissors size={14} aria-hidden /> 2まいに 分ける
          </button>
          {confirmDelete ? (
            <button type="button" className="mk-chip is-danger" onClick={onDelete}>
              ほんとうに すてる
            </button>
          ) : (
            <button type="button" className="mk-chip" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} aria-hidden /> カードを すてる
            </button>
          )}
        </div>
        <button
          type="button"
          className="mk-btn is-primary"
          disabled={clean.length === 0}
          onClick={() => onSave({ text: clean, keyword: keyword.trim() || clean.slice(0, 14) })}
        >
          これで OK
        </button>
      </div>
    </Dialog>
  );
}

/* ---------- 絵を かく ---------- */

const PEN_COLORS = ['#1e293b', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7'];
const PAD_WIDTH = 480;
const PAD_HEIGHT = 360;

export function DrawPad(props: { onSave: (dataUrl: string) => void; onClose: () => void }) {
  const { onSave, onClose } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [erasing, setErasing] = useState(false);

  const context = () => canvasRef.current?.getContext('2d') ?? null;

  const clear = () => {
    const ctx = context();
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAD_WIDTH, PAD_HEIGHT);
  };

  useEffect(clear, []);

  /** 画面上の位置を、キャンバスの中の位置に直す */
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * PAD_WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * PAD_HEIGHT,
    };
  };

  const begin = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = context();
    if (!ctx) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    const { x, y } = point(e);
    ctx.strokeStyle = erasing ? '#ffffff' : color;
    ctx.lineWidth = erasing ? 28 : 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    // 点だけ打ったときも あとが のこるようにする
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = context();
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    drawing.current = false;
  };

  return (
    <Dialog title="絵を かく" onClose={onClose}>
      <canvas
        ref={canvasRef}
        className="mk-canvas"
        width={PAD_WIDTH}
        height={PAD_HEIGHT}
        aria-label="絵を かく ところ"
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
      />
      <div className="mk-row" role="group" aria-label="ペンの 色">
        {PEN_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`mk-swatch${!erasing && c === color ? ' is-on' : ''}`}
            style={{ background: c }}
            aria-label={`色 ${c}`}
            aria-pressed={!erasing && c === color}
            onClick={() => {
              setColor(c);
              setErasing(false);
            }}
          />
        ))}
        <button
          type="button"
          className={`mk-chip${erasing ? ' is-on' : ''}`}
          aria-pressed={erasing}
          onClick={() => setErasing(!erasing)}
        >
          <Eraser size={14} aria-hidden /> けしゴム
        </button>
        <button type="button" className="mk-chip" onClick={clear}>
          <Trash2 size={14} aria-hidden /> ぜんぶ けす
        </button>
      </div>
      <div className="mk-row mk-end">
        <button
          type="button"
          className="mk-btn is-primary"
          onClick={() => {
            const canvas = canvasRef.current;
            if (canvas) onSave(canvas.toDataURL('image/png'));
          }}
        >
          絵が できた
        </button>
      </div>
    </Dialog>
  );
}

/* ---------- しゃしんを 小さくして 読みこむ ---------- */

/** 保存する容量をおさえるため、長い辺を max ピクセルまで縮めた JPEG にする */
export function fileToDataUrl(file: File, max = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('decode failed'));
      image.onload = () => {
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
