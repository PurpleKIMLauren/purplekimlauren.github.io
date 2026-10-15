/* Dark mode toggle */
(function () {
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);
  updateToggleIcon(toggle, theme);

  if (toggle) {
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      updateToggleIcon(toggle, theme);
    });
  }

  function updateToggleIcon(btn, t) {
    if (!btn) return;
    btn.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' mode');
    btn.innerHTML = t === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
})();

/* Dimension tabs */
(function () {
  const tabs = document.querySelectorAll('.dim-tab');
  const panels = document.querySelectorAll('.dim-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const dim = tab.dataset.dim;

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const target = document.querySelector(`[data-panel="${dim}"]`);
      if (target) target.classList.add('active');
    });
  });
})();

/* Animate strength bars on scroll into view */
(function () {
  const fills = document.querySelectorAll('.strength-fill');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const targetWidth = el.style.width;
          el.style.width = '0%';
          requestAnimationFrame(() => {
            setTimeout(() => {
              el.style.transition = 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
              el.style.width = targetWidth;
            }, 80);
          });
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    fills.forEach(f => observer.observe(f));
  }
})();

/* Smooth scroll for nav links */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* Fade in conflict items on scroll */
(function () {
  const items = document.querySelectorAll('.conflict-item, .fcard, .dim-card, .policy-card');

  if ('IntersectionObserver' in window) {
    items.forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(16px)';
      item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 60);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    items.forEach(item => observer.observe(item));
  }
})();

/* Language selector — fully in-page translation (Claude-made dictionaries). No external service. */
(function () {
  const menu = document.querySelector('[data-lang-menu]');
  if (!menu) return;
  const NATIVE = {
    ko: 'i18n/ko.json',
    ja: 'i18n/ja.json',
    'zh-CN': 'i18n/zh-CN.json',
    es: 'i18n/es.json',
    de: 'i18n/de.json',
    fr: 'i18n/fr.json'
  };
  const cache = {};

  function collectNodes() {
    const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        let p = n.parentNode;
        while (p && p !== document.body) {
          if (skip.has(p.nodeName)) return NodeFilter.FILTER_REJECT;
          if (p.classList && p.classList.contains('lang-select')) return NodeFilter.FILTER_REJECT;
          if (p.hasAttribute && p.hasAttribute('data-theme-toggle')) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = []; let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  const nodes = collectNodes();
  const originals = nodes.map(n => n.nodeValue);
  const norm = s => s.replace(/\s+/g, ' ').trim();

  function restore() { nodes.forEach((n, i) => { n.nodeValue = originals[i]; }); }
  function apply(dict) {
    nodes.forEach((n, i) => {
      const t = dict[norm(originals[i])];
      if (t != null) {
        const lead = (originals[i].match(/^\s*/) || [''])[0];
        const trail = (originals[i].match(/\s*$/) || [''])[0];
        n.nodeValue = lead + t + trail;
      } else { n.nodeValue = originals[i]; }
    });
  }

  menu.addEventListener('change', async () => {
    const lang = menu.value;
    if (lang === 'en') { restore(); return; }
    const src = NATIVE[lang];
    if (!src) { restore(); menu.value = 'en'; return; }
    try {
      if (!cache[lang]) {
        const res = await fetch(src);
        if (!res.ok) throw new Error('not found');
        cache[lang] = await res.json();
      }
      apply(cache[lang]);
    } catch (e) {
      // 아직 번역 파일이 없는 언어: 페이지에 머물며 영어 유지
      restore(); menu.value = 'en';
      alert('이 언어 번역은 아직 준비 중이에요. 곧 추가됩니다.');
    }
  });
})();
