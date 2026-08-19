import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import {
  STAGES, DIMENSIONS, FICTIONAL_ORDER, ORDER_AREAS, HISTORY_DOCS, VIBER_ITEMS,
  VACANCY_DATES, VACANCY_ITEMS, DEFENSE_ROUTES, CREDENTIALS, BAG_ITEMS, CLAIM_ITEMS,
  PROOF_ITEMS, UNION_ACTIONS, WITNESS_QUESTIONS, APPEAL_ATTACKS, CASSATION_KEYS,
} from './gameData'
import { DEFAULT_ROOM, joinGame, resumeGame, restartGame, submitGameStage, loadLeaderboard, startNewSession } from './realtime'

const PLAYER_KEY='union-court-player-v4'
const url=new URL(window.location.href)
const SCREEN=url.searchParams.get('screen')==='room'
const URL_ROOM=(url.searchParams.get('room')||DEFAULT_ROOM).toUpperCase()

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n))
const pct=(n,d)=>d?Math.round(n/d*100):0
const toggle=(arr,id,max=99)=>arr.includes(id)?arr.filter(x=>x!==id):(arr.length<max?[...arr,id]:arr)
const scoredStages=STAGES.filter(s=>s.scored)

function Mark({children,tone='blue'}){return <span className={`mark ${tone}`}>{children}</span>}
function StageHead({stage,kicker}){return <><div className="kicker">{kicker||`Етап ${STAGES.findIndex(x=>x.id===stage.id)+1} · ${stage.label}`}</div><h1>{stage.title}</h1></>}
function Tip({title,children,tone=''}){return <div className={`tip ${tone}`}><b>{title}</b><span>{children}</span></div>}
function Option({active,onClick,children,disabled=false}){return <button disabled={disabled} onClick={onClick} className={`option ${active?'active':''}`}>{children}</button>}

function OrderStage({answer,setAnswer}){
  const [inspected,setInspected]=useState(answer.inspected||[])
  const priorities=answer.priorities||[]
  const inspect=(id)=>{if(!inspected.includes(id)){const next=[...inspected,id];setInspected(next);setAnswer({...answer,inspected:next})}}
  const area=(id)=>ORDER_AREAS.find(x=>x[0]===id)
  return <div className="stage-grid order-layout">
    <div className="paper-wrap">
      <div className="scan-line"/>
      <article className="order-paper">
        <div className="paper-safe">НАВЧАЛЬНА РЕКОНСТРУКЦІЯ · УСІ РЕКВІЗИТИ ВИГАДАНІ</div>
        <header><small>Типова форма кадрового документа</small><h2>{FICTIONAL_ORDER.employer}</h2><div>Код {FICTIONAL_ORDER.code}</div></header>
        <div className="order-title">НАКАЗ (РОЗПОРЯДЖЕННЯ)<br/><b>про припинення трудового договору</b></div>
        <div className="order-row"><button onClick={()=>inspect('dates')}><b>{FICTIONAL_ORDER.orderNo}</b><span>від {FICTIONAL_ORDER.orderDate}</span></button><button onClick={()=>inspect('dates')}><span>Дата звільнення</span><b>{FICTIONAL_ORDER.dismissalDate}</b></button></div>
        <button className="doc-line" onClick={()=>inspect('basis')}><span>Працівник</span><b>{FICTIONAL_ORDER.employee}</b> · таб. № {FICTIONAL_ORDER.personnelNo}</button>
        <button className="doc-line" onClick={()=>inspect('transfer')}><span>Посада</span><b>{FICTIONAL_ORDER.position}</b></button>
        <button className="reason" onClick={()=>inspect('causation')}><span>Підстава припинення</span><b>{FICTIONAL_ORDER.basis}</b><p>{FICTIONAL_ORDER.reason}</p></button>
        <button className="doc-line" onClick={()=>inspect('causation')}><span>Документ-підстава</span>{FICTIONAL_ORDER.source}</button>
        <button className="doc-line" onClick={()=>inspect('payments')}><span>Виплати</span>{FICTIONAL_ORDER.vacation}; {FICTIONAL_ORDER.severance}</button>
        <button className="signature" onClick={()=>inspect('authority')}><span>{FICTIONAL_ORDER.signer}</span><i>підпис</i></button>
        <button className="service-box" onClick={()=>inspect('service')}><b>З наказом ознайомлений(а)</b><span>дата __________ підпис __________</span></button>
      </article>
    </div>
    <aside className="inspection">
      <div className="radar"><span>{inspected.length}</span><small>зон досліджено</small></div>
      <h3>Спочатку дослідіть документ</h3>
      <p>Натискайте прямо на реквізити. Ми пояснюємо, навіщо їх перевіряти.</p>
      <div className="findings">{inspected.slice(-4).reverse().map(id=>{const a=area(id);return a?<div key={id}><b>{a[1]}</b><span>{a[3]}</span></div>:null})}</div>
      {inspected.length>=4&&<div className="priority-box"><h3>Тепер у вас лише 5 маркерів</h3><p>Оберіть п’ять напрямків, які першими заберете в майбутнє оскарження.</p>{ORDER_AREAS.map(a=><Option key={a[0]} active={priorities.includes(a[0])} disabled={!priorities.includes(a[0])&&priorities.length>=5} onClick={()=>setAnswer({...answer,priorities:toggle(priorities,a[0],5)})}><span>{a[1]}</span><small>{a[2]==='noise'?'другорядне':'перевірити'}</small></Option>)}<div className="counter">{priorities.length}/5 маркерів</div></div>}
    </aside>
  </div>
}

