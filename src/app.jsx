import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './patch.css'
import {
  STAGES, CHAPTERS, DIMENSIONS, FICTIONAL_ORDER, ORDER_AREAS, HISTORY_DOCS, VIBER_ITEMS,
  EMPLOYER_UNITS, DEFENSE_MODES, REPRESENTATIVE_EXAMPLES, CREDENTIALS, BAG_ITEMS, CLAIM_ITEMS,
  FEE_OPTIONS, PROOF_CHOICES, UNION_ACTIONS, WITNESS_QUESTIONS, WITNESS_REPLIES,
  APPEAL_ATTACKS, PARALLEL_OPTIONS, CASSATION_KEYS, OPTION_LABELS, WIN, SOCIALS,
} from './gameData'
import {
  DEFAULT_ROOM, joinGame, resumeGame, restartGame, submitGameStage,
  loadLeaderboard, startNewSession, setPresenterStage, createRefreshChannel,
} from './realtime'

const url = new URL(window.location.href)
const SCREEN = url.searchParams.get('screen') || 'player'
const URL_ROOM = (url.searchParams.get('room') || DEFAULT_ROOM).toUpperCase()
const PLAYER_KEY = `union-court-player-v6-${URL_ROOM}`
const HOST_KEY = `union-court-host-pin-${URL_ROOM}`
const clamp = (n,a,b) => Math.max(a,Math.min(b,n))
const pct = (n,d) => d ? Math.round(n/d*100) : 0
const toggle = (arr,id,max=99) => arr.includes(id) ? arr.filter(x=>x!==id) : (arr.length<max ? [...arr,id] : arr)
const uniq = arr => [...new Set(arr)]

function currentChapter(stageIndex){
  const idx = CHAPTERS.findIndex(c => stageIndex >= c.range[0] && stageIndex <= c.range[1])
  return { chapter: CHAPTERS[Math.max(0,idx)] || CHAPTERS[0], index: Math.max(0,idx) }
}

function BrandLogo({small=false,room=false}){
  const [failed,setFailed] = useState(false)
  const cls = `logo-slot ${small?'small':''} ${room?'room-logo':''} ${failed?'fallback':''}`
  return <div className={cls}>{!failed ? <img src={`${import.meta.env.BASE_URL}assets/mr-prmtu-logo.png`} onError={()=>setFailed(true)} alt="Лого МР ПРМТУ"/> : <span>{small?'ЛОГО':'МІСЦЕ ДЛЯ ЛОГО'}<br/>МР ПРМТУ</span>}</div>
}

function StageHead({stage,index}){
  const {chapter,index:chapterIndex} = currentChapter(index)
  return <>
    <div className="chapter-line"><span>ГЛАВА {chapterIndex+1} / {CHAPTERS.length}</span><b>{chapter.title}</b></div>
    <div className="kicker">Етап {index+1} · {stage.label}</div>
    <h1>{stage.title}</h1>
  </>
}

function Option({active,onClick,children,disabled=false}){
  return <button disabled={disabled} onClick={onClick} className={`option ${active?'active':''}`}>{children}</button>
}
function Instruction({children}){return <div className="instruction">{children}</div>}

function OrderStage({answer,setAnswer}){
  const inspected = answer.inspected || []
  const priorities = answer.priorities || []
  const inspect = id => setAnswer({...answer,inspected:uniq([...inspected,id])})
  const label = id => ORDER_AREAS.find(x=>x.id===id)?.label || id
  return <div className="stage-grid order-layout">
    <div className="paper-wrap"><div className="scan-line"/><article className="order-paper">
      <div className="paper-safe">НАВЧАЛЬНА РЕКОНСТРУКЦІЯ · ІДЕНТИФІКУЮЧІ РЕКВІЗИТИ ВИГАДАНІ</div>
      <header><small>Кадровий документ</small><h2>{FICTIONAL_ORDER.employer}</h2><div>Код {FICTIONAL_ORDER.code}</div></header>
      <div className="order-title">НАКАЗ (РОЗПОРЯДЖЕННЯ)<br/><b>про припинення трудового договору</b></div>
      <div className="order-row"><button className={inspected.includes('dates')?'seen':''} onClick={()=>inspect('dates')}><b>{FICTIONAL_ORDER.orderNo}</b><span>від {FICTIONAL_ORDER.orderDate}</span></button><button className={inspected.includes('dates')?'seen':''} onClick={()=>inspect('dates')}><span>Дата звільнення</span><b>{FICTIONAL_ORDER.dismissalDate}</b></button></div>
      <button className={`doc-line ${inspected.includes('basis')?'seen':''}`} onClick={()=>inspect('basis')}><span>Працівник</span><b>{FICTIONAL_ORDER.employee}</b> · таб. № {FICTIONAL_ORDER.personnelNo}</button>
      <button className={`doc-line ${inspected.includes('transfer')?'seen':''}`} onClick={()=>inspect('transfer')}><span>Посада</span><b>{FICTIONAL_ORDER.position}</b></button>
      <button className={`reason ${inspected.includes('causation')?'seen':''}`} onClick={()=>inspect('causation')}><span>Підстава припинення</span><b>{FICTIONAL_ORDER.basis}</b><p>{FICTIONAL_ORDER.reason}</p></button>
      <button className={`doc-line ${inspected.includes('causation')?'seen':''}`} onClick={()=>inspect('causation')}><span>Документ-підстава</span>{FICTIONAL_ORDER.source}</button>
      <button className={`doc-line ${inspected.includes('payments')?'seen':''}`} onClick={()=>inspect('payments')}><span>Розрахунок</span>{FICTIONAL_ORDER.vacation}; {FICTIONAL_ORDER.severance}</button>
      <button className={`signature ${inspected.includes('authority')?'seen':''}`} onClick={()=>inspect('authority')}><span>{FICTIONAL_ORDER.signer}</span><i>підпис</i></button>
      <button className={`service-box ${inspected.includes('service')?'seen':''}`} onClick={()=>inspect('service')}><b>З наказом ознайомлений(а)</b><span>дата __________ підпис __________</span></button>
    </article></div>
    <aside className="inspection">
      <div className="radar"><span>{inspected.length}</span><small>зон досліджено</small></div>
      <h3>Спочатку — огляд</h3><p>Натискайте на реквізити документа. До фіксації рішення система не підказує, які з них є головними.</p>
      <div className="findings">{inspected.slice(-5).reverse().map(id=><div key={id}><b>✓ {label(id)}</b><span>Фрагмент додано до вашого огляду.</span></div>)}</div>
      {inspected.length>=4&&<div className="priority-box"><h3>У вас 5 маркерів</h3><p>Оберіть рівно п’ять напрямків, які першими перевірите для майбутнього оскарження.</p>{ORDER_AREAS.map(a=><Option key={a.id} active={priorities.includes(a.id)} disabled={!priorities.includes(a.id)&&priorities.length>=5} onClick={()=>setAnswer({...answer,priorities:toggle(priorities,a.id,5)})}>{a.label}</Option>)}<div className="counter">{priorities.length}/5</div></div>}
    </aside>
  </div>
}

