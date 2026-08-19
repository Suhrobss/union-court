import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { DEFAULT_ROOM, createRoomChannel, flattenPresence, makePlayerId, supabase } from './realtime'

const STAGES = [
  { id: 'order', label: 'Наказ', title: 'Юридичний рентген наказу', dimension: 'law' },
  { id: 'timeline', label: 'Хронологія', title: 'Що було до звільнення?', dimension: 'strategy' },
  { id: 'term', label: 'Строк', title: 'Час уже пішов', dimension: 'time' },
  { id: 'viber', label: 'Viber', title: 'Криміналістика повідомлення', dimension: 'evidence' },
  { id: 'vacancies', label: 'Вакансії', title: 'Список є. Але що він доводить?', dimension: 'evidence' },
  { id: 'defense', label: 'Захист', title: 'Побудуйте свою модель захисту', dimension: 'strategy' },
  { id: 'claim', label: 'Позов', title: 'Зберіть позовні вимоги', dimension: 'law' },
  { id: 'proof', label: 'Доказ', title: 'Доказ ≠ висновок', dimension: 'evidence' },
  { id: 'vault', label: 'Витребування', title: 'Доказ замкнений у роботодавця', dimension: 'process' },
  { id: 'union', label: 'Профспілка', title: 'Відкрийте другий шар справи', dimension: 'strategy' },
  { id: 'inbox', label: 'Процес', title: 'Процесуальна пошта', dimension: 'process' },
  { id: 'volume', label: 'Том 1', title: 'Один наказ. Один том.', dimension: null },
]

const DIMENSIONS = {
  law: 'Право',
  evidence: 'Докази',
  process: 'Процес',
  strategy: 'Стратегія',
  time: 'Час',
}

const deliveredDate = new Date(2026, 0, 15)
const correctDeadlineDate = new Date(2026, 1, 15)
const correctDeadlineOffset = Math.round((correctDeadlineDate - deliveredDate) / 86400000)

const ORDER_HOTSPOTS = [
  { key: 'basis', label: 'Правова підстава', good: true, note: 'Так. Перевіряємо не просто номер статті, а чи доведені всі фактичні умови саме цієї підстави.' },
  { key: 'date', label: 'Дата звільнення', good: true, note: 'Так. Дата має значення для хронології, розрахунку та подальших процесуальних строків.' },
  { key: 'facts', label: 'Фактичне обґрунтування', good: true, note: 'Так. Посилання на норму саме по собі не доводить, що передбачені нею обставини реально існували.' },
  { key: 'vacancy', label: 'Переведення / вакансії', good: true, note: 'Так. Для цієї моделі спору важливо окремо перевірити питання можливості переведення на іншу роботу.' },
  { key: 'authority', label: 'Хто підписав наказ', good: true, note: 'Так. Повноваження особи, яка видала кадровий акт, теж входять до юридичної перевірки.' },
  { key: 'stamp', label: 'Колір печатки', good: false, note: 'Ні. Це може привертати увагу візуально, але не є нашим пріоритетом для первинної правової оцінки.' },
  { key: 'font', label: 'Шрифт документа', good: false, note: 'Ні. Не витрачаємо час на те, що не формує юридичну позицію.' },
]

const TIMELINE_ITEMS = [
  { id: 'idle', label: 'Простій', hint: 'Робота фактично не виконується, але трудові відносини не припинені.' },
  { id: 'suspension', label: 'Призупинення дії трудового договору', hint: 'Окремий правовий режим, який не дорівнює звільненню.' },
  { id: 'dismissal', label: 'Звільнення', hint: 'Остаточне припинення трудового договору за обраною роботодавцем підставою.' },
]

const VIBER_CHECKS = [
  ['procedure', 'Чи існував погоджений / встановлений порядок електронного обміну?', true],
  ['recipient', 'Чи можна підтвердити, кому саме і на який канал надіслали документи?', true],
  ['content', 'Що саме було вкладено в повідомлення?', true],
  ['delivery', 'Коли надіслано та які є ознаки доставки / перегляду?', true],
  ['theme', 'Якого кольору була тема Viber?', false],
]

const VACANCY_CHECKS = [
  ['actual', 'Чи була вакансія реально вільною у релевантний момент?', true],
  ['ability', 'Чи міг працівник виконувати цю роботу з урахуванням освіти, кваліфікації та інших вимог?', true],
  ['offer', 'Чи була вакансія реально доведена до працівника як пропозиція?', true],
  ['timing', 'Чи не зникла / не з’явилась вакансія в інший момент?', true],
  ['count', 'Чи достатньо того, що список просто дуже довгий?', false],
]

