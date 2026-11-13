/**
 * モックアップ用の固定データ。
 * バックエンドも音声認識も使わず、画面の流れだけを確かめるためのもの。
 */

export type Lane = 'pool' | 'start' | 'middle' | 'end';

export interface TalkCard {
  id: number;
  /** 子どもが話した言葉そのまま */
  text: string;
  /** れんしゅう・ほんばんで見るキーワード */
  keyword: string;
  lane: Lane;
  picture: 'draw' | 'photo' | null;
}

export interface TalkTurn {
  question: string;
  /** なぜこの質問をするのか */
  why: string;
  answer: string;
  keyword: string;
}

export const CHILDREN = [
  { id: 'a', name: 'はると', grade: '小3' },
  { id: 'b', name: 'みお', grade: '小1' },
];

export const TALK_TURNS: TalkTurn[] = [
  {
    question: 'なにについて はっぴょうする？',
    why: 'さいしょに「なんの はなしか」が わかると、きく人が あんしんするよ',
    answer: '夏休みにカブトムシをそだてたこと',
    keyword: 'カブトムシをそだてた',
  },
  {
    question: 'どうして そだてようと 思ったの？',
    why: 'きっかけを 話すと、きく人が きょうみを もってくれるよ',
    answer: 'おじいちゃんの家の木で見つけたから',
    keyword: 'おじいちゃんの家の木',
  },
  {
    question: 'いちばん びっくりしたことは？',
    why: 'びっくりしたことは、はっぴょうの いちばん おもしろい ところに なるよ',
    answer: '夜になるとすごく元気にうごくこと',
    keyword: '夜に元気',
  },
  {
    question: 'たいへんだったことは ある？',
    why: 'たいへんだったことを 話すと、がんばりが つたわるよ',
    answer: 'ゼリーを毎日かえるのがたいへんだった',
    keyword: 'ゼリーを毎日',
  },
  {
    question: 'ほかに おぼえていることは？',
    why: 'カードが 多いと、あとで えらぶのが 楽しくなるよ',
    answer: '土の中にたまごを8こ見つけた',
    keyword: 'たまご8こ',
  },
  {
    question: 'さいごに みんなに つたえたいことは？',
    why: 'さいごの ひとことが、きく人の 心に のこるよ',
    answer: '虫はこわくないから、さわってみてほしい',
    keyword: 'さわってみて',
  },
];

export const LANES: { id: Exclude<Lane, 'pool'>; label: string; hint: string }[] = [
  { id: 'start', label: 'はじめ', hint: 'なんの 話か わかる カード' },
  { id: 'middle', label: 'なか', hint: 'いちばん つたえたい カード' },
  { id: 'end', label: 'おわり', hint: 'さいごの ひとこと' },
];

export interface Attempt {
  no: number;
  day: string;
  seconds: number;
  /** 「えーと」の回数 */
  fillers: number;
  /** 言えたカードの数 */
  said: number;
  total: number;
  good: string;
  next: string;
}

/** これまでの練習（モック）。いちばん新しいものが最後 */
export const PAST_ATTEMPTS: Attempt[] = [
  {
    no: 1,
    day: '11/9',
    seconds: 48,
    fillers: 9,
    said: 3,
    total: 5,
    good: 'さいごまで 話せたね',
    next: 'カードを ぜんぶ 言ってみよう',
  },
  {
    no: 2,
    day: '11/11',
    seconds: 71,
    fillers: 6,
    said: 4,
    total: 5,
    good: 'たまごの 話が ふえたね',
    next: '「えーと」の かわりに ひと休みしてみよう',
  },
];

export const NEW_ATTEMPT: Omit<Attempt, 'no' | 'seconds'> = {
  day: 'きょう',
  fillers: 3,
  said: 5,
  total: 5,
  good: '「夜に元気」の ところで 声が 大きくなって、びっくりが つたわったよ',
  next: 'さいごの ひとことの 前で、3つ 数えて 休んでみよう',
};

export const FRIEND_QUESTIONS = [
  { q: 'カブトムシは なにを 食べるの？', a: 'こん虫ゼリーを食べるよ。バナナも食べる' },
  { q: 'たまごは そのあと どうなったの？', a: 'いまはよう虫になって、土の中にいるよ' },
];

export const PARENT_NOTE = {
  praise:
    '「夜に元気」の場面で声が自然に大きくなりました。「あそこでびっくりが伝わったよ」と伝えてあげてください。',
  watch: '次は、最後のひとことの前で間を取る練習をします。急がせず待ってあげてください。',
};
