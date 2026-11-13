/* runtime.js (generalized): brand text and marks come from CFG, written by build.py from the skin's skin.json */
(function(){var CFG=__CFG__;
var P={"home": "<path d=\"M3 11l9-7 9 7\"/><path d=\"M5 9.5V20h14V9.5\"/><path d=\"M10 20v-6h4v6\"/>", "lookup": "<rect x=\"2\" y=\"5\" width=\"13\" height=\"10\"/><path d=\"M5 9h6M5 12h3\"/><circle cx=\"17\" cy=\"15\" r=\"3\"/><path d=\"M19.2 17.2L22 20\"/>", "file": "<path d=\"M3 8h4l2-3h6l2 3h4v11H3z\"/><rect x=\"8\" y=\"10.5\" width=\"8\" height=\"5.5\"/>", "register": "<path d=\"M8 3h8v3H8z\"/><path d=\"M6 4.5H4V21h16V4.5h-2\"/><path d=\"M8 11h8M8 15h5\"/>", "history": "<path d=\"M5 3h14v18l-2.5-1.8L14 21l-2-1.8L10 21l-2.5-1.8L5 21z\"/><path d=\"M9 8h6M9 12h6M9 16h3\"/>", "back": "<path d=\"M15 5l-7 7 7 7\"/>", "photo": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\"/><path d=\"M3 16l5-5 4 4 3-3 6 6\"/><path d=\"M16 9h.01\"/>"}, MARK=CFG.mark, TILE="<svg width=\"28\" height=\"28\" viewBox=\"0 0 40 40\" aria-hidden=\"true\"><rect width=\"40\" height=\"40\" rx=\"10.0\" fill=\"#000\"/><path d=\"M6.5 32L13.5 8h5l-7 24z\" fill=\"#ec1392\"/><path d=\"M15.5 32L22.5 8h5l-7 24z\" fill=\"#f68eca\"/><path d=\"M24.5 32L31.5 8h5l-7 24z\" fill=\"#fff\"/></svg>", FAV_C=CFG.favicon, FAV_M="data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 40 40\" aria-hidden=\"true\"><rect xmlns=\"http://www.w3.org/2000/svg\" rx=\"10.0\" fill=\"%23000\"/><path d=\"M6.5 32L13.5 8h5l-7 24z\" fill=\"%23ec1392\"/><path d=\"M15.5 32L22.5 8h5l-7 24z\" fill=\"%23f68eca\"/><path d=\"M24.5 32L31.5 8h5l-7 24z\" fill=\"%23fff\"/></svg>";
  function ic(k,s){return '<svg width="'+(s||22)+'" height="'+(s||22)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">'+P[k]+'</svg>';}
  function mark(s,c){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 48 48" fill="'+c+'" aria-hidden="true">'+MARK+'</svg>';}
  var TAB={home:'home',lookup:'lookup',newclaim:'file',register:'register',history:'history'};
  function hero(){
    var h=document.querySelector('.login-hero'); if(!h||h.getAttribute('data-tf')) return; h.setAttribute('data-tf','1');
    h.innerHTML='<div class="tf-lockup">'+mark(40,CFG.markOnDark)+'<div><b>'+CFG.lockupName+'</b><small>'+CFG.lockupSub+'</small></div></div>'+
      '<h1 class="tf-head">'+CFG.headline+'</h1>'+
      '<div class="tagline">'+CFG.tagline+'</div>';
    var f=document.querySelector('.login-footer');
    if(f&&!f.getAttribute('data-tf')){ f.setAttribute('data-tf','1');
      f.insertAdjacentHTML('afterbegin','<div class="tf-legend">'+CFG.legend+'</div>');
      f.insertAdjacentHTML('beforeend','<span class="tf-signoff">'+CFG.signoff+'</span>'); }
  }
  function favicon(href){ var l=document.querySelector('link[rel="icon"]'); if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l);} if(l.href!==href) l.href=href; }
  function run(){
    hero();
    var mfg=document.body.classList.contains('cd-mfg');
    var b=document.querySelector('.app-header .ah-brand');
    if(b&&b.getAttribute('data-tf')!==(mfg?'m':'c')){ b.setAttribute('data-tf',mfg?'m':'c');
      b.innerHTML=mfg? '<span class="tf-app-tile">'+TILE+'</span><span class="tf-admin-name">Warranty &amp; Claims<small>'+CFG.company+' \u00b7 Admin</small></span>'
                     : mark(22,CFG.markOnDark)+'<span>'+CFG.shortName+'</span>'; }
    var t=mfg?CFG.title+' \u00b7 Admin':CFG.title; if(document.title!==t) document.title=t;
    favicon(mfg?FAV_M:FAV_C);
    var btns=document.querySelectorAll('#distNav button[data-tab]');
    for(var i=0;i<btns.length;i++){ var k=TAB[btns[i].getAttribute('data-tab')], s=btns[i].querySelector('svg');
      if(k&&s&&!s.getAttribute('data-tf')){ s.outerHTML=ic(k,22).replace('<svg ','<svg data-tf="1" '); } }
    if(!mfg){
      var bk=document.querySelectorAll('.detail-back > svg:not([data-tf])');
      for(var j=0;j<bk.length;j++) bk[j].outerHTML=ic('back',18).replace('<svg ','<svg data-tf="1" ');
      var pu=document.querySelectorAll('.photo-upload > svg:not([data-tf])');
      for(var q=0;q<pu.length;q++) pu[q].outerHTML=ic('photo',28).replace('<svg ','<svg data-tf="1" ');
    }
    var ls=document.getElementById('loginScreen');
    if(ls&&!ls.getAttribute('data-tf-fit')){ ls.setAttribute('data-tf-fit','1');
      ls.addEventListener('change',function(){ setTimeout(function(){ var bt=document.getElementById('loginBtn'); if(!bt) return;
        var r=bt.getBoundingClientRect(); if(r.bottom>window.innerHeight-8) bt.scrollIntoView({block:'end',behavior:'smooth'}); },60); }); }
    var rs=document.querySelector('.role-switch');
    if(rs&&!rs.querySelector('.tf-demo')) rs.querySelector('.rs-label').insertAdjacentHTML('beforebegin','<span class="tf-demo" title="Sample data for demonstration">DEMO</span>');
  }
  var queued=false; function q(){ if(queued) return; queued=true; requestAnimationFrame(function(){queued=false; try{run();}catch(e){}}); }
  document.addEventListener('DOMContentLoaded',q); q();
  new MutationObserver(q).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();
