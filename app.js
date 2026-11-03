const initialClips = [{"id": "clip-13", "duration": 60.0, "title": "风里的小暖阳", "category": "音乐"}, {"id": "clip-14", "duration": 141.0, "title": "掌心的小星光", "category": "音乐"}, {"id": "clip-01", "duration": 15.04, "title": "森林里的小旅行", "category": "奇妙小世界"}, {"id": "clip-02", "duration": 10.1, "title": "和小兔子一起玩", "category": "日常与玩耍"}, {"id": "clip-03", "duration": 10.1, "title": "跟着节奏跳起来", "category": "舞蹈与音乐"}, {"id": "clip-04", "duration": 10.1, "title": "小小芭蕾舞者", "category": "舞蹈与音乐"}, {"id": "clip-05", "duration": 10.1, "title": "森林里的奇遇", "category": "奇妙小世界"}, {"id": "clip-06", "duration": 10.1, "title": "和熊猫一起跳舞", "category": "舞蹈与音乐"}, {"id": "clip-07", "duration": 10.1, "title": "小小功夫家", "category": "奇妙小世界"}, {"id": "clip-08", "duration": 10.1, "title": "出发，奇妙世界", "category": "奇妙小世界"}, {"id": "clip-09", "duration": 10.1, "title": "小小鼓手", "category": "舞蹈与音乐"}, {"id": "clip-10", "duration": 10.1, "title": "可爱就在这一刻", "category": "日常与玩耍"}, {"id": "clip-11", "duration": 10.1, "title": "热闹的小舞台", "category": "舞蹈与音乐"}, {"id": "clip-12", "duration": 10.1, "title": "吃得好开心", "category": "日常与玩耍"}];

