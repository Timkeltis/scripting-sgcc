/** Scripting 本机直连网上国网数据层。 */
import { SgApp, queryAccount } from './direct-core'
import { directContext, secureRandomBytes } from './direct-runtime'
import { loadCredentials } from './credentials'
import { normalizeDirectAccount } from './direct-normalize'
import { readCache, writeCache } from './cache'
import { buildViewModel, nowString } from './calc'
import type { BillViewModel, RawAccount, SGCCSettings } from './types'

export const CACHE_KEY = 'DirectBillData_SGCC.json'
export type DataSourceName = '本机直连网上国网'
type CacheEntry = { at: number; update: string; account: RawAccount }
type Cache = { owner: string; entries: Record<string, CacheEntry> }

function client(): any {
  const { username, password } = loadCredentials()
  if (!username || !password) throw new Error('请先运行脚本，在设置页保存网上国网账号和密码')
  return new SgApp({ ...directContext(), randomBytes: secureRandomBytes }, username, password)
}
function ownerKey(): string {
  const username = loadCredentials().username
  const data = Data.fromString(username)
  if (!data) throw new Error('无法编码本地账号')
  return Crypto.sha256(data).toHexString()
}
function cacheForOwner(): Cache {
  const owner = ownerKey()
  try {
    const parsed = JSON.parse(readCache(CACHE_KEY) ?? 'null')
    if (parsed?.owner === owner && parsed.entries) return parsed
  } catch { /* 损坏缓存不会阻止在线查询 */ }
  return { owner, entries: {} }
}
function model(entry: CacheEntry, settings: SGCCSettings, cached: boolean): BillViewModel {
  return buildViewModel(entry.account, {
    update: entry.update, fromCache: cached,
    cacheAgeMinutes: Math.max(0, Math.floor((Date.now() - entry.at) / 60000)),
    stepMode: settings.stepMode, step2: settings.step2, step3: settings.step3, stepPercentMode: settings.stepPercentMode,
  })
}

export async function getBillData(settings: SGCCSettings, accountIndex?: number): Promise<BillViewModel> {
  const index = Math.max(0, Math.floor(accountIndex ?? settings.accountIndex))
  const cache = cacheForOwner()
  const old = cache.entries[String(index)]
  if (old && Date.now() - old.at < settings.interval * 60000) return model(old, settings, true)
  try {
    const app = client()
    const session = await app.ensure()
    const account = session.accounts?.[index]
    if (!account) throw new Error(`未找到第 ${index + 1} 个户号，请在设置页重新获取户号`)
    const raw = normalizeDirectAccount(await queryAccount(app, account))
    const entry = { at: Date.now(), update: nowString(), account: raw }
    // 合并其他小组件刚更新的户号，避免并发覆盖整份缓存。
    const latest = cacheForOwner()
    latest.entries[String(index)] = entry
    writeCache(CACHE_KEY, JSON.stringify(latest))
    return model(entry, settings, false)
  } catch (error) {
    // 更新失败保留上次成功数据，展示原始更新时间和缓存标记。
    if (old) return model(old, settings, true)
    throw error
  }
}

export async function listAccountsWithSource(_settings: SGCCSettings): Promise<{ source: DataSourceName; accounts: Array<{ index: number; consNo: string; consName: string }> }> {
  const app = client()
  const session = await app.ensure()
  if (!session.accounts?.length) throw new Error('登录成功，但未返回绑定户号，请在网上国网 App 检查绑定关系')
  return {
    source: '本机直连网上国网',
    accounts: session.accounts.map((item: any, index: number) => ({ index, consNo: String(item.consNo ?? ''), consName: String(item.name || `账户 ${index + 1}`) })),
  }
}
export async function listAccounts(settings: SGCCSettings) { return (await listAccountsWithSource(settings)).accounts }

export async function sendLoginSms(): Promise<void> {
  const key = 'sgcc.direct.sms-last.' + ownerKey()
  const last = Number(Keychain.get(key) ?? 0)
  if (Date.now() - last < 60000) throw new Error('请等待至少60秒后再发送验证码')
  await client().requestDeviceSms()
  Keychain.set(key, String(Date.now()), { synchronizable: false })
}
export async function verifyLoginSms(code: string): Promise<void> {
  await client().verifyDeviceSms(code.trim())
}
