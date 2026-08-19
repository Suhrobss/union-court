import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './patch.css'
import {
  STAGES, DIMENSIONS, FICTIONAL_ORDER, ORDER_AREAS, HISTORY_DOCS, BRANCHES,
  DEFENSE_ROUTES, CREDENTIALS, BAG_ITEMS, CLAIM_ITEMS, PROOF_ITEMS,
  UNION_ACTIONS, WITNESS_QUESTIONS, APPEAL_ATTACKS, CASSATION_KEYS, OPTION_LABELS,
} from './gameData'
import {
  DEFAULT_ROOM, joinGame, resumeGame, restartGame, submitGameStage,
  loadLeaderboard, startNewSession, createRefreshChannel,
} from './realtime'

const PLAYER_KEY='union-court-player-v5'
const url=new URL(window.location.href)
const SCREEN=url.searchParams.get('screen')==='room'
const URL_ROOM=(url.searchParams.get('room')||DEFAULT_ROOM).toUpperCase()
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n))
const pct=(n,d)=>d?Math.round(n/d*100):0
const toggle=(arr,id,max=99)=>arr.includes(id)?arr.filter(x=>x!==id):(arr.length<max?[...arr,id]:arr)

function StageHead({stage}){return <><div className="kicker">Етап {STAGES.findIndex(x=>x.id===stage.id)+1} · {stage.label}</div><h1>{stage.title}</h1></>}
function Option({active,onClick,children,disabled=false}){return <button disabled={disabled} onClick={onClick} className={`option ${active?'active':''}`}>{children}</button>}
function Instruction({children}){return <div className="instruction">{children}</div>}

function FeedbackToast({notice,onClose}){
  if(!notice)return null
  return <div className="feedback-toast"><button onClick={onClose}>×</button><div className="earned"><span>+{notice.earned||0}</span><small>{notice.base||0} за точність · +{notice.speed||0} за швидкість</small></div>{notice.feedback&&<><b>{notice.feedback.title}</b><p>{notice.feedback.text}</p></>}</div>
}

function OrderStage({answer,setAnswer}){
  const [inspected,setInspected]=useState(answer.inspected||[])
  const priorities=answer.priorities||[]
  const inspect=(id)=>{if(!inspected.includes(id)){const next=[...inspected,id];setInspected(next);setAnswer({...answer,inspected:next})}}
  const area=(id)=>ORDER_AREAS.find(x=>x[0]===id)
  return <div className="stage-grid order-layout">
    <div className="paper-wrap"><div className="scan-line"/><article className="order-paper">
      <div className="paper-safe">НАВЧАЛЬНА РЕКОНСТРУКЦІЯ · УСІ ІДЕНТИФІКУЮЧІ РЕКВІЗИТИ ВИГАДАНІ</div>
      <header><small>Типова форма кадрового документа</small><h2>{FICTIONAL_ORDER.employer}</h2><div>Код {FICTIONAL_ORDER.code}</div></header>
      <div className="order-title">НАКАЗ (РОЗПОРЯДЖЕННЯ)<br/><b>про припинення трудового договору</b></div>
      <div className="order-row"><button onClick={()=>inspect('dates')}><b>{FICTIONAL_ORDER.orderNo}</b><span>від {FICTIONAL_ORDER.orderDate}</span></button><button onClick={()=>inspect('dates')}><span>Дата звільнення</span><b>{FICTIONAL_ORDER.dismissalDate}</b></button></div>
      <button className="doc-line" onClick={()=>inspect('basis')}><span>Працівник</span><b>{FICTIONAL_ORDER.employee}</b> · таб. № {FICTIONAL_ORDER.personnelNo}</button>
      <button className="doc-line" onClick={()=>inspect('transfer')}><span>Посада</span><b>{FICTIONAL_ORDER.position}</b></button>
      <button className="reason" onClick={()=>inspect('causation')}><span>Підстава припинення</span><b>{FICTIONAL_ORDER.basis}</b><p>{FICTIONAL_ORDER.reason}</p></button>
      <button className="doc-line" onClick={()=>inspect('causation')}><span>Документ-підстава</span>{FICTIONAL_ORDER.source}</button>
      <button className="doc-line" onClick={()=>inspect('payments')}><span>Розрахунок</span>{FICTIONAL_ORDER.vacation}; {FICTIONAL_ORDER.severance}</button>
      <button className="signature" onClick={()=>inspect('authority')}><span>{FICTIONAL_ORDER.signer}</span><i>підпис</i></button>
      <button className="service-box" onClick={()=>inspect('service')}><b>З наказом ознайомлений(а)</b><span>дата __________ підпис __________</span></button>
    </article></div>
    <aside className="inspection">
      <div className="radar"><span>{inspected.length}</span><small>зон досліджено</small></div>
      <h3>Дослідіть документ</h3><p>Натискайте безпосередньо на реквізити й фрагменти наказу.</p>
      <div className="findings">{inspected.slice(-4).reverse().map(id=>{const a=area(id);return a?<div key={id}><b>{a[1]}</b><span>{a[3]}</span></div>:null})}</div>
      {inspected.length>=4&&<div className="priority-box"><h3>У вас 5 маркерів</h3><p>Оберіть п’ять напрямків, які першими перевірите для майбутнього оскарження.</p>{ORDER_AREAS.map(a=><Option key={a[0]} active={priorities.includes(a[0])} disabled={!priorities.includes(a[0])&&priorities.length>=5} onClick={()=>setAnswer({...answer,priorities:toggle(priorities,a[0],5)})}><span>{a[1]}</span></Option>)}<div className="counter">{priorities.length}/5</div></div>}
    </aside>
  </div>
}