const dialog=document.querySelector('#player'),video=document.querySelector('#video');
const loading=document.querySelector('#loading'),error=document.querySelector('#error'),musicControls=document.querySelector('#music-controls'),loopMode=document.querySelector('#loop-mode');
const clips=[...initialClips];
let activeId=null,opener=null,currentFilter='全部',playbackFilter='全部',loadTimer=null,loadVersion=0,retryTime=0;
const byId=id=>clips.find(c=>c.id===id);
function toast(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),3500)}
function source(c){return 'media/'+c.id+'.mp4'}
function poster(c){return 'media/'+c.id+'.jpg'}
function clearLoading(){clearTimeout(loadTimer);loading.hidden=true}
function showFailure(){if(!dialog.open||!video.getAttribute('src'))return;clearLoading();error.hidden=false}
function showLoading(){if(!dialog.open||!error.hidden)return;loading.textContent='正在加载视频…';loading.hidden=false;clearTimeout(loadTimer);loadTimer=setTimeout(showFailure,20000)}
function playVideo(){const version=loadVersion;const result=video.play();if(result)result.catch(e=>{if(version!==loadVersion||!dialog.open||e.name==='AbortError')return;if(e.name==='NotAllowedError'){clearTimeout(loadTimer);loading.textContent='点击视频上的播放按钮开始';loading.hidden=false}else showFailure()})}
function updateLoop(){video.loop=byId(activeId)?.category==='音乐'&&loopMode.value==='single'}
function loadClip(autoplay){loadVersion++;clearLoading();error.hidden=true;video.pause();video.poster=poster(byId(activeId));video.src=source(byId(activeId));document.querySelector('#direct').href=video.src;updateLoop();showLoading();video.load();if(autoplay)playVideo()}
function openClip(id,autoplay=true,filter=currentFilter){const c=byId(id);if(!c)return;activeId=id;playbackFilter=filter;retryTime=0;document.querySelector('#player-title').textContent=c.title;const seconds=Math.floor(c.duration);document.querySelector('#player-detail').textContent=c.category+' · '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');musicControls.hidden=c.category!=='音乐';if(!dialog.open){opener=document.activeElement;dialog.showModal();document.body.classList.add('playing')}history.replaceState(null,'','#video='+id);loadClip(autoplay)}
function cleanup(){if(dialog.open)return;loadVersion++;clearLoading();error.hidden=true;video.pause();video.removeAttribute('src');video.load();document.body.classList.remove('playing');if(location.hash.startsWith('#video='))history.replaceState(null,'',location.pathname+location.search);opener?.focus()}
dialog.addEventListener('close',cleanup);document.querySelector('#close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
document.querySelector('.grid').addEventListener('click',e=>{const a=e.target.closest('.clip');if(a){e.preventDefault();openClip(a.dataset.id)}});
function playlist(filter=playbackFilter){return clips.filter(c=>filter==='全部'||c.category===filter)}
document.querySelector('#random').onclick=()=>{const list=playlist(currentFilter);if(list.length)openClip(list[Math.floor(Math.random()*list.length)].id)};
function step(delta,filter=playbackFilter){const list=playlist(filter);if(!list.length)return;const n=list.findIndex(c=>c.id===activeId);openClip(list[(Math.max(0,n)+delta+list.length)%list.length].id,true,filter)}
document.querySelector('#prev').onclick=()=>step(-1);document.querySelector('#next').onclick=()=>step(1);
loopMode.onchange=updateLoop;
video.addEventListener('ended',()=>{if(dialog.open&&byId(activeId)?.category==='音乐'&&loopMode.value==='list')step(1,'音乐')});
video.addEventListener('loadstart',showLoading);video.addEventListener('waiting',showLoading);video.addEventListener('stalled',showLoading);
for(const name of ['loadeddata','canplay','playing'])video.addEventListener(name,()=>{if(video.readyState>=2){clearLoading();error.hidden=true}});
video.addEventListener('loadedmetadata',()=>{if(retryTime>0){video.currentTime=Math.min(retryTime,Math.max(0,video.duration-.1));retryTime=0}});
video.addEventListener('error',showFailure);
document.querySelector('#retry').onclick=()=>{if(!activeId)return;retryTime=Number.isFinite(video.currentTime)?video.currentTime:0;loadClip(true)};
async function share(current){const url=new URL(location.href);url.hash=current?'video='+activeId:'';const title=current?byId(activeId).title:'女儿的视频相册';try{if(navigator.share){await navigator.share({title,url:url.href});return}await navigator.clipboard.writeText(url.href);toast('链接已复制，可以发给亲友了')}catch(e){if(e.name!=='AbortError'){try{await navigator.clipboard.writeText(url.href);toast('链接已复制')}catch{window.prompt('复制这个链接分享给亲友',url.href)}}}}
document.querySelector('#share').onclick=()=>share(false);document.querySelector('#share-video').onclick=()=>share(true);
function applyFilter(){let count=0;document.querySelectorAll('.clip').forEach(a=>{a.hidden=currentFilter!=='全部'&&currentFilter!==a.dataset.category;if(!a.hidden)count++});document.querySelector('#count').textContent=(currentFilter==='全部'?'全部':currentFilter)+' '+count+' 段视频，点开就是好时光。';const collection=document.querySelector('.collection');collection.firstChild.textContent=clips.length+' 段视频';document.querySelectorAll('[data-filter]').forEach(b=>{const selected=b.dataset.filter===currentFilter;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))})}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{currentFilter=b.dataset.filter;applyFilter()});
let observer;if('IntersectionObserver' in window){observer=new IntersectionObserver(items=>items.forEach(i=>{if(i.isIntersecting){i.target.classList.add('arrived');observer.unobserve(i.target)}}),{threshold:.05});document.querySelectorAll('.reveal').forEach(e=>observer.observe(e))}

function readHash(){if(location.hash.startsWith('#video=')){const id=location.hash.slice(7),c=byId(id);if(c&&(!dialog.open||activeId!==id))openClip(id,false,c.category)}}
readHash();addEventListener('hashchange',readHash);
