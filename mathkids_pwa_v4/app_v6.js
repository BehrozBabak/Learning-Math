
// app_v6.js - Implements integer-only arithmetic, level distributions, combined ops distribution,
// shapes only for beginner, Persian digits display, short audio feedback, background music toggle.

const AUDIO = {
  correct: 'sounds/correct.wav',
  wrong: 'sounds/wrong.wav',
  bg: 'sounds/bg_loop.wav'
};
const audioEls = {};
Object.entries(AUDIO).forEach(([k,v])=>{ const a=new Audio(v); a.preload='auto'; a.loop = (k==='bg'); audioEls[k]=a; });

// State
window.STATE = { op:null, level:'مبتدی', mixed:false, examMode:false, idx:0, score:0, soundOn:true, musicOn:false, tutorial:false };

// Persian digits and formatting
const PERSIAN_DIGITS = {'0':'۰','1':'۱','2':'۲','3':'۳','4':'۴','5':'۵','6':'۶','7':'۷','8':'۸','9':'۹'};
function toPersianNumber(n){
  // n is integer (may be negative)
  const s = String(n);
  if(s[0]==='-') return '-' + s.slice(1).split('').map(c=> PERSIAN_DIGITS[c]||c ).join('');
  return s.split('').map(c=> PERSIAN_DIGITS[c]||c ).join('');
}

// Utility random helpers that respect distributions
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
// pick magnitude buckets for levels based on user's percentages
function pickMagnitude(level){
  if(level==='مبتدی') return rand(0,9);
  if(level==='متوسط'){
    const r = Math.random();
    if(r < 0.5) return rand(0,19); // 50% <20
    else if(r < 0.8) return rand(20,49); // 30% 20-50
    else return rand(50,99); //20% 50-100
  }
  if(level==='پیشرفته'){
    const r = Math.random();
    if(r < 0.5) return rand(0,99); // 50% <100
    else if(r < 0.8) return rand(100,499); //30% 100-500
    else return rand(500,1000); //20% 500-1000
  }
  return rand(0,99);
}

// For division: we want integer answers in result-range. User specified for division "answer range" same as level ranges.
function makeDivisionQuestionForLevel(level){
  let ans;
  if(level==='مبتدی') ans = rand(0,10);
  else if(level==='متوسط') {
    const r = Math.random();
    if(r < 0.5) ans = rand(0,19);
    else if(r < 0.8) ans = rand(20,49);
    else ans = rand(50,99);
  } else {
    const r=Math.random();
    if(r<0.5) ans=rand(0,99);
    else if(r<0.8) ans=rand(100,499);
    else ans=rand(500,1000);
  }
  const divisor = (level==='مبتدی')? rand(1,9) : (level==='متوسط'? rand(1,12) : rand(1,20) );
  const dividend = ans * divisor;
  return {a: dividend, b: divisor, answer: ans};
}

// Single op generator (int-only)
function makeSingle(op, level){
  if(op==='تقسیم'){
    const q = makeDivisionQuestionForLevel(level);
    return {display: `${toPersianNumber(q.a)} ÷ ${toPersianNumber(q.b)} = ?`, answer: String(q.answer), raw:{a:q.a,b:q.b}};
  }
  if(op==='جمع' || op==='تفریق' || op==='ضرب'){
    if(level==='مبتدی'){
      const a = rand(0,10); const b = rand(0,10);
      let ans = (op==='جمع')? a+b : (op==='تفریق'? a-b : a*b);
      if(Math.abs(ans) > 99){
        const a2 = rand(0,9); const b2 = rand(0,9);
        return {display: `${toPersianNumber(a2)} ${op==='جمع'?'+':(op==='تفریق'?'-':'×')} ${toPersianNumber(b2)} = ?`, answer: String((op==='جمع'? a2+b2:(op==='تفریق'? a2-b2: a2*b2))), raw:{a:a2,b:b2}};
      }
      return {display: `${toPersianNumber(a)} ${op==='جمع'?'+':(op==='تفریق'?'-':'×')} ${toPersianNumber(b)} = ?`, answer: String((op==='جمع'? a+b:(op==='تفریق'? a-b: a*b))), raw:{a:a,b:b}};
    } else {
      const a = pickMagnitude(level); const b = pickMagnitude(level);
      const ans = (op==='جمع')? a+b : (op==='تفریق'? a-b : a*b);
      return {display: `${toPersianNumber(a)} ${op==='جمع'?'+':(op==='تفریق'?'-':'×')} ${toPersianNumber(b)} = ?`, answer: String(ans), raw:{a:a,b:b}};
    }
  }
  return {display: `۰ + ۰ = ?`, answer: "0", raw:{a:0,b:0}};
}