const DEFENSE_ROUTES = [
  { id: 'self', icon: '◎', title: 'Особисто', subtitle: 'Самопредставництво', text: 'Ви самі ведете свою справу: подаєте документи, даєте пояснення, працюєте з доказами.' },
  { id: 'lawyer', icon: '§', title: 'Адвокат', subtitle: 'Професійна правнича допомога', text: 'Професійне представництво. Умови та оплата визначаються домовленістю.' },
  { id: 'rep', icon: '⚖', title: 'Інший представник', subtitle: 'Допустимо у трудовому спорі', text: 'У трудових спорах ЦПК допускає іншу повнолітню процесуально дієздатну особу за встановлених законом умов.' },
  { id: 'unionlaw', icon: '◆', title: 'Профспілковий юрист', subtitle: 'Правозахисний ресурс профспілки', text: 'Може представляти працівника, якщо відповідає вимогам процесуального закону та має належно оформлені повноваження.' },
]

const CLAIM_CARDS = [
  ['cancel', 'Визнати незаконним та скасувати наказ про звільнення', true],
  ['reinstate', 'Поновити на роботі', true],
  ['average', 'Стягнути середній заробіток за час вимушеного прогулу', true],
  ['apology', 'Зобов’язати роботодавця публічно вибачитися', false],
  ['fine', 'Стягнути «штраф за несправедливість» без правової підстави', false],
]

const PROOF_TAGS = [
  ['damage', 'Підтверджує факт пошкодження об’єкта', true],
  ['specific_job', 'Автоматично доводить неможливість забезпечити роботою саме цього працівника', false],
  ['vacancies', 'Автоматично доводить відсутність будь-яких вакансій', false],
  ['dismissal', 'Сам по собі робить звільнення законним', false],
]

const VAULT_TOOLS = [
  ['request', 'Клопотання про витребування доказів', true, 'Просимо суд витребувати документи, які самостійно отримати не можемо.'],
  ['assume', 'Попросити суд просто повірити', false, 'Твердження без належного доказування не замінює доказ.'],
  ['giveup', 'Відмовитися від аргументу', false, 'Якщо доказ важливий, спершу використовуємо доступні процесуальні механізми.'],
  ['cassation', 'Одразу подати касаційну скаргу', false, 'Касація не є інструментом отримання доказу на цьому етапі.'],
]

