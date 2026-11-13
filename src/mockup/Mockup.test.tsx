import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Mockup from './Mockup';
import { TALK_TURNS } from './mockData';

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

describe('Mockup（つくる → れんしゅう → ほんばん）', () => {
  it('話した言葉がそのままカードになり、並べてから練習・本番・質問タイムまで通せる', () => {
    render(<Mockup />);

    // つくる：話す
    click(/あたらしい はっぴょうを つくる/);
    for (let i = 0; i < 4; i++) click('マイクで話す');
    expect(screen.getByText(TALK_TURNS[0].answer)).toBeInTheDocument();
    expect(screen.getByText('あつまった カード 4まい')).toBeInTheDocument();

    // つくる：ならべる（3つすべてに置くまで先へ進めない）
    click(/カードを ならべる/);
    expect(screen.getByRole('button', { name: /3つ ぜんぶに/ })).toBeDisabled();
    ['はじめに おく', 'なかに おく', 'おわりに おく'].forEach((lane, i) => {
      click(TALK_TURNS[i].answer);
      click(lane);
    });
    click(/3まいで れんしゅうする/);

    // れんしゅう：台本ではなくキーワードだけを見て話す
    expect(screen.getByText(TALK_TURNS[0].keyword)).toBeInTheDocument();
    expect(screen.queryByText(TALK_TURNS[0].answer)).not.toBeInTheDocument();
    click('れんしゅうを はじめる');
    click('話しおわった');

    // ふりかえり：よかったところ1つ・つぎのチャレンジ1つ
    expect(screen.getByText('3回目の れんしゅう おつかれさま！')).toBeInTheDocument();
    expect(screen.getByText('よかった ところ')).toBeInTheDocument();
    expect(screen.getByText('つぎの チャレンジ')).toBeInTheDocument();

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

  it('途中の幕から開いても、並べ終えたカードで見られる', () => {
    render(<Mockup />);
    click('2 れんしゅう');
    expect(screen.getByText('話す じゅんばん')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(2);

    click('3 ほんばん');
    expect(screen.getByText(TALK_TURNS[0].keyword)).toBeInTheDocument();
  });
});
