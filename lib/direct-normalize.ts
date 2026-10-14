/** 将直连接口结果转为现有小组件的数据结构。缺失值不伪造为有效余额。 */
import type { RawAccount } from './types'

function numeric(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}
const compact = (value: unknown) => String(value ?? '').replace(/\D/g, '')

export function normalizeDirectAccount(value: any): RawAccount {
  const days: Array<{ day: string; dayElePq: string }> = []
  const seen = new Set<string>()
  for (const row of value.dayElecQuantity31?.sevenEleList ?? []) {
    const day = compact(row.day).slice(0, 8)
    const usage = numeric(row.dayElePq)
    if (day.length === 8 && usage !== undefined && !seen.has(day)) {
      days.push({ day, dayElePq: String(usage) }); seen.add(day)
    }
  }
  days.sort((a, b) => b.day.localeCompare(a.day))
  const months = (value.monthElecQuantity?.mothEleList ?? []).map((row: any) => ({
    month: compact(row.month).slice(0, 6),
    monthEleNum: String(numeric(row.monthEleNum) ?? 0),
    monthEleCost: String(numeric(row.monthEleCost) ?? 0),
  })).filter((row: any) => row.month.length === 6).sort((a: any, b: any) => a.month.localeCompare(b.month))
  const balance = numeric(value.eleBill?.sumMoney)
  if (balance === undefined) throw new Error('国网未返回有效余额，请稍后重试（不会将缺失余额显示为零）')
  const owe = numeric(value.eleBill?.historyOwe) ?? 0
  const overdue = balance < 0 || owe > 0
  return {
    userInfo: { consNo_dst: String(value.userInfo?.consNo ?? value.userInfo?.consNo_dst ?? ''), consName_dst: String(value.userInfo?.consName_dst ?? '国家电网') },
    arrearsOfFees: overdue,
    eleBill: { sumMoney: overdue ? Math.max(owe, Math.abs(balance)) : balance, date: value.eleBill?.date },
    dayElecQuantity31: { sevenEleList: days },
    monthElecQuantity: { mothEleList: months, dataInfo: {
      totalEleNum: numeric(value.monthElecQuantity?.dataInfo?.totalEleNum),
      totalEleCost: numeric(value.monthElecQuantity?.dataInfo?.totalEleCost),
    } },
    reportedYearUsage: numeric(value.monthElecQuantity?.dataInfo?.totalEleNum),
    currentMonthUsage: numeric(value.monthTotal),
    latestDailyUsage: days.length ? Number(days[0].dayElePq) : undefined,
  }
}
