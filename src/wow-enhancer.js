import './wow-enhancer.css'

const uiState = {
  order: {
    inspected: new Set(),
    priorities: new Set(),
    active: 'basis',
  },
  defense: {
    role: null,
    credential: null,
    message: 'Спочатку оберіть, хто веде вашу справу до суду.',
    rejected: null,
  },
}

const INSPECTION = {
  org: {
    level: 'secondary',
    title: 'Хто саме є роботодавцем?',
    text: 'Перевіряємо юридичну особу, філію, реквізити та те, від чийого імені виданий кадровий акт. Це потрібно для правильної побудови сторін спору.',
  },
  date: {
    level: 'priority',
    title: 'Дата наказу та дата звільнення',
    text: 'Так, це потрібно перевірити. Дати зв’язують наказ із попередніми документами, врученням копії та майбутнім обчисленням строку звернення до суду.',
  },
  person: {
    level: 'secondary',
    title: 'Працівник, посада, табельний номер',
    text: 'Перевіряємо, чи акт стосується саме цього працівника, цієї посади та його трудової функції. Для спору особливо важливо, яку саме роботу роботодавець стверджує, що більше не може забезпечити.',
  },
  basis: {
    level: 'priority',
    title: 'Правова підстава звільнення',
    text: 'Так — одна з перших точок. Недостатньо побачити номер статті: треба перевірити, чи факти справи відповідають усім умовам саме цієї підстави.',
  },
  causation: {
    level: 'priority',
    title: 'Причинний ланцюг',
    text: 'Ключова точка. Бойові дії самі по собі не закінчують аналіз: потрібно перевірити зв’язок «бойові дії → знищення або відсутність умов/майна → неможливість забезпечити саме цього працівника роботою».',
  },
  underlying: {
    level: 'priority',
    title: 'Наказ №53-ОП — документ-підстава',
    text: 'Так, його треба відкрити окремо. Наказ про звільнення посилається на інший документ, тому майбутня позиція не може будуватися лише на одному аркуші.',
  },
  payments: {
    level: 'secondary',
    title: 'Компенсація та вихідна допомога',
    text: 'Це треба перевірити для повного розрахунку вимог, але саме по собі правильне нарахування виплат не відповідає на питання, чи була законною підстава звільнення.',
  },
  authority: {
    level: 'priority',
    title: 'Хто підписав наказ?',
    text: 'Так, перевіряємо посадову особу та її повноваження на видання кадрового акта. У конкретній справі це може бути окремою лінією заперечень.',
  },
  service: {
    level: 'priority',
    title: 'Ознайомлення працівника',
    text: 'Дуже важливо. Порожній блок підпису не дає автоматичної відповіді, як і коли працівник реально отримав копію наказу. Це питання треба з’єднати з доказами направлення та вручення.',
  },
  identifiers: {
    level: 'secondary',
    title: 'Код та технічні реквізити',
    text: 'Реквізити перевіряємо, але вони зазвичай не є першою лінією атаки на законність звільнення, якщо немає конкретної проблеми з ідентифікацією документа.',
  },
}

const PRIORITIES = [
  { id: 'basis', reactKey: 'basis', label: 'Правова підстава', hint: 'Чи виконані всі умови п. 6 ч. 1 ст. 41 КЗпП?' },
  { id: 'causation', reactKey: 'facts', label: 'Фактична неможливість роботи', hint: 'Чим доведений причинний зв’язок і неможливість роботи саме для працівника?' },
  { id: 'transfer', reactKey: 'vacancy', label: 'Переведення / вакансії', hint: 'Чи справді неможливо було перевести за згодою на іншу роботу?' },
  { id: 'service', reactKey: 'date', label: 'Вручення копії та дати', hint: 'Коли і як працівник реально отримав кадрові документи?' },
  { id: 'authority', reactKey: 'authority', label: 'Повноваження підписанта', hint: 'Чи мав підписант право звільняти працівника?' },
  { id: 'payments', reactKey: 'stamp', label: 'Розмір компенсації', hint: 'Важливо для розрахунку, але чи це головна атака на підставу звільнення?' },
  { id: 'identifiers', reactKey: 'font', label: 'Код ЄДРПОУ та табельний номер', hint: 'Технічні реквізити чи першочергова лінія спору?' },
]

