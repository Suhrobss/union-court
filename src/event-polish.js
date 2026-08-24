const EVENT_TITLE = 'The Lake of knowledge'

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
    if(next!==text) node.nodeValue=next
  }
}

function polish(){
  document.title=`${EVENT_TITLE} · UNION COURT`
  replaceExactText(document.body)

  document.querySelectorAll('.room-code').forEach(el=>{
    if(el.dataset.eventPolished==='1') return
    el.dataset.eventPolished='1'
    el.innerHTML=`<small>ПОДІЯ</small><b>${EVENT_TITLE}</b>`
  })

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

  document.querySelectorAll('.room-head .brand small').forEach(el=>{
    el.textContent=EVENT_TITLE
  })
  document.querySelectorAll('.join-page>.brand small').forEach(el=>{
    el.textContent=EVENT_TITLE
  })

  document.querySelectorAll('.leader,.lobby-player,.player-chip').forEach(el=>{
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