function HistoryStage({answer,setAnswer}){
  const opened=answer.opened||[]
  return <div><Instruction>Перед вами три закриті матеріали з хронології. Відкрийте їх по черзі.</Instruction><div className="file-cabinet">{HISTORY_DOCS.map((d,i)=><button key={d.id} className={`sealed-file ${opened.includes(d.id)?'open':''}`} onClick={()=>setAnswer({opened:[...new Set([...opened,d.id])]})}><span className="file-index">0{i+1}</span><b>{opened.includes(d.id)?d.label:d.title}</b><small>{opened.includes(d.id)?d.date:'Відкрити матеріал'}</small>{opened.includes(d.id)&&<p>{d.text}</p>}</button>)}</div>{opened.length===3&&<div className="history-reveal"><span>ПРОСТІЙ</span><i>→</i><span>ПРИЗУПИНЕННЯ</span><i>→</i><strong>ЗВІЛЬНЕННЯ</strong></div>}</div>
}

function TermStage({answer,setAnswer}){
  const day=answer.offset??30
  return <div className="focus-stage"><div className="calendar-card"><small>КОПІЮ НАКАЗУ ВРУЧЕНО</small><b>15 СІЧНЯ</b></div><Instruction>Перетягніть маркер на кількість календарних днів, яка, на вашу думку, відповідає даті закінчення місячного строку в цьому прикладі.</Instruction><div className="deadline-line"><span>10</span><input type="range" min="10" max="50" value={day} onChange={e=>setAnswer({offset:+e.target.value})}/><span>50</span></div><div className="big-number">{day}<small>днів</small></div></div>
}

function BranchesStage({answer,setAnswer}){
  const selected=answer.selected||[]
  return <div className="branches-stage"><Instruction>Працівник працює у філії великого підприємства. Позначте, де ви перевірятимете наявність підходящих вакансій перед звільненням.</Instruction><div className="legal-entity"><div className="entity-core"><small>РОБОТОДАВЕЦЬ</small><b>ОДНА ЮРИДИЧНА ОСОБА</b></div><div className="branch-network">{BRANCHES.map((b,i)=><button key={b.id} className={`branch-card ${selected.includes(b.id)?'active':''}`} onClick={()=>setAnswer({selected:toggle(selected,b.id,3)})}><i>{i+1}</i><b>{b.title}</b><small>{b.meta}</small><span>{selected.includes(b.id)?'✓ перевіряємо':'додати до перевірки'}</span></button>)}</div></div><div className="branch-question">Чи закінчується обов’язок роботодавця межами філії, де працює працівник?</div></div>
}

