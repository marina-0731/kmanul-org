(function() {
  // ── Announce bar height → --announce-h ──
  // 文字が折り返してバーが2行になっても nav が重ならないよう実測値を渡す
  const announceBar = document.querySelector('.announce-bar');
  if (announceBar) {
    const syncAnnounceHeight = () => {
      document.documentElement.style.setProperty(
        '--announce-h', announceBar.offsetHeight + 'px'
      );
    };
    syncAnnounceHeight();
    if (window.ResizeObserver) {
      new ResizeObserver(syncAnnounceHeight).observe(announceBar);
    } else {
      window.addEventListener('resize', syncAnnounceHeight);
    }
    // Webフォント読み込み後に字幅が変わるので再計測
    if (document.fonts) document.fonts.ready.then(syncAnnounceHeight);
  }

  // ── Hamburger menu ──
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // ── Scroll reveal ──
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  reveals.forEach(el => revealObserver.observe(el));

  // ── Nav border on scroll ──
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.style.borderBottomColor = window.scrollY > 60
        ? 'rgba(95,185,90,0.4)'
        : 'rgba(95,185,90,0.25)';
    });
  }

  // ── Active nav link ──
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();
