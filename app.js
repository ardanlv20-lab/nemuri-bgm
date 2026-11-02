const $=s=>document.querySelector(s),LS=localStorage;
const st={cat:LS.cat||null,timer:+LS.timer||0,vol:LS.vol?+LS.vol:60,shuf:LS.shuf==='1'};
let errRun=0,P=null,ready=false,queue=[],qi=0,endAt=0,fading=false,fadeStart=0;
window.TIMER_UNIT=60000;window.FADE_MS=60000; // test hooks
const TIMERS=[[0,'オフ'],[15,'15分'],[30,'30分'],[60,'1時間'],[120,'2時間']];
CATS.forEach(c=>{const b=document.createElement('button');b.textContent=c.icon+' '+c.name;b.dataset.id=c.id;b.onclick=()=>pick(c.id,true);$('#cats').append(b)});
TIMERS.forEach(([m,l])=>{const b=document.createElement('button');b.textContent=l;b.dataset.m=m;b.onclick=()=>setTimer(m);$('#timers').append(b)});
$('#vol').value=st.vol;$('#vol').oninput=e=>{st.vol=+e.target.value;LS.vol=st.vol;if(ready&&!fading)P.setVolume(st.vol)};
$('#shuf').onclick=()=>{st.shuf=!st.shuf;LS.shuf=st.shuf?'1':'0';ui();if(st.cat)build()};
$('#play').onclick=()=>{if(!ready)return;if(!st.cat)return pick(CATS[0].id,true);const s=P.getPlayerState();if(s===1||s===3)P.pauseVideo();else{P.setVolume(st.vol);P.playVideo()}};
$('#next').onclick=()=>next();
$('#dim').onclick=()=>document.body.classList.add('dim');$('#dimoff').onclick=()=>document.body.classList.remove('dim');
function cat(){return CATS.find(c=>c.id===st.cat)}
function build(){queue=cat().v.slice();if(st.shuf)queue.sort(()=>Math.random()-.5);qi=0}
function pick(id,play){errRun=0;st.cat=id;LS.cat=id;build();ui();if(play)load()}
function load(){if(!ready)return;const v=queue[qi];P.setVolume(fading?P.getVolume():st.vol);P.loadVideoById(v[0]);$('#now').textContent='♪ '+v[1]+' — '+v[2]}
function next(){if(!queue.length)return;qi=(qi+1)%queue.length;load()}
function setTimer(m){st.timer=m;LS.timer=m;endAt=m?Date.now()+m*TIMER_UNIT:0;fading=false;if(ready)P.setVolume(st.vol);ui()}
function ui(){document.querySelectorAll('#cats button').forEach(b=>b.classList.toggle('on',b.dataset.id===st.cat));
document.querySelectorAll('#timers button').forEach(b=>b.classList.toggle('on',+b.dataset.m===st.timer));$('#shuf').textContent='🔀 シャッフル: '+(st.shuf?'オン':'オフ')}
function fmt(ms){const s=Math.ceil(ms/1000);return Math.floor(s/3600)+':'+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function tick(){if(!endAt){$('#remain').textContent='';return}const now=Date.now();
 if(now<endAt){$('#remain').textContent='残り '+fmt(endAt-now);return}
 if(!fading){fading=true;fadeStart=now}const p=Math.min(1,(now-fadeStart)/FADE_MS);
 $('#remain').textContent='フェードアウト中…';if(ready)P.setVolume(Math.round(st.vol*(1-p)));
 if(p>=1){if(ready)P.pauseVideo();endAt=0;fading=false;st.timer=0;LS.timer=0;$('#remain').textContent='タイマー終了';setTimeout(()=>{if(ready)P.setVolume(st.vol)},500);ui();window.__timerDone=true}}
setInterval(tick,250);
window.onYouTubeIframeAPIReady=()=>{P=new YT.Player('player',{width:'100%',height:'100%',playerVars:{playsinline:1,rel:0},events:{
 onReady:()=>{ready=true;window.__ready=true;P.setVolume(st.vol);if(st.cat){$('#now').textContent='前回: '+cat().name+'（▶で再生）'}},
 onStateChange:e=>{if(e.data===1)errRun=0;if(e.data===0)next();$('#play').textContent=(e.data===1)?'⏸ 一時停止':'▶ 再生'},
 onError:e=>{window.__errors=(window.__errors||[]).concat([[queue[qi]&&queue[qi][0],e.data]]);errRun++;if(errRun>=queue.length){errRun=0;$('#now').textContent='再生できませんでした。ネット接続を確認してください';return}setTimeout(next,800)}}})};
if(st.cat&&cat())build();else st.cat=null;ui();if(st.timer)setTimer(st.timer);
window.__app={pick,setTimer,st,get P(){return P},get queue(){return queue}};
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