function DefenseStage({answer,setAnswer}){
  const route=answer.route||''; const cred=answer.credential||''
  return <div><Instruction>Оберіть один із можливих маршрутів до суду, а потім прикріпіть документ, який робить саме цей маршрут процесуально робочим.</Instruction><div className="route-builder"><div className="you node">ВИ</div><div className={`route-slot ${route?'filled':''}`}>{route?DEFENSE_ROUTES.find(x=>x.id===route)?.title:'Маршрут'}</div><div className="court node">СУД</div></div><div className="route-cards">{DEFENSE_ROUTES.map(r=><button key={r.id} className={route===r.id?'active':''} onClick={()=>setAnswer({...answer,route:r.id,credential:''})}><span>{r.icon}</span><b>{r.title}</b><small>{r.meta}</small></button>)}</div>{route&&<><h3 className="subhead">Підтвердьте повноваження</h3><div className="credential-cards">{CREDENTIALS.map(c=><button key={c.id} className={cred===c.id?'active':''} onClick={()=>setAnswer({...answer,credential:c.id})}>{c.title}</button>)}</div></>}</div>
}

function BagStage({answer,setAnswer,session}){
  const selected=answer.selected||[]; const route=session?.profile?.defenseRoute||'self'; const represented=route!=='self'
  return <div className="bag-stage"><div className="court-bag"><div className="bag-handle"/><div className="bag-body"><span>{selected.length}/5</span><small>{represented?'ви йдете через представника':'ви представляєте себе особисто'}</small>{selected.map(id=><i key={id}>{BAG_ITEMS.find(x=>x.id===id)?.icon}</i>)}</div></div><div><Instruction>У сумці лише п’ять місць. Набір має відповідати маршруту захисту, який ви обрали на попередньому етапі.</Instruction><div className="bag-items">{BAG_ITEMS.map(x=><button key={x.id} disabled={!selected.includes(x.id)&&selected.length>=5} className={selected.includes(x.id)?'active':''} onClick={()=>setAnswer({selected:toggle(selected,x.id,5)})}><span>{x.icon}</span><b>{x.title}</b><small>{x.level==='no'?'зайве':x.level==='medium'?'корисне':'до оцінки'}</small></button>)}</div></div></div>
}

function MultiStage({items,answer,setAnswer,limit=99}){const selected=answer.selected||[];return <div className="choice-stack">{items.map(([id,label])=><Option key={id} active={selected.includes(id)} disabled={!selected.includes(id)&&selected.length>=limit} onClick={()=>setAnswer({selected:toggle(selected,id,limit)})}>{label}</Option>)}</div>}

function ClaimStage(p){return <div><Instruction>Зберіть вимоги, які мають безпосередньо відновити порушене трудове право.</Instruction><MultiStage {...p} items={CLAIM_ITEMS}/></div>}

function FeeStage({answer,setAnswer}){
  return <div className="fee-stage"><div className={`fee-terminal ${answer.revealed?'open':''}`}><small>СУДОВИЙ ЗБІР</small><b>{answer.revealed?'0 грн':'— — —'}</b><span>{answer.revealed?'для вимоги про поновлення на роботі':'розрахунок ще не виконано'}</span></div>{!answer.revealed?<button className="primary fee-button" onClick={()=>setAnswer({revealed:true})}>Розрахувати судовий збір</button>:<div className="fee-reveal">Пільга передбачена законом. Це не означає, що судовий збір ніколи не сплачується у будь-якому трудовому спорі.</div>}</div>
}

function ProofStage({answer,setAnswer}){const selected=answer.selected||[];return <div className="evidence-lab"><div className="evidence-board"><div className="photo-evidence"><div className="damage-visual">▱<i/>▰</div><b>Фотоматеріал пошкодженого об’єкта</b><small>перевірте дату й юридичне значення</small></div><div className="logic-chain"><span>БОЙОВІ ДІЇ</span><i>→</i><span>ПОШКОДЖЕННЯ</span><i>→</i><span className="gap">?</span><i>→</i><strong>УМОВИ ЗВІЛЬНЕННЯ</strong></div></div><div><Instruction>Позначте тільки ті висновки, які, на вашу думку, можна обережно зробити з такого доказу.</Instruction><div className="choice-stack">{PROOF_ITEMS.map(([id,l])=><Option key={id} active={selected.includes(id)} onClick={()=>setAnswer({selected:toggle(selected,id)})}>{l}</Option>)}</div></div></div>}