const INBOX_DOCS = [
  ['reply', 'Відповідь на відзив', true],
  ['objection', 'Заперечення за ст. 180 ЦПК', false],
  ['appeal', 'Апеляційна скарга', false],
  ['new_claim', 'Новий позов', false],
]

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatDate(date) {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function useStablePlayerId() {
  const ref = useRef(null)
  if (!ref.current) {
    const stored = sessionStorage.getItem('union-court-player-id')
    ref.current = stored || makePlayerId()
    sessionStorage.setItem('union-court-player-id', ref.current)
  }
  return ref.current
}

function speedBonus(startedAt, base) {
  if (base <= 0) return 0
  const sec = Math.max(0, (Date.now() - startedAt) / 1000)
  return Math.max(0, Math.min(20, Math.round(20 - sec / 3.2)))
}

function multiScore(selected, items) {
  const correct = items.filter((x) => x[2]).map((x) => x[0])
  const wrong = items.filter((x) => !x[2]).map((x) => x[0])
  const hits = correct.filter((id) => selected.includes(id)).length
  const misses = wrong.filter((id) => selected.includes(id)).length
  return Math.max(0, Math.round(80 * Math.max(0, hits / correct.length - misses * 0.2)))
}

function evaluateStage(stageId, answer) {
  switch (stageId) {
    case 'order': {
      const selected = answer.selected || []
      const correct = ORDER_HOTSPOTS.filter((x) => x.good).map((x) => x.key)
      const wrong = ORDER_HOTSPOTS.filter((x) => !x.good).map((x) => x.key)
      const hit = correct.filter((id) => selected.includes(id)).length
      const miss = wrong.filter((id) => selected.includes(id)).length
      return Math.max(0, Math.round(80 * Math.max(0, hit / correct.length - miss * 0.2)))
    }
    case 'timeline': {
      const seq = answer.sequence || []
      const wanted = ['idle', 'suspension', 'dismissal']
      if (seq.join('|') === wanted.join('|')) return 80
      return seq.filter((x, i) => x === wanted[i]).length * 20
    }
    case 'term': {
      const diff = Math.abs((answer.offset ?? 25) - correctDeadlineOffset)
      if (diff === 0) return 80
      if (diff === 1) return 62
      if (diff === 2) return 44
      if (diff === 3) return 24
      return 0
    }
    case 'viber': return multiScore(answer.selected || [], VIBER_CHECKS)
    case 'vacancies': return multiScore(answer.selected || [], VACANCY_CHECKS)
    case 'defense': return answer.route ? 80 : 0
    case 'claim': return multiScore(answer.selected || [], CLAIM_CARDS)
    case 'proof': return multiScore(answer.selected || [], PROOF_TAGS)
    case 'vault': return VAULT_TOOLS.find((x) => x[0] === answer.tool)?.[2] ? 80 : 0
    case 'union': return answer.status === 'elected' ? 80 : answer.status === 'member' ? 55 : answer.status === 'none' ? 45 : 0
    case 'inbox': return INBOX_DOCS.find((x) => x[0] === answer.doc)?.[2] ? 80 : 0
    default: return 0
  }
}

function isReady(stageId, answer) {
  if (stageId === 'order') return (answer.selected || []).length >= 5
  if (stageId === 'timeline') return (answer.sequence || []).length === 3
  if (stageId === 'term') return true
  if (['viber', 'vacancies', 'claim', 'proof'].includes(stageId)) return (answer.selected || []).length > 0
  if (stageId === 'defense') return Boolean(answer.route)
  if (stageId === 'vault') return Boolean(answer.tool)
  if (stageId === 'union') return Boolean(answer.status)
  if (stageId === 'inbox') return Boolean(answer.doc)
  return true
}

function stageExplanation(stageId) {
  const map = {
    order: ['Первинний юридичний аналіз', 'Наказ — це не «вирок». Його треба розкласти на підставу, факти, процедуру, дату, можливість переведення та повноваження.'],
    timeline: ['Трудова хронологія', 'Простій, призупинення дії трудового договору та звільнення — різні юридичні стани. У спорі важливо бачити не один фінальний наказ, а всю послідовність.'],
    term: ['ст. 233 КЗпП України', 'Для спору про звільнення закон встановлює місячний строк із дня вручення копії наказу про звільнення. «Місяць» не завжди дорівнює 30 календарним дням.'],
    viber: ['Електронна комунікація', 'Дві галочки в месенджері самі по собі не відповідають на всі юридичні питання. Перевіряємо порядок обміну, адресата, зміст, момент направлення та підтвердження доставки.'],
    vacancies: ['Переведення та інша робота', 'Довгий список вакансій ще не закриває питання. Важливі реальність вакансії, момент її існування, відповідність працівнику та факт реального пропонування.'],
    defense: ['ст. 58, 60–62 ЦПК України', 'У трудовому спорі працівник може діяти особисто або через належного представника. Не кожен маршрут вимагає адвоката.'],
    claim: ['Спосіб судового захисту', 'Позов має не просто описувати несправедливість, а формулювати конкретні вимоги. Для поновлення на роботі закон також передбачає пільгу зі сплати судового збору.'],
    proof: ['Доказ ≠ готовий висновок', 'Сильний візуальний доказ може підтверджувати конкретний факт, але не повинен автоматично підміняти доказування інших обов’язкових обставин.'],
    vault: ['ст. 84 ЦПК України', 'Якщо важливий доказ є у роботодавця і самостійно отримати його неможливо, учасник справи може просити суд витребувати доказ.'],
    union: ['Профспілковий захист', 'Членство у профспілці та перебування у виборному профспілковому органі — не тотожні статуси. Для обраних до профспілкових органів діють додаткові гарантії, а профспілка може підсилювати справу доказовими й процесуальними діями.'],
    inbox: ['ст. 179–180 ЦПК України', 'На відзив відповідача позивач подає відповідь на відзив. «Заперечення» за ст. 180 ЦПК — наступна заява відповідача щодо відповіді на відзив.'],
  }
  return map[stageId] || ['', '']
}

function Brand() {
  return (
    <div className="brand-lockup">
      <div className="logo-slot"><span>МР</span><small>ПРМТУ</small></div>
      <div className="brand-copy"><span>МОЛОДІЖНА РАДА ПРМТУ</span><strong>СУДОВИЙ МАРШРУТ</strong></div>
    </div>
  )
}

function Progress({ index, finished }) {
  const max = STAGES.length - 1
  const progress = finished ? 100 : Math.min(100, Math.round((index / max) * 100))
  return (
    <div className="case-progress">
      <div className="progress-caption"><span>МАРШРУТ СПРАВИ</span><b>{progress}%</b></div>
      <div className="progress-line"><span style={{ width: `${progress}%` }} /></div>
      <div className="steps-scroll">
        {STAGES.map((s, i) => <div key={s.id} className={`step-chip ${i <= index ? 'active' : ''} ${i === index ? 'current' : ''}`}><i>{i + 1}</i><span>{s.label}</span></div>)}
      </div>
    </div>
  )
}

function ToggleList({ items, selected, onToggle, compact = false }) {
  return <div className={`check-list ${compact ? 'compact' : ''}`}>{items.map(([id, label]) => <button key={id} className={selected.includes(id) ? 'check-card selected' : 'check-card'} onClick={() => onToggle(id)}><span>{selected.includes(id) ? '✓' : ''}</span><b>{label}</b></button>)}</div>
}

function OrderStage({ answer, setAnswer }) {
  const selected = answer.selected || []
  const [note, setNote] = useState('Натискайте на виділені фрагменти наказу. Система одразу пояснюватиме, чи варто забирати цей елемент у майбутню справу.')
  const toggle = (key) => {
    const spot = ORDER_HOTSPOTS.find((x) => x.key === key)
    setNote(spot.note)
    setAnswer((a) => ({ ...a, selected: selected.includes(key) ? selected.filter((x) => x !== key) : [...selected, key] }))
  }
  const mark = (key, children) => <button className={selected.includes(key) ? 'doc-hot marked' : 'doc-hot'} onClick={() => toggle(key)}>{children}</button>
  return <div className="order-stage">
    <div className="paper-document">
      <div className="paper-brand">ДЕРЖАВНЕ ПІДПРИЄМСТВО «ТРАНСПОРТНА ІНФРАСТРУКТУРА УКРАЇНИ»<small>Південна філія · реконструкція навчального документа</small></div>
      <div className="paper-title">НАКАЗ</div>
      <div className="paper-meta"><span>{mark('date', '29.12.2022')}</span><span>м. Одеса</span><span>№ 58-К</span></div>
      <h3>Про припинення трудового договору</h3>
      <p>Звільнити 29 грудня 2022 року <b>Коваленко Ірину Сергіївну</b>, провідного бухгалтера-ревізора, {mark('basis', 'за п. 6 ч. 1 ст. 41 Кодексу законів про працю України')}.</p>
      <p>{mark('facts', 'У зв’язку з неможливістю забезпечення працівника роботою, визначеною трудовим договором, внаслідок відсутності виробничих, організаційних і технічних умов та майна роботодавця через бойові дії')}.</p>
      <p>Підстава: повідомлення про заплановане вивільнення; {mark('vacancy', 'перелік вакантних посад і пропозиція переведення')}; кадрові документи.</p>
      <div className="paper-sign"><span>{mark('authority', 'Начальник філії')}</span><span>________________ / О. Романенко</span></div>
      <div className="stamp-ghost">{mark('stamp', 'ПЕЧАТКА')}</div>
      <div className="font-trap" onClick={() => toggle('font')}>Times New Roman, 14</div>
    </div>
    <aside className="inspection-panel"><span>ЮРИДИЧНИЙ РЕНТГЕН</span><strong>{selected.filter((x) => ORDER_HOTSPOTS.find((h) => h.key === x)?.good).length}/5</strong><p>{note}</p><small>Завдання: знайдіть щонайменше 5 пріоритетних точок для майбутнього оскарження.</small></aside>
  </div>
}

function TimelineStage({ answer, setAnswer }) {
  const sequence = answer.sequence || []
  const add = (id) => {
    if (sequence.includes(id)) return
    setAnswer({ sequence: [...sequence, id] })
  }
  return <div className="timeline-stage"><div className="timeline-slots">{[0,1,2].map((i) => <div key={i} className="timeline-slot"><span>{i + 1}</span>{sequence[i] ? <b>{TIMELINE_ITEMS.find((x) => x.id === sequence[i]).label}</b> : <em>оберіть подію</em>}</div>)}</div><div className="timeline-pool">{TIMELINE_ITEMS.map((item) => <button key={item.id} disabled={sequence.includes(item.id)} onClick={() => add(item.id)}><strong>{item.label}</strong><small>{item.hint}</small></button>)}</div><button className="text-action" onClick={() => setAnswer({ sequence: [] })}>Очистити хронологію</button></div>
}

function TermStage({ answer, setAnswer }) {
  const offset = answer.offset ?? 25
  return <div className="term-stage"><div className="calendar-sheet"><span>КОПІЮ НАКАЗУ ВРУЧЕНО</span><b>15 січня 2026</b></div><div className="calendar-date">{formatDate(addDays(deliveredDate, offset))}</div><div className="range-value"><strong>{offset}</strong><span>днів після вручення</span></div><input type="range" min="10" max="50" value={offset} onChange={(e) => setAnswer({ offset: Number(e.target.value) })}/><div className="range-labels"><span>10</span><span>де спливає місяць?</span><span>50</span></div></div>
}

function ViberStage({ answer, setAnswer }) {
  const selected = answer.selected || []
  const toggle = (id) => setAnswer({ selected: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] })
  return <div className="forensics-layout"><div className="phone-mock"><div className="phone-bar">16:17 <span>● ● ●</span></div><div className="chat-head"><div className="avatar">К</div><div><b>Кадрова служба</b><small>офіційний робочий контакт</small></div></div><div className="chat-date">19 грудня 2022</div><div className="bubble"><p>Направляємо повідомлення про заплановане вивільнення, наказ і перелік вакантних посад.</p><div className="attachments"><span>📄 Повідомлення.pdf</span><span>📄 Наказ.pdf</span><span>📄 Вакансії.pdf</span></div><small>18:18 ✓✓</small></div></div><div><div className="mini-heading">ЩО ПЕРЕВІРЯЄМО?</div><ToggleList items={VIBER_CHECKS} selected={selected} onToggle={toggle} compact /></div></div>
}

