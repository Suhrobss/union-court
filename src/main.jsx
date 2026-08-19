import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const steps = [
  'Наказ',
  'Строк',
  'Судовий збір',
  'Представництво',
  'Позов',
  'Відзив',
  'Докази',
  'Рішення'
]

const questions = [
  {
    id: 'order',
    eyebrow: 'Етап 1 · Вас звільнено',
    title: 'Що перевіряємо в наказі передусім?',
    lead: 'Оберіть усі елементи, які мають юридичне значення для оцінки звільнення.',
    type: 'multi',
    options: [
      ['Підстава та норма КЗпП', true],
      ['Дата звільнення', true],
      ['Чи доведені фактичні підстави', true],
      ['Колір печатки', false],
      ['Чи була можливість переведення', true]
    ],
    explain: 'Наказ — це лише початок перевірки. Юрист зіставляє формальну підставу з фактичними обставинами, процедурою та доказами.',
  },
  {
    id: 'term',
    eyebrow: 'Етап 2 · Час пішов',
    title: 'Скільки часу на оскарження звільнення?',
    lead: 'Перетягніть маркер. У грі ми оцінюємо не лише відповідь, а й точність.',
    type: 'range',
    answer: 30,
    explain: 'Для спору про звільнення КЗпП встановлює місячний строк з дня вручення копії наказу про звільнення. У фінальній версії замінимо умовну шкалу на календар із реальною датою.',
  },
  {
    id: 'fee',
    eyebrow: 'Етап 3 · Подати позов',
    title: 'Скільки судового збору сплачуємо за вимогу про поновлення на роботі?',
    lead: 'Оберіть відповідь.',
    type: 'single',
    options: [
      ['0 грн', true],
      ['1 514 грн', false],
      ['1% від суми вимог', false],
      ['Залежить від зарплати', false]
    ],
    explain: 'Позивачі у справах про поновлення на роботі мають законодавчу пільгу щодо судового збору. У фінальній грі окремо покажемо межі цієї пільги.',
  },
  {
    id: 'representation',
    eyebrow: 'Етап 4 · Хто піде з вами?',
    title: 'Оберіть можливі моделі захисту в трудовому спорі',
    lead: 'Тут правильних відповідей декілька.',
    type: 'multi',
    options: [
      ['Особисто', true],
      ['Адвокат', true],
      ['Інший повнолітній представник у передбачених ЦПК випадках', true],
      ['Профспілковий юрист / представник', true],
      ['Лише адвокат — інших варіантів немає', false]
    ],
    explain: 'Трудовий спір не зводиться до моделі «або адвокат, або ніяк». У наступній версії тут буде окремий екран про підтвердження повноважень, у тому числі через Електронний суд.',
  }
]

function scoreMulti(question, selected) {
  const correct = question.options.filter(([, ok]) => ok).map(([label]) => label)
  const wrong = question.options.filter(([, ok]) => !ok).map(([label]) => label)
  const hit = correct.filter(x => selected.includes(x)).length
  const missWrong = wrong.filter(x => selected.includes(x)).length
  const accuracy = Math.max(0, hit / correct.length - missWrong * 0.25)
  return Math.round(85 * accuracy)
}

function App() {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState([])
  const [range, setRange] = useState(20)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [startedAt, setStartedAt] = useState(Date.now())
  const [history, setHistory] = useState([])

  const q = questions[index]
  const progress = ((index + (submitted ? 1 : 0)) / questions.length) * 100
  const stage = Math.min(index, steps.length - 1)

  const earned = useMemo(() => {
    if (!q) return 0
    let base = 0
    if (q.type === 'multi') base = scoreMulti(q, selected)
    if (q.type === 'single') {
      const answer = q.options.find(([label]) => label === selected[0])
      base = answer?.[1] ? 85 : 0
    }
    if (q.type === 'range') {
      const diff = Math.abs(range - q.answer)
      base = Math.max(0, 85 - diff * 5)
    }
    const seconds = (Date.now() - startedAt) / 1000
    const speed = Math.max(0, Math.round(15 - seconds / 3))
    return Math.min(100, base + speed)
  }, [q, selected, range, startedAt])

  const toggle = (label) => {
    if (submitted) return
    if (q.type === 'single') return setSelected([label])
    setSelected(v => v.includes(label) ? v.filter(x => x !== label) : [...v, label])
  }

  const submit = () => {
    if (submitted) return
    setSubmitted(true)
    setScore(s => s + earned)
    setHistory(h => [...h, earned])
  }

  const next = () => {
    setSubmitted(false)
    setSelected([])
    setRange(20)
    setStartedAt(Date.now())
    setIndex(i => Math.min(i + 1, questions.length))
  }

  if (index >= questions.length) {
    return (
      <main className="app finish">
        <div className="brand"><span>НАВЧАЛЬНА СИМУЛЯЦІЯ</span><strong>UNION COURT</strong></div>
        <section className="hero-card finish-card">
          <div className="status-pill success">СИМУЛЯЦІЮ ЗАВЕРШЕНО</div>
          <h1>Ваша справа пройшла перші процесуальні етапи.</h1>
          <div className="final-score">{score}<small> / {questions.length * 100}</small></div>
          <p>Це лише перший прототип. Далі сюди підключимо реальні анонімізовані документи, відзив, витребування доказів, рішення суду, апеляцію та касацію.</p>
          <div className="history">{history.map((n,i)=><div key={i}><span>Етап {i+1}</span><strong>{n}</strong></div>)}</div>
          <button className="primary" onClick={() => {setIndex(0);setScore(0);setHistory([]);setSubmitted(false);setStartedAt(Date.now())}}>Пройти ще раз</button>
        </section>
      </main>
    )
  }

  const canSubmit = q.type === 'range' || selected.length > 0

  return (
    <main className="app">
      <header>
        <div className="brand"><span>НАВЧАЛЬНА СИМУЛЯЦІЯ</span><strong>UNION COURT</strong></div>
        <div className="score-box"><span>Рейтинг захисту</span><strong>{score}</strong></div>
      </header>

      <div className="case-progress">
        <div className="progress-line"><span style={{width: `${progress}%`}} /></div>
        <div className="steps">{steps.slice(0,5).map((s,i)=><div key={s} className={i <= stage ? 'active' : ''}><i />{s}</div>)}</div>
      </div>

      <section className="hero-card">
        <div className="eyebrow">{q.eyebrow}</div>
        <h1>{q.title}</h1>
        <p className="lead">{q.lead}</p>

        {q.type === 'range' ? (
          <div className="range-wrap">
            <div className="range-value"><strong>{range}</strong><span>днів</span></div>
            <input type="range" min="10" max="50" value={range} onChange={e => !submitted && setRange(Number(e.target.value))} />
            <div className="range-labels"><span>10</span><span>30</span><span>50</span></div>
          </div>
        ) : (
          <div className="options">
            {q.options.map(([label]) => (
              <button key={label} className={`option ${selected.includes(label) ? 'selected' : ''}`} onClick={() => toggle(label)}>
                <span className="check">{selected.includes(label) ? '✓' : ''}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {!submitted ? (
          <button className="primary" disabled={!canSubmit} onClick={submit}>Зафіксувати рішення</button>
        ) : (
          <div className="result">
            <div className="result-top"><span>Результат етапу</span><strong>+{earned}</strong></div>
            <p>{q.explain}</p>
            <button className="primary" onClick={next}>{index === questions.length - 1 ? 'Завершити' : 'Далі у справі'}</button>
          </div>
        )}
      </section>

      <footer><span>СПРАВА 001</span><span>Прототип · без ідентифікуючих даних</span></footer>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
