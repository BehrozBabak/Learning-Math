
// app_v5.js - Mobile optimized logic (v5)
const AUDIO_FILES = { welcome:'sounds/welcome.wav', correct:'sounds/correct.wav', wrong:'sounds/wrong.wav', hint:'sounds/hint.wav', start_exam:'sounds/start_exam.wav', congrats:'sounds/congrats.wav' };
const audioCache = {}; function loadAudio(name,path){ const a=new Audio(path); a.preload='auto'; audioCache[name]=a; } Object.entries(AUDIO_FILES).forEach(([k,p])=> loadAudio(k,p));
function playAudioKey(key){ try{ if(!window.STATE || !window.STATE.soundOn) return; }catch(e){} const a=audioCache[key]; if(a && a.play){ try{ a.currentTime=0; a.play(); return; }catch(e){} } const phrases={ welcome:'سلام! من اسب تک‌شاخم، بیا با هم بازی کنیم.', correct:'آفرین! خیلی خوب شد.', wrong:'نه، اشکالی نداره، دوباره تلاش کن.', hint:'راهنما: از شکل‌ها کمک بگیر و آروم بشمار.', start_exam:'آزمون شروع شد. ده سوال داری.', congrats:'تبریک! کارت عالی بود.' }; if('speechSynthesis' in window){ const u=new SpeechSynthesisUtterance(phrases[key]||''); u.lang='fa-IR'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } }
window.STATE = { op:null, level:'مبتدی', mixed:false, examMode:false, idx:0, score:0, soundOn:true, musicOn:false, tutorial:false };
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function symbol(op){ return ({'جمع':'+','تفریق':'-','ضرب':'×','تقسیم':'÷'})[op] || '?'; }
function makeSingle(op,level){
  let a,b,answer,display,hint;
  const ranges = {'مبتدی':9,'متوسط':99,'پیشرفته':99};
  const R = ranges[level] || 99;
  if(op==='ترکیبی') op=['جمع','تفریق','ضرب','تقسیم'][rand(0,3)];
  if(op==='جمع'||op==='تفریق'){
    a = rand(0,R); b = rand(0,R);
    answer = (op==='جمع')? a+b : a-b;
    display = `${a} ${op==='جمع'?'+':'-'} ${b} = ?`;
    hint = (op==='جمع')?'همه را با هم بشمار':'از عدد اول، عدد دوم را کم کن';
    if(level==='مبتدی' && Math.abs(answer)>99){ a = rand(0,9); b = rand(0,9); answer = (op==='جمع')?a+b:a-b; display = `${a} ${op==='جمع'?'+':'-'} ${b} = ?`; }
  } else if(op==='ضرب'){
    const MR = (level==='مبتدی')?9:(level==='متوسط'?20:30);
    a = rand(0, MR); b = rand(0, MR);
    answer = a*b; display = `${a} × ${b} = ?`; hint='ضرب یعنی جمعِ تکراری';
    if(level==='مبتدی' && Math.abs(answer)>99){ a = rand(0,9); b = rand(0,9); answer=a*b; display=`${a} × ${b} = ?`; }
  } else if(op==='تقسیم'){
    const MR = (level==='مبتدی')?9:(level==='متوسط'?12:20);
    b = rand(1, MR);
    const q = rand(0, (level==='مبتدی'?9: (level==='متوسط'?12:30)));
    a = b * q;
    answer = (b===0)?0: a/b;
    display = `${a} ÷ ${b} = ?`; hint='تقسیم یعنی تقسیمِ مساوی بین گروه‌ها';
  }
  return {op,a,b,answer:String(answer),display,hint};
}
function makeCombined(level){
  const ops=['جمع','تفریق','ضرب','تقسیم'];
  const R = (level==='مبتدی')?9:99;
  function pick(){ return rand(0, R); }
  let a = pick(), b = pick(), c = pick();
  let op1 = ops[rand(0,3)], op2 = ops[rand(0,3)];
  if(op1==='تقسیم'){ b = rand(1, (level==='مبتدی'?9:12)); const q = rand(0, (level==='مبتدی'?9:12)); a = b * q; }
  if(op2==='تقسیم'){ c = rand(1, (level==='مبتدی'?9:12)); const q2 = rand(0, (level==='مبتدی'?9:12)); c = c * q2; }
  let expr = `(${a} ${symbol(op1)} ${b}) ${symbol(op2)} ${c}`;
  const safe = expr.replace(/×/g,'*').replace(/÷/g,'/');
  let val = 0;
  try{ val = eval(safe); }catch(e){ val = 0; }
  return {expr,answer:String(val),display:expr+' = ?',hint:'ابتدا داخل پرانتزها را حساب کن.'};
}
function makeQuestion(mode, level){ if(mode==='ترکیبی') return makeCombined(level); else return makeSingle(mode, level); }
const elQ = document.getElementById('qtext'), elVisual = document.getElementById('visual'), elChoices = document.getElementById('choices'), elScore = document.getElementById('score'), elFeedback = document.getElementById('feedback');
let current = null;
function renderVisual(q){
  elVisual.innerHTML='';
  const shapesOn = document.getElementById('chk-show-shapes') && document.getElementById('chk-show-shapes').checked;
  if(!shapesOn) return;
  try{
    if(/\+/.test(q.display) || /\-/.test(q.display)){
      const nums = q.display.match(/\d+/g) || [];
      nums.slice(0,2).forEach((n,i)=>{
        const cnt = Math.min(Number(n), 12);
        for(let j=0;j<cnt;j++){ const d=document.createElement('div'); d.className='shape'; d.textContent = i===0? '🍎':'🍓'; elVisual.appendChild(d); }
        if(i===0){ const plus=document.createElement('div'); plus.className='shape plus'; plus.textContent='➕'; elVisual.appendChild(plus); }
      });
    } else if(/×/.test(q.display)){
      const nums = q.display.match(/\d+/g) || []; const a = Math.min(Number(nums[0]||1), 8); const b = Math.min(Number(nums[1]||1), 8);
      const wrap = document.createElement('div'); wrap.style.display='grid'; wrap.style.gridTemplateColumns = `repeat(${b},30px)`; wrap.style.gap='4px';
      for(let r=0;r<a;r++){ for(let c=0;c<b;c++){ const s=document.createElement('div'); s.className='shape'; s.textContent='⭐'; wrap.appendChild(s); } }
      elVisual.appendChild(wrap);
    } else if(/÷/.test(q.display)){
      const nums = q.display.match(/\d+/g) || []; const a = Number(nums[0]||0); const b = Number(nums[1]||1);
      const group = document.createElement('div'); group.className='small'; group.textContent = `تقسیم ${a} بین ${b} تا`; elVisual.appendChild(group);
    } else {
      const txt = document.createElement('div'); txt.className='small'; txt.textContent = q.display.replace('= ?',''); elVisual.appendChild(txt);
    }
  }catch(e){}
}
function showTutorial(q){
  const showSteps = document.getElementById('chk-step-tutorial') && document.getElementById('chk-step-tutorial').checked;
  const area = document.getElementById('feedback');
  if(!showSteps){ area.textContent = ''; return; }
  if(/\+/.test(q.display)) area.textContent = 'راهنما: دو عدد را با هم جمع کن.';
  else if(/\-/.test(q.display)) area.textContent = 'راهنما: از عدد اول، عدد دوم را کم کن.';
  else if(/×/.test(q.display)) area.textContent = 'راهنما: ضرب یعنی جمع تکراری.';
  else if(/÷/.test(q.display)) area.textContent = 'راهنما: تقسیم یعنی پخش مساوی بین گروه‌ها.';
  else area.textContent = 'ابتدا پرانتزها را حساب کن.';
}
function ask(mode, level){
  current = makeQuestion(mode, level);
  elQ.innerHTML = `<span dir="ltr"><strong>${current.display}</strong></span>`;
  renderVisual(current); showTutorial(current); elChoices.innerHTML='';
  const correct = Number(current.answer);
  const opts = new Set([String(correct)]);
  while(opts.size<4){
    let delta = Math.max(1, Math.floor(Math.abs(correct)*0.3)+rand(1,5));
    let fake = correct + (Math.random()<0.5? delta : -delta);
    opts.add(String(fake));
  }
  const arr = Array.from(opts).sort(()=>Math.random()-0.5);
  arr.forEach(opt=>{ const b=document.createElement('button'); b.className='choice'; b.textContent=opt; b.onclick=()=>checkAnswer(opt); elChoices.appendChild(b); });
  if(window.STATE.soundOn){ if(window.STATE.examMode) playAudioKey('start_exam'); else playAudioKey('welcome'); }
}
function checkAnswer(opt){
  const correct = String(current.answer);
  if(opt === correct){ document.getElementById('feedback').textContent='آفرین! درست گفتی 🎉'; playAudioKey('correct'); confettiBurst(); window.STATE.score++; document.getElementById('score').textContent = window.STATE.score; } else { document.getElementById('feedback').textContent='نه، اشکالی نداره، دوباره امتحان کن.'; playAudioKey('wrong'); }
}
function confettiBurst(){ try{ const c=document.createElement('div'); c.className='confetti'; document.body.appendChild(c); for(let i=0;i<24;i++){ const el=document.createElement('div'); el.className='c'; el.style.background = ['#ff9ad8','#ffd6a5','#a7f3d0','#c7d2fe'][Math.floor(Math.random()*4)]; el.style.left = Math.random()*100+'%'; el.style.top='0'; el.style.width=(6+Math.random()*8)+'px'; el.style.height=(10+Math.random()*12)+'px'; c.appendChild(el); el.animate([{transform:'translateY(0) rotate(0)'},{transform:`translateY(${200+Math.random()*300}px) rotate(${Math.random()*720}deg)`}],{duration:1200+Math.random()*800}); setTimeout(()=>el.remove(),2200); } setTimeout(()=>c.remove(),2500);}catch(e){} }
document.querySelectorAll('.op').forEach(b=> b.addEventListener('click', ()=>{ const op=b.dataset.op; window.STATE.op=op; window.STATE.mixed=(op==='ترکیبی'); document.getElementById('mode-badge').textContent = window.STATE.mixed? 'وضعیت: ترکیبی' : `وضعیت: ${op}`; window.STATE.idx=0; window.STATE.score=0; document.getElementById('score').textContent='0'; ask(op, window.STATE.level); }));
document.querySelectorAll('.lvl').forEach(b=> b.addEventListener('click', ()=>{ document.querySelectorAll('.lvl').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); const lvl=b.dataset.lvl; window.STATE.level = lvl; document.getElementById('level-badge').textContent = `سطح: ${lvl}`; if(window.STATE.soundOn) playAudioKey('welcome'); }));
document.getElementById('btn-next').addEventListener('click', ()=>{ if(!window.STATE.op){ playAudioKey('hint'); document.getElementById('feedback').textContent='اول یکی از عملیات را انتخاب کن.'; return; } ask(window.STATE.mixed? 'ترکیبی' : window.STATE.op, window.STATE.level); });
document.getElementById('btn-exam').addEventListener('click', ()=>{ if(!window.STATE.op && !window.STATE.mixed){ document.getElementById('feedback').textContent='اول یکی از عملیات را انتخاب کن.'; playAudioKey('hint'); return; } window.STATE.examMode = true; window.STATE.idx = 0; window.STATE.score = 0; document.getElementById('score').textContent='0'; playAudioKey('start_exam'); ask(window.STATE.mixed? 'ترکیبی' : window.STATE.op, window.STATE.level); });
document.getElementById('btn-sound').addEventListener('click', ()=>{ window.STATE.soundOn = !window.STATE.soundOn; document.getElementById('btn-sound').setAttribute('aria-pressed', window.STATE.soundOn); document.getElementById('btn-sound').textContent = window.STATE.soundOn? '🔊':'🔇'; });
document.getElementById('btn-music').addEventListener('click', ()=>{ window.STATE.musicOn = !window.STATE.musicOn; document.getElementById('btn-music').setAttribute('aria-pressed', window.STATE.musicOn); document.getElementById('btn-music').textContent = window.STATE.musicOn? '🎵':'🎵'; if(window.STATE.musicOn) playAudioKey('congrats'); });
window.addEventListener('load', ()=>{ playAudioKey('welcome'); document.getElementById('qtext').focus(); });
