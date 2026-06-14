import type { Step, SlideApiResponse } from '../types';

// VITE_MOCK_MODE 用固定レスポンス
// Step 3 の script は 100 文字以上 400 文字以内
export const MOCK_RESPONSES: Record<Step, SlideApiResponse> = {
  1: {
    slide_title: 'すきなどうぶつ',
    slide_text: 'ぼくはいぬがすきです',
    image_keyword: 'dog',
    ai_response_voice: 'いいね！どんなところがすきなの？',
    next_step: 2,
    script: '',
  },
  2: {
    slide_title: 'どんなところがすき？',
    slide_text: 'なでるとふわふわでかわいい',
    image_keyword: 'heart',
    ai_response_voice: 'すてきだね！さいごにまとめを話してね',
    next_step: 3,
    script: '',
  },
  3: {
    slide_title: 'まとめ',
    slide_text: 'いぬはともだちです',
    image_keyword: 'star',
    ai_response_voice: 'すばらしいはっぴょうができたよ！',
    next_step: 4,
    // 100文字以上400文字以内（139文字）
    script:
      'わたしはいぬがすきです。いぬはふわふわしていてなでるとかわいいです。いぬをなでるとしっぽをふってよろこびます。そのかおがとてもかわいいです。いぬはいつもわたしのそばにいてくれます。さびしいときもいっしょにいてくれるので、とてもうれしいです。いぬはわたしのだいすきなともだちです。',
  },
};
