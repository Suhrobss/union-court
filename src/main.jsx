import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { DEFAULT_ROOM, createRoomChannel, flattenPresence, makePlayerId } from './realtime'

const STEPS = ['Наказ', 'Строк', 'Збір', 'Захист', 'Відзив', 'Докази', 'Фініш']

const deliveredDate = new Date(2026, 0, 15)
const correctDeadlineDate = new Date(2026, 1, 15)
const correctDeadlineOffset = Math.round((correctDeadlineDate - deliveredDate) / 86400000)

const QUESTIONS = [
  {
    id: 'order',
    step: 0,
    eyebrow: 'Етап 1 · Наказ про звільнення',
    title: 'Проведіть первинну перевірку наказу',
    lead: 'Перед вами реконструйований кадровий документ. Позначте те, що ви перевіряли б перед майбутнім оскарженням.',
    type: 'document',
    options: [
      ['Правова підстава та конкретна норма КЗпП', true],
      ['Дата звільнення та момент вручення копії наказу', true],
      ['Фактичні обставини, якими роботодавець обґрунтовує звільнення', true],
      ['Можливість переведення та наявність іншої роботи', true],
      ['Колір печатки на документі', false],
    ],
    law: 'КЗпП України · підстава, процедура, гарантії та докази',
    explain: 'Наказ — лише початкова точка. Для оскарження важливо перевірити правову підставу, фактичні обставини, дату/вручення, процедуру та можливість переведення, якщо це має значення для конкретної підстави.',
  },
  {
    id: 'term',
    step: 1,
    eyebrow: 'Етап 2 · Процесуальний час',
    title: 'Встановіть крайній день звернення',
    lead: 'Навчальний приклад: копію наказу вручено 15 січня 2026 року. Перетягніть маркер на останній день місячного строку для спору про звільнення.',
    type: 'calendar',
    min: 10,
    max: 50,
    answer: correctDeadlineOffset,
    law: 'ст. 233 КЗпП України',
    explain: 'Закон встановлює саме місячний строк із дня вручення копії наказу про звільнення, а не універсальні «30 днів». У цьому навчальному прикладі він спливає 15 лютого.',
  },
  {
    id: 'fee',
    step: 2,
    eyebrow: 'Етап 3 · Відкриваємо провадження',
    title: 'Сформуйте бюджет подання позову',
    lead: 'Яка сума судового збору потрібна саме за вимогу про поновлення на роботі?',
    type: 'single',
    options: [
      ['0 грн', true],
      ['Фіксована сума за тарифом суду', false],
      ['1% від середнього заробітку', false],
      ['Залежить від стажу працівника', false],
    ],
    law: 'п. 1 ч. 1 ст. 5 Закону України «Про судовий збір»',
    explain: 'Позивачі у справах про поновлення на роботі звільнені від сплати судового збору. Це не означає автоматичної пільги для будь-якої можливої вимоги в будь-якому трудовому спорі.',
  },
  {
    id: 'representation',
    step: 3,
    eyebrow: 'Етап 4 · Побудуйте свій захист',
    title: 'Кого ви берете із собою до суду?',
    lead: 'Це не питання з однією «правильною кнопкою». Оберіть модель захисту — після вибору ви побачите її реальні можливості й умови.',
    type: 'route',
    routes: [
      { icon: '◎', title: 'Іду сам', subtitle: 'Самопредставництво', detail: 'Ви особисто подаєте документи, берете участь у засіданнях та ведете процес.' },
      { icon: '§', title: 'Адвокат', subtitle: 'Професійна правнича допомога', detail: 'Повноцінне професійне представництво. Умови та вартість визначаються домовленістю з адвокатом.' },
      { icon: '⚖', title: 'Інший представник', subtitle: 'Допустимо у трудовому спорі', detail: 'У трудовому спорі представником може бути інша повнолітня процесуально дієздатна особа за умов ЦПК.' },
      { icon: '◆', title: 'Профспілковий юрист', subtitle: 'Правозахисний ресурс профспілки', detail: 'Може представляти працівника, якщо відповідає вимогам ЦПК і його повноваження оформлені належно.' },
    ],
    law: 'ст. 58, 60–62 ЦПК України',
    explain: 'У трудовому спорі працівник не зведений до одного маршруту. Він може діяти особисто або через належного представника. Для представництва ключове значення має правильне підтвердження повноважень.',
  },
  {
    id: 'reply',
    step: 4,
    eyebrow: 'Етап 5 · Процесуальна пошта',
    title: 'Роботодавець подав відзив',
    lead: 'У вашій «вхідній пошті» зʼявився відзив на позов. Який документ логічно формує позивач у відповідь?',
    type: 'single',
    options: [
      ['Відповідь на відзив', true],
      ['Заперечення за ст. 180 ЦПК', false],
      ['Апеляційна скарга', false],
      ['Новий позов', false],
    ],
    law: 'ст. 179 ЦПК України',
    explain: 'Позивач викладає пояснення, міркування та аргументи щодо відзиву у відповіді на відзив. «Заперечення» за ст. 180 ЦПК має інше місце в послідовності заяв по суті справи.',
  },
  {
    id: 'evidence',
    step: 5,
    eyebrow: 'Етап 6 · Доказ заблоковано',
    title: 'Документ є, але він у роботодавця',
    lead: 'Самостійно отримати важливий доказ ви не можете. Відкрийте процесуальний інструмент, який дозволяє просити суд його витребувати.',
    type: 'single',
    options: [
      ['Клопотання про витребування доказів судом', true],
      ['Відмовитися від аргументу', false],
      ['Просити вважати факт доведеним без доказів', false],
      ['Одразу подавати касаційну скаргу', false],
    ],
    law: 'ст. 84 ЦПК України',
    explain: 'Якщо учасник справи не може самостійно надати доказ, він може подати клопотання про його витребування судом. У наступній версії цей етап підвʼяжемо до анонімізованого документа з реальної справи.',
  },
]

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatDate(date) {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function scoreMulti(question, selected) {
  const correct = question.options.filter(([, ok]) => ok).map(([label]) => label)
  const wrong = question.options.filter(([, ok]) => !ok).map(([label]) => label)
  const hit = correct.filter((label) => selected.includes(label)).length
  const wrongHit = wrong.filter((label) => selected.includes(label)).length
  return Math.max(0, Math.round(80 * Math.max(0, hit / correct.length - wrongHit * 0.25)))
}

function scoreQuestion(question, selected, calendarOffset) {
  if (question.type === 'document') return scoreMulti(question, selected)
  if (question.type === 'route') return selected.length ? 80 : 0
  if (question.type === 'single') return question.options.find(([label]) => label === selected[0])?.[1] ? 80 : 0
  if (question.type === 'calendar') {
    const diff = Math.abs(calendarOffset - question.answer)
    if (diff === 0) return 80
    if (diff === 1) return 62
    if (diff === 2) return 44
    if (diff === 3) return 24
    return 0
  }
  return 0
}

function getSpeedBonus(startedAt) {
  const seconds = Math.max(0, (Date.now() - startedAt) / 1000)
  return Math.max(0, Math.min(20, Math.round(20 - seconds / 2.5)))
}

function Brand() {
  return (
    <div className="brand-lockup">
      <div className="logo-slot"><span>МР</span><small>ПРМТУ</small></div>
      <div className="brand-copy"><span>МОЛОДІЖНА РАДА ПРМТУ</span><strong>СУДОВИЙ МАРШРУТ</strong></div>
    </div>
  )
}

function Progress({ step, completed = false }) {
  const progress = completed ? 100 : (step / (STEPS.length - 1)) * 100
  return (
    <div className="case-progress">
      <div className="progress-caption"><span>МАРШРУТ СПРАВИ</span><b>{Math.round(progress)}%</b></div>
      <div className="progress-line"><span style={{ width: `${progress}%` }} /></div>
      <div className="steps">
        {STEPS.map((label, index) => <div key={label} className={index <= step ? 'active' : ''}><i>{index + 1}</i><span>{label}</span></div>)}
      </div>
    </div>
  )
}

function Intro({ onStart, defaultRoom }) {
  const [name, setName] = useState('')
  const [room, setRoom] = useState(defaultRoom)
  return (
    <main className="app intro-app">
      <header><Brand /><div className="status-pill"><i /> LIVE READY</div></header>
      <section className="intro-card dossier">
        <div className="folder-tab">СПРАВА ПРО НЕЗАКОННЕ ЗВІЛЬНЕННЯ</div>
        <div className="justice-mark">§</div>
        <div className="eyebrow">ІНТЕРАКТИВНА ПРАВОЗАХИСНА СИМУЛЯЦІЯ</div>
        <h1>Вас звільнено.</h1>
        <p className="intro-copy">Від наказу роботодавця — до судового захисту. Ви приймаєте процесуальні рішення, збираєте силу справи та змагаєтесь за місце у фінальній трійці.</p>
        <div className="rules-grid"><div><strong>80%</strong><span>юридична точність</span></div><div><strong>20%</strong><span>бонус за швидкість</span></div><div><strong>TOP 3</strong><span>фінальний рейтинг</span></div></div>
        <div className="join-grid">
          <label className="name-field"><span>Імʼя або нік</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Наприклад: Марія" maxLength={26} /></label>
          <label className="name-field"><span>Код сесії</span><input value={room} onChange={(e) => setRoom(e.target.value.toUpperCase())} maxLength={12} /></label>
        </div>
        <button className="primary" onClick={() => onStart(name.trim() || 'Учасник', room.trim() || DEFAULT_ROOM)}>Увійти у справу <span>→</span></button>
        <p className="privacy-note">Без реєстрації. На загальний екран передаються лише введене імʼя/нік, ігровий прогрес та результат цієї сесії. Дані не записуються в базу.</p>
      </section>
      <footer><span>ПРАВО · ДОКАЗИ · ПРОЦЕС</span><span className="nautical">≈ МОРСЬКА ПРОФСПІЛКОВА СПІЛЬНОТА</span></footer>
    </main>
  )
}

function OrderDocument({ selected, toggle, submitted }) {
  const fields = [
    { key: 'Дата звільнення та момент вручення копії наказу', cls: 'hot date-hot' },
    { key: 'Правова підстава та конкретна норма КЗпП', cls: 'hot law-hot' },
    { key: 'Фактичні обставини, якими роботодавець обґрунтовує звільнення', cls: 'hot fact-hot' },
    { key: 'Можливість переведення та наявність іншої роботи', cls: 'hot transfer-hot' },
  ]
  return (
    <div className="order-stage">
      <div className="paper-document">
        <div className="paper-head"><small>ПІДПРИЄМСТВО «ПІВНІЧНИЙ ТЕРМІНАЛ»</small><strong>НАКАЗ</strong><span>про припинення трудового договору</span></div>
        <div className="paper-meta"><button className={selected.includes(fields[0].key) ? 'marked' : ''} onClick={() => toggle(fields[0].key)}>15.01.2026 · № 17-к</button><span>м. ______</span></div>
        <p>Припинити трудовий договір із працівником з 15 січня 2026 року.</p>
        <p><button className={selected.includes(fields[1].key) ? 'marked' : ''} onClick={() => toggle(fields[1].key)}>Підстава: відповідний пункт частини першої статті КЗпП України</button> у звʼязку з обставинами, зазначеними в матеріалах роботодавця.</p>
        <p><button className={selected.includes(fields[2].key) ? 'marked' : ''} onClick={() => toggle(fields[2].key)}>Обґрунтування та фактичні обставини — згідно з доданими документами</button>.</p>
        <p><button className={selected.includes(fields[3].key) ? 'marked' : ''} onClick={() => toggle(fields[3].key)}>Інформація щодо можливості переведення / запропонованої роботи</button>.</p>
        <div className="paper-sign"><span>Керівник</span><b>____________</b></div>
        <div className="stamp-ghost">КАДРИ</div>
      </div>
      <div className="inspection-panel"><span>ВАША ПЕРЕВІРКА</span><strong>{selected.filter((x) => fields.some((f) => f.key === x)).length}/4</strong><small>Натискайте безпосередньо на фрагменти документа.</small></div>
    </div>
  )
}

function RoutePicker({ routes, selected, toggle }) {
  return <div className="route-board">{routes.map((route) => <button key={route.title} className={`route-card ${selected.includes(route.title) ? 'selected' : ''}`} onClick={() => toggle(route.title)}><i>{route.icon}</i><div><strong>{route.title}</strong><span>{route.subtitle}</span><p>{route.detail}</p></div><b>{selected.includes(route.title) ? 'ОБРАНО' : 'ОБРАТИ'}</b></button>)}</div>
}

function RoomScreen({ roomCode }) {
  const [players, setPlayers] = useState([])
  const [connection, setConnection] = useState('ПІДКЛЮЧЕННЯ…')
  const channelRef = useRef(null)

  useEffect(() => {
    const channel = createRoomChannel(roomCode, `screen_${makePlayerId()}`)
    channelRef.current = channel
    channel.on('presence', { event: 'sync' }, () => setPlayers(flattenPresence(channel.presenceState())))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnection('LIVE')
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConnection('OFFLINE')
      })
    return () => { channel.unsubscribe() }
  }, [roomCode])

  const top = players.slice(0, 3)
  const currentStep = players.length ? Math.max(...players.map((p) => p.step || 0)) : 0
  const avg = players.length ? Math.round(players.reduce((s, p) => s + (p.score || 0), 0) / players.length) : 0
  const answered = players.filter((p) => (p.answered || 0) > 0).length

  return (
    <main className="room-app">
      <header className="room-header"><Brand /><div className="room-live"><i className={connection === 'LIVE' ? 'on' : ''} /> {connection} · СЕСІЯ {roomCode}</div></header>
      <section className="room-titlebar"><div><span>СПРАВА ЗАЛУ</span><h1>{STEPS[currentStep] || 'Очікування'}</h1><p>Кожна точка — реальний учасник, який зараз проходить судовий маршрут зі свого телефона.</p></div><div className="room-count"><small>У СПРАВІ</small><strong>{players.length}</strong><span>учасників</span></div></section>
      <Progress step={currentStep} completed={players.length > 0 && players.every((p) => p.finished)} />
      <section className="court-grid">
        <div className="live-docket">
          <div className="section-head"><span>ЖИВИЙ РУХ СПРАВИ</span><b>{answered}/{players.length || 0} вже відповідають</b></div>
          <div className="player-cloud">
            {players.length === 0 ? <div className="empty-room">Очікуємо учасників…<small>Відкрийте сайт на телефоні та введіть код <b>{roomCode}</b></small></div> : players.map((p, idx) => <div className={`player-chip ${p.finished ? 'done' : ''}`} key={p.playerId || idx}><span>{(p.name || '?').slice(0, 1).toUpperCase()}</span><div><strong>{p.name}</strong><small>{STEPS[p.step] || 'Фініш'} · {p.score || 0}</small></div></div>)}
          </div>
        </div>
        <aside className="leaderboard">
          <div className="section-head"><span>ТОП ЗАХИСТУ</span><b>LIVE</b></div>
          {[0,1,2].map((i) => <div className={`podium p${i+1}`} key={i}><span>{i + 1}</span><div><strong>{top[i]?.name || '—'}</strong><small>{top[i] ? `${top[i].score} балів · ${top[i].accuracy || 0}% точності` : 'місце вільне'}</small></div></div>)}
          <div className="room-mini"><div><span>Середній результат</span><strong>{avg}</strong></div><div><span>Онлайн</span><strong>{players.length}</strong></div></div>
        </aside>
      </section>
      <footer><span>МОЛОДІЖНА РАДА ПРМТУ · ПРАВОЗАХИСНА СИМУЛЯЦІЯ</span><span className="nautical">≈ FAIR WORK · FAIR PROCESS</span></footer>
    </main>
  )
}