const DEFENSE_ROLES = [
  { id: 'self', reactIndex: 0, icon: '◎', title: 'Я сам / сама', meta: 'Самопредставництво', valid: true, text: 'Ведете справу особисто.' },
  { id: 'lawyer', reactIndex: 1, icon: '§', title: 'Адвокат', meta: 'Професійна правнича допомога', valid: true, text: 'Представляє вас у суді як адвокат.' },
  { id: 'rep', reactIndex: 2, icon: '⚖', title: 'Інша повнолітня особа', meta: 'Трудовий спір', valid: true, text: 'У трудовому спорі це може бути процесуально допустимим представником.' },
  { id: 'unionlaw', reactIndex: 3, icon: '◆', title: 'Юрист профспілки', meta: 'Представник у трудовому спорі', valid: true, text: 'Може вести справу як належний представник за наявності необхідних умов і повноважень.' },
  { id: 'minor', icon: '17', title: 'Друг, 17 років', meta: 'Пастка', valid: false, text: 'Для представництва у трудовому спорі інша особа має досягти 18 років і мати цивільну процесуальну дієздатність.' },
  { id: 'witness', icon: '!', title: 'Свідок у цій справі', meta: 'Конфлікт ролей', valid: false, text: 'Особа, яка бере участь у справі як свідок, не може одночасно бути представником у цій справі.' },
]

const CREDENTIALS = [
  { id: 'self', icon: '◎', title: 'Дію особисто', text: 'Окремий документ представнику не потрібен.' },
  { id: 'order', icon: '§', title: 'Ордер адвоката', text: 'Один із документів, яким можуть підтверджуватися повноваження адвоката.' },
  { id: 'power', icon: '⌁', title: 'Довіреність', text: 'Документ для підтвердження повноважень представника у передбачених законом випадках.' },
  { id: 'chat', icon: '✕', title: '«Домовились у чаті»', text: 'Самого листування недостатньо для підтвердження процесуальних повноважень.' },
]

function getOriginalOrderStage() {
  return document.querySelector('.order-stage:not(.wow-stage)')
}

function getOriginalDefenseStage() {
  return document.querySelector('.defense-builder:not(.wow-stage)')
}

function clickOriginalOrderKey(key) {
  const root = getOriginalOrderStage()
  if (!root) return
  const matchers = {
    basis: (el) => el.textContent.includes('п. 6 ч. 1 ст. 41'),
    facts: (el) => el.textContent.includes('неможливістю забезпечення'),
    vacancy: (el) => el.textContent.includes('перелік вакантних'),
    date: (el) => el.textContent.includes('29.12.2022'),
    authority: (el) => el.textContent.trim().includes('Начальник філії'),
    stamp: (el) => el.textContent.trim() === 'ПЕЧАТКА',
  }
  if (key === 'font') {
    root.querySelector('.font-trap')?.click()
    return
  }
  const button = [...root.querySelectorAll('.doc-hot')].find(matchers[key])
  button?.click()
}