function VaultStage({answer,setAnswer}){return <div className="vault-scene"><div className={`vault ${answer.tool==='request'?'open':''}`}><div className="vault-door">{answer.tool==='request'?'ВІДКРИТО':'🔒'}</div><div className="locked-files"><span>актуальні вакансії</span><span>внутрішні документи</span><span>документи щодо стану майна</span></div></div><div><Instruction>Потрібний документ існує, але знаходиться у роботодавця. Оберіть процесуальну дію.</Instruction>{[['request','Клопотання про витребування доказів'],['assume','Попросити суд просто повірити'],['giveup','Відмовитися від аргументу'],['cassation','Одразу подати касацію']].map(x=><Option key={x[0]} active={answer.tool===x[0]} onClick={()=>setAnswer({tool:x[0]})}>{x[1]}</Option>)}</div></div>}

function UnionStage({answer,setAnswer}){
  const selected=answer.selected||[]; const shield=answer.shield||false
  return <div className="union-stage"><Instruction>ПРМТУ вже з’являється в матеріалах. Розкладіть, які інструменти профспілка реально може додати до захисту.</Instruction><div className="union-hq"><div className="union-side"><small>ДО СУДУ</small><span>інформація</span><span>документи</span><span>консультації</span></div><div className="hq-core">ПРМТУ<br/><small>ПРАВОЗАХИСНИЙ ШАР</small></div><div className="union-side"><small>У СУДІ</small><span>процесуальні пояснення</span><span>докази</span><span>участь у справі</span></div></div><div className="choice-stack">{UNION_ACTIONS.map(([id,l])=><Option key={id} active={selected.includes(id)} onClick={()=>setAnswer({...answer,selected:toggle(selected,id)})}>{l}</Option>)}</div><button className={`guarantee-card ${shield?'open':''}`} onClick={()=>setAnswer({...answer,shield:!shield})}><span>🛡</span><div><b>Додаткова гарантія: перевірити профспілковий статус</b><small>{shield?'Член профспілки і член виборного профспілкового органу — не одне й те саме. Для обраних до профспілкових органів закон передбачає додаткові гарантії.':'Натисніть, щоб відкрити'}</small></div></button></div>
}

function WitnessStage({answer,setAnswer}){
  const selected=answer.selected||[]
  const choose=(id)=>setAnswer({selected:toggle(selected,id,3)})
  return <div className="witness-room"><div className="witness"><div className="avatar">?</div><b>СВІДОК</b><small>{selected.length}/3 питання використано</small>{selected.slice(-1).map(id=>{const q=WITNESS_QUESTIONS.find(x=>x[0]===id);return q?<div className="witness-answer" key={id}><b>Відповідь:</b><span>{q[3]}</span></div>:null})}</div><div className="question-stack">{WITNESS_QUESTIONS.map(([id,l])=><Option key={id} active={selected.includes(id)} disabled={!selected.includes(id)&&selected.length>=3} onClick={()=>choose(id)}>{l}</Option>)}</div></div>
}

function JudgmentStage(){return <div className="verdict-scene"><small>СУД ПЕРШОЇ ІНСТАНЦІЇ</small><div className="date-stamp">РІШЕННЯ</div><h2>ПОЗОВ ЗАДОВОЛЕНО ЧАСТКОВО</h2><div className="result-cards three"><div><b>Поновити</b><span>на роботі</span></div><div className="money"><b>248 214,10 грн</b><span>середній заробіток за час вимушеного прогулу</span></div><div className="execute"><b>НЕГАЙНЕ ВИКОНАННЯ</b><span>рішення в частині поновлення</span></div></div><p className="verdict-note">Апеляція ще можлива. Але поновлення незаконно звільненого працівника за законом підлягає негайному виконанню.</p></div>}

function AppealStage({answer,setAnswer}){
  const map=answer.map||{}
  return <div className="appeal-duel"><Instruction>Три короткі атаки роботодавця. До кожної оберіть відповідь, яка найкраще зберігає вашу позицію.</Instruction>{APPEAL_ATTACKS.map(a=><div className={`duel-round ${map[a.id]?'answered':''}`} key={a.id}><div className="round-no">РАУНД {a.step}</div><div className="attack-card"><small>АПЕЛЯНТ</small>{a.attack}</div><div className="counter-card">{a.counters.map(([id,t])=><button className={map[a.id]===id?'active':''} key={id} onClick={()=>setAnswer({map:{...map,[a.id]:id}})}>{t}</button>)}</div></div>)}</div>
}