function HistoryStage({answer,setAnswer}){
  const opened=answer.opened||[]
  return <div><Tip title="Важливо">На старті гравець не зобов’язаний знати передісторію. Вона відкривається тільки тепер — з матеріалів справи.</Tip><div className="file-cabinet">{HISTORY_DOCS.map((d,i)=><button key={d.id} className={`sealed-file ${opened.includes(d.id)?'open':''}`} onClick={()=>setAnswer({opened:[...new Set([...opened,d.id])]})}><span className="file-index">0{i+1}</span><b>{opened.includes(d.id)?d.label:d.title}</b><small>{opened.includes(d.id)?d.date:'Натисніть, щоб відкрити'}</small>{opened.includes(d.id)&&<p>{d.text}</p>}</button>)}</div>{opened.length===3&&<div className="history-reveal"><span>ПРОСТІЙ</span><i>→</i><span>ПРИЗУПИНЕННЯ</span><i>→</i><strong>ЗВІЛЬНЕННЯ</strong></div>}</div>
}

function TermStage({answer,setAnswer}){
  const day=answer.offset??30
  return <div className="focus-stage"><div className="calendar-card"><small>КОПІЮ НАКАЗУ ВРУЧЕНО</small><b>15 СІЧНЯ</b></div><div className="deadline-line"><span>10</span><input type="range" min="10" max="50" value={day} onChange={e=>setAnswer({offset:+e.target.value})}/><span>50</span></div><div className="big-number">{day}<small>днів</small></div><Tip title="Ваше завдання">Поставте повзунок туди, де, на вашу думку, закінчується місячний строк. Система оцінить близькість, але після відповіді пояснить головне: закон говорить про <b>місячний строк</b>, а не про фіксовані «30 днів».</Tip></div>
}

function MultiStage({items,answer,setAnswer,limit=99,intro}){
  const selected=answer.selected||[]
  return <div>{intro}{<div className="choice-stack">{items.map(([id,label])=><Option key={id} active={selected.includes(id)} disabled={!selected.includes(id)&&selected.length>=limit} onClick={()=>setAnswer({selected:toggle(selected,id,limit)})}>{label}</Option>)}</div>}</div>
}

function ViberStage(p){return <div className="phone-scene"><div className="fake-phone"><div className="phone-top">Роботодавець <span>сьогодні</span></div><div className="bubble">Надсилаємо кадрові документи та перелік вакансій.<div className="attachment">IMG_2041.jpg · 1 стор.</div><div className="attachment">vacancies.pdf · 18 стор.</div><small>18:42 ✓✓</small></div></div><div><Tip title="Не вирішуйте питання одним словом «Viber»." tone="blue">Проведіть міні-експертизу самого електронного обміну.</Tip><MultiStage {...p} items={VIBER_ITEMS}/></div></div>}