function orderDocumentMarkup() {
  return `
    <div class="wow-order-heading">
      <div>
        <span class="wow-kicker">ЕТАП 1 · ДОКУМЕНТ ПЕРЕД ВАМИ</span>
        <h2>Не читайте наказ. <em>Розберіть його.</em></h2>
        <p>Натискайте прямо на реквізити й фрагменти. Після короткого огляду сформуйте 5 пріоритетів для майбутнього оскарження.</p>
      </div>
      <div class="wow-case-chip"><b>АРКУШ 25</b><span>реконструкція з матеріалів справи</span></div>
    </div>
    <div class="wow-order-workbench">
      <div class="wow-document-zone">
        <div class="wow-paper-shadow"></div>
        <article class="wow-p4-document" aria-label="Навчальна реконструкція наказу про припинення трудового договору">
          <div class="wow-scan-beam"></div>
          <div class="p4-toprow">
            <button class="inspect-zone p4-org" data-inspect="org">
              Південна філія Державного підприємства<br>
              «Національна портова інфраструктура»<br>
              <small>(адміністрація Південного морського порту)</small>
              <u>Найменування підприємства (установи, організації)</u>
            </button>
            <div class="p4-formbox">
              <strong>Типова форма № П-4</strong><br>
              ЗАТВЕРДЖЕНО<br>
              наказом Держкомстату України<br>
              від 5 грудня 2008 р. N 489
              <table><tbody>
                <tr><th>Код ЄДРПОУ</th><td><button data-inspect="identifiers" class="inspect-inline">39284617</button></td></tr>
                <tr><th>Дата складання</th><td><button data-inspect="date" class="inspect-inline">28.12.2022</button></td></tr>
              </tbody></table>
            </div>
          </div>
          <div class="p4-title">НАКАЗ № <u>221-К</u><br><span>(РОЗПОРЯДЖЕННЯ)</span><br><b>про припинення трудового договору (контракту)</b></div>
          <div class="p4-dismiss-row">
            <span>Звільнити</span>
            <button data-inspect="date" class="inspect-inline p4-date">29 грудня 2022 р.</button>
            <span class="p4-number">Табельний номер <button data-inspect="identifiers" class="inspect-inline">1822</button></span>
          </div>
          <button class="inspect-zone p4-person" data-inspect="person">
            <strong>Дрозд Олена Петрівна</strong>
            <small>(прізвище, ім’я, по батькові)</small>
          </button>
          <div class="p4-linefield">Відділи (підрозділи, посади) підпорядковані начальнику філії<small>назва структурного підрозділу</small></div>
          <div class="p4-linefield"><b>Провідний бухгалтер-ревізор</b><small>назва професії (посади), розряд, клас (категорія) кваліфікації</small></div>
          <button class="inspect-zone p4-cause" data-inspect="basis">
            <strong>пункт 6 частини першої статті 41 КЗпП України</strong>
            <span>у зв’язку з неможливістю забезпечення працівника роботою, визначеною трудовим договором,</span>
          </button>
          <button class="inspect-zone p4-cause p4-cause-second" data-inspect="causation">
            у зв’язку із знищенням (відсутністю) виробничих, організаційних та технічних умов, засобів виробництва або майна роботодавця внаслідок бойових дій
            <small>(причина звільнення)</small>
          </button>
          <button class="inspect-zone p4-basisdoc" data-inspect="underlying">
            наказу від 15.12.2022 № 53-ОП «Про припинення трудових договорів з працівниками»
            <small>(підстава звільнення)</small>
          </button>
          <button class="inspect-zone p4-payments" data-inspect="payments">
            <span>Бухгалтерії виплатити компенсацію за невикористані дні щорічної відпустки у кількості <b>11 к.д.</b></span>
            <span>Бухгалтерії виплатити вихідну допомогу у розмірі середнього місячного заробітку.</span>
          </button>
          <div class="p4-signatures">
            <span>Начальник підприємства</span>
            <button data-inspect="authority" class="inspect-zone p4-sign"><i class="fake-signature">Харк</i><small>(підпис)</small></button>
            <button data-inspect="authority" class="inspect-zone p4-name"><b>Харкавенко В.Л.</b><small>п. і. б.</small></button>
          </div>
          <button class="inspect-zone p4-ack" data-inspect="service">
            <span>З наказом (розпорядженням)<br>ознайомлений, копію<br>наказу отримав(ла)</span>
            <span class="ack-line">________________<small>(підпис працівника)</small></span>
            <span>«____» ____________ 20____ року</span>
          </button>
        </article>
        <div class="wow-document-caption">Навчальна реконструкція. Назву та ідентифікатор підприємства змінено.</div>
      </div>
      <aside class="wow-inspector">
        <div class="wow-inspector-head"><span>ЮРИДИЧНИЙ СКАНЕР</span><b id="wow-inspected-count">0/4</b></div>
        <div class="wow-radar"><i></i><i></i><i></i><span>SCAN</span></div>
        <div id="wow-inspection-note" class="wow-inspection-note">
          <span class="priority">ПОЧНІТЬ З ДОКУМЕНТА</span>
          <h3>Де тут майбутній спір?</h3>
          <p>Торкніться будь-якого виділеного фрагмента наказу.</p>
        </div>
        <div class="wow-found-list" id="wow-found-list"></div>
      </aside>
    </div>
    <section class="wow-priority-board is-locked" id="wow-priority-board">
      <div class="wow-priority-head">
        <div><span>КРОК 2 · ПЕРША ЛІНІЯ ОСКАРЖЕННЯ</span><h3>У вас лише 5 маркерів. Куди їх поставите?</h3></div>
        <div class="wow-marker-counter"><b id="wow-priority-count">0</b><small>/ 5</small></div>
      </div>
      <p class="wow-lock-copy" id="wow-lock-copy">Спочатку дослідіть щонайменше 4 ділянки наказу — після цього відкриється вибір пріоритетів.</p>
      <div class="wow-priority-grid" id="wow-priority-grid"></div>
      <div class="wow-position-stamp" id="wow-position-stamp"><b>ПОЗИЦІЮ СФОРМОВАНО</b><span>5 ПРІОРИТЕТІВ</span></div>
      <div class="wow-limit-toast" id="wow-limit-toast">Ліміт — 5. Щоб замінити пріоритет, спочатку зніміть один маркер.</div>
    </section>
  `
}

