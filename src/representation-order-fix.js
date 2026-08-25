import './representation-order-fix.css'

const ORDER_WHY={
 dates:{title:'Дати наказу та звільнення',text:'Перевірте дату видання наказу, дату припинення трудових відносин і дату вручення копії. Від цих дат залежать хронологія спору, розрахунок виплат і строк звернення до суду.'},
 employee:{title:'Дані працівника',text:'Переконайтеся, що наказ стосується саме вас, а посада, підрозділ та інші ідентифікуючі відомості відповідають фактичним трудовим відносинам.'},
 position:{title:'Посада працівника',text:'Посада важлива для перевірки трудової функції та можливості запропонувати іншу підходящу роботу або переведення.'},
 basis:{title:'Правова підстава звільнення',text:'Одного посилання на статтю недостатньо. Треба перевірити, чи існували всі фактичні умови саме тієї підстави, яку роботодавець зазначив у наказі.'},
 source:{title:'Документ, на який посилається наказ',text:'Якщо наказ посилається на інший внутрішній акт, службову записку чи рішення, цей документ треба отримати й перевірити: саме там часто міститься фактичне обґрунтування звільнення.'},
 payments:{title:'Розрахунок при звільненні',text:'Перевірте компенсацію за невикористану відпустку, вихідну допомогу та інші належні виплати. Помилка в розрахунку може створювати окрему вимогу до роботодавця.'},
 authority:{title:'Хто підписав наказ',text:'Варто перевірити, чи мала ця особа повноваження приймати рішення про звільнення і видавати відповідний кадровий акт.'},
 service:{title:'Вручення копії наказу',text:'Важливо встановити, коли і як працівник отримав належну копію наказу. Для спору про звільнення з цим пов’язане, зокрема, обчислення спеціального строку звернення до суду.'}
}

function currentOrderKey(btn){
 const text=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase()
 if(btn.closest('.order-row'))return'dates'
 if(btn.classList.contains('signature'))return'authority'
 if(btn.classList.contains('service-box'))return'service'
 if(text.includes('підстава припинення'))return'basis'
 if(text.includes('документ-підстава'))return'source'
 if(text.includes('розрахунок'))return'payments'
 if(text.includes('посада'))return'position'
 if(text.includes('працівник'))return'employee'
 return null
}

function showOrderWhy(key){
 const info=ORDER_WHY[key]
 const aside=document.querySelector('.order-layout .inspection')
 if(!info||!aside)return
 let panel=aside.querySelector('.order-why-panel-v8')
 if(!panel){
   panel=document.createElement('div')
   panel.className='order-why-panel-v8'
   const findings=aside.querySelector('.findings')
   if(findings) findings.insertAdjacentElement('beforebegin',panel)
   else aside.appendChild(panel)
 }
 panel.innerHTML=`<small>ЧОМУ ЦЕ ВАЖЛИВО?</small><b>${info.title}</b><p>${info.text}</p>`
 const rect=panel.getBoundingClientRect()
 if(rect.bottom>window.innerHeight||rect.top<0)panel.scrollIntoView({behavior:'smooth',block:'nearest'})
}

function activeRoute(){
 const active=document.querySelector('.defense-stage .path-door.active')
 const text=(active?.textContent||'').toLowerCase()
 if(text.includes('сам / сама')||text.includes('самопредстав'))return'self'
 if(text.includes('адвокат'))return'lawyer'
 if(text.includes('повноліт'))return'adult'
 return''
}

function credentialType(btn){
 const t=(btn.textContent||'').toLowerCase()
 if(t.includes('дію особисто'))return'self'
 if(t.includes('ордер'))return'order'
 if(t.includes('електронн')&&t.includes('довір'))return'ecourt'
 if(t.includes('довіреність'))return'power'
 if(t.includes('месендж'))return'chat'
 if(t.includes('усна'))return'verbal'
 return'other'
}

const ROUTE_SHOW={
 self:new Set(['self','order','power','chat']),
 lawyer:new Set(['order','power','ecourt','chat']),
 adult:new Set(['power','ecourt','order','chat'])
}
const ROUTE_NOTE={
 self:{badge:'Самопредставництво',title:'Ви дієте особисто',text:'Документ про повноваження представника вам не потрібен, бо представника немає. Довіреність або ордер у цьому маршруті не замінюють самопредставництво.'},
 lawyer:{badge:'Представництво адвокатом',title:'Для адвоката можливі декілька належних документів',text:'Стаття 62 ЦПК передбачає, зокрема, довіреність або ордер; також законом передбачене доручення органу безоплатної правничої допомоги. Електронна довіреність є електронною формою підтвердження повноважень у підсистемі «Електронний суд».'},
 adult:{badge:'Інша повнолітня особа',title:'Спеціальна можливість для трудового спору',text:'Частина 2 статті 60 ЦПК дозволяє в трудовому спорі іншого представника 18+ із цивільною процесуальною дієздатністю, якщо немає обмежень статті 61. Його повноваження мають бути належно підтверджені довіреністю; в «Електронному суді» може використовуватися електронна довіреність.'}
}

function patchDefense(){
 const root=document.querySelector('.defense-stage')
 if(!root)return
 const route=activeRoute()
 const cards=root.querySelector('.credential-cards')
 if(!route||!cards)return
 cards.classList.add('v8-filtered')
 const show=ROUTE_SHOW[route]||new Set()
 cards.querySelectorAll('button').forEach(btn=>{
   const type=credentialType(btn)
   const visible=show.has(type)
   btn.classList.toggle('v8-hidden',!visible)
   btn.classList.toggle('v8-relevant',visible)
 })
 let note=root.querySelector('.route-legal-note-v8')
 if(!note){note=document.createElement('div');note.className='route-legal-note-v8';cards.insertAdjacentElement('beforebegin',note)}
 const n=ROUTE_NOTE[route]
 note.innerHTML=`<span class="v8-route-badge"><i></i>${n.badge}</span><b>${n.title}</b>${n.text}`
 const heading=root.querySelector('.authority-heading')
 if(heading)heading.classList.add('v8-heading')
}

function polishOrderCopy(){
 const h=document.querySelector('.order-layout .inspection h3')
 const p=document.querySelector('.order-layout .inspection>p')
 if(h)h.textContent='На що звернути увагу в наказі про звільнення?'
 if(p)p.textContent='Натискайте на реквізити документа. Після кожного натискання ми пояснимо, чому цей фрагмент може бути важливим для перевірки законності звільнення.'
}

document.addEventListener('click',e=>{
 const btn=e.target.closest?.('.order-paper button')
 if(btn){const key=currentOrderKey(btn);if(key)setTimeout(()=>showOrderWhy(key),30)}
},true)

function tick(){polishOrderCopy();patchDefense()}
setTimeout(tick,50)
setInterval(tick,500)
