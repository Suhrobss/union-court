import { loadLeaderboard, setPresenterStage, startNewSession, DEFAULT_ROOM } from './realtime.js'

const params = new URL(window.location.href).searchParams
const screen = params.get('screen') || 'player'
const room = (params.get('room') || DEFAULT_ROOM).toUpperCase()
const hostKey = `union-court-host-pin-${room}`
const playerKey = `union-court-player-v6-${room}`
const joinUrl = `${window.location.origin}${import.meta.env.BASE_URL}?room=${encodeURIComponent(room)}`

let roomData = null
let controlBusy = false
let lobbyTimer = null

const esc = (value='') => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))
const clamp = (n,a,b) => Math.max(a,Math.min(b,n))
const percentage = (n,d) => d ? Math.round(n/d*100) : 0

function injectStyles(){
  if(document.getElementById('experience-upgrades-css')) return
  const style=document.createElement('style')
  style.id='experience-upgrades-css'
  style.textContent=`
  /* Brand lockup */
  .logo-slot.brand-logo-v3{width:64px;height:64px;min-width:64px;padding:0!important;border:0!important;border-radius:50%!important;background:#fff!important;overflow:hidden;box-shadow:0 8px 24px rgba(16,54,79,.12),0 0 0 1px rgba(31,99,132,.12);display:grid;place-items:center}
  .logo-slot.brand-logo-v3.small{width:46px;height:46px;min-width:46px}
  .logo-slot.brand-logo-v3.room-logo{width:70px;height:70px;min-width:70px}
  .logo-slot.brand-logo-v3 img{width:100%!important;height:100%!important;object-fit:cover!important;transform:scale(1.58);transform-origin:center;display:block}
  .logo-slot.brand-logo-v3.fallback{border-radius:16px!important;transform:none;width:auto;min-width:90px;padding:10px!important}
  .brand{gap:15px}.brand>div:last-child small{font-weight:700}.brand>div:last-child b{letter-spacing:-.01em}

  /* Join screen */
  .join-page{max-width:760px!important;padding-top:42px!important;gap:28px!important}
  .join-page .brand{justify-content:center}.join-page .brand>div:last-child b{font-size:27px}
  .join-card{position:relative;overflow:hidden;border-radius:30px!important;padding:34px!important;background:linear-gradient(160deg,#fff 0%,#fbfdfe 60%,#f2f8fb 100%)!important}
  .join-card:before{content:'§';position:absolute;right:-18px;top:-44px;font:700 230px 'Source Serif 4',serif;color:rgba(15,91,128,.035);pointer-events:none}
  .join-steps-v3{display:grid;grid-template-columns:1fr 36px 1fr;align-items:center;margin:0 auto 2px;max-width:520px;color:#668092;font-size:10px;font-weight:800;letter-spacing:.06em}
  .join-steps-v3 span{display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 12px;border:1px solid #d6e3ea;background:#fff;border-radius:999px}
  .join-steps-v3 i{height:1px;background:#c9d9e2}.join-steps-v3 b{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#0b668e;color:#fff;font-size:10px}
  .join-card input{min-height:52px!important;font-size:15px!important;background:white!important}.join-card .primary{min-height:54px;font-size:14px}
  .join-room-hint-v3{margin:10px 0 0;padding:11px 13px;border-radius:12px;background:#eef7fb;color:#496779;font-size:11px}.join-room-hint-v3 b{color:#0c618a}

  /* Player lobby after entering name */
  .lobby-player-mode{padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important}
  .lobby-player-mode>*:not(.participant-lobby-v3){display:none!important}
  .player-shell:has(.participant-lobby-v3) .stage-progress,.player-shell:has(.participant-lobby-v3) .score-pill,.player-shell:has(.participant-lobby-v3) .new-run{display:none!important}
  .participant-lobby-v3{position:relative;padding:34px;border:1px solid #cfdee6;border-radius:28px;background:linear-gradient(145deg,#fff,#f6fafc);box-shadow:0 24px 60px rgba(23,57,80,.11);text-align:center;overflow:hidden}
  .participant-lobby-v3:after{content:'⚖';position:absolute;right:-12px;bottom:-35px;font-size:150px;opacity:.035;transform:rotate(-8deg)}
  .participant-lobby-v3 .joined-check{width:62px;height:62px;margin:0 auto 16px;border-radius:50%;display:grid;place-items:center;background:#e8f7f1;color:#11765b;font-size:27px;box-shadow:0 0 0 8px rgba(22,128,103,.06)}
  .participant-lobby-v3 .eyebrow{font-size:9px;letter-spacing:.16em;font-weight:800;color:#168067}.participant-lobby-v3 h1{font-size:clamp(30px,6vw,48px);margin:10px 0 8px}.participant-lobby-v3 .player-name{display:inline-block;padding:8px 14px;border-radius:999px;background:#0e567d;color:#fff;font-weight:800;margin:4px 0 18px}
  .participant-lobby-v3 p{max-width:560px;margin:0 auto 20px;color:#587081;line-height:1.55}.participant-lobby-v3 .lobby-room{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:20px}.participant-lobby-v3 .lobby-room span{padding:9px 12px;border:1px solid #d4e0e6;border-radius:12px;background:#fff;font-size:10px}.participant-lobby-v3 .lobby-room b{color:#0b638e}.participant-lobby-v3 .lobby-pulse{display:inline-flex;gap:5px;margin:18px auto}.participant-lobby-v3 .lobby-pulse i{width:7px;height:7px;border-radius:50%;background:#2aa482;animation:lobbyPulse 1.3s ease-in-out infinite}.participant-lobby-v3 .lobby-pulse i:nth-child(2){animation-delay:.18s}.participant-lobby-v3 .lobby-pulse i:nth-child(3){animation-delay:.36s}
  .change-player-v3{border:0;background:transparent;color:#607989;text-decoration:underline;font-size:11px;padding:10px 14px;min-height:44px}
  @keyframes lobbyPulse{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}

  /* Big-screen lobby */
  .room-screen.room-lobby-active .room-kpis,.room-screen.room-lobby-active .room-main,.room-screen.room-lobby-active .analytics-grid{display:none!important}
  .room-lobby-v3{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:18px;margin-top:22px;min-height:calc(100vh - 145px)}
  .room-lobby-main,.room-lobby-join{border:1px solid #d0dee5;border-radius:26px;background:#fff;box-shadow:0 18px 44px rgba(27,56,75,.07)}
  .room-lobby-main{padding:34px;display:flex;flex-direction:column}.room-lobby-main .room-eyebrow{font-size:10px;letter-spacing:.16em;color:#148267;font-weight:800}.room-lobby-main h1{font-size:clamp(42px,6vw,76px);margin:10px 0 5px}.room-lobby-main .room-sub{color:#5f7584;font-size:14px}.room-lobby-count{display:flex;align-items:flex-end;gap:14px;margin:25px 0}.room-lobby-count b{font-size:86px;line-height:.8;color:#0d587e}.room-lobby-count span{font-size:14px;color:#617987;padding-bottom:5px}
  .participant-chips-v3{display:flex;gap:8px;flex-wrap:wrap;align-content:flex-start}.participant-chips-v3 span{padding:9px 13px;border-radius:999px;background:#f0f6f8;border:1px solid #d7e4e9;color:#25465a;font-size:11px;font-weight:700;animation:chipIn .25s ease both}.participant-chips-v3 span:first-child{background:#e9f7f2;border-color:#c0e2d5;color:#126e58}.participant-chips-v3 .more{background:#0e567d;color:#fff;border-color:#0e567d}
  .room-lobby-foot{margin-top:auto;padding-top:20px;display:flex;align-items:center;gap:10px;color:#6b7f8c;font-size:11px}.room-lobby-foot i{width:9px;height:9px;border-radius:50%;background:#22a17f;box-shadow:0 0 0 7px rgba(34,161,127,.08);animation:lobbyPulse 1.5s infinite}
  .room-lobby-join{padding:28px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(150deg,#123e59,#0b648e);color:#fff}.room-lobby-join small{letter-spacing:.16em;color:#aad1e3}.room-lobby-join h2{font-size:27px;margin:8px 0 8px}.room-lobby-join p{max-width:300px;color:#cce1eb;line-height:1.5}.room-lobby-join img{width:190px;height:190px;border-radius:18px;background:#fff;padding:10px;margin:15px 0;box-shadow:0 14px 34px rgba(0,0,0,.18)}.room-lobby-join .join-code{padding:9px 15px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(255,255,255,.08);font-weight:800;letter-spacing:.12em}
  @keyframes chipIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}

  /* Presenter controls */
  .room-reset{min-height:46px!important;padding:11px 16px!important;border-radius:14px!important}.room-reset.ready{background:#0d587e!important;color:white!important;border-color:#0d587e!important;box-shadow:0 10px 24px rgba(13,88,126,.18)}
  .host-panel.v2{max-width:1180px;margin:16px auto!important;border-radius:20px!important;padding:16px!important;box-shadow:0 18px 42px rgba(54,48,23,.09);background:linear-gradient(135deg,#fff9e9,#fff)!important}.host-panel.v2 input{min-height:46px;font-size:15px;min-width:180px}.host-panel.v2 button{min-height:46px;padding:10px 16px!important;font-weight:800}
  .presenter-console-v3{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:800;width:min(1180px,calc(100vw - 32px));border:1px solid rgba(255,255,255,.12);border-radius:22px;background:rgba(11,40,58,.96);backdrop-filter:blur(18px);color:#fff;box-shadow:0 28px 80px rgba(4,25,39,.35);padding:14px 16px;display:grid;grid-template-columns:minmax(240px,1.25fr) auto auto auto;gap:10px;align-items:center}
  .presenter-console-v3.minimized{width:auto;left:auto;right:18px;transform:none;grid-template-columns:auto auto;padding:10px 12px}.presenter-console-v3.minimized .pc-stage,.presenter-console-v3.minimized .pc-controls,.presenter-console-v3.minimized .pc-jump{display:none}
  .pc-stage{min-width:0}.pc-stage small{display:flex;align-items:center;gap:7px;color:#9cc7da;font-size:8px;letter-spacing:.13em}.pc-stage small i{width:8px;height:8px;border-radius:50%;background:#22b18a;box-shadow:0 0 0 5px rgba(34,177,138,.1)}.pc-stage small i.paused{background:#e3ad4f;box-shadow:0 0 0 5px rgba(227,173,79,.1)}.pc-stage b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:15px;margin:4px 0}.pc-stage span{font-size:9px;color:#b9cfda}
  .pc-controls{display:flex;gap:7px}.pc-controls button,.pc-jump button,.pc-mini{min-height:46px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(255,255,255,.08);color:#fff;padding:9px 13px;font-weight:800;font-size:10px}.pc-controls button:hover,.pc-jump button:hover,.pc-mini:hover{background:rgba(255,255,255,.14)}.pc-controls .pc-primary{background:linear-gradient(135deg,#178cba,#0b6e99);border-color:#279bc8;min-width:150px}.pc-controls .pc-start{background:linear-gradient(135deg,#1c9f78,#11795d);border-color:#29ad87}.pc-controls button:disabled{opacity:.35;cursor:not-allowed}
  .pc-jump{display:flex;gap:6px}.pc-jump select{height:46px;max-width:230px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:#163e55;color:#fff;padding:0 10px;font-size:10px}.pc-danger{color:#ffd7cf!important}.pc-mini{width:46px;padding:0}.pc-shortcuts{grid-column:1/-1;color:#8fb4c6;font-size:8px;letter-spacing:.04em;margin-top:-3px}.room-screen.presenter-console-on .host-panel.v2:has(.host-stage){display:none!important}
  .room-screen.presenter-console-on{padding-bottom:118px!important}

  @media(max-width:800px){.logo-slot.brand-logo-v3{width:56px;height:56px;min-width:56px}.room-lobby-v3{grid-template-columns:1fr;min-height:auto}.room-lobby-join{min-height:420px}.room-lobby-count b{font-size:70px}.presenter-console-v3{grid-template-columns:1fr;bottom:8px;width:calc(100vw - 16px)}.pc-controls,.pc-jump{display:grid;grid-template-columns:1fr 1fr}.pc-shortcuts{display:none}.join-card{padding:24px!important}.join-steps-v3{grid-template-columns:1fr;gap:6px}.join-steps-v3 i{display:none}}
  @media(prefers-reduced-motion:reduce){.lobby-pulse i,.participant-chips-v3 span{animation:none!important}}
  `
  document.head.appendChild(style)
}

