export type Feeling = 'happy' | 'neutral' | 'curious' | 'confused' | 'frustrated'

export type Severity = 'minor' | 'major' | 'blocker'

export type FeedItem = {
  at: number
  kind: 'thought' | 'action' | 'issue' | 'error' | 'status'
  text: string
  feeling?: Feeling
  severity?: Severity
}

export type Tester = {
  agentId: string
  persona: string
  label?: string
  url: string
  status: 'running' | 'done' | 'failed'
  startedAt: number
  endedAt?: number
  feed: FeedItem[]
  report?: string
}

declare module 'claude-code' {
  interface PluginState {
    'ux-testers': {
      testers: Shaped<Tester[]>
      selected: string
      offsets: Record<string, number>
    }
  }
}
