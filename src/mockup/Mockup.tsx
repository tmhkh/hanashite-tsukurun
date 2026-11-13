import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Home, Mic, Pencil, Play, Square, Users } from 'lucide-react';
import './mockup.css';
import {
  CHILDREN,
  FRIEND_QUESTIONS,
  NEW_ATTEMPT,
  PARENT_NOTE,
  PAST_ATTEMPTS,
  type Attempt,
} from './mockData';
import MakeFlow from './make/MakeFlow';
import {
  canPractice,
  emptyProject,
  laneLabel,
  loadProject,
  orderedCards,
  sampleProject,
  saveProject,
  type Card,
  type Project,
} from './make/makeModel';

/**
 * 「つくる → れんしゅう → ほんばん」の全体像をつかむためのモックアップ（?mockup を付けて開く）。
 * 「つくる」は実際に作れる（声・キーボードで入力し、このブラウザに保存する）。
 * 「れんしゅう」「ほんばん」の録音・ふりかえり・質問は固定データで代用している。
 */

type View = 'home' | 'make' | 'practice' | 'review' | 'stage' | 'qa' | 'parent';

const ACTS: { label: string; view: View; views: View[] }[] = [
  { label: '1 つくる', view: 'make', views: ['make'] },
  { label: '2 れんしゅう', view: 'practice', views: ['practice', 'review'] },
  { label: '3 ほんばん', view: 'stage', views: ['stage', 'qa'] },
];

function mmss(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function Mockup() {
  const [view, setView] = useState<View>('home');
  const [childId, setChildId] = useState(CHILDREN[0].id);
  const [project, setProject] = useState<Project>(loadProject);
  const [saved, setSaved] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>(PAST_ATTEMPTS);
  /** 作り直したときに「つくる」を最初の画面から始め直すための番号 */
  const [makeRound, setMakeRound] = useState(0);

  useEffect(() => {
    setSaved(saveProject(project));
  }, [project]);

  const child = CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0];
  // まだ並べ終えていないときは、見本のカードで「れんしゅう」「ほんばん」を見せる
  const ready = canPractice(project.cards);
  const shown = ready ? project : sampleProject();
  const cards = orderedCards(shown.cards);

  const startOver = (next: Project) => {
    setProject(next);
    setMakeRound((n) => n + 1);
    setView('make');
  };

  const finishPractice = (seconds: number) => {
    setAttempts((prev) => [
      ...prev,
      { ...NEW_ATTEMPT, no: prev.length + 1, seconds, said: cards.length, total: cards.length },
    ]);
    setView('review');
  };

  if (view === 'stage') {
    return <StageView cards={cards} onDone={() => setView('qa')} onExit={() => setView('home')} />;
  }

  return (
    <div className="mk-root">
      <header className="mk-header">
        <button className="mk-chip" onClick={() => setView('home')} aria-label="ホームへ もどる">
          <Home size={18} aria-hidden /> ホーム
        </button>
        <nav className="mk-acts" aria-label="3つのまく">
          {ACTS.map((act) => (
            <button
              key={act.label}
              className={`mk-act${act.views.includes(view) ? ' is-current' : ''}`}
              onClick={() => setView(act.view)}
            >
              {act.label}
            </button>
          ))}
        </nav>
        <span className="mk-badge">モックアップ</span>
      </header>

      <main className="mk-main">
        {view !== 'home' && view !== 'make' && !ready && (
          <p className="mk-note mk-banner">
            まだ カードを ならべおわって いないので、みほんの はっぴょうを 出しているよ
          </p>
        )}
        {view === 'home' && (
          <HomeView
            childId={childId}
            onChild={setChildId}
            childName={child.name}
            project={project}
            practiceCount={attempts.length}
            go={setView}
            onNew={() => startOver(emptyProject())}
            onSample={() => startOver(sampleProject())}
          />
        )}
        {view === 'make' && (
          <MakeFlow
            key={makeRound}
            project={project}
            update={setProject}
            saved={saved}
            onPractice={() => setView('practice')}
          />
        )}
        {view === 'practice' && <PracticeView cards={cards} onFinish={finishPractice} />}
        {view === 'review' && <ReviewView attempts={attempts} go={setView} />}
        {view === 'qa' && <QaView go={setView} />}
        {view === 'parent' && (
          <ParentView childName={child.name} title={shown.title} attempts={attempts} go={setView} />
        )}
      </main>
    </div>
  );
}