function VacanciesStage({answer,setAnswer}){
  const selected=answer.selected||[]; const date=answer.date||'d1'; const row=VACANCY_DATES.find(x=>x.id===date)
  return <div><div className="vacancy-radar"><div className="radar-screen"><span>{row.count}</span><small>вакансій у цьому «знімку»</small><div className="radar-dot a"/><div className="radar-dot b"/><div className="radar-dot c"/></div><div className="time-tabs">{VACANCY_DATES.map(d=><button className={date===d.id?'active':''} onClick={()=>setAnswer({...answer,date:d.id})} key={d.id}><b>{d.label}</b><small>{d.note}</small></button>)}</div></div><Tip title="Список вакансій — не магічний доказ.">Матеріали реальної справи показали, чому важливо перевіряти не лише наявність списку, а його повноту та актуальність у релевантний момент.</Tip><div className="choice-stack">{VACANCY_ITEMS.map(([id,l])=><Option key={id} active={selected.includes(id)} onClick={()=>setAnswer({...answer,selected:toggle(selected,id)})}>{l}</Option>)}</div></div>
}

function DefenseStage({answer,setAnswer}){
  const route=answer.route||''; const cred=answer.credential||''; const support=answer.support||false
  return <div><Tip title="Тут немає однієї правильної людини.">Завдання — зібрати <b>процесуально робочий маршрут</b>. Кілька маршрутів можуть бути правильними.</Tip><div className="route-builder"><div className="you node">ВИ</div><div className={`route-slot ${route?'filled':''}`}>{route?DEFENSE_ROUTES.find(x=>x.id===route)?.title:'Оберіть маршрут'}</div><div className="court node">СУД</div></div><div className="route-cards">{DEFENSE_ROUTES.map(r=><button key={r.id} className={route===r.id?'active':''} onClick={()=>setAnswer({...answer,route:r.id,credential:''})}><span>{r.icon}</span><b>{r.title}</b><small>{r.meta}</small></button>)}</div>{route&&<><h3 className="subhead">2. Прикріпіть підтвердження повноважень</h3><div className="credential-cards">{CREDENTIALS.map(c=><button key={c.id} className={cred===c.id?'active':''} onClick={()=>setAnswer({...answer,credential:c.id})}>{c.title}</button>)}</div><button className={`union-layer ${support?'active':''}`} onClick={()=>setAnswer({...answer,support:!support})}><span>ПРМТУ</span><b>Додати профспілковий шар підтримки</b><small>Це не замінює належного оформлення представництва, але може посилити правозахисну роботу.</small></button></>}</div>
}

function BagStage({answer,setAnswer}){
  const selected=answer.selected||[]
  return <div className="bag-stage"><div className="court-bag"><div className="bag-handle"/><div className="bag-body"><span>{selected.length}/5</span><small>речей у сумці</small>{selected.map(id=><i key={id}>{BAG_ITEMS.find(x=>x.id===id)?.icon}</i>)}</div></div><div><Tip title="У вас лише 5 місць.">Зберіть сумку до засідання. Є критично потрібне, корисне і те, що лише займає місце.</Tip><div className="bag-items">{BAG_ITEMS.map(x=><button key={x.id} disabled={!selected.includes(x.id)&&selected.length>=5} className={selected.includes(x.id)?'active':''} onClick={()=>setAnswer({selected:toggle(selected,x.id,5)})}><span>{x.icon}</span><b>{x.title}</b></button>)}</div></div></div>
}