function mountOrder(original) {
  if (!original || document.getElementById('wow-order-stage')) return
  original.classList.add('wow-original-hidden')
  const host = document.createElement('section')
  host.id = 'wow-order-stage'
  host.className = 'wow-stage wow-order-stage'
  host.innerHTML = orderDocumentMarkup()
  original.parentNode.insertBefore(host, original)

  const inspectButtons = host.querySelectorAll('[data-inspect]')
  inspectButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.inspect
      uiState.order.active = id
      uiState.order.inspected.add(id)
      host.querySelectorAll('[data-inspect]').forEach((el) => el.classList.toggle('is-active', el.dataset.inspect === id))
      renderOrder(host)
    })
  })

  renderOrder(host)
}

function renderOrder(host) {
  const active = INSPECTION[uiState.order.active] || INSPECTION.basis
  const inspectedCount = uiState.order.inspected.size
  const count = host.querySelector('#wow-inspected-count')
  if (count) count.textContent = `${Math.min(inspectedCount, 4)}/4`

  const note = host.querySelector('#wow-inspection-note')
  if (note) {
    const levelText = active.level === 'priority' ? 'ВАРТО ПЕРЕВІРИТИ' : 'ДРУГИЙ ПРІОРИТЕТ'
    note.innerHTML = `<span class="${active.level}">${levelText}</span><h3>${active.title}</h3><p>${active.text}</p>`
  }

  const found = host.querySelector('#wow-found-list')
  if (found) {
    found.innerHTML = [...uiState.order.inspected].slice(-5).reverse().map((id) => {
      const item = INSPECTION[id]
      return `<span class="${item?.level || 'secondary'}">${item?.title || id}</span>`
    }).join('')
  }

  const board = host.querySelector('#wow-priority-board')
  const unlocked = inspectedCount >= 4
  board?.classList.toggle('is-locked', !unlocked)
  const lockCopy = host.querySelector('#wow-lock-copy')
  if (lockCopy) lockCopy.textContent = unlocked ? 'Тепер не шукайте все підряд. Оберіть рівно п’ять речей, які перевірятимете першими.' : 'Спочатку дослідіть щонайменше 4 ділянки наказу — після цього відкриється вибір пріоритетів.'

  const grid = host.querySelector('#wow-priority-grid')
  if (grid) {
    grid.innerHTML = PRIORITIES.map((item, index) => `
      <button class="wow-priority-card ${uiState.order.priorities.has(item.id) ? 'selected' : ''}" data-priority="${item.id}" ${unlocked ? '' : 'disabled'}>
        <span class="marker">${uiState.order.priorities.has(item.id) ? '✓' : index + 1}</span>
        <div><b>${item.label}</b><small>${item.hint}</small></div>
      </button>
    `).join('')
    grid.querySelectorAll('[data-priority]').forEach((button) => {
      button.addEventListener('click', () => togglePriority(host, button.dataset.priority))
    })
  }

  const priorityCount = host.querySelector('#wow-priority-count')
  if (priorityCount) priorityCount.textContent = String(uiState.order.priorities.size)
  host.querySelector('#wow-position-stamp')?.classList.toggle('show', uiState.order.priorities.size === 5)
}

function togglePriority(host, id) {
  const item = PRIORITIES.find((x) => x.id === id)
  if (!item) return
  const selected = uiState.order.priorities
  if (selected.has(id)) {
    selected.delete(id)
    clickOriginalOrderKey(item.reactKey)
  } else {
    if (selected.size >= 5) {
      const toast = host.querySelector('#wow-limit-toast')
      toast?.classList.remove('show')
      requestAnimationFrame(() => toast?.classList.add('show'))
      setTimeout(() => toast?.classList.remove('show'), 1800)
      return
    }
    selected.add(id)
    clickOriginalOrderKey(item.reactKey)
  }
  renderOrder(host)
}

