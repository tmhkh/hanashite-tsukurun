/**
 * 「つくる」のデータと、ガイドに使う判定ロジック。
 * AI は使わず、型（テンプレート）ごとの質問とルールだけで動く。
 */

export type Lane = 'pool' | 'start' | 'middle' | 'end';
export type PlacedLane = Exclude<Lane, 'pool'>;

export interface Card {
  id: string;
  /** 子どもが話した・書いた言葉そのまま */
  text: string;
  /** れんしゅう・ほんばんで見る、おぼえる ことば */
  keyword: string;
  lane: Lane;
  /** 自分でかいた絵・とった写真（data URL）。無ければ null */
  picture: string | null;
  /** 答えた質問から分かる、おすすめの置き場所 */
  suggest: PlacedLane | null;
}

export type TemplateId = 'research' | 'favorite' | 'event' | 'book' | 'free';

export interface Project {
  title: string;
  templateId: TemplateId;
  /** 発表の目標時間（秒） */
  targetSeconds: number;
  cards: Card[];
  /** 答えた質問の id */
  answered: string[];
}

export interface Question {
  id: string;
  text: string;
  /** なぜこの質問をするのか */
  why: string;
  /** 話し出しのヒント */
  starters: string[];
  lane: PlacedLane;
}

export interface Template {
  id: TemplateId;
  label: string;
  example: string;
  questions: Question[];
}

export const LANES: { id: PlacedLane; label: string; hint: string }[] = [
  { id: 'start', label: 'はじめ', hint: 'なんの 話か わかる カード' },
  { id: 'middle', label: 'なか', hint: 'くわしい 話・いちばん つたえたい こと' },
  { id: 'end', label: 'おわり', hint: 'さいごの ひとこと' },
];

export const laneLabel = (lane: Lane): string =>
  LANES.find((l) => l.id === lane)?.label ?? 'まだ おいていない';

const WHY: Record<PlacedLane, string> = {
  start: 'さいしょに「なんの 話か」が わかると、きく人が あんしんするよ',
  middle: 'くわしい 話が あると、きく人が「へえ！」と 思ってくれるよ',
  end: 'さいごの ひとことが、きく人の 心に のこるよ',
};

function q(
  id: string,
  lane: PlacedLane,
  text: string,
  starters: string[],
  why: string = WHY[lane],
): Question {
  return { id, lane, text, starters, why };
}

export const TEMPLATES: Template[] = [
  {
    id: 'research',
    label: 'しらべた こと',
    example: 'じゆうけんきゅう・かんさつ・しらべ学習',
    questions: [
      q('r1', 'start', 'なにを しらべたの？ ひとことで 言うと？', ['しらべたのは、', 'テーマは、']),
      q(
        'r2',
        'start',
        'どうして それを しらべようと 思ったの？',
        ['きっかけは、', 'ふしぎだと 思ったのは、'],
        'きっかけを 話すと、きく人が きょうみを もってくれるよ',
      ),
      q('r3', 'middle', 'どうやって しらべたの？', ['まず、', 'つぎに、', 'つかった ものは、']),
      q('r4', 'middle', 'しらべて わかった ことは なに？', ['わかったのは、', 'くらべてみると、']),
      q(
        'r5',
        'middle',
        'いちばん びっくりした ことは？',
        ['いちばん びっくりしたのは、'],
        'びっくりした ことは、はっぴょうの いちばん おもしろい ところに なるよ',
      ),
      q(
        'r6',
        'middle',
        'たいへんだった ことは ある？',
        ['たいへんだったのは、', 'うまく いかなかったのは、'],
        'たいへんだった ことを 話すと、がんばりが つたわるよ',
      ),
      q('r7', 'end', 'みんなに つたえたい ことは？', ['みんなも、', 'つぎは、']),
    ],
  },
  {
    id: 'favorite',
    label: 'すきな もの',
    example: 'たからもの・とくいな こと・すきな 生きもの',
    questions: [
      q('f1', 'start', 'すきな ものは なに？ ひとことで 言うと？', ['すきな ものは、', 'たからものは、']),
      q('f2', 'start', 'いつから すきなの？ きっかけは？', ['すきに なったのは、', 'きっかけは、']),
      q('f3', 'middle', 'どんな ところが すき？', ['すきな ところは、', 'すごいのは、']),
      q('f4', 'middle', 'いちばんの 思い出は？', ['いちばんの 思い出は、']),
      q(
        'f5',
        'middle',
        'しらない 人に 教えるなら、なにを 教えたい？',
        ['じつは、', 'しってほしいのは、'],
        'みんなが しらない ことを 話すと、「へえ！」と 思ってもらえるよ',
      ),
      q('f6', 'end', 'これから どうしたい？ みんなに ひとこと！', ['これからは、', 'みんなも、']),
    ],
  },
  {
    id: 'event',
    label: 'できごと・思い出',
    example: '夏休み・えんそく・ならいごと',
    questions: [
      q('e1', 'start', 'なにが あったの？ ひとことで 言うと？', ['話すのは、', 'この前、']),
      q('e2', 'start', 'いつ、どこで、だれと？', ['行ったのは、', 'いっしょに いたのは、']),
      q('e3', 'middle', 'さいしょに なにを した？', ['さいしょに、', 'ついたら、']),
      q(
        'e4',
        'middle',
        'いちばん 心に のこった ことは？',
        ['いちばん 心に のこったのは、'],
        'いちばんの 場めんを くわしく 話すと、きく人も その 場に いる 気もちに なるよ',
      ),
      q('e5', 'middle', 'その とき どんな 気もちだった？', ['その とき、', 'うれしかったのは、']),
      q('e6', 'middle', 'こまった ことや しっぱいは あった？', ['こまったのは、', 'しっぱいしたのは、']),
      q('e7', 'end', 'やってみて どう 思った？ つぎは どうしたい？', ['やってみて、', 'つぎは、']),
    ],
  },
  {
    id: 'book',
    label: '読んだ 本',
    example: '本の しょうかい・かんそう',
    questions: [
      q('b1', 'start', 'なんと いう 本？ だれが 書いたの？', ['しょうかいする 本は、']),
      q('b2', 'start', 'どうして その 本を えらんだの？', ['えらんだ わけは、']),
      q('b3', 'middle', 'どんな お話？ みじかく 言うと？', ['この 本は、', '出てくるのは、']),
      q('b4', 'middle', 'いちばん すきな 場めんは？', ['いちばん すきなのは、']),
      q('b5', 'middle', '読んで どう 思った？', ['読んで、', 'じぶんだったら、']),
      q('b6', 'end', 'どんな 人に おすすめ？', ['おすすめしたいのは、', 'ぜひ、']),
    ],
  },
  {
    id: 'free',
    label: 'じゆうに',
    example: 'なんでも OK',
    questions: [
      q('x1', 'start', 'なにに ついて 話す？ ひとことで 言うと？', ['話すのは、']),
      q('x2', 'start', 'どうして それを 話したいの？', ['話したい わけは、']),
      q('x3', 'middle', 'いちばん つたえたい ことは？', ['いちばん つたえたいのは、']),
      q('x4', 'middle', 'くわしく 言うと？ たとえば？', ['たとえば、', 'くわしく 言うと、']),
      q('x5', 'middle', 'おもしろい ところは？', ['おもしろいのは、']),
      q('x6', 'end', 'さいごに ひとこと！', ['さいごに、', 'みんなも、']),
    ],
  },
];

