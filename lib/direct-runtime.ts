/** 本机网络/钥匙串适配；不记录请求体、密码或会话。 */
import { fetch } from 'scripting'

export function secureRandomBytes(size: number): Uint8Array {
  const out = new Uint8Array(size)
  for (let offset = 0; offset < size; offset += 32) {
    const hex = Crypto.generateSymmetricKey(256).toHexString()
    for (let i = 0; i < 32 && offset + i < size; i++) out[offset + i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

export function directContext() {
  return {
    env: { SGCC_POLICY: '' },
    storage: {
      getJSON(key: string): any {
        const text = Keychain.get('sgcc.direct.' + key)
        return text ? JSON.parse(text) : null
      },
      setJSON(key: string, value: unknown): void {
        if (!Keychain.set('sgcc.direct.' + key, JSON.stringify(value), { synchronizable: false })) throw new Error('无法保存本机登录状态')
      },
    },
    http: {
      async post(url: string, options: { headers: Record<string, string>; body: string; timeout?: number }) {
        if (!url.startsWith('https://csc-service.sgcc.com.cn:28630/')) throw new Error('拒绝非国网协议地址')
        const response = await fetch(url, { method: 'POST', headers: options.headers, body: options.body, timeout: Math.min(options.timeout ?? 20000, 20000) / 1000 })
        if (!response.ok) throw new Error(`国网 HTTP ${response.status}`)
        return response
      },
    },
  }
}
