import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lzgbrwwzxqmoivndagyh.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_uLsHZdpZedzJKX42KOfnjQ_4L-1TNDr'
const GAME_API_URL = `${SUPABASE_URL}/functions/v1/union-court-api`

export const DEFAULT_ROOM = 'FORUM26'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

async function gameApi(payload) {
  const response = await fetch(GAME_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || `Game API error ${response.status}`)
  return data
}

export function createRefreshChannel(roomCode, onRefresh) {
  const room = (roomCode || DEFAULT_ROOM).trim().toUpperCase()
  const channel = supabase.channel(`union-court:${room}`, { config: { broadcast: { self: false } } })
  channel
    .on('broadcast', { event: 'refresh' }, (payload) => onRefresh?.('refresh', payload?.payload || {}))
    .on('broadcast', { event: 'session_reset' }, (payload) => onRefresh?.('session_reset', payload?.payload || {}))
    .subscribe()
  return channel
}

export const joinGame = (displayName, roomCode = DEFAULT_ROOM) => gameApi({ action: 'join', displayName, roomCode })
export const resumeGame = (playerId, sessionToken) => gameApi({ action: 'resume', playerId, sessionToken })
export const restartGame = (playerId, sessionToken) => gameApi({ action: 'restart', playerId, sessionToken })
export const submitGameStage = ({ playerId, sessionToken, stageId, answer }) => gameApi({ action: 'submit', playerId, sessionToken, stageId, answer })
export const loadLeaderboard = (roomCode = DEFAULT_ROOM) => gameApi({ action: 'leaderboard', roomCode })
export const startNewSession = (roomCode = DEFAULT_ROOM, hostPin = '') => gameApi({ action: 'new_session', roomCode, hostPin })