function applyBrand(){
  document.querySelectorAll('.logo-slot').forEach(el=>el.classList.add('brand-logo-v3'))
}

function enhanceJoin(){
  const page=document.querySelector('.join-page')
  if(!page) return
  const card=page.querySelector('.join-card')
  if(card && !card.querySelector('.join-room-hint-v3')){
    const hint=document.createElement('div')
    hint.className='join-room-hint-v3'
    hint.innerHTML=`Кімната форуму: <b>${esc(room)}</b> · введіть ім’я, після чого ви перейдете в зал очікування.`
    card.appendChild(hint)
  }
  if(!page.querySelector('.join-steps-v3')){
    const steps=document.createElement('div')
    steps.className='join-steps-v3'
    steps.innerHTML='<span><b>1</b> Введіть ім’я</span><i></i><span><b>2</b> Чекайте старту ведучого</span>'
    const brand=page.querySelector('.brand')
    brand?.insertAdjacentElement('afterend',steps)
  }
}

function isPreStartLobby(){
  const wait=document.querySelector('.waiting-card')
  if(!wait) return false
  const text=wait.textContent||''
  return /справу ще не відкрито|очікуємо старту ведучого|ще не відкрито/i.test(text) || (!wait.querySelector('.decision-review') && document.querySelector('.score-pill b')?.textContent?.trim()==='0')
}

