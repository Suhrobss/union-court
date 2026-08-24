const EVENT_TITLE = 'The Lake of knowledge'

const currentUrl=new URL(window.location.href)
if((currentUrl.searchParams.get('room')||'').toUpperCase()==='FORUM26'){
  currentUrl.searchParams.set('room','THELAKE')
  window.location.replace(currentUrl.toString())
}

function replaceExactText(root=document){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT)
  const nodes=[]
  while(walker.nextNode()) nodes.push(walker.currentNode)
  for(const node of nodes){
    const text=node.nodeValue||''
    if(!text.trim()) continue
    let next=text
      .replaceAll('FORUM26',EVENT_TITLE)
      .replaceAll('THELAKE',EVENT_TITLE)
      .replaceAll('НАВЧАЛЬНА СИМУЛЯЦІЯ',EVENT_TITLE)
      .replaceAll('QA test','')
      .replaceAll('QA TEST','')
      .replaceAll('QA Test','')
    if(next!==text) node.nodeValue=next
  }
}

function polish(){
  document.title=`${EVENT_TITLE} · UNION COURT`
  replaceExactText(document.body)

  document.querySelectorAll('.room-code').forEach(el=>{
    el.dataset.eventPolished='1'
    el.innerHTML=`<small>ПОДІЯ</small><b>${EVENT_TITLE}</b>`
  })

  document.querySelectorAll('.join-room-hint-v3').forEach(el=>el.remove())

  const join=document.querySelector('.join-card')
  if(join){
    const inputs=join.querySelectorAll('input')
    if(inputs[1]){
      inputs[1].setAttribute('aria-hidden','true')
      inputs[1].tabIndex=-1
    }
    const p=join.querySelector('p')
    if(p) p.textContent='Пройдіть шлях трудового спору від наказу до остаточного судового результату.'
  }

  document.querySelectorAll('.focus-stage .instruction').forEach(el=>{
    el.textContent='Оберіть відповідь на шкалі.'
  })

  document.querySelectorAll('.inspection>p').forEach(el=>{
    if(el.textContent?.includes('До фіксації')) el.textContent='Дослідіть документ і позначте фрагменти, які вважаєте важливими.'
  })

  document.querySelectorAll('.room-head .brand small,.join-page>.brand small').forEach(el=>{
    el.textContent=EVENT_TITLE
  })

  document.querySelectorAll('.participant-lobby-v3').forEach(box=>{
    const eyebrow=box.querySelector('.eyebrow')
    if(eyebrow) eyebrow.textContent='ВИ У ГРІ'
    const h1=box.querySelector('h1')
    if(h1) h1.textContent='Готові до старту'
    const p=box.querySelector('p')
    if(p) p.textContent='Все готово. Починаємо разом за сигналом ведучого.'
    const roomBox=box.querySelector('.lobby-room')
    if(roomBox) roomBox.innerHTML=`<span><b>${EVENT_TITLE}</b></span><span>Очікуємо початку</span>`
  })

  document.querySelectorAll('.room-lobby-v3').forEach(box=>{
    const eyebrow=box.querySelector('.room-eyebrow')
    if(eyebrow) eyebrow.textContent=EVENT_TITLE
    const sub=box.querySelector('.room-sub')
    if(sub) sub.textContent='Приєднуйтесь — починаємо всі разом.'
    const joinText=box.querySelector('.room-lobby-join p')
    if(joinText) joinText.textContent='Введіть ім’я — і ви готові до старту.'
    const code=box.querySelector('.join-code')
    if(code) code.textContent=EVENT_TITLE
  })

  document.querySelectorAll('.leader,.lobby-player,.player-chip,.participant-chips-v3 span').forEach(el=>{
    if(/QA\s*test/i.test(el.textContent||'')) el.remove()
  })
}

let scheduled=false
const schedule=()=>{
  if(scheduled) return
  scheduled=true
  requestAnimationFrame(()=>{scheduled=false;polish()})
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule,{once:true})
else schedule()

new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true})