function PlayerApp({ defaultRoom }) {
  const [player, setPlayer] = useState('')
  const [roomCode, setRoomCode] = useState(defaultRoom)
  const [playerId] = useState(makePlayerId)
  const [started, setStarted] = useState(false)
  const [connected, setConnected] = useState(false)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState([])
  const [calendarOffset, setCalendarOffset] = useState(25)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [history, setHistory] = useState([])
  const [startedAt, setStartedAt] = useState(Date.now())
  const [sessionStartedAt, setSessionStartedAt] = useState(Date.now())
  const [lastEarned, setLastEarned] = useState(0)
  const channelRef = useRef(null)

  const finished = index >= QUESTIONS.length
  const q = QUESTIONS[index]
  const perfectCount = useMemo(() => history.filter((item) => item.base === 80).length, [history])
  const accuracy = history.length ? Math.round(history.reduce((s, x) => s + x.base, 0) / (history.length * 80) * 100) : 0

  useEffect(() => {
    if (!started) return undefined
    const channel = createRoomChannel(roomCode, playerId)
    channelRef.current = channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true)
        await channel.track({ kind: 'player', playerId, name: player, score: 0, step: 0, answered: 0, accuracy: 0, finished: false, elapsedMs: 0 })
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConnected(false)
    })
    return () => { channel.unsubscribe() }
  }, [started, roomCode, playerId, player])

  useEffect(() => {
    if (!started || !connected || !channelRef.current) return
    channelRef.current.track({
      kind: 'player', playerId, name: player, score,
      step: finished ? STEPS.length - 1 : q?.step ?? 0,
      answered: history.length, accuracy, perfect: perfectCount,
      lastEarned, finished, elapsedMs: Date.now() - sessionStartedAt,
    })
  }, [started, connected, playerId, player, score, q, history.length, accuracy, perfectCount, lastEarned, finished, sessionStartedAt])

  const startGame = (name, room) => {
    setPlayer(name)
    setRoomCode(room.toUpperCase())
    setStarted(true)
    setStartedAt(Date.now())
    setSessionStartedAt(Date.now())
  }

  const toggle = (label) => {
    if (submitted) return
    if (q.type === 'single' || q.type === 'route') { setSelected([label]); return }
    setSelected((current) => current.includes(label) ? current.filter((x) => x !== label) : [...current, label])
  }

  const submit = () => {
    if (submitted) return
    const base = scoreQuestion(q, selected, calendarOffset)
    const speed = getSpeedBonus(startedAt)
    const earned = Math.min(100, base + speed)
    setSubmitted(true)
    setLastEarned(earned)
    setScore((current) => current + earned)
    setHistory((current) => [...current, { id: q.id, base, speed, earned }])
  }

  const next = () => {
    setSubmitted(false); setSelected([]); setCalendarOffset(25); setLastEarned(0); setStartedAt(Date.now()); setIndex((x) => x + 1)
  }

  const restart = () => {
    setIndex(0); setSelected([]); setCalendarOffset(25); setSubmitted(false); setScore(0); setHistory([]); setLastEarned(0); setStartedAt(Date.now()); setSessionStartedAt(Date.now())
  }

  if (!started) return <Intro onStart={startGame} defaultRoom={defaultRoom} />

  if (finished) {
    return <main className="app finish"><header><Brand /><div className="score-box"><span>{player}</span><strong>{score}</strong></div></header><Progress step={STEPS.length - 1} completed /><section className="hero-card dossier finish-card"><div className="folder-tab">СУДОВИЙ МАРШРУТ ЗАВЕРШЕНО</div><div className="verdict-stamp">СПРАВУ<br/>ПРОЙДЕНО</div><div className="eyebrow">ФІНАЛЬНИЙ ПРОТОКОЛ</div><h1>Ваш результат захисту</h1><div className="final-score">{score}<small> / {QUESTIONS.length * 100}</small></div><div className="finish-metrics"><div><span>Юридична точність</span><strong>{accuracy}%</strong></div><div><span>Ідеальні етапи</span><strong>{perfectCount}/{QUESTIONS.length}</strong></div><div><span>Сесія</span><strong>{roomCode}</strong></div></div><div className="winner-box"><span>ЗАГАЛЬНИЙ ЕКРАН</span><h2>Ваш результат уже в рейтингу залу</h2><p>TOP‑3 оновлюється в реальному часі. Після закриття вкладки ваш тимчасовий live‑стан зникає.</p></div><button className="primary" onClick={restart}>Пройти ще раз</button></section></main>
  }

  const canSubmit = q.type === 'calendar' || selected.length > 0
  const chosenDate = addDays(deliveredDate, calendarOffset)
  const route = q.type === 'route' ? q.routes.find((r) => r.title === selected[0]) : null

  return (
    <main className="app">
      <header><Brand /><div className="score-box"><span>{connected ? '● LIVE' : '○ CONNECTING'} · {player}</span><strong>{score}</strong></div></header>
      <Progress step={q.step} />
      <section className="hero-card dossier">
        <div className="folder-tab">МАТЕРІАЛИ СПРАВИ · {roomCode}</div>
        <div className="question-meta"><div className="eyebrow">{q.eyebrow}</div><div className="question-number">{index + 1}/{QUESTIONS.length}</div></div>
        <h1>{q.title}</h1><p className="lead">{q.lead}</p>

        {q.type === 'document' && <OrderDocument selected={selected} toggle={toggle} submitted={submitted} />}
        {q.type === 'route' && <RoutePicker routes={q.routes} selected={selected} toggle={toggle} />}
        {q.type === 'calendar' && <div className="range-wrap"><div className="calendar-sheet"><span>КОПІЮ НАКАЗУ ВРУЧЕНО</span><b>15 січня 2026</b></div><div className="calendar-date">{formatDate(chosenDate)}</div><div className="range-value"><strong>{calendarOffset}</strong><span>днів після вручення</span></div><input type="range" min={q.min} max={q.max} value={calendarOffset} onChange={(e) => !submitted && setCalendarOffset(Number(e.target.value))}/><div className="range-labels"><span>{q.min}</span><span>ОБЕРІТЬ ДАТУ</span><span>{q.max}</span></div></div>}
        {q.type === 'single' && <div className="options">{q.options.map(([label]) => <button key={label} className={`option ${selected.includes(label) ? 'selected' : ''}`} onClick={() => toggle(label)}><span className="check">{selected.includes(label) ? '✓' : ''}</span><span>{label}</span></button>)}</div>}

        {!submitted ? <button className="primary" disabled={!canSubmit} onClick={submit}>Зафіксувати процесуальне рішення <span>→</span></button> : <div className="result"><div className="result-top"><div><span>Результат етапу</span><small>{history.at(-1)?.base ?? 0} точність + {history.at(-1)?.speed ?? 0} швидкість</small></div><strong>+{lastEarned}</strong></div>{route && <div className="route-result"><i>{route.icon}</i><div><strong>{route.title}</strong><p>{route.detail}</p></div></div>}<div className="law-pill">⚖ {q.law}</div><p>{q.explain}</p><button className="primary" onClick={next}>{index === QUESTIONS.length - 1 ? 'Передати справу до фіналу' : 'Далі у справі'} <span>→</span></button></div>}
      </section>
      <footer><span>ПРМТУ · ЗАХИСТ ТРУДОВИХ ПРАВ</span><span className="nautical">≈ СЕСІЯ {roomCode}</span></footer>
    </main>
  )
}

const params = new URLSearchParams(window.location.search)
const isRoom = params.get('screen') === 'room'
const roomCode = (params.get('room') || DEFAULT_ROOM).toUpperCase()

createRoot(document.getElementById('root')).render(isRoom ? <RoomScreen roomCode={roomCode} /> : <PlayerApp defaultRoom={roomCode} />)
