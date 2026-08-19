import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lzgbrwwzxqmoivndagyh.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_uLsHZdpZedzJKX42KOfnjQ_4L-1TNDr'
const GAME_API_URL = `${SUPABASE_URL}/functions/v1/union-court-api`

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
}

async function gameApi(payload) {
  const response = await fetch(GAME_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || `Game API error ${response.status}`)
  return data
}

export async function joinGame(displayName, roomCode = DEFAULT_ROOM) {
  return gameApi({ action: 'join', displayName, roomCode })
}

export async function submitGameStage({ playerId, sessionToken, stageId, answer }) {
  return gameApi({ action: 'submit', playerId, sessionToken, stageId, answer })
}

export async function loadLeaderboard(roomCode = DEFAULT_ROOM) {
  return gameApi({ action: 'leaderboard', roomCode })
}