function ProofStage({answer,setAnswer}){
  const selected=answer.selected||[]
  return <div className="evidence-lab"><div className="evidence-board"><div className="photo-evidence"><div className="damage-visual">▱<i/>▰</div><b>Фотоматеріал пошкодженого об’єкта</b><small>дата потребує перевірки</small></div><div className="logic-chain"><span>БОЙОВІ ДІЇ</span><i>→</i><span>ПОШКОДЖЕННЯ</span><i>→</i><span className="gap">?</span><i>→</i><strong>ЮРИДИЧНО НЕОБХІДНИЙ ФАКТ</strong></div></div><div><Tip title="Доказ ≠ висновок">Позначте лише ті висновки, які можна обережно зробити з такого доказу.</Tip><div className="choice-stack">{PROOF_ITEMS.map(([id,l])=><Option key={id} active={selected.includes(id)} onClick={()=>setAnswer({selected:toggle(selected,id)})}>{l}</Option>)}</div></div></div>
}

function VaultStage({answer,setAnswer}){return <div className="vault-scene"><div className={`vault ${answer.tool==='request'?'open':''}`}><div className="vault-door">{answer.tool==='request'?'ВІДКРИТО':'🔒'}</div><div className="locked-files"><span>актуальні вакансії</span><span>внутрішні кадрові документи</span><span>документи щодо стану майна</span></div></div><div><Tip title="Потрібний документ у іншої сторони.">Оберіть процесуальну дію.</Tip>{[['request','Клопотання про витребування доказів'],['assume','Попросити суд просто повірити'],['giveup','Відмовитися від аргументу'],['cassation','Одразу подати касацію']].map(x=><Option key={x[0]} active={answer.tool===x[0]} onClick={()=>setAnswer({tool:x[0]})}>{x[1]}</Option>)}</div></div>}

function UnionStage(p){return <div><div className="union-hq"><div className="incoming">ПОВІДОМЛЕННЯ РОБОТОДАВЦЯ</div><div className="hq-core">ПРМТУ<br/><small>ШТАБ ЗАХИСТУ</small></div><div className="consult-meter"><span>ІНФОРМАЦІЯ</span><span>ДОКУМЕНТИ</span><span>КОНСУЛЬТАЦІЇ</span></div></div><Tip title="Повідомити ≠ провести консультації.">Виберіть дії, які перетворюють формальне повідомлення на реальний профспілковий захист.</Tip><MultiStage {...p} items={UNION_ACTIONS}/></div>}

function WitnessStage({answer,setAnswer}){const selected=answer.selected||[];return <div className="witness-room"><div className="witness"><div className="avatar">?</div><b>СВІДОК</b><small>У вас лише три питання</small></div><div className="question-stack">{WITNESS_QUESTIONS.map(([id,l])=><Option key={id} active={selected.includes(id)} disabled={!selected.includes(id)&&selected.length>=3} onClick={()=>setAnswer({selected:toggle(selected,id,3)})}>{l}</Option>)}</div></div>}

function JudgmentStage(){return <div className="verdict-scene"><small>СУД ПЕРШОЇ ІНСТАНЦІЇ</small><div className="date-stamp">РІШЕННЯ</div><h2>ПОЗОВ ЗАДОВОЛЕНО ЧАСТКОВО</h2><div className="result-cards"><div><b>Поновлення</b><span>на роботі</span></div><div><b>Середній заробіток</b><span>за час вимушеного прогулу</span></div></div><Tip title="Сума в публічному прототипі не відтворюється.">Гра навчає механіці захисту, а не публікує ідентифікуючі реквізити реальної справи.</Tip></div>}

function AppealStage({answer,setAnswer}){const map=answer.map||{};return <div><div className="appeal-split"><div className="attack-title">РОБОТОДАВЕЦЬ АТАКУЄ</div><div className="counter-title">ВАША ВІДПОВІДЬ</div>{APPEAL_ATTACKS.map(a=><React.Fragment key={a.id}><div className="attack-card">{a.attack}</div><div className="counter-card">{a.counters.map(([id,t])=><button className={map[a.id]===id?'active':''} key={id} onClick={()=>setAnswer({map:{...map,[a.id]:id}})}>{t}</button>)}</div></React.Fragment>)}</div><div className="practice-update">⚡ ПРАКТИКА ЗМІНЮЄТЬСЯ ПІД ЧАС РОЗГЛЯДУ — ЮРИСТ ПОВИНЕН ПЕРЕВІРЯТИ ЇЇ ЗНОВУ</div></div>}

