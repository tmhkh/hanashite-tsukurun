import { useEffect, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Home,
  Mic,
  Pencil,
  Play,
  Square,
  Users,
} from 'lucide-react';
import './mockup.css';
import {
  CHILDREN,
  FRIEND_QUESTIONS,
  LANES,
  NEW_ATTEMPT,
  PARENT_NOTE,
  PAST_ATTEMPTS,
  TALK_TURNS,
  type Attempt,
  type Lane,
  type TalkCard,
} from './mockData';

/**
 * 「つくる → れんしゅう → ほんばん」の全体像をつかむためのクリックできるモックアップ。
 * 音声認識・録音・AI はすべて固定データで代用している（?mockup を付けて開く）。
 */

type View = 'home' | 'talk' | 'arrange' | 'practice' | 'review' | 'stage' | 'qa' | 'parent';

const ACTS: { label: string; views: View[]; first: View }[] = [
  { label: '1 つくる', views: ['talk', 'arrange'], first: 'talk' },
  { label: '2 れんしゅう', views: ['practice', 'review'], first: 'practice' },
  { label: '3 ほんばん', views: ['stage', 'qa'], first: 'stage' },
];

/** カードが足りているとみなす枚数 */
const ENOUGH_CARDS = 4;

/** 途中の幕から開いたときに使う、並べ終えた状態のカード */
const ARRANGED_LANES: Lane[] = ['start', 'start', 'middle', 'pool', 'middle', 'end'];
const ARRANGED_CARDS: TalkCard[] = TALK_TURNS.map((t, i) => ({
  id: i,
  text: t.answer,
  keyword: t.keyword,
  lane: ARRANGED_LANES[i],
  picture: i === 2 ? 'draw' : i === 0 ? 'photo' : null,
}));