function VacanciesStage({ answer, setAnswer }) {
  const selected = answer.selected || []
  const toggle = (id) => setAnswer({ selected: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] })
  return <div className="vacancy-layout"><div className="vacancy-stack"><div className="vacancy-sheet back two">ВАКАНСІЇ · стор. 4</div><div className="vacancy-sheet back">ВАКАНСІЇ · стор. 2</div><div className="vacancy-sheet"><span>ПЕРЕЛІК ВАКАНТНИХ ПОСАД</span><b>97 позицій</b><p>Бухгалтер · економіст · оператор · інженер · електромонтер · прибиральник · диспетчер · ...</p><em>Великий список виглядає переконливо. Але це ще не кінець перевірки.</em></div></div><div><div className="mini-heading">ЩО ТРЕБА ПЕРЕВІРИТИ?</div><ToggleList items={VACANCY_CHECKS} selected={selected} onToggle={toggle} compact /></div></div>
}

function DefenseStage({ answer, setAnswer }) {
  const route = answer.route
  return <div className="defense-builder"><div className="defense-center"><div className="person-node">ВИ</div><div className="court-node">СУД</div><div className="connection-line" /></div><div className="route-board">{DEFENSE_ROUTES.map((r) => <button key={r.id} className={route === r.id ? 'route-card selected' : 'route-card'} onClick={() => setAnswer({ route: r.id })}><i>{r.icon}</i><div><strong>{r.title}</strong><span>{r.subtitle}</span><p>{r.text}</p></div></button>)}</div>{route && <div className="authority-card"><span>НАСТУПНИЙ КРОК</span><b>{route === 'self' ? 'Ви дієте особисто — окрема довіреність представнику не потрібна.' : 'Перевірте, чим підтверджені повноваження представника.'}</b>{route !== 'self' && <p>Окремо покажемо можливість електронного уповноваження через підсистему «Електронний суд» там, де цей механізм застосовний.</p>}</div>}</div>
}