function HistoryStage({answer,setAnswer}){
  const opened = answer.opened || []
  return <div><Instruction>Перед вами три матеріали з хронології. Відкрийте їх — передісторію не потрібно було знати заздалегідь.</Instruction><div className="file-cabinet">{HISTORY_DOCS.map((d,i)=><button key={d.id} className={`sealed-file ${opened.includes(d.id)?'open':''}`} onClick={()=>setAnswer({opened:uniq([...opened,d.id])})}><span className="file-index">0{i+1}</span><b>{opened.includes(d.id)?d.label:d.title}</b><small>{opened.includes(d.id)?d.date:'Відкрити матеріал'}</small>{opened.includes(d.id)&&<p>{d.text}</p>}</button>)}</div>{opened.length===3&&<div className="history-reveal"><span>ПРОСТІЙ</span><i>→</i><span>ПРИЗУПИНЕННЯ</span><i>→</i><strong>ЗВІЛЬНЕННЯ</strong></div>}</div>
}

function TermStage({answer,setAnswer}){
  const day = answer.offset ?? 1
  return <div className="focus-stage"><div className="calendar-card"><small>КОПІЮ НАКАЗУ ВРУЧЕНО</small><b>15 СІЧНЯ</b></div><Instruction>Повзунок стартує з 1 дня. Перетягніть його на кількість календарних днів, яка у цьому прикладі приводить до відповідної дати наступного місяця.</Instruction><div className="deadline-line"><span>1</span><input aria-label="Кількість днів" type="range" min="1" max="50" value={day} onChange={e=>setAnswer({offset:+e.target.value})}/><span>50</span></div><div className="big-number">{day}<small>днів</small></div><div className="term-note">Юридична формула, яку треба запам’ятати: <b>місячний строк</b>, а не універсальні «30 днів».</div></div>
}

function ViberStage({answer,setAnswer}){
  const selected = answer.selected || []
  return <div className="phone-scene"><div className="fake-phone"><div className="phone-top">Роботодавець <span>сьогодні</span></div><div className="bubble">Надсилаємо кадрові документи та перелік вакансій.<div className="attachment">IMG_2041.jpg · 1 стор.</div><div className="attachment">vacancies.pdf · 18 стор.</div><small>18:42 ✓✓</small></div></div><div><Instruction>Дослідіть електронне повідомлення як доказ. Оберіть усе, що ви перевірите.</Instruction><div className="choice-stack">{VIBER_ITEMS.map(([id,label])=><Option key={id} active={selected.includes(id)} onClick={()=>setAnswer({selected:toggle(selected,id)})}>{label}</Option>)}</div></div></div>
}

function BranchesStage({answer,setAnswer}){
  const selected = answer.selected || []
  return <div className="branches-stage"><Instruction>Не рахуйте філії. Визначте <b>межі самого роботодавця</b>: де перевіряємо підходящі вакансії, якщо працівника звільняють через неможливість забезпечити роботою?</Instruction><div className="employer-map"><div className="entity-core"><small>РОБОТОДАВЕЦЬ</small><b>ОДНА ЮРИДИЧНА ОСОБА</b><span>її підрозділи з’єднані однією рамкою</span></div><div className="entity-zone">{EMPLOYER_UNITS.filter(x=>x.kind==='same').map((u,i)=><button key={u.id} className={`unit-card ${selected.includes(u.id)?'active':''}`} onClick={()=>setAnswer({selected:toggle(selected,u.id,3)})}><i>{i+1}</i><b>{u.title}</b><small>{u.meta}</small></button>)}</div><div className="outside-zone"><small>ПОЗА МЕЖАМИ ЦЬОГО РОБОТОДАВЦЯ</small>{EMPLOYER_UNITS.filter(x=>x.kind==='other').map(u=><button key={u.id} className={`unit-card outsider ${selected.includes(u.id)?'active':''}`} onClick={()=>setAnswer({selected:toggle(selected,u.id,3)})}><b>{u.title}</b><small>{u.meta}</small></button>)}</div></div><div className="branch-question">Оберіть до трьох місць, де ви перевірятимете вакансії.</div></div>
}