function defenseMarkup() {
  return `
    <div class="wow-defense-heading">
      <span class="wow-kicker">МІСІЯ · ВІДКРИЙТЕ ШЛЯХ ДО СУДУ</span>
      <h2>Зберіть маршрут захисту</h2>
      <p>Тут немає однієї кнопки «правильна відповідь». Спочатку визначте, хто веде справу, потім додайте належне підтвердження повноважень.</p>
    </div>
    <div class="wow-defense-arena">
      <section class="wow-role-deck">
        <div class="wow-deck-title"><span>КРОК 1</span><b>Хто заходить у справу?</b></div>
        <div class="wow-role-grid" id="wow-role-grid"></div>
      </section>
      <section class="wow-court-path" id="wow-court-path">
        <div class="wow-you-token"><span>ВИ</span><small>працівник</small></div>
        <div class="wow-path-line"><i></i><i></i><i></i></div>
        <div class="wow-defense-slot" id="wow-defense-slot"><span>1</span><b>ОБЕРІТЬ<br>ЗАХИСНИКА</b></div>
        <div class="wow-path-line second"><i></i><i></i><i></i></div>
        <div class="wow-court-building" id="wow-court-building">
          <div class="court-roof">⚖</div><div class="court-columns"><i></i><i></i><i></i><i></i></div><b>СУД</b>
        </div>
      </section>
      <section class="wow-credential-deck">
        <div class="wow-deck-title"><span>КРОК 2</span><b>Що додаємо до маршруту?</b></div>
        <div class="wow-credential-grid" id="wow-credential-grid"></div>
        <div class="wow-defense-message" id="wow-defense-message"></div>
      </section>
    </div>
    <div class="wow-defense-lawbar"><span>ЦПК УКРАЇНИ</span><b>ст. 58</b><b>ст. 60</b><b>ст. 61</b><b>ст. 62</b><em>самопредставництво · представник у трудовому спорі · підтвердження повноважень</em></div>
  `
}

function mountDefense(original) {
  if (!original || document.getElementById('wow-defense-stage')) return
  original.classList.add('wow-original-hidden')
  const host = document.createElement('section')
  host.id = 'wow-defense-stage'
  host.className = 'wow-stage wow-defense-stage'
  host.innerHTML = defenseMarkup()
  original.parentNode.insertBefore(host, original)
  renderDefense(host)
}

function isCredentialValid() {
  const { role, credential } = uiState.defense
  if (!role) return false
  if (role === 'self') return credential === 'self'
  if (role === 'lawyer') return credential === 'order' || credential === 'power'
  if (role === 'rep' || role === 'unionlaw') return credential === 'power'
  return false
}

function renderDefense(host) {
  const roleGrid = host.querySelector('#wow-role-grid')
  if (roleGrid) {
    roleGrid.innerHTML = DEFENSE_ROLES.map((role) => `
      <button class="wow-role-card ${uiState.defense.role === role.id ? 'selected' : ''} ${uiState.defense.rejected === role.id ? 'rejected' : ''}" data-role="${role.id}">
        <i>${role.icon}</i><div><b>${role.title}</b><span>${role.meta}</span><small>${role.text}</small></div>
      </button>
    `).join('')
    roleGrid.querySelectorAll('[data-role]').forEach((button) => button.addEventListener('click', () => chooseRole(host, button.dataset.role)))
  }

  const selectedRole = DEFENSE_ROLES.find((x) => x.id === uiState.defense.role)
  const slot = host.querySelector('#wow-defense-slot')
  if (slot) {
    slot.classList.toggle('filled', Boolean(selectedRole))
    slot.innerHTML = selectedRole ? `<span>${selectedRole.icon}</span><b>${selectedRole.title}</b><small>${selectedRole.meta}</small>` : '<span>1</span><b>ОБЕРІТЬ<br>ЗАХИСНИКА</b>'
  }

  const credentialGrid = host.querySelector('#wow-credential-grid')
  if (credentialGrid) {
    credentialGrid.innerHTML = CREDENTIALS.map((item) => `
      <button class="wow-credential ${uiState.defense.credential === item.id ? 'selected' : ''}" data-credential="${item.id}" ${selectedRole ? '' : 'disabled'}>
        <i>${item.icon}</i><div><b>${item.title}</b><small>${item.text}</small></div>
      </button>
    `).join('')
    credentialGrid.querySelectorAll('[data-credential]').forEach((button) => button.addEventListener('click', () => chooseCredential(host, button.dataset.credential)))
  }

  const valid = isCredentialValid()
  host.querySelector('#wow-court-path')?.classList.toggle('route-complete', valid)
  host.querySelector('#wow-court-building')?.classList.toggle('open', valid)
  const message = host.querySelector('#wow-defense-message')
  if (message) {
    message.className = `wow-defense-message ${valid ? 'success' : ''}`
    message.innerHTML = valid
      ? '<span>✓ МАРШРУТ ВІДКРИТО</span><b>Повноваження зібрано логічно. Можна рухатися до суду.</b>'
      : `<span>${selectedRole ? 'ПОВНОВАЖЕННЯ' : 'МАРШРУТ НЕ СФОРМОВАНО'}</span><b>${uiState.defense.message}</b>`
  }
}

