// 言語の切り替え。
// 日本語と英語は各要素の data-ja / data-en を使い、
// ほかの言語は assets/i18n/<code>.json（キーは各要素の data-i18n）を読み込む。
// 訳が見つからない文は英語で表示する。
(function () {
  var LANGS = [
    // [コード, メニューの表示名, <html lang>]
    ['ja',  '日本語',        'ja'],
    ['en',  'English',       'en'],
    ['zh',  '中文（简体）',   'zh-Hans'],
    ['ko',  '한국어',        'ko'],
    ['pt',  'Português',     'pt-BR'],
    ['es',  'Español',       'es'],
    ['fr',  'Français',      'fr'],
    ['it',  'Italiano',      'it'],
    ['vi',  'Tiếng Việt',    'vi'],
    ['fil', 'Filipino',      'fil']
  ];
  var STORAGE_KEY = 'kmanul-lang';
  var cache = {};

  function find(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i][0] === code) return LANGS[i];
    return null;
  }

  function apply(code, dict) {
    document.querySelectorAll('[data-ja]').forEach(function (el) {
      var text;
      if (code === 'ja') text = el.getAttribute('data-ja');
      else if (code === 'en') text = el.getAttribute('data-en');
      else text = (dict && dict[el.getAttribute('data-i18n')]) || el.getAttribute('data-en');
      if (text != null) el.innerHTML = text;
    });
    document.documentElement.lang = find(code)[2];
    var sel = document.getElementById('lang-select');
    if (sel) sel.value = code;
  }

  function setLang(code) {
    if (!find(code)) code = 'ja';
    try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
    if (code === 'ja' || code === 'en') { apply(code); return; }
    if (cache[code]) { apply(code, cache[code]); return; }
    fetch('assets/i18n/' + code + '.json')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { cache[code] = d; apply(code, d); })
      .catch(function () { apply('en'); });
  }
  window.setLang = setLang;

  // ナビの .lang-toggle を言語メニューに置き換える
  document.querySelectorAll('.lang-toggle').forEach(function (box) {
    var sel = document.createElement('select');
    sel.id = 'lang-select';
    sel.className = 'lang-select';
    sel.setAttribute('aria-label', 'Language / 言語');
    LANGS.forEach(function (l) {
      var o = document.createElement('option');
      o.value = l[0];
      o.textContent = l[1];
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () { setLang(sel.value); });
    box.innerHTML = '';
    box.appendChild(sel);
  });

  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (saved && saved !== 'ja' && find(saved)) setLang(saved);
})();
