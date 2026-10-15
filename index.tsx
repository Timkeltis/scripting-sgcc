/**
 * SGCC 国家电网电量小组件 —— 设置页（Scripting 移植版）。
 *
 * 移植（Scripting 版）：SylvanRoe · telegram: @Air_QT
 *维护：jpcnmm · telegram: @jpcnmm

 *
 * 原作者（原 Scriptable 脚本）声明：
 * @author: 脑瓜
 * @feedback: https://t.me/Scriptable_CN
 * telegram: @anker1209
 * version: 2.3.3
 * update: 2026/08/11
 * 原创UI，修改套用请注明来源
 * 当前版本由本机直接连接网上国网，凭据仅保存在本机 Keychain。
 */
import {
  Script,
  Navigation,
  NavigationStack,
  List,
  Section,
  Text,
  Button,
  Toggle,
  Picker,
  SecureField,
  TextField,
  ColorPicker,
  HStack,
  VStack,
  Spacer,
  Widget,
  useState,
  type Color,
} from 'scripting'
import { loadSettings, saveSettings, resetSettings } from './lib/store'
import { listAccountsWithSource, sendLoginSms, verifyLoginSms } from './lib/api'
import { loadCredentials, saveCredentials } from './lib/credentials'
import { clearCache } from './lib/cache'
import { DEFAULT_SETTINGS, type SGCCSettings, type MetricKey, type RowDisplayMode, type SmallSlotKey } from './lib/types'

type Account = { index: number; consNo: string; consName: string }

type PatchFn = <K extends keyof SGCCSettings>(key: K, value: SGCCSettings[K]) => void

const loadingLabel = (): string => '正在本机登录并获取户号…'

/** 行显示模式选项 */
const ROW_MODES = [
  { tag: 0, value: 'group1' as const, label: '组合一' },
  { tag: 1, value: 'group2' as const, label: '组合二' },
  { tag: 2, value: 'group3' as const, label: '组合三' },
  { tag: 3, value: 'step' as const, label: '阶梯电量' },
]

/** 指标项选项 */
const METRIC_OPTIONS = [
  { tag: 0, value: 'monthFee' as const, label: '上期电费' },
  { tag: 1, value: 'monthUsage' as const, label: '上月电量' },
  { tag: 2, value: 'yearFee' as const, label: '年度电费' },
  { tag: 3, value: 'yearUsage' as const, label: '年度电量' },
  { tag: 4, value: 'currentMonthEle' as const, label: '本月电量' },
  { tag: 5, value: 'dayFee' as const, label: '近日用电' },
  { tag: 6, value: 'remainFee' as const, label: '电费余额' },
  { tag: 7, value: 'dayChart' as const, label: '日用电图表' },
  { tag: 8, value: 'none' as const, label: '不显示' },
]

const SMALL_SLOT_OPTIONS: Array<{ tag: number; value: SmallSlotKey; label: string }> = [
  ...METRIC_OPTIONS,
  { tag: 9, value: 'consName', label: '户名' },
  { tag: 10, value: 'step', label: '阶梯进度' },
  { tag: 11, value: 'balance', label: '余额 / 上期电费' },
]

const smallSlotTag = (key: SmallSlotKey) => SMALL_SLOT_OPTIONS.find(item => item.value === key)?.tag ?? 0

const rowModeTag = (mode: RowDisplayMode) => ROW_MODES.find(r => r.value === mode)?.tag ?? 0
const metricKeyTag = (key: MetricKey) => METRIC_OPTIONS.find(m => m.value === key)?.tag ?? 0

/** 渲染三栏模式选择器（第一栏/第二栏/第三栏），排列在上方 */
function rowModePickers(settings: SGCCSettings, patch: PatchFn): JSX.Element[] {
  const rows: Array<{ rowNum: 1 | 2 | 3; label: string }> = [
    { rowNum: 1, label: '第一栏' },
    { rowNum: 2, label: '第二栏' },
    { rowNum: 3, label: '第三栏' },
  ]
  return rows.map(({ rowNum, label }) => {
    const displayKey = rowNum === 1 ? 'row1Display' : rowNum === 2 ? 'row2Display' : 'row3Display'
    const mode = settings[displayKey]
    return (
      <Picker
        key={`row${rowNum}-mode`}
        title={label}
        value={rowModeTag(mode)}
        onChanged={(v: number) => {
          const m = ROW_MODES.find(r => r.tag === v)
          if (m) patch(displayKey, m.value)
        }}
        pickerStyle="menu"
      >
        {ROW_MODES.map(r => (
          <Text key={r.tag} tag={r.tag}>{r.label}</Text>
        ))}
      </Picker>
    )
  })
}