function DefenseStage({answer,setAnswer}){
  const mode = answer.route || ''
  const cred = answer.credential || ''
  return <div className="defense-stage"><Instruction>У трудовому спорі є кілька законних шляхів участі фізичної особи. Оберіть один, а потім правильно оформіть повноваження — якщо представник взагалі потрібен.</Instruction><div className="court-paths">{DEFENSE_MODES.map(m=><button key={m.id} className={`path-door ${mode===m.id?'active':''}`} onClick={()=>setAnswer({route:m.id,credential:''})}><span>{m.icon}</span><b>{m.title}</b><small>{m.meta}</small><p>{m.desc}</p></button>)}</div>{mode==='adult'&&<div className="rep-examples"><b>Хто може бути «іншою повнолітньою особою»?</b><div>{REPRESENTATIVE_EXAMPLES.map(x=><span key={x.id}><strong>{x.title}</strong><small>{x.meta}</small></span>)}</div></div>}{mode&&<><div className="authority-heading"><span>КРОК 2</span><b>Чим підтверджуємо цей шлях?</b></div><div className="credential-cards">{CREDENTIALS.map(c=><button key={c.id} className={cred===c.id?'active':''} onClick={()=>setAnswer({...answer,credential:c.id})}>{c.title}</button>)}</div></>}</div>
}

function BagStage({answer,setAnswer,session}){
  const selected = answer.selected || []
  const route = session?.profile?.defenseRoute || 'self'
  const represented = route !== 'self'
  return <div className="bag-stage-v2"><div className="traveler-scene"><div className="court-person"><i className="head"/><i className="body"/><span>ВИ</span></div><div className="orbit-items">{selected.map((id,i)=>{const item=BAG_ITEMS.find(x=>x.id===id);return <div key={id} className={`orbit-item o${i+1}`}><b>{item?.icon}</b><span>{item?.title}</span></div>})}</div><div className="court-briefcase"><div className="handle"/><b>{selected.length}/5</b><span>{represented?'ви йдете через представника':'ви представляєте себе особисто'}</span></div></div><div><Instruction>У вас лише п’ять місць. Обирайте не «все корисне», а те, без чого ви найменше хочете опинитися в реальному засіданні.</Instruction><div className="bag-items clean">{BAG_ITEMS.map(x=><button key={x.id} disabled={!selected.includes(x.id)&&selected.length>=5} className={selected.includes(x.id)?'active':''} onClick={()=>setAnswer({selected:toggle(selected,x.id,5)})}><span>{x.icon}</span><b>{x.title}</b></button>)}</div></div></div>
}

function ClaimStage({answer,setAnswer}){
  const selected = answer.selected || []
  return <div className="claim-builder"><div className="claim-options"><Instruction>Оберіть вимоги, які мають юридично відновити порушене право.</Instruction>{CLAIM_ITEMS.map(([id,label])=><Option key={id} active={selected.includes(id)} onClick={()=>setAnswer({selected:toggle(selected,id)})}>{label}</Option>)}</div><article className="claim-document"><header><small>ДО СУДУ</small><b>ПОЗОВНА ЗАЯВА</b><span>про оскарження звільнення</span></header><div className="claim-body-lines"/><footer><b>ПРОШУ СУД:</b>{selected.length===0?<p className="empty-claim">Оберіть вимоги — вони з’являться тут як резолютивна частина позову.</p>:<ol>{selected.map(id=><li key={id}>{CLAIM_ITEMS.find(x=>x[0]===id)?.[1]}</li>)}</ol>}</footer></article></div>
}

function FeeStage({answer,setAnswer}){
  return <div className="fee-stage-v2"><div className="fee-seal">₴</div><Instruction>Позивач заявляє вимогу про поновлення на роботі. Який судовий збір він сплачує за таку вимогу?</Instruction><div className="fee-options">{FEE_OPTIONS.map(([id,label])=><button key={id} className={answer.choice===id?'active':''} onClick={()=>setAnswer({choice:id})}><small>СУДОВИЙ ЗБІР</small><b>{label}</b></button>)}</div><p className="fee-law-note">Після відповіді система покаже норму Закону України «Про судовий збір» і межі цієї пільги.</p></div>
}

function ProofStage({answer,setAnswer}){
  const selected = answer.selected || []
  return <div className="proof-builder"><div className="proof-chain"><div className="proof-node fixed"><small>ВЖЕ Є</small><b>Фото пошкодженого об’єкта</b></div><i>→</i><div className="proof-gap"><small>ДОДАЙТЕ 2 ЕЛЕМЕНТИ</small>{selected.length?selected.map(id=><span key={id}>{PROOF_CHOICES.find(x=>x[0]===id)?.[1]}</span>):<b>?</b>}</div><i>→</i><div className="proof-node goal"><small>ЮРИДИЧНИЙ ВИСНОВОК</small><b>Чи доведені умови звільнення саме цього працівника?</b></div></div><Instruction>Одне фото не закінчує доказування. Оберіть рівно два елементи, які найкраще добудовують причинний ланцюг.</Instruction><div className="choice-grid">{PROOF_CHOICES.map(([id,label])=><Option key={id} active={selected.includes(id)} disabled={!selected.includes(id)&&selected.length>=2} onClick={()=>setAnswer({selected:toggle(selected,id,2)})}>{label}</Option>)}</div></div>
}

function VaultStage({answer,setAnswer}){
  return <div className="vault-scene"><div className="vault"><div className="vault-door">🔒</div><div className="locked-files"><span>актуальні вакансії</span><span>внутрішні документи</span><span>документи щодо стану майна</span></div><small className="vault-caption">До фіксації відповіді сейф не відкриється</small></div><div><Instruction>Потрібний документ існує, але знаходиться у роботодавця. Оберіть процесуальну дію.</Instruction>{[['assume','Попросити суд просто повірити'],['request','Подати клопотання про витребування доказів'],['cassation','Одразу подати касацію'],['giveup','Відмовитися від аргументу']].map(x=><Option key={x[0]} active={answer.tool===x[0]} onClick={()=>setAnswer({tool:x[0]})}>{x[1]}</Option>)}</div></div>
}