function chooseRole(host, id) {
  const role = DEFENSE_ROLES.find((x) => x.id === id)
  if (!role) return
  if (!role.valid) {
    uiState.defense.rejected = id
    uiState.defense.message = role.text
    setTimeout(() => {
      uiState.defense.rejected = null
      if (document.contains(host)) renderDefense(host)
    }, 900)
    renderDefense(host)
    return
  }

  uiState.defense.rejected = null
  if (uiState.defense.role !== id) {
    uiState.defense.role = id
    uiState.defense.credential = null
    uiState.defense.message = id === 'self'
      ? 'Ви можете діяти особисто. Тепер підтвердьте, що обираєте саме самопредставництво.'
      : id === 'lawyer'
        ? 'Для адвоката оберіть належний документ, що підтверджує його повноваження.'
        : 'Для іншого представника у трудовому спорі потрібне належне підтвердження повноважень.'
    const original = getOriginalDefenseStage()
    const buttons = original ? [...original.querySelectorAll('.route-card')] : []
    buttons[role.reactIndex]?.click()
  }
  renderDefense(host)
}

function chooseCredential(host, id) {
  if (!uiState.defense.role) return
  uiState.defense.credential = id
  const valid = isCredentialValid()
  if (!valid) {
    if (id === 'chat') uiState.defense.message = 'Ні. Повідомлення в чаті не замінює документ, яким процесуальні повноваження підтверджуються суду.'
    else if (uiState.defense.role === 'self') uiState.defense.message = 'Якщо ви ведете свою справу особисто, не потрібно призначати собі представника довіреністю чи ордером.'
    else if (uiState.defense.role === 'lawyer' && id === 'self') uiState.defense.message = 'Це позначка для самопредставництва. Для адвоката оберіть ордер або довіреність.'
    else uiState.defense.message = 'Цей документ не відповідає обраному маршруту. Спробуйте інший.'
  }
  renderDefense(host)
}

function syncMainButton() {
  const defense = document.getElementById('wow-defense-stage')
  if (!defense) return
  const card = defense.closest('.hero-card')
  const buttons = card ? [...card.querySelectorAll('button.primary')] : []
  const main = buttons.find((b) => !b.closest('.wow-stage'))
  if (!main) return
  const valid = isCredentialValid()
  main.classList.toggle('wow-route-locked', !valid)
  main.setAttribute('aria-disabled', valid ? 'false' : 'true')
}

function reconcile() {
  const originalOrder = getOriginalOrderStage()
  const orderHost = document.getElementById('wow-order-stage')
  if (originalOrder) {
    originalOrder.classList.add('wow-original-hidden')
    if (!orderHost) mountOrder(originalOrder)
  } else if (orderHost) {
    orderHost.remove()
  }

  const originalDefense = getOriginalDefenseStage()
  const defenseHost = document.getElementById('wow-defense-stage')
  if (originalDefense) {
    originalDefense.classList.add('wow-original-hidden')
    if (!defenseHost) mountDefense(originalDefense)
  } else if (defenseHost) {
    defenseHost.remove()
  }
  syncMainButton()
}

let scheduled = false
function scheduleReconcile() {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    reconcile()
  })
}

const observer = new MutationObserver(scheduleReconcile)
observer.observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('DOMContentLoaded', scheduleReconcile)
scheduleReconcile()

document.addEventListener('click', (event) => {
  const defense = document.getElementById('wow-defense-stage')
  if (!defense || isCredentialValid()) return
  const card = defense.closest('.hero-card')
  const primary = event.target.closest?.('button.primary')
  if (primary && card?.contains(primary) && !primary.closest('.wow-stage')) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation?.()
    uiState.defense.message = uiState.defense.role ? 'Спочатку завершіть маршрут: додайте правильне підтвердження повноважень.' : 'Спочатку оберіть, хто веде вашу справу.'
    renderDefense(defense)
    defense.querySelector('.wow-defense-message')?.classList.add('shake')
    setTimeout(() => defense.querySelector('.wow-defense-message')?.classList.remove('shake'), 500)
  }
}, true)
