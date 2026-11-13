import { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  List,
  Pencil,
  Shuffle,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  ENOUGH_CARDS,
  FOLLOW_UPS,
  LANES,
  TARGET_CHOICES,
  TEMPLATES,
  canPractice,
  checkStructure,
  estimateSeconds,
  laneLabel,
  makeCard,
  orderedCards,
  templateOf,
  type Card,
  type Lane,
  type PlacedLane,
  type Project,
} from './makeModel';
import { CardEditor, DrawPad, VoiceInput, fileToDataUrl } from './makeParts';

/**
 * 「つくる」の流れ：テーマ → あつめる → ならべる → たしかめる。
 * 子どもの言葉をカードにし、子ども自身が組み立てる。AI は文を書かない。
 */

type Step = 'setup' | 'collect' | 'arrange' | 'check';
type Update = (fn: (project: Project) => Project) => void;

const STEPS: { id: Step; label: string }[] = [
  { id: 'setup', label: '1 テーマ' },
  { id: 'collect', label: '2 あつめる' },
  { id: 'arrange', label: '3 ならべる' },
  { id: 'check', label: '4 たしかめる' },
];

function mmss(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function firstStep(project: Project): Step {
  if (!project.title) return 'setup';
  if (project.cards.length < ENOUGH_CARDS) return 'collect';
  return 'arrange';
}

export default function MakeFlow(props: {
  project: Project;
  update: Update;
  saved: boolean;
  onPractice: () => void;
}) {
  const { project, update, saved, onPractice } = props;
  const [step, setStep] = useState<Step>(() => firstStep(project));
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = project.cards.find((c) => c.id === editingId) ?? null;

  const patchCard = (id: string, patch: Partial<Card>) =>
    update((p) => ({ ...p, cards: p.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

  const splitCard = (id: string, first: string, second: string) =>
    update((p) => ({
      ...p,
      cards: p.cards.flatMap((c) => {
        if (c.id !== id) return [c];
        const head = { ...c, text: first, keyword: makeCard(first, null).keyword };
        const tail = { ...makeCard(second, c.suggest), lane: c.lane };
        return [head, tail];
      }),
    }));

  return (
    <>
      <nav className="mk-steps" aria-label="つくる じゅんばん">
        {STEPS.map((s) => (
          <button
            key={s.id}
            className={`mk-chip${s.id === step ? ' is-on' : ''}`}
            aria-current={s.id === step ? 'step' : undefined}
            disabled={s.id !== 'setup' && !project.title}
            onClick={() => setStep(s.id)}
          >
            {s.label}
          </button>
        ))}
        <span className="mk-note" role="status">
          {saved
            ? 'じどうで ほぞん しているよ'
            : 'ほぞん できなかったよ（しゃしんが 多すぎるかも）'}
        </span>
      </nav>

      {step === 'setup' && (
        <SetupStep project={project} update={update} onNext={() => setStep('collect')} />
      )}
      {step === 'collect' && (
        <CollectStep
          project={project}
          update={update}
          onEdit={setEditingId}
          onNext={() => setStep('arrange')}
        />
      )}
      {step === 'arrange' && (
        <ArrangeStep
          project={project}
          update={update}
          patchCard={patchCard}
          onEdit={setEditingId}
          onBack={() => setStep('collect')}
          onNext={() => setStep('check')}
        />
      )}
      {step === 'check' && (
        <CheckStep project={project} onBack={() => setStep('arrange')} onPractice={onPractice} />
      )}

      {editing && (
        <CardEditor
          key={editing.id}
          card={editing}
          onClose={() => setEditingId(null)}
          onSave={(patch) => {
            patchCard(editing.id, patch);
            setEditingId(null);
          }}
          onSplit={(first, second) => {
            splitCard(editing.id, first, second);
            setEditingId(null);
          }}
          onDelete={() => {
            update((p) => ({ ...p, cards: p.cards.filter((c) => c.id !== editing.id) }));
            setEditingId(null);
          }}
        />
      )}
    </>
  );
}

/* ---------- 1. テーマ ---------- */

function SetupStep(props: { project: Project; update: Update; onNext: () => void }) {
  const { project, update, onNext } = props;
  return (
    <>
      <section className="mk-panel mk-center">
        <p className="mk-question">なにに ついて はっぴょうする？</p>
        <p className="mk-note">みじかい ことばで だいじょうぶ。あとで かえられるよ</p>
        <VoiceInput
          label="はっぴょうの テーマ"
          rows={1}
          value={project.title}
          placeholder="れい：カブトムシを そだてた"
          onChange={(title) => update((p) => ({ ...p, title }))}
        />
      </section>

      <section className="mk-panel">
        <h2 className="mk-h2">どんな はっぴょう？</h2>
        <p className="mk-note">えらんだ ものに あわせて、しつもんが かわるよ</p>
        <div className="mk-templates" role="group" aria-label="はっぴょうの しゅるい">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              className={`mk-template${t.id === project.templateId ? ' is-on' : ''}`}
              aria-pressed={t.id === project.templateId}
              onClick={() => update((p) => ({ ...p, templateId: t.id }))}
            >
              <span className="mk-h2">{t.label}</span>
              <span className="mk-note">{t.example}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mk-panel">
        <h2 className="mk-h2">どのくらいの 時間で 話す？</h2>
        <div className="mk-row" role="group" aria-label="話す 時間">
          {TARGET_CHOICES.map((seconds) => (
            <button
              key={seconds}
              className={`mk-chip${seconds === project.targetSeconds ? ' is-on' : ''}`}
              aria-pressed={seconds === project.targetSeconds}
              onClick={() => update((p) => ({ ...p, targetSeconds: seconds }))}
            >
              {seconds / 60}分 くらい
            </button>
          ))}
        </div>
      </section>

      <div className="mk-row mk-end">
        <button className="mk-btn is-primary" disabled={!project.title.trim()} onClick={onNext}>
          カードを あつめる <ChevronRight size={20} aria-hidden />
        </button>
      </div>
    </>
  );
}

/* ---------- 2. あつめる ---------- */

function CollectStep(props: {
  project: Project;
  update: Update;
  onEdit: (id: string) => void;
  onNext: () => void;
}) {
  const { project, update, onEdit, onNext } = props;
  const questions = templateOf(project.templateId).questions;
  const firstOpen = questions.find((x) => !project.answered.includes(x.id)) ?? null;

  const [questionId, setQuestionId] = useState<string | null>(firstOpen?.id ?? null);
  /** 「もっと くわしく」で出した追加の質問 */
  const [followUp, setFollowUp] = useState<{ text: string; lane: PlacedLane } | null>(null);
  const [draft, setDraft] = useState('');
  const [showList, setShowList] = useState(false);

  const question = questions.find((x) => x.id === questionId) ?? null;
  const lastCard = project.cards[project.cards.length - 1] ?? null;
  const lane: PlacedLane | null = followUp?.lane ?? question?.lane ?? null;
  const enough = project.cards.length >= ENOUGH_CARDS;

  const nextQuestion = (after: string | null, answered: string[]) => {
    const start = questions.findIndex((x) => x.id === after) + 1;
    const rotated = [...questions.slice(start), ...questions.slice(0, start)];
    return rotated.find((x) => !answered.includes(x.id) && x.id !== after)?.id ?? null;
  };

  const addCard = () => {
    if (!draft.trim()) return;
    const answered =
      followUp || !question || project.answered.includes(question.id)
        ? project.answered
        : [...project.answered, question.id];
    update((p) => ({ ...p, answered, cards: [...p.cards, makeCard(draft, lane)] }));
    setDraft('');
    if (followUp) return setFollowUp(null);
    setQuestionId(nextQuestion(questionId, answered));
  };

  return (
    <>
      <section className="mk-panel mk-center">
        <p className="mk-step">話した ことばが そのまま カードに なるよ</p>
        {followUp ? (
          <>
            <span className="mk-pill">「{lastCard?.keyword}」を もっと くわしく</span>
            <p className="mk-question">{followUp.text}</p>
          </>
        ) : question ? (
          <>
            <span className="mk-pill">
              しつもん {questions.indexOf(question) + 1} / {questions.length}
            </span>
            <p className="mk-question">{question.text}</p>
            <p className="mk-why">
              <Lightbulb size={14} aria-hidden /> どうして きくの？ … {question.why}
            </p>
          </>
        ) : (
          <>
            <p className="mk-question">しつもんに ぜんぶ こたえたよ！</p>
            <p className="mk-note">ほかに 話したい ことが あれば、じゆうに カードを たせるよ</p>
          </>
        )}

        {question && !followUp && (
          <div className="mk-row mk-centered" role="group" aria-label="話しはじめの ヒント">
            <span className="mk-note">話しはじめの ヒント：</span>
            {question.starters.map((starter) => (
              <button key={starter} className="mk-chip" onClick={() => setDraft(draft + starter)}>
                {starter}
              </button>
            ))}
          </div>
        )}

        <VoiceInput
          label="こたえ"
          value={draft}
          onChange={setDraft}
          placeholder="ここに 話した ことばが 出るよ。なおしても いいよ"
        />

        <div className="mk-row mk-centered">
          <button className="mk-btn is-primary" disabled={!draft.trim()} onClick={addCard}>
            <Check size={20} aria-hidden /> カードに する
          </button>
          {draft && (
            <button className="mk-btn" onClick={() => setDraft('')}>
              やりなおす
            </button>
          )}
        </div>

        <div className="mk-row mk-centered">
          {followUp ? (
            <button className="mk-chip" onClick={() => setFollowUp(null)}>
              もとの しつもんに もどる
            </button>
          ) : (
            question && (
              <button
                className="mk-chip"
                onClick={() => setQuestionId(nextQuestion(questionId, project.answered) ?? questionId)}
              >
                <Shuffle size={14} aria-hidden /> べつの しつもんに する
              </button>
            )
          )}
          <button className="mk-chip" aria-expanded={showList} onClick={() => setShowList(!showList)}>
            <List size={14} aria-hidden /> しつもんを えらぶ
          </button>
        </div>

        {showList && (
          <ul className="mk-qlist">
            {questions.map((x) => (
              <li key={x.id}>
                <button
                  className={`mk-chip${x.id === questionId && !followUp ? ' is-on' : ''}`}
                  onClick={() => {
                    setFollowUp(null);
                    setQuestionId(x.id);
                    setShowList(false);
                  }}
                >
                  {project.answered.includes(x.id) && <Check size={14} aria-label="こたえた" />}
                  <span className="mk-pill">{laneLabel(x.lane)}</span>
                  {x.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {lastCard && !followUp && (
        <section className="mk-panel">
          <h2 className="mk-h2">
            <Sparkles size={18} aria-hidden /> 「{lastCard.keyword}」を もっと くわしく 話す
          </h2>
          <p className="mk-note">くわしい カードが ふえると、「なか」が おもしろく なるよ</p>
          <div className="mk-row">
            {FOLLOW_UPS.map((f) => (
              <button
                key={f.label}
                className="mk-chip"
                onClick={() => setFollowUp({ text: f.text, lane: lastCard.suggest ?? 'middle' })}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mk-panel">
        <div className="mk-row mk-between">
          <h2 className="mk-h2">あつまった カード {project.cards.length}まい</h2>
          <button className="mk-btn is-primary" disabled={!enough} onClick={onNext}>
            {enough
              ? 'カードを ならべる'
              : `あと ${ENOUGH_CARDS - project.cards.length}まいで ならべられるよ`}
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
        <div
          className="mk-meter"
          role="progressbar"
          aria-label="カードの たまりぐあい"
          aria-valuemin={0}
          aria-valuemax={ENOUGH_CARDS}
          aria-valuenow={Math.min(project.cards.length, ENOUGH_CARDS)}
        >
          <span style={{ width: `${Math.min(project.cards.length / ENOUGH_CARDS, 1) * 100}%` }} />
        </div>
        {project.cards.length === 0 ? (
          <p className="mk-note">まだ カードは ないよ。しつもんに こたえてみよう</p>
        ) : (
          <>
            <p className="mk-note">カードを タッチすると、なおしたり 分けたり できるよ</p>
            <ul className="mk-cards">
              {project.cards.map((c) => (
                <li key={c.id}>
                  <button
                    className="mk-card is-button"
                    onClick={() => onEdit(c.id)}
                    aria-label={`${c.text} を なおす`}
                  >
                    {c.text}
                    <Pencil size={14} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}

/* ---------- 3. ならべる ---------- */

function ArrangeStep(props: {
  project: Project;
  update: Update;
  patchCard: (id: string, patch: Partial<Card>) => void;
  onEdit: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { project, update, patchCard, onEdit, onBack, onNext } = props;
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [photoTrouble, setPhotoTrouble] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const cards = project.cards;
  const picked = cards.find((c) => c.id === pickedId) ?? null;
  const pool = cards.filter((c) => c.lane === 'pool');
  const suggestable = pool.filter((c) => c.suggest !== null);

  const moveTo = (lane: Lane) => {
    if (!picked) return;
    // 置いた順に並ぶよう、動かしたカードを末尾へ回す
    update((p) => ({
      ...p,
      cards: [...p.cards.filter((c) => c.id !== picked.id), { ...picked, lane }],
    }));
    setPickedId(null);
  };

  /** 同じ置き場所の中で、前（-1）か後ろ（+1）へ1つ動かす */
  const shift = (dir: -1 | 1) => {
    if (!picked) return;
    update((p) => {
      const sameLane = p.cards.filter((c) => c.lane === picked.lane);
      const other = sameLane[sameLane.findIndex((c) => c.id === picked.id) + dir];
      if (!other) return p;
      return {
        ...p,
        cards: p.cards.map((c) => (c.id === picked.id ? other : c.id === other.id ? picked : c)),
      };
    });
  };

  const placeSuggested = () =>
    update((p) => ({
      ...p,
      cards: [
        ...p.cards.filter((c) => !(c.lane === 'pool' && c.suggest)),
        ...p.cards
          .filter((c) => c.lane === 'pool' && c.suggest)
          .map((c) => ({ ...c, lane: c.suggest as Lane })),
      ],
    }));

  const onPhoto = async (file: File | undefined) => {
    if (!file || !picked) return;
    try {
      patchCard(picked.id, { picture: await fileToDataUrl(file) });
      setPhotoTrouble(false);
    } catch {
      setPhotoTrouble(true);
    }
  };

  const renderCard = (c: Card) => (
    <li key={c.id}>
      <button
        className={`mk-card is-button${c.id === pickedId ? ' is-picked' : ''}`}
        aria-pressed={c.id === pickedId}
        onClick={() => setPickedId(c.id === pickedId ? null : c.id)}
      >
        {c.picture && <img className="mk-thumb" src={c.picture} alt="つけた 絵" />}
        <span>{c.text}</span>
        {c.lane === 'pool' && c.suggest && (
          <span className="mk-pill">「{laneLabel(c.suggest)}」が おすすめ</span>
        )}
      </button>
    </li>
  );

  const samePlace = picked ? cards.filter((c) => c.lane === picked.lane) : [];
  const position = picked ? samePlace.findIndex((c) => c.id === picked.id) : -1;

  return (
    <>
      <GuidePanel project={project} />

      <section className="mk-panel">
        <p className="mk-step">
          {picked
            ? '「はじめ・なか・おわり」の どこに おく？ おきたい ところを タッチ'
            : 'カードを タッチして えらぼう'}
        </p>
        <div className="mk-row mk-between">
          <h2 className="mk-h2">まだ おいていない カード</h2>
          {suggestable.length > 0 && (
            <button className="mk-chip" onClick={placeSuggested}>
              <Sparkles size={14} aria-hidden /> まよったら：おすすめで おく
            </button>
          )}
        </div>
        {pool.length === 0 ? (
          <p className="mk-note">
            ぜんぶ おいたよ。つかわない カードは ここに もどしても いいよ
          </p>
        ) : (
          <ul className="mk-cards">{pool.map(renderCard)}</ul>
        )}
      </section>

      <div className="mk-lanes">
        {LANES.map((lane) => (
          <section key={lane.id} className="mk-panel mk-lane">
            <button
              className={`mk-lane-head${picked ? ' is-target' : ''}`}
              onClick={() => moveTo(lane.id)}
              disabled={!picked}
              aria-label={`${lane.label}に おく`}
            >
              <span className="mk-h2">{lane.label}</span>
              <span className="mk-note">{lane.hint}</span>
            </button>
            <ul className="mk-cards is-column">
              {cards.filter((c) => c.lane === lane.id).map(renderCard)}
            </ul>
          </section>
        ))}
      </div>

      <div className="mk-row mk-between">
        <button className="mk-btn" onClick={onBack}>
          <ChevronLeft size={20} aria-hidden /> もっと あつめる
        </button>
        <button className="mk-btn is-primary" disabled={!canPractice(cards)} onClick={onNext}>
          {canPractice(cards) ? 'できたか たしかめる' : '3つ ぜんぶに 1まいずつ おこう'}
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>

      {picked && (
        <section className="mk-actionbar" aria-label="えらんだ カードで できること">
          <p className="mk-step">えらんだ カード：{picked.keyword}</p>
          <div className="mk-row">
            {/* 画面を上下に動かさなくても置けるよう、置き場所のボタンもここに出す */}
            {LANES.filter((lane) => lane.id !== picked.lane).map((lane) => (
              <button
                key={lane.id}
                className="mk-chip is-on"
                onClick={() => moveTo(lane.id)}
                aria-label={`${lane.label}へ うごかす`}
              >
                「{lane.label}」へ
              </button>
            ))}
          </div>
          <div className="mk-row">
            {picked.lane !== 'pool' && (
              <>
                <button
                  className="mk-chip"
                  disabled={position <= 0}
                  onClick={() => shift(-1)}
                  aria-label="前に うごかす"
                >
                  <ArrowUp size={14} aria-hidden /> 前へ
                </button>
                <button
                  className="mk-chip"
                  disabled={position >= samePlace.length - 1}
                  onClick={() => shift(1)}
                  aria-label="後ろに うごかす"
                >
                  <ArrowDown size={14} aria-hidden /> 後ろへ
                </button>
                <button className="mk-chip" onClick={() => moveTo('pool')}>
                  つかわない（もどす）
                </button>
              </>
            )}
            <button className="mk-chip" onClick={() => onEdit(picked.id)}>
              <Pencil size={14} aria-hidden /> ことばを なおす
            </button>
            <button className="mk-chip" onClick={() => setDrawingId(picked.id)}>
              <Pencil size={14} aria-hidden /> 絵を かく
            </button>
            <button className="mk-chip" onClick={() => fileRef.current?.click()}>
              <Camera size={14} aria-hidden /> しゃしんを つける
            </button>
            {picked.picture && (
              <button className="mk-chip" onClick={() => patchCard(picked.id, { picture: null })}>
                絵を はずす
              </button>
            )}
          </div>
          {photoTrouble && <p className="mk-note">しゃしんを 読みこめなかったよ</p>}
        </section>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        aria-label="しゃしんを えらぶ"
        onChange={(e) => {
          void onPhoto(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {drawingId && (
        <DrawPad
          onClose={() => setDrawingId(null)}
          onSave={(picture) => {
            patchCard(drawingId, { picture });
            setDrawingId(null);
          }}
        />
      )}
    </>
  );
}

/* ---------- ガイド（つぎに やること） ---------- */

function GuidePanel(props: { project: Project }) {
  const { project } = props;
  const items = checkStructure(project);
  const seconds = estimateSeconds(project.cards);
  return (
    <section className="mk-panel" aria-label="ガイド">
      <div className="mk-row mk-between">
        <h2 className="mk-h2">
          <Lightbulb size={18} aria-hidden /> ガイド
        </h2>
        <span className="mk-pill">
          話す 時間 だいたい {mmss(seconds)} ／ もくひょう {mmss(project.targetSeconds)}
        </span>
      </div>
      <ul className="mk-checks">
        {items.map((item) => (
          <li key={item.text} className={`is-${item.level}`}>
            <span className="mk-pill">
              {item.level === 'ok' ? 'できた' : item.level === 'todo' ? 'つぎは これ' : 'ヒント'}
            </span>
            {item.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- 4. たしかめる ---------- */

function CheckStep(props: { project: Project; onBack: () => void; onPractice: () => void }) {
  const { project, onBack, onPractice } = props;
  const cards = orderedCards(project.cards);
  const canSpeak = 'speechSynthesis' in window;

  const readAloud = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cards.map((c) => c.text).join('。'));
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      <section className="mk-panel">
        <div className="mk-row mk-between">
          <h1 className="mk-title">{project.title}</h1>
          {canSpeak && (
            <button className="mk-chip" onClick={readAloud}>
              <Volume2 size={14} aria-hidden /> ながれを きいてみる
            </button>
          )}
        </div>
        <p className="mk-note">
          はじめから じゅんばんに 読んでみよう。話が つながっているかな？
        </p>
        <ol className="mk-preview">
          {cards.map((c) => (
            <li key={c.id}>
              <div className="mk-preview-picture">
                {c.picture ? <img src={c.picture} alt="つけた 絵" /> : '絵は なし'}
              </div>
              <span className="mk-pill">{laneLabel(c.lane)}</span>
              <p className="mk-preview-keyword">{c.keyword}</p>
              <p className="mk-note">{c.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <GuidePanel project={project} />

      <div className="mk-row mk-between">
        <button className="mk-btn" onClick={onBack}>
          <ChevronLeft size={20} aria-hidden /> ならべなおす
        </button>
        <button
          className="mk-btn is-primary"
          disabled={!canPractice(project.cards)}
          onClick={onPractice}
        >
          これで れんしゅうする <ChevronRight size={20} aria-hidden />
        </button>
      </div>
    </>
  );
}