/* ---------- ホーム ---------- */

function HomeView(props: {
  childId: string;
  onChild: (id: string) => void;
  childName: string;
  project: Project;
  practiceCount: number;
  go: (v: View) => void;
  onNew: () => void;
  onSample: () => void;
}) {
  const { childId, onChild, childName, project, practiceCount, go, onNew, onSample } = props;
  const [confirmNew, setConfirmNew] = useState(false);
  const started = project.title !== '' || project.cards.length > 0;
  const placed = orderedCards(project.cards).length;

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

      {started ? (
        <section className="mk-panel">
          <div className="mk-row mk-between">
            <h2 className="mk-h2">{project.title || 'なまえの ない はっぴょう'}</h2>
            <span className="mk-pill">はっぴょうまで あと 5日</span>
          </div>
          <p className="mk-note">
            カード {project.cards.length}まい（ならべたのは {placed}まい）・ れんしゅう{' '}
            {practiceCount}回
          </p>
          <div className="mk-row">
            <button className="mk-btn is-primary" onClick={() => go('make')}>
              <Pencil size={20} aria-hidden /> つづきを つくる
            </button>
            <button className="mk-btn" onClick={() => go('practice')}>
              <Mic size={20} aria-hidden /> れんしゅうする
            </button>
            <button className="mk-btn" onClick={() => go('stage')}>
              <Play size={20} aria-hidden /> ほんばんを する
            </button>
          </div>
          <div className="mk-row">
            {confirmNew ? (
              <>
                <span className="mk-note">いまの はっぴょうは きえるよ。いい？</span>
                <button className="mk-chip is-danger" onClick={onNew}>
                  けして あたらしく つくる
                </button>
                <button className="mk-chip" onClick={() => setConfirmNew(false)}>
                  やめる
                </button>
              </>
            ) : (
              <button className="mk-chip" onClick={() => setConfirmNew(true)}>
                ＋ あたらしい はっぴょうに する
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="mk-panel mk-center">
          <p className="mk-question">はっぴょうを つくろう！</p>
          <p className="mk-note">しつもんに こたえると カードが できるよ。それを ならべるだけ</p>
          <div className="mk-row mk-centered">
            <button className="mk-btn is-primary" onClick={onNew}>
              ＋ あたらしい はっぴょうを つくる
            </button>
            <button className="mk-btn" onClick={onSample}>
              みほんを 見てみる
            </button>
          </div>
        </section>
      )}

      <div className="mk-row mk-end">
        <button className="mk-btn" onClick={() => go('parent')}>
          <Users size={20} aria-hidden /> おうちの人へ
        </button>
      </div>
    </>
  );
}

/* ---------- 2. れんしゅう ---------- */

function PracticeView(props: { cards: Card[]; onFinish: (seconds: number) => void }) {
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
            : '（モック）おすと ろくおんした ことに なります'}
        </p>
      </section>

      <section className="mk-panel">
        <h2 className="mk-h2">話す じゅんばん</h2>
        <ol className="mk-cue">
          {cards.map((c) => (
            <li key={c.id} className="mk-card">
              <span className="mk-pill">{laneLabel(c.lane)}</span>
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

function StageView(props: { cards: Card[]; onDone: () => void; onExit: () => void }) {
  const { cards, onDone, onExit } = props;
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const card = cards[index];
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
        {card.picture ? (
          <img className="mk-stage-picture" src={card.picture} alt="つけた 絵" />
        ) : (
          <div className="mk-stage-picture is-empty">（絵は なし）</div>
        )}
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

function ParentView(props: {
  childName: string;
  title: string;
  attempts: Attempt[];
  go: (v: View) => void;
}) {
  const { childName, title, attempts, go } = props;
  const first = attempts[0];
  const latest = attempts[attempts.length - 1];
  return (
    <>
      <section className="mk-panel">
        <h1 className="mk-title">おうちの方へ</h1>
        <p className="mk-note">
          {childName}さん ・「{title}」・ 発表まであと5日 ・ 練習 {attempts.length}回
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