function ParallelStage(){return <div className="parallel-scene"><div className="case-folder main-case"><small>ОСНОВНА СПРАВА</small><b>НЕЗАКОННЕ ЗВІЛЬНЕННЯ</b></div><div className="red-thread"/><div className="case-folder second-case"><small>ПОВ’ЯЗАНА СПРАВА</small><b>ЗАКОННІСТЬ ПОПЕРЕДНЬОГО ПРИЗУПИНЕННЯ</b><span>рішення набрало законної сили</span></div><div className="parallel-reveal">Результат пов’язаної справи став юридично важливим для аргументу про середній заробіток в апеляції.</div></div>}
function AppealVerdict(){return <div className="verdict-scene appeal-v"><small>АПЕЛЯЦІЙНИЙ СУД</small><div className="date-stamp">ПОСТАНОВА</div><h2>АПЕЛЯЦІЙНУ СКАРГУ — БЕЗ ЗАДОВОЛЕННЯ</h2><strong>Рішення першої інстанції залишено без змін</strong><div className="money-confirm">248 214,10 грн · поновлення збережено</div></div>}

function CassationStage({answer,setAnswer}){const selected=answer.selected||[];return <div className="cassation-door"><div className="supreme-door"><b>КАСАЦІЯ</b><span>{selected.filter(id=>CASSATION_KEYS.find(x=>x[0]===id)?.[2]).length}/4 ключі</span><div className="locks">{[0,1,2,3].map(i=><i key={i} className={selected.filter(id=>CASSATION_KEYS.find(x=>x[0]===id)?.[2]).length>i?'open':''}>◆</i>)}</div></div><div><Instruction>Для малозначної справи касаційний перегляд має процесуальний фільтр. Оберіть чотири передбачені законом винятки.</Instruction><div className="choice-stack">{CASSATION_KEYS.map(([id,l])=><Option key={id} active={selected.includes(id)} disabled={!selected.includes(id)&&selected.length>=4} onClick={()=>setAnswer({selected:toggle(selected,id,4)})}>{l}</Option>)}</div></div></div>}

function Finale(){return <div className="finale"><div className="paper-stack"><span>НАКАЗ</span><span>ДОКАЗИ</span><span>ПОЗОВ</span><span>ІНСТАНЦІЯ I</span><span>АПЕЛЯЦІЯ</span><span>ПОВ’ЯЗАНА СПРАВА</span><span>КАСАЦІЯ</span></div><div className="final-stamps"><b>АПЕЛЯЦІЯ<br/>БЕЗ ЗАДОВОЛЕННЯ</b><b>КАСАЦІЙНЕ ПРОВАДЖЕННЯ<br/>НЕ ВІДКРИТО</b></div><div className="final-win"><span>РЕЗУЛЬТАТ У СПРАВІ</span><b>248 214,10 грн</b><strong>+ поновлення на роботі</strong></div><h2>А почалося все з одного наказу.</h2><p>Справедливість у суді — це строки, докази, процедура, стратегія та юридична підтримка.</p></div>}

function renderStage(stage,answer,setAnswer,session){const p={answer,setAnswer,session};switch(stage.id){case'order':return <OrderStage {...p}/>;case'history':return <HistoryStage {...p}/>;case'term':return <TermStage {...p}/>;case'branches':return <BranchesStage {...p}/>;case'defense':return <DefenseStage {...p}/>;case'bag':return <BagStage {...p}/>;case'claim':return <ClaimStage {...p}/>;case'fee':return <FeeStage {...p}/>;case'proof':return <ProofStage {...p}/>;case'vault':return <VaultStage {...p}/>;case'union':return <UnionStage {...p}/>;case'witness':return <WitnessStage {...p}/>;case'judgment':return <JudgmentStage/>;case'appeal':return <AppealStage {...p}/>;case'parallel':return <ParallelStage/>;case'appeal_verdict':return <AppealVerdict/>;case'cassation':return <CassationStage {...p}/>;case'finale':return <Finale/>;default:return null}}
function ready(stage,a){if(!stage.scored){if(stage.id==='history')return (a.opened||[]).length===3;if(stage.id==='fee')return !!a.revealed;return true}if(stage.id==='order')return (a.priorities||[]).length===5;if(stage.id==='term')return a.offset!=null;if(stage.id==='branches')return (a.selected||[]).length>0;if(stage.id==='defense')return !!a.route&&!!a.credential;if(stage.id==='bag')return (a.selected||[]).length===5;if(stage.id==='witness')return (a.selected||[]).length===3;if(stage.id==='appeal')return Object.keys(a.map||{}).length===3;if(stage.id==='cassation')return (a.selected||[]).length===4;if(stage.id==='vault')return !!a.tool;return (a.selected||[]).length>0}
function payload(stage,a){if(stage.id==='order')return{priorities:a.priorities||[]};if(stage.id==='history')return{opened:a.opened||[]};return a}

