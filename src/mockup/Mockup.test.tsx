import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Mockup from './Mockup';

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const ANSWERS = [
  'しらべたのは、カブトムシの くらし',
  'おじいちゃんの 家の 木で 見つけたから',
  'まいにち ノートに かいた',
  '夜に なると 元気に うごく',
];

/** テーマを決めて、しつもんに4回こたえる */
function collectCards() {
  click(/あたらしい はっぴょうを つくる/);
  type('はっぴょうの テーマ', 'カブトムシ');
  click(/しらべた こと/);
  click(/カードを あつめる/);
  for (const answer of ANSWERS) {
    type('こたえ', answer);
    click(/カードに する/);
  }
}

/** カードを選んで、置き場所に置く */
function place(cardText: string, lane: string) {
  // まだ置いていないカードには「おすすめ」の札も付くので、言葉の部分で探す
  click(new RegExp(cardText));
  click(`${lane}に おく`);
}

describe('Mockup（つくる → れんしゅう → ほんばん）', () => {
  // テスト環境の localStorage は使えないので、メモリ上の保存先に差し替える
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('しつもんに こたえた言葉がカードになり、並べて確かめてから練習・本番まで通せる', () => {
    render(<Mockup />);
    collectCards();
    expect(screen.getByText('あつまった カード 4まい')).toBeInTheDocument();

    // ならべる：3つすべてに置くまで先へ進めず、ガイドが次にやることを言う
    click(/カードを ならべる/);
    expect(screen.getByRole('button', { name: /3つ ぜんぶに/ })).toBeDisabled();
    expect(screen.getByText(/「はじめ」に なんの 話か わかる カードを おこう/)).toBeInTheDocument();
    place(ANSWERS[0], 'はじめ');
    place(ANSWERS[3], 'なか');
    place(ANSWERS[1], 'おわり');
    expect(screen.getByText('「はじめ」に カードが あるね')).toBeInTheDocument();

    // たしかめる：並べた順に、言葉そのままで出る
    click(/できたか たしかめる/);
    const preview = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(preview[0]).toContain(ANSWERS[0]);
    expect(preview[1]).toContain(ANSWERS[3]);
    expect(preview[2]).toContain(ANSWERS[1]);

    // れんしゅう：台本ではなく「おぼえる ことば」だけを見て話す
    click(/これで れんしゅうする/);
    expect(screen.getByText('カブトムシのくらし')).toBeInTheDocument();
    expect(screen.queryByText(ANSWERS[0])).not.toBeInTheDocument();
    click('れんしゅうを はじめる');
    click('話しおわった');
    expect(screen.getByText('3回目の れんしゅう おつかれさま！')).toBeInTheDocument();

    // ほんばん → しつもんタイム → おうちの人へ
    click(/ほんばんへ/);
    click(/つぎ/);
    click(/つぎ/);
    click(/しつもんタイム/);
    click('マイクで こたえる');
    click(/つぎの しつもん/);
    click('マイクで こたえる');
    click(/しつもんタイムを おわる/);
    expect(screen.getByText('今日ほめるポイント')).toBeInTheDocument();
  });

  it('カードの言葉を直す・2枚に分ける・捨てることができる', () => {
    render(<Mockup />);
    collectCards();

    click(`${ANSWERS[2]} を なおす`);
    const dialog = screen.getByRole('dialog', { name: 'カードを なおす' });
    fireEvent.change(within(dialog).getByLabelText(/カードの ことば/), {
      target: { value: 'まいにち ノートに 絵を かいた' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'これで OK' }));
    expect(screen.getByRole('button', { name: 'まいにち ノートに 絵を かいた を なおす' })).toBeInTheDocument();

    click(`${ANSWERS[1]} を なおす`);
    click(/2まいに 分ける/);
    expect(screen.getByText('あつまった カード 5まい')).toBeInTheDocument();

    click(`${ANSWERS[3]} を なおす`);
    click(/カードを すてる/);
    click('ほんとうに すてる');
    expect(screen.getByText('あつまった カード 4まい')).toBeInTheDocument();
  });

  it('「おすすめで おく」で、こたえた しつもんに合う場所へカードが置かれる', () => {
    render(<Mockup />);
    collectCards();
    click(/カードを ならべる/);
    click(/おすすめで おく/);
    // しらべたこと の しつもん1・2は「はじめ」、3・4は「なか」。「おわり」はまだ無い
    expect(screen.getByText('「なか」が くわしく なっているね')).toBeInTheDocument();
    expect(screen.getByText('「おわり」に さいごの ひとことを おこう')).toBeInTheDocument();
  });

  it('作りかけは保存され、開き直しても続きから作れる', () => {
    const first = render(<Mockup />);
    collectCards();
    first.unmount();

    render(<Mockup />);
    expect(screen.getByRole('heading', { name: 'カブトムシ' })).toBeInTheDocument();
    click(/つづきを つくる/);
    expect(screen.getByRole('button', { name: new RegExp(ANSWERS[0]) })).toBeInTheDocument();
  });

  it('まだ作っていなくても、見本で「れんしゅう」を見られる', () => {
    render(<Mockup />);
    click('2 れんしゅう');
    expect(screen.getByText(/みほんの はっぴょうを 出しているよ/)).toBeInTheDocument();
    expect(screen.getByText('カブトムシをそだてた')).toBeInTheDocument();
  });
});