function enhancePlayerLobby(){
  if(screen!=='player') return
  const wait=document.querySelector('.waiting-card')
  if(!wait || !isPreStartLobby()) return
  wait.classList.add('lobby-player-mode')
  if(wait.querySelector('.participant-lobby-v3')) return
  const name=document.querySelector('.player-head .brand b')?.textContent?.trim() || 'Учасник'
  const box=document.createElement('div')
  box.className='participant-lobby-v3'
  box.innerHTML=`
    <div class="joined-check">✓</div>
    <div class="eyebrow">ВИ ПРИЄДНАЛИСЯ ДО СПРАВИ</div>
    <h1>Місце в залі за вами</h1>
    <div class="player-name">${esc(name)}</div>
    <p>Ім’я вже передано на загальний екран. Нічого більше натискати не потрібно — перший етап відкриється одночасно для всіх учасників.</p>
    <div class="lobby-pulse"><i></i><i></i><i></i></div>
    <div class="lobby-room"><span>Кімната <b>${esc(room)}</b></span><span>Статус <b>очікуємо ведучого</b></span></div>
    <button type="button" class="change-player-v3">Змінити ім’я / увійти іншим учасником</button>`
  box.querySelector('.change-player-v3').addEventListener('click',()=>{
    localStorage.removeItem(playerKey)
    window.location.reload()
  })
  wait.appendChild(box)
}