function Join({onJoin}){const[name,setName]=useState('');const[room,setRoom]=useState(URL_ROOM);const[busy,setBusy]=useState(false);return <main className="join-page"><div className="brand"><div className="logo-slot">МІСЦЕ ДЛЯ<br/>ЛОГО МР ПРМТУ</div><div><small>НАВЧАЛЬНА СИМУЛЯЦІЯ</small><b>UNION COURT</b></div></div><section className="join-card"><span className="mark">ТРУДОВИЙ СПІР · НЕЗАКОННЕ ЗВІЛЬНЕННЯ</span><h1>Вас звільнено.<br/>Що робити далі?</h1><p>Пройдіть реальний за логікою шлях трудового спору — від наказу до касації.</p><input value={name} maxLength={32} placeholder="Ваше ім’я або нік" onChange={e=>setName(e.target.value)}/><input value={room} maxLength={16} placeholder="Код сесії" onChange={e=>setRoom(e.target.value.toUpperCase())}/><button className="primary" disabled={!name.trim()||busy} onClick={async()=>{setBusy(true);try{await onJoin(name.trim(),room)}finally{setBusy(false)}}}>{busy?'Підключення…':'Увійти у справу'}</button><small className="privacy-note">Для гри достатньо імені або ніка. Не вводьте інші персональні дані.</small></section></main>}

function PlayerApp(){
  const[session,setSession]=useState(null);const[answer,setAnswer]=useState({});const[notice,setNotice]=useState(null);const[busy,setBusy]=useState(false);const[err,setErr]=useState('')
  const store=p=>{setSession(p);localStorage.setItem(PLAYER_KEY,JSON.stringify({id:p.id,token:p.session_token,room:p.room_code}))}
  useEffect(()=>{const raw=localStorage.getItem(PLAYER_KEY);if(!raw)return;try{const saved=JSON.parse(raw);resumeGame(saved.id,saved.token).then(r=>store(r.player)).catch(()=>localStorage.removeItem(PLAYER_KEY))}catch{localStorage.removeItem(PLAYER_KEY)}},[])
  useEffect(()=>{if(!session)return;const channel=createRefreshChannel(session.room_code,async(type)=>{if(type!=='session_reset')return;try{const r=await restartGame(session.id,session.session_token);store(r.player);setAnswer({});setNotice({earned:0,base:0,speed:0,feedback:{title:'Новий розгляд',text:'Ведучий відкрив нову сесію. Ваш попередній результат збережено в історії.'}})}catch{}});const poll=setInterval(async()=>{try{const r=await resumeGame(session.id,session.session_token);if(r.player.id!==session.id||r.player.session_no!==session.session_no){store(r.player);setAnswer({})}}catch{}},9000);return()=>{clearInterval(poll);channel?.unsubscribe?.()}},[session?.id,session?.session_no])
  const join=async(name,room)=>{const r=await joinGame(name,room);store(r.player)}
  if(!session)return <Join onJoin={join}/>
  const finished=session.finished||session.stage_index>=STAGES.length
  const stage=STAGES[clamp(session.stage_index,0,STAGES.length-1)]
  const submit=async()=>{setBusy(true);setErr('');const current=stage;try{const r=await submitGameStage({playerId:session.id,sessionToken:session.session_token,stageId:current.id,answer:payload(current,answer)});store(r.player);setAnswer({});setNotice({...r.result,stageId:current.id});setTimeout(()=>setNotice(n=>n?.stageId===current.id?null:n),5000)}catch(e){setErr(e.message)}finally{setBusy(false)}}
  const restart=async()=>{if(!confirm('Почати новий розгляд? Попередній результат залишиться в історії.'))return;const r=await restartGame(session.id,session.session_token);store(r.player);setAnswer({});setNotice(null)}
  if(finished)return <main className="player-shell"><PlayerHeader session={session} onRestart={restart}/><section className="stage-card final-summary"><h1>Справу завершено</h1><div className="score-finish"><span>Ваш результат</span><b>{session.score}</b><small>Рейтинг побудований насамперед на юридичній точності.</small></div><DimensionSummary profile={session.profile||{}}/><button className="primary" onClick={restart}>↻ Новий розгляд</button></section></main>
  return <main className="player-shell"><FeedbackToast notice={notice} onClose={()=>setNotice(null)}/><PlayerHeader session={session} onRestart={restart}/><div className="stage-progress">{STAGES.map((s,i)=><i key={s.id} className={i<session.stage_index?'done':i===session.stage_index?'now':''}/>)}</div><section className="stage-card"><StageHead stage={stage}/>{renderStage(stage,answer,setAnswer,session)}{err&&<div className="error">{err}</div>}<button className="primary action" disabled={!ready(stage,answer)||busy} onClick={submit}>{busy?'Фіксуємо…':stage.scored?'Зафіксувати рішення':'Продовжити справу'}</button></section></main>
}
function PlayerHeader({session,onRestart}){return <header className="player-head"><div className="brand compact"><div className="logo-slot small">ЛОГО<br/>МР ПРМТУ</div><div><small>UNION COURT</small><b>{session.display_name}</b></div></div><div className="score-pill"><small>РЕЙТИНГ ЗАХИСТУ</small><b>{session.score}</b></div><button className="new-run" onClick={onRestart}>↻ Новий розгляд</button></header>}
function DimensionSummary({profile}){const max={};STAGES.filter(s=>s.scored&&s.dimension).forEach(s=>max[s.dimension]=(max[s.dimension]||0)+80);return <div className="dimension-summary">{Object.entries(DIMENSIONS).map(([id,label])=><div key={id}><span>{label}</span><div><i style={{width:`${pct(profile[id]||0,max[id]||80)}%`}}/></div><b>{pct(profile[id]||0,max[id]||80)}%</b></div>)}</div>}

