import type { Step, SlideApiResponse } from '../types';

// VITE_MOCK_MODE 用固定レスポンス
export const MOCK_RESPONSES: Record<Step, SlideApiResponse> = {
  1: {
    slide_title: 'すきなどうぶつ',
    slide_text: 'ぼくはいぬがすきです',
    image_keyword: 'dog',
    ai_response_voice:
      'いいね！いぬの どんなところが すきなの？いちばん おもしろいなって おもうことを おしえて！',
    next_step: 2,
    marp_markdown: '',
    presentation_guide: [],
  },
  2: {
    slide_title: 'いちばん すきなところ',
    slide_text: 'なでるとふわふわでかわいい',
    image_keyword: 'heart',
    ai_response_voice:
      'ふわふわで かわいいんだね！さいごに、いぬと これから どうしたいか、みんなに つたえたい きもちを おしえて！',
    next_step: 3,
    marp_markdown: '',
    presentation_guide: [],
  },
  3: {
    slide_title: 'まとめ',
    slide_text: 'いぬはともだちです',
    image_keyword: 'star',
    ai_response_voice: 'すばらしい はっぴょうが できたよ！',
    next_step: 4,
    marp_markdown: `---
marp: true
theme: default
paginate: true
---

# すきなどうぶつ

ぼくはいぬがすきです

<!-- icon: dog -->

---

# いちばん すきなところ

なでるとふわふわでかわいい

<!-- icon: heart -->

---

# まとめ

いぬはともだちです

<!-- icon: star -->`,
    presentation_guide: [
      {
        page: 1,
        script:
          'みなさん、こんにちは。きょうは ぼくの すきな どうぶつ、いぬについて おはなしします。',
        advice:
          'さいしょに じこしょうかいと テーマを つたえよう。みんなが「なんの はなしかな？」と きになるように はなすのが コツだよ！',
      },
      {
        page: 2,
        script:
          'ぼくが いぬの いちばん すきなところは、なでると ふわふわで かわいいところです。まいにち いっしょに あそんでいます。',
        advice:
          'いちばん つたえたい ことを くわしく はなそう。「いつ」「どこで」「どんなふうに」を いれると、みんなに つたわりやすいよ！',
      },
      {
        page: 3,
        script:
          'いぬは ぼくの だいすきな ともだちです。これからも ずっと なかよく していきたいです。',
        advice:
          'さいごは じぶんの きもちで しめよう。「だから ○○です」「これからも ○○したいです」と まとめると、きいている ひとが なっとく するよ！',
      },
    ],
  },
};
