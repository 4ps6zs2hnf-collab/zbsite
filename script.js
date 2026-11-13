const $ = (s, root=document) => root.querySelector(s);
const form = $('#noteForm'), titleInput = $('#noteTitle'), textInput = $('#noteText');
const notesList = $('#notesList'), noteCount = $('#noteCount'), charCount = $('#charCount');
const toast = $('#toast');
const NOTES_KEY = 'zabroshki-aginskogo-notes-v1';
const REFS_KEY = 'zabroshki-aginskogo-refs-v1';
let notes = safeRead(NOTES_KEY, []);
let refs = safeRead(REFS_KEY, []);

function safeRead(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function notify(message){ toast.textContent=message; toast.classList.add('show'); clearTimeout(notify.timer); notify.timer=setTimeout(()=>toast.classList.remove('show'),2100); }
function persistNotes(){ localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); renderNotes(); }
function renderNotes(){
  noteCount.textContent = `${notes.length} ${plural(notes.length)}`;
  if(!notes.length){ notesList.innerHTML='<div class="empty-state">Пока пусто. Первая запись — за тобой.</div>'; return; }
  notesList.innerHTML='';
  [...notes].reverse().forEach(note=>{
    const item=document.createElement('article'); item.className='note-item';
    const h=document.createElement('h4'); h.textContent=note.title;
    const p=document.createElement('p'); p.textContent=note.text;
    const meta=document.createElement('div'); meta.className='note-meta';
    const date=document.createElement('span'); date.textContent=note.date;
    const del=document.createElement('button'); del.className='delete-note'; del.textContent='УДАЛИТЬ ×';
    del.addEventListener('click',()=>{notes=notes.filter(n=>n.id!==note.id);persistNotes();notify('Заметка удалена');});
    meta.append(date,del); item.append(h,p,meta); notesList.append(item);
  });
}
function plural(n){ if(n%10===1&&n%100!==11)return 'ЗАМЕТКА'; if([2,3,4].includes(n%10)&&![12,13,14].includes(n%100))return 'ЗАМЕТКИ'; return 'ЗАМЕТОК'; }
textInput.addEventListener('input',()=>charCount.textContent=`${textInput.value.length} / 1200`);
form.addEventListener('submit',e=>{
  e.preventDefault();
  const title=titleInput.value.trim(), text=textInput.value.trim(); if(!title||!text)return;
  notes.push({id:crypto.randomUUID?.()||String(Date.now()),title,text,date:new Date().toLocaleDateString('ru-RU')});
  persistNotes(); form.reset(); charCount.textContent='0 / 1200'; notify('Запись сохранена в блокноте');
});

function renderRefs(){
  const grid=$('#referenceGrid');
  grid.querySelectorAll('.user-reference').forEach(el=>el.remove());
  refs.forEach((ref,index)=>{
    const fig=document.createElement('figure'); fig.className='reference-card user-reference';
    const img=document.createElement('img'); img.src=ref.data; img.alt=ref.name;
    const cap=document.createElement('figcaption');
    const small=document.createElement('span'); small.textContent=`${String(index+3).padStart(2,'0')} / ДОБАВЛЕНО`;
    const b=document.createElement('b'); b.textContent=ref.name;
    const del=document.createElement('button'); del.className='remove-ref'; del.textContent='Удалить'; del.addEventListener('click',()=>{refs.splice(index,1);saveRefs();});
    cap.append(small,b,del);fig.append(img,cap);grid.append(fig);
  });
}
function saveRefs(){try{localStorage.setItem(REFS_KEY,JSON.stringify(refs));renderRefs();}catch{notify('Не хватило памяти браузера для изображения');}}
$('#referenceUpload').addEventListener('change',async e=>{
  const files=[...e.target.files]; 
  for(const file of files){
    if(!file.type.startsWith('image/'))continue;
    if(file.size>3*1024*1024){notify('Изображение больше 3 МБ — пропущено');continue;}
    const data=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(file);});
    refs.push({name:file.name.replace(/\.[^.]+$/,'').slice(0,60)||'Новый референс',data});
  }
  saveRefs();e.target.value='';if(files.length)notify('Референсы добавлены');
});
renderNotes();renderRefs();

// Keep the reveal animation aligned to a 24 fps visual cadence.
const heroTitle=$('.hero-title');
if(heroTitle && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  let last=0; const frame=1000/24;
  const tick=t=>{if(t-last>=frame){document.documentElement.style.setProperty('--animation-frame',String(Math.floor(t/frame)));last=t;}requestAnimationFrame(tick);};
  requestAnimationFrame(tick);
}