export const templateOf = (id: TemplateId): Template =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[TEMPLATES.length - 1];

/** いま出したカードを、もっとくわしくするための質問 */
export const FOLLOW_UPS: { label: string; text: string }[] = [
  { label: 'いつ？', text: 'それは いつの こと？' },
  { label: 'どこで？', text: 'それは どこでの こと？' },
  { label: 'だれと？', text: 'だれと いっしょだった？' },
  { label: 'どんな 気もち？', text: 'その とき どんな 気もちだった？' },
  { label: 'どうして？', text: 'どうして そう なったの？ どうして そう 思ったの？' },
  { label: 'たとえば？', text: 'たとえば どんな こと？' },
];

/** カードがこれだけあれば、ならべ始められる */
export const ENOUGH_CARDS = 4;
/** 1枚のカードが長すぎるとみなす文字数 */
export const LONG_CARD = 45;
/** 1つの置き場所に置く枚数の上限のめやす */
export const LANE_MAX = 4;
export const TARGET_CHOICES = [60, 120, 180];

export function emptyProject(): Project {
  return { title: '', templateId: 'free', targetSeconds: 120, cards: [], answered: [] };
}

let idCounter = 0;
export function newId(): string {
  idCounter += 1;
  return `c${Date.now().toString(36)}${idCounter}`;
}

/** カードの言葉から「おぼえる ことば」を作る（あとで子どもが直せる） */
export function makeKeyword(text: string): string {
  const trimmed = text.replace(/\s+/g, '');
  const parts = trimmed.split(/[、。，．！？!?]/).filter((part) => part.length > 0);
  const [head = trimmed, next] = parts;
  // 「いちばん びっくりしたのは、」「まず、」のような話し出しは飛ばして、中身のほうを取る
  const leadIn = head.endsWith('は') || head.length <= 5;
  return (leadIn && next ? next : head).slice(0, 14);
}

export function makeCard(text: string, suggest: PlacedLane | null): Card {
  const clean = text.trim();
  return { id: newId(), text: clean, keyword: makeKeyword(clean), lane: 'pool', picture: null, suggest };
}

/** 長い言葉を、まん中に近い区切りで2つに分ける */
export function splitText(text: string): [string, string] {
  const clean = text.trim();
  const mid = clean.length / 2;
  let best = -1;
  for (let i = 1; i < clean.length - 1; i++) {
    if (!/[、。，．！？!?\s]/.test(clean[i])) continue;
    if (best < 0 || Math.abs(i - mid) < Math.abs(best - mid)) best = i;
  }
  const at = best < 0 ? Math.ceil(mid) : best + 1;
  return [clean.slice(0, at).trim(), clean.slice(at).trim()];
}

