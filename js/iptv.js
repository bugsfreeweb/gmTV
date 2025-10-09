// Feather Icons setup and helpers
function runFeather(){ if(window.feather) feather.replace(); }
document.addEventListener('DOMContentLoaded', runFeather);
function updateIcons() { setTimeout(runFeather, 20); }
function focusLargeBtns() {
  document.querySelectorAll('[role="button"]').forEach(btn=>{
    btn.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' ')btn.click();
    });
    btn.setAttribute('tabindex','0');
  });
}
function showSnackbar(txt, type="") {
  let s = document.getElementById('snackbar');
  s.textContent = txt;
  s.style.background = type==='success'? 'var(--success)' : type==='warn'? 'var(--warn)' : type==='error'? 'var(--error)' : 'var(--snackbar)';
  s.classList.add('show'); setTimeout(()=>s.classList.remove('show'), 1900);
}

// Theme toggling
const themes = ['dark', 'light', 'purple', 'green'];
let curTheme = localStorage.getItem('iptvTheme') || 'dark';
function setTheme(mode) {
  themes.forEach(t => document.body.classList.toggle('theme-'+t, t===mode));
  curTheme=mode;
  document.getElementById('theme-switch-btn').firstElementChild.setAttribute('data-feather', mode==='light' ? 'sun' : mode==='purple'? 'droplet' : mode==='green'? 'activity': 'moon');
  localStorage.setItem('iptvTheme',mode);
  updateIcons();
}
document.getElementById('theme-switch-btn').onclick=function(){
  let idx = themes.indexOf(curTheme); setTheme(themes[(idx+1)%themes.length]);
};
setTheme(curTheme);
focusLargeBtns();

