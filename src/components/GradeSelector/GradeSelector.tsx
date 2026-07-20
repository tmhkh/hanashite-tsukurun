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
 * グラスモルフィズムデザイン。
 *
 * Requirements: 1.1, 1.2, 1.5, 10.1, 10.2
 */
export default function GradeSelector({ onSelect }: GradeSelectorProps) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
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
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 32px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '32px',
    border: '1px solid rgba(255, 255, 255, 0.35)',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
    maxWidth: '750px',
    width: '100%',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '32px',
    textAlign: 'center',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
    fontWeight: 700,
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '16px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
  },
};
