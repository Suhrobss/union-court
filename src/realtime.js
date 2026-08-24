import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lzgbrwwzxqmoivndagyh.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_uLsHZdpZedzJKX42KOfnjQ_4L-1TNDr'
const GAME_API_URL = `${SUPABASE_URL}/functions/v1/union-court-api`

export const DEFAULT_ROOM = 'THELAKE'

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
  if (!response.ok) {
    const error = new Error(data?.error || `Game API error ${response.status}`)
    error.data = data
    throw error
  }
  return data
}

function normalizeRoom(roomCode) {
  return (roomCode || DEFAULT_ROOM).trim().toUpperCase()
}

export function createRefreshChannel(roomCode, onRefresh) {
  const room = normalizeRoom(roomCode)
  const channel = supabase.channel(`union-court:${room}`, { config: { broadcast: { self: false } } })
  channel
    .on('broadcast', { event: 'refresh' }, (payload) => onRefresh?.('refresh', payload?.payload || {}))
    .on('broadcast', { event: 'session_reset' }, (payload) => onRefresh?.('session_reset', payload?.payload || {}))
    .on('broadcast', { event: 'stage_advance' }, (payload) => onRefresh?.('stage_advance', payload?.payload || {}))
    .subscribe()
  return channel
}

async function broadcastRoom(roomCode, event, payload = {}) {
  const room = normalizeRoom(roomCode)
  const channel = supabase.channel(`union-court:${room}`, { config: { broadcast: { self: true } } })
  return new Promise((resolve) => {
    let settled = false
    const done = (value) => {
      if (settled) return
      settled = true
      setTimeout(() => supabase.removeChannel(channel), 120)
      resolve(value)
    }
    const timer = setTimeout(() => done(false), 2500)
    channel.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return
      try {
        await channel.send({ type: 'broadcast', event, payload })
        clearTimeout(timer)
        done(true)
      } catch {
        clearTimeout(timer)
        done(false)
      }
    })
  })
}

export const joinGame = (displayName, roomCode = DEFAULT_ROOM) => gameApi({ action: 'join', displayName, roomCode })
export const resumeGame = (playerId, sessionToken) => gameApi({ action: 'resume', playerId, sessionToken })
export const restartGame = (playerId, sessionToken) => gameApi({ action: 'restart', playerId, sessionToken })
export const submitGameStage = ({ playerId, sessionToken, stageId, answer }) => gameApi({ action: 'submit', playerId, sessionToken, stageId, answer })
export const loadLeaderboard = (roomCode = DEFAULT_ROOM) => gameApi({ action: 'leaderboard', roomCode })

export async function setPresenterStage(roomCode = DEFAULT_ROOM, hostPin = '', stageIndex = 0) {
  const result = await gameApi({ action: 'set_stage', roomCode, hostPin, stageIndex })
  await broadcastRoom(roomCode, 'stage_advance', {
    stageIndex: result.room?.current_stage,
    status: result.room?.status,
    sessionId: result.session?.id,
  })
  return result
}

export async function startNewSession(roomCode = DEFAULT_ROOM, hostPin = '') {
  const result = await gameApi({ action: 'new_session', roomCode, hostPin })
  await broadcastRoom(roomCode, 'session_reset', {
    sessionId: result.session?.id,
    sessionNo: result.session?.session_no,
  })
  return result
}