async function refreshRoomData(){
  if(screen!=='room' && screen!=='host') return
  try{
    roomData=await loadLeaderboard(room)
    renderRoomLobby()
    renderPresenterConsole()
  }catch{}
}

function renderRoomLobby(){
  const shell=document.querySelector('.room-screen')
  if(!shell || !roomData) return
  const currentStage=clamp(roomData.room?.currentStage??0,0,99)
  const paused=roomData.room?.status==='paused'
  const isLobby=paused && currentStage===0
  let lobby=shell.querySelector('.room-lobby-v3')
  if(!isLobby){
    shell.classList.remove('room-lobby-active')
    lobby?.remove()
    return
  }
  shell.classList.add('room-lobby-active')
  const players=(roomData.players||[]).filter(p=>!p.archived)
  if(!lobby){
    lobby=document.createElement('section')
    lobby.className='room-lobby-v3'
    const head=shell.querySelector('.room-head')
    head?.insertAdjacentElement('afterend',lobby)
  }
  const shown=players.slice(0,22)
  const more=Math.max(0,players.length-shown.length)
  const chips=shown.map(p=>`<span>${esc(p.display_name)}</span>`).join('') + (more?`<span class="more">+${more}</span>`:'')
  const qr=`https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(joinUrl)}`
  lobby.innerHTML=`
    <div class="room-lobby-main">
      <div class="room-eyebrow">ЗБІР УЧАСНИКІВ · СЕСІЯ ${esc(roomData.session?.sessionNo||'—')}</div>
      <h1>Входимо у справу</h1>
      <div class="room-sub">Учасники сканують QR, вводять ім’я або нік і залишаються на екрані очікування.</div>
      <div class="room-lobby-count"><b>${players.length}</b><span>${players.length===1?'учасник приєднався':'учасників приєдналися'}</span></div>
      <div class="participant-chips-v3">${chips || '<span>Очікуємо першого учасника…</span>'}</div>
      <div class="room-lobby-foot"><i></i><span>Результати вже прив’язані до поточної сесії та не залежать від тимчасового Realtime-з’єднання.</span></div>
    </div>
    <div class="room-lobby-join">
      <small>ПРИЄДНАТИСЯ ДО UNION COURT</small>
      <h2>Скануйте QR-код</h2>
      <p>Після введення імені телефон залишиться в залі очікування до команди ведучого.</p>
      <img src="${qr}" alt="QR-код для входу в UNION COURT"/>
      <div class="join-code">КІМНАТА ${esc(room)}</div>
    </div>`
}