// DOM element references
const videoPlayer = document.getElementById('video-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const muteBtn = document.getElementById('mute-btn');
const volumeSlider = document.getElementById('volume-slider');
const progressSlider = document.getElementById('progress-slider');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const currentChannel = document.getElementById('current-channel');
const playerStatus = document.getElementById('player-status');
const playlistSlider = document.getElementById('playlist-slider');
const showPlaylistBtn = document.getElementById('show-playlist-slider-btn');
const closePlaylistBtn = document.getElementById('close-playlist-slider-btn');
const channelsList = document.getElementById('channels-list');
const playerArea = document.getElementById('iptv-player-area');
const playlistDropdownWrap = document.getElementById('playlist-dropdown-wrap');
const playlistDropdownCurrent = document.getElementById('playlist-dropdown-current');
const playlistDropdownList = document.getElementById('playlist-dropdown-list');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const bar = document.getElementById('default-playlist-bar');
const uploadPanelBg = document.getElementById('upload-panel-bg');
const uploadPanel = document.getElementById('upload-panel');
const showUploadPanelBtn = document.getElementById('show-upload-panel-btn');
const closeUploadPanelBtn = document.getElementById('close-upload-panel-btn');
const fileUploadInput = document.getElementById('file-upload-input');
const fileUploadLabel = document.getElementById('file-upload-label');
const urlUploadInput = document.getElementById('url-upload-input');
const uploadUrlBtn = document.getElementById('upload-url-btn');
const uploadProgressBar = document.getElementById('upload-progress-bar');
const uploadProgressFill = document.getElementById('upload-progress-bar-fill');
const playlistCounts = document.getElementById('playlist-counts');
const historyBtn = document.getElementById('history-btn');
const favoriteBtn = document.getElementById('favorite-mode-btn');
const historyModalBg = document.getElementById('history-modal-bg');
const historyListDiv = document.getElementById('history-list');
const clearAllHistoryBtn = document.getElementById('clear-all-history');
const noticeOverlay = document.getElementById('notice-overlay');
const noticeTextMsg = document.getElementById('notice-text-msg');
const noticeActions = document.getElementById('notice-actions');

let sliderOpen = false, barHideT = null, hls = null, dash = null;
let channels = [], allChannels = [], isFavoriteMode = false, currentPlayingChannel = null;
let favorites = JSON.parse(localStorage.getItem("iptvFavorites")||'[]');
let uploadHistory = JSON.parse(localStorage.getItem('iptvUploadHistory')||'[]');
let playlistCache = JSON.parse(localStorage.getItem("iptvPlaylists")||"{}");

function savePlaylistOffline(key,txt) {
  playlistCache[key]=txt;
  localStorage.setItem("iptvPlaylists",JSON.stringify(playlistCache));
}
window.addEventListener('offline',()=>{ showSnackbar("Offline: Local playlists available",'warn'); });

// Default demo playlists (updated to working iptv-org streams as of 2025)
let defaultListIcons = [
  {val:'demo1',icon:'<i data-feather="tv"></i>', m3u:"https://iptv-org.github.io/iptv/countries/br.m3u"},
  {val:'demo2',icon:'<i data-feather="video"></i>', m3u:"https://iptv-org.github.io/iptv/categories/sports.m3u"},
  {val:'demo3',icon:'<i data-feather="film"></i>', m3u:"https://iptv-org.github.io/iptv/categories/movies.m3u"}
];
let selectedPlaylistIdx = 0;
playlistDropdownCurrent.onclick=function(){
  playlistDropdownList.classList.toggle('open'); updateIcons();
};
document.addEventListener('mousedown',function(e){
  if(!playlistDropdownWrap.contains(e.target)) playlistDropdownList.classList.remove('open');
});
function selectDefaultPlaylist(idx,auto) {
  Array.from(playlistDropdownList.children).forEach((el,i)=>{ el.classList.toggle('selected',i===idx); });
  playlistDropdownCurrent.innerHTML = defaultListIcons[idx].icon;
  selectedPlaylistIdx = idx;
  playlistDropdownList.classList.remove('open');
  updateIcons();
  if(!auto)loadDefaultPlaylist(idx);
}
Array.from(playlistDropdownList.children).forEach((el,i)=>{ el.onclick=function(){selectDefaultPlaylist(i,false);} });
function loadDefaultPlaylist(idx) {
  let m3uUrl = defaultListIcons[idx].m3u;
  noticeShow("Playlist loaded. Choose a channel or upload your own.<br><div class='notice-actions'></div>");
  loadingOverlay.style.display='flex';loadingText.textContent="Loading channel list...";
  channels = []; allChannels = []; renderChannels();
  fetch(m3uUrl).then(resp=>{
    if(!resp.ok)throw new Error('Network error');
    return resp.text();
  }).then(txt=>{
    allChannels = channels = parsePlaylist(txt); renderChannels();
    savePlaylistOffline(defaultListIcons[idx].val,txt);
    loadingOverlay.style.display='none'; playerStatus.textContent='Loaded';
    autoPlayFirstChannel();
  }).catch(err=>{
    loadingOverlay.style.display='none';
    noticeShow("Failed to load playlist: "+err.message); renderChannels();
    playerStatus.textContent='Failed: '+(err.message||'Error loading');
  });
  updateIcons();
}
selectDefaultPlaylist(selectedPlaylistIdx,true);
const openSlider = ()=>{playlistSlider.classList.add('open');sliderOpen=true;updateIcons()}
const closeSlider = ()=>{playlistSlider.classList.remove('open');sliderOpen=false;updateIcons()}
showPlaylistBtn.onclick = openSlider;
closePlaylistBtn.onclick = closeSlider;
playerArea.onclick = (e)=>{
  if(e.target.closest('.player-controls')||e.target.closest('.default-playlist-bar')||e.target.closest('.playlist-slider'))return;
  sliderOpen?closeSlider():openSlider();
}
document.querySelector('.player-container').onclick = e=>e.stopPropagation();
showUploadPanelBtn.onclick = () => {
  noticeHide(); uploadPanelBg.classList.add('open'); urlUploadInput.value='';
  uploadProgressBar.style.display='none'; updateIcons();
};
closeUploadPanelBtn.onclick = ()=>{uploadPanelBg.classList.remove('open');updateIcons()}
uploadPanelBg.onclick = (e)=>{if(e.target===uploadPanelBg)uploadPanelBg.classList.remove('open');updateIcons()}
fileUploadLabel.onclick = ()=>fileUploadInput.click();
fileUploadInput.onchange = e=>handlePlaylistUpload(e.target.files,'file');
uploadPanel.ondragover = (e)=>{e.preventDefault();uploadPanel.classList.add('drag');}
uploadPanel.ondragleave = (e)=>{e.preventDefault();uploadPanel.classList.remove('drag');}
uploadPanel.ondrop = function(e){
  e.preventDefault();uploadPanel.classList.remove('drag');
  handlePlaylistUpload(e.dataTransfer.files,'file');
}
function handlePlaylistUpload(fileList,type) {
  let f = fileList[0];
  if (!f) return;
  fileUploadInput.value = null;
  const CHUNK = 2 * 1024 * 1024;
  let pos = 0, txt = "";
  let reader = new FileReader();
  uploadProgressBar.style.display = 'block';
  uploadProgressFill.style.width = '0%';
  reader.onload = function(ev) {
    txt += ev.target.result;
    pos += CHUNK;
    uploadProgressFill.style.width = Math.min((pos / f.size) * 100, 100).toFixed(1) + '%';
    if (pos < f.size) {
      readChunk();
    } else {
      allChannels = channels = parsePlaylist(txt);
      renderChannels();
      savePlaylistOffline(f.name, txt);
      uploadPanelBg.classList.remove('open');
      noticeShow("Playlist loaded.<br>Select a channel to start playback.");
      addUploadHistory({ type: 'file', name: f.name, date: Date.now() }, txt);
      autoPlayFirstChannel();
      updateIcons();
    }
  };
  function readChunk() {
    let end = Math.min(pos + CHUNK, f.size);
    reader.readAsText(f.slice(pos, end));
  }
  readChunk();
}
uploadUrlBtn.onclick=(e)=>{
  e.preventDefault(); let url = urlUploadInput.value.trim();
  if(!url)return;
  loadingOverlay.style.display='flex';loadingText.textContent='Loading...';
  fetch(url).then(resp=>{
    if(resp.ok)return resp.text(); throw new Error("Network error");
  }).then(txt=>{
    allChannels = channels = parsePlaylist(txt); renderChannels();
    let lastpart = url.replace(/\/$/,'').split('/').slice(-1)[0].slice(0,64);
    savePlaylistOffline(lastpart, txt);
    uploadPanelBg.classList.remove('open'); loadingOverlay.style.display='none';
    noticeShow("Playlist loaded.<br>Select a channel to start playback."); autoPlayFirstChannel();
    addUploadHistory({type:'url',name:lastpart, url:url, date:Date.now()}, txt);
    updateIcons();
  }).catch(err=>{
    loadingOverlay.style.display='none'; noticeShow("Failed to load: "+err.message); showSnackbar("Failed to load playlist",'error'); updateIcons();
  });
}
function addUploadHistory(info, txt) {
  uploadHistory = (JSON.parse(localStorage.getItem('iptvUploadHistory')||'[]'));
  if (txt && txt.length < 400000) {  // up to ~400kb per playlist
    info.txt = txt;
  } else if (info.type === 'file' && info.name && txt) {
    savePlaylistOffline(info.name, txt);
    info.cacheKey = info.name;
  } else if (info.type === 'url' && info.url && txt) {
    let lastpart = info.url.replace(/\/$/, '').split('/').slice(-1)[0];
    savePlaylistOffline(lastpart, txt);
    info.cacheKey = lastpart;
  }
  uploadHistory.push(info);
  if(uploadHistory.length>120)uploadHistory = uploadHistory.slice(-120);
  localStorage.setItem('iptvUploadHistory',JSON.stringify(uploadHistory));
}
function parsePlaylist(content) {
  let ext = (content.slice(0,150).toLowerCase().includes('#extm3u')||content.match(/#EXTINF/i)) ? 'm3u' : '';
  let lines = content.split('\n'); const out=[]; let ch=null, index = 0;
  for(let i=0,N=lines.length;i<N;i++) {
    let l=lines[i].trim();
    if(ext==='m3u' && l.startsWith('#EXTINF')) {
      const lastComma = l.lastIndexOf(',');
      const name = lastComma > 0 ? l.substring(lastComma + 1).trim() : 'Unknown';
      const tvg = /tvg-name="([^"]+)"/.exec(l)?.[1]||null;
      const group = /group-title="([^"]+)"/.exec(l)?.[1]||null;
      const logo = /tvg-logo="([^"]+)"/.exec(l)?.[1]||null;
      ch={id:'ch_'+(++index),name:tvg||name,category:group||'General',logo:logo||null,url:null};
    } else if((l.startsWith('http')||l.match(/\.(m3u8|mp4|ts|hls|mpd)$/i))&&ch) {
      ch.url=l; out.push(ch); ch=null;
    }
  }
  if(!out.length && lines.length>=1) {
    lines.forEach(line=>{
      let l=line.trim();
      if(l.match(/^(http|https):\/\/.+(\.m3u8|\.mp4|\.mpd|\.ts|\.hls)(\?.*)?$/i)){
        out.push({id:"custom_"+(out.length+1),name:"Custom "+(out.length+1),category:"Custom",logo:null,url:l});
      }
    });
  }
  return out;
}
function renderChannels() {
  let displayChannels = isFavoriteMode ? allChannels.filter(c=>favorites.some(f=>f.url===c.url)) : allChannels;
  channels = displayChannels;
  channelsList.innerHTML='';
  let total = channels.length,online=0;
  if(!channels.length) {
    channelsList.innerHTML = `<div class="empty-list"><i data-feather="slash"></i>
      <h4>${isFavoriteMode?'No favorite channels':'No channels loaded'}</h4>
      <p>${isFavoriteMode?'':'Select or upload a playlist above.'}</p></div>`;
    playlistCounts.textContent = `Total: 0 | Online: 0`; updateIcons(); return;
  }
  let fallbackLogo = 'https://bugsfreecdn.netlify.app/BugsfreeDefault/logo.png';
  let f = document.createDocumentFragment();
  channels.forEach(function(channel){
    let isFav = !!favorites.find(f=>f.url===channel.url);
    const el=document.createElement('div');
    el.className='channel-item'; el.dataset.id=channel.id;
    const url = channel.url||''; let isOnline = !url.match(/error|invalid|\.(jpg|png|gif|bmp|jpeg)$/i); if(isOnline) online++;
    let logoURL = channel.logo ? channel.logo : fallbackLogo;
    el.innerHTML=`
      <div class="channel-logo"><img src="${logoURL}" alt="${channel.name}"></div>
      <div class="channel-details">
        <div class="channel-name">${channel.name}</div>
        <div class="channel-category">${channel.category}</div>
      </div>
      <i data-feather="star" class="favorite-icon-channel ${isFav?'':'fav-no'}" title="Favorite"></i>
    `;
    el.querySelector('.favorite-icon-channel').onclick = e=>{
      e.stopPropagation();
      if(isFav){
        favorites=favorites.filter(f=>f.url!==channel.url); showSnackbar("Removed from favorites",'warn');
      }else{
        favorites.push({url:channel.url,name:channel.name,category:channel.category,logo:channel.logo});
        showSnackbar("Added to favorites",'success');
      }
      localStorage.setItem("iptvFavorites",JSON.stringify(favorites));
      renderChannels();
    };
    el.onclick = ()=>selectAndPlayChannel(channel);
    f.appendChild(el);
  });
  channelsList.appendChild(f);
  playlistCounts.textContent = `Total: ${channels.length} | Online: ${online}`; updateIcons();
}
function selectAndPlayChannel(channel) { playChannel(channel); noticeHide(); }
function playChannel(channel) {
  if(!channel?.url){return;}
  currentPlayingChannel = channel;
  loadingOverlay.style.display='flex';loadingText.textContent='Loading: '+(channel.name||"Playing...");
  playerStatus.textContent='Connecting...';
  currentChannel.textContent=channel.name||'Playing Channel...';
  document.querySelectorAll('.channel-item.active').forEach(el=>el.classList.remove('active'));
  const newEl = document.querySelector(`[data-id="${channel.id}"]`);
  if(newEl) newEl.classList.add('active');
  if(hls){hls.destroy();hls=null;} if(dash){dash.reset();dash=null;}
  const url=channel.url;
  if(url.match(/\.mpd$/i)){
    dash = dashjs.MediaPlayer().create();
    dash.initialize(videoPlayer,url,true);
    loadingOverlay.style.display='none';playerStatus.textContent='DASH Playing';
  } else if(url.match(/\.(m3u8|hls?|ts)$/i)) {
    hls = new Hls(); hls.attachMedia(videoPlayer); hls.loadSource(url);
    hls.on(Hls.Events.MANIFEST_PARSED,()=>{videoPlayer.play().catch(e=>{showSnackbar("Autoplay failed: "+e.message,'error');});playerStatus.textContent='Now Playing';loadingOverlay.style.display='none';});
    hls.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal)playerStatus.textContent='Error: '+data.type;});
  } else if(url.match(/\.(mp4)$/i)) {
    videoPlayer.src=url; videoPlayer.load(); videoPlayer.play().catch(e=>{showSnackbar("Playback failed: "+e.message,'error');});
    loadingOverlay.style.display='none';playerStatus.textContent='Now Playing (MP4)';
  } else {
    videoPlayer.src=url; videoPlayer.load(); videoPlayer.play().catch(e=>{showSnackbar("Playback failed: "+e.message,'error');});
    loadingOverlay.style.display='none';playerStatus.textContent='Playing';
  }
  updateIcons();
}
videoPlayer.onplay=videoPlayer.onpause=function(){playPauseBtn.innerHTML=`<i data-feather="${videoPlayer.paused?'play':'pause'}"></i>`; updateIcons();}
videoPlayer.onvolumechange = function(){
  muteBtn.innerHTML=`<i data-feather="${videoPlayer.muted?'volume-x':'volume-2'}"></i>`;
  volumeSlider.value = videoPlayer.volume;
  updateIcons();
};
videoPlayer.ontimeupdate = function() {
  if (videoPlayer.duration) {
    progressSlider.value = (videoPlayer.currentTime / videoPlayer.duration) * 100;
  }
};
progressSlider.oninput = function() {
  if (videoPlayer.duration) {
    videoPlayer.currentTime = (this.value / 100) * videoPlayer.duration;
  }
};
playPauseBtn.onclick = () => {videoPlayer.paused?videoPlayer.play():videoPlayer.pause();}
muteBtn.onclick = () => {
  videoPlayer.muted=!videoPlayer.muted;
  updateIcons();
}
volumeSlider.oninput = function(){videoPlayer.volume=this.value;}
fullscreenBtn.onclick = () => {
  if(!document.fullscreenElement){videoPlayer.requestFullscreen?.();}
  else{document.exitFullscreen?.();}
}
function noticeShow(txt='',opts={}) {
  noticeTextMsg.innerHTML = txt||""; noticeOverlay.style.display='block'; noticeActions.innerHTML = "";
  if(opts.upload) {
    let btn = document.createElement('button');btn.innerHTML='<i data-feather="upload"></i> Upload Playlist';
    btn.onclick = ()=>{noticeHide();showUploadPanelBtn.click();}; noticeActions.appendChild(btn);
  }
  if(opts.history) {
    let btn = document.createElement('button');btn.innerHTML='<i data-feather="clock"></i> Show Upload History';
    btn.onclick = ()=>{noticeHide();historyBtn.click();}; noticeActions.appendChild(btn);
  }
  if(opts.extra) noticeActions.appendChild(opts.extra);
  updateIcons();
}
function noticeHide(){noticeOverlay.style.display='none';}
favoriteBtn.onclick = ()=>{
  isFavoriteMode=!isFavoriteMode;favoriteBtn.classList.toggle("favorite-mode-on",isFavoriteMode); renderChannels(); updateIcons();
};
function autoPlayFirstChannel() { if (channels && channels.length > 0) setTimeout(()=> playChannel(channels[0]),400); }
function renderHistory() {
  historyListDiv.innerHTML='';
  uploadHistory = JSON.parse(localStorage.getItem('iptvUploadHistory')||'[]');
  if(!uploadHistory.length){
    historyListDiv.innerHTML='<div style="color:#aac6ff;text-align:center;">No upload history yet.</div>'; updateIcons(); return;
  }
  uploadHistory.slice().reverse().forEach((item,idx)=>{
    let date = new Date(item.date);
    let dstr = date.toLocaleDateString()+' '+date.toLocaleTimeString().replace(/:\d+\s/,' ');
    let baseName = item.type==="file" ? item.name : (item.name||"external");
    let meta = item.type==="url" ? `<span title="${item.url}" style="color:#a3d1fb;font-size:.91em;"> [URL]</span>`:"";
    let li = document.createElement('div');
    li.className = 'history-item';
    li.innerHTML =
      `<span>${baseName}${meta}</span>
      <span class='history-dt'>${dstr}</span>
      <button class="history-play-btn" data-hidx="${uploadHistory.length-idx-1}" title="Resync"><i data-feather="play-circle"></i></button>
      <button class="history-del-btn" data-hidx="${uploadHistory.length-idx-1}" title="Delete"><i data-feather="x"></i></button>`;
    historyListDiv.appendChild(li);
  });
  addHistoryBtnHandlers();
  addHistoryPlayHandlers();
  updateIcons();
}
clearAllHistoryBtn.onclick=function(){
  if(confirm('Delete all upload history?')){
    localStorage.removeItem('iptvUploadHistory');
    uploadHistory=[]; renderHistory();
  }
};
historyBtn.onclick = function(){renderHistory();historyModalBg.classList.add('open');updateIcons();}
historyModalBg.onclick = e=>{if(e.target===historyModalBg)historyModalBg.classList.remove('open');updateIcons()}
function addHistoryBtnHandlers() {
  Array.from(document.querySelectorAll('.history-del-btn')).forEach(btn=>{
    btn.onclick = function(){
      let idx = parseInt(this.getAttribute('data-hidx'));
      uploadHistory.splice(idx,1);
      localStorage.setItem('iptvUploadHistory',JSON.stringify(uploadHistory));
      renderHistory();
    }
  });
}
function addHistoryPlayHandlers() {
  Array.from(document.querySelectorAll('.history-play-btn')).forEach(btn=>{
    btn.onclick = function(){
      let idx = parseInt(this.getAttribute('data-hidx'));
      let hist = uploadHistory[idx];
      let txt = hist.txt;
      if (!txt && hist.cacheKey && playlistCache[hist.cacheKey]) {
        txt = playlistCache[hist.cacheKey];
      }
      if (!txt) {
        showSnackbar("Playlist file/data not found.", 'warn');
        return;
      }
      allChannels = channels = parsePlaylist(txt);
      renderChannels();
      playerStatus.textContent = 'Resynced from history';
      autoPlayFirstChannel();
      noticeShow("Playlist loaded from history.<br>Select a channel or play directly.");
      if(hist.cacheKey && playlistCache[hist.cacheKey]) {
        savePlaylistOffline(hist.cacheKey, txt);
      }
      updateIcons();
    }
  });
}
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    noticeHide();
    if(historyModalBg.classList.contains('open')) historyModalBg.classList.remove('open');
    if(uploadPanelBg.classList.contains('open')) uploadPanelBg.classList.remove('open');
    updateIcons();
  }

  // Keyboard shortcut to change channel left/right
  if((e.key === "ArrowRight" || e.key === "ArrowLeft") && (channels.length > 1 || allChannels.length > 1) && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
    let activeChannels = channels.length > 1 ? channels : allChannels; // Fallback to all if favorites too small
    let idx = currentPlayingChannel ? activeChannels.findIndex(c => c.url === currentPlayingChannel.url) : -1;
    if (idx === -1) idx = 0;
    let dir = e.key === "ArrowRight" ? 1 : -1;
    let nextIdx = (idx + dir + activeChannels.length) % activeChannels.length;
    playChannel(activeChannels[nextIdx]);
    showHeaderBarForAWhile();
    e.preventDefault();
  }
});
document.addEventListener('DOMContentLoaded',()=>{
  currentChannel.textContent="";playerStatus.textContent="";
  noticeShow(
    'Welcome!<br><br>'+
    'Please <b>Upload</b> your own playlist or <b>Select a default playlist</b>.<br>No channel will play until you choose. ',
    {upload:true,history:true}
  );
  renderChannels(); updateIcons();
});

