/** 本机凭据及直连会话命名空间；禁止写入 Storage 或日志。 */
const CREDENTIALS_KEY = 'sgcc.credentials'
const LOCAL = { synchronizable: false } as const

export function loadCredentials(): { username: string; password: string } {
  const raw = Keychain.get(CREDENTIALS_KEY, LOCAL)
  if (!raw) return { username: '', password: '' }
  try {
    const value = JSON.parse(raw)
    return {
      username: typeof value.username === 'string' ? value.username : '',
      password: typeof value.password === 'string' ? value.password : '',
    }
  } catch {
    throw new Error('本机凭据损坏，请重置后重新填写')
  }
}

export function clearDirectSession(): void {
  let failed = false
  for (const key of Keychain.keys(LOCAL)) {
    if (key.startsWith('sgcc.direct.') && !Keychain.remove(key, LOCAL)) failed = true
  }
  if (failed) throw new Error('本机会话清理失败，请重试')
}

export function saveCredentials(username: string, password: string): void {
  username = username.trim()
  const previous = loadCredentials()
  if (previous.username === username && previous.password === password) return
  // 先使旧会话失效，避免切换账号后沿用旧身份。
  clearDirectSession()
  if (!Keychain.set(CREDENTIALS_KEY, JSON.stringify({ username, password }), LOCAL)) {
    throw new Error('本机凭据保存失败')
  }
}

export function clearCredentials(): void {
  const failed = Keychain.contains(CREDENTIALS_KEY, LOCAL) && !Keychain.remove(CREDENTIALS_KEY, LOCAL)
  clearDirectSession()
  if (failed) throw new Error('本机凭据清理失败，请重试')
}