async function goToStage(target,{force=false}={}){
  if(controlBusy || !roomData) return
  const pin=sessionStorage.getItem(hostKey)
  if(!pin) return
  const players=roomData.players||[]
  const current=clamp(roomData.room?.currentStage??0,0,18)
  const completed=players.filter(p=>p.finished||p.stage_index>current).length
  const next=clamp(target,0,18)
  if(!force && next>current && roomData.room?.status!=='paused' && players.length && completed<players.length){
    if(!window.confirm(`Завершили ${completed} із ${players.length}. Все одно відкрити наступний етап?`)) return
  }
  controlBusy=true
  renderPresenterConsole()
  try{
    await setPresenterStage(room,pin,next)
    await refreshRoomData()
  }catch(err){
    window.alert(err?.message||'Не вдалося змінити етап')
  }finally{
    controlBusy=false
    renderPresenterConsole()
  }
}

async function newSession(){
  if(controlBusy) return
  const pin=sessionStorage.getItem(hostKey)
  if(!pin) return
  if(!window.confirm('Створити новий розгляд? Поточні результати залишаться в історії.')) return
  controlBusy=true
  try{
    await startNewSession(room,pin)
    await refreshRoomData()
  }catch(err){window.alert(err?.message||'Не вдалося створити сесію')}finally{controlBusy=false;renderPresenterConsole()}
}