function ClaimStage({ answer, setAnswer }) {
  const selected = answer.selected || []
  const toggle = (id) => setAnswer({ selected: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] })
  return <div className="claim-builder"><div className="claim-paper"><div className="claim-head">ПОЗОВНА ЗАЯВА<small>фрагмент конструктора вимог</small></div><div className="claim-drop">{selected.length ? selected.map((id, i) => <div key={id}><span>{i + 1}.</span>{CLAIM_CARDS.find((x) => x[0] === id)?.[1]}</div>) : <em>Додайте вимоги до позову</em>}</div><div className="fee-seal">СУДОВИЙ ЗБІР<br/><b>0 грн*</b><small>*за вимогу про поновлення на роботі</small></div></div><ToggleList items={CLAIM_CARDS} selected={selected} onToggle={toggle}/></div>
}

function ProofStage({ answer, setAnswer }) {
  const selected = answer.selected || []
  const toggle = (id) => setAnswer({ selected: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] })
  return <div className="proof-layout"><div className="evidence-photo"><div className="photo-sky"/><div className="photo-building"><i/><i/><i/></div><div className="photo-rubble"/><span>ДОКАЗ № 17 · реконструкція фото пошкодженого об’єкта</span></div><div><div className="warning-card"><b>Найважливіше питання:</b><p>Не «сильне це фото чи ні?», а <strong>який саме юридично значущий факт воно доводить?</strong></p></div><ToggleList items={PROOF_TAGS} selected={selected} onToggle={toggle} compact /></div></div>
}

function VaultStage({ answer, setAnswer }) {
  return <div className="vault-layout"><div className="vault"><div className="vault-title">ДОКАЗИ У РОБОТОДАВЦЯ</div>{['Штатний розпис','Вакантні посади','Документи про можливість переведення','Документи щодо виробничих умов'].map((x) => <div key={x} className="locked-file"><span>🔒</span><b>{x}</b></div>)}</div><div className="toolbelt"><div className="mini-heading">ОБЕРІТЬ ПРОЦЕСУАЛЬНИЙ ІНСТРУМЕНТ</div>{VAULT_TOOLS.map(([id,label,,text]) => <button key={id} className={answer.tool === id ? 'tool selected' : 'tool'} onClick={() => setAnswer({ tool: id })}><span>{id === 'request' ? '⚖' : '·'}</span><div><b>{label}</b><small>{text}</small></div></button>)}</div></div>
}