function UnionStage({answer,setAnswer}){
  const selected = answer.selected || []
  return <div className="union-command"><div className="union-visual"><div className="worker-card"><span>ПРАЦІВНИК</span><b>Трудовий спір</b></div><div className="union-core"><span>ПРМТУ</span><b>ШТАБ ЗАХИСТУ</b></div><div className="court-card"><span>СУД</span><b>Правова позиція</b></div></div><Instruction>Оберіть чотири інструменти, які можуть створити реальну додану цінність профспілкового захисту. Не плутайте юридичний інструмент із формальною присутністю.</Instruction><div className="union-actions">{UNION_ACTIONS.map(([id,label])=><Option key={id} active={selected.includes(id)} disabled={!selected.includes(id)&&selected.length>=4} onClick={()=>setAnswer({selected:toggle(selected,id,4)})}>{label}</Option>)}</div><div className="union-status-locked"><span>🛡</span><div><b>Окремо після відповіді</b><small>Перевіримо, чому «член профспілки» та «член виборного профспілкового органу» — не одне й те саме для трудових гарантій.</small></div></div></div>
}

function WitnessStage({answer,setAnswer}){
  const selected = answer.selected || []
  const choose = id => { if(selected.includes(id)||selected.length>=3) return; setAnswer({selected:[...selected,id]}) }
  return <div className="witness-room"><div className="witness"><div className="avatar">?</div><b>СВІДОК</b><small>{selected.length}/3 питання використано</small>{selected.slice(-1).map(id=><div className="witness-answer" key={id}><b>Відповідь:</b><span>{WITNESS_REPLIES[id]}</span></div>)}</div><div className="question-stack">{WITNESS_QUESTIONS.map(([id,label])=><Option key={id} active={selected.includes(id)} disabled={!selected.includes(id)&&selected.length>=3} onClick={()=>choose(id)}>{label}</Option>)}</div></div>
}

function JudgmentStage(){return <div className="verdict-scene"><small>СУД ПЕРШОЇ ІНСТАНЦІЇ</small><div className="date-stamp">РІШЕННЯ</div><h2>ПОЗОВ ЗАДОВОЛЕНО ЧАСТКОВО</h2><div className="result-cards three"><div><b>Поновити</b><span>на роботі</span></div><div className="money"><b>248 214,10 грн</b><span>середній заробіток за час вимушеного прогулу</span></div><div className="execute"><b>НЕГАЙНЕ ВИКОНАННЯ</b><span>у частині поновлення на роботі</span></div></div><p className="verdict-note">Апеляція ще можлива. Але рішення про поновлення незаконно звільненого працівника підлягає негайному виконанню.</p></div>}

function AppealStage({answer,setAnswer}){
  const map = answer.map || {}
  return <div className="appeal-duel"><Instruction>Три короткі атаки роботодавця. До кожної оберіть одну відповідь. Це не тест на складні формулювання — завдання побачити, де саме лежить юридична слабкість аргументу.</Instruction>{APPEAL_ATTACKS.map(a=><div className={`duel-round ${map[a.id]?'answered':''}`} key={a.id}><div className="round-no">РАУНД {a.step}</div><div className="attack-card"><small>АПЕЛЯНТ</small>{a.attack}</div><div className="counter-card">{a.counters.map(([id,t])=><button className={map[a.id]===id?'active':''} key={id} onClick={()=>setAnswer({map:{...map,[a.id]:id}})}>{t}</button>)}</div></div>)}</div>
}

function ParallelStage({answer,setAnswer}){
  return <div className="parallel-question"><div className="case-connection"><div className="case-folder main-case"><small>СПРАВА А</small><b>ОСКАРЖЕННЯ ЗВІЛЬНЕННЯ</b><span>29.12.2022</span></div><div className="connection-question">?</div><div className="case-folder second-case muted"><small>СПРАВА Б</small><b>ЗАКОННІСТЬ ПРИЗУПИНЕННЯ</b><span>період до звільнення</span></div></div><Instruction>Працівник перед звільненням перебував у режимі призупинення дії трудового договору. Чи може результат окремої справи про законність цього призупинення мати значення для спору про звільнення?</Instruction><div className="choice-stack parallel-options">{PARALLEL_OPTIONS.map(([id,label])=><Option key={id} active={answer.choice===id} onClick={()=>setAnswer({choice:id})}>{label}</Option>)}</div></div>
}

function AppealVerdict(){return <div className="verdict-scene appeal-v"><small>АПЕЛЯЦІЙНИЙ СУД</small><div className="date-stamp">ПОСТАНОВА</div><h2>АПЕЛЯЦІЙНУ СКАРГУ — БЕЗ ЗАДОВОЛЕННЯ</h2><strong>Рішення першої інстанції залишено без змін</strong><div className="money-confirm">248 214,10 грн · поновлення збережено</div></div>}

function CassationStage({answer,setAnswer}){
  const selected = answer.selected || []
  return <div className="cassation-door"><div className="supreme-door"><b>КАСАЦІЯ</b><span>{selected.length}/4 ключі обрано</span><div className="locks">{[0,1,2,3].map(i=><i key={i} className={selected.length>i?'chosen':''}>◆</i>)}</div><small>До фіксації відповіді всі обрані ключі мають однаковий колір.</small></div><div><Instruction>Для малозначної справи касаційний перегляд має спеціальний процесуальний фільтр. Оберіть чотири передбачені законом винятки.</Instruction><div className="choice-stack">{CASSATION_KEYS.map(([id,l])=><Option key={id} active={selected.includes(id)} disabled={!selected.includes(id)&&selected.length>=4} onClick={()=>setAnswer({selected:toggle(selected,id,4)})}>{l}</Option>)}</div></div></div>
}

