import { useAuth } from '../../contexts/AuthContext'

/**
 * LoginScreen コンポーネント
 *
 * パスキー認証用のログイン画面。
 * ボタンクリックで Cognito Managed Login にリダイレクトし、
 * パスキー認証を実施する。
 */
export function LoginScreen() {
  const { login, isLoading, error } = useAuth()

  const handleLogin = async () => {
    await login()
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconCircle}>
          <span style={styles.icon}>🎤</span>
        </div>
        <h1 style={styles.title}>はなしてつくるん</h1>
        <p style={styles.subtitle}>パスキーでログインしてください</p>
        {error && <p style={styles.error}>{error}</p>}
        <button
          onClick={handleLogin}
          style={styles.button}
          disabled={isLoading}
          aria-label="ログイン"
        >
          {isLoading ? 'リダイレクト中...' : 'ログイン'}
        </button>
      </div>
    </div>
  )
}

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
    gap: '16px',
    padding: '48px 40px',
    background: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
    maxWidth: '400px',
    width: '100%',
  },
  iconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  icon: {
    fontSize: '36px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    margin: 0,
    textAlign: 'center',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.85)',
    margin: 0,
  },
  error: {
    color: '#fecaca',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center',
    padding: '8px 16px',
    background: 'rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  button: {
    padding: '16px 48px',
    fontSize: '18px',
    fontWeight: 700,
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    background: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)',
    width: '100%',
    maxWidth: '280px',
    marginTop: '8px',
  },
}