/** 渲染三组合内容选择器（组合一/二/三 的左栏+右栏），排列在下方 */
function groupContentPickers(settings: SGCCSettings, patch: PatchFn): JSX.Element[] {
  const groups: Array<{ gn: 1 | 2 | 3; label: string }> = [
    { gn: 1, label: '组合一' },
    { gn: 2, label: '组合二' },
    { gn: 3, label: '组合三' },
  ]
  const items: JSX.Element[] = []
  for (const { gn, label } of groups) {
    const leftKey = `group${gn}Left` as 'group1Left' | 'group2Left' | 'group3Left'
    const rightKey = `group${gn}Right` as 'group1Right' | 'group2Right' | 'group3Right'
    items.push(
      <Picker
        key={`group${gn}-left`}
        title={`${label} · 左栏`}
        value={metricKeyTag(settings[leftKey])}
        onChanged={(v: number) => {
          const m = METRIC_OPTIONS.find(o => o.tag === v)
          if (m) patch(leftKey, m.value)
        }}
        pickerStyle="menu"
      >
        {METRIC_OPTIONS.map(o => (
          <Text key={o.tag} tag={o.tag}>{o.label}</Text>
        ))}
      </Picker>,
      <Picker
        key={`group${gn}-right`}
        title={`${label} · 右栏`}
        value={metricKeyTag(settings[rightKey])}
        onChanged={(v: number) => {
          const m = METRIC_OPTIONS.find(o => o.tag === v)
          if (m) patch(rightKey, m.value)
        }}
        pickerStyle="menu"
      >
        {METRIC_OPTIONS.map(o => (
          <Text key={o.tag} tag={o.tag}>{o.label}</Text>
        ))}
      </Picker>,
    )
  }
  return items
}

/** 只展示已知本地提示或固定分类，不回显服务端报文、账号、密码或验证码。 */
export function friendlyLoginError(error: unknown): string {
  const value = error as { code?: unknown; message?: unknown } | null
  const code = String(value?.code ?? '')
  const message = typeof value?.message === 'string' ? value.message : ''
  if (code === '4006') return '4006：国网要求验证新设备。尚未发送短信，请手动点击「发送登录短信」，收到后提交验证码，再登录获取户号。'
  if (code === 'net') return '网络连接或国网响应异常，请检查网络后重试；无需因此发送短信。'
  if (code === '-200' || code === '-201') return `${code}：登录状态已失效，请重新登录获取户号。`
  if (code === 'RK008') return 'RK008：国网拒绝了本次请求，请稍后重试或在网上国网 App 检查账号状态。'
  if (code === 'auth') return '登录未返回有效凭证，请检查账号状态后重试。'
  const safeMessages = [
    '请等待至少60秒后再发送验证码', '请输入6位验证码',
    '请先显式请求新设备验证码', '验证码发送失败',
    '请先运行脚本，在设置页保存网上国网账号和密码',
    '登录成功，但未返回绑定户号，请在网上国网 App 检查绑定关系',
    '本机凭据损坏，请重置后重新填写', '本机会话清理失败，请重试',
    '本机凭据保存失败', '本机凭据清理失败，请重试',
    '无法保存本机登录状态', '无法编码本地账号', '设置保存失败',
  ]
  if (safeMessages.includes(message)) return message === '请先显式请求新设备验证码'
    ? '验证码流程不存在或已超过15分钟，请手动重新发送短信。' : message
  if (code === 'sms') return '短信验证失败，请检查6位验证码及有效期，必要时重新发送。'
  if (/密码|口令|账号|账户/.test(message)) return '账号认证失败，请检查账号、密码及账号状态。'
  if (/验证码/.test(message)) return '验证码校验失败，请检查验证码是否正确或已过期。'
  if (/频繁|频率|稍后/.test(message)) return '请求过于频繁或暂不可用，请稍后重试。'
  const suffix = /^[A-Za-z0-9_-]{1,16}$/.test(code) ? `（错误码 ${code}）` : ''
  return `国网请求未完成${suffix}，请稍后重试或在网上国网 App 检查；仅4006需要新设备短信验证。`
}