function ParallelStage(){return <div className="parallel-scene"><div className="case-folder main-case"><small>ОСНОВНА СПРАВА</small><b>НЕЗАКОННЕ ЗВІЛЬНЕННЯ</b></div><div className="red-thread"/><div className="case-folder second-case"><small>ПОВ’ЯЗАНА СПРАВА</small><b>ЗАКОННІСТЬ ПОПЕРЕДНЬОГО ПРИЗУПИНЕННЯ</b><span>Рішення набрало законної сили</span></div><Tip title="Поворот">Попередній кадровий акт, який здавався лише фоном, став предметом іншого спору. Результат пов’язаної справи повернувся в апеляцію як юридично важлива обставина.</Tip></div>}
function AppealVerdict(){return <div className="verdict-scene appeal-v"><small>АПЕЛЯЦІЙНИЙ СУД</small><div className="date-stamp">ПОСТАНОВА</div><h2>АПЕЛЯЦІЙНУ СКАРГУ — БЕЗ ЗАДОВОЛЕННЯ</h2><strong>Рішення першої інстанції залишено без змін</strong></div>}

function CassationStage({answer,setAnswer}){const selected=answer.selected||[];return <div className="cassation-door"><div className="supreme-door"><b>КАСАЦІЯ</b><span>{selected.filter(id=>CASSATION_KEYS.find(x=>x[0]===id)?.[2]).length}/4 ключі</span><div className="locks">{[0,1,2,3].map(i=><i key={i} className={selected.filter(id=>CASSATION_KEYS.find(x=>x[0]===id)?.[2]).length>i?'open':''}>◆</i>)}</div></div><div><Tip title="Касація — не просто «ще один суд».">Для малозначної справи спочатку треба пройти процесуальний фільтр. Оберіть чотири винятки, передбачені ст. 389 ЦПК.</Tip><div className="choice-stack">{CASSATION_KEYS.map(([id,l])=><Option key={id} active={selected.includes(id)} disabled={!selected.includes(id)&&selected.length>=4} onClick={()=>setAnswer({selected:toggle(selected,id,4)})}>{l}</Option>)}</div></div></div>}

function Finale(){return <div className="finale"><div className="paper-stack"><span>НАКАЗ</span><span>ДОКАЗИ</span><span>ПОЗОВ</span><span>ІНСТАНЦІЯ I</span><span>АПЕЛЯЦІЯ</span><span>ПОВ’ЯЗАНА СПРАВА</span><span>КАСАЦІЯ</span></div><div className="final-stamps"><b>АПЕЛЯЦІЯ<br/>БЕЗ ЗАДОВОЛЕННЯ</b><b>КАСАЦІЙНЕ ПРОВАДЖЕННЯ<br/>НЕ ВІДКРИТО</b></div><h2>А почалося все з одного наказу.</h2><p>Справедливість у суді — це не одна «сильна фраза». Це строки, докази, процедура, стратегія і люди, які допомагають пройти весь шлях.</p></div>}

function renderStage(stage,answer,setAnswer){
  const props={answer,setAnswer}
  switch(stage.id){
    case'order':return <OrderStage {...props}/>;case'history':return <HistoryStage {...props}/>;case'term':return <TermStage {...props}/>;case'viber':return <ViberStage {...props}/>;case'vacancies':return <VacanciesStage {...props}/>;case'defense':return <DefenseStage {...props}/>;case'bag':return <BagStage {...props}/>;case'claim':return <MultiStage {...props} items={CLAIM_ITEMS} intro={<Tip title="Позов — це не просто «мене образили».">Оберіть юридично змістовні вимоги.</Tip>}/>;case'proof':return <ProofStage {...props}/>;case'vault':return <VaultStage {...props}/>;case'union':return <UnionStage {...props}/>;case'witness':return <WitnessStage {...props}/>;case'judgment':return <JudgmentStage/>;case'appeal':return <AppealStage {...props}/>;case'parallel':return <ParallelStage/>;case'appeal_verdict':return <AppealVerdict/>;case'cassation':return <CassationStage {...props}/>;case'finale':return <Finale/>;default:return null
  }
}