const stageName=i=>STAGES[clamp(i,0,STAGES.length-1)]?.label||'—'
function humanOption(stageId,key){const raw=key.replace(/^.*:/,'');return OPTION_LABELS[stageId]?.[raw]||raw.replaceAll('_',' ')}
function RoomScreen(){
  const[data,setData]=useState({players:[],stageStats:{},session:null});const[err,setErr]=useState('');const[pin,setPin]=useState('');const[showPin,setShowPin]=useState(false)
  const refresh=async()=>{try{setData(await loadLeaderboard(URL_ROOM));setErr('')}catch(e){setErr(e.message)}}
  useEffect(()=>{refresh();const t=setInterval(refresh,2200);const ch=createRefreshChannel(URL_ROOM,()=>refresh());return()=>{clearInterval(t);ch?.unsubscribe?.()}},[])
  const players=data.players||[];const finished=players.filter(p=>p.finished).length;const answered=players.reduce((s,p)=>s+(p.answered_count||0),0);const perfect=players.reduce((s,p)=>s+(p.correct_count||0),0);const avgScore=players.length?Math.round(players.reduce((s,p)=>s+p.score,0)/players.length):0;const accuracy=answered?pct(perfect,answered):0
  const leaders=[...players].sort((a,b)=>b.base_score-a.base_score||b.score-a.score).slice(0,3)
  const distribution=STAGES.map((s,i)=>({stage:s,index:i,count:players.filter(p=>!p.finished&&p.stage_index===i).length})).filter(x=>x.count)
  const majority=distribution.length?[...distribution].sort((a,b)=>b.count-a.count||b.index-a.index)[0]:null
  const stats=Object.entries(data.stageStats||{}).filter(([id])=>STAGES.find(s=>s.id===id)?.scored).map(([id,s])=>({id,label:STAGES.find(x=>x.id===id)?.label||id,index:STAGES.findIndex(x=>x.id===id),...s})).sort((a,b)=>a.index-b.index)
  const focusStat=(majority&&stats.find(s=>s.id===majority.stage.id))||[...stats].sort((a,b)=>b.index-a.index)[0]
  const newSession=async()=>{if(!pin)return;try{await startNewSession(URL_ROOM,pin);setShowPin(false);setPin('');await refresh()}catch(e){setErr(e.message)}}
  return <main className="room-screen"><header className="room-head"><div className="brand"><div className="logo-slot room-logo">МІСЦЕ ДЛЯ ЛОГО<br/>МР ПРМТУ</div><div><small>СПРАВА ЗАЛУ · СЕСІЯ {data.session?.sessionNo||'—'}</small><b>UNION COURT</b></div></div><div className="room-code">КОД <b>{URL_ROOM}</b></div><button className="room-reset" onClick={()=>setShowPin(!showPin)}>↻ НОВИЙ РОЗГЛЯД</button></header>{showPin&&<div className="host-panel"><span>Попередня сесія залишиться в історії. Учасники автоматично отримають новий розгляд.</span><input type="password" placeholder="PIN ведучого" value={pin} onChange={e=>setPin(e.target.value)}/><button onClick={newSession}>Створити сесію</button></div>}{err&&<div className="error">{err}</div>}
    <section className="room-kpis"><div><small>У СПРАВІ</small><b>{players.length}</b><span>учасників</span></div><div><small>ЗАВЕРШИЛИ</small><b>{finished}</b><span>{pct(finished,players.length)}%</span></div><div><small>СЕРЕДНІЙ БАЛ</small><b>{avgScore}</b><span>по залу</span></div><div><small>ІДЕАЛЬНИХ РІШЕНЬ</small><b>{accuracy}%</b><span>{perfect} із {answered}</span></div></section>
    <section className="room-main"><div className="case-flow-panel"><div className="panel-title"><span>РУХ СПРАВИ</span><small>{majority?`Найбільше учасників зараз на етапі «${majority.stage.label}»`:'Очікуємо учасників'}</small></div><div className="case-track">{STAGES.map((s,i)=><div key={s.id} className={`track-node ${players.some(p=>p.stage_index===i)?'hot':''}`}><i>{i+1}</i><span>{s.label}</span><em>{players.filter(p=>p.stage_index===i).length}</em></div>)}</div><div className="distribution">{distribution.length?distribution.map(x=><div key={x.stage.id}><span>{x.stage.label}</span><b style={{width:`${Math.max(6,pct(x.count,players.length))}%`}}>{x.count}</b></div>):<p>Очікуємо учасників…</p>}</div></div>
      <aside className="leaderboard"><div className="panel-title"><span>TOP 3</span><small>точність → бали → час</small></div>{leaders.map((p,i)=><div className={`leader rank-${i+1}`} key={p.id}><i>{i+1}</i><div><b>{p.display_name}</b><small>{stageName(p.stage_index)} · {p.correct_count}/{p.answered_count} ідеальних</small></div><strong>{p.score}</strong></div>)}{leaders.length===0&&<p>Рейтинг з’явиться після старту.</p>}</aside>
    </section>
    <section className="analytics-grid"><div className="accuracy-panel"><div className="panel-title"><span>ТОЧНІСТЬ ЗА ЕТАПАМИ</span><small>середня юридична точність відповідей залу</small></div>{stats.length?stats.slice(-8).map(s=><div className="metric-bar" key={s.id}><span>{s.label}</span><div><i style={{width:`${s.avgAccuracy||0}%`}}/></div><b>{s.avgAccuracy||0}%</b><small>{s.answered} відп.</small></div>):<p>Дані з’являться після перших відповідей.</p>}</div><div className="live-stage"><div className="panel-title"><span>{focusStat?`ФОКУС: ${focusStat.label.toUpperCase()}`:'АКТИВНИЙ ЕТАП'}</span><small>що обирає зал</small></div>{focusStat?<><div className="stage-kpis"><div><b>{focusStat.answered}</b><span>відповіли</span></div><div><b>{focusStat.perfect}</b><span>ідеально</span></div><div><b>{focusStat.avgSeconds}s</b><span>середній час</span></div></div><OptionBars stageId={focusStat.id} counts={focusStat.optionCounts} total={focusStat.answered}/></>:<p>Очікуємо відповіді.</p>}</div></section>
  </main>
}
function OptionBars({stageId,counts,total}){const rows=Object.entries(counts||{}).sort((a,b)=>b[1]-a[1]).slice(0,6);return <div className="option-bars">{rows.map(([k,v])=><div key={k}><span>{humanOption(stageId,k)}</span><div><i style={{width:`${pct(v,total)}%`}}/></div><b>{pct(v,total)}%</b></div>)}</div>}

createRoot(document.getElementById('root')).render(SCREEN?<RoomScreen/>:<PlayerApp/>)