function renderPresenterConsole(){
  if(screen!=='room' && screen!=='host') return
  const shell=document.querySelector('.room-screen')
  if(!shell || !roomData) return
  const pin=sessionStorage.getItem(hostKey)
  let consoleEl=document.getElementById('presenter-console-v3')
  const oldButton=shell.querySelector('.room-reset')
  if(oldButton) oldButton.textContent='🎛 ПУЛЬТ ВЕДУЧОГО'
  if(!pin){
    shell.classList.remove('presenter-console-on')
    consoleEl?.remove()
    return
  }
  shell.classList.add('presenter-console-on')
  if(!consoleEl){
    consoleEl=document.createElement('div')
    consoleEl.id='presenter-console-v3'
    consoleEl.className='presenter-console-v3'
    document.body.appendChild(consoleEl)
  }
  const stages=[
    'Юридичний рентген наказу','Матеріали справи','Строк звернення','Електронне повідомлення','Вакансії','Представництво','Засідання','Позов','Судовий збір','Докази','Витребування','Профспілка','Свідок','І інстанція','Апеляція','Пов’язана справа','Постанова','Касація','Фінал'
  ]
  const current=clamp(roomData.room?.currentStage??0,0,stages.length-1)
  const paused=roomData.room?.status==='paused'
  const players=roomData.players||[]
  const completed=players.filter(p=>p.finished||p.stage_index>current).length
  const done=percentage(completed,players.length)
  const minimized=consoleEl.classList.contains('minimized')
  consoleEl.className=`presenter-console-v3${minimized?' minimized':''}`
  consoleEl.innerHTML=`
    <div class="pc-stage"><small><i class="${paused?'paused':''}"></i>${paused?'ЛОБІ · ОЧІКУЄ СТАРТУ':'ЕФІР · ЕТАП ВІДКРИТО'}</small><b>${current+1}. ${esc(stages[current])}</b><span>${players.length} у грі · ${completed}/${players.length} завершили · ${done}%</span></div>
    <div class="pc-controls">
      <button data-act="prev" ${current===0||paused?'disabled':''}>← Назад</button>
      <button data-act="main" class="pc-primary ${paused?'pc-start':''}" ${controlBusy?'disabled':''}>${paused?'▶ ПОЧАТИ РОЗГЛЯД':'Далі →'}</button>
    </div>
    <div class="pc-jump"><select aria-label="Перейти до етапу">${stages.map((s,i)=>`<option value="${i}" ${i===current?'selected':''}>${i+1}. ${esc(s)}</option>`).join('')}</select><button data-act="jump">Відкрити</button><button class="pc-danger" data-act="new">↻ Нова сесія</button></div>
    <button class="pc-mini" data-act="mini" title="Згорнути пульт">${minimized?'▣':'−'}</button>
    <div class="pc-shortcuts">Клікер: → / PageDown / пробіл — ${paused?'почати':'далі'} · ← / PageUp — назад · P — згорнути/розгорнути пульт</div>`
  consoleEl.querySelector('[data-act="prev"]')?.addEventListener('click',()=>goToStage(current-1))
  consoleEl.querySelector('[data-act="main"]')?.addEventListener('click',()=>goToStage(paused?current:current+1))
  consoleEl.querySelector('[data-act="jump"]')?.addEventListener('click',()=>{
    const target=Number(consoleEl.querySelector('select')?.value??current)
    if(target!==current && !window.confirm(`Відкрити етап ${target+1}?`)) return
    goToStage(target,{force:true})
  })
  consoleEl.querySelector('[data-act="new"]')?.addEventListener('click',newSession)
  consoleEl.querySelector('[data-act="mini"]')?.addEventListener('click',()=>{consoleEl.classList.toggle('minimized');renderPresenterConsole()})
}

function renderAll(){
  applyBrand()
  enhanceJoin()
  enhancePlayerLobby()
  if(screen==='room'||screen==='host') renderPresenterConsole()
}

function setupClicker(){
  if(screen!=='room' && screen!=='host') return
  window.addEventListener('keydown',e=>{
    const pin=sessionStorage.getItem(hostKey)
    if(!pin || !roomData) return
    if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return
    const current=clamp(roomData.room?.currentStage??0,0,18)
    const paused=roomData.room?.status==='paused'
    if(['ArrowRight','PageDown',' '].includes(e.key)){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
      goToStage(paused?current:current+1)
    }else if(['ArrowLeft','PageUp'].includes(e.key)){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
      if(!paused) goToStage(current-1)
    }else if(e.key==='p'||e.key==='P'){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
      const c=document.getElementById('presenter-console-v3');if(c){c.classList.toggle('minimized');renderPresenterConsole()}
    }
  },true)
}

injectStyles()
setupClicker()
renderAll()
new MutationObserver(()=>renderAll()).observe(document.documentElement,{childList:true,subtree:true})

if(screen==='room'||screen==='host'){
  refreshRoomData()
  lobbyTimer=setInterval(refreshRoomData,3000)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshRoomData()})
}
