import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lzgbrwwzxqmoivndagyh.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_uLsHZdpZedzJKX42KOfnjQ_4L-1TNDr'

export const DEFAULT_ROOM = 'FORUM26'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

export function makePlayerId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `p_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function createRoomChannel(roomCode, playerId) {
  const room = (roomCode || DEFAULT_ROOM).trim().toUpperCase()
  return supabase.channel(`union-court:${room}`, {
    config: {
      presence: { key: playerId || `screen_${Date.now()}` },
    },
  })
}

export function flattenPresence(state) {
  return Object.values(state || {})
    .flat()
    .filter(Boolean)
    .filter((item) => item.kind === 'player')
    .sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0)
      if ((b.accuracy || 0) !== (a.accuracy || 0)) return (b.accuracy || 0) - (a.accuracy || 0)
      return (a.elapsedMs || Infinity) - (b.elapsedMs || Infinity)
    })
}