// Combined questions: generate expression with 2-4 operations, distribution 50% 2-op,30%3-op,20%4-op
function makeCombined(level){
  const r = Math.random();
  let nOps = (r < 0.5)? 2 : (r < 0.8 ? 3 : 4);
  const opsList = ['جمع','تفریق','ضرب','تقسیم'];
  function pickNum(){ return (level==='مبتدی')? rand(0,10) : pickMagnitude(level); }
  // build left-associative expression, adjusting divisions to be integer by inserting dividend = divisor*quotient
  let parts = [];
  // start with first number
  let currentNum = pickNum();
  parts.push(String(currentNum));
  for(let i=0;i<nOps;i++){
    const op = opsList[rand(0,3)];
    if(op === 'تقسیم'){
      let divisor = (level==='مبتدی')? rand(1,9) : (level==='متوسط'? rand(1,12) : rand(1,20));
      let quotient = (level==='مبتدی')? rand(0,10) : pickMagnitude(level);
      let dividend = divisor * quotient;
      // set current expression to dividend ÷ divisor
      parts = [String(dividend)];
      parts.push(symbol(op));
      parts.push(String(divisor));
    } else {
      const next = pickNum();
      parts.push(symbol(op));
      parts.push(String(next));
    }
  }
  const expr = parts.join(' ');
  const safe = expr.replace(/×/g,'*').replace(/÷/g,'/');
  let value=0;
  try{ value = eval(safe); }catch(e){ value=0; }
  value = Math.round(value);
  const display = expr.replace(/\d+/g, function(n){ return toPersianNumber(n); }).replace(/\*/g,'×').replace(/\//g,'÷');
  return {display: display + ' = ?', answer: String(value), rawExpr: expr};
}

function symbol(op){ return ({'جمع':'+','تفریق':'-','ضرب':'×','تقسیم':'÷'})[op] || '?'; }

// Rendering and UI same as v5 but using Persian numerals and specified behavior
const elQ = document.getElementById('qtext'), elVisual = document.getElementById('visual'), elChoices = document.getElementById('choices'), elScore = document.getElementById('score'), elFeedback = document.getElementById('feedback');
let currentQuestion = null;

function renderShapesForSingle(q){
  elVisual.innerHTML='';
  if(window.STATE.level !== 'مبتدی') return;
  if(!document.getElementById('chk-show-shapes').checked) return;
  const nums = (q.raw && q.raw.a !== undefined && q.raw.b !== undefined) ? [q.raw.a, q.raw.b] : (q.rawExpr? (q.rawExpr.match(/\d+/g)||[]).slice(0,2) : []);
  const colors = ['apple','straw','star','coin'];
  for(let i=0;i<nums.length;i++){
    const cnt = Math.min(Number(nums[i]||0), 10);
    for(let j=0;j<cnt;j++){
      const d = document.createElement('div'); d.className='shape ' + colors[i%colors.length]; d.textContent = (i%2===0 ? '🍎' : '🍓'); elVisual.appendChild(d);
    }
    if(i===0){
      const plus = document.createElement('div'); plus.className='shape'; plus.textContent = ' '; elVisual.appendChild(plus);
    }
  }
}

function renderQuestion(qObj, isCombined=false){
  elChoices.innerHTML=''; elFeedback.textContent='';
  elQ.innerHTML = `<span dir="ltr"><strong>${qObj.display}</strong></span>`;
  if(!isCombined) renderShapesForSingle(qObj); else elVisual.innerHTML='';
  // prepare 4 options
  const correct = Number(qObj.answer);
  const opts = new Set([String(correct)]);
  while(opts.size < 4){
    let delta = Math.max(1, Math.floor(Math.abs(correct)*0.25)+rand(1,6));
    let fake = correct + (Math.random() < 0.5 ? delta : -delta);
    opts.add(String(fake));
  }
  const arr = Array.from(opts).sort(()=>Math.random()-0.5);
  arr.forEach(opt=>{
    const b = document.createElement('button'); b.className='choice';
    b.textContent = (String(opt)[0]==='-'? '-' : '') + toPersianNumber(Math.abs(Number(opt)));
    b.onclick = ()=> checkAnswer(String(opt));
    elChoices.appendChild(b);
  });
}

function checkAnswer(optStr){
  const correctStr = String(currentQuestion.answer);
  if(optStr === correctStr){
    elFeedback.textContent = 'آفرین! درست زدی 🎉';
    playSound('correct'); confettiBurst();
    window.STATE.score++; elScore.textContent = toPersianNumber(window.STATE.score);
  } else {
    elFeedback.textContent = 'نه، دوباره تلاش کن.';
    playSound('wrong');
  }
}

function playSound(key){
  if(!window.STATE.soundOn) return;
  const a = audioEls[key]; if(!a) return;
  try{ a.currentTime = 0; a.volume = (key==='bg')? 0.12 : 1.0; a.play(); }catch(e){}
}

function confettiBurst(){
  try{
    const container = document.createElement('div'); container.className='confetti'; document.body.appendChild(container);
    for(let i=0;i<24;i++){
      const el = document.createElement('div'); el.className='c'; el.style.background = ['#ff6fb5','#ffd36a','#9ad6ff','#7ef0cb'][Math.floor(Math.random()*4)];
      el.style.left = Math.random()*100 + '%'; el.style.top = '0'; el.style.width = (6+Math.random()*8) + 'px'; el.style.height = (10+Math.random()*12) + 'px';
      container.appendChild(el);
      el.animate([{transform:'translateY(0) rotate(0)'},{transform:`translateY(${150+Math.random()*300}px) rotate(${Math.random()*720}deg)`}], {duration:1000+Math.random()*800});
      setTimeout(()=>el.remove(), 1800);
    }
    setTimeout(()=>container.remove(), 2000);
  }catch(e){}
}

// Ask functions
function askSingle(op){
  const q = makeSingle(op, window.STATE.level);
  currentQuestion = q;
  renderQuestion(q, false);
  if(window.STATE.musicOn) playSound('bg');
}

function askCombined(){
  const q = makeCombined(window.STATE.level);
  currentQuestion = q;
  renderQuestion(q, true);
  if(window.STATE.musicOn) playSound('bg');
}

// UI hookup
document.querySelectorAll('.op').forEach(b=> b.addEventListener('click', ()=>{
  const op = b.dataset.op;
  window.STATE.op = op; window.STATE.mixed = (op === 'ترکیبی');
  document.getElementById('mode-badge').textContent = window.STATE.mixed? 'وضعیت: ترکیبی' : `وضعیت: ${op}`;
  window.STATE.idx = 0; window.STATE.score = 0; document.getElementById('score').textContent = toPersianNumber(0);
  if(window.STATE.mixed) askCombined(); else askSingle(op);
}));
document.querySelectorAll('.lvl').forEach(b=> b.addEventListener('click', ()=>{
  document.querySelectorAll('.lvl').forEach(x=> x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true');
  const lvl = b.dataset.lvl; window.STATE.level = lvl; document.getElementById('level-badge').textContent = `سطح: ${lvl}`;
}));
document.getElementById('btn-next').addEventListener('click', ()=>{
  if(!window.STATE.op){ document.getElementById('feedback').textContent = 'اول یکی از عملیات را انتخاب کن.'; return; }
  if(window.STATE.mixed) askCombined(); else askSingle(window.STATE.op);
});
document.getElementById('btn-exam').addEventListener('click', ()=>{
  if(!window.STATE.op && !window.STATE.mixed){ document.getElementById('feedback').textContent = 'اول یکی از عملیات را انتخاب کن.'; return; }
  window.STATE.examMode = true; window.STATE.idx = 0; window.STATE.score = 0; document.getElementById('score').textContent = toPersianNumber(0);
  if(window.STATE.mixed) askCombined(); else askSingle(window.STATE.op);
});
document.getElementById('btn-sound').addEventListener('click', ()=>{ window.STATE.soundOn = !window.STATE.soundOn; document.getElementById('btn-sound').setAttribute('aria-pressed', window.STATE.soundOn); document.getElementById('btn-sound').textContent = window.STATE.soundOn? '🔊' : '🔇'; });
document.getElementById('btn-music').addEventListener('click', ()=>{ window.STATE.musicOn = !window.STATE.musicOn; document.getElementById('btn-music').setAttribute('aria-pressed', window.STATE.musicOn); document.getElementById('btn-music').textContent = window.STATE.musicOn? '🎵' : '🎵'; if(window.STATE.musicOn) playSound('bg'); else { try{ audioEls.bg.pause(); audioEls.bg.currentTime=0; }catch(e){} } });
window.addEventListener('load', ()=>{ document.getElementById('qtext').focus(); document.getElementById('score').textContent = toPersianNumber(0); if(window.STATE.musicOn) playSound('bg'); });
