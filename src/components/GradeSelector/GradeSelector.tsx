import type { Grade } from '../../types/index';
import { GRADES, GRADE_LABELS } from '../../utils/kanjiGrade';

/**
 * GradeSelector コンポーネント Props
 */
interface GradeSelectorProps {
  onSelect: (grade: Grade) => void;
}

/**
 * 学年選択画面コンポーネント
 *
 * 8種類の学年ボタンを大きなビジュアルボタンとして表示し、
 * タッチ操作に適したサイズ（150px × 150px 以上）で配置する。
 *
 * Requirements: 1.1, 1.2, 1.5, 10.1, 10.2
 */
export default function GradeSelector({ onSelect }: GradeSelectorProps) {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>学年を えらんでね</h1>
      <div style={styles.grid}>
        {GRADES.map((grade) => (
          <button
            key={grade}
            style={styles.button}
            onClick={() => onSelect(grade)}
            aria-label={GRADE_LABELS[grade]}
          >
            {GRADE_LABELS[grade]}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * インラインスタイル定義
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
  },
  title: {
    fontSize: '28px',
    marginBottom: '32px',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    maxWidth: '700px',
    width: '100%',
  },
  button: {
    minWidth: '150px',
    minHeight: '150px',
    fontSize: '18px',
    fontWeight: 'bold',
    borderRadius: '16px',
    border: '3px solid #4a90d9',
    backgroundColor: '#e8f4fd',
    color: '#2c3e50',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '16px',
    transition: 'transform 0.1s ease, background-color 0.1s ease',
  },
};