function SocialQR({item}){
  const qr=`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(item.url)}`
  return <a className="social-qr" href={item.url} target="_blank" rel="noreferrer"><img src={qr} alt={`QR ${item.title}`}/><b>{item.title}</b><span>{item.handle}</span><small>Натисніть або скануйте</small></a>
}

function Finale(){return <div className="finale-v2"><div className="final-docs"><span>НАКАЗ</span><span>ПОЗОВ</span><span>ДОКАЗИ</span><span>АПЕЛЯЦІЯ</span><span>ПОВ’ЯЗАНА СПРАВА</span><span>КАСАЦІЯ</span></div><h2>А почалося все з одного наказу.</h2><div className="wins-grid"><div><small>СПІР ПРО ЗВІЛЬНЕННЯ</small><b>248 214,10 грн</b><span>+ поновлення на роботі</span></div><div><small>ПОВ’ЯЗАНА СПРАВА ПРО ПРИЗУПИНЕННЯ</small><b>216 860,74 грн</b><span>окремий присуджений середній заробіток</span></div><div className="total"><small>РАЗОМ ЗА ДВОМА СПРАВАМИ</small><b>465 074,84 грн</b><strong>≈ 11 318 USD</strong><span>орієнтовно за курсом 41,09 грн/USD станом на 10.09.2024</span></div></div><p>Справедливість у суді — це не один «сильний аргумент». Це строки, докази, процедура, стратегія та люди, які вміють цим користуватися.</p><div className="follow-block"><span>ЗАЛИШАЙТЕСЯ З НАМИ ПІСЛЯ ФОРУМУ</span><div>{SOCIALS.map(s=><SocialQR key={s.id} item={s}/>)}</div></div></div>}

function renderStage(stage,answer,setAnswer,session){
  const p={answer,setAnswer,session}
  switch(stage.id){
    case'order':return <OrderStage {...p}/>; case'history':return <HistoryStage {...p}/>; case'term':return <TermStage {...p}/>;
    case'viber':return <ViberStage {...p}/>; case'branches':return <BranchesStage {...p}/>; case'defense':return <DefenseStage {...p}/>;
    case'bag':return <BagStage {...p}/>; case'claim':return <ClaimStage {...p}/>; case'fee':return <FeeStage {...p}/>;
    case'proof':return <ProofStage {...p}/>; case'vault':return <VaultStage {...p}/>; case'union':return <UnionStage {...p}/>;
    case'witness':return <WitnessStage {...p}/>; case'judgment':return <JudgmentStage/>; case'appeal':return <AppealStage {...p}/>;
    case'parallel':return <ParallelStage {...p}/>; case'appeal_verdict':return <AppealVerdict/>; case'cassation':return <CassationStage {...p}/>;
    case'finale':return <Finale/>; default:return null
  }
}

function ready(stage,a){
  if(!stage.scored){if(stage.id==='history')return (a.opened||[]).length===3;return true}
  if(stage.id==='order')return (a.priorities||[]).length===5
  if(stage.id==='term')return a.offset!=null
  if(stage.id==='viber')return (a.selected||[]).length>0
  if(stage.id==='branches')return (a.selected||[]).length>0
  if(stage.id==='defense')return !!a.route&&!!a.credential
  if(stage.id==='bag')return (a.selected||[]).length===5
  if(stage.id==='claim')return (a.selected||[]).length>0
  if(stage.id==='fee')return !!a.choice
  if(stage.id==='proof')return (a.selected||[]).length===2
  if(stage.id==='vault')return !!a.tool
  if(stage.id==='union')return (a.selected||[]).length===4
  if(stage.id==='witness')return (a.selected||[]).length===3
  if(stage.id==='appeal')return Object.keys(a.map||{}).length===3
  if(stage.id==='parallel')return !!a.choice
  if(stage.id==='cassation')return (a.selected||[]).length===4
  return true
}

function payload(stage,a){if(stage.id==='order')return{priorities:a.priorities||[]};if(stage.id==='history')return{opened:a.opened||[]};return a}

function labelFor(stageId,id){return OPTION_LABELS[stageId]?.[String(id).replace(/^.*:/,'')] || String(id).replaceAll('_',' ')}

function DecisionReview({notice}){
  if(!notice)return null
  const stageId=notice.stageId
  const review=notice.review
  return <div className="decision-review">
    <div className="review-score"><span>ВАШ РЕЗУЛЬТАТ</span><b>+{notice.earned||0}</b><small>{notice.base||0} за точність · +{notice.speed||0} за швидкість</small></div>
    {review?.kind==='options'&&<div className="review-options">{[...(review.correct||[]).map(id=>({id,status:'correct'})),...(review.wrong||[]).filter(id=>!(review.correct||[]).includes(id)).map(id=>({id,status:'wrong'}))].map(x=><div key={x.id} className={x.status}><i>{x.status==='correct'?'✓':'×'}</i><span>{labelFor(stageId,x.id)}</span><b>{x.status==='correct'?'правильний варіант':'неправильний варіант'}</b></div>)}</div>}
    {review?.kind==='term'&&<div className="term-review"><b>Правильна точка в цьому прикладі: 31 день → 15 лютого</b><span>Але юридичне правило формулюється як <strong>місячний строк</strong> від дня вручення копії наказу про звільнення.</span></div>}
    {review?.kind==='route'&&<div className={`route-review ${review.valid?'ok':'bad'}`}><b>{review.valid?'✓ Маршрут оформлено правильно':'× Маршрут потребує виправлення'}</b><span>{review.detail}</span></div>}
    {review?.kind==='bag'&&<div className="bag-review"><div><b>Найважливіше для вашого маршруту</b>{(review.best||[]).map(id=><span key={id}>✓ {labelFor('bag',id)}</span>)}</div><div><b>Те, що краще не ставити вище документів</b>{(review.avoid||[]).map(id=><span key={id}>× {labelFor('bag',id)}</span>)}</div></div>}
    {notice.feedback&&<div className="review-explainer"><b>{notice.feedback.title}</b><p>{notice.feedback.text}</p>{notice.feedback.law&&<small>{notice.feedback.law}</small>}</div>}
  </div>
}

