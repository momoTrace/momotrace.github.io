/* Moxan desktop: content data, API adapters, window manager and effects are kept separate. */
(() => {
  'use strict';

  const PLAYLIST_ID = '8170701761';
  const PLAYLIST_URL = `https://music.163.com/#/playlist?id=${PLAYLIST_ID}`;
  const STORAGE_KEY = 'moxan.desktop.v1';
  const INTRO_KEY = 'moxan_intro_seen';
  const MUSIC_API = Object.freeze({
    base: 'https://ncm-api.prod.gbclstudio.cn',
    playlistDetail: (id) => `/playlist/detail?id=${encodeURIComponent(id)}`,
    songDetail: (ids) => `/song/detail?ids=${encodeURIComponent(ids.join(','))}`,
    songUrl: (id) => `/song/url/v1?id=${encodeURIComponent(id)}&level=standard`,
    lyric: (id) => `/lyric?id=${encodeURIComponent(id)}`
  });
  const MUSIC_MODE_KEY = 'moxan.music-mode.v1';
  const MUSIC_DROP_POSITION_KEY = 'moxan.music-drop-y.v1';
  const MUSIC_MODES = Object.freeze({
    shuffle: { label: '随机播放', icon: '⤨' },
    single: { label: '单曲循环', icon: '↻' },
    list: { label: '列表顺序', icon: '≡' }
  });

  const IMAGE_ASSETS = window.MoxanImages;
  const WALLPAPERS = IMAGE_ASSETS.wallpapers;

  const SITES = [
    { name: '我的博客', host: 'cnblogs.com/momotrace', description: '记录垃圾代码与日常。', url: 'https://www.cnblogs.com/momotrace', icon: '⌘', category: 'WRITING' },
    { name: '默纤导航集', host: 'nev.moxan.top', description: '默纤常用链接', url: 'https://nev.moxan.top', icon: '⊞', category: 'DIRECTORY' },
    { name: '博主歌单', host: '网易云音乐 · 8170701761', description: '电子音乐', url: PLAYLIST_URL, icon: '♫', category: 'MUSIC' },
    { name: '站点检测', host: 'jc.moxan.top', description: '看看站点是不是都还亮着（灭了就炸了）。', url: 'https://jc.moxan.top', icon: '◉', category: 'STATUS' },
    { name: '关于博主', host: 'about.moxan.top', description: '关于 Mogo。', url: 'https://about.moxan.top', icon: 'M', category: 'PROFILE' },
    { name: 'Moxan BBS', host: 'b.moxan.top', description: '鲜美的网站。<del>似乎已经停服了。</del>', url: 'https://b.moxan.top', icon: '▤', category: 'COMMUNITY' },
    { name: 'Moxan Chat', host: 'gpt.moxan.top', description: '<del>完蛋 好像也停服了</del>', url: 'https://gpt.moxan.top', icon: '⌁', category: 'TOOLS' }
  ];

  const IDENTITIES = IMAGE_ASSETS.identities;
  const GAMES = IMAGE_ASSETS.games;

  const SOCIALS = [
    { name: 'QQ', value: '1610737346', symbol: 'Q', kind: 'copy', payload: '1610737346' },
    { name: 'Bilibili', value: 'b23.tv/Rl8fsM8', symbol: 'B', kind: 'external', url: 'https://b23.tv/Rl8fsM8' },
    { name: 'Phone', value: '190 3365 8425', symbol: '☎', kind: 'phone', url: 'tel:19033658425' },
    { name: 'Email', value: 'trace@moxan.top', symbol: '@', kind: 'email', url: 'mailto:trace@moxan.top' },
    { name: 'GitHub', value: 'github.com/momotrace', symbol: '⌘', kind: 'external', url: 'https://github.com/momotrace' }
  ];

  const APPS = [
    { id: 'websites', title: '网站索引', short: 'Websites', icon: '⊞', hint: 'PERSONAL NETWORK', width: 660, height: 545 },
    { id: 'music', title: '音乐播放器', short: 'Music', icon: '♫', hint: 'ACRYLIC MUSIC WINDOW', width: 770, height: 565 },
    { id: 'about', title: '关于 Mogo', short: 'About', icon: 'M', hint: 'USER PROFILE', width: 700, height: 575 },
    { id: 'projects', title: '正在做的事', short: 'Projects', icon: '▣', hint: 'WORK IN PROGRESS', width: 630, height: 500 },
    { id: 'games', title: '游戏收藏', short: 'Games', icon: '◈', hint: 'AFTER HOURS', width: 730, height: 580 },
    { id: 'contact', title: '联系 Mogo', short: 'Contact', icon: '⌁', hint: 'OPEN CHANNELS', width: 520, height: 495 },
    { id: 'settings', title: '桌面设置', short: 'Settings', icon: '⚙', hint: 'PERSONALIZE DESKTOP', width: 720, height: 590 },
    { id: 'system', title: '系统信息', short: 'System', icon: '◷', hint: 'SYSTEM MONITOR', width: 520, height: 490 },
    { id: 'clock', title: '时钟', short: 'Clock', icon: '◷', hint: 'LOCAL TIME', width: 450, height: 365 },
    { id: 'guestbook', title: '留言簿', short: 'Guestbook', icon: '▤', hint: 'LOCAL GUESTBOOK', width: 550, height: 500 },
    { id: 'console', title: 'Moxan Developer Console', short: 'Dev Console', icon: '⌘', hint: 'DEVELOPER MODE', width: 550, height: 430 }
  ];

  const APP_BY_ID = new Map(APPS.map((app) => [app.id, app]));
  const state = {
    open: new Map(), nextZ: 40, cascade: 0, activeId: '', songList: [], currentTrack: -1,
    playerReady: false, musicLoaded: false, musicLoading: false, musicLoadPromise: null, playlistTotal: 0,
    lyrics: [], lyricsTrackId: '', lyricsLoading: false, lyricsFailed: false,
    playMode: readMusicMode(), shuffleHistory: [], shuffleCursor: -1, autoPlayStarted: false, autoPlayAttempt: false,
    settings: readSettings(), wallpaperObjectUrl: '', wallpaperFront: null, wallpaperTimer: 0, backgroundToken: 0, introTimer: 0, brandClicks: [],
    eggKeys: '', weatherFrames: [], weatherTick: 0, pointerEvents: true,
    contextTarget: null, contextInvoker: null, contextLongPressTimer: 0, contextLongPressOrigin: null, contextSuppressTarget: null
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const getApp = (id) => APP_BY_ID.get(id) || APP_BY_ID.get('system');
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.matchMedia('(max-width: 700px)').matches;

  function readSettings() {
    const base = { wallpaper: 'city', position: 'center 48%', brightness: 73, blur: 0, shade: 36, saturation: 102, mode: 'dynamic', environment: 'auto', entry: 'auto' };
    try { return { ...base, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { return base; }
  }
  function saveSettings() {
    const { wallpaper, position, brightness, blur, shade, saturation, mode, environment, entry } = state.settings;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ wallpaper, position, brightness, blur, shade, saturation, mode, environment, entry })); } catch { toast('设置没有保存', '浏览器暂时无法使用本地存储。'); }
  }
  function readMusicMode() {
    try {
      const mode = localStorage.getItem(MUSIC_MODE_KEY);
      return Object.prototype.hasOwnProperty.call(MUSIC_MODES, mode) ? mode : 'shuffle';
    } catch { return 'shuffle'; }
  }
  function saveMusicMode() {
    try { localStorage.setItem(MUSIC_MODE_KEY, state.playMode); } catch { /* Playback still works without persistence. */ }
  }
  function randomizeWallpaperOnEntry() {
    if (!WALLPAPERS.length) return;
    const previous = state.settings.wallpaper;
    const alternatives = WALLPAPERS.filter((wallpaper) => wallpaper.id !== previous);
    const choices = alternatives.length ? alternatives : WALLPAPERS;
    const wallpaper = choices[Math.floor(Math.random() * choices.length)];
    state.settings.wallpaper = wallpaper.id;
    state.settings.position = (isMobile() && wallpaper.mobilePosition) || wallpaper.position || 'center';
    saveSettings();
  }
  function currentWallpaper() { return WALLPAPERS.find((item) => item.id === state.settings.wallpaper) || WALLPAPERS[0]; }
  function isVideoWallpaper(url) { return /\.(mp4|webm)(?:[?#].*)?$/i.test(url || ''); }
  function startWallpaperVideo(video) {
    if (!video.classList.contains('is-active') || state.settings.mode !== 'dynamic') return;
    video.play().then(() => { delete video.dataset.awaitingGesture; }).catch(() => { video.dataset.awaitingGesture = 'true'; });
  }
  function showWallpaperVideo(url) {
    const video = $('#wallpaperVideo');
    const absoluteUrl = new URL(url, document.baseURI).href;
    video.onerror = () => {
      if (video.src !== absoluteUrl) return;
      const errorCode = video.error?.code;
      video.pause(); video.classList.remove('is-active'); video.removeAttribute('src'); video.load();
      if (state.wallpaperObjectUrl === url) {
        state.wallpaperObjectUrl = '';
        URL.revokeObjectURL(url);
      }
      const fallback = 'linear-gradient(180deg,rgba(7,14,24,.27),rgba(8,15,25,.18) 38%,rgba(5,12,20,.6))';
      ['#wallpaperBase', '#wallpaperNext'].forEach((selector) => { const layer = $(selector); layer.style.display = 'block'; layer.style.backgroundImage = fallback; });
      toast('WebM 视频无法解码', errorCode === 4 ? '浏览器不支持此视频编码，请转为 VP8/VP9 WebM 或 H.264 MP4。' : '文件可能损坏或编码不受支持，请尝试重新导出。');
    };
    video.oncanplay = () => startWallpaperVideo(video);
    video.muted = true; video.defaultMuted = true; video.loop = true; video.playsInline = true; video.preload = 'auto';
    video.style.objectPosition = state.settings.position || 'center';
    const sourceChanged = video.src !== absoluteUrl;
    if (sourceChanged) { video.pause(); video.src = url; video.load(); }
    video.classList.add('is-active');
    $('#wallpaperBase').style.display = 'none'; $('#wallpaperNext').style.display = 'none';
    if (video.readyState >= 3 && video.paused) startWallpaperVideo(video);
  }
  function applyDesktopSettings() {
    const root = document.documentElement;
    root.style.setProperty('--wallpaper-blur', `${Number(state.settings.blur) || 0}px`);
    root.style.setProperty('--wallpaper-brightness', (Number(state.settings.brightness) || 73) / 100);
    root.style.setProperty('--wallpaper-saturation', (Number(state.settings.saturation) || 102) / 100);
    root.style.setProperty('--wallpaper-overlay', (Number(state.settings.shade) || 36) / 100);
    const wallpaper = currentWallpaper();
    const video = $('#wallpaperVideo');
    const uploadedVideo = state.wallpaperObjectUrl && video.classList.contains('is-active');
    if (isVideoWallpaper(wallpaper.src) && !uploadedVideo) {
      if (state.settings.mode !== 'dynamic') { state.settings.mode = 'dynamic'; saveSettings(); }
      showWallpaperVideo(wallpaper.src);
    } else if (!video.classList.contains('is-active')) {
      const uploadedImage = state.wallpaperObjectUrl;
      setWallpaperBackground(uploadedImage || wallpaper.src, state.settings.position || wallpaper.position, !state.wallpaperFront);
      $('#wallpaperBase').style.display = 'block';
    }
    const configuredMode = state.settings.environment === 'auto' ? wallpaper.environment : state.settings.environment;
    document.body.dataset.environment = state.settings.mode === 'static' ? 'none' : configuredMode;
    document.body.dataset.hours = timePeriod();
    const weatherLabel = { rain: 'RAIN MODE', snow: 'SNOW MODE', particles: 'PARTICLE MODE', none: 'STILL MODE' };
    $('#topWeather').textContent = state.settings.mode === 'static' ? 'STATIC MODE' : weatherLabel[configuredMode] || 'RAIN MODE';
    syncWeather();
  }
  function setWallpaperBackground(url, position, immediate = false) {
    const base = $('#wallpaperBase'); const next = $('#wallpaperNext');
    if (!state.wallpaperFront) state.wallpaperFront = base;
    const front = state.wallpaperFront;
    if (!immediate && front.dataset.imageUrl === url && front.style.backgroundPosition === position) return;
    const token = ++state.backgroundToken;
    clearTimeout(state.wallpaperTimer);
    const imageValue = `linear-gradient(180deg,rgba(7,14,24,.27),rgba(8,15,25,.18) 38%,rgba(5,12,20,.6)),url("${url}")`;
    if (immediate) {
      base.style.transition = 'none'; next.style.transition = 'none';
      base.style.backgroundImage = imageValue; base.style.backgroundPosition = position; base.dataset.imageUrl = url; base.style.opacity = '1';
      next.style.opacity = '0'; state.wallpaperFront = base;
      requestAnimationFrame(() => { base.style.transition = ''; next.style.transition = ''; });
      return;
    }
    const back = front === base ? next : base;
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      if (token !== state.backgroundToken) return;
      back.style.backgroundImage = imageValue; back.style.backgroundPosition = position; back.dataset.imageUrl = url; back.style.opacity = '0';
      requestAnimationFrame(() => {
        if (token !== state.backgroundToken) return;
        back.style.opacity = '1';
        state.wallpaperTimer = setTimeout(() => { front.style.opacity = '0'; state.wallpaperFront = back; }, 900);
      });
    };
    const preloader = new Image();
    preloader.onload = reveal; preloader.onerror = reveal; preloader.src = url;
    if (preloader.complete) reveal();
  }
  function timePeriod() {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 17) return 'day';
    if (hour >= 17 && hour < 21) return 'dusk';
    return 'night';
  }

  function siteCards() {
    return SITES.map((site) => `<a class="site-card" href="${escapeHtml(site.url)}" target="_blank" rel="noreferrer noopener" data-site="${escapeHtml(site.name)}"><span class="site-symbol">${escapeHtml(site.icon)}</span><span class="site-copy"><b>${escapeHtml(site.name)}</b><small>${escapeHtml(site.host)} · ${escapeHtml(site.category)}</small></span><span class="site-arrow">↗</span></a>`).join('');
  }
  function identityCards() {
    return IDENTITIES.map((item) => `<article class="identity-card"><img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" loading="lazy"><div class="identity-copy"><small>${escapeHtml(item.label)}</small><b>${escapeHtml(item.title)}</b></div></article>`).join('');
  }
  function gameCards() {
    return GAMES.map((game) => `<article class="game-card"><img src="${escapeHtml(game.src)}" alt="${escapeHtml(game.alt)}" loading="lazy"><div class="game-card-copy"><small>${escapeHtml(game.genre)}</small><b>${escapeHtml(game.name)}</b><span>${escapeHtml(game.note)}</span></div></article>`).join('');
  }
  function socialLinks() {
    return SOCIALS.map((social) => {
      const attrs = social.kind === 'copy' ? `href="#copy" data-copy="${escapeHtml(social.payload)}" data-copy-label="QQ 号码"` : `href="${escapeHtml(social.url)}" ${social.kind === 'external' ? 'target="_blank" rel="noreferrer noopener"' : ''}`;
      return `<a class="social-link" ${attrs}><span class="social-icon">${escapeHtml(social.symbol)}</span><span><b>${escapeHtml(social.name)}</b><small>${escapeHtml(social.value)}</small></span><i>${social.kind === 'copy' ? '⧉' : '↗'}</i></a>`;
    }).join('');
  }

  const templates = {
    websites: () => `<div class="window-heading"><div><div class="section-label">PERSONAL NETWORK</div><h2>我的网络角落</h2><p>散落在不同地址的东西，都从这里出发。</p></div><span class="section-label">${String(SITES.length).padStart(2, '0')} SITES</span></div><div class="sites-grid">${siteCards()}</div><div class="fine-rule"></div><div class="window-statusline-inline">部分页面仍在慢慢搭建，欢迎常回来看看。</div>`,
    about: () => `<div class="window-heading"><div><div class="section-label">USER PROFILE</div><h2>关于 Mogo</h2><p>一个工程师，一位音乐人，还有许多下班后的兴趣。</p></div></div><div class="about-banner"><div class="about-stamp">M</div><div class="about-intro"><h3>默纤 <span style="color:#9dbbc2">Moxan</span></h3><p>用代码整理复杂的东西，用音乐记下没有说出口的情绪。<br>这里是我的个人桌面，仍在持续建设中。</p></div></div><div class="fine-rule"></div><div class="info-grid"><div class="info-cell"><small>USER</small><b>Mogo / 默纤</b></div><div class="info-cell"><small>ROLE</small><b>前端架构工程师</b></div><div class="info-cell"><small>STUDIO</small><b>Moxan</b></div><div class="info-cell"><small>CREATIVE FIELD</small><b>Electronic Music</b></div><div class="info-cell"><small>LOCATION</small><b>Digital Space</b></div><div class="info-cell"><small>STATUS</small><b>Online · Building</b></div></div><div class="fine-rule"></div><div class="section-label" style="margin-bottom:10px">THREE SIDES OF ME</div><div class="identity-grid">${identityCards()}</div>`,
    games: () => `<div class="window-heading"><div><div class="section-label">AFTER HOURS</div><h2>游戏收藏</h2><p>工作之外的另一张桌面。最近常去这些世界。</p></div><span class="section-label">${String(GAMES.length).padStart(2, '0')} WORLDS</span></div><div class="games-grid">${gameCards()}</div><p class="setting-note" style="margin-top:12px">图片是场景氛围参考，不代表游戏官方封面。</p>`,
    contact: () => `<div class="window-heading"><div><div class="section-label">OPEN CHANNELS</div><h2>找到我</h2><p>工作交流、音乐闲聊，或者只是打个招呼。</p></div></div><div class="social-list">${socialLinks()}</div><div class="fine-rule"></div><div class="contact-note">QQ 点击后复制号码；邮件与电话会交给你设备上的默认应用。<br>不想打扰也没关系，桌面一直在这里。</div>`,
    projects: () => `<div class="window-heading"><div><div class="section-label">WORK IN PROGRESS</div><h2>正在做的事</h2><p>个人项目通常很慢，但每一小块都是真的。</p></div></div><div class="project-list"><article class="project-item"><span class="project-symbol">◫</span><div><h3>Moxan Personal Network</h3><p>持续整理自己的站点、信息入口与数字身份。让每个小站各自有用，也能一起呼吸。</p><small>WEB / PERSONAL / ONGOING</small></div></article><article class="project-item"><span class="project-symbol">♫</span><div><h3>Electronic Music Sketches</h3><p>把旋律和声音先记下来，再慢慢做成可以分享的作品。灵感通常出现在夜里。</p><small>MUSIC / STUDIO / IN PROGRESS</small></div></article><article class="project-item"><span class="project-symbol">⌘</span><div><h3>Frontend Architecture Notes</h3><p>关于界面系统、工程取舍和维护体验的工作笔记，写给未来的自己。</p><small>ENGINEERING / NOTES / LIVING DOC</small></div></article></div>`,
    system: () => `<div class="window-heading"><div><div class="section-label">SYSTEM MONITOR</div><h2>桌面状态</h2><p>一些跟此页面有关的实时信息。</p></div></div><div class="system-summary"><div class="system-metric"><small>LOCAL CLOCK</small><b data-live-clock>--:--:--</b></div><div class="system-metric"><small>WALLPAPER MODE</small><b data-live-wallpaper>RAIN / DYNAMIC</b></div><div class="system-metric"><small>PLAYLIST</small><b>8170701761</b></div><div class="system-metric"><small>FRONTEND</small><b>STATIC / VANILLA JS</b></div></div><div class="system-status-list"><div class="system-status"><i></i><span>Personal desktop</span><small>ONLINE</small></div><div class="system-status"><i></i><span>Background effects</span><small data-system-weather>ACTIVE</small></div><div class="system-status"><i></i><span>NetEase API</span><small data-music-status>WAITING</small></div><div class="system-status"><i></i><span>Storage</span><small>LOCAL ONLY</small></div></div>`,
    clock: () => `<div class="clock-panel"><time data-live-clock>--:--:--</time><div class="clock-panel-date" data-live-date>----</div><div class="clock-panel-zone">LOCAL TIME · 24-HOUR DISPLAY</div></div><div class="fine-rule"></div><div class="contact-note">桌面壁纸与外观设置只保存在当前浏览器中。</div>`,
    settings: () => settingsTemplate(),
    music: () => musicTemplate(),
    guestbook: () => guestbookTemplate(),
    console: () => `<div class="window-heading"><div><div class="section-label">DEVELOPER MODE</div><h2>Moxan Console</h2><p>一个只读的桌面小彩蛋。</p></div></div><div class="terminal" id="devTerminal"><p>Moxan personal desktop [Version 1.0.0]</p><p>(c) Moxan · Digital Space</p><p>&nbsp;</p><p><span class="prompt">C:\MOXAN&gt;</span> help</p><p>help&nbsp;&nbsp; whoami&nbsp;&nbsp; date&nbsp;&nbsp; clear&nbsp;&nbsp; motd</p><p>&nbsp;</p><div id="terminalOutput"></div><div class="terminal-input-row"><span class="prompt">C:\MOXAN&gt;</span><input class="terminal-input" id="terminalInput" autocomplete="off" spellcheck="false" aria-label="Developer console command"></div></div>`
  };

  function settingsTemplate() {
    return `<div class="window-heading"><div><div class="section-label">PERSONALIZE DESKTOP</div><h2>桌面设置</h2><p>调一调雨夜的光、壁纸和动态效果。</p></div></div><div class="settings-layout">
      <section class="setting-group"><h3>WALLPAPER</h3><div class="setting-control"><label for="wallpaperChoice">预设壁纸</label><select id="wallpaperChoice">${WALLPAPERS.map((wall) => `<option value="${wall.id}" ${state.settings.wallpaper === wall.id ? 'selected' : ''}>${escapeHtml(wall.name)}</option>`).join('')}</select></div><div class="setting-control" style="margin-top:7px"><label for="wallpaperMode">显示模式</label><select id="wallpaperMode"><option value="dynamic" ${state.settings.mode === 'dynamic' ? 'selected' : ''}>DYNAMIC · 动态</option><option value="static" ${state.settings.mode === 'static' ? 'selected' : ''}>STATIC · 静态</option></select></div><div class="setting-control" style="margin-top:7px"><label for="environmentChoice">环境效果</label><select id="environmentChoice"><option value="auto" ${state.settings.environment === 'auto' ? 'selected' : ''}>自动 · 跟随壁纸</option><option value="rain" ${state.settings.environment === 'rain' ? 'selected' : ''}>Rain · 雨</option><option value="snow" ${state.settings.environment === 'snow' ? 'selected' : ''}>Snow · 雪</option><option value="particles" ${state.settings.environment === 'particles' ? 'selected' : ''}>Particles · 粒子</option><option value="none" ${state.settings.environment === 'none' ? 'selected' : ''}>None · 关闭</option></select></div><div class="setting-control" style="margin-top:7px"><label for="entryChoice">启动效果</label><select id="entryChoice"><option value="auto" ${state.settings.entry === 'auto' ? 'selected' : ''}>跟随环境</option><option value="rain" ${state.settings.entry === 'rain' ? 'selected' : ''}>Rain</option><option value="snow" ${state.settings.entry === 'snow' ? 'selected' : ''}>Snow</option><option value="particles" ${state.settings.entry === 'particles' ? 'selected' : ''}>Particles</option><option value="none" ${state.settings.entry === 'none' ? 'selected' : ''}>None</option></select></div><label class="wallpaper-upload" style="margin-top:10px">＋ 上传图片或视频<input id="wallpaperFile" type="file" accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,image/jpeg,image/png,image/webp,video/mp4,video/webm"></label><p class="setting-note">支持 JPG、PNG、WebP、MP4、WebM。上传内容只在当前浏览器会话预览，刷新后请重新选择。</p></section>
      <section class="setting-group"><h3>GLASS & LIGHT</h3>${rangeControl('brightness', '壁纸亮度', 25, 100, state.settings.brightness, '%')}${rangeControl('blur', '背景柔化', 0, 12, state.settings.blur, 'px')}${rangeControl('shade', '暗色遮罩', 10, 70, state.settings.shade, '%')}${rangeControl('saturation', '色彩饱和', 30, 150, state.settings.saturation, '%')}<div class="fine-rule" style="margin:8px 0"></div><div class="setting-control"><label for="wallpaperPosition">焦点位置</label><select id="wallpaperPosition"><option value="center 48%" ${state.settings.position === 'center 48%' ? 'selected' : ''}>中央 · 默认</option><option value="center 35%" ${state.settings.position === 'center 35%' ? 'selected' : ''}>向上</option><option value="center 62%" ${state.settings.position === 'center 62%' ? 'selected' : ''}>向下</option><option value="left center" ${state.settings.position === 'left center' ? 'selected' : ''}>左侧</option><option value="right center" ${state.settings.position === 'right center' ? 'selected' : ''}>右侧</option></select></div></section>
      <div class="settings-actions"><button class="button-quiet" data-reset-settings>恢复默认</button><button class="button-primary" data-save-settings>保存设置</button></div></div>`;
  }
  function rangeControl(key, label, min, max, value, suffix) {
    return `<div class="setting-control"><label for="setting-${key}">${label}</label><input type="range" min="${min}" max="${max}" value="${Number(value)}" id="setting-${key}" data-setting="${key}"><output for="setting-${key}">${Number(value)}${suffix}</output></div>`;
  }
  function musicModeButtonMarkup() {
    const mode = MUSIC_MODES[state.playMode] || MUSIC_MODES.shuffle;
    return `<button class="music-mode-button" type="button" data-music-action="mode" aria-label="播放模式：${mode.label}，点击切换" title="点击切换播放模式"><span class="music-mode-icon" aria-hidden="true">${mode.icon}</span><span>${mode.label}</span></button>`;
  }
  function syncFloatingMusic() {
    const drop = $('#musicDrop');
    if (!drop) return;
    const track = state.songList[state.currentTrack];
    const image = $('#musicDropCover');
    const cover = track ? (trackCover(track) || IMAGE_ASSETS.musicFallback) : IMAGE_ASSETS.musicFallback;
    if (image) {
      if (cover) { image.src = cover; image.alt = track?.name ? `${track.name} 专辑封面` : '音乐封面'; }
      else { image.removeAttribute('src'); image.alt = ''; }
    }
    const title = $('#musicDropTitle');
    if (title) title.textContent = track?.name || (state.musicLoading ? '正在连接歌单…' : '等待随机歌曲');
    const artist = $('#musicDropArtist');
    if (artist) artist.textContent = track ? artistName(track) : (state.musicLoaded ? '网易云音乐暂不可用' : '网易云音乐');
    const album = $('#musicDropAlbum');
    if (album) album.textContent = track?.al?.name || track?.album?.name || (track ? 'NETEASE CLOUD MUSIC' : 'MOGO PLAYLIST');
    const mode = MUSIC_MODES[state.playMode] || MUSIC_MODES.shuffle;
    const modeButton = $('#musicDropMode');
    if (modeButton) {
      modeButton.innerHTML = `<span class="music-mode-icon" aria-hidden="true">${mode.icon}</span><span>${mode.label}</span>`;
      modeButton.setAttribute('aria-label', `播放模式：${mode.label}，点击切换`);
      modeButton.dataset.mode = state.playMode;
    }
    const audio = $('#audioPlayer');
    const playing = Boolean(audio && !audio.paused && !audio.ended);
    drop.classList.toggle('is-playing', playing);
    const playButton = $('#musicDropPlay');
    if (playButton) {
      playButton.textContent = playing ? 'Ⅱ' : '▶';
      playButton.setAttribute('aria-label', playing ? '暂停' : '播放');
      playButton.title = playing ? '暂停' : '播放';
    }
    const lyric = $('#musicDropLyric');
    if (lyric) {
      if (!track) lyric.textContent = state.musicLoading ? '正在加载网易云歌单…' : '入站后尝试随机播放';
      else if (state.lyricsLoading) lyric.textContent = '正在读取歌词…';
      else if (state.lyricsFailed) lyric.textContent = '歌词服务暂不可用';
      else if (state.lyrics.length) lyric.textContent = currentLyricText(audio?.currentTime || 0);
      else lyric.textContent = '这首歌没有可显示的歌词';
    }
  }
  function musicTemplate() {
    return `<div class="window-heading"><div><div class="section-label">ACRYLIC MUSIC WINDOW</div><h2>Mogo 珍藏电音歌单</h2><p>歌单 ID ${PLAYLIST_ID} · 来自网易云音乐</p></div><a class="button-quiet" href="${PLAYLIST_URL}" target="_blank" rel="noreferrer noopener" data-playlist-open>网易云打开 ↗</a></div><div class="music-layout"><section class="music-main"><div class="music-art" id="musicArt"><div class="music-art-mark">♫</div></div><div class="music-info-top"><span class="music-state" id="musicState"><i></i><span>OFFLINE / CONNECTING</span></span><span id="musicCount">-- TRACKS</span></div><h3 class="music-track-title" id="trackTitle">正在连接歌单</h3><p class="music-artist" id="trackArtist">如果接口暂时无法访问，歌单入口仍然可用。</p><div class="visualizer" id="visualizer" aria-label="播放动态波形" role="img"></div><div class="progress-row"><span id="currentTime">00:00</span><input type="range" min="0" max="1000" value="0" id="musicProgress" aria-label="歌曲进度"><span id="duration">00:00</span></div><div class="music-controls"><button class="player-button" data-music-action="previous" aria-label="上一首">◂|</button><button class="player-button play" data-music-action="toggle" aria-label="播放或暂停">▶</button><button class="player-button" data-music-action="next" aria-label="下一首">|▸</button></div><div class="music-mode-row">${musicModeButtonMarkup()}</div><div class="music-lower"><span id="musicQuality">NETEASE CLOUD MUSIC</span><label class="volume-wrap" aria-label="音量">VOL <input id="musicVolume" type="range" min="0" max="1" step=".01" value=".78"></label></div><div id="lyricPane" class="lyric-pane"><b>LYRICS</b><span>选择一首歌曲后显示歌词。</span></div></section><section class="playlist-wrap"><div class="playlist-heading"><b>PLAYLIST</b><small id="playlistCount">WAITING FOR API</small></div><div class="track-list" id="trackList"><div class="track-empty">正在读取网易云歌单…<small>加载失败时会保留离线入口。</small></div></div><a class="music-open-link" href="${PLAYLIST_URL}" target="_blank" rel="noreferrer noopener" data-playlist-open><span>在网易云音乐打开歌单</span><span>↗</span></a></section></div>`;
  }
  function guestbookTemplate() {
    const messages = readGuestbook();
    return `<div class="window-heading"><div><div class="section-label">LOCAL GUESTBOOK</div><h2>留一句话</h2><p>小小的留言簿，只保存在这台设备的浏览器里。</p></div></div><form class="guestbook-form" id="guestbookForm"><input class="field-input" id="guestName" maxlength="24" placeholder="怎么称呼你？（选填）" aria-label="称呼"><textarea class="field-textarea" id="guestMessage" maxlength="220" placeholder="留一段话，最多 220 字。" required aria-label="留言"></textarea><div class="form-row"><small>LOCAL ONLY · 不会发送到服务器</small><button class="button-primary" type="submit">保存留言</button></div></form><div class="fine-rule"></div><div id="guestbookMessages">${guestbookMessages(messages)}</div>`;
  }
  function readGuestbook() { try { return JSON.parse(localStorage.getItem('moxan_guestbook') || '[]'); } catch { return []; } }
  function guestbookMessages(messages) {
    if (!messages.length) return '<div class="guestbook-empty">这里还没有留言。<br>留下你的第一句话吧。</div>';
    return `<div class="guestbook-list">${messages.slice().reverse().map((message) => `<article class="project-item"><span class="project-symbol">${escapeHtml((message.name || 'G').slice(0, 1).toUpperCase())}</span><div><h3>${escapeHtml(message.name || '访客')}</h3><p>${escapeHtml(message.text)}</p><small>${escapeHtml(message.date || '')} · SAVED ON THIS DEVICE</small></div></article>`).join('')}</div>`;
  }

  function renderLauncher() {
    const ids = ['websites', 'music', 'about', 'projects', 'games', 'contact', 'settings', 'system'];
    $('#launcher').innerHTML = ids.map((id) => {
      const app = getApp(id);
      return `<button class="launch-tile" data-open="${app.id}" aria-label="打开${app.title}窗口"><span class="launch-icon">${app.icon}</span><span class="launch-copy"><b>${app.short}</b><small>${app.hint}</small></span><span class="tile-mark">↗</span></button>`;
    }).join('');
    const startApps = ['websites', 'music', 'about', 'projects', 'games', 'contact', 'settings', 'system', 'clock', 'guestbook'];
    $('#startMenu').innerHTML = `<div class="start-menu-head"><span class="start-logo">M</span><div><b>Moxan Desktop</b><small>默纤 · PERSONAL SPACE</small></div></div><label class="setting-control" style="margin:12px 3px 4px"><input id="startSearch" class="field-input" placeholder="查找窗口或页面" style="min-height:32px" aria-label="搜索应用"></label><div class="start-apps">${startApps.map((id) => { const app = getApp(id); return `<button class="start-app" data-open="${app.id}"><span class="start-app-icon">${app.icon}</span><b>${app.short}</b></button>`; }).join('')}</div><div class="start-foot"><span>USER · MOGO</span><button data-open="system">SYSTEM STATUS ↗</button></div>`;
    $('#mobileNav').innerHTML = `<button id="mobileStart" aria-label="打开应用菜单"><span>⊞</span><small>菜单</small></button>${['websites', 'music', 'about', 'contact'].map((id) => { const app = getApp(id); return `<button data-open="${id}" aria-label="打开${app.short}"><span>${app.icon}</span><small>${app.short}</small></button>`; }).join('')}`;
  }

  function renderAvatar() {
    const avatar = IMAGE_ASSETS.avatar;
    if (!avatar?.src) return;
    const frame = $('.avatar-frame');
    const image = document.createElement('img');
    image.className = 'avatar-photo';
    image.src = avatar.src;
    image.alt = avatar.alt || 'Mogo 的头像';
    image.loading = 'eager';
    frame.classList.add('has-photo');
    frame.prepend(image);
  }

  function buildWindow(id) {
    const app = getApp(id);
    const template = templates[id] || templates.system;
    const layer = $('#windowLayer');
    const node = document.createElement('section');
    node.className = 'app-window';
    node.dataset.windowid = id;
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-label', app.title);
    node.setAttribute('aria-modal', 'false');
    const cascade = (state.cascade++ % 7) * 23;
    const width = Math.min(app.width, window.innerWidth - (isMobile() ? 16 : 80));
    const height = Math.min(app.height, window.innerHeight - (isMobile() ? 82 : 120));
    node.style.width = `${Math.max(320, width)}px`;
    node.style.height = `${Math.max(270, height)}px`;
    node.style.left = `${Math.max(18, Math.min(window.innerWidth - width - 18, Math.round((window.innerWidth - width) / 2 + cascade)))}px`;
    node.style.top = `${Math.max(18, Math.min(window.innerHeight - height - 92, Math.round((window.innerHeight - height) / 2 + cascade)))}px`;
    node.innerHTML = `<header class="window-titlebar"><span class="window-app-mark">${app.icon}</span><span class="window-title">${escapeHtml(app.title)}</span><span class="window-subtitle">${app.hint}</span><div class="window-controls"><button class="window-control" data-window-action="minimize" aria-label="最小化">−</button><button class="window-control" data-window-action="maximize" aria-label="最大化">□</button><button class="window-control close" data-window-action="close" aria-label="关闭">×</button></div></header><div class="window-body">${template()}</div><footer class="window-statusline"><i></i><span>${app.hint}</span><span>${new Date().toLocaleTimeString('zh-CN', { hour12: false })}</span></footer><div class="resize-corner" aria-hidden="true"></div>`;
    if (id === 'about' && IMAGE_ASSETS.aboutBanner?.src) {
      const image = document.createElement('img');
      image.className = 'about-banner-image';
      image.src = IMAGE_ASSETS.aboutBanner.src;
      image.alt = IMAGE_ASSETS.aboutBanner.alt || '';
      image.loading = 'lazy';
      node.querySelector('.about-banner')?.prepend(image);
    }
    layer.append(node);
    state.open.set(id, { node, minimized: false, maximized: false, previous: null });
    focusWindow(id);
    if (id === 'music') ensurePlaylist().then(syncMusicWindow);
    if (id === 'settings') bindSettings(node);
    if (id === 'guestbook') bindGuestbook(node);
    if (id === 'console') bindConsole(node);
    updateTasks();
    return node;
  }

  function openWindow(id) {
    if (!APP_BY_ID.has(id)) return;
    closeStartMenu();
    const current = state.open.get(id);
    if (current) {
      current.minimized = false;
      current.node.classList.remove('is-minimized', 'is-closing');
      current.node.style.display = 'flex';
      focusWindow(id);
      return;
    }
    buildWindow(id);
    const app = getApp(id);
    if (id !== 'clock') toast(`${app.short} opened`, app.title);
  }
  function focusWindow(id) {
    const item = state.open.get(id);
    if (!item) return;
    state.activeId = id;
    item.node.style.zIndex = String(++state.nextZ);
    $$('.app-window', $('#windowLayer')).forEach((node) => node.classList.toggle('is-active', node.dataset.windowid === id));
    updateTasks();
  }
  function closeWindow(id, showToast = true) {
    const item = state.open.get(id);
    if (!item) return;
    item.node.classList.add('is-closing');
    state.open.delete(id);
    if (state.activeId === id) {
      state.activeId = '';
      const next = [...state.open.keys()].filter((key) => !state.open.get(key).minimized).at(-1);
      if (next) focusWindow(next);
    }
    updateTasks();
    if (id === 'music') pauseAudio();
    window.setTimeout(() => item.node.remove(), 200);
    if (showToast) toast('Window closed', getApp(id).title);
  }
  function minimizeWindow(id) {
    const item = state.open.get(id);
    if (!item) return;
    item.minimized = true;
    item.node.classList.add('is-minimized');
    if (state.activeId === id) {
      state.activeId = '';
      const next = [...state.open.keys()].filter((key) => key !== id && !state.open.get(key).minimized).at(-1);
      if (next) focusWindow(next);
    }
    updateTasks();
  }
  function toggleMaximize(id) {
    const item = state.open.get(id);
    if (!item || isMobile()) return;
    if (item.maximized) {
      item.node.classList.remove('is-maximized');
      item.node.style.cssText += '';
      item.node.style.left = `${item.previous.left}px`;
      item.node.style.top = `${item.previous.top}px`;
      item.node.style.width = `${item.previous.width}px`;
      item.node.style.height = `${item.previous.height}px`;
      item.maximized = false;
    } else {
      const rect = item.node.getBoundingClientRect();
      item.previous = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      item.node.classList.add('is-maximized');
      item.maximized = true;
    }
    focusWindow(id);
  }
  function updateTasks() {
    const active = [...state.open.keys()];
    const holder = $('#taskbarWindows');
    holder.innerHTML = active.map((id) => {
      const item = state.open.get(id);
      const app = getApp(id);
      return `<button class="taskbar-window ${state.activeId === id && !item.minimized ? 'is-active' : ''}" data-task-window="${id}" title="${app.title}"><i>${app.icon}</i><span>${app.short}</span></button>`;
    }).join('');
    $$('#mobileNav [data-open]').forEach((button) => button.classList.toggle('is-active', button.dataset.open === state.activeId));
  }
  function closeStartMenu() {
    $('#startMenu').classList.remove('is-open');
    $('#startMenu').setAttribute('aria-hidden', 'true');
    $('#startButton').setAttribute('aria-expanded', 'false');
  }
  function toggleStartMenu(force) {
    const menu = $('#startMenu');
    const open = typeof force === 'boolean' ? force : !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    $('#startButton').setAttribute('aria-expanded', String(open));
    if (open) setTimeout(() => $('#startSearch')?.focus(), 60);
  }
  function toast(title, detail = '') {
    const node = document.createElement('div');
    node.className = 'toast';
    node.innerHTML = `<span class="toast-icon">◌</span><span><b>${escapeHtml(title)}</b>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</span>`;
    $('#toastStack').append(node);
    setTimeout(() => node.remove(), 3300);
  }

  function contextMenuItems(target) {
    const menu = [];
    const copy = target.closest('[data-copy]');
    const site = target.closest('[data-site]');
    const track = target.closest('[data-track-index]');
    const task = target.closest('[data-task-window]');
    const windowNode = target.closest('.app-window');
    const opener = target.closest('[data-open]');
    const link = target.closest('a[href]');
    if (copy) {
      menu.push({ label: `复制${copy.dataset.copyLabel || '内容'}`, icon: '⧉', action: 'copy-value', value: copy.dataset.copy });
      menu.push({ divider: true }, { label: '联系 Mogo', icon: '⌁', action: 'open-app', app: 'contact' });
      return menu;
    }
    if (site) {
      menu.push({ label: `打开「${site.dataset.site}」`, icon: '↗', action: 'open-link', url: site.href });
      menu.push({ label: '复制链接地址', icon: '⧉', action: 'copy-value', value: site.href });
      menu.push({ divider: true }, { label: '打开网站索引', icon: '⊞', action: 'open-app', app: 'websites' });
      return menu;
    }
    if (track) {
      const song = state.songList[Number(track.dataset.trackIndex)];
      menu.push({ label: song ? `播放「${song.name}」` : '播放这首歌', icon: '♫', action: 'play-track', index: Number(track.dataset.trackIndex) });
      if (song) menu.push({ label: '复制歌曲名称', icon: '⧉', action: 'copy-value', value: song.name });
      menu.push({ divider: true }, { label: '在网易云音乐打开歌单', icon: '↗', action: 'open-link', url: PLAYLIST_URL });
      return menu;
    }
    if (task) {
      const id = task.dataset.taskWindow; const item = state.open.get(id); const app = getApp(id);
      if (item?.minimized) menu.push({ label: `恢复「${app.short}」`, icon: '▣', action: 'restore-window', app: id });
      else menu.push({ label: `激活「${app.short}」`, icon: '▣', action: 'restore-window', app: id });
      menu.push({ divider: true }, { label: '关闭窗口', icon: '×', action: 'close-window', app: id, danger: true });
      return menu;
    }
    if (windowNode) {
      const id = windowNode.dataset.windowid; const item = state.open.get(id); const app = getApp(id);
      menu.push({ label: `激活「${app.short}」`, icon: '▣', action: 'restore-window', app: id });
      if (!isMobile()) menu.push({ label: item?.maximized ? '还原窗口' : '最大化窗口', icon: item?.maximized ? '⧉' : '□', action: 'maximize-window', app: id });
      menu.push({ label: '最小化窗口', icon: '−', action: 'minimize-window', app: id });
      menu.push({ divider: true }, { label: '关闭窗口', icon: '×', action: 'close-window', app: id, danger: true });
      menu.push({ divider: true }, { label: '打开桌面设置', icon: '⚙', action: 'open-app', app: 'settings' });
      return menu;
    }
    if (opener) {
      const app = getApp(opener.dataset.open);
      menu.push({ label: `打开「${app.short}」`, icon: app.icon, action: 'open-app', app: app.id });
      if (state.open.has(app.id)) menu.push({ label: '切换到已打开窗口', icon: '▣', action: 'restore-window', app: app.id });
      menu.push({ divider: true }, { label: '打开桌面设置', icon: '⚙', action: 'open-app', app: 'settings' });
      return menu;
    }
    if (link) {
      menu.push({ label: '在新标签页打开链接', icon: '↗', action: 'open-link', url: link.href });
      menu.push({ label: '复制链接地址', icon: '⧉', action: 'copy-value', value: link.href });
      menu.push({ divider: true }, { label: '打开桌面设置', icon: '⚙', action: 'open-app', app: 'settings' });
      return menu;
    }
    if (target.closest('.hero-card')) {
      menu.push({ label: '查看 Mogo 档案', icon: 'M', action: 'open-app', app: 'about' });
      menu.push({ label: '打开网站索引', icon: '⊞', action: 'open-app', app: 'websites' });
      menu.push({ divider: true }, { label: '打开桌面设置', icon: '⚙', action: 'open-app', app: 'settings' });
      return menu;
    }
    menu.push(
      { label: '打开网站索引', icon: '⊞', action: 'open-app', app: 'websites' },
      { label: '打开音乐播放器', icon: '♫', action: 'open-app', app: 'music' },
      { label: '打开 Mogo 档案', icon: 'M', action: 'open-app', app: 'about' },
      { divider: true },
      { label: '个性化桌面', icon: '⚙', action: 'open-app', app: 'settings' },
      { label: '显示桌面', icon: '⌂', action: 'show-desktop' },
      { label: '刷新桌面效果', icon: '↻', action: 'refresh' }
    );
    return menu;
  }

  function showContextMenu(x, y, target, invoker = target) {
    const menu = $('#contextMenu');
    state.contextTarget = target;
    state.contextInvoker = invoker;
    const items = contextMenuItems(target);
    menu.innerHTML = `<div class="context-menu-head"><span>MOXAN DESKTOP</span><small>CONTEXT MENU</small></div>${items.map((item) => item.divider
      ? '<div class="context-menu-separator" role="separator"></div>'
      : `<button class="context-menu-item ${item.danger ? 'is-danger' : ''}" type="button" role="menuitem" data-context-action="${escapeHtml(item.action)}"${item.app ? ` data-app="${escapeHtml(item.app)}"` : ''}${item.url ? ` data-url="${escapeHtml(item.url)}"` : ''}${item.value ? ` data-value="${escapeHtml(item.value)}"` : ''}${item.index !== undefined ? ` data-index="${item.index}"` : ''}><span class="context-menu-icon">${escapeHtml(item.icon || '·')}</span><span class="context-menu-label">${escapeHtml(item.label)}</span><span class="context-menu-shortcut">${escapeHtml(item.shortcut || '')}</span></button>`).join('')}`;
    menu.hidden = false;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menu.style.left = '0px'; menu.style.top = '0px';
    requestAnimationFrame(() => {
      const maxX = window.innerWidth - menu.offsetWidth - 8;
      const maxY = window.innerHeight - menu.offsetHeight - 8;
      menu.style.left = `${Math.max(8, Math.min(x, maxX))}px`;
      menu.style.top = `${Math.max(8, Math.min(y, maxY))}px`;
      menu.classList.add('is-open');
      menu.querySelector('[role="menuitem"]')?.focus({ preventScroll: true });
    });
  }

  function closeContextMenu(restoreFocus = false) {
    const menu = $('#contextMenu');
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true');
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 140);
    const invoker = state.contextInvoker;
    state.contextTarget = null; state.contextInvoker = null;
    if (restoreFocus && invoker?.isConnected && invoker.matches('button,a,[tabindex]')) invoker.focus({ preventScroll: true });
  }

  function runContextAction(button) {
    const action = button.dataset.contextAction;
    const app = button.dataset.app;
    const item = app ? state.open.get(app) : null;
    const url = button.dataset.url;
    const value = button.dataset.value;
    const index = Number(button.dataset.index);
    closeContextMenu(false);
    if (action === 'open-app') openWindow(app);
    if (action === 'restore-window') {
      if (item) { item.minimized = false; item.node.classList.remove('is-minimized'); item.node.style.display = 'flex'; focusWindow(app); }
      else openWindow(app);
    }
    if (action === 'maximize-window') toggleMaximize(app);
    if (action === 'minimize-window') minimizeWindow(app);
    if (action === 'close-window') closeWindow(app);
    if (action === 'open-link' && url) { window.open(url, '_blank', 'noopener,noreferrer'); toast('Opening link', new URL(url).hostname); }
    if (action === 'copy-value' && value) copyText(value, '内容');
    if (action === 'play-track') chooseTrack(index);
    if (action === 'show-desktop') [...state.open.keys()].forEach((id) => minimizeWindow(id));
    if (action === 'refresh') { applyDesktopSettings(); toast('桌面效果已刷新', '当前壁纸与环境效果已重新载入。'); }
  }

  function bindContextMenu() {
    const menu = $('#contextMenu');
    document.addEventListener('contextmenu', (event) => {
      if (event.target.closest('#contextMenu')) { event.preventDefault(); return; }
      if (event.target.closest('input,textarea,select,[contenteditable="true"]') || window.getSelection()?.toString()) return;
      event.preventDefault();
      showContextMenu(event.clientX, event.clientY, event.target.closest('body') ? event.target : document.body, event.target);
    });
    menu.addEventListener('click', (event) => {
      const button = event.target.closest('[data-context-action]');
      if (!button) return;
      event.preventDefault(); event.stopPropagation();
      runContextAction(button);
    });
    document.addEventListener('pointerdown', (event) => {
      const pressedElement = event.target instanceof Element ? event.target : null;
      if (state.contextSuppressTarget && !pressedElement?.closest('#contextMenu') &&
          event.target !== state.contextSuppressTarget && !state.contextSuppressTarget.contains(event.target)) {
        state.contextSuppressTarget = null;
      }
      if (!menu.hidden && !event.target.closest('#contextMenu')) closeContextMenu(false);
    }, true);
    document.addEventListener('keydown', (event) => {
      const menuOpen = !menu.hidden;
      if (!menuOpen && (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) {
        event.preventDefault();
        const target = event.target instanceof Element ? event.target : document.body;
        const rect = target.getBoundingClientRect();
        showContextMenu(Math.min(rect.left + 12, window.innerWidth - 240), Math.min(rect.bottom + 5, window.innerHeight - 280), target, target);
        return;
      }
      if (!menuOpen) return;
      const buttons = $$('[role="menuitem"]', menu);
      const focused = buttons.indexOf(document.activeElement);
      if (event.key === 'Escape') { event.preventDefault(); closeContextMenu(true); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        buttons[(focused + step + buttons.length) % buttons.length]?.focus();
      }
      if (event.key === 'Home') { event.preventDefault(); buttons[0]?.focus(); }
      if (event.key === 'End') { event.preventDefault(); buttons.at(-1)?.focus(); }
    });
    let longPressStart = null;
    document.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch' || event.button !== 0 || event.target.closest('#contextMenu,.music-drop-grip,input,textarea,select,[contenteditable="true"]')) return;
      clearTimeout(state.contextLongPressTimer);
      longPressStart = { x: event.clientX, y: event.clientY, target: event.target };
      state.contextLongPressOrigin = event.target;
      state.contextLongPressTimer = setTimeout(() => {
        if (!longPressStart) return;
        const target = longPressStart.target;
        state.contextSuppressTarget = target.closest('a,button,[role="button"]') || target;
        const suppressTarget = state.contextSuppressTarget;
        setTimeout(() => { if (state.contextSuppressTarget === suppressTarget) state.contextSuppressTarget = null; }, 900);
        showContextMenu(longPressStart.x, longPressStart.y, target, target);
        longPressStart = null;
      }, 560);
    }, { passive: true });
    document.addEventListener('pointermove', (event) => {
      if (!longPressStart) return;
      if (Math.abs(event.clientX - longPressStart.x) > 10 || Math.abs(event.clientY - longPressStart.y) > 10) {
        clearTimeout(state.contextLongPressTimer); longPressStart = null;
      }
    }, { passive: true });
    document.addEventListener('pointerup', () => { clearTimeout(state.contextLongPressTimer); longPressStart = null; }, { passive: true });
    document.addEventListener('click', (event) => {
      const suppressed = state.contextSuppressTarget;
      if (!suppressed || event.target.closest('#contextMenu')) return;
      if (event.target === suppressed || suppressed.contains(event.target)) {
        event.preventDefault(); event.stopImmediatePropagation(); state.contextSuppressTarget = null;
      }
    }, true);
  }

  function bindMusicDrop() {
    const drop = $('#musicDrop');
    const grip = $('#musicDropGrip');
    if (!drop || !grip) return;
    const positionKey = `${MUSIC_DROP_POSITION_KEY}.${isMobile() ? 'mobile' : 'desktop'}`;
    try {
      const storedPosition = localStorage.getItem(positionKey);
      if (storedPosition !== null) {
        const saved = Number(storedPosition);
        if (Number.isFinite(saved) && saved >= 0 && saved <= 1) {
          drop.style.top = `${saved * 100}%`;
          drop.style.bottom = 'auto';
          drop.style.transform = 'translateY(-50%)';
          drop.dataset.positioned = 'true';
        }
      }
    } catch { /* The default CSS position still works. */ }
    let drag = null;
    const finishDrag = () => {
      if (!drag) return;
      if (drag.moved) {
        const rect = drop.getBoundingClientRect();
        try { localStorage.setItem(positionKey, String((rect.top + rect.height / 2) / window.innerHeight)); } catch { /* Dragging still works without persistence. */ }
      }
      drag = null;
    };
    grip.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      drag = { pointerId: event.pointerId, startY: event.clientY, startTop: drop.getBoundingClientRect().top, moved: false };
      grip.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    grip.addEventListener('pointermove', (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const delta = event.clientY - drag.startY;
      if (!drag.moved && Math.abs(delta) < 3) return;
      drag.moved = true;
      const maxTop = Math.max(8, window.innerHeight - drop.offsetHeight - 8);
      const top = Math.min(maxTop, Math.max(8, drag.startTop + delta));
      drop.style.top = `${top}px`;
      drop.style.bottom = 'auto';
      drop.style.transform = 'none';
      drop.dataset.positioned = 'true';
      event.preventDefault();
    });
    grip.addEventListener('pointerup', finishDrag);
    grip.addEventListener('pointercancel', finishDrag);
    drop.addEventListener('click', (event) => {
      const button = event.target.closest('[data-floating-music-action]');
      if (button) handleMusicAction(button.dataset.floatingMusicAction);
    });
    window.addEventListener('resize', () => {
      if (drop.dataset.positioned !== 'true') return;
      const rect = drop.getBoundingClientRect();
      const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
      const top = Math.min(maxTop, Math.max(8, rect.top));
      drop.style.top = `${top}px`;
      drop.style.bottom = 'auto';
      drop.style.transform = 'none';
    }, { passive: true });
    syncFloatingMusic();
  }

  function bindWindowLayer() {
    $('#windowLayer').addEventListener('click', (event) => {
      const windowNode = event.target.closest('.app-window');
      if (windowNode) focusWindow(windowNode.dataset.windowid);
      const action = event.target.closest('[data-window-action]');
      if (action && windowNode) {
        const id = windowNode.dataset.windowid;
        if (action.dataset.windowAction === 'close') closeWindow(id);
        if (action.dataset.windowAction === 'minimize') minimizeWindow(id);
        if (action.dataset.windowAction === 'maximize') toggleMaximize(id);
      }
      const open = event.target.closest('[data-open]');
      if (open) openWindow(open.dataset.open);
      const copy = event.target.closest('[data-copy]');
      if (copy) { event.preventDefault(); copyText(copy.dataset.copy, copy.dataset.copyLabel || '内容'); }
      const site = event.target.closest('[data-site]');
      if (site) toast(`Opening ${new URL(site.href).hostname}`, site.dataset.site);
      const playlistLink = event.target.closest('[data-playlist-open]');
      if (playlistLink) toast('Opening NetEase Cloud Music', '歌单 ID 8170701761');
      const actionMusic = event.target.closest('[data-music-action]');
      if (actionMusic) handleMusicAction(actionMusic.dataset.musicAction);
      if (event.target.closest('[data-music-retry]')) {
        state.musicLoaded = false; state.musicLoading = false;
        const list = $('#trackList'); if (list) list.innerHTML = '<div class="track-empty">正在重新连接…</div>';
        ensurePlaylist();
      }
      if (event.target.closest('[data-save-settings]')) { saveSettings(); toast('设置已保存', '下次打开时会恢复。'); }
      if (event.target.closest('[data-reset-settings]')) resetSettings();
    });
    $('#windowLayer').addEventListener('input', (event) => {
      if (event.target.id === 'musicProgress') seekAudio(Number(event.target.value));
      if (event.target.id === 'musicVolume') $('#audioPlayer').volume = Number(event.target.value);
      if (event.target.matches('[data-setting]')) {
        const input = event.target;
        state.settings[input.dataset.setting] = Number(input.value);
        const output = $(`output[for="${input.id}"]`, input.closest('.setting-control'));
        const suffix = input.dataset.setting === 'blur' ? 'px' : '%';
        if (output) output.value = `${input.value}${suffix}`;
        if (output) output.textContent = `${input.value}${suffix}`;
        applyDesktopSettings();
        saveSettings();
      }
    });
    $('#windowLayer').addEventListener('change', (event) => {
      const target = event.target;
      if (target.id === 'wallpaperChoice') {
        const wall = WALLPAPERS.find((item) => item.id === target.value);
        state.settings.wallpaper = target.value;
        state.settings.position = wall.position;
        $('#wallpaperPosition').value = wall.position;
        const oldObjectUrl = state.wallpaperObjectUrl;
        state.wallpaperObjectUrl = '';
        if (oldObjectUrl) setTimeout(() => URL.revokeObjectURL(oldObjectUrl), 1050);
        $('#wallpaperVideo').pause();
        $('#wallpaperVideo').classList.remove('is-active');
        $('#wallpaperBase').style.display = ''; $('#wallpaperNext').style.display = '';
        applyDesktopSettings(); saveSettings(); toast('壁纸已切换', wall.name);
      }
      if (target.id === 'wallpaperMode') {
        state.settings.mode = target.value;
        const video = $('#wallpaperVideo');
        if (video.classList.contains('is-active')) {
          if (state.settings.mode === 'dynamic') video.play().catch(() => {}); else video.pause();
        }
        applyDesktopSettings(); saveSettings();
      }
      if (target.id === 'environmentChoice') { state.settings.environment = target.value; applyDesktopSettings(); saveSettings(); }
      if (target.id === 'entryChoice') { state.settings.entry = target.value; saveSettings(); }
      if (target.id === 'wallpaperPosition') {
        state.settings.position = target.value;
        (state.wallpaperFront || $('#wallpaperBase')).style.backgroundPosition = target.value;
        $('#wallpaperVideo').style.objectPosition = target.value;
        saveSettings();
      }
      if (target.id === 'wallpaperFile' && target.files?.[0]) previewWallpaper(target.files[0]);
    });
  }

  function bindDragAndResize() {
    let gesture = null;
    $('#windowLayer').addEventListener('pointerdown', (event) => {
      const node = event.target.closest('.app-window');
      if (!node) return;
      const id = node.dataset.windowid;
      focusWindow(id);
      if (isMobile() || event.pointerType === 'touch') return;
      const item = state.open.get(id);
      if (!item || item.maximized) return;
      const rect = node.getBoundingClientRect();
      if (event.target.closest('.window-titlebar') && !event.target.closest('.window-controls')) {
        gesture = { type: 'drag', node, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top };
        event.preventDefault();
      } else if (event.target.closest('.resize-corner')) {
        gesture = { type: 'resize', node, startX: event.clientX, startY: event.clientY, width: rect.width, height: rect.height };
        event.preventDefault();
      }
    });
    document.addEventListener('pointermove', (event) => {
      if (!gesture) return;
      if (gesture.type === 'drag') {
        const left = Math.max(0, Math.min(window.innerWidth - 120, gesture.left + event.clientX - gesture.startX));
        const top = Math.max(0, Math.min(window.innerHeight - 115, gesture.top + event.clientY - gesture.startY));
        gesture.node.style.left = `${left}px`; gesture.node.style.top = `${top}px`;
      } else {
        const width = Math.max(360, Math.min(window.innerWidth - 35, gesture.width + event.clientX - gesture.startX));
        const height = Math.max(300, Math.min(window.innerHeight - 115, gesture.height + event.clientY - gesture.startY));
        gesture.node.style.width = `${width}px`; gesture.node.style.height = `${height}px`;
      }
    });
    document.addEventListener('pointerup', () => { gesture = null; });
  }

  async function copyText(value, label) {
    try {
      await navigator.clipboard.writeText(value);
      toast(`${label}已复制`, value);
    } catch {
      const input = document.createElement('textarea'); input.value = value; input.style.position = 'fixed'; input.style.opacity = '0'; document.body.append(input); input.select();
      const copied = document.execCommand('copy'); input.remove();
      toast(copied ? `${label}已复制` : '复制失败', value);
    }
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  function renderVisualizer() {
    const visual = $('#visualizer');
    if (!visual) return;
    visual.innerHTML = Array.from({ length: 42 }, (_, index) => {
      const height = 18 + ((index * 29 + 17) % 74);
      return `<i style="--bar:${height}%;--delay:${(index % 11) * -71}ms"></i>`;
    }).join('');
  }
  async function apiGet(path) {
    const controller = new AbortController();
    // This API can take around 18 seconds to build a playlist response.
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${MUSIC_API.base}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.code && json.code !== 200) throw new Error(`API ${json.code}`);
      return json;
    } finally { clearTimeout(timer); }
  }
  function musicOffline(reason) {
    const status = $('#musicState');
    if (status) { status.classList.remove('is-online'); status.querySelector('span').textContent = 'OFFLINE / FALLBACK'; }
    const list = $('#trackList');
    state.playerReady = false;
    if (list && !state.songList.length) list.innerHTML = `<div class="track-empty">暂时拿不到歌单数据。<small>${escapeHtml(reason || '网易云接口暂不可用')}<br>没有显示虚构歌曲。</small><button type="button" class="button-quiet" data-music-retry style="margin-top:10px">重试连接</button></div>`;
    const count = $('#playlistCount'); if (count) count.textContent = 'OFFLINE';
    const metric = $('[data-music-status]'); if (metric) metric.textContent = 'OFFLINE';
    syncFloatingMusic();
    if (state.open.has('music')) toast('Music is offline', '可以直接在网易云音乐打开歌单。');
  }
  function artistName(track) {
    const artists = track.ar || track.artists || [];
    return artists.map((artist) => artist.name).filter(Boolean).join(' / ') || '网易云音乐';
  }
  function trackCover(track) { return track.al?.picUrl || track.album?.picUrl || ''; }
  function renderTracks() {
    const list = $('#trackList');
    if (!list) return;
    if (!state.songList.length) {
      list.innerHTML = '<div class="track-empty">歌单列表暂不可用。<small>点击下方按钮打开网易云音乐。</small></div>';
      return;
    }
    list.innerHTML = state.songList.map((track, index) => `<div class="track-row ${index === state.currentTrack ? 'is-current' : ''}" data-track-index="${index}" role="button" tabindex="0" aria-label="播放 ${escapeHtml(track.name)}"><span class="track-number">${String(index + 1).padStart(2, '0')}</span><span class="track-meta"><b>${escapeHtml(track.name)}</b><small>${escapeHtml(artistName(track))}</small></span><span class="track-duration">${formatTime((track.dt || 0) / 1000)}</span></div>`).join('');
  }
  function ensurePlaylist() {
    if (state.musicLoaded) return Promise.resolve(state.songList);
    if (state.musicLoadPromise) return state.musicLoadPromise;
    state.musicLoading = true;
    renderVisualizer();
    const status = $('#musicState');
    if (status) status.querySelector('span').textContent = 'CONNECTING TO NETEASE';
    state.musicLoadPromise = (async () => {
      try {
        const payload = await apiGet(MUSIC_API.playlistDetail(PLAYLIST_ID));
        const playlist = payload.playlist;
        if (!playlist) throw new Error('playlist missing');
        const total = Number(playlist.trackCount || playlist.trackIds?.length || 0);
        state.playlistTotal = total;
        let tracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
        if (!tracks.length && playlist.trackIds?.length) {
          const ids = playlist.trackIds.slice(0, 60).map((item) => typeof item === 'number' ? item : item.id).filter(Boolean);
          const details = await apiGet(MUSIC_API.songDetail(ids));
          tracks = details.songs?.length ? details.songs : tracks;
        }
        // Keep the player list lightweight. The new API already embeds track
        // details, so avoid an extra slow song/detail request for large playlists.
        tracks = tracks.slice(0, 60);
        if (!tracks.length) throw new Error('playlist returned no track details');
        state.songList = tracks;
        state.musicLoaded = true;
        state.playerReady = true;
        const count = $('#playlistCount'); if (count) count.textContent = `${tracks.length}${total && total > tracks.length ? ` / ${total}` : ''} TRACKS`;
        const musicCount = $('#musicCount'); if (musicCount) musicCount.textContent = `${total || tracks.length} TRACKS`;
        const statusNow = $('#musicState'); if (statusNow) { statusNow.classList.add('is-online'); statusNow.querySelector('span').textContent = 'NETEASE / READY'; }
        const metric = $('[data-music-status]'); if (metric) metric.textContent = 'READY';
        renderTracks();
        return tracks;
      } catch (error) {
        state.musicLoaded = true;
        musicOffline(error.name === 'AbortError' ? 'API request timed out' : '网易云接口暂不可用');
        return [];
      } finally {
        state.musicLoading = false;
        state.musicLoadPromise = null;
      }
    })();
    return state.musicLoadPromise;
  }
  function randomTrackIndex(excludeIndex = state.currentTrack) {
    if (state.songList.length < 2) return Math.max(0, state.currentTrack);
    const choices = state.songList.map((_, index) => index).filter((index) => index !== excludeIndex);
    return choices[Math.floor(Math.random() * choices.length)];
  }
  function chooseTrack(index, { auto = false, remember = true } = {}) {
    if (!state.songList.length) { toast('歌单离线', '请从网易云音乐打开这个歌单。'); return; }
    const normalized = (index + state.songList.length) % state.songList.length;
    state.currentTrack = normalized;
    state.autoPlayAttempt = auto;
    if (remember && state.playMode === 'shuffle') {
      state.shuffleHistory = state.shuffleHistory.slice(0, state.shuffleCursor + 1);
      if (state.shuffleHistory.at(-1) !== normalized) state.shuffleHistory.push(normalized);
      state.shuffleCursor = state.shuffleHistory.length - 1;
    }
    const track = state.songList[normalized];
    const title = $('#trackTitle'); if (title) title.textContent = track.name || 'Unknown track';
    const artist = $('#trackArtist'); if (artist) artist.textContent = artistName(track);
    const duration = $('#duration'); if (duration) duration.textContent = formatTime((track.dt || 0) / 1000);
    const art = $('#musicArt');
    const cover = trackCover(track);
    if (art) {
      if (cover) art.innerHTML = `<img src="${escapeHtml(cover)}" alt="${escapeHtml(track.name || '专辑封面')}" crossorigin="anonymous"><div class="music-art-mark">♫</div>`;
      else if (IMAGE_ASSETS.musicFallback) art.innerHTML = `<img src="${escapeHtml(IMAGE_ASSETS.musicFallback)}" alt="默认专辑封面"><div class="music-art-mark">♫</div>`;
      else art.innerHTML = '<div class="music-art-mark">♫</div>';
    }
    const progress = $('#musicProgress'); if (progress) progress.value = 0;
    const currentTime = $('#currentTime'); if (currentTime) currentTime.textContent = '00:00';
    renderTracks();
    fetchLyrics(track.id);
    syncFloatingMusic();
    loadAndPlay(track, auto);
  }
  async function loadAndPlay(track, auto = false) {
    try {
      const payload = await apiGet(MUSIC_API.songUrl(track.id));
      const item = Array.isArray(payload.data) ? payload.data[0] : payload.data;
      if (!item?.url) throw new Error('playback url unavailable');
      const audio = $('#audioPlayer');
      const sourceUrl = new URL(item.url);
      if (sourceUrl.protocol === 'http:') sourceUrl.protocol = 'https:';
      audio.src = sourceUrl.toString();
      audio.volume = Number($('#musicVolume')?.value ?? .78);
      await audio.play();
      setPlaying(true);
    } catch (error) {
      if (error.name === 'NotAllowedError' && $('#audioPlayer').src) {
        state.playerReady = true;
        const artist = $('#trackArtist'); if (artist) artist.textContent = `${artistName(track)} · 点击播放按钮继续`;
        const status = $('#musicState'); if (status) { status.classList.add('is-online'); status.querySelector('span').textContent = 'READY / TAP TO PLAY'; }
        setPlaying(false);
        toast(auto ? '浏览器拦截了自动播放' : '播放需要一次点击', '打开音乐播放器并点击播放键即可继续。');
        return;
      }
      setPlaying(false);
      const artist = $('#trackArtist'); if (artist) artist.textContent = `${artistName(track)} · 当前歌曲无法在线播放`;
      musicOffline(error.name === 'AbortError' ? '歌曲地址响应超时' : '歌曲播放地址不可用，可在网易云打开。');
    }
  }
  async function fetchLyrics(id) {
    state.lyrics = [];
    state.lyricsTrackId = String(id);
    state.lyricsLoading = true;
    state.lyricsFailed = false;
    const pane = $('#lyricPane');
    if (pane) pane.innerHTML = '<b>LYRICS</b><span>正在读取歌词…</span>';
    syncFloatingMusic();
    try {
      const payload = await apiGet(MUSIC_API.lyric(id));
      if (state.lyricsTrackId !== String(id)) return;
      const raw = payload.lrc?.lyric || payload.yrc?.lyric || '';
      state.lyrics = parseLyrics(raw);
      state.lyricsLoading = false;
      if (pane) pane.innerHTML = state.lyrics.length ? `<b>LYRICS</b><span class="lyric-current">${escapeHtml(state.lyrics[0].text)}</span>` : '<b>LYRICS</b><span>这首歌没有可显示的歌词。</span>';
      syncFloatingMusic();
    } catch {
      if (state.lyricsTrackId !== String(id)) return;
      state.lyricsLoading = false; state.lyricsFailed = true;
      if (pane) pane.innerHTML = '<b>LYRICS</b><span>歌词服务暂不可用。</span>';
      syncFloatingMusic();
    }
  }
  function parseLyrics(raw) {
    return raw.split(/\r?\n/).flatMap((line) => {
      const tags = [...line.matchAll(/\[(\d{2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
      const text = line.replace(/\[[^\]]*\]/g, '').trim();
      return tags.filter(() => text).map((match) => ({ time: Number(match[1]) * 60 + Number(match[2]) + Number(`0.${match[3] || '0'}`), text }));
    }).sort((a, b) => a.time - b.time);
  }
  function currentLyricText(seconds) {
    if (!state.lyrics.length) return '';
    let current = state.lyrics[0];
    for (const lyric of state.lyrics) { if (lyric.time > seconds) break; current = lyric; }
    return current.text;
  }
  function updateLyric(seconds) {
    const text = currentLyricText(seconds);
    if (!text) return;
    const span = $('#lyricPane span'); if (span) span.textContent = text;
    const dropLyric = $('#musicDropLyric'); if (dropLyric) dropLyric.textContent = text;
  }
  function setPlaying(playing) {
    const audio = $('#audioPlayer');
    const visual = $('#visualizer'); const art = $('#musicArt');
    if (visual) visual.classList.toggle('is-playing', playing);
    if (art) art.classList.toggle('is-playing', playing);
    const button = $('[data-music-action="toggle"]');
    if (button) { button.textContent = playing ? 'Ⅱ' : '▶'; button.setAttribute('aria-label', playing ? '暂停' : '播放'); }
    const status = $('#musicState');
    if (status && state.musicLoaded) { status.classList.toggle('is-online', state.playerReady); status.querySelector('span').textContent = playing ? 'PLAYING' : (state.playerReady ? 'NETEASE / READY' : 'OFFLINE / FALLBACK'); }
    const duration = $('#duration');
    if (playing && audio?.duration && duration) duration.textContent = formatTime(audio.duration);
    syncFloatingMusic();
  }
  function updateMusicModeButton() {
    const button = $('[data-music-action="mode"]');
    const mode = MUSIC_MODES[state.playMode] || MUSIC_MODES.shuffle;
    if (button) {
      button.innerHTML = `<span class="music-mode-icon" aria-hidden="true">${mode.icon}</span><span>${mode.label}</span>`;
      button.setAttribute('aria-label', `播放模式：${mode.label}，点击切换`);
      button.dataset.mode = state.playMode;
    }
    syncFloatingMusic();
  }
  function cycleMusicMode() {
    const modes = Object.keys(MUSIC_MODES);
    const current = modes.indexOf(state.playMode);
    state.playMode = modes[(current + 1) % modes.length];
    if (state.playMode === 'shuffle') {
      state.shuffleHistory = state.currentTrack >= 0 ? [state.currentTrack] : [];
      state.shuffleCursor = state.shuffleHistory.length - 1;
    }
    saveMusicMode();
    updateMusicModeButton();
    toast('播放模式', MUSIC_MODES[state.playMode].label);
  }
  function advanceTrack() {
    if (!state.songList.length) { ensurePlaylist().then((tracks) => { if (tracks.length) advanceTrack(); }); return; }
    const next = state.playMode === 'shuffle'
      ? randomTrackIndex()
      : (state.currentTrack + 1 + state.songList.length) % state.songList.length;
    chooseTrack(next);
  }
  function previousTrack() {
    if (!state.songList.length) { ensurePlaylist().then((tracks) => { if (tracks.length) previousTrack(); }); return; }
    if (state.currentTrack < 0) {
      chooseTrack(state.playMode === 'shuffle' ? randomTrackIndex(-1) : 0);
      return;
    }
    const audio = $('#audioPlayer');
    if (audio.currentTime > 4) { audio.currentTime = 0; return; }
    if (state.playMode === 'shuffle' && state.shuffleCursor > 0) {
      state.shuffleCursor -= 1;
      chooseTrack(state.shuffleHistory[state.shuffleCursor], { remember: false });
      return;
    }
    const previous = state.playMode === 'shuffle'
      ? randomTrackIndex()
      : (state.currentTrack - 1 + state.songList.length) % state.songList.length;
    chooseTrack(previous);
  }
  function startAutoPlay() {
    if (state.autoPlayStarted) return;
    state.autoPlayStarted = true;
    ensurePlaylist().then((tracks) => {
      if (!tracks.length || state.currentTrack >= 0) return;
      const startIndex = state.playMode === 'shuffle' ? randomTrackIndex(-1) : 0;
      chooseTrack(startIndex, { auto: true });
    });
  }
  function syncMusicWindow() {
    updateMusicModeButton();
    if (!$('#trackList')) return;
    if (state.musicLoaded) {
      const count = $('#playlistCount'); if (count) count.textContent = `${state.songList.length}${state.playlistTotal > state.songList.length ? ` / ${state.playlistTotal}` : ''} TRACKS`;
      const musicCount = $('#musicCount'); if (musicCount) musicCount.textContent = `${state.playlistTotal || state.songList.length} TRACKS`;
      renderTracks();
    }
    const track = state.songList[state.currentTrack];
    if (track) {
      const title = $('#trackTitle'); if (title) title.textContent = track.name || 'Unknown track';
      const artist = $('#trackArtist'); if (artist) artist.textContent = artistName(track);
      const duration = $('#duration'); if (duration) duration.textContent = formatTime((track.dt || 0) / 1000);
      const art = $('#musicArt');
      const cover = trackCover(track) || IMAGE_ASSETS.musicFallback;
      if (art && cover) art.innerHTML = `<img src="${escapeHtml(cover)}" alt="${escapeHtml(track.name || '专辑封面')}" crossorigin="anonymous"><div class="music-art-mark">♫</div>`;
      const pane = $('#lyricPane');
      if (pane) {
        if (state.lyrics.length) pane.innerHTML = `<b>LYRICS</b><span class="lyric-current">${escapeHtml(state.lyrics[0].text)}</span>`;
        else if (state.lyricsLoading) pane.innerHTML = '<b>LYRICS</b><span>正在读取歌词…</span>';
        else if (state.lyricsFailed) pane.innerHTML = '<b>LYRICS</b><span>歌词服务暂不可用。</span>';
        else if (state.lyricsTrackId === String(track.id)) pane.innerHTML = '<b>LYRICS</b><span>这首歌没有可显示的歌词。</span>';
        else fetchLyrics(track.id);
      }
    }
    const audio = $('#audioPlayer');
    if (audio) setPlaying(!audio.paused && !audio.ended);
    syncFloatingMusic();
  }
  function pauseAudio() { const audio = $('#audioPlayer'); audio.pause(); setPlaying(false); }
  async function togglePlayback() {
    state.autoPlayAttempt = false;
    const audio = $('#audioPlayer');
    if (!state.songList.length) { await ensurePlaylist(); if (!state.songList.length) return; }
    if (audio.src && !audio.paused) { pauseAudio(); return; }
    if (audio.src && audio.paused) { try { await audio.play(); setPlaying(true); } catch { setPlaying(false); } return; }
    chooseTrack(state.currentTrack >= 0 ? state.currentTrack : (state.playMode === 'shuffle' ? randomTrackIndex(-1) : 0));
  }
  function handleMusicAction(action) {
    if (action === 'toggle') togglePlayback();
    if (action === 'next') advanceTrack();
    if (action === 'previous') previousTrack();
    if (action === 'mode') cycleMusicMode();
  }
  function seekAudio(value) {
    const audio = $('#audioPlayer');
    if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = (value / 1000) * audio.duration;
  }
  function bindAudio() {
    const audio = $('#audioPlayer');
    audio.addEventListener('timeupdate', () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      $('#musicProgress').value = String(Math.round((audio.currentTime / audio.duration) * 1000));
      $('#currentTime').textContent = formatTime(audio.currentTime);
      $('#duration').textContent = formatTime(audio.duration);
      updateLyric(audio.currentTime);
    });
    audio.addEventListener('ended', () => {
      if (state.playMode === 'single') {
        audio.currentTime = 0;
        audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      } else advanceTrack();
    });
    audio.addEventListener('play', () => setPlaying(true));
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('error', () => { if (audio.src) musicOffline('浏览器无法播放这首歌曲。'); });
  }

  function bindSettings(windowNode) {
    const shade = windowNode.querySelector('#setting-shade');
    if (shade) shade.addEventListener('input', (event) => { state.settings.shade = Number(event.target.value); applyDesktopSettings(); });
  }
  function resetSettings() {
    const oldObjectUrl = state.wallpaperObjectUrl;
    state.wallpaperObjectUrl = '';
    state.settings = { wallpaper: 'city', position: 'center 48%', brightness: 73, blur: 0, shade: 36, saturation: 102, mode: 'dynamic', environment: 'auto', entry: 'auto' };
    $('#wallpaperVideo').pause(); $('#wallpaperVideo').classList.remove('is-active'); $('#wallpaperBase').style.display = ''; $('#wallpaperNext').style.display = '';
    applyDesktopSettings(); saveSettings(); closeWindow('settings', false); openWindow('settings'); toast('已恢复默认', '雨夜壁纸与动态效果已重置。');
    if (oldObjectUrl) setTimeout(() => URL.revokeObjectURL(oldObjectUrl), 1050);
  }
  function previewWallpaper(file) {
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    const isVideo = ['video/mp4', 'video/webm'].includes(type) || /\.(mp4|webm)$/.test(name);
    const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(type) || /\.(jpe?g|png|webp)$/.test(name);
    if (!isVideo && !isImage) { toast('文件格式不支持', '请选择 JPG、PNG、WebP、MP4 或 WebM。'); return; }
    if (file.size > 80 * 1024 * 1024) { toast('文件有点大', '请选小于 80 MB 的壁纸文件。'); return; }
    if (state.wallpaperObjectUrl) URL.revokeObjectURL(state.wallpaperObjectUrl);
    const url = URL.createObjectURL(file);
    state.wallpaperObjectUrl = url;
    const video = $('#wallpaperVideo');
    if (isVideo) {
      if (state.settings.mode !== 'dynamic') {
        state.settings.mode = 'dynamic';
        const modeSelect = $('#wallpaperMode'); if (modeSelect) modeSelect.value = 'dynamic';
        saveSettings();
      }
      showWallpaperVideo(url);
    } else {
      video.onerror = null; video.oncanplay = null; video.dataset.awaitingGesture = '';
      video.pause(); video.removeAttribute('src'); video.load();
      video.classList.remove('is-active'); $('#wallpaperBase').style.display = 'block'; $('#wallpaperNext').style.display = 'block';
      setWallpaperBackground(url, state.settings.position);
    }
    toast('壁纸预览已更新', '只在本次浏览器会话中有效。');
  }

  function bindGuestbook(node) {
    node.querySelector('#guestbookForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = (node.querySelector('#guestName').value || '').trim().slice(0, 24);
      const message = (node.querySelector('#guestMessage').value || '').trim().slice(0, 220);
      if (!message) return;
      const messages = readGuestbook();
      messages.push({ name: name || '访客', text: message, date: new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date()) });
      try { localStorage.setItem('moxan_guestbook', JSON.stringify(messages.slice(-30))); }
      catch { toast('保存失败', '浏览器本地存储暂时不可用。'); return; }
      node.querySelector('#guestbookMessages').innerHTML = guestbookMessages(readGuestbook());
      event.target.reset(); toast('留言保存好了', '只保存在这台设备的浏览器中。');
    });
  }
  function bindConsole(node) {
    const input = node.querySelector('#terminalInput');
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      const command = input.value.trim().toLowerCase(); input.value = '';
      const output = node.querySelector('#terminalOutput');
      const lines = {
        help: 'help   whoami   date   clear   motd', whoami: 'Mogo · frontend engineer · electronic music listener',
        motd: 'Keep building. Keep listening. Stay curious.', date: new Date().toString()
      };
      if (command === 'clear') output.innerHTML = '';
      else {
        const result = lines[command] || (command ? `command not found: ${escapeHtml(command)}` : '');
        output.insertAdjacentHTML('beforeend', `<p><span class="prompt">C:\\MOXAN&gt;</span> ${escapeHtml(command)}</p>${result ? `<p>${result}</p>` : ''}`);
      }
      node.querySelector('.window-body').scrollTop = node.querySelector('.window-body').scrollHeight;
    });
  }

  function syncWeather() {
    const canvas = $('#weatherCanvas');
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;
    cancelAnimationFrame(state.weatherTick);
    const bounds = { width: 0, height: 0, dpr: 1 };
    const setting = isReducedMotion || state.settings.mode === 'static' ? 'none' : document.body.dataset.environment || 'rain';
    const lowPower = isMobile();
    const count = setting === 'rain' ? (lowPower ? 50 : 110) : setting === 'snow' ? (lowPower ? 40 : 90) : setting === 'particles' ? (lowPower ? 25 : 52) : 0;
    const resize = () => {
      bounds.width = window.innerWidth; bounds.height = window.innerHeight; bounds.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(bounds.width * bounds.dpr); canvas.height = Math.round(bounds.height * bounds.dpr);
      canvas.style.width = `${bounds.width}px`; canvas.style.height = `${bounds.height}px`;
      context.setTransform(bounds.dpr, 0, 0, bounds.dpr, 0, 0);
    };
    resize();
    window.removeEventListener('resize', state.weatherResize || (() => {}));
    state.weatherResize = resize; window.addEventListener('resize', resize, { passive: true });
    if (!count) { context.clearRect(0, 0, bounds.width, bounds.height); return; }
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * bounds.width, y: Math.random() * bounds.height,
      length: setting === 'rain' ? 6 + Math.random() * 15 : 1.2 + Math.random() * (setting === 'snow' ? 3 : 1.3),
      speed: setting === 'rain' ? 3.2 + Math.random() * 6.8 : setting === 'snow' ? .35 + Math.random() * 1.35 : .12 + Math.random() * .4,
      drift: (Math.random() - .5) * (setting === 'snow' ? .7 : .36), opacity: .12 + Math.random() * .32,
      radius: 0.6 + Math.random() * 1.4, phase: Math.random() * Math.PI * 2
    }));
    let frame = 0;
    const draw = () => {
      context.clearRect(0, 0, bounds.width, bounds.height);
      for (const particle of particles) {
        particle.y += particle.speed;
        particle.x += particle.drift + (setting === 'particles' ? Math.sin(frame * .008 + particle.phase) * .13 : 0);
        if (particle.y > bounds.height + 20) { particle.y = -20; particle.x = Math.random() * bounds.width; }
        if (particle.x < -20) particle.x = bounds.width + 10;
        if (particle.x > bounds.width + 20) particle.x = -10;
        context.globalAlpha = particle.opacity;
        if (setting === 'rain') {
          context.strokeStyle = 'rgba(190,221,230,.72)'; context.lineWidth = .7;
          context.beginPath(); context.moveTo(particle.x, particle.y); context.lineTo(particle.x - particle.drift * 5, particle.y + particle.length); context.stroke();
        } else {
          context.fillStyle = setting === 'snow' ? 'rgba(224,241,241,.78)' : 'rgba(164,214,220,.74)';
          context.beginPath(); context.arc(particle.x, particle.y, setting === 'snow' ? particle.radius : particle.radius * .7, 0, Math.PI * 2); context.fill();
        }
      }
      context.globalAlpha = 1; frame++;
      state.weatherTick = requestAnimationFrame(draw);
    };
    state.weatherTick = requestAnimationFrame(draw);
  }

  function bindIntro() {
    const screen = $('#entryScreen');
    const skip = () => {
      clearTimeout(state.introTimer);
      screen.classList.add('is-leaving');
      document.body.classList.remove('booting');
      try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* Intro is cosmetic. */ }
      setTimeout(() => { screen.classList.remove('is-active', 'is-leaving'); screen.setAttribute('aria-hidden', 'true'); }, 850);
    };
    const seen = (() => { try { return localStorage.getItem(INTRO_KEY) === '1'; } catch { return false; } })();
    const env = state.settings.entry === 'auto' ? document.body.dataset.environment : state.settings.entry;
    if (state.settings.entry === 'none' || (state.settings.entry === 'auto' && env === 'none')) {
      screen.classList.remove('is-active'); screen.setAttribute('aria-hidden', 'true'); document.body.classList.remove('booting');
      return;
    }
    $('#entryCaption').textContent = env === 'none' ? 'RESTORING DIGITAL SPACE' : `INITIALIZING · ${String(env || 'rain').toUpperCase()} MODE`;
    screen.setAttribute('aria-hidden', 'false'); screen.classList.add('is-active');
    state.introTimer = setTimeout(skip, isReducedMotion ? 320 : seen ? 800 : 2150);
    $('#skipIntro').addEventListener('click', skip);
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && screen.classList.contains('is-active')) skip(); });
  }

  function bindTypewriter() {
    const phrases = ['Music / Code / Life.', 'Front-end Architecture.', 'Electronic Music at 02:17.', 'Building a quieter web.'];
    const target = $('#typewriter');
    if (isReducedMotion) { target.textContent = phrases[0]; return; }
    let phrase = 0; let letter = 0; let deleting = false;
    const step = () => {
      const word = phrases[phrase];
      letter += deleting ? -1 : 1;
      target.textContent = word.slice(0, Math.max(0, letter));
      let delay = deleting ? 38 : 74;
      if (!deleting && letter >= word.length) { deleting = true; delay = 2400; }
      else if (deleting && letter <= 0) { deleting = false; phrase = (phrase + 1) % phrases.length; delay = 280; }
      setTimeout(step, delay);
    };
    setTimeout(step, 650);
  }
  function bindTime() {
    const update = () => {
      const now = new Date();
      const time = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
      const shortTime = time.slice(0, 5);
      const date = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).format(now);
      $('#topTime').textContent = shortTime; $('#topDate').textContent = date.replaceAll('/', ' / ');
      $('#trayTime').textContent = shortTime; $('#trayDate').textContent = date.replaceAll('/', ' / ');
      $$('[data-live-clock]').forEach((node) => { node.textContent = time; });
      $$('[data-live-date]').forEach((node) => { node.textContent = date; });
      $$('[data-live-wallpaper]').forEach((node) => { node.textContent = `${String(document.body.dataset.environment || 'rain').toUpperCase()} / ${state.settings.mode.toUpperCase()}`; });
      $$('[data-system-weather]').forEach((node) => { node.textContent = state.settings.mode === 'static' ? 'PAUSED' : 'ACTIVE'; });
      const period = timePeriod(); if (period !== document.body.dataset.hours) { applyDesktopSettings(); }
    };
    update(); setInterval(update, 1000);
  }
  function bindInteractions() {
    document.addEventListener('pointerdown', () => {
      const video = $('#wallpaperVideo');
      if (video.dataset.awaitingGesture !== 'true' || !video.classList.contains('is-active') || state.settings.mode !== 'dynamic') return;
      video.play().then(() => { delete video.dataset.awaitingGesture; }).catch(() => {});
    }, { passive: true });
    $('#startButton').addEventListener('click', () => toggleStartMenu());
    $('#mobileStart').addEventListener('click', () => toggleStartMenu());
    $('#taskbarWindows').addEventListener('click', (event) => {
      const button = event.target.closest('[data-task-window]'); if (!button) return;
      const id = button.dataset.taskWindow; const item = state.open.get(id);
      if (!item) return;
      if (item.minimized) { item.minimized = false; item.node.classList.remove('is-minimized'); item.node.style.display = 'flex'; focusWindow(id); }
      else if (state.activeId === id) minimizeWindow(id);
      else focusWindow(id);
    });
    document.addEventListener('click', (event) => {
      const openButton = event.target.closest('[data-open]');
      if (openButton && !openButton.closest('.app-window')) openWindow(openButton.dataset.open);
      if (!event.target.closest('#startMenu') && !event.target.closest('#startButton') && !event.target.closest('#mobileStart')) closeStartMenu();
    });
    document.addEventListener('input', (event) => {
      if (event.target.id !== 'startSearch') return;
      const query = event.target.value.trim().toLowerCase();
      $$('.start-app', $('#startMenu')).forEach((button) => { button.hidden = query && !button.textContent.toLowerCase().includes(query); });
    });
    document.addEventListener('click', (event) => {
      const item = event.target.closest('[data-track-index]');
      if (item) chooseTrack(Number(item.dataset.trackIndex));
    });
    document.addEventListener('keydown', (event) => {
      const track = event.target.closest('[data-track-index]');
      if (track && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); chooseTrack(Number(track.dataset.trackIndex)); }
      if (event.key === 'Escape') closeStartMenu();
    });
    let eggClicks = [];
    $('#startButton').addEventListener('click', () => {
      eggClicks = eggClicks.filter((time) => Date.now() - time < 2600); eggClicks.push(Date.now());
      if (eggClicks.length >= 5) { eggClicks = []; openWindow('console'); toast('Developer Mode', 'Moxan Developer Console unlocked.'); }
    });
    document.addEventListener('keydown', (event) => {
      if (event.target.matches('input,textarea,select,[contenteditable="true"]') || event.ctrlKey || event.altKey || event.metaKey) return;
      state.eggKeys = `${state.eggKeys}${event.key.toLowerCase()}`.slice(-4);
      if (state.eggKeys === 'mogo') { state.eggKeys = ''; openWindow('console'); toast('Developer Mode', 'Moxan Developer Console unlocked.'); }
    });
  }
  function bindCursor() {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const dot = $('#cursorDot'); const ripple = $('#cursorRipple'); let x = 0; let y = 0; let frame = 0;
    window.addEventListener('mousemove', (event) => {
      x = event.clientX; y = event.clientY;
      document.documentElement.style.setProperty('--pointer-x', `${x}px`); document.documentElement.style.setProperty('--pointer-y', `${y}px`);
      const card = event.target.closest('#heroCard');
      if (card) { const rect = card.getBoundingClientRect(); card.style.setProperty('--card-x', `${event.clientX - rect.left}px`); card.style.setProperty('--card-y', `${event.clientY - rect.top}px`); }
      cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { dot.style.left = `${x}px`; dot.style.top = `${y}px`; dot.classList.add('is-visible'); });
      dot.classList.toggle('is-hover', Boolean(event.target.closest('a,button,[role="button"]')));
    }, { passive: true });
    window.addEventListener('mousedown', (event) => {
      ripple.style.left = `${event.clientX}px`; ripple.style.top = `${event.clientY}px`;
      ripple.classList.remove('is-active'); void ripple.offsetWidth; ripple.classList.add('is-active');
    }, { passive: true });
    document.addEventListener('mouseleave', () => dot.classList.remove('is-visible'));
  }
  function bindDocumentLinks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[target="_blank"]');
      if (link && !link.dataset.site && !link.hasAttribute('data-playlist-open')) {
        if (link.href.startsWith('https://')) toast('Opening link', new URL(link.href).hostname);
      }
    });
  }

  function init() {
    randomizeWallpaperOnEntry();
    renderLauncher();
    renderAvatar();
    applyDesktopSettings();
    bindWindowLayer(); bindDragAndResize(); bindAudio(); bindMusicDrop(); bindContextMenu(); bindInteractions(); bindCursor(); bindDocumentLinks();
    bindTime(); bindTypewriter(); bindIntro();
    startAutoPlay();
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(state.weatherTick); else syncWeather(); });
    window.addEventListener('resize', () => {
      if (isMobile()) $$('.app-window', $('#windowLayer')).forEach((node) => { node.style.left = ''; node.style.top = ''; });
      else state.open.forEach((item) => { if (!item.maximized) { const rect = item.node.getBoundingClientRect(); item.node.style.left = `${Math.max(0, Math.min(rect.left, window.innerWidth - 100))}px`; } });
    }, { passive: true });
    $('#heroCard').addEventListener('mousemove', (event) => {
      if (isReducedMotion || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      event.currentTarget.style.transform = `perspective(1100px) rotateX(${(-y * 1.4).toFixed(2)}deg) rotateY(${(x * 1.5).toFixed(2)}deg)`;
    });
    $('#heroCard').addEventListener('mouseleave', (event) => { event.currentTarget.style.transform = ''; });
  }

  init();
})();
