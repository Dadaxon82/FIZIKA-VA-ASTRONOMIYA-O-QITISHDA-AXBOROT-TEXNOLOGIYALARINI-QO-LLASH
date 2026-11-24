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

  document.querySelectorAll('.toc-group > a').forEach(function (a) {
    a.addEventListener('click', function () { a.closest('.toc-group').classList.add('open'); });
  });

  document.querySelectorAll('.toc-expand').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var li = btn.closest('.toc-group');
      var open = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
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
          if (a) {
            a.classList.add('on');
            var group = a.closest('.toc-group');
            if (group) group.classList.add('open');
          }
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    map.forEach(function (a, sec) { io.observe(sec); });
  }
})();