function UnionStage({ answer, setAnswer }) {
  const status = answer.status
  return <div className="union-stage"><div className="union-reveal"><div className="union-badge">ПРМТУ</div><div><span>ВІДКРИТО ДРУГИЙ ШАР СПРАВИ</span><h3>Профспілковий захист</h3><p>Запити · зовнішня інформація · процесуальні пояснення · витребування доказів · додаткові гарантії у визначених законом випадках.</p></div></div><div className="status-question"><b>Який ваш статус?</b><p>Це не формальність: звичайне членство і перебування у виборному профспілковому органі мають різне юридичне значення.</p><div className="status-options"><button className={status==='none'?'selected':''} onClick={() => setAnswer({status:'none'})}>Не член профспілки</button><button className={status==='member'?'selected':''} onClick={() => setAnswer({status:'member'})}>Член профспілки</button><button className={status==='elected'?'selected special':''} onClick={() => setAnswer({status:'elected'})}>Член виборного профспілкового органу</button></div></div>{status && <div className="status-result">{status === 'elected' ? <><strong>🛡 Додаткова гарантія</strong><p>Для працівників, обраних до профспілкових органів, закон передбачає додаткові гарантії; під час воєнного стану це має окреме значення.</p></> : status === 'member' ? <><strong>Профспілковий ресурс доступний</strong><p>Членство саме по собі не тотожне статусу члена виборного органу, але профспілка може надавати правову та організаційну підтримку.</p></> : <><strong>Ви все одно маєте процесуальні права</strong><p>Відсутність членства не позбавляє права на судовий захист і представництво у передбачених законом формах.</p></>}</div>}</div>
}

function InboxStage({ answer, setAnswer }) {
  return <div className="inbox-layout"><div className="inbox-panel"><div className="mail-head"><span>ВХІДНІ ДОКУМЕНТИ</span><b>1 новий</b></div><div className="mail-card"><div className="mail-icon">📄</div><div><small>Відповідач · щойно</small><strong>ВІДЗИВ НА ПОЗОВНУ ЗАЯВУ</strong><p>«Просимо відмовити у задоволенні позову…»</p></div></div><div className="process-chain"><span className="done">Позов</span><i>→</i><span className="done">Відзив</span><i>→</i><span className={answer.doc ? 'done' : ''}>?</span></div></div><div><div className="mini-heading">СТВОРИТИ ПРОЦЕСУАЛЬНИЙ ДОКУМЕНТ</div>{INBOX_DOCS.map(([id,label]) => <button key={id} className={answer.doc===id?'document-action selected':'document-action'} onClick={() => setAnswer({doc:id})}><span>＋</span><b>{label}</b></button>)}</div></div>
}

function VolumeStage() {
  return <div className="volume-stage"><div className="single-order"><span>1</span><small>наказ</small></div><div className="volume-arrow">→</div><div className="volume-book"><div className="book-pages"/><div className="book-cover"><span>МАТЕРІАЛИ СПРАВИ</span><strong>ТОМ 1</strong><b>265</b><small>сторінок</small></div></div><div className="volume-message"><h2>А почалося все з одного аркуша.</h2><p>Наказ → документи → листування → вакансії → докази → профспілкова робота → процесуальні заяви. Саме так «мене незаконно звільнили» перетворюється на судову справу.</p></div></div>
}

function StageContent({ stage, answer, setAnswer }) {
  switch (stage.id) {
    case 'order': return <OrderStage answer={answer} setAnswer={setAnswer}/>
    case 'timeline': return <TimelineStage answer={answer} setAnswer={setAnswer}/>
    case 'term': return <TermStage answer={answer} setAnswer={setAnswer}/>
    case 'viber': return <ViberStage answer={answer} setAnswer={setAnswer}/>
    case 'vacancies': return <VacanciesStage answer={answer} setAnswer={setAnswer}/>
    case 'defense': return <DefenseStage answer={answer} setAnswer={setAnswer}/>
    case 'claim': return <ClaimStage answer={answer} setAnswer={setAnswer}/>
    case 'proof': return <ProofStage answer={answer} setAnswer={setAnswer}/>
    case 'vault': return <VaultStage answer={answer} setAnswer={setAnswer}/>
    case 'union': return <UnionStage answer={answer} setAnswer={setAnswer}/>
    case 'inbox': return <InboxStage answer={answer} setAnswer={setAnswer}/>
    case 'volume': return <VolumeStage/>
    default: return null
  }
}

