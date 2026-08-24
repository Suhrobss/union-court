import { loadLeaderboard, setPresenterStage, startNewSession, DEFAULT_ROOM } from './realtime.js'

const params = new URL(window.location.href).searchParams
const screen = params.get('screen') || 'player'
if (screen !== 'room' && screen !== 'host') {
  // This module is intentionally inert on participant phones.
} else {
  const EVENT_TITLE = 'The Lake of knowledge'
  const room = (params.get('room') || DEFAULT_ROOM).toUpperCase()
  const PIN_KEY = `union-court-stable-host-pin-${room}`
  const OLD_PIN_KEY = `union-court-host-pin-${room}`
  const STAGES = [
    'Юридичний рентген наказу','Матеріали справи','Строк звернення','Електронне повідомлення','Вакансії',
    'Представництво','Засідання','Позов','Судовий збір','Докази','Витребування','Профспілка','Свідок',
    'І інстанція','Апеляція','Пов’язана справа','Постанова','Касація','Фінал'
  ]

  let data = null
  let busy = false
  let opened = false
  let minimized = false
  let connected = false
  let lastError = ''
  let mounted = false

  const clamp = (n,a,b) => Math.max(a,Math.min(b,n))
  const pct = (n,d) => d ? Math.round(n/d*100) : 0

  function injectStyles(){
    if(document.getElementById('stable-room-admin-css')) return
    const style = document.createElement('style')
    style.id = 'stable-room-admin-css'
    style.textContent = `
      .room-screen .room-reset,.room-screen .host-panel{display:none!important}
      .stable-admin-toggle{position:fixed;right:22px;bottom:22px;z-index:1200;border:0;border-radius:16px;background:#0d506f;color:#fff;min-height:52px;padding:0 18px;font:800 12px/1 system-ui;box-shadow:0 18px 45px rgba(10,45,66,.25);display:flex;align-items:center;gap:10px;cursor:pointer}
      .stable-admin-toggle i{width:9px;height:9px;border-radius:50%;background:#29b78f;box-shadow:0 0 0 6px rgba(41,183,143,.12)}
      .stable-admin-toggle.offline i{background:#d65e59;box-shadow:0 0 0 6px rgba(214,94,89,.12)}
      .stable-admin{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:1250;width:min(1180px,calc(100vw - 28px));border:1px solid rgba(255,255,255,.14);border-radius:24px;background:rgba(10,37,54,.97);backdrop-filter:blur(18px);box-shadow:0 30px 90px rgba(3,22,34,.38);color:#fff;padding:14px;display:grid;grid-template-columns:minmax(260px,1fr) auto auto auto;gap:10px;align-items:center;font-family:system-ui,sans-serif}
      .stable-admin.hidden{display:none}.stable-admin.minimized{left:auto;right:18px;transform:none;width:auto;grid-template-columns:auto auto;padding:10px 12px}.stable-admin.minimized .sa-main,.stable-admin.minimized .sa-actions,.stable-admin.minimized .sa-jump,.stable-admin.minimized .sa-help{display:none}
      .sa-main{min-width:0}.sa-main small{display:flex;gap:8px;align-items:center;color:#9ac5d8;font-size:9px;letter-spacing:.1em}.sa-main small i{width:8px;height:8px;border-radius:50%;background:#22b38a}.sa-main small i.paused{background:#e5aa46}.sa-main b{display:block;font-size:16px;margin:5px 0 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sa-main span{font-size:10px;color:#bdd1db}.sa-error{display:block!important;color:#ffb0a8!important;margin-top:4px!important;letter-spacing:0!important}
      .sa-actions,.sa-jump{display:flex;gap:7px;align-items:center}.stable-admin button,.stable-admin select,.stable-admin input{min-height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.16);font:800 10px system-ui}.stable-admin button{background:rgba(255,255,255,.08);color:#fff;padding:0 14px;cursor:pointer}.stable-admin button:hover{background:rgba(255,255,255,.14)}.stable-admin button:disabled{opacity:.35;cursor:not-allowed}.stable-admin .sa-primary{background:linear-gradient(135deg,#178fbd,#0c6d96);border-color:#2b9fc9;min-width:145px}.stable-admin .sa-start{background:linear-gradient(135deg,#1f9f79,#10755a);border-color:#33b18c}.stable-admin .sa-new{color:#ffd6ce}.stable-admin select{max-width:220px;background:#153f56;color:#fff;padding:0 10px}.stable-admin .sa-mini{width:46px;padding:0}.sa-help{grid-column:1/-1;color:#84adbf;font-size:8px;margin-top:-2px}.stable-admin-pin{grid-column:1/-1;display:flex;gap:9px;align-items:center;padding:4px}.stable-admin-pin span{font-size:11px;color:#c5d7df}.stable-admin-pin input{background:#fff;color:#18394c;padding:0 12px;min-width:170px}.stable-admin-pin button{background:#177da5}.stable-admin-pin .cancel{background:transparent}
      body.stable-admin-open .room-screen{padding-bottom:118px!important}
      @media(max-width:850px){.stable-admin{grid-template-columns:1fr}.sa-actions,.sa-jump{display:grid;grid-template-columns:1fr 1fr}.sa-jump select{max-width:none}.sa-help{display:none}.stable-admin-toggle{right:10px;bottom:10px}}
    `
    document.head.appendChild(style)
  }

  function ensureMount(){
    const shell = document.querySelector('.room-screen')
    if(!shell) return false
    if(mounted) return true
    mounted = true
    injectStyles()
    // Disable the old React host key listener state on future refreshes; this new controller uses its own key.
    sessionStorage.removeItem(OLD_PIN_KEY)

    const toggle = document.createElement('button')
    toggle.id = 'stable-admin-toggle'
    toggle.className = 'stable-admin-toggle'
    toggle.innerHTML = '<i></i><span>🎛 ПАНЕЛЬ ВЕДУЧОГО</span>'
    toggle.addEventListener('click',()=>{opened=!opened;renderPanel()})
    document.body.appendChild(toggle)

    const panel = document.createElement('section')
    panel.id = 'stable-admin'
    panel.className = 'stable-admin hidden'
    document.body.appendChild(panel)
    renderPanel()
    return true
  }

  function currentState(){
    const current = clamp(data?.room?.currentStage ?? 0, 0, STAGES.length-1)
    const paused = data?.room?.status === 'paused'
    const players = data?.players || []
    const completed = players.filter(p => p.finished || p.stage_index > current).length
    return {current, paused, players, completed, percent:pct(completed,players.length)}
  }

  function renderPanel(){
    if(!ensureMount()) return
    const panel = document.getElementById('stable-admin')
    const toggle = document.getElementById('stable-admin-toggle')
    toggle?.classList.toggle('offline',!connected)
    if(!panel) return
    panel.classList.toggle('hidden',!opened)
    document.body.classList.toggle('stable-admin-open',opened&&!minimized)
    if(!opened) return

    const pin = sessionStorage.getItem(PIN_KEY)
    if(!pin){
      panel.className = 'stable-admin'
      panel.innerHTML = `<div class="stable-admin-pin"><span>Введіть PIN ведучого</span><input id="sa-pin" type="password" inputmode="numeric" autocomplete="off" placeholder="PIN"><button id="sa-unlock">Розблокувати</button><button class="cancel" id="sa-close">Закрити</button></div>`
      panel.querySelector('#sa-unlock')?.addEventListener('click',()=>{
        const value = panel.querySelector('#sa-pin')?.value?.trim()
        if(!value) return
        sessionStorage.setItem(PIN_KEY,value)
        renderPanel()
      })
      panel.querySelector('#sa-close')?.addEventListener('click',()=>{opened=false;renderPanel()})
      return
    }

    const {current,paused,players,completed,percent} = currentState()
    panel.className = `stable-admin${minimized?' minimized':''}`
    panel.innerHTML = `
      <div class="sa-main"><small><i class="${paused?'paused':''}"></i>${paused?'ОЧІКУЄМО СТАРТУ':'ЕТАП ВІДКРИТО'} · ${EVENT_TITLE}</small><b>${current+1}. ${STAGES[current]}</b><span>${players.length} у грі · ${completed}/${players.length} завершили · ${percent}%</span>${lastError?`<small class="sa-error">${lastError}</small>`:''}</div>
      <div class="sa-actions"><button data-act="prev" ${busy||paused||current===0?'disabled':''}>← Назад</button><button class="sa-primary ${paused?'sa-start':''}" data-act="main" ${busy?'disabled':''}>${busy?'Зачекайте…':paused?'▶ ПОЧАТИ':'Далі →'}</button></div>
      <div class="sa-jump"><select aria-label="Перейти до етапу">${STAGES.map((s,i)=>`<option value="${i}" ${i===current?'selected':''}>${i+1}. ${s}</option>`).join('')}</select><button data-act="jump" ${busy?'disabled':''}>Відкрити</button><button class="sa-new" data-act="new" ${busy?'disabled':''}>↻ Нова сесія</button></div>
      <button class="sa-mini" data-act="mini">${minimized?'▣':'−'}</button>
      <div class="sa-help">Клікер: → / PageDown / пробіл — ${paused?'почати':'далі'} · ← / PageUp — назад · P — згорнути/розгорнути</div>`
    panel.querySelector('[data-act="prev"]')?.addEventListener('click',()=>goTo(current-1))
    panel.querySelector('[data-act="main"]')?.addEventListener('click',()=>goTo(paused?current:current+1))
    panel.querySelector('[data-act="jump"]')?.addEventListener('click',()=>{
      const target = Number(panel.querySelector('select')?.value ?? current)
      if(target!==current && !confirm(`Відкрити етап ${target+1}: ${STAGES[target]}?`)) return
      goTo(target,true)
    })
    panel.querySelector('[data-act="new"]')?.addEventListener('click',newSession)
    panel.querySelector('[data-act="mini"]')?.addEventListener('click',()=>{minimized=!minimized;renderPanel()})
  }

  async function refresh(){
    try{
      data = await loadLeaderboard(room)
      connected = true
      lastError = ''
    }catch(e){
      connected = false
      lastError = e?.message || 'Немає зв’язку із сервером'
    }
    renderPanel()
  }

  async function goTo(target,force=false){
    const pin = sessionStorage.getItem(PIN_KEY)
    if(!pin || !data || busy) return
    const {current,paused,players,completed} = currentState()
    target = clamp(target,0,STAGES.length-1)
    if(!force && !paused && target>current && players.length && completed<players.length){
      if(!confirm(`Завершили ${completed} із ${players.length}. Все одно перейти далі?`)) return
    }
    busy = true; lastError=''; renderPanel()
    try{
      await setPresenterStage(room,pin,target)
      await refresh()
    }catch(e){
      lastError = e?.message || 'Не вдалося змінити етап'
      if(/pin/i.test(lastError)) sessionStorage.removeItem(PIN_KEY)
    }finally{
      busy = false
      renderPanel()
    }
  }

  async function newSession(){
    const pin = sessionStorage.getItem(PIN_KEY)
    if(!pin || busy) return
    if(!confirm('Створити новий розгляд? Поточні результати залишаться в історії.')) return
    busy=true;lastError='';renderPanel()
    try{
      await startNewSession(room,pin)
      await refresh()
    }catch(e){
      lastError=e?.message||'Не вдалося створити нову сесію'
      if(/pin/i.test(lastError)) sessionStorage.removeItem(PIN_KEY)
    }finally{busy=false;renderPanel()}
  }

  function setupKeyboard(){
    window.addEventListener('keydown',e=>{
      const pin = sessionStorage.getItem(PIN_KEY)
      if(!pin || !data) return
      if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return
      const {current,paused} = currentState()
      if(['ArrowRight','PageDown',' '].includes(e.key)){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();goTo(paused?current:current+1)
      }else if(['ArrowLeft','PageUp'].includes(e.key)){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(!paused)goTo(current-1)
      }else if(e.key==='p'||e.key==='P'){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();opened=true;minimized=!minimized;renderPanel()
      }
    },true)
  }

  function boot(){
    let attempts=0
    const timer=setInterval(()=>{
      attempts++
      if(ensureMount()||attempts>40) clearInterval(timer)
    },150)
    setupKeyboard()
    refresh()
    setInterval(refresh,2200)
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh()})
    window.addEventListener('online',refresh)
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true})
  else boot()
}