function WaitForPresenter({session,notice}){
  const answeredIndex=Math.max(0,session.stage_index-1)
  const answeredStage=STAGES[answeredIndex]
  const next=STAGES[session.stage_index]
  return <section className="stage-card waiting-card"><div className="waiting-pulse"><i/><span>РІШЕННЯ ЗАФІКСОВАНО</span></div><h1>{answeredStage?.label}: результат</h1><DecisionReview notice={notice}/><div className="presenter-wait"><span>Наступний етап</span><b>{next?.title||'Фінал'}</b><p>Чекаємо, поки ведучий завершить обговорення із залом і відкриє наступну частину справи.</p><div className="wait-dots"><i/><i/><i/></div></div></section>
}

function Join({onJoin}){
  const[name,setName]=useState('');const[room,setRoom]=useState(URL_ROOM);const[busy,setBusy]=useState(false)
  return <main className="join-page"><div className="brand"><BrandLogo/><div><small>НАВЧАЛЬНА СИМУЛЯЦІЯ</small><b>UNION COURT</b></div></div><section className="join-card"><span className="mark">ТРУДОВИЙ СПІР · НЕЗАКОННЕ ЗВІЛЬНЕННЯ</span><h1>Вас звільнено.<br/>Що робити далі?</h1><p>Пройдіть шлях трудового спору від наказу до касації. Рішення залу в реальному часі з’являються на великому екрані.</p><input value={name} maxLength={32} placeholder="Ваше ім’я або нік" onChange={e=>setName(e.target.value)}/><input value={room} maxLength={16} placeholder="Код сесії" onChange={e=>setRoom(e.target.value.toUpperCase())}/><button className="primary" disabled={!name.trim()||busy} onClick={async()=>{setBusy(true);try{await onJoin(name.trim(),room)}finally{setBusy(false)}}}>{busy?'Підключення…':'Увійти у справу'}</button><small className="privacy-note">Для гри достатньо імені або ніка. Не вводьте інші персональні дані.</small></section></main>
}

function PlayerHeader({session,onRestart}){return <header className="player-head"><div className="brand compact"><BrandLogo small/><div><small>UNION COURT</small><b>{session.display_name}</b></div></div><div className="score-pill"><small>РЕЙТИНГ ЗАХИСТУ</small><b>{session.score}</b></div><button className="new-run" onClick={onRestart}>↻ Новий розгляд</button></header>}

function DimensionSummary({profile}){
  const max={};STAGES.filter(s=>s.scored&&s.dimension).forEach(s=>max[s.dimension]=(max[s.dimension]||0)+80)
  return <div className="dimension-summary">{Object.entries(DIMENSIONS).map(([id,label])=><div key={id}><span>{label}</span><div><i style={{width:`${pct(profile[id]||0,max[id]||80)}%`}}/></div><b>{pct(profile[id]||0,max[id]||80)}%</b></div>)}</div>
}

