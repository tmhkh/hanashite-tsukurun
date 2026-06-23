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
    gap: '16px',
  },
  title: {
    fontSize: '28px',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
  },
  error: {
    color: '#e74c3c',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center',
  },
  button: {
    padding: '16px 48px',
    fontSize: '18px',
    fontWeight: 'bold',
    borderRadius: '12px',
    border: '3px solid #4a90d9',
    backgroundColor: '#4a90d9',
    color: '#ffffff',
    cursor: 'pointer',
  },
}
