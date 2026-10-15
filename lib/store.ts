/**
 * 配置读写。使用 Storage（脚本私有域），index.tsx 与 widget.tsx 共享。
 */
import { DEFAULT_SETTINGS, type MetricKey, type SGCCSettings, type SmallSlotKey } from './types'

import { loadCredentials, clearCredentials } from './credentials'
import { clearCache } from './cache'

const KEY = 'sgcc.settings'

const METRIC_KEYS: MetricKey[] = [
  'monthFee', 'monthUsage', 'yearFee', 'yearUsage', 'currentMonthEle',
  'dayFee', 'remainFee', 'dayChart', 'none',
]
const SMALL_SLOT_KEYS: SmallSlotKey[] = [...METRIC_KEYS, 'step', 'consName', 'balance']

function isMetricKey(value: unknown): value is MetricKey {
  return typeof value === 'string' && METRIC_KEYS.includes(value as MetricKey)
}

function isSmallSlotKey(value: unknown): value is SmallSlotKey {
  return typeof value === 'string' && SMALL_SLOT_KEYS.includes(value as SmallSlotKey)
}

// 白名单持久化：即使传入含密码或旧连接字段的对象也不会泄漏。
function publicSettings(settings: Partial<SGCCSettings>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(DEFAULT_SETTINGS) as Array<keyof SGCCSettings>) {
    if (key !== 'username') result[key] = settings[key] ?? DEFAULT_SETTINGS[key]
  }
  return result
}

export function loadSettings(): SGCCSettings {
  const raw = Storage.get<Partial<SGCCSettings>>(KEY)
  // 每次读取都迁移到白名单，清除历史连接字段及意外写入的凭据。
  const safe = publicSettings(raw ?? {})
  const merged = { ...DEFAULT_SETTINGS, ...safe, username: loadCredentials().username } as SGCCSettings
  merged.stepMode = '年'
  if (!Number.isFinite(merged.interval) || ![60, 120, 240, 360, 720, 1440].includes(merged.interval)) merged.interval = DEFAULT_SETTINGS.interval
  if (!Number.isFinite(merged.dayAmount) || merged.dayAmount < 5 || merged.dayAmount > 14) merged.dayAmount = DEFAULT_SETTINGS.dayAmount
  if (!Number.isFinite(merged.accountIndex) || merged.accountIndex < 0) merged.accountIndex = 0
  if (!Array.isArray(merged.accNames)) merged.accNames = []
  const rawSlots = raw?.smallSlots
  merged.smallSlots = {
    top: isSmallSlotKey(rawSlots?.top) ? rawSlots.top : DEFAULT_SETTINGS.smallSlots.top,
    upper: isSmallSlotKey(rawSlots?.upper) ? rawSlots.upper : DEFAULT_SETTINGS.smallSlots.upper,
    lower: isSmallSlotKey(rawSlots?.lower) ? rawSlots.lower : DEFAULT_SETTINGS.smallSlots.lower,
    bottom: isSmallSlotKey(rawSlots?.bottom) ? rawSlots.bottom : DEFAULT_SETTINGS.smallSlots.bottom,
  }
  if (!Number.isFinite(merged.step2) || merged.step2 < 0) merged.step2 = 0
  if (!Number.isFinite(merged.step3) || merged.step3 < 0) merged.step3 = 0
  if (merged.step2 > 0 && merged.step3 > 0 && merged.step3 <= merged.step2) {
    merged.step2 = 0
    merged.step3 = 0
  }
  if (raw) Storage.set(KEY, publicSettings(merged))
  return merged
}

export function saveSettings(settings: SGCCSettings): boolean {
  return Storage.set(KEY, publicSettings(settings))
}

export function resetSettings(): void {
  Storage.remove(KEY)
  try {
    clearCredentials()
  } finally {
    clearCache()
  }
}