function ready(stage,answer){
  if(!stage.scored){if(stage.id==='history')return (answer.opened||[]).length===3;return true}
  if(stage.id==='order')return (answer.priorities||[]).length===5
  if(stage.id==='term')return answer.offset!=null
  if(stage.id==='defense')return !!answer.route&&!!answer.credential
  if(stage.id==='bag')return (answer.selected||[]).length===5
  if(stage.id==='witness')return (answer.selected||[]).length===3
  if(stage.id==='appeal')return Object.keys(answer.map||{}).length===3
  if(stage.id==='cassation')return (answer.selected||[]).length===4
  if(stage.id==='vault')return !!answer.tool
  return (answer.selected||[]).length>0
}
function payload(stage,answer){
  if(stage.id==='order')return {priorities:answer.priorities||[]}
  if(stage.id==='history')return {opened:answer.opened||[]}
  return answer
}

function Join({onJoin}){const[name,setName]=useState('');const[room,setRoom]=useState(URL_ROOM);const[busy,setBusy]=useState(false);return <main className="join-page"><div className="brand"><div className="logo-slot">МІСЦЕ ДЛЯ<br/>ЛОГО МР ПРМТУ</div><div><small>НАВЧАЛЬНА СИМУЛЯЦІЯ</small><b>UNION COURT</b></div></div><section className="join-card"><Mark>ТРУДОВИЙ СПІР · НЕЗАКОННЕ ЗВІЛЬНЕННЯ</Mark><h1>Вас звільнено.<br/>Що робити далі?</h1><p>Ви пройдете шлях від одного кадрового наказу до апеляції та касації. Правильність важливіша за швидкість.</p><input value={name} maxLength={32} placeholder="Ваше ім’я або нік" onChange={e=>setName(e.target.value)}/><input value={room} maxLength={16} placeholder="Код сесії" onChange={e=>setRoom(e.target.value.toUpperCase())}/><button className="primary" disabled={!name.trim()||busy} onClick={async()=>{setBusy(true);try{await onJoin(name.trim(),room)}finally{setBusy(false)}}}>{busy?'Підключення…':'Увійти у справу'}</button><small className="privacy-note">Не вводьте прізвище, телефон, e-mail або інші персональні дані. Для гри достатньо імені чи ніка.</small></section></main>}

function PlayerApp(){
  const[session,setSession]=useState(null);const[answer,setAnswer]=useState({});const[result,setResult]=useState(null);const[busy,setBusy]=useState(false);const[err,setErr]=useState('')
  useEffect(()=>{const raw=localStorage.getItem(PLAYER_KEY);if(!raw)return;try{const saved=JSON.parse(raw);resumeGame(saved.id,saved.token).then(r=>setSession(r.player)).catch(()=>localStorage.removeItem(PLAYER_KEY))}catch{localStorage.removeItem(PLAYER_KEY)}},[])
  const store=p=>{setSession(p);localStorage.setItem(PLAYER_KEY,JSON.stringify({id:p.id,token:p.session_token,room:p.room_code}))}
  const join=async(name,room)=>{const r=await joinGame(name,room);store(r.player)}
  if(!session)return <Join onJoin={join}/>
  const stage=STAGES[session.stage_index]||STAGES.at(-1);const finished=session.finished||session.stage_index>=STAGES.length
  const submit=async()=>{setBusy(true);setErr('');try{const r=await submitGameStage({playerId:session.id,sessionToken:session.session_token,stageId:stage.id,answer:payload(stage,answer)});setResult(r.result);store(r.player)}catch(e){setErr(e.message)}finally{setBusy(false)}}
  const next=()=>{setResult(null);setAnswer({})}
  const restart=async()=>{if(!confirm('Почати новий розгляд? Поточний результат залишиться в історії сесії.'))return;const r=await restartGame(session.id,session.session_token);store(r.player);setAnswer({});setResult(null)}
  if(finished)return <main className="player-shell"><PlayerHeader session={session} onRestart={restart}/><section className="stage-card"><Finale/><div className="score-finish"><span>Ваш результат</span><b>{session.score}</b><small>точність і юридична логіка мають більшу вагу, ніж швидкість</small></div><button className="primary" onClick={restart}>↻ Новий розгляд</button></section></main>
  return <main className="player-shell"><PlayerHeader session={session} onRestart={restart}/><div className="stage-progress">{STAGES.map((s,i)=><i key={s.id} className={i<session.stage_index?'done':i===session.stage_index?'now':''}/>)}</div><section className="stage-card"><StageHead stage={stage}/>{renderStage(stage,answer,setAnswer)}{err&&<div className="error">{err}</div>}{result?<ResultPanel result={result} stage={stage} onNext={next}/>:<button className="primary action" disabled={!ready(stage,answer)||busy} onClick={submit}>{busy?'Фіксуємо…':stage.scored?'Зафіксувати рішення':'Продовжити справу'}</button>}</section></main>
}