function mmss(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function orderedCards(cards: TalkCard[]): TalkCard[] {
  return LANES.flatMap((l) => cards.filter((c) => c.lane === l.id));
}

export default function Mockup() {
  const [view, setView] = useState<View>('home');
  const [childId, setChildId] = useState(CHILDREN[0].id);
  const [cards, setCards] = useState<TalkCard[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>(PAST_ATTEMPTS);

  const child = CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0];
  const ordered = orderedCards(cards);

  const go = (next: View) => {
    // 「つくる」を通らずに開いた画面でも中身が入っているようにする
    const needsCards = next !== 'home' && next !== 'talk';
    const empty = next === 'arrange' ? cards.length === 0 : ordered.length === 0;
    if (needsCards && empty) setCards(ARRANGED_CARDS);
    setView(next);
  };

  const finishPractice = (seconds: number) => {
    setAttempts((prev) => [...prev, { ...NEW_ATTEMPT, no: prev.length + 1, seconds }]);
    go('review');
  };

  if (view === 'stage') {
    return <StageView cards={ordered} onDone={() => go('qa')} onExit={() => go('home')} />;
  }

  return (
    <div className="mk-root">
      <header className="mk-header">
        <button className="mk-chip" onClick={() => go('home')} aria-label="ホームへ もどる">
          <Home size={18} aria-hidden /> ホーム
        </button>
        <nav className="mk-acts" aria-label="3つのまく">
          {ACTS.map((act) => (
            <button
              key={act.label}
              className={`mk-act${act.views.includes(view) ? ' is-current' : ''}`}
              onClick={() => go(act.first)}
            >
              {act.label}
            </button>
          ))}
        </nav>
        <span className="mk-badge">モックアップ</span>
      </header>

      <main className="mk-main">
        {view === 'home' && (
          <HomeView
            childId={childId}
            onChild={setChildId}
            childName={child.name}
            practiceCount={attempts.length}
            go={go}
          />
        )}
        {view === 'talk' && <TalkView cards={cards} setCards={setCards} go={go} />}
        {view === 'arrange' && <ArrangeView cards={cards} setCards={setCards} go={go} />}
        {view === 'practice' && <PracticeView cards={ordered} onFinish={finishPractice} />}
        {view === 'review' && <ReviewView attempts={attempts} go={go} />}
        {view === 'qa' && <QaView go={go} />}
        {view === 'parent' && <ParentView childName={child.name} attempts={attempts} go={go} />}
      </main>
    </div>
  );
}

type SetCards = (fn: (prev: TalkCard[]) => TalkCard[]) => void;

/* ---------- ホーム ---------- */

function HomeView(props: {
  childId: string;
  onChild: (id: string) => void;
  childName: string;
  practiceCount: number;
  go: (v: View) => void;
}) {
  const { childId, onChild, childName, practiceCount, go } = props;
  return (
    <>
      <section className="mk-panel">
        <h1 className="mk-title">{childName}さんの はっぴょう</h1>
        <div className="mk-row" role="group" aria-label="つかう人">
          {CHILDREN.map((c) => (
            <button
              key={c.id}
              className={`mk-chip${c.id === childId ? ' is-on' : ''}`}
              aria-pressed={c.id === childId}
              onClick={() => onChild(c.id)}
            >
              {c.name}（{c.grade}）
            </button>
          ))}
        </div>
        <p className="mk-note">学年は おぼえているので、毎回 えらばなくて いいよ</p>
      </section>

      <section className="mk-panel">
        <div className="mk-row mk-between">
          <h2 className="mk-h2">カブトムシを そだてた</h2>
          <span className="mk-pill">はっぴょうまで あと 5日</span>
        </div>
        <p className="mk-note">
          れんしゅう {practiceCount}回 ・ きょうの ミッション：1回 通して 話す（3分）
        </p>
        <div className="mk-row">
          <button className="mk-btn" onClick={() => go('arrange')}>
            <Pencil size={20} aria-hidden /> カードを なおす
          </button>
          <button className="mk-btn is-primary" onClick={() => go('practice')}>
            <Mic size={20} aria-hidden /> れんしゅうする
          </button>
          <button className="mk-btn" onClick={() => go('stage')}>
            <Play size={20} aria-hidden /> ほんばんを する
          </button>
        </div>
      </section>

      <div className="mk-row">
        <button className="mk-btn is-primary mk-grow" onClick={() => go('talk')}>
          ＋ あたらしい はっぴょうを つくる
        </button>
        <button className="mk-btn" onClick={() => go('parent')}>
          <Users size={20} aria-hidden /> おうちの人へ
        </button>
      </div>
    </>
  );
}

/* ---------- 1. つくる：話す ---------- */

function TalkView(props: { cards: TalkCard[]; setCards: SetCards; go: (v: View) => void }) {
  const { cards, setCards, go } = props;
  const turn = TALK_TURNS[cards.length];
  const enough = cards.length >= ENOUGH_CARDS;

  const speak = () => {
    if (!turn) return;
    setCards((prev) => [
      ...prev,
      { id: prev.length, text: turn.answer, keyword: turn.keyword, lane: 'pool', picture: null },
    ]);
  };

  return (
    <>
      <section className="mk-panel mk-center">
        <p className="mk-step">話した ことばが そのまま カードに なるよ</p>
        {turn ? (
          <>
            <p className="mk-question">{turn.question}</p>
            <p className="mk-why">どうして きくの？ … {turn.why}</p>
            <button className="mk-mic" onClick={speak} aria-label="マイクで話す">
              <Mic size={56} aria-hidden />
            </button>
            <p className="mk-note">（モック）おすと、話した ことに なります</p>
          </>
        ) : (
          <p className="mk-question">たくさん 話せたね！ カードを ならべよう</p>
        )}
      </section>

      <section className="mk-panel">
        <div className="mk-row mk-between">
          <h2 className="mk-h2">あつまった カード {cards.length}まい</h2>
          {enough && (
            <button className="mk-btn is-primary" onClick={() => go('arrange')}>
              カードを ならべる <ChevronRight size={20} aria-hidden />
            </button>
          )}
        </div>
        {cards.length === 0 ? (
          <p className="mk-note">まだ カードは ないよ。マイクを おして 話してみよう</p>
        ) : (
          <ul className="mk-cards">
            {cards.map((c) => (
              <li key={c.id} className="mk-card">
                {c.text}
              </li>
            ))}
          </ul>
        )}
        {!enough && cards.length > 0 && (
          <p className="mk-note">あと {ENOUGH_CARDS - cards.length}まい あると ならべられるよ</p>
        )}
      </section>
    </>
  );
}

/* ---------- 1. つくる：ならべる ---------- */

function ArrangeView(props: { cards: TalkCard[]; setCards: SetCards; go: (v: View) => void }) {
  const { cards, setCards, go } = props;
  const [picked, setPicked] = useState<number | null>(null);

  const moveTo = (lane: Lane) => {
    if (picked === null) return;
    setCards((prev) => {
      const card = prev.find((c) => c.id === picked);
      if (!card) return prev;
      // 置いた順に並ぶよう、動かしたカードを末尾へ回す
      return [...prev.filter((c) => c.id !== picked), { ...card, lane }];
    });
    setPicked(null);
  };

  const setPicture = (id: number, picture: TalkCard['picture']) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, picture } : c)));
  };

  const renderCard = (c: TalkCard, withPicture: boolean) => (
    <li key={c.id} className="mk-card-wrap">
      <button
        className={`mk-card is-button${picked === c.id ? ' is-picked' : ''}`}
        aria-pressed={picked === c.id}
        onClick={() => setPicked(picked === c.id ? null : c.id)}
      >
        {c.text}
      </button>
      {withPicture && (
        <div className="mk-row mk-tight">
          {c.picture ? (
            <button className="mk-chip is-on" onClick={() => setPicture(c.id, null)}>
              {c.picture === 'draw' ? 'じぶんの 絵' : 'しゃしん'} ✓
            </button>
          ) : (
            <>
              <button className="mk-chip" onClick={() => setPicture(c.id, 'draw')}>
                <Pencil size={14} aria-hidden /> 絵を かく
              </button>
              <button className="mk-chip" onClick={() => setPicture(c.id, 'photo')}>
                <Camera size={14} aria-hidden /> しゃしん
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );

  const pool = cards.filter((c) => c.lane === 'pool');
  const placed = cards.length - pool.length;
  const allLanesUsed = LANES.every((l) => cards.some((c) => c.lane === l.id));

  return (
    <>
      <section className="mk-panel">
        <p className="mk-step">
          {picked === null
            ? 'カードを タッチして えらぼう'
            : '「はじめ・なか・おわり」の どこに おく？ おきたい ところを タッチ'}
        </p>
        <div className="mk-row mk-between">
          <h2 className="mk-h2">まだ おいていない カード</h2>
          {picked !== null && (
            <button className="mk-chip" onClick={() => moveTo('pool')}>
              ここに もどす
            </button>
          )}
        </div>
        {pool.length === 0 ? (
          <p className="mk-note">ぜんぶ おいたよ。つかわない カードは ここに もどしても いいよ</p>
        ) : (
          <ul className="mk-cards">{pool.map((c) => renderCard(c, false))}</ul>
        )}
      </section>

      <div className="mk-lanes">
        {LANES.map((lane) => (
          <section key={lane.id} className="mk-panel mk-lane">
            <button
              className={`mk-lane-head${picked !== null ? ' is-target' : ''}`}
              onClick={() => moveTo(lane.id)}
              disabled={picked === null}
              aria-label={`${lane.label}に おく`}
            >
              <span className="mk-h2">{lane.label}</span>
              <span className="mk-note">{lane.hint}</span>
            </button>
            <ul className="mk-cards is-column">
              {cards.filter((c) => c.lane === lane.id).map((c) => renderCard(c, true))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mk-row mk-between">
        <button className="mk-btn" onClick={() => go('talk')}>
          <ChevronLeft size={20} aria-hidden /> もっと 話す
        </button>
        <button
          className="mk-btn is-primary"
          disabled={!allLanesUsed}
          onClick={() => go('practice')}
        >
          {allLanesUsed ? `${placed}まいで れんしゅうする` : '3つ ぜんぶに 1まいずつ おこう'}
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>
    </>
  );
}

/* ---------- 2. れんしゅう ---------- */

function PracticeView(props: { cards: TalkCard[]; onFinish: (seconds: number) => void }) {
  const { cards, onFinish } = props;
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  return (
    <>
      <section className="mk-panel mk-center">
        <p className="mk-step">
          だいほんは ないよ。カードの ことばを 見ながら、じぶんの ことばで 話そう
        </p>
        <p className="mk-timer">
          {mmss(seconds)} <span className="mk-note">/ 3:00</span>
        </p>
        {recording ? (
          <button
            className="mk-mic is-recording"
            // モックでは すぐ止めても それらしい長さの結果を出す
            onClick={() => onFinish(Math.max(seconds, 62))}
            aria-label="話しおわった"
          >
            <Square size={48} aria-hidden />
          </button>
        ) : (
          <button
            className="mk-mic"
            onClick={() => setRecording(true)}
            aria-label="れんしゅうを はじめる"
          >
            <Mic size={56} aria-hidden />
          </button>
        )}
        <p className="mk-note">
          {recording
            ? 'ろくおん中… 話しおわったら もういちど おしてね'
            : 'おすと ろくおんが はじまるよ'}
        </p>
      </section>

      <section className="mk-panel">
        <h2 className="mk-h2">話す じゅんばん</h2>
        <ol className="mk-cue">
          {cards.map((c) => (
            <li key={c.id} className="mk-card">
              <span className="mk-pill">{LANES.find((l) => l.id === c.lane)?.label}</span>
              {c.keyword}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

/* ---------- 2. れんしゅう：ふりかえり ---------- */

function ReviewView(props: { attempts: Attempt[]; go: (v: View) => void }) {
  const { attempts, go } = props;
  const latest = attempts[attempts.length - 1];
  const maxFillers = Math.max(...attempts.map((a) => a.fillers), 1);

  return (
    <>
      <section className="mk-panel">
        <p className="mk-step">{latest.no}回目の れんしゅう おつかれさま！</p>
        <div className="mk-feedback is-good">
          <span className="mk-pill">よかった ところ</span>
          <p>{latest.good}</p>
        </div>
        <div className="mk-feedback">
          <span className="mk-pill">つぎの チャレンジ</span>
          <p>{latest.next}</p>
        </div>
        <dl className="mk-stats">
          <div>
            <dt>じかん</dt>
            <dd>{mmss(latest.seconds)}</dd>
          </div>
          <div>
            <dt>言えた カード</dt>
            <dd>
              {latest.said} / {latest.total}
            </dd>
          </div>
          <div>
            <dt>「えーと」</dt>
            <dd>{latest.fillers}回</dd>
          </div>
        </dl>
      </section>

      <section className="mk-panel">
        <h2 className="mk-h2">これまでの れんしゅう</h2>
        <ul className="mk-history">
          {attempts.map((a) => (
            <li key={a.no}>
              <button className="mk-chip" aria-label={`${a.no}回目を きく`}>
                <Play size={14} aria-hidden /> {a.no}回目
              </button>
              <span className="mk-note">{a.day}</span>
              <span className="mk-bar" aria-hidden>
                <span style={{ width: `${(a.fillers / maxFillers) * 100}%` }} />
              </span>
              <span className="mk-note">
                「えーと」{a.fillers}回 ・ カード {a.said}/{a.total}
              </span>
            </li>
          ))}
        </ul>
        <p className="mk-note">
          1回目と きょうを ききくらべると、じょうずに なったのが わかるよ
        </p>
      </section>

      <div className="mk-row mk-between">
        <button className="mk-btn" onClick={() => go('practice')}>
          <Mic size={20} aria-hidden /> もう1回 れんしゅう
        </button>
        <button className="mk-btn is-primary" onClick={() => go('stage')}>
          ほんばんへ <ChevronRight size={20} aria-hidden />
        </button>
      </div>
    </>
  );
}

/* ---------- 3. ほんばん：紙芝居 ---------- */

function StageView(props: { cards: TalkCard[]; onDone: () => void; onExit: () => void }) {
  const { cards, onDone, onExit } = props;
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const card = cards[index];
  // カードの用意が1描画ぶん遅れることがあるので、そろうまで何も出さない
  if (!card) return null;
  const last = index === cards.length - 1;

  return (
    <div className="mk-stage">
      <div className="mk-row mk-between">
        <button className="mk-chip" onClick={onExit}>
          やめる
        </button>
        <span className="mk-timer is-small">{mmss(seconds)}</span>
      </div>

      <div className="mk-stage-slide">
        <div className="mk-stage-picture">
          {card.picture === 'draw' && 'じぶんで かいた 絵'}
          {card.picture === 'photo' && 'とった しゃしん'}
          {card.picture === null && '（絵は なし）'}
        </div>
        <p className="mk-stage-keyword">{card.keyword}</p>
      </div>

      <div className="mk-row mk-between">
        <button className="mk-btn" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          <ChevronLeft size={20} aria-hidden /> まえ
        </button>
        <span className="mk-note">
          {index + 1} / {cards.length}
        </span>
        <button
          className="mk-btn is-primary"
          onClick={() => (last ? onDone() : setIndex(index + 1))}
        >
          {last ? 'おわり → しつもんタイム' : 'つぎ'} <ChevronRight size={20} aria-hidden />
        </button>
      </div>
    </div>
  );
}

/* ---------- 3. ほんばん：しつもんタイム ---------- */

function QaView(props: { go: (v: View) => void }) {
  const { go } = props;
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const item = FRIEND_QUESTIONS[index];
  const last = index === FRIEND_QUESTIONS.length - 1;

  const next = () => {
    if (last) return go('parent');
    setIndex(index + 1);
    setAnswered(false);
  };

  return (
    <section className="mk-panel mk-center">
      <p className="mk-step">
        しつもんタイム（{index + 1} / {FRIEND_QUESTIONS.length}）… クラスの 友だちに なった AIが
        しつもんするよ
      </p>
      <p className="mk-question">「{item.q}」</p>
      {answered ? (
        <>
          <p className="mk-card">{item.a}</p>
          <p className="mk-note">
            こたえられたね！ わからない ときは「しらべて おくね」で だいじょうぶ
          </p>
          <button className="mk-btn is-primary" onClick={next}>
            {last ? 'しつもんタイムを おわる' : 'つぎの しつもん'}{' '}
            <ChevronRight size={20} aria-hidden />
          </button>
        </>
      ) : (
        <>
          <button className="mk-mic" onClick={() => setAnswered(true)} aria-label="マイクで こたえる">
            <Mic size={56} aria-hidden />
          </button>
          <p className="mk-note">（モック）おすと、こたえた ことに なります</p>
        </>
      )}
    </section>
  );
}

/* ---------- おうちの人へ ---------- */

function ParentView(props: { childName: string; attempts: Attempt[]; go: (v: View) => void }) {
  const { childName, attempts, go } = props;
  const first = attempts[0];
  const latest = attempts[attempts.length - 1];
  return (
    <>
      <section className="mk-panel">
        <h1 className="mk-title">おうちの方へ</h1>
        <p className="mk-note">
          {childName}さん ・「カブトムシを そだてた」・ 発表まであと5日 ・ 練習 {attempts.length}回
        </p>
        <div className="mk-feedback is-good">
          <span className="mk-pill">今日ほめるポイント</span>
          <p>{PARENT_NOTE.praise}</p>
        </div>
        <div className="mk-feedback">
          <span className="mk-pill">次に取り組むこと</span>
          <p>{PARENT_NOTE.watch}</p>
        </div>
        <dl className="mk-stats">
          <div>
            <dt>言えたカード</dt>
            <dd>
              {first.said} → {latest.said} / {latest.total}
            </dd>
          </div>
          <div>
            <dt>「えーと」</dt>
            <dd>
              {first.fillers} → {latest.fillers}回
            </dd>
          </div>
          <div>
            <dt>話した時間</dt>
            <dd>
              {mmss(first.seconds)} → {mmss(latest.seconds)}
            </dd>
          </div>
        </dl>
        <p className="mk-note">
          スライドの文や台本は AI が書いていません。カードの言葉はすべて本人が話したものです。
        </p>
      </section>
      <div className="mk-row">
        <button className="mk-btn is-primary" onClick={() => go('home')}>
          <Home size={20} aria-hidden /> ホームへ
        </button>
      </div>
    </>
  );
}
