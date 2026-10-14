import { Script } from 'scripting'
import { normalizeDirectAccount } from './lib/direct-normalize'
import { buildViewModel } from './lib/calc'
import { secureRandomBytes } from './lib/direct-runtime'
import { SgApp } from './lib/direct-core'

function assert(value: boolean, message: string) { if (!value) throw new Error(message) }
const raw = normalizeDirectAccount({
  userInfo: { consNo: 'TEST', consName_dst: '离线测试' },
  eleBill: { sumMoney: -12.5, historyOwe: 12.5 },
  monthTotal: 20,
  dayElecQuantity31: { sevenEleList: [
    { day: '2026-10-12', dayElePq: '3' }, { day: '20261013', dayElePq: '4' },
    { day: '20261013', dayElePq: '4' }, { day: '20261011', dayElePq: '-' },
  ] },
  monthElecQuantity: { mothEleList: [{ month: '202609', monthEleNum: 30, monthEleCost: 15 }], dataInfo: { totalEleNum: 100, totalEleCost: 50 } },
})
assert(raw.dayElecQuantity31!.sevenEleList!.length === 2, '日用电过滤去重')
const vm = buildViewModel(raw, { update: 'test', fromCache: true, cacheAgeMinutes: 60 })
assert(vm.remainFee === -12.5 && vm.isOverdue, '欠费符号')
assert(vm.dayFee === 4 && vm.currentMonthEle === 20, '日期排序和本月总量')
assert(vm.yearUsage === 100 && vm.step.usage === 100, '年度接口值不重复叠加本月')
assert(vm.monthUsage === 30 && vm.monthFee === 15, '月度映射')
let missingRejected = false
try { normalizeDirectAccount({ eleBill: { sumMoney: NaN } }) } catch { missingRejected = true }
assert(missingRejected, '缺失余额不能显示为零')
const r = secureRandomBytes(80)
assert(r.length === 80 && r.some(v => v !== 0), '原生安全随机源')
let requests = 0
const app: any = new SgApp({ randomBytes: secureRandomBytes, storage: { getJSON: () => null, setJSON: () => {} }, http: { post: () => { requests++; throw new Error('禁止联网') } } }, 'offline', 'offline')
const device = app.device()
assert(!!device.s.tok.token && device.s.tok.token.startsWith('v3:'), '本机生成设备令牌')
assert(requests === 0, '离线测试不得联网')
console.log('PASS: 归一化、欠费符号、日期排序、缺失值、安全随机数、Turing设备令牌（全部离线）')
Script.exit('离线集成测试通过')
