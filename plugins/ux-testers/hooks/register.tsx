import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { FeedItem, Feeling, Severity, Tester } from '../types'
import {
  BROWSER_TOOLS,
  NOTE_TOOL,
  PERSONAS,
  customPrompt,
  personaPrompt,
  spawnPrompt,
} from './personas'

const PANE = 'ux-testers'
const TYPE_PREFIX = 'ux-testers:'
const FEED_CAP = 300

// Change the tag when Tester's fields change: an older stored list is declined.
const testers = atom({ plugin: 'ux-testers', key: 'testers' } as const, [], {
  shape: 'testers-1',
})
const selected = atom({ plugin: 'ux-testers', key: 'selected' } as const, 'all')
// Per-card scroll: how many feed items back from the newest each card shows.
const offsets = atom({ plugin: 'ux-testers', key: 'offsets' } as const, {} as Record<string, number>)

const FEELING_MARK: Record<Feeling, string> = {
  happy: '🙂',
  neutral: '😐',
  curious: '🤔',
  confused: '😕',
  frustrated: '😤',
}
const FEELINGS = Object.keys(FEELING_MARK) as Feeling[]
const SEVERITIES: Severity[] = ['minor', 'major', 'blocker']

const personaName = (id: string) =>
  PERSONAS.find(p => p.id === id)?.name ?? id

const nameOf = (t: Tester) => t.label || personaName(t.persona)

// "Maya tests localhost:3000" → "Maya"
const labelFrom = (description: string) =>
  description.split(/\s+(?:tests?|testing|on)\s+/i)[0]?.trim().slice(0, 40) || undefined

// Agent ids already known not to be testers (lost on reload, which is fine).
const notOurs = new Set<string>()

const addTester = ($: EngineInterface, t: Tester) =>
  update($, testers, list =>
    list.some(x => x.agentId === t.agentId)
      ? list.map(x => (x.agentId === t.agentId ? { ...t, ...x } : x))
      : [...list, t].slice(-30),
  )

const patch = ($: EngineInterface, agentId: string, fn: (t: Tester) => Tester) =>
  update($, testers, list => list.map(t => (t.agentId === agentId ? fn(t) : t)))

const push = ($: EngineInterface, agentId: string, item: Omit<FeedItem, 'at'>) =>
  patch($, agentId, t => ({
    ...t,
    feed: [...t.feed, { ...item, at: Date.now() }].slice(-FEED_CAP),
  }))

