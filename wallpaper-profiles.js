(() => {
  const DEFAULTS = { brightness: 80, blur: 0, overlay: 10, saturation: 120 };
  const STORAGE_KEY = 'moxan.wallpaper-profiles.v2';
  const TYPES = {
    brightness: /亮度|brightness/i,
    blur: /柔化|模糊|blur/i,
    overlay: /暗色|遮罩|蒙版|overlay/i,
    saturation: /饱和|saturation/i,
  };
  let activeKey = '';
  let applying = false;
  let scheduled = false;
  let profilePanel;
  let profileFields = {};

  const readProfiles = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  };
  const saveProfiles = (profiles) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles)); }
    catch { /* storage may be unavailable */ }
  };
  const wallpaperKey = () => {
    const vw = innerWidth || 1;
    const vh = innerHeight || 1;
    const candidates = [];
    const add = (node, url, weight) => {
      if (!url || !node) return;
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.05) return;
      const rect = node.getBoundingClientRect();
      const area = Math.max(0, rect.width) * Math.max(0, rect.height);
      if (area < vw * vh * 0.16) return;
      candidates.push({ url, score: area * weight });
    };

    document.querySelectorAll('video').forEach((video) => {
      const source = video.currentSrc || video.src || video.querySelector('source')?.src || video.poster;
      add(video, source, 2);
    });
    document.querySelectorAll('img').forEach((img) => add(img, img.currentSrc || img.src, 1));
    const nodes = [document.documentElement, document.body, ...document.querySelectorAll('[style*="background"], .wallpaper, [class*="background"], [class*="wallpaper"]')];
    nodes.forEach((node) => {
      if (!node) return;
      const image = getComputedStyle(node).backgroundImage;
      const match = image.match(/url\(["']?(.*?)["']?\)/i);
      if (match) add(node, match[1], 1.4);
    });
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.url?.split('#')[0] || '';
  };

  const controlType = (input) => {
    const directParts = [input.getAttribute('aria-label'), input.id, input.name, input.title];
    input.labels?.forEach((label) => directParts.push(label.innerText || label.textContent));
    for (const [type, pattern] of Object.entries(TYPES)) {
      if (directParts.some((part) => part && pattern.test(part))) return type;
    }
    let parent = input.parentElement;
    for (let depth = 0; parent && depth < 4; depth++, parent = parent.parentElement) {
      const text = parent.innerText || parent.textContent || '';
      const matches = Object.entries(TYPES).filter(([, pattern]) => pattern.test(text));
      if (parent.querySelectorAll('input[type="range"]').length <= 1 && matches.length === 1) return matches[0][0];
    }
    return '';
  };
  const mappedControls = () => [...document.querySelectorAll('input[type="range"]')]
    .map((input) => ({ input, type: input.dataset.moxanWallpaperType || controlType(input) }))
    .filter(({ type }) => type);
  const asSliderValue = (input, type, value) => {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    let actual = value;
    if (type === 'overlay' && max <= 1) actual = value / 100;
    if ((type === 'brightness' || type === 'saturation') && max <= 10) actual = value / 100;
    return String(Math.min(max, Math.max(min, actual)));
  };
  const fromSliderValue = (input, type, value) => {
    const max = Number(input.max || 100);
    const actual = Number(value);
    if (type === 'overlay' && max <= 1) return actual * 100;
    if ((type === 'brightness' || type === 'saturation') && max <= 10) return actual * 100;
    return actual;
  };
  const setSlider = (input, value) => {
    if (input.value === value) return;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const applyProfile = (key) => {
    const controls = mappedControls();
    const profiles = readProfiles();
    let profile = profiles[key];
    if (!profile) {
      try {
        const legacy = JSON.parse(localStorage.getItem('moxan.wallpaper-profiles.v1') || '{}')[key];
        if (legacy) {
          profile = { ...DEFAULTS };
          controls.forEach(({ input, type }) => {
            if (legacy[type] !== undefined) profile[type] = fromSliderValue(input, type, legacy[type]);
          });
          profiles[key] = profile;
          saveProfiles(profiles);
        }
      } catch { /* ignore an invalid previous profile */ }
    }
    profile ||= DEFAULTS;
    applying = true;
    controls.forEach(({ input, type }) => {
      input.dataset.moxanWallpaperType = type;
      const raw = Object.prototype.hasOwnProperty.call(profile, type) ? profile[type] : DEFAULTS[type];
      setSlider(input, asSliderValue(input, type, raw));
    });
    applying = false;
    renderProfileEditor();
  };
  const wallpaperLabel = (key) => {
    if (!key) return '尚未识别当前壁纸';
    try {
      const url = new URL(key, location.href);
      const file = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || url.hostname);
      return file.length > 38 ? `${file.slice(0, 35)}…` : file;
    } catch { return key.slice(0, 38); }
  };
  const renderProfileEditor = () => {
    if (!profilePanel) return;
    const saved = activeKey ? readProfiles()[activeKey] : null;
    const profile = saved || DEFAULTS;
    const currentLabel = profilePanel.querySelector('[data-wallpaper-current]');
    currentLabel.textContent = wallpaperLabel(activeKey);
    currentLabel.title = activeKey || '';
    Object.entries(profileFields).forEach(([type, field]) => {
      if (document.activeElement !== field) field.value = String(profile[type] ?? DEFAULTS[type]);
    });
    profilePanel.querySelector('[data-wallpaper-status]').textContent = saved
      ? '已加载这张壁纸保存的初始值' : '当前壁纸使用全站默认值';
  };
  const createProfileEditor = () => {
    if (profilePanel) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'wallpaper-profile-launcher';
    button.textContent = '⚙ 壁纸初始值';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'wallpaperProfilePanel');
    profilePanel = document.createElement('section');
    profilePanel.id = 'wallpaperProfilePanel';
    profilePanel.className = 'wallpaper-profile-panel';
    profilePanel.hidden = true;
    profilePanel.setAttribute('aria-label', '当前壁纸初始参数');
    profilePanel.innerHTML = `
      <header class="wallpaper-profile-head"><div><strong>壁纸初始参数</strong><small data-wallpaper-current></small></div><button type="button" data-wallpaper-close aria-label="关闭">×</button></header>
      <p class="wallpaper-profile-help">为当前壁纸单独设置。再次切换到这张壁纸时会自动恢复。</p>
      <label>亮度 <span><input type="number" data-profile-field="brightness" min="0" max="200" step="1">%</span></label>
      <label>柔化 <span><input type="number" data-profile-field="blur" min="0" max="100" step="1">px</span></label>
      <label>暗色遮罩 <span><input type="number" data-profile-field="overlay" min="0" max="100" step="1">%</span></label>
      <label>色彩饱和 <span><input type="number" data-profile-field="saturation" min="0" max="300" step="1">%</span></label>
      <div class="wallpaper-profile-actions"><button type="button" data-profile-reset>恢复全站默认</button><button type="button" data-profile-save>保存此壁纸</button></div>
      <small class="wallpaper-profile-status" data-wallpaper-status></small>`;
    document.body.append(button, profilePanel);
    profilePanel.querySelectorAll('[data-profile-field]').forEach((field) => { profileFields[field.dataset.profileField] = field; });
    const close = () => { profilePanel.hidden = true; button.setAttribute('aria-expanded', 'false'); };
    button.addEventListener('click', () => {
      profilePanel.hidden = !profilePanel.hidden;
      button.setAttribute('aria-expanded', String(!profilePanel.hidden));
      renderProfileEditor();
    });
    profilePanel.querySelector('[data-wallpaper-close]').addEventListener('click', close);
    profilePanel.querySelector('[data-profile-save]').addEventListener('click', () => {
      if (!activeKey) {
        profilePanel.querySelector('[data-wallpaper-status]').textContent = '暂时无法识别壁纸，请先切换或加载一张壁纸。';
        return;
      }
      const values = {};
      for (const [type, field] of Object.entries(profileFields)) {
        const value = Number(field.value);
        if (!Number.isFinite(value)) {
          profilePanel.querySelector('[data-wallpaper-status]').textContent = '请为所有参数填写有效数字。';
          field.focus();
          return;
        }
        if (value < Number(field.min) || value > Number(field.max)) {
          profilePanel.querySelector('[data-wallpaper-status]').textContent = `参数范围为 ${field.min}–${field.max}。`;
          field.focus();
          return;
        }
        values[type] = value;
      }
      const profiles = readProfiles();
      profiles[activeKey] = values;
      saveProfiles(profiles);
      applyProfile(activeKey);
      profilePanel.querySelector('[data-wallpaper-status]').textContent = '已保存并应用到当前壁纸。';
    });
    profilePanel.querySelector('[data-profile-reset]').addEventListener('click', () => {
      if (activeKey) {
        const profiles = readProfiles();
        delete profiles[activeKey];
        saveProfiles(profiles);
        applyProfile(activeKey);
      }
      renderProfileEditor();
      profilePanel.querySelector('[data-wallpaper-status]').textContent = '已恢复全站默认值。';
    });
    renderProfileEditor();
  };
  const scheduleSync = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const nextKey = wallpaperKey();
      if (nextKey !== activeKey) {
        activeKey = nextKey;
        applyProfile(activeKey);
      }
    });
  };
  const bindControls = () => {
    let added = false;
    mappedControls().forEach(({ input, type }) => {
      input.dataset.moxanWallpaperType = type;
      if (input.dataset.moxanWallpaperBound) return;
      input.dataset.moxanWallpaperBound = 'true';
      added = true;
      input.addEventListener('input', () => {
        if (applying || !activeKey) return;
        const profiles = readProfiles();
        profiles[activeKey] ||= { ...DEFAULTS };
        profiles[activeKey][type] = fromSliderValue(input, type, input.value);
        saveProfiles(profiles);
        renderProfileEditor();
      });
    });
    if (added && activeKey) applyProfile(activeKey);
  };
  const init = () => {
    createProfileEditor();
    bindControls();
    scheduleSync();
    new MutationObserver(() => { bindControls(); scheduleSync(); }).observe(document.documentElement, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'poster', 'style', 'class'],
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