// Unified robust header bar auto-hide for desktop/touch
let barHideTimer = null;
function showHeaderBarForAWhile() {
  bar.classList.remove('hide');
  bar.classList.add('slide-down');
  if (barHideTimer) clearTimeout(barHideTimer);
  barHideTimer = setTimeout(() => {
    bar.classList.remove('slide-down');
    bar.classList.add('hide');
  }, 5000);
}
function hideHeaderBarImmediately() {
  bar.classList.remove('slide-down');
  bar.classList.add('hide');
  if (barHideTimer) clearTimeout(barHideTimer);
}
playerArea.addEventListener('mousemove', showHeaderBarForAWhile);
playerArea.addEventListener('mouseleave', hideHeaderBarImmediately);
playerArea.addEventListener('focusin', showHeaderBarForAWhile);
playerArea.addEventListener('touchstart', showHeaderBarForAWhile, {passive:true});
playerArea.addEventListener('click', function(e){
  if(window.innerWidth < 600) showHeaderBarForAWhile();
});
document.querySelector('.player-controls').addEventListener('click', function(e) { e.stopPropagation(); });
document.querySelector('.player-controls').addEventListener('touchstart', function(e) { e.stopPropagation(); });
setTimeout(() => { bar.classList.add('hide'); }, 2000);

