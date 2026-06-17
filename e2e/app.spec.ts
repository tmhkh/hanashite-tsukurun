import { test, expect } from '@playwright/test';

/**
 * E2Eテスト: はなして・つくるん（モックモード）
 * 
 * VITE_MOCK_MODE=true でローカル起動した状態で実行する。
 * 音声認識は使わず、画面遷移とUI表示を検証する。
 */

test.describe('テスト1: 学年選択画面の初期表示', () => {
  test('アプリ起動時に学年選択画面が表示され、8つの学年ボタンが存在する', async ({ page }) => {
    await page.goto('/');

    // タイトルテキストが表示される
    await expect(page.locator('h1')).toHaveText('がくねんを えらんでね');

    // 8つの学年ボタンが存在する
    const buttons = page.locator('button');
    await expect(buttons).toHaveCount(8);

    // 各学年ラベルが表示されている
    await expect(page.getByText('ようちえん')).toBeVisible();
    await expect(page.getByText('しょうがく1ねん')).toBeVisible();
    await expect(page.getByText('しょうがく6ねん')).toBeVisible();
    await expect(page.getByText('ちゅうがくせい以上')).toBeVisible();
  });
});

test.describe('テスト2: 学年選択 → メイン画面遷移', () => {
  test('学年ボタンをクリックするとメイン画面に遷移し、主要コンポーネントが表示される', async ({ page }) => {
    await page.goto('/');

    // 「しょうがく1ねん」をクリック
    await page.getByText('しょうがく1ねん').click();

    // メイン画面が表示される（進捗バー、スライドプレビュー、マイクボタン、AI吹き出しが表示）
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
    await expect(page.locator('[aria-label="スライドプレビュー"]')).toBeVisible();
    await expect(page.locator('[aria-label="マイク"]')).toBeVisible();

    // AI キャラクターのウェルカムメッセージが表示される
    await expect(page.getByText('いっしょに はっぴょうを つくろう！なにについて おはなしする？')).toBeVisible();

    // 「がくねんを えらびなおす」ボタンが存在する
    await expect(page.getByText('がくねんを えらびなおす')).toBeVisible();

    // 3枚のスライド枠が表示される
    await expect(page.locator('[aria-label="スライド 1"]')).toBeVisible();
    await expect(page.locator('[aria-label="スライド 2"]')).toBeVisible();
    await expect(page.locator('[aria-label="スライド 3"]')).toBeVisible();
  });
});

test.describe('テスト3: メイン画面 → 学年選択に戻る', () => {
  test('「がくねんを えらびなおす」をクリックすると学年選択画面に戻る', async ({ page }) => {
    await page.goto('/');

    // メイン画面に遷移
    await page.getByText('ようちえん').click();
    await expect(page.getByText('いっしょに はっぴょうを つくろう')).toBeVisible();

    // 「がくねんを えらびなおす」をクリック
    await page.getByText('がくねんを えらびなおす').click();

    // 学年選択画面に戻る
    await expect(page.locator('h1')).toHaveText('がくねんを えらんでね');
    await expect(page.locator('button')).toHaveCount(8);
  });
});