function Intro({ onStart, defaultRoom }) {
  const [name, setName] = useState('')
  const [room, setRoom] = useState(defaultRoom)
  return <main className="app intro-app"><header><Brand/><div className="status-pill"><i/> LIVE READY</div></header><section className="intro-card dossier"><div className="folder-tab">СПРАВА ПРО НЕЗАКОННЕ ЗВІЛЬНЕННЯ</div><div className="justice-mark">§</div><div className="eyebrow">ІНТЕРАКТИВНА ПРАВОЗАХИСНА СИМУЛЯЦІЯ</div><h1>Вас звільнено.</h1><p className="intro-copy">Ви отримаєте документи, докази й процесуальні ситуації з реальної логіки трудового спору. Завдання — не вгадувати статті, а провести справу.</p><div className="rules-grid"><div><strong>80%</strong><span>юридична точність</span></div><div><strong>20%</strong><span>бонус за швидкість</span></div><div><strong>TOP 3</strong><span>переможці у фіналі</span></div></div><div className="join-grid"><label className="name-field"><span>Імʼя або нік</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Наприклад: Марія" maxLength={26}/></label><label className="name-field"><span>Код сесії</span><input value={room} onChange={(e) => setRoom(e.target.value.toUpperCase())} maxLength={12}/></label></div><button className="primary" onClick={() => onStart(name.trim() || 'Учасник', room.trim() || DEFAULT_ROOM)}>Увійти у справу <span>→</span></button><p className="privacy-note">Без реєстрації. На загальний екран передається лише імʼя/нік, ігровий ID, поточний етап і результат.</p></section></main>
}

function RoomScreen({ roomCode }) {
  const [players, setPlayers] = useState([])
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    const channel = createRoomChannel(roomCode, `screen_${makePlayerId()}`)
    channel.on('presence', { event: 'sync' }, () => setPlayers(flattenPresence(channel.presenceState())))
    channel.subscribe((status) => setConnected(status === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(channel) }
  }, [roomCode])
  const activeIndex = players.length ? Math.round(players.reduce((s,p) => s + (p.stageIndex || 0), 0) / players.length) : 0
  const top = [...players].sort((a,b) => (b.score||0)-(a.score||0) || (b.accuracy||0)-(a.accuracy||0)).slice(0,3)
  const avgAccuracy = players.length ? Math.round(players.reduce((s,p) => s + (p.accuracy||0), 0) / players.length) : 0
  const stageCounts = STAGES.map((s,i) => players.filter((p) => (p.stageIndex||0) === i).length)
  return <main className="room-app"><header><Brand/><div className={`room-live ${connected?'on':''}`}><i/> {connected?'LIVE · REALTIME':'ПІДКЛЮЧЕННЯ…'} · {roomCode}</div></header><section className="room-hero"><div><div className="eyebrow">СПРАВА ЗАЛУ · НЕЗАКОННЕ ЗВІЛЬНЕННЯ</div><h1>{STAGES[activeIndex]?.title || 'Очікуємо учасників'}</h1><p>Телефони — персональні справи учасників. Цей екран показує колективний рух залу через судовий процес.</p></div><div className="room-count"><span>У СПРАВІ</span><strong>{players.length}</strong><small>учасників онлайн</small></div></section><div className="room-route">{STAGES.map((s,i) => <div key={s.id} className={stageCounts[i] ? 'has' : ''}><span>{i+1}</span><b>{s.label}</b><em>{stageCounts[i]}</em></div>)}</div><section className="room-grid"><div className="room-panel"><div className="panel-title">ЖИВИЙ РУХ СПРАВИ <span>{avgAccuracy}% середня точність</span></div><div className="player-cloud">{players.slice(0,18).map((p) => <div key={p.playerId} className="player-chip"><i>{(p.displayName||'?').slice(0,1).toUpperCase()}</i><div><b>{p.displayName}</b><small>{STAGES[p.stageIndex]?.label || 'Старт'} · {p.score||0}</small></div></div>)}{!players.length && <div className="empty-room">Відкрийте гру на телефоні, введіть код <b>{roomCode}</b> — учасник зʼявиться тут у реальному часі.</div>}</div></div><div className="leader-panel"><div className="panel-title">TOP 3 <span>поточний рейтинг</span></div>{[0,1,2].map((i) => <div className={`leader place-${i+1}`} key={i}><span>{i+1}</span>{top[i] ? <><div><b>{top[i].displayName}</b><small>{top[i].accuracy||0}% юридична точність</small></div><strong>{top[i].score||0}</strong></> : <em>—</em>}</div>)}</div></section><footer><span>МОЛОДІЖНА РАДА ПРМТУ</span><span>LIVE SESSION · {roomCode}</span></footer></main>
}