function PlayerHeader({session,onRestart}){return <header className="player-head"><div className="brand compact"><div className="logo-slot small">ЛОГО<br/>МР ПРМТУ</div><div><small>UNION COURT</small><b>{session.display_name}</b></div></div><div className="score-pill"><small>РЕЙТИНГ ЗАХИСТУ</small><b>{session.score}</b></div><button className="new-run" onClick={onRestart}>↻ Новий розгляд</button></header>}
function ResultPanel({result,stage,onNext}){return <div className="result-panel"><div className="earned"><span>+{result.earned||0}</span><small>{result.base||0} за точність · +{result.speed||0} за швидкість</small></div>{result.feedback&&<Tip title={result.feedback.title}>{result.feedback.text}</Tip>}<Tip title={stage.scored?'Рішення зафіксовано':'Матеріал відкрито'}>{result.base===80?'Юридична логіка — максимальна.':stage.scored?'Далі побачите, як цей фрагмент впливає на справу.':'Переходимо до наступного фрагмента.'}</Tip><button className="primary" onClick={onNext}>Наступний етап →</button></div>}

const stageName=i=>STAGES[clamp(i,0,STAGES.length-1)]?.label||'—'
function RoomScreen(){
  const[data,setData]=useState({players:[],stageStats:{},session:null});const[err,setErr]=useState('');const[pin,setPin]=useState('');const[showPin,setShowPin]=useState(false)
  const refresh=async()=>{try{setData(await loadLeaderboard(URL_ROOM));setErr('')}catch(e){setErr(e.message)}}
  useEffect(()=>{refresh();const t=setInterval(refresh,2200);return()=>clearInterval(t)},[])
  const players=data.players||[];const finished=players.filter(p=>p.finished).length;const answered=players.reduce((s,p)=>s+(p.answered_count||0),0);const perfect=players.reduce((s,p)=>s+(p.correct_count||0),0);const avgScore=players.length?Math.round(players.reduce((s,p)=>s+p.score,0)/players.length):0;const accuracy=answered?pct(perfect,answered):0
  const leaders=[...players].sort((a,b)=>b.base_score-a.base_score||b.score-a.score).slice(0,3)
  const distribution=STAGES.map((s,i)=>({stage:s,count:players.filter(p=>!p.finished&&p.stage_index===i).length})).filter(x=>x.count)
  const stats=Object.entries(data.stageStats||{}).filter(([id])=>STAGES.find(s=>s.id===id)?.scored).map(([id,s])=>({id,label:STAGES.find(x=>x.id===id)?.label||id,...s}))
  const latest=stats.sort((a,b)=>STAGES.findIndex(x=>x.id===b.id)-STAGES.findIndex(x=>x.id===a.id))[0]
  const newSession=async()=>{if(!pin)return;try{await startNewSession(URL_ROOM,pin);setShowPin(false);setPin('');await refresh()}catch(e){setErr(e.message)}}
  return <main className="room-screen"><header className="room-head"><div className="brand"><div className="logo-slot room-logo">МІСЦЕ ДЛЯ ЛОГО<br/>МР ПРМТУ</div><div><small>СПРАВА ЗАЛУ · СЕСІЯ {data.session?.sessionNo||'—'}</small><b>UNION COURT</b></div></div><div className="room-code">КОД <b>{URL_ROOM}</b></div><button className="room-reset" onClick={()=>setShowPin(!showPin)}>↻ НОВИЙ РОЗГЛЯД</button></header>{showPin&&<div className="host-panel"><span>Старі результати не видаляються — буде створена нова сесія.</span><input type="password" placeholder="PIN ведучого" value={pin} onChange={e=>setPin(e.target.value)}/><button onClick={newSession}>Створити нову сесію</button></div>}{err&&<div className="error">{err}</div>}
    <section className="room-kpis"><div><small>У СПРАВІ</small><b>{players.length}</b><span>учасників</span></div><div><small>ЗАВЕРШИЛИ</small><b>{finished}</b><span>{pct(finished,players.length)}%</span></div><div><small>СЕРЕДНІЙ БАЛ</small><b>{avgScore}</b><span>по залу</span></div><div><small>ІДЕАЛЬНИХ ЕТАПІВ</small><b>{accuracy}%</b><span>{perfect} із {answered}</span></div></section>
    <section className="room-main"><div className="case-flow-panel"><div className="panel-title"><span>ЖИВИЙ РУХ СПРАВИ</span><small>Гравці не зникають при втраті Presence: екран читає збережений стан активної сесії.</small></div><div className="case-track">{STAGES.map((s,i)=><div key={s.id} className={`track-node ${players.some(p=>p.stage_index===i)?'hot':''}`}><i>{i+1}</i><span>{s.label}</span><em>{players.filter(p=>p.stage_index===i).length}</em></div>)}</div><div className="distribution">{distribution.length?distribution.map(x=><div key={x.stage.id}><span>{x.stage.label}</span><b style={{width:`${Math.max(6,pct(x.count,players.length))}%`}}>{x.count}</b></div>):<p>Очікуємо учасників…</p>}</div></div>
      <aside className="leaderboard"><div className="panel-title"><span>TOP 3</span><small>точність → бали → час</small></div>{leaders.map((p,i)=><div className={`leader rank-${i+1}`} key={p.id}><i>{i+1}</i><div><b>{p.display_name}</b><small>{stageName(p.stage_index)} · {p.correct_count}/{p.answered_count} ідеальних</small></div><strong>{p.score}</strong></div>)}{leaders.length===0&&<p>Рейтинг з’явиться після старту.</p>}</aside>
    </section>
    <section className="analytics-grid"><div className="accuracy-panel"><div className="panel-title"><span>ТОЧНІСТЬ ЗА ЕТАПАМИ</span><small>не «хто натиснув А», а наскільки зал юридично влучив</small></div>{stats.length?stats.slice(-8).map(s=><div className="metric-bar" key={s.id}><span>{s.label}</span><div><i style={{width:`${s.avgAccuracy||0}%`}}/></div><b>{s.avgAccuracy||0}%</b><small>{s.answered} відп.</small></div>):<p>Дані з’являться після перших відповідей.</p>}</div><div className="live-stage"><div className="panel-title"><span>{latest?`ЗАРАЗ: ${latest.label.toUpperCase()}`:'ОСТАННІЙ АКТИВНИЙ ЕТАП'}</span><small>агрегована статистика залу</small></div>{latest?<><div className="stage-kpis"><div><b>{latest.answered}</b><span>відповіли</span></div><div><b>{latest.perfect}</b><span>ідеально</span></div><div><b>{latest.avgSeconds}s</b><span>середній час</span></div></div><OptionBars counts={latest.optionCounts} total={latest.answered}/></>:<p>Очікуємо відповіді.</p>}</div></section>
  </main>
}
function OptionBars({counts,total}){const rows=Object.entries(counts||{}).sort((a,b)=>b[1]-a[1]).slice(0,5);return <div className="option-bars">{rows.map(([k,v])=><div key={k}><span>{k.replace(/^.*:/,'')}</span><div><i style={{width:`${pct(v,total)}%`}}/></div><b>{v}</b></div>)}</div>}

createRoot(document.getElementById('root')).render(SCREEN?<RoomScreen/>:<PlayerApp/>)
