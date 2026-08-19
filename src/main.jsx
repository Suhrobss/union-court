import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const STEPS = ['Наказ', 'Строк', 'Збір', 'Захист', 'Відзив', 'Докази', 'Фініш']

const deliveredDate = new Date(2026, 0, 15)
const correctDeadlineDate = new Date(2026, 1, 15)
const correctDeadlineOffset = Math.round((correctDeadlineDate - deliveredDate) / 86400000)

const QUESTIONS = [
  {
    id: 'order',
    step: 0,
    eyebrow: 'Етап 1 · Вас звільнено',
    title: 'Що перевіряємо в наказі про звільнення?',
    lead: 'Оберіть усі елементи, які можуть мати значення для оцінки законності звільнення.',
    type: 'multi',
    options: [
      ['Правова підстава та конкретна норма КЗпП', true],
      ['Дата звільнення та момент вручення копії наказу', true],
      ['Фактичні обставини, якими роботодавець обґрунтовує звільнення', true],
      ['Чи дотримано процедуру та спеціальні гарантії, якщо вони застосовні', true],
      ['Колір печатки на документі', false],
    ],
    law: 'КЗпП України · підстава звільнення + процедура',
    explain:
      'Наказ не є “вироком”. Для оцінки законності потрібно зіставити формальну підставу з фактичними обставинами, процедурою, гарантіями та доказами роботодавця.',
  },
  {
    id: 'term',
    step: 1,
    eyebrow: 'Етап 2 · Час пішов',
    title: 'Де закінчується місячний строк?',
    lead: 'Навчальний приклад: копію наказу вручено 15 січня 2026 року. Перетягніть маркер на останній день місячного строку для спору про звільнення.',
    type: 'calendar',
    min: 10,
    max: 50,
    answer: correctDeadlineOffset,
    law: 'ст. 233 КЗпП України',
    explain:
      'Закон говорить саме про місячний строк з дня вручення копії наказу про звільнення, а не про універсальні “30 днів”. У цьому прикладі місячний строк спливає 15 лютого.',
  },
  {
    id: 'fee',
    step: 2,
    eyebrow: 'Етап 3 · Подати позов',
    title: 'Скільки судового збору за вимогу про поновлення на роботі?',
    lead: 'Оберіть правильний варіант для вимоги про поновлення на роботі.',
    type: 'single',
    options: [
      ['0 грн', true],
      ['Фіксована сума за тарифом суду', false],
      ['1% від середнього заробітку', false],
      ['Залежить від стажу працівника', false],
    ],
    law: 'п. 1 ч. 1 ст. 5 Закону України «Про судовий збір»',
    explain:
      'Позивачі у справах про поновлення на роботі звільнені від сплати судового збору. Важливо: це не означає, що будь-яка вимога у будь-якому трудовому спорі автоматично є безкоштовною.',
  },
  {
    id: 'representation',
    step: 3,
    eyebrow: 'Етап 4 · Хто захищає вас у суді?',
    title: 'Оберіть допустимі моделі участі у трудовому спорі',
    lead: 'Правильних варіантів декілька. Для представника повноваження мають бути належно підтверджені.',
    type: 'multi',
    options: [
      ['Особисто — самопредставництво', true],
      ['Через адвоката', true],
      ['Через іншу повнолітню особу з цивільною процесуальною дієздатністю — у трудовому спорі, з урахуванням обмежень ЦПК', true],
      ['Через профспілкового юриста / представника, якщо він відповідає вимогам ЦПК і має належні повноваження', true],
      ['Лише адвокат — інших варіантів немає', false],
    ],
    law: 'ст. 58, 60–62 ЦПК України',
    explain:
      'У трудових спорах представником може бути не лише адвокат. ЦПК дозволяє участь іншої повнолітньої процесуально дієздатної особи, якщо немає передбачених законом обмежень і повноваження оформлено належно.',
  },
  {
    id: 'reply',
    step: 4,
    eyebrow: 'Етап 5 · Роботодавець відповів',
    title: 'На ваш позов надійшов відзив. Ваш наступний процесуальний документ?',
    lead: 'Оберіть документ, яким позивач реагує на заперечення відповідача у відзиві.',
    type: 'single',
    options: [
      ['Відповідь на відзив', true],
      ['Заперечення за ст. 180 ЦПК', false],
      ['Апеляційна скарга', false],
      ['Новий позов', false],
    ],
    law: 'ст. 179 ЦПК України',
    explain:
      'Позивач викладає свої пояснення, міркування та аргументи щодо відзиву саме у відповіді на відзив. “Заперечення” за ст. 180 ЦПК — інший процесуальний документ у послідовності обміну заявами.',
  },
  {
    id: 'evidence',
    step: 5,
    eyebrow: 'Етап 6 · Доказ у роботодавця',
    title: 'Важливий документ є у роботодавця, а самостійно отримати його не можете. Що робити?',
    lead: 'Оберіть процесуальний інструмент, передбачений ЦПК.',
    type: 'single',
    options: [
      ['Подати клопотання про витребування доказів судом', true],
      ['Відмовитися від цього аргументу', false],
      ['Просити суд вважати факт доведеним без доказів', false],
      ['Одразу подавати касаційну скаргу', false],
    ],
    law: 'ст. 84 ЦПК України',
    explain:
      'Якщо учасник справи не може самостійно надати доказ, він може подати клопотання про витребування доказу судом. У реальній версії гри цей етап буде побудовано на анонімізованому процесуальному документі з вашої справи.',
  },
]

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatDate(date) {
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function scoreMulti(question, selected) {
  const correct = question.options.filter(([, ok]) => ok).map(([label]) => label)
  const wrong = question.options.filter(([, ok]) => !ok).map(([label]) => label)
  const hit = correct.filter((label) => selected.includes(label)).length
  const wrongHit = wrong.filter((label) => selected.includes(label)).length

  const completeness = hit / correct.length
  const penalty = wrongHit * 0.25
  return Math.max(0, Math.round(80 * Math.max(0, completeness - penalty)))
}

function scoreQuestion(question, selected, calendarOffset) {
  if (question.type === 'multi') return scoreMulti(question, selected)

  if (question.type === 'single') {
    const answer = question.options.find(([label]) => label === selected[0])
    return answer?.[1] ? 80 : 0
  }

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
    <div className="brand">
      <span>МОЛОДІЖНА РАДА ПРМТУ</span>
      <strong>СУДОВИЙ МАРШРУТ</strong>
    </div>
  )
}