// Smooth and continuous left/right swipe gesture for mobile/touch (continuous for channel change)
let touchStartX = null;
let touchStartY = null;
let lastSwipeTime = 0;
document.getElementById('player-container').addEventListener('touchstart', function(e) {
  if(e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
}, {passive:true});
document.getElementById('player-container').addEventListener('touchend', function(e) {
  if(touchStartX !== null && touchStartY !== null) {
    let touchEndX = e.changedTouches[0].clientX;
    let touchEndY = e.changedTouches[0].clientY;
    let dx = touchEndX - touchStartX;
    let dy = touchEndY - touchStartY;
    if(Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
      const now = Date.now();
      if (now - lastSwipeTime > 80) {
        if (dx < 0) {
          swipeChannel(+1);    // Left swipe = next channel
        } else {
          swipeChannel(-1);    // Right swipe = previous channel
        }
        lastSwipeTime = now;
        showHeaderBarForAWhile();
      }
    } else if(Math.abs(dx) < 7 && Math.abs(dy) < 7) {
      showHeaderBarForAWhile();
    }
  }
  touchStartX = null;
  touchStartY = null;
}, {passive:true});
function swipeChannel(dir) {
  let activeChannels = channels.length > 1 ? channels : allChannels; // Fallback for favorites
  if (activeChannels && activeChannels.length > 1) {
    let idx = currentPlayingChannel ? activeChannels.findIndex(c => c.url === currentPlayingChannel.url) : -1;
    if (idx === -1) idx = 0;
    let nextIdx = (idx + dir + activeChannels.length) % activeChannels.length;
    playChannel(activeChannels[nextIdx]);
  }
}
if(window.innerWidth < 600) {
  bar.classList.add('hide');
}
