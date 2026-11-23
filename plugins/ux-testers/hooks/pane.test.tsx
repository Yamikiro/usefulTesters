import type { AgentInfo } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'ux-testers',
  component: 'Pane',
  requestId: 'ux-testers',
  props: {
    title: 'UX testers',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

const SURFACES = ['terminal', 'desktop'] as const

test('the empty pane says how to start', async $ => {
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /No testers yet/ }))?.text).toBe('No testers yet.')
    await ui.unmount()
  }
})

test('a stored tester feed is drawn, and selecting a tester shows its report', async ($, on) => {
  const feed = [
    { at: 1, kind: 'status', text: 'starts on http://localhost:3000' },
    { at: 2, kind: 'action', text: 'looks at the screen' },
    { at: 3, kind: 'thought', text: 'Where do I sign up?', feeling: 'confused' },
    { at: 4, kind: 'issue', text: 'Sign-up button is an unlabeled icon', severity: 'major' },
  ]
  const tester = {
    agentId: 'a1',
    persona: 'rosa',
    url: 'http://localhost:3000',
    status: 'done',
    startedAt: 0,
    feed,
    report: '## Verdict\nToo hard. Ease: 3/10',
  }
  let pick = 'all'
  on('state.get', (_, e) =>
    e.key === 'testers'
      ? { value: { value: { shape: 'testers-1', value: [tester] }, version: 1 } }
      : e.key === 'offsets'
        ? { value: { value: {}, version: 1 } }
        : { value: { value: pick, version: 1 } },
  )
  on('state.set', (_, e) => {
    if (e.key === 'selected') pick = e.value as string
    return { value: { isSet: true, version: 2 } }
  })

  for (const surface of SURFACES) {
    pick = 'all'
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /Rosa/ }))?.text).toContain('1 issues')
    expect((await ui.find({ type: 'Text', text: /Where do I sign up/ }))?.text).toContain('😕 “Where do I sign up?”')
    expect((await ui.find({ type: 'Text', text: /unlabeled icon/ }))?.text).toContain('[major]')
    await ui.unmount()

    pick = 'a1'
    const one = await $.ui.mount({ ...PANE, surface })
    expect((await one.find({ type: 'Text', text: /issues/ }))?.text).toContain('71, retired teacher')
    await one.unmount()
  }
})

test('each card scrolls its own chat', async ($, on) => {
  const feed = Array.from({ length: 40 }, (_, i) => ({ at: i, kind: 'action', text: `step ${i}` }))
  const other = { agentId: 'b1', persona: 'jay', url: '', status: 'running', startedAt: 0, feed: [{ at: 0, kind: 'action', text: 'jay alone' }] }
  const tester = { agentId: 'a1', persona: 'rosa', url: '', status: 'running', startedAt: 0, feed }
  let back: Record<string, number> = {}
  on('state.get', (_, e) =>
    e.key === 'testers'
      ? { value: { value: { shape: 'testers-1', value: [tester, other] }, version: 1 } }
      : e.key === 'offsets'
        ? { value: { value: back, version: 1 } }
        : { value: { value: 'all', version: 1 } },
  )
  on('state.set', (_, e) => {
    if (e.key === 'offsets') back = e.value as Record<string, number>
    return { value: { isSet: true, version: 2 } }
  })

  for (const surface of SURFACES) {
    back = {}
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: /step 39/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^→ step 0$/ })).toBeUndefined()
    await ui.press({ key: 'up-a1' })
    expect(back.a1).toBeGreaterThan(0)
    expect(back.b1).toBeUndefined()
    await ui.unmount()
  }
})

test("a tester's think_aloud and browser step reach the pane live", async ($, on) => {
  on('command.register', () => ({ value: { command: 'uxtest' } }))
  on('tool.register', () => ({ value: { tool: 'mcp__ux-testers__think_aloud' } }))
  on('agent.register', (_, e) => ({ value: { agent: `ux-testers:${e.name}` } }))
  on('agent.list', () => ({
    value: [
      { id: 'a1', type: 'ux-testers:rosa', description: 'Rosa tests localhost', status: 'running' },
      { id: 'a2', type: 'ux-testers:custom', description: 'Maya tests localhost:3000', status: 'running' },
    ] as unknown as AgentInfo[],
  }))
  let opened = 0
  on('ui.open', () => (opened++, { value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: 'ok' }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  await $.tool.call({
    tool: 'mcp__ux-testers__think_aloud',
    thought: 'I cannot find the menu',
    feeling: 'confused',
    issue: 'Menu hidden behind an icon',
    severity: 'major',
    agentId: 'a1',
  } as never)
  await $.tool.call({ tool: 'mcp__Claude_Browser__navigate', url: 'http://localhost:3000/about', agentId: 'a1' })
  await $.tool.call({ tool: 'mcp__ux-testers__think_aloud', thought: 'Nice clean start page', feeling: 'happy', agentId: 'a2' } as never)
  expect(opened).toBeGreaterThan(0)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /cannot find the menu/ }))?.text).toContain('😕 “')
    expect(await ui.find({ type: 'Text', text: /Maya/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /hidden behind an icon/ }))?.text).toContain('[major]')
    expect((await ui.find({ type: 'Text', text: /goes to/ }))?.text).toContain('http://localhost:3000/about')
    expect((await ui.find({ type: 'Text', text: /clean start page/ }))?.text).toContain('🙂 “')
    await ui.unmount()
  }
})

test('/uxtest with no URL shows the help', async ($, on) => {
  on('command.register', () => ({ value: { command: 'uxtest' } }))
  on('tool.register', () => ({ value: { tool: 'mcp__ux-testers__think_aloud' } }))
  on('agent.register', (_, e) => ({ value: { agent: `ux-testers:${e.name}` } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const res = await $.command.run({
    command: 'uxtest',
    args: 'please test it',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })
  expect(res.text).toContain('No URL given')
  expect(res.text).toContain('amara')
})
