// 公式LINE（kimyo-na-manul奇妙なマヌル）に、フォームの入力内容を送ってもらうための共通部分。
// HPには受け取る仕組みがないので、入力内容を本文にしたLINEのトークを開いて、本人に送信してもらう。
//
// ・スクリプトでLINEへ移動するとアプリではなくLINEのWebページが開くので、本人がタップするリンクで開く
// ・友だち追加前だと内容入りのトークが開けないので「①友だち追加 ②トークを開いて送る」の2段階で案内する
// ・PCではLINEのリンクがアプリで開かないので、スマホで読み取るQRコードを出す
// ・うまく開かないときのために、内容はクリップボードにもコピーしておく
//
// 使い方：KmanulLine.setup({ form, check: () => bool, body: () => '本文', mailTo?, mailSubject? })
//   form の中に .lf-send（送信ボタンを囲む要素）を置く。手順パネルはこのスクリプトが .lf-send の後ろに作る。
//   メールボタンを使う場合は form の中に [data-lf-mail] のボタンを置く。
(function () {
  var LINE_ID = '%40597rhvgp';
  var ADD_URL = 'https://line.me/R/ti/p/' + LINE_ID;
  // QRコードに入れるURLの長さの上限。これより長いとQRが細かくなりすぎてスマホで読み取りにくい
  var QR_MAX = 1600;
  var IS_PC = !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) && !window.matchMedia('(pointer: coarse)').matches;

  function talkUrl(text) { return 'https://line.me/R/oaMessage/' + LINE_ID + '/?' + encodeURIComponent(text); }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).catch(function () {}); return; }
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  function loadQrLib(done) {
    if (window.QRCode) return done();
    var sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    sc.onload = done;
    document.head.appendChild(sc);
  }

  // QRコードに入りきらないときは、入る長さまで縮める（続きはコピー済みの本文を貼ってもらう）
  function fitForQr(text) {
    if (talkUrl(text).length <= QR_MAX) return { text: text, cut: false };
    var tail = '…\n（続きはトークで送ります）';
    var lo = 0, hi = text.length;
    while (lo < hi) {
      var mid = Math.ceil((lo + hi) / 2);
      if (talkUrl(text.slice(0, mid) + tail).length <= QR_MAX) lo = mid; else hi = mid - 1;
    }
    return { text: text.slice(0, lo) + tail, cut: true };
  }

  var PANEL =
    '<div class="lf-steps-title" data-ja="あと少しです。LINEで送ってください" data-en="Almost done — please send it on LINE">あと少しです。LINEで送ってください</div>' +
    '<div class="lf-step">' +
      '<div class="lf-step-head"><b>1</b><span data-ja="公式アカウントを友だち追加" data-en="Add our official account as a friend">公式アカウントを友だち追加</span></div>' +
      '<p data-ja="すでに友だちの方は 2 へ進んでください。" data-en="Already friends? Go to step 2.">すでに友だちの方は 2 へ進んでください。</p>' +
      '<a class="lf-btn sub lf-sp" href="' + ADD_URL + '" target="_blank" rel="noopener" data-ja="kimyo-na-manul奇妙なマヌル を友だち追加" data-en="Add kimyo-na-manul on LINE">kimyo-na-manul奇妙なマヌル を友だち追加</a>' +
      '<div class="lf-pc">' +
        '<div class="lf-qr"><img src="images/line-qr.png" alt="公式LINE kimyo-na-manul奇妙なマヌル の友だち追加QRコード" style="width:160px;height:160px;"></div>' +
        '<p data-ja="スマホのカメラかLINEで読み取って、友だち追加してください。" data-en="Scan with your phone\'s camera or LINE to add us as a friend.">スマホのカメラかLINEで読み取って、友だち追加してください。</p>' +
      '</div>' +
    '</div>' +
    '<div class="lf-step">' +
      '<div class="lf-step-head"><b>2</b><span data-ja="内容を送る" data-en="Send your message">内容を送る</span></div>' +
      '<p class="lf-sp" data-ja="公式アカウントのトークが、入力した内容入りで開きます。そのまま送信してください。" data-en="Our official account\'s chat opens with your message filled in. Just tap send.">公式アカウントのトークが、入力した内容入りで開きます。そのまま送信してください。</p>' +
      '<a class="lf-btn lf-sp" data-lf="open" href="' + ADD_URL + '" data-ja="LINEのトークを開いて送る" data-en="Open the LINE chat and send">LINEのトークを開いて送る</a>' +
      '<div class="lf-pc">' +
        '<div class="lf-qr" data-lf="qr"></div>' +
        '<p data-ja="スマホのカメラで読み取ると、公式アカウントのトークが入力した内容入りで開きます。そのまま送信してください。" data-en="Scan with your phone\'s camera — our official account\'s chat opens with your message filled in. Just tap send.">スマホのカメラで読み取ると、公式アカウントのトークが入力した内容入りで開きます。そのまま送信してください。</p>' +
        '<p data-lf="qr-cut" style="display:none;" data-ja="長いため、QRコードには途中までしか入っていません。続きはトークに貼り付けて送ってください。" data-en="Your message is long, so the QR code holds only the first part. Please paste the rest into the chat.">長いため、QRコードには途中までしか入っていません。続きはトークに貼り付けて送ってください。</p>' +
      '</div>' +
      '<p data-ja="うまくいかないときは、公式アカウントのトークに貼り付けて送ってください（入力した内容はコピー済みです）。" data-en="If it doesn\'t work, paste into our official account\'s chat and send (your message has been copied).">うまくいかないときは、公式アカウントのトークに貼り付けて送ってください（入力した内容はコピー済みです）。</p>' +
      '<div class="lf-preview" data-lf="preview"></div>' +
    '</div>' +
    '<button type="button" class="lf-back" data-lf="back" data-ja="入力内容を直す" data-en="Edit my message">入力内容を直す</button>';

  // 言語を切り替え中なら、あとから作ったパネルにも反映する
  function relocalize() {
    var code = null;
    try { code = localStorage.getItem('kmanul-lang'); } catch (e) {}
    if (code && code !== 'ja' && window.setLang) window.setLang(code);
  }

  function setup(o) {
    var form = o.form;
    var sendBox = form.querySelector('.lf-send');
    var steps = document.createElement('div');
    steps.className = 'lf-steps';
    steps.setAttribute('aria-live', 'polite');
    steps.innerHTML = PANEL;
    sendBox.parentNode.insertBefore(steps, sendBox.nextSibling);
    relocalize();

    function q(name) { return steps.querySelector('[data-lf="' + name + '"]'); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!o.check()) return;
      var text = o.body();
      copy(text);
      q('preview').textContent = text;
      q('open').href = talkUrl(text);
      steps.classList.toggle('is-pc', IS_PC);
      if (IS_PC) {
        var fit = fitForQr(text);
        q('qr-cut').style.display = fit.cut ? '' : 'none';
        loadQrLib(function () {
          q('qr').innerHTML = '';
          new QRCode(q('qr'), { text: talkUrl(fit.text), width: 1000, height: 1000, correctLevel: QRCode.CorrectLevel.L });
        });
      }
      sendBox.style.display = 'none';
      steps.classList.add('show');
      steps.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    q('back').addEventListener('click', function () {
      steps.classList.remove('show');
      sendBox.style.display = '';
    });
    var mail = form.querySelector('[data-lf-mail]');
    if (mail && o.mailTo) {
      mail.addEventListener('click', function () {
        if (!o.check()) return;
        location.href = 'mailto:' + o.mailTo + '?subject=' + encodeURIComponent(o.mailSubject || '') + '&body=' + encodeURIComponent(o.body());
      });
    }
  }

  window.KmanulLine = { setup: setup };
})();
