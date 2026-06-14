import type { Grade } from '../types/index';

/**
 * 各 Grade の日本語表示名マッピング
 * Requirements: 1.2
 */
export const GRADE_LABELS: Record<Grade, string> = {
  grade0: 'ようちえん',
  grade1: '小学1年',
  grade2: '小学2年',
  grade3: '小学3年',
  grade4: '小学4年',
  grade5: '小学5年',
  grade6: '小学6年',
  grade7: '中学生以上',
};

/**
 * 全 Grade 値の配列（定義順を保証）
 * Requirements: 1.2
 */
export const GRADES: Grade[] = [
  'grade0',
  'grade1',
  'grade2',
  'grade3',
  'grade4',
  'grade5',
  'grade6',
  'grade7',
];