function PlayerApp({ initialRoom }) {
  const playerId = useStablePlayerId()
  const [started, setStarted] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [roomCode, setRoomCode] = useState(initialRoom)
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [history, setHistory] = useState([])
  const [startedAt, setStartedAt] = useState(Date.now())
  const [lastEarned, setLastEarned] = useState(0)
  const channelRef = useRef(null)
  const finished = index >= STAGES.length
  const stage = STAGES[index]

  const accuracy = useMemo(() => {
    const scored = history.filter((h) => h.base != null)
    if (!scored.length) return 0
    return Math.round(scored.reduce((s,h) => s + h.base, 0) / (scored.length * 80) * 100)
  }, [history])

  const profile = useMemo(() => {
    const sums = {}; const counts = {}
    history.forEach((h) => { if (!h.dimension) return; sums[h.dimension] = (sums[h.dimension]||0) + h.base; counts[h.dimension] = (counts[h.dimension]||0) + 1 })
    return Object.fromEntries(Object.keys(DIMENSIONS).map((k) => [k, counts[k] ? Math.round((sums[k]/(counts[k]*80))*100) : 0]))
  }, [history])

  useEffect(() => {
    if (!started) return
    const channel = createRoomChannel(roomCode, playerId)
    channelRef.current = channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ kind:'player', playerId, displayName, roomCode, score, stageIndex:index, stageId:stage?.id || 'finish', accuracy, profile, finished, answered:history.length, elapsedMs:Date.now()-startedAt })
      }
    })
    return () => { supabase.removeChannel(channel); channelRef.current = null }
  }, [started, roomCode, playerId])

  useEffect(() => {
    if (!started || !channelRef.current) return
    channelRef.current.track({ kind:'player', playerId, displayName, roomCode, score, stageIndex:index, stageId:stage?.id || 'finish', accuracy, profile, finished, answered:history.length, elapsedMs:Date.now()-startedAt })
  }, [started, displayName, roomCode, score, index, stage?.id, accuracy, profile, finished, history.length, playerId])

  const start = (name, room) => { setDisplayName(name); setRoomCode(room.toUpperCase()); setStarted(true); setStartedAt(Date.now()) }
  const submit = () => {
    if (submitted || !stage || stage.id === 'volume') return
    const base = evaluateStage(stage.id, answer)
    const speed = speedBonus(startedAt, base)
    const earned = Math.min(100, base + speed)
    setScore((s) => s + earned); setLastEarned(earned); setSubmitted(true)
    setHistory((h) => [...h, { stageId:stage.id, base, speed, earned, dimension:stage.dimension }])
  }
  const next = () => { setIndex((i) => i + 1); setAnswer({}); setSubmitted(false); setLastEarned(0); setStartedAt(Date.now()) }

  if (!started) return <Intro onStart={start} defaultRoom={roomCode}/>
  if (finished) return <main className="app finish"><header><Brand/><div className="score-box"><span>{displayName}</span><strong>{score}</strong></div></header><Progress index={STAGES.length-1} finished/><section className="finish-card dossier"><div className="verdict-stamp">СПРАВУ<br/>ПРОЙДЕНО</div><div className="eyebrow">ФІНАЛ ПЕРШОГО АКТУ</div><h1>Ваш профіль ведення справи</h1><div className="final-score">{score}<small> балів</small></div><div className="profile-grid">{Object.entries(DIMENSIONS).map(([key,label]) => <div key={key}><span>{label}</span><strong>{profile[key]||0}%</strong><i><b style={{width:`${profile[key]||0}%`}}/></i></div>)}</div><div className="final-note"><strong>Зараз великий екран визначає TOP‑3.</strong><p>Фінальний рейтинг: юридична точність має основну вагу, швидкість — лише бонус.</p></div></section></main>

  if (stage.id === 'volume') return <main className="app"><header><Brand/><div className="score-box"><span>{displayName}</span><strong>{score}</strong></div></header><Progress index={index}/><section className="hero-card dossier"><div className="folder-tab">ФІНАЛ ТОМУ</div><VolumeStage/><button className="primary" onClick={next}>Завершити перший акт <span>→</span></button></section></main>

  const [law, explain] = stageExplanation(stage.id)
  return <main className="app"><header><Brand/><div className="score-box"><span>{displayName}</span><strong>{score}</strong></div></header><Progress index={index}/><section className="hero-card dossier"><div className="folder-tab">{`ЕТАП ${index+1} · ${stage.label.toUpperCase()}`}</div><div className="question-meta"><div className="eyebrow">{stage.title}</div><div className="question-number">{index+1}/{STAGES.length}</div></div><h1>{stage.title}</h1><StageContent stage={stage} answer={answer} setAnswer={setAnswer}/>{!submitted ? <button className="primary" disabled={!isReady(stage.id, answer)} onClick={submit}>Зафіксувати рішення <span>→</span></button> : <div className="result"><div className="result-top"><div><span>РЕЗУЛЬТАТ ЕТАПУ</span><small>{history.at(-1)?.base || 0} точність + {history.at(-1)?.speed || 0} швидкість</small></div><strong>+{lastEarned}</strong></div><div className="law-pill">{law}</div><p>{explain}</p><button className="primary" onClick={next}>Далі у справі <span>→</span></button></div>}</section><footer><span>ПРМТУ · МОЛОДІЖНА РАДА</span><span>Сесія {roomCode} · без даних реальних учасників справи</span></footer></main>
}

const params = new URLSearchParams(window.location.search)
const roomCode = (params.get('room') || DEFAULT_ROOM).toUpperCase()
const isRoom = params.get('screen') === 'room'
createRoot(document.getElementById('root')).render(isRoom ? <RoomScreen roomCode={roomCode}/> : <PlayerApp initialRoom={roomCode}/>)