// Is this agent one of ours? Events can arrive before $.agent.spawn resolves,
// and the main model may summon a tester itself, so look it up when unknown.
const isTester = async ($: EngineInterface, agentId: string) => {
  if (notOurs.has(agentId)) return false
  if ((await read($, testers)).some(t => t.agentId === agentId)) return true
  const info = (await $.agent.list()).find(a => a.id === agentId)
  if (!info?.type.startsWith(TYPE_PREFIX)) {
    if (info) notOurs.add(agentId)
    return false
  }
  const persona = info.type.slice(TYPE_PREFIX.length)
  await addTester($, {
    agentId,
    persona,
    label: persona === 'custom' ? labelFrom(info.description) : undefined,
    url: '',
    status: 'running',
    startedAt: Date.now(),
    feed: [],
  })
  // Summoned by the model rather than /uxtest: bring the pane up.
  void $.ui.open({ id: PANE, title: 'UX testers' })
  return true
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

// One line saying what a browser call does, or undefined to leave it out.
const describe = (tool: string, a: Record<string, unknown>) => {
  const short = tool.replace('mcp__Claude_Browser__', '')
  switch (short) {
    case 'navigate':
      return `goes to ${str(a.url)}`
    case 'computer': {
      const act = str(a.action)
      if (act === 'screenshot') return 'looks at the screen'
      if (act === 'wait') return 'waits'
      if (act === 'scroll') return `scrolls ${str(a.scroll_direction)}`
      if (act === 'key') return `presses ${str(a.text)}`
      if (act === 'type') return `types "${str(a.text).slice(0, 60)}"`
      return str(a.action_summary) || act
    }
    case 'find':
      return `looks for "${str(a.query)}"`
    case 'read_page':
    case 'get_page_text':
      return 'reads the page'
    case 'form_input':
      return str(a.action_summary) || 'fills a field'
    case 'tabs_create':
      return 'opens a tab'
    case 'tabs_close':
      return 'closes the tab'
    case 'resize_window':
      return `switches to ${str(a.preset) || 'a custom'} size`
    case 'read_console_messages':
      return 'checks the console'
    default:
      return undefined
  }
}

const HELP = [
  'Usage: /uxtest <url> [--who rosa,jay] [what the testers came to do]',
  '       /uxtest clear',
  '',
  'Testers:',
  ...PERSONAS.map(p => `  ${p.id.padEnd(6)} ${p.name}: ${p.tagline}`),
].join('\n')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.tool.register({
      name: 'think_aloud',
      description:
        'Usability testers only: say out loud what you are thinking right now, in the first person. Optionally flag an issue.',
      isDeferred: false,
      inputSchema: {
        type: 'object',
        properties: {
          thought: { type: 'string', description: 'What you think, in your own voice' },
          feeling: { type: 'string', enum: FEELINGS },
          issue: { type: 'string', description: 'A real problem, one short line' },
          severity: { type: 'string', enum: SEVERITIES },
        },
        required: ['thought'],
      },
    })
    for (const p of PERSONAS) {
      await $.agent.register({
        name: p.id,
        description: `Usability tester persona: ${p.name}, ${p.tagline}. Give it ONLY a URL and optionally a goal, never details about the app; it drives the built-in browser and thinks aloud.`,
        prompt: personaPrompt(p),
        tools: [...BROWSER_TOOLS, NOTE_TOOL, 'ToolSearch'],
        omitClaudeMd: true,
        maxTurns: 80,
        background: true,
      })
    }
    await $.agent.register({
      name: 'custom',
      description:
        'Usability tester with a persona you write for the app\'s audience. Prompt: "Who you are: <name, age, job, skills, device, habits, why they came>" then "Here is the address: <url>" and optionally "What you came here to do: <goal>". Never describe the app, its features or its code. Set description to "<Name> tests <host>". See the ux-test skill.',
      prompt: customPrompt(),
      tools: [...BROWSER_TOOLS, NOTE_TOOL, 'ToolSearch'],
      omitClaudeMd: true,
      maxTurns: 80,
      background: true,
    })
    await $.command.register({
      name: 'uxtest',
      description: 'Send zero-context persona testers through a web app',
      argumentHint: '<url> [--who rosa,jay] [goal]',
    })

    return next(e)
  })

  on('command.run', { command: 'uxtest' }, async ($, e) => {
    const words = e.args.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return { text: HELP, isTextDisplayOnly: true }
    if (words[0] === 'clear') {
      await update($, testers, () => [])
      await update($, selected, () => 'all')
      return { text: 'Cleared the tester pane.', isTextDisplayOnly: true }
    }

    let url = ''
    let who: string[] = PERSONAS.map(p => p.id)
    const goal: string[] = []
    for (let i = 0; i < words.length; i++) {
      const w = words[i] ?? ''
      const after = words[i + 1]
      if (w === '--who' && after) {
        who = after.split(',').map(s => s.trim().toLowerCase())
        i++
      } else if (!url && /^(https?:\/\/|localhost|127\.0\.0\.1|\[::1\])/i.test(w)) {
        url = /^https?:\/\//i.test(w) ? w : `http://${w}`
      } else if (!url && /^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(w)) {
        url = `https://${w}`
      } else {
        goal.push(w)
      }
    }
    if (!url) return { text: `No URL given.\n\n${HELP}`, isTextDisplayOnly: true }
    const unknown = who.filter(id => !PERSONAS.some(p => p.id === id))
    if (unknown.length) {
      return { text: `Unknown tester: ${unknown.join(', ')}\n\n${HELP}`, isTextDisplayOnly: true }
    }

    await $.ui.open({ id: PANE, title: 'UX testers' })
    const host = url.replace(/^https?:\/\//, '').split('/')[0]
    const started: string[] = []
    const refused: string[] = []
    for (const id of who) {
      const res = await $.agent.spawn({
        prompt: spawnPrompt(url, goal.join(' ')),
        subagentType: `${TYPE_PREFIX}${id}`,
        description: `${personaName(id)} tests ${host}`,
        name: `ux-${id}`,
      })
      if (res.deny !== undefined || !res.agentId) {
        refused.push(`${personaName(id)}: ${res.deny ?? 'no agent started'}`)
        continue
      }
      started.push(personaName(id))
      await addTester($, {
        agentId: res.agentId,
        persona: id,
        url,
        status: 'running',
        startedAt: Date.now(),
        feed: [],
      })
      await patch($, res.agentId, t => ({ ...t, url }))
      await push($, res.agentId, { kind: 'status', text: `starts on ${url}` })
    }

    const lines = [
      started.length
        ? `Testing ${url} with ${started.join(', ')}. Follow along in the UX testers pane.`
        : 'No tester started.',
      ...refused.map(r => `Not started: ${r}`),
    ]
    return { text: lines.join('\n'), isTextDisplayOnly: true }
  })

  on('tool.call', async ($, e, next) => {
    const tool = String(e.tool)
    const args = e as unknown as Record<string, unknown>
    const agentId = e.agentId

    if (tool === NOTE_TOOL) {
      if (agentId && (await isTester($, agentId))) {
        const feeling = FEELINGS.find(f => f === args.feeling)
        const severity = SEVERITIES.find(s => s === args.severity)
        const issue = str(args.issue)
        await push($, agentId, { kind: 'thought', text: str(args.thought), feeling })
        if (issue) await push($, agentId, { kind: 'issue', text: issue, severity: severity ?? 'minor' })
      }
      return { result: 'Noted. Carry on.' }
    }

    if (!agentId || !tool.startsWith('mcp__Claude_Browser__')) return next(e)
    if (!(await isTester($, agentId))) return next(e)

    const step = describe(tool, args)
    if (step) await push($, agentId, { kind: 'action', text: step })
    const ran = await next(e)
    if (ran.deny !== undefined) {
      await push($, agentId, { kind: 'error', text: `blocked: ${ran.deny.slice(0, 200)}` })
    } else if (ran.isError) {
      await push($, agentId, { kind: 'error', text: `failed: ${str(ran.text).slice(0, 200)}` })
    }
    return ran
  })

  on('turn.complete', async ($, e, next) => {
    const agentId = e.agentId
    if (agentId && (await isTester($, agentId))) {
      const ok = e.reason === 'answer'
      await patch($, agentId, t => ({
        ...t,
        status: ok ? 'done' : 'failed',
        endedAt: Date.now(),
        report: e.answer || t.report,
      }))
      await push($, agentId, { kind: 'status', text: ok ? 'finished' : `stopped (${e.reason})` })
      const done = (await read($, testers)).find(t => t.agentId === agentId)
      void $.ui.toast(`${done ? nameOf(done) : 'A tester'} finished testing`)
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Markdown } = $.ui.resolve(e)
    const list = await read($, testers)
    const pick = await read($, selected)
    const back = await read($, offsets)
    const current = list.find(t => t.agentId === pick)
    const bodyRows = e.props.scroll?.bodyRows ?? e.viewport?.rows ?? 30
    const bodyCols = e.props.bodyColumns ?? e.viewport?.columns ?? 80

    if (list.length === 0) {
      return (
        <Box flexDirection="column">
          <Text weight="bold">No testers yet.</Text>
          <Text dimColor>Run /uxtest http://localhost:3000 to send them in.</Text>
        </Box>
      )
    }

    const mark = (t: Tester) =>
      t.status === 'running' ? '●' : t.status === 'done' ? '✓' : '✗'

    const tagline = (t: Tester) =>
      PERSONAS.find(p => p.id === t.persona)?.tagline ?? 'custom persona'
    const issues = (t: Tester) => t.feed.filter(i => i.kind === 'issue').length

    const line = (item: FeedItem, n: number) => {
      const i = `f${n}`
      if (item.kind === 'thought') {
        const face = item.feeling ? FEELING_MARK[item.feeling] : '💭'
        return <Text key={i} maxLines={3}>{face} “{item.text}”</Text>
      }
      if (item.kind === 'issue') {
        return (
          <Text key={i} maxLines={3} color={item.severity === 'minor' ? 'warning' : 'error'}>
            ⚠ [{item.severity}] {item.text}
          </Text>
        )
      }
      if (item.kind === 'error') return <Text key={i} maxLines={2} color="error">✗ {item.text}</Text>
      if (item.kind === 'status') return <Text key={i} maxLines={1} color="success">» {item.text}</Text>
      return <Text key={i} maxLines={1} dimColor>→ {item.text}</Text>
    }

    // One tester opened full width: its whole report.
    if (current) {
      return (
        <Box flexDirection="column" gap={1}>
          <Box flexDirection="row" gap={1}>
            <Button key="back" variant="primary" onPress={() => update($, selected, () => 'all')}>
              ← All testers
            </Button>
            <Text weight="bold">{mark(current)} {nameOf(current)}</Text>
          </Box>
          <Text dimColor>{tagline(current)} · {issues(current)} issues</Text>
          {current.report ? (
            <Markdown text={current.report} />
          ) : (
            <Text dimColor>Still testing; the report arrives when {nameOf(current)} finishes.</Text>
          )}
        </Box>
      )
    }

    // A grid of cards, each a chat of its own that keeps to its own box.
    const cols = Math.max(1, Math.min(list.length, bodyCols >= 150 ? 3 : bodyCols >= 90 ? 2 : 1))
    const cardWidth = Math.max(24, Math.floor((bodyCols - (cols - 1)) / cols))
    const gridRows = Math.ceil(list.length / cols)
    const cardHeight = Math.max(12, Math.floor((bodyRows - 1) / gridRows))
    const textWidth = Math.max(10, cardWidth - 4)
    const feedRows = cardHeight - 6 // border, header, tagline, scroll row

    const rowsOf = (item: FeedItem) => {
      const cap = item.kind === 'thought' || item.kind === 'issue' ? 3 : item.kind === 'error' ? 2 : 1
      return Math.min(cap, Math.ceil((item.text.length + 6) / textWidth))
    }

    // The items that fit, ending `skip` items before the newest.
    const window = (t: Tester) => {
      const skip = Math.min(back[t.agentId] ?? 0, Math.max(0, t.feed.length - 1))
      const end = t.feed.length - skip
      let used = 0
      let start = end
      while (start > 0) {
        const r = rowsOf(t.feed[start - 1] as FeedItem)
        if (used + r > feedRows) break
        used += r
        start--
      }
      return { items: t.feed.slice(start, end), start, skip }
    }

    const scrollBy = (id: string, delta: number, max: number) =>
      update($, offsets, o => ({ ...o, [id]: Math.max(0, Math.min(max, (o[id] ?? 0) + delta)) }))

    const card = (t: Tester) => {
      const { items, start, skip } = window(t)
      const step = Math.max(1, items.length - 1)
      return (
        <Box
          key={`card-${t.agentId}`}
          flexDirection="column"
          borderStyle="round"
          borderColor={t.status === 'running' ? 'claude' : t.status === 'done' ? 'success' : 'error'}
          paddingX={1}
          width={cardWidth}
          height={cardHeight}
          overflow="hidden"
        >
          <Text weight="bold" maxLines={1}>
            {mark(t)} {nameOf(t)} <Text dimColor>· {issues(t)} issues</Text>
          </Text>
          <Text dimColor maxLines={1}>{tagline(t)}</Text>
          <Box flexDirection="column" flexGrow={1} overflow="hidden">
            {items.length === 0 && <Text dimColor>Waiting for the first step…</Text>}
            {items.map((item, i) => line(item, start + i))}
          </Box>
          <Box flexDirection="row" gap={1}>
            <Button key={`up-${t.agentId}`} plain onPress={() => scrollBy(t.agentId, step, t.feed.length - 1)}>
              ▲
            </Button>
            <Button key={`down-${t.agentId}`} plain onPress={() => scrollBy(t.agentId, -step, t.feed.length - 1)}>
              ▼
            </Button>
            {skip > 0 && (
              <Button key={`live-${t.agentId}`} plain onPress={() => scrollBy(t.agentId, -skip, 0)}>
                latest
              </Button>
            )}
            <Button key={`open-${t.agentId}`} plain onPress={() => update($, selected, () => t.agentId)}>
              {t.report ? 'report' : 'open'}
            </Button>
          </Box>
        </Box>
      )
    }

    return (
      <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
        {list.map(card)}
      </Box>
    )
  })
}