export default function SettingsView() {
  const dismiss = Navigation.useDismiss()
  const [settings, setSettings] = useState<SGCCSettings>(loadSettings)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState(() => loadCredentials().password)
  const [smsCode, setSmsCode] = useState('')
  const [smsSent, setSmsSent] = useState(false)

  const patch = <K extends keyof SGCCSettings>(key: K, value: SGCCSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const patchAccName = (index: number, value: string) => {
    setSettings(prev => {
      const accNames = [...(prev.accNames ?? [])]
      accNames[index] = value
      return { ...prev, accNames }
    })
  }


  // 显式保存并立即通知 WidgetKit 重载，避免必须等待系统下次调度
  const persist = () => {
    const previous = loadCredentials()
    if (previous.username !== settings.username.trim() || previous.password !== password) {
      clearCache()
      setAccounts([])
      setSmsSent(false)
    }
    saveCredentials(settings.username, password)
    if (!saveSettings(settings)) throw new Error('设置保存失败')
  }

  const save = () => {
    if (loading) return
    try {
      persist()
      Widget.reloadAll()
      setStatus('已保存，已请求刷新小组件')
    } catch (error) {
      setStatus(`保存失败：${friendlyLoginError(error)}`)
    }
  }

  const loadAccountList = async () => {
    if (loading) return
    setLoading(true)
    setStatus(loadingLabel())
    try {
      if (!settings.username.trim() || !password) {
        setStatus('请先填写网上国网账号和密码')
        return
      }
      persist()
      const result = await listAccountsWithSource(settings)
      const list = result.accounts
      setAccounts(list)
      setStatus(`已获取 ${list.length} 个户号`)
      if (!list.some(a => a.index === settings.accountIndex)) patch('accountIndex', list[0]?.index ?? 0)
    } catch (error) {
      setStatus(friendlyLoginError(error))
    } finally {
      setLoading(false)
    }
  }

  const smsAction = async (verify: boolean) => {
    if (loading) return
    if (verify && !/^\d{6}$/.test(smsCode.trim())) { setStatus('请输入6位数字验证码'); return }
    setLoading(true)
    try {
      const saved = loadCredentials()
      if (!saved.username || !saved.password || saved.username !== settings.username.trim() || saved.password !== password) {
        setStatus('请先填写账号密码并点击「登录获取户号」，再操作短信验证')
        return
      }
      if (verify) {
        await verifyLoginSms(smsCode.trim())
        setSmsCode('')
        setSmsSent(false)
        setStatus('验证成功，请点击「登录获取户号」')
      } else {
        await sendLoginSms()
        setSmsSent(true)
        setStatus('短信已发送，请填写验证码')
      }
    } catch (error) {
      setStatus(`${verify ? '提交验证码' : '发送短信'}失败：${friendlyLoginError(error)}`)
    } finally { setLoading(false) }
  }

  return (
    <NavigationStack>
      <List
        navigationTitle="国家电网"
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          cancellationAction: <Button title="关闭" action={dismiss} />,
          confirmationAction: <Button title="保存" action={save} disabled={loading} />,
        }}
      >
        <Section header={<Text>本机登录</Text>} footer={<Text font="caption">账号和密码仅存本机 Keychain，不随 iCloud 同步。先登录获取户号；需要短信验证时再手动发送，不会自动发短信。</Text>}>
          <TextField title="网上国网账号" value={settings.username} onChanged={v => { patch('username', v); setSmsSent(false); setSmsCode('') }} disabled={loading} />
          <SecureField title="密码" value={password} onChanged={v => { setPassword(v); setSmsSent(false); setSmsCode('') }} disabled={loading} />
          <Button title="发送登录短信" action={() => smsAction(false)} disabled={loading} />
          <TextField title="短信验证码" value={smsCode} onChanged={setSmsCode} disabled={loading} />
          <Button title="提交验证码" action={() => smsAction(true)} disabled={loading || !smsSent || !smsCode.trim()} />
        </Section>
        <Section
          header={<Text>账户</Text>}
          footer={
            <Text font="caption">
              多户时选择要显示的账户。点击「登录获取户号」会保存凭据并由本机请求最新账户数据。
            </Text>
          }
        >
          <Button
            title={loading ? '处理中…' : '登录获取户号'}
            action={loadAccountList}
            disabled={loading}
          />
          {accounts.length > 0 ? (
            <Picker
              title="当前账户"
              value={settings.accountIndex}
              onChanged={(v: number) => patch('accountIndex', v)}
              pickerStyle="menu"
            >
              {accounts.map(a => (
                <Text key={String(a.index)} tag={a.index}>
                  {`${a.consName || `账户 ${a.index + 1}`} · ${a.consNo}`}
                </Text>
              ))}
            </Picker>
          ) : (
            <HStack>
              <Text>账户下标</Text>
              <Spacer />
              <Text foregroundStyle="secondaryLabel">{settings.accountIndex}</Text>
            </HStack>
          )}
          {status ? (
            <Text font="caption" foregroundStyle="secondaryLabel">
              {status}
            </Text>
          ) : null}
        </Section>

        <Section
          header={<Text>多户配置</Text>}
          footer={
            <Text font="caption">
              给每个账户起个能区分的名字。桌面上放多个小组件时，在每个小组件的「参数」里填对应的户名（或 1/2/3），该小组件就会固定显示这一户。以下「户 1/2/3」按上面「当前账户」列表的顺序对应。改完记得点右上角「保存」。
            </Text>
          }
        >
          {[0, 1, 2].map(i => (
            <TextField
              key={i}
              title={`户 ${i + 1} 名称`}
              prompt="留空显示实际户名"
              value={settings.accNames[i] ?? ''}
              onChanged={v => patchAccName(i, v)}
            />
          ))}
        </Section>

        <Section
          header={<Text>小号组件</Text>}
          footer={<Text font="caption">小号固定使用可配置样式三。四个位置都可选用当前中号已有模块：各项用电数据、日用电图表、户名、阶梯进度、余额或不显示。阶梯进度直接复用中号阶梯条与设置。</Text>}
        >
          {([
            ['top', '顶部位置'],
            ['upper', '第二位置'],
            ['lower', '第三位置'],
            ['bottom', '底部位置'],
          ] as Array<[keyof SGCCSettings['smallSlots'], string]>).map(([key, title]) => (
            <Picker key={key} title={title} value={smallSlotTag(settings.smallSlots[key])} onChanged={(v: number) => {
              const item = SMALL_SLOT_OPTIONS.find(option => option.tag === v)
              if (item) setSettings(prev => ({ ...prev, smallSlots: { ...prev.smallSlots, [key]: item.value } }))
            }} pickerStyle="menu">
              {SMALL_SLOT_OPTIONS.map(option => <Text key={option.tag} tag={option.tag}>{option.label}</Text>)}
            </Picker>
          ))}
        </Section>

        <Section
          header={<Text>显示</Text>}
          footer={<Text font="caption">柱状图展示最近若干天的用电量。「柱状图显示度数」仅适用于 7 天及以下，启用后在柱顶标注度数。右侧三栏的显示模式和组合内容请在下方「三栏模式」和「组合内容」中配置。改动后请点右上角「保存」生效。</Text>}
        >
          <Picker
            title="国网 Logo 尺寸"
            value={settings.logoSize}
            onChanged={(v: number) => patch('logoSize', v)}
            pickerStyle="menu"
          >
            {[40, 42, 44, 46, 48, 50, 52, 54, 56].map(n => (
              <Text key={String(n)} tag={n}>
                {`${n}`}
              </Text>
            ))}
          </Picker>
          <Toggle
            title="显示户名"
            value={settings.showConsName}
            onChanged={v => patch('showConsName', v)}
          />
          <Toggle
            title="左栏显示余额"
            value={settings.showBalanceForPostPaid}
            onChanged={v => patch('showBalanceForPostPaid', v)}
          />
          <Toggle
            title="柱状图显示度数（≤7天）"
            value={settings.showChartValues}
            onChanged={v => patch('showChartValues', v)}
          />
          <Picker
            title="柱状图天数"
            value={settings.dayAmount}
            onChanged={(v: number) => patch('dayAmount', v)}
            pickerStyle="menu"
          >
            {[5, 6, 7, 8, 9, 10, 11, 12, 14].map(n => (
              <Text key={String(n)} tag={n}>
                {`${n} 天`}
              </Text>
            ))}
          </Picker>
          <Picker
            title="近日用电小数位"
            value={settings.dayFeeDecimals}
            onChanged={(v: number) => patch('dayFeeDecimals', v)}
            pickerStyle="menu"
          >
            {[0, 1, 2].map(n => (
              <Text key={String(n)} tag={n}>
                {n === 0 ? '整数' : `${n} 位`}
              </Text>
            ))}
          </Picker>
          <HStack>
            <Text>阶梯口径</Text>
            <Spacer />
            <Text foregroundStyle="secondaryLabel">按年累计</Text>
          </HStack>
          <ColorPicker
            title="柱状图颜色"
            value={settings.chartColor as Color}
            onChanged={v => patch('chartColor', v as string)}
            supportsOpacity={false}
          />
          <ColorPicker
            title="主题色"
            value={settings.accentColor as Color}
            onChanged={v => patch('accentColor', v as string)}
            supportsOpacity={false}
          />
        </Section>

        <Section
          header={<Text>三栏模式</Text>}
          footer={<Text font="caption">第一栏/第二栏/第三栏分别选择显示「组合一/二/三」或「阶梯电量」。改动后请点右上角「保存」生效。</Text>}
        >
          {rowModePickers(settings, patch)}
        </Section>

        <Section
          header={<Text>组合内容</Text>}
          footer={<Text font="caption">为组合一/二/三分别配置左栏和右栏的显示内容。当某栏选择了对应组合时，将使用这里的配置。改动后请点右上角「保存」生效。</Text>}
        >
          {groupContentPickers(settings, patch)}
        </Section>

        <Section
          header={<Text>阶梯</Text>}
          footer={
            <Text font="caption">
              按你的实际电表档位填写，单位度。留空表示按北京口径自动（按年累计 2880/4800 度）。「阶梯百分比」选择计算方式：全量 = 占第三档上限的比例（与横条滑块同轴），阶梯 = 当前阶梯内的进度。改动后请点右上角「保存」生效。
            </Text>
          }
        >
          <TextField
            title="第二档阈值（度）"
            prompt="0 = 自动"
            value={settings.step2 > 0 ? String(settings.step2) : ''}
            onChanged={v => patch('step2', parseInt(v, 10) || 0)}
          />
          <TextField
            title="第三档阈值（度）"
            prompt="0 = 自动"
            value={settings.step3 > 0 ? String(settings.step3) : ''}
            onChanged={v => patch('step3', parseInt(v, 10) || 0)}
          />
          <Picker
            title="阶梯百分比"
            value={settings.stepPercentMode}
            onChanged={(v: string) => patch('stepPercentMode', v as '全量' | '阶梯')}
            pickerStyle="menu"
          >
            <Text tag="全量">全量（占第三档比例）</Text>
            <Text tag="阶梯">阶梯（当前阶梯进度）</Text>
          </Picker>
          <Picker
            title="进度条样式"
            value={settings.stepBarStyle}
            onChanged={(v: string) => patch('stepBarStyle', v as '三色' | '纯色')}
            pickerStyle="menu"
          >
            <Text tag="三色">三色（渐变过渡）</Text>
            <Text tag="纯色">纯色（原始单色）</Text>
          </Picker>
        </Section>

        <Section
          header={<Text>数据</Text>}
          footer={
            <Text font="caption">
              由本机直连网上国网。刷新间隔影响小组件缓存有效期。
            </Text>
          }
        >
          <Picker
            title="刷新间隔"
            value={settings.interval}
            onChanged={(v: number) => patch('interval', v)}
            pickerStyle="menu"
          >
            {[60, 120, 240, 360, 720, 1440].map(n => (
              <Text key={String(n)} tag={n}>
                {n >= 60 ? `${n / 60} 小时` : `${n} 分钟`}
              </Text>
            ))}
          </Picker>
          <Button
            title="清除缓存"
            role="destructive"
            action={() => {
              clearCache()
              Widget.reloadAll()
              setStatus('缓存已清除，已请求刷新小组件')
            }}
          />
        </Section>

        <Section
          header={<Text>预览</Text>}
          footer={
            <Text font="caption">
              预览页顶部可切换参数：「真实数据」按已保存的本机账号联网读取；「演示数据」不联网、用于校对布局。
            </Text>
          }
        >
          <Button
            title="预览中号小组件"
            action={async () => {
              await Widget.preview<'真实数据' | '演示数据'>({
                family: 'systemMedium',
                parameters: {
                  options: {
                    '真实数据': '',
                    '演示数据': 'demo',
                  },
                  default: '演示数据',
                },
              })
            }}
          />
        </Section>

        <Section>
          <Button
            title="重置设置、凭据与缓存"
            disabled={loading}
            role="destructive"
            action={() => {
              try {
                resetSettings()
                setSettings({ ...DEFAULT_SETTINGS })
                setPassword('')
                setSmsCode('')
                setSmsSent(false)
                setAccounts([])
                Widget.reloadAll()
                setStatus('已重置设置，并清除本机凭据、会话和缓存')
              } catch {
                setStatus('重置未完全成功，请重试清理本机 Keychain')
              }
            }}
          />
        </Section>
      </List>
    </NavigationStack>
  )
}

async function run() {
  await Navigation.present(<SettingsView />)
  Script.exit()
}

run()
