(function () {
  var btn = document.querySelector('.theme-btn');
  if (btn) {
    btn.addEventListener('click', function () {
      var html = document.documentElement;
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem('ilimziyo-theme', next); } catch (e) { /* xotira yopiq */ }
    });
  }

  function toggleTocGroup(li) {
    var open = li.classList.toggle('open');
    var expandBtn = li.querySelector('.toc-expand');
    if (expandBtn) expandBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  document.querySelectorAll('.toc-group > a').forEach(function (a) {
    a.addEventListener('click', function () { toggleTocGroup(a.closest('.toc-group')); });
  });

  document.querySelectorAll('.toc-expand').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleTocGroup(btn.closest('.toc-group'));
    });
  });

  var tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = new Map();
    tocLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) map.set(sec, a);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove('on'); });
          var a = map.get(e.target);
          if (a) a.classList.add('on');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    map.forEach(function (a, sec) { io.observe(sec); });
  }
})();