function PlayerApp(){
  const[session,setSession]=useState(null);const[answer,setAnswer]=useState({});const[notice,setNotice]=useState(null);const[busy,setBusy]=useState(false);const[err,setErr]=useState('');const[booting,setBooting]=useState(true)
  const store=p=>{setSession(p);localStorage.setItem(PLAYER_KEY,JSON.stringify({id:p.id,token:p.session_token,room:p.room_code}))}
  const sync=async(current=session)=>{if(!current?.id)return;try{const r=await resumeGame(current.id,current.session_token);store(r.player);if(r.sessionReset)setAnswer({})}catch(e){if(String(e.message).includes('not found'))localStorage.removeItem(PLAYER_KEY)}}
  useEffect(()=>{let alive=true;const raw=localStorage.getItem(PLAYER_KEY);if(!raw){setBooting(false);return}try{const saved=JSON.parse(raw);if(saved.room!==URL_ROOM){localStorage.removeItem(PLAYER_KEY);setBooting(false);return}resumeGame(saved.id,saved.token).then(r=>{if(alive)store(r.player)}).catch(()=>localStorage.removeItem(PLAYER_KEY)).finally(()=>alive&&setBooting(false))}catch{localStorage.removeItem(PLAYER_KEY);setBooting(false)}return()=>{alive=false}},[])
  useEffect(()=>{if(!session)return;const refresh=()=>sync(session);const channel=createRefreshChannel(session.room_code,()=>refresh());const poll=setInterval(refresh,30000);const visible=()=>{if(document.visibilityState==='visible')refresh()};window.addEventListener('online',refresh);document.addEventListener('visibilitychange',visible);return()=>{clearInterval(poll);channel?.unsubscribe?.();window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',visible)}},[session?.id,session?.session_no])
  const join=async(name,room)=>{const r=await joinGame(name,room);store(r.player);setBooting(false)}
  if(booting)return <main className="loading-screen"><div className="court-loader">⚖</div><b>Відновлюємо вашу справу…</b></main>
  if(!session)return <Join onJoin={join}/>
  const finished=session.finished||session.stage_index>=STAGES.length
  const hostStage=session.room_current_stage??0
  const paused=session.room_status==='paused'
  const waiting=!finished&&(paused||session.stage_index>hostStage)
  const stage=STAGES[clamp(session.stage_index,0,STAGES.length-1)]
  const submit=async()=>{setBusy(true);setErr('');const current=stage;try{const r=await submitGameStage({playerId:session.id,sessionToken:session.session_token,stageId:current.id,answer:payload(current,answer)});store(r.player);setAnswer({});setNotice({...r.result,stageId:current.id})}catch(e){if(e.data?.player){store(e.data.player);setAnswer({})}setErr(e.message)}finally{setBusy(false)}}
  const restart=async()=>{if(!confirm('Почати новий розгляд? Попередній результат залишиться в історії.'))return;const r=await restartGame(session.id,session.session_token);store(r.player);setAnswer({});setNotice(null)}
  if(finished)return <main className="player-shell"><PlayerHeader session={session} onRestart={restart}/><section className="stage-card final-summary"><h1>Справу завершено</h1><div className="score-finish"><span>Ваш результат</span><b>{session.score}</b><small>Бал складається насамперед із юридичної точності та бонусу швидкості.</small></div><DimensionSummary profile={session.profile||{}}/><button className="primary" onClick={restart}>↻ Новий розгляд</button></section></main>
  return <main className="player-shell"><PlayerHeader session={session} onRestart={restart}/><div className="stage-progress grouped">{CHAPTERS.map((c,i)=>{const active=currentChapter(Math.min(session.stage_index,STAGES.length-1)).index===i;const done=session.stage_index>c.range[1];return <div key={c.id} className={`${active?'active':''} ${done?'done':''}`}><i/><span>{i+1}. {c.title}</span></div>})}</div>{waiting?<WaitForPresenter session={session} notice={notice}/>:<section className="stage-card"><StageHead stage={stage} index={session.stage_index}/>{renderStage(stage,answer,setAnswer,session)}{err&&<div className="error">{err}</div>}<button className="primary action" disabled={!ready(stage,answer)||busy} onClick={submit}>{busy?'Фіксуємо…':stage.scored?'Зафіксувати рішення':'Завершити етап'}</button></section>}</main>
}

const stageName=i=>STAGES[clamp(i,0,STAGES.length-1)]?.label||'—'
function humanOption(stageId,key){const raw=key.replace(/^.*:/,'');return OPTION_LABELS[stageId]?.[raw]||raw.replaceAll('_',' ')}

function RoomScreen(){
  const[data,setData]=useState({players:[],stageStats:{},session:null,room:null});const[err,setErr]=useState('');const[pin,setPin]=useState(sessionStorage.getItem(HOST_KEY)||'');const[showHost,setShowHost]=useState(false);const[hostReady,setHostReady]=useState(!!sessionStorage.getItem(HOST_KEY));const[busy,setBusy]=useState(false)
  const refresh=async()=>{try{setData(await loadLeaderboard(URL_ROOM));setErr('')}catch(e){setErr(e.message)}}
  useEffect(()=>{refresh();const t=setInterval(refresh,2200);const ch=createRefreshChannel(URL_ROOM,()=>refresh());return()=>{clearInterval(t);ch?.unsubscribe?.()}},[])
  const players=data.players||[];const currentStage=clamp(data.room?.currentStage??0,0,STAGES.length-1);const current=STAGES[currentStage];const finished=players.filter(p=>p.finished).length;const answered=players.reduce((s,p)=>s+(p.answered_count||0),0);const perfect=players.reduce((s,p)=>s+(p.correct_count||0),0);const avgScore=players.length?Math.round(players.reduce((s,p)=>s+p.score,0)/players.length):0;const accuracy=answered?pct(perfect,answered):0;const completedCurrent=players.filter(p=>p.finished||p.stage_index>currentStage).length
  const leaders=[...players].sort((a,b)=>b.score-a.score||b.base_score-a.base_score||a.updated_at.localeCompare(b.updated_at)).slice(0,3)
  const stats=Object.entries(data.stageStats||{}).filter(([id])=>STAGES.find(s=>s.id===id)?.scored).map(([id,s])=>({id,label:STAGES.find(x=>x.id===id)?.label||id,index:STAGES.findIndex(x=>x.id===id),...s})).sort((a,b)=>a.index-b.index)
  const focusStat=stats.find(s=>s.id===current.id)||[...stats].sort((a,b)=>b.index-a.index)[0]
  const unlock=()=>{if(!pin)return;sessionStorage.setItem(HOST_KEY,pin);setHostReady(true);setShowHost(true)}
  const setStage=async(target)=>{if(!hostReady||busy)return;target=clamp(target,0,STAGES.length-1);if(target>currentStage&&completedCurrent<players.length&&players.length){if(!confirm(`Завершили ${completedCurrent} із ${players.length}. Все одно відкрити наступний етап?`))return}setBusy(true);try{const r=await setPresenterStage(URL_ROOM,pin,target);setData(d=>({...d,room:{...(d.room||{}),currentStage:r.room.current_stage,status:r.room.status}}));await refresh()}catch(e){setErr(e.message);if(String(e.message).toLowerCase().includes('pin')){setHostReady(false);sessionStorage.removeItem(HOST_KEY)}}finally{setBusy(false)}}
  const newSession=async()=>{if(!hostReady)return;setBusy(true);try{await startNewSession(URL_ROOM,pin);await refresh()}catch(e){setErr(e.message)}finally{setBusy(false)}}
  useEffect(()=>{if(!hostReady)return;const onKey=e=>{if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();setStage(currentStage+1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();setStage(currentStage-1)}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[hostReady,currentStage,completedCurrent,players.length,pin,busy])
  return <main className="room-screen"><header className="room-head"><div className="brand"><BrandLogo room/><div><small>СПРАВА ЗАЛУ · СЕСІЯ {data.session?.sessionNo||'—'}</small><b>UNION COURT</b></div></div><div className="room-code">КОД <b>{URL_ROOM}</b></div><button className={`room-reset ${hostReady?'ready':''}`} onClick={()=>setShowHost(!showHost)}>⌨ КЕРУВАННЯ</button></header>
    {showHost&&<div className="host-panel v2">{!hostReady?<><span>Введіть PIN ведучого. Після розблокування клікери з клавішами → / PageDown / пробіл перемикатимуть етапи.</span><input type="password" placeholder="PIN ведучого" value={pin} onChange={e=>setPin(e.target.value)}/><button onClick={unlock}>Розблокувати</button></>:<><div className="host-stage"><small>ВІДКРИТО</small><b>{currentStage+1}. {current.title}</b><span>{completedCurrent}/{players.length} учасників завершили</span></div><button onClick={()=>setStage(currentStage-1)} disabled={busy||currentStage===0}>← Назад</button><button className="host-next" onClick={()=>setStage(currentStage+1)} disabled={busy||currentStage===STAGES.length-1}>Далі →</button><button className="new-session" onClick={()=>{if(confirm('Створити новий розгляд? Старі результати збережуться.'))newSession()}}>↻ Нова сесія</button><small className="clicker-help">Клікер: → / PageDown / пробіл · назад: ← / PageUp</small></>}</div>}
    {err&&<div className="error">{err}</div>}
    <section className="room-kpis"><div><small>У СПРАВІ</small><b>{players.length}</b><span>учасників</span></div><div className="current-kpi"><small>ЕТАП ЗАЛУ</small><b>{currentStage+1}</b><span>{current.label}</span></div><div><small>ЗАВЕРШИЛИ ЕТАП</small><b>{completedCurrent}/{players.length}</b><span>{pct(completedCurrent,players.length)}%</span></div><div><small>СЕРЕДНІЙ БАЛ</small><b>{avgScore}</b><span>по залу</span></div><div><small>ІДЕАЛЬНИХ РІШЕНЬ</small><b>{accuracy}%</b><span>{perfect} із {answered}</span></div></section>
    <section className="room-main"><div className="case-flow-panel"><div className="panel-title"><span>РУХ СПРАВИ</span><small>Ведучий керує єдиним етапом для всього залу</small></div><div className="chapter-track">{CHAPTERS.map((c,i)=>{const active=currentChapter(currentStage).index===i;return <div key={c.id} className={active?'active':''}><i>{i+1}</i><span>{c.title}</span></div>})}</div><div className="live-completion"><div><span>ВІДПОВІЛИ НА ПОТОЧНИЙ ЕТАП</span><b>{completedCurrent}</b><small>із {players.length}</small></div><div className="completion-ring" style={{'--p':`${pct(completedCurrent,players.length)}%`}}><b>{pct(completedCurrent,players.length)}%</b></div></div></div>
      <aside className="leaderboard"><div className="panel-title"><span>TOP 3</span><small>загальний бал → точність → час</small></div>{leaders.map((p,i)=><div className={`leader rank-${i+1}`} key={p.id}><i>{i+1}</i><div><b>{p.display_name}</b><small>{stageName(p.stage_index)} · {p.correct_count}/{p.answered_count} ідеальних</small></div><strong>{p.score}</strong></div>)}{leaders.length===0&&<p>Рейтинг з’явиться після старту.</p>}</aside>
    </section>
    <section className="analytics-grid"><div className="accuracy-panel"><div className="panel-title"><span>ТОЧНІСТЬ ЗА ЕТАПАМИ</span><small>середня юридична точність відповідей залу</small></div>{stats.length?stats.slice(-8).map(s=><div className="metric-bar" key={s.id}><span>{s.label}</span><div><i style={{width:`${s.avgAccuracy||0}%`}}/></div><b>{s.avgAccuracy||0}%</b><small>{s.answered} відп.</small></div>):<p>Дані з’являться після перших відповідей.</p>}</div><div className="live-stage"><div className="panel-title"><span>{`ФОКУС: ${current.label.toUpperCase()}`}</span><small>що обирає зал</small></div>{focusStat?<><div className="stage-kpis"><div><b>{focusStat.answered}</b><span>відповіли</span></div><div><b>{focusStat.perfect}</b><span>ідеально</span></div><div><b>{focusStat.avgSeconds}s</b><span>середній час</span></div></div><OptionBars stageId={focusStat.id} counts={focusStat.optionCounts} total={focusStat.answered}/>{focusStat.avgAccuracy<55&&focusStat.answered>=3&&<div className="legal-trap">⚠ <b>ЮРИДИЧНА ПАСТКА ЗАЛУ</b><span>На цьому етапі точність нижча за 55%. Це хороший момент для короткого пояснення ведучого.</span></div>}</>:<p>Очікуємо відповіді на цей етап.</p>}</div></section>
  </main>
}

function OptionBars({stageId,counts,total}){const rows=Object.entries(counts||{}).sort((a,b)=>b[1]-a[1]).slice(0,7);return <div className="option-bars">{rows.map(([k,v])=><div key={k}><span>{humanOption(stageId,k)}</span><div><i style={{width:`${pct(v,total)}%`}}/></div><b>{pct(v,total)}%</b></div>)}</div>}

createRoot(document.getElementById('root')).render(SCREEN==='room'||SCREEN==='host'?<RoomScreen/>:<PlayerApp/>)
