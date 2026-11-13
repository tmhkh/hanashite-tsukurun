import { describe, it, expect } from 'vitest';
import {
  TEMPLATES,
  canPractice,
  checkStructure,
  emptyProject,
  estimateSeconds,
  makeCard,
  makeKeyword,
  orderedCards,
  sampleProject,
  splitText,
  type Card,
  type Lane,
  type Project,
} from './makeModel';

const card = (text: string, lane: Lane, picture: string | null = null): Card => ({
  ...makeCard(text, null),
  lane,
  picture,
});

const project = (cards: Card[], targetSeconds = 120): Project => ({
  ...emptyProject(),
  title: 'テスト',
  targetSeconds,
  cards,
});

const levels = (p: Project) => checkStructure(p).map((i) => i.level);

describe('makeKeyword', () => {
  it('最初の区切りまでを、14文字以内で取り出す。話し出しは飛ばす', () => {
    expect(makeKeyword('しらべたのは、カブトムシの くらし')).toBe('カブトムシのくらし');
    expect(makeKeyword('まず、テントを たてた')).toBe('テントをたてた');
    expect(makeKeyword('8月に 山の キャンプ場へ、みんなで 行った')).toBe('8月に山のキャンプ場へ');
    expect(makeKeyword('夜に なると 元気に うごく')).toBe('夜になると元気にうごく');
    expect(makeKeyword('あ'.repeat(30))).toHaveLength(14);
  });
});

describe('splitText', () => {
  it('まん中に近い区切りで2つに分け、どちらも空にならない', () => {
    expect(splitText('あさ早く おきて、森に 行って カブトムシを さがした')).toEqual([
      'あさ早く おきて、森に 行って',
      'カブトムシを さがした',
    ]);
    const [a, b] = splitText('くぎりのないながいことば');
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
    expect(a + b).toBe('くぎりのないながいことば');
  });
});

describe('ならべた カード', () => {
  it('「はじめ→なか→おわり」の順に並び、置いていないカードは含めない', () => {
    const cards = [card('おわり', 'end'), card('まだ', 'pool'), card('はじめ', 'start'), card('なか', 'middle')];
    expect(orderedCards(cards).map((c) => c.text)).toEqual(['はじめ', 'なか', 'おわり']);
  });

  it('3つすべてに1枚以上あるときだけ、れんしゅうに進める', () => {
    expect(canPractice([card('a', 'start'), card('b', 'middle')])).toBe(false);
    expect(canPractice([card('a', 'start'), card('b', 'middle'), card('c', 'end')])).toBe(true);
  });

  it('時間のめやすは、置いたカードの文字数と枚数から出す', () => {
    const cards = [card('あ'.repeat(50), 'start'), card('い'.repeat(50), 'pool')];
    expect(estimateSeconds(cards)).toBe(12);
  });
});

describe('checkStructure', () => {
  it('何も置いていなければ、3つとも「つぎは これ」になる', () => {
    expect(levels(project([card('a', 'pool')]))).toEqual(['todo', 'todo', 'todo']);
  });

  it('見本の発表は、足りないところが無い', () => {
    expect(levels(sampleProject())).not.toContain('todo');
  });

  it('「なか」が1枚だけ・1か所に多すぎる・長すぎるカードはヒントで知らせる', () => {
    const texts = (p: Project) => checkStructure(p).map((i) => i.text).join('\n');
    const base = [card('a', 'start'), card('b', 'middle'), card('c', 'end')];
    expect(texts(project(base))).toContain('もう1まい');

    const crowded = [...base, ...['d', 'e', 'f', 'g'].map((t) => card(t, 'middle'))];
    expect(texts(project(crowded))).toContain('「なか」が 5まい');

    const long = [...base, card('な'.repeat(60), 'middle')];
    expect(texts(project(long))).toContain('2まいに 分ける');
  });

  it('目標時間をこえそうなら知らせ、絵が1枚あれば絵のヒントは出さない', () => {
    const base = [card('あ'.repeat(200), 'start'), card('b', 'middle'), card('c', 'end')];
    const texts = (p: Project) => checkStructure(p).map((i) => i.text).join('\n');
    expect(texts(project(base, 30))).toContain('時間が 長く なりそう');
    expect(texts(project(base))).toContain('絵や しゃしん');
    const withPicture = [card('a', 'start', 'data:image/png;base64,x'), ...base.slice(1)];
    expect(texts(project(withPicture))).not.toContain('絵や しゃしん');
  });
});

describe('TEMPLATES', () => {
  it('どの型も「はじめ・なか・おわり」の質問を持ち、質問の id は重ならない', () => {
    const ids = TEMPLATES.flatMap((t) => t.questions.map((x) => x.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TEMPLATES) {
      for (const lane of ['start', 'middle', 'end']) {
        expect(t.questions.some((x) => x.lane === lane)).toBe(true);
      }
    }
  });
});