export function orderedCards(cards: Card[]): Card[] {
  return LANES.flatMap((l) => cards.filter((c) => c.lane === l.id));
}

/** 置いたカードを読み上げるのにかかる時間のめやす（1秒に5文字＋カードごとの間） */
export function estimateSeconds(cards: Card[]): number {
  const placed = orderedCards(cards);
  const chars = placed.reduce((sum, c) => sum + c.text.length, 0);
  return Math.round(chars / 5 + placed.length * 2);
}

/** 「はじめ・なか・おわり」のすべてに1枚以上あれば、れんしゅうに進める */
export function canPractice(cards: Card[]): boolean {
  return LANES.every((l) => cards.some((c) => c.lane === l.id));
}

export interface CheckItem {
  /** ok: できている / todo: これをやろう / tip: やるともっとよくなる */
  level: 'ok' | 'todo' | 'tip';
  text: string;
}

/** ならべ方を見て、次にやることを子どもの言葉で返す */
export function checkStructure(project: Project): CheckItem[] {
  const count = (lane: Lane) => project.cards.filter((c) => c.lane === lane).length;
  const items: CheckItem[] = [];

  items.push(
    count('start') > 0
      ? { level: 'ok', text: '「はじめ」に カードが あるね' }
      : { level: 'todo', text: '「はじめ」に なんの 話か わかる カードを おこう' },
  );
  if (count('middle') === 0) {
    items.push({ level: 'todo', text: '「なか」に いちばん つたえたい カードを おこう' });
  } else if (count('middle') === 1) {
    items.push({ level: 'tip', text: '「なか」に もう1まい あると、くわしく つたわるよ' });
  } else {
    items.push({ level: 'ok', text: '「なか」が くわしく なっているね' });
  }
  items.push(
    count('end') > 0
      ? { level: 'ok', text: '「おわり」の ひとことが あるね' }
      : { level: 'todo', text: '「おわり」に さいごの ひとことを おこう' },
  );

  const crowded = LANES.find((l) => count(l.id) > LANE_MAX);
  if (crowded) {
    items.push({
      level: 'tip',
      text: `「${crowded.label}」が ${count(crowded.id)}まい あるよ。${LANE_MAX}まいまでに すると おぼえやすいよ`,
    });
  }

  const long = orderedCards(project.cards).find((c) => c.text.length > LONG_CARD);
  if (long) {
    items.push({ level: 'tip', text: `「${long.keyword}」の カードが 長いよ。2まいに 分けると 話しやすいよ` });
  }

  const seconds = estimateSeconds(project.cards);
  if (seconds > project.targetSeconds) {
    items.push({ level: 'tip', text: '時間が 長く なりそう。つかわない カードを もどしてみよう' });
  } else if (canPractice(project.cards) && seconds < project.targetSeconds * 0.3) {
    items.push({ level: 'tip', text: '時間に まだ ゆとりが あるよ。「なか」の カードを ふやせるよ' });
  }

  if (canPractice(project.cards) && orderedCards(project.cards).every((c) => c.picture === null)) {
    items.push({ level: 'tip', text: '絵や しゃしんを 1まい つけると、もっと つたわるよ' });
  }
  return items;
}

/* ---------- 保存（このブラウザの中だけ） ---------- */

const STORAGE_KEY = 'hanashite-mockup-project-v1';

export function loadProject(): Project {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProject();
    const data = JSON.parse(raw) as Partial<Project>;
    if (!Array.isArray(data.cards)) return emptyProject();
    return { ...emptyProject(), ...data } as Project;
  } catch {
    return emptyProject();
  }
}

/** 保存できたら true。容量オーバーなどで保存できなければ false */
export function saveProject(project: Project): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    return true;
  } catch {
    return false;
  }
}

/* ---------- 見本 ---------- */

const SAMPLE: [string, string, Lane][] = [
  ['夏休みにカブトムシをそだてたこと', 'カブトムシをそだてた', 'start'],
  ['おじいちゃんの家の木で見つけたから', 'おじいちゃんの家の木', 'start'],
  ['夜になるとすごく元気にうごくこと', '夜に元気', 'middle'],
  ['ゼリーを毎日かえるのがたいへんだった', 'ゼリーを毎日', 'pool'],
  ['土の中にたまごを8こ見つけた', 'たまご8こ', 'middle'],
  ['虫はこわくないから、さわってみてほしい', 'さわってみて', 'end'],
];

export function sampleProject(): Project {
  return {
    title: 'カブトムシを そだてた',
    templateId: 'research',
    targetSeconds: 120,
    answered: ['r1', 'r2', 'r5', 'r6', 'r4', 'r7'],
    cards: SAMPLE.map(([text, keyword, lane], i) => ({
      id: `sample${i}`,
      text,
      keyword,
      lane,
      picture: null,
      suggest: lane === 'pool' ? 'middle' : lane,
    })),
  };
}
