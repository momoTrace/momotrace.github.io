(() => {
  const init = () => {
    const drop = document.getElementById('musicDrop');
    const toggle = document.getElementById('musicDropToggle');
    const cover = document.getElementById('musicDropCover');
    const orbCover = document.getElementById('musicDropOrbCover');
    if (!drop || !toggle) return;

    const positionKey = 'moxan.music-orb-position.v1';
    const mediaKey = () => matchMedia('(max-width: 640px)').matches ? 'mobile' : 'desktop';
    const readPosition = () => {
      try {
        const value = JSON.parse(localStorage.getItem(positionKey) || '{}')[mediaKey()];
        return Number.isFinite(value) ? value : null;
      } catch { return null; }
    };
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const center = () => drop.getBoundingClientRect().top + drop.getBoundingClientRect().height / 2;
    const place = (y, expanded = drop.classList.contains('is-open')) => {
      const height = drop.getBoundingClientRect().height || (expanded ? 350 : 68);
      const safeY = clamp(y, Math.min(innerHeight / 2, height / 2 + 8), Math.max(height / 2 + 8, innerHeight - height / 2 - 8));
      drop.style.top = `${safeY}px`;
      drop.style.bottom = 'auto';
      drop.style.transform = 'translateY(-50%)';
      drop.dataset.positioned = 'true';
    };
    const savePosition = () => {
      const y = center();
      try {
        const value = JSON.parse(localStorage.getItem(positionKey) || '{}');
        value[mediaKey()] = y / innerHeight;
        localStorage.setItem(positionKey, JSON.stringify(value));
      } catch { /* storage may be unavailable */ }
    };
    const saved = readPosition();
    if (saved !== null) place(saved * innerHeight, false);

    const setOpen = (open) => {
      const y = center();
      drop.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '收起音乐播放器' : '打开音乐播放器');
      toggle.title = open ? '收起音乐播放器' : '打开音乐播放器';
      const glyph = toggle.querySelector('span');
      if (glyph) glyph.textContent = open ? '×' : '♫';
      place(y, open);
      requestAnimationFrame(() => { place(y, open); savePosition(); });
    };

    // Always start as the compact orb, including when a prior visit left it open.
    setOpen(false);
    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      if (toggle.dataset.dragged === 'true') {
        toggle.dataset.dragged = 'false';
        return;
      }
      setOpen(!drop.classList.contains('is-open'));
    });
    toggle.addEventListener('contextmenu', (event) => event.preventDefault());

    let drag = null;
    toggle.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      if (drop.classList.contains('is-open') || (event.pointerType === 'mouse' && event.button !== 0)) return;
      drag = { id: event.pointerId, y: event.clientY, center: center(), moved: false };
      toggle.setPointerCapture?.(event.pointerId);
    });
    toggle.addEventListener('pointermove', (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const delta = event.clientY - drag.y;
      if (!drag.moved && Math.abs(delta) < 4) return;
      drag.moved = true;
      toggle.dataset.dragged = 'true';
      place(drag.center + delta, false);
    });
    const endDrag = (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (drag.moved) {
        savePosition();
        // Clear after the synthesized click associated with pointerup has fired.
        setTimeout(() => { toggle.dataset.dragged = 'false'; }, 0);
      }
      drag = null;
    };
    toggle.addEventListener('pointerup', endDrag);
    toggle.addEventListener('pointercancel', endDrag);

    // Reuse the same saved vertical center when the expanded panel is dragged by its grip.
    drop.addEventListener('pointerup', (event) => {
      if (event.target.closest('#musicDropGrip')) requestAnimationFrame(savePosition);
    });
    drop.addEventListener('transitionend', (event) => {
      if (event.target === drop && (event.propertyName === 'width' || event.propertyName === 'height')) {
        place(center());
        savePosition();
      }
    });

    const syncOrbCover = () => {
      if (!orbCover || !cover) return;
      const src = cover.getAttribute('src');
      if (src) {
        orbCover.src = src;
        orbCover.alt = cover.alt || '当前歌曲封面';
        orbCover.style.display = '';
      } else {
        orbCover.removeAttribute('src');
        orbCover.style.display = 'none';
      }
    };
    syncOrbCover();
    if (cover && orbCover) new MutationObserver(syncOrbCover).observe(cover, { attributes: true, attributeFilter: ['src', 'alt'] });

    addEventListener('resize', () => {
      const savedY = readPosition();
      place(savedY === null ? center() : savedY * innerHeight);
    }, { passive: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
