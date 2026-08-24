const EVENT_TITLE = 'The Lake of knowledge'

const currentUrl = new URL(window.location.href)
if ((currentUrl.searchParams.get('room') || '').toUpperCase() === 'FORUM26') {
  currentUrl.searchParams.set('room', 'THELAKE')
  window.location.replace(currentUrl.toString())
}

function replaceExactText(root = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  for (const node of nodes) {
    const text = node.nodeValue || ''
    if (!text.trim()) continue
    const next = text
      .replaceAll('FORUM26', EVENT_TITLE)
      .replaceAll('THELAKE', EVENT_TITLE)
      .replaceAll('НАВЧАЛЬНА СИМУЛЯЦІЯ', EVENT_TITLE)
      .replaceAll('QA test', '')
      .replaceAll('QA TEST', '')
      .replaceAll('QA Test', '')
    if (next !== text) node.nodeValue = next
  }
}

function setText(el, value) {
  if (el && el.textContent !== value) el.textContent = value
}

function polish() {
  const title = `${EVENT_TITLE} · UNION COURT`
  if (document.title !== title) document.title = title
  replaceExactText(document.body)

  document.querySelectorAll('.room-code').forEach(el => {
    if (el.dataset.eventPolished === '1') return
    el.dataset.eventPolished = '1'
    el.innerHTML = `<small>ПОДІЯ</small><b>${EVENT_TITLE}</b>`
  })

  document.querySelectorAll('.join-room-hint-v3').forEach(el => el.remove())

  const join = document.querySelector('.join-card')
  if (join) {
    const inputs = join.querySelectorAll('input')
    if (inputs[1]) {
      inputs[1].setAttribute('aria-hidden', 'true')
      inputs[1].tabIndex = -1
    }
    setText(join.querySelector('p'), 'Пройдіть шлях трудового спору від наказу до остаточного судового результату.')
  }

  document.querySelectorAll('.focus-stage .instruction').forEach(el => setText(el, 'Оберіть відповідь на шкалі.'))
  document.querySelectorAll('.inspection>p').forEach(el => {
    if (el.textContent?.includes('До фіксації')) setText(el, 'Дослідіть документ і позначте фрагменти, які вважаєте важливими.')
  })

  document.querySelectorAll('.room-head .brand small,.join-page>.brand small').forEach(el => setText(el, EVENT_TITLE))

  document.querySelectorAll('.participant-lobby-v3').forEach(box => {
    setText(box.querySelector('.eyebrow'), 'ВИ У ГРІ')
    setText(box.querySelector('h1'), 'Готові до старту')
    setText(box.querySelector('p'), 'Все готово. Починаємо разом за сигналом ведучого.')
  })

  document.querySelectorAll('.leader,.lobby-player,.player-chip,.participant-chips-v3 span').forEach(el => {
    if (/QA\s*test/i.test(el.textContent || '')) el.remove()
  })
}

function runPolishSequence() {
  polish()
  setTimeout(polish, 150)
  setTimeout(polish, 700)
  setTimeout(polish, 1800)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runPolishSequence, { once: true })
else runPolishSequence()

// Intentionally no broad MutationObserver here. The previous observer re-wrote
// React-managed text nodes repeatedly and could lock the room/presenter screen.
