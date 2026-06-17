import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'

/**
 * LoginScreen コンポーネント Props
 * Requirements: 2.2, 2.3, 2.4
 */
interface LoginScreenProps {
  onLoginSuccess: () => void
}

/**
 * LoginScreen コンポーネント
 *
 * パスワード認証モードのログイン画面。
 * - ユーザー名フィールド、パスワードフィールド、ログインボタンを表示
 * - 認証成功時に onLoginSuccess コールバックを呼び出す
 * - 認証失敗時に「ログインに失敗しました」エラーメッセージを表示
 *
 * Requirements: 2.2, 2.3, 2.4
 */
export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { login, isLoading, error } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    try {
      await login(username, password)
      onLoginSuccess()
    } catch {
      // エラーは AuthContext 側で state に設定されるため、ここでは何もしない
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ログイン</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label htmlFor="username" style={styles.label}>
            ユーザー名
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            style={styles.input}
            disabled={isLoading}
          />
        </div>
        <div style={styles.field}>
          <label htmlFor="password" style={styles.label}>
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={styles.input}
            disabled={isLoading}
          />
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </div>
  )
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    maxWidth: '360px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '2px solid #4a90d9',
    outline: 'none',
  },
  error: {
    color: '#e74c3c',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center',
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '12px',
    border: '3px solid #4a90d9',
    backgroundColor: '#4a90d9',
    color: '#ffffff',
    cursor: 'pointer',
    marginTop: '8px',
  },
}
