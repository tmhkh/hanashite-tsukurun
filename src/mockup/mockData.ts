/**
 * モックアップ用の固定データ（「れんしゅう」「ほんばん」「おうちの人へ」で使う）。
 * 録音・ふりかえり・質問タイムはまだ作っていないので、ここの値で代用する。
 */

export const CHILDREN = [
  { id: 'a', name: 'はると', grade: '小3' },
  { id: 'b', name: 'みお', grade: '小1' },
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
    good: 'くわしい 話が ふえたね',
    next: '「えーと」の かわりに ひと休みしてみよう',
  },
];

export const NEW_ATTEMPT: Omit<Attempt, 'no' | 'seconds' | 'said' | 'total'> = {
  day: 'きょう',
  fillers: 3,
  good: '「なか」の ところで 声が 大きくなって、気もちが つたわったよ',
  next: 'さいごの ひとことの 前で、3つ 数えて 休んでみよう',
};

export const FRIEND_QUESTIONS = [
  { q: 'いちばん たいへんだったのは どこ？', a: '毎日 つづけるのが たいへんだったよ' },
  { q: 'つぎは なにを してみたい？', a: 'つぎは べつの しゅるいでも やってみたい' },
];

export const PARENT_NOTE = {
  praise:
    '「なか」の場面で声が自然に大きくなりました。「あそこで気持ちが伝わったよ」と伝えてあげてください。',
  watch: '次は、最後のひとことの前で間を取る練習をします。急がせず待ってあげてください。',
};