function Progress({ step, completed = false }) {
  const progress = completed ? 100 : (step / (STEPS.length - 1)) * 100

  return (
    <div className="case-progress" aria-label="Прогрес справи">
      <div className="progress-line">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="steps">
        {STEPS.map((label, index) => (
          <div key={label} className={index <= step ? 'active' : ''}>
            <i />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Intro({ onStart }) {
  const [name, setName] = useState('')

  return (
    <main className="app intro-app">
      <header>
        <Brand />
        <div className="status-pill">ПРОТОТИП 0.2</div>
      </header>

      <section className="intro-card">
        <div className="eyebrow">Трудовий спір · незаконне звільнення</div>
        <h1>Вас звільнено.</h1>
        <p className="intro-copy">
          За кілька хвилин ви пройдете шлях працівника від наказу про звільнення до процесуального захисту в суді. Правильність рішення дає основні бали. Швидкість — додатковий бонус.
        </p>

        <div className="rules-grid">
          <div><strong>80</strong><span>балів за юридичну точність</span></div>
          <div><strong>20</strong><span>балів максимум за швидкість</span></div>
          <div><strong>TOP 3</strong><span>переможці у фіналі</span></div>
        </div>

        <label className="name-field">
          <span>Імʼя або нік для рейтингу</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Наприклад: Марія"
            maxLength={32}
            autoComplete="off"
          />
        </label>

        <button className="primary" onClick={() => onStart(name.trim() || 'Учасник')}>
          Почати справу
        </button>

        <p className="privacy-note">У цьому прототипі не використовуються персональні дані учасників судової справи.</p>
      </section>
    </main>
  )
}

function RoomScreen() {
  const [room, setRoom] = useState({
    player: '—',
    score: 0,
    step: 0,
    answered: 0,
    perfect: 0,
    lastEarned: 0,
    finished: false,
  })

  useEffect(() => {
    if (!('BroadcastChannel' in window)) return undefined
    const channel = new BroadcastChannel('union-court-demo')
    channel.onmessage = (event) => setRoom(event.data)
    return () => channel.close()
  }, [])

  const currentLabel = room.finished ? 'Справу завершено' : STEPS[Math.min(room.step, STEPS.length - 1)]

  return (
    <main className="room-app">
      <header className="room-header">
        <Brand />
        <div className="room-live"><i /> ДЕМО · ЖИВА СИНХРОНІЗАЦІЯ</div>
      </header>

      <section className="room-hero">
        <div>
          <div className="eyebrow">СПРАВА ПРО НЕЗАКОННЕ ЗВІЛЬНЕННЯ</div>
          <h1>{currentLabel}</h1>
          <p>На телефонах учасників зараз відбувається цей етап судового маршруту.</p>
        </div>
        <div className="room-score">
          <span>Поточний результат</span>
          <strong>{room.score}</strong>
          <small>{room.player}</small>
        </div>
      </section>

      <Progress step={room.finished ? STEPS.length - 1 : room.step} completed={room.finished} />

      <section className="room-stats">
        <div><span>Відповідей</span><strong>{room.answered}</strong></div>
        <div><span>Ідеально точних</span><strong>{room.perfect}</strong></div>
        <div><span>Останній етап</span><strong>+{room.lastEarned}</strong></div>
      </section>

      <section className="room-note">
        <span>ВЕЛИКИЙ ЕКРАН</span>
        <p>
          Це демонстраційний режим. У фінальній версії тут буде агрегована статистика всього залу, карта процесу та TOP‑3, а не дані одного браузера.
        </p>
      </section>
    </main>
  )
}

function PlayerApp() {
  const [player, setPlayer] = useState('')
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState([])
  const [calendarOffset, setCalendarOffset] = useState(25)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [history, setHistory] = useState([])
  const [startedAt, setStartedAt] = useState(Date.now())
  const [lastEarned, setLastEarned] = useState(0)
  const channelRef = useRef(null)

  const finished = index >= QUESTIONS.length
  const q = QUESTIONS[index]

  useEffect(() => {
    if (!('BroadcastChannel' in window)) return undefined
    const channel = new BroadcastChannel('union-court-demo')
    channelRef.current = channel
    return () => channel.close()
  }, [])

  const perfectCount = useMemo(() => history.filter((item) => item.base === 80).length, [history])

  useEffect(() => {
    if (!started) return
    channelRef.current?.postMessage({
      player,
      score,
      step: finished ? STEPS.length - 1 : q?.step ?? 0,
      answered: history.length,
      perfect: perfectCount,
      lastEarned,
      finished,
    })
  }, [player, score, q, history.length, perfectCount, lastEarned, finished, started])

  const startGame = (name) => {
    setPlayer(name)
    setStarted(true)
    setStartedAt(Date.now())
  }

  const toggle = (label) => {
    if (submitted) return
    if (q.type === 'single') {
      setSelected([label])
      return
    }
    setSelected((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    )
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
    setSubmitted(false)
    setSelected([])
    setCalendarOffset(25)
    setLastEarned(0)
    setStartedAt(Date.now())
    setIndex((current) => current + 1)
  }

  const restart = () => {
    setIndex(0)
    setSelected([])
    setCalendarOffset(25)
    setSubmitted(false)
    setScore(0)
    setHistory([])
    setLastEarned(0)
    setStartedAt(Date.now())
  }

  if (!started) return <Intro onStart={startGame} />

  if (finished) {
    const max = QUESTIONS.length * 100
    const accuracy = Math.round((history.reduce((sum, item) => sum + item.base, 0) / (QUESTIONS.length * 80)) * 100)

    return (
      <main className="app finish">
        <header>
          <Brand />
          <div className="score-box"><span>{player}</span><strong>{score}</strong></div>
        </header>

        <Progress step={STEPS.length - 1} completed />

        <section className="hero-card finish-card">
          <div className="status-pill success">СПРАВУ ПРОЙДЕНО</div>
          <h1>Ваш результат у судовому маршруті</h1>
          <div className="final-score">{score}<small> / {max}</small></div>

          <div className="finish-metrics">
            <div><span>Юридична точність</span><strong>{accuracy}%</strong></div>
            <div><span>Ідеальні етапи</span><strong>{perfectCount}/{QUESTIONS.length}</strong></div>
          </div>

          <div className="winner-box">
            <span>ФІНАЛЬНА ВЕРСІЯ</span>
            <h2>Тут зʼявиться TOP‑3 залу</h2>
            <p>Переможців визначатимемо за сумою юридичної точності та бонусу за швидкість. Точність завжди матиме більшу вагу.</p>
          </div>

          <div className="history">
            {history.map((item, itemIndex) => (
              <div key={item.id}>
                <span>Етап {itemIndex + 1}</span>
                <strong>{item.earned}</strong>
              </div>
            ))}
          </div>

          <button className="primary" onClick={restart}>Пройти ще раз</button>
        </section>

        <footer><span>ПРМТУ · МОЛОДІЖНА РАДА</span><span>Прототип · v0.2</span></footer>
      </main>
    )
  }

  const canSubmit = q.type === 'calendar' || selected.length > 0
  const chosenDate = addDays(deliveredDate, calendarOffset)

  return (
    <main className="app">
      <header>
        <Brand />
        <div className="score-box"><span>{player}</span><strong>{score}</strong></div>
      </header>

      <Progress step={q.step} />

      <section className="hero-card">
        <div className="question-meta">
          <div className="eyebrow">{q.eyebrow}</div>
          <div className="question-number">{index + 1}/{QUESTIONS.length}</div>
        </div>
        <h1>{q.title}</h1>
        <p className="lead">{q.lead}</p>

        {q.type === 'calendar' ? (
          <div className="range-wrap">
            <div className="calendar-date">{formatDate(chosenDate)}</div>
            <div className="range-value"><strong>{calendarOffset}</strong><span>днів після вручення</span></div>
            <input
              type="range"
              min={q.min}
              max={q.max}
              value={calendarOffset}
              onChange={(event) => !submitted && setCalendarOffset(Number(event.target.value))}
            />
            <div className="range-labels"><span>{q.min}</span><span>місяць?</span><span>{q.max}</span></div>
          </div>
        ) : (
          <div className="options">
            {q.options.map(([label]) => (
              <button
                key={label}
                className={`option ${selected.includes(label) ? 'selected' : ''}`}
                onClick={() => toggle(label)}
              >
                <span className="check">{selected.includes(label) ? '✓' : ''}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {!submitted ? (
          <button className="primary" disabled={!canSubmit} onClick={submit}>
            Зафіксувати рішення
          </button>
        ) : (
          <div className="result">
            <div className="result-top">
              <div>
                <span>Результат етапу</span>
                <small>{history.at(-1)?.base ?? 0} точність + {history.at(-1)?.speed ?? 0} швидкість</small>
              </div>
              <strong>+{lastEarned}</strong>
            </div>
            <div className="law-pill">{q.law}</div>
            <p>{q.explain}</p>
            <button className="primary" onClick={next}>
              {index === QUESTIONS.length - 1 ? 'Завершити справу' : 'Далі у справі'}
            </button>
          </div>
        )}
      </section>

      <footer><span>ПРМТУ · МОЛОДІЖНА РАДА</span><span>Без даних учасників реальної справи</span></footer>
    </main>
  )
}

const params = new URLSearchParams(window.location.search)
const isRoom = params.get('screen') === 'room'

createRoot(document.getElementById('root')).render(isRoom ? <RoomScreen /> : <PlayerApp />)
