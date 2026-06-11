/* DRIP — shared site behavior (nav, reveals, drops filter, forms) */
(function(){
  'use strict';

  /* ---------- mobile nav ---------- */
  const burger = document.querySelector('.burger');
  if(burger){
    burger.addEventListener('click', ()=>{
      const open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.navlinks a').forEach(a=>{
      a.addEventListener('click', ()=> document.body.classList.remove('menu-open'));
    });
  }

  /* ---------- scroll reveals ---------- */
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); } });
  }, {threshold:.2});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

  /* ---------- drops filter (drops.html) ---------- */
  const filterBar = document.querySelector('.filters');
  if(filterBar){
    const cards = Array.from(document.querySelectorAll('.cardrow .card'));
    const count = document.querySelector('.dropcount');
    filterBar.addEventListener('click', e=>{
      const btn = e.target.closest('button[data-filter]');
      if(!btn) return;
      filterBar.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      let shown = 0;
      cards.forEach(c=>{
        const hit = f === 'all' || c.dataset.status === f;
        c.classList.toggle('is-hidden', !hit);
        if(hit) shown++;
      });
      if(count) count.textContent = 'RENDERING ' + shown + ' / ' + cards.length + ' DROPS';
    });
  }

  /* ---------- Web3Forms helpers ---------- */
  const W3F_KEY = '41dfbd32-be33-42f0-b76b-0eea09845396';
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || /\.eth$/i.test(v.trim());

  async function submitToW3F(payload){
    const res = await fetch('https://api.web3forms.com/submit', {
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify({access_key: W3F_KEY, ...payload})
    });
    return res.json();
  }

  /* ---------- quick allowlist (home / drops) ---------- */
  document.querySelectorAll('form.allowlist').forEach(form=>{
    form.addEventListener('submit', async e=>{
      e.preventDefault();
      const input = form.querySelector('input');
      const note = form.parentElement.querySelector('.note');
      const btn = form.querySelector('button');
      if(!emailOk(input.value)){
        if(note){ note.textContent = 'ENTER A VALID ADDRESS TO JOIN.'; note.style.color = 'var(--ice)'; }
        input.focus();
        return;
      }
      btn.textContent = 'TRANSMITTING…';
      btn.disabled = true;
      input.disabled = true;
      try {
        const data = await submitToW3F({
          subject: 'DRIP — Allowlist Signup',
          email: input.value,
          from_name: 'DRIP Allowlist'
        });
        if(data.success){
          if(note){ note.textContent = '✓ CONFIRMED. YOU\'RE ON THE LIST.'; note.style.color = 'var(--ice)'; }
          btn.textContent = 'DONE';
          if(typeof window.dripSpin === 'function') window.dripSpin(.4);
        } else {
          throw new Error(data.message || 'submission failed');
        }
      } catch(err){
        btn.disabled = false;
        input.disabled = false;
        btn.textContent = 'JOIN';
        if(note){ note.textContent = 'TRANSMISSION FAILED — TRY AGAIN.'; note.style.color = '#ff6b7d'; }
      }
    });
  });

  /* ---------- full acquire form (acquire.html) ---------- */
  const acqForm = document.getElementById('acqForm');
  if(acqForm){
    const log = document.getElementById('termLog');

    function runTermLog(el){
      el.innerHTML = '';
      const queue = [
        {t:'> HANDSHAKE… OK', d:200},
        {t:'> VALIDATING ADDRESS… OK', d:600},
        {t:'> CHECKING SUPPLY… 2,796 / 10,000 REMAINING', d:1100},
        {t:'> ASSIGNING POSITION… #' + (4000 + Math.floor(Math.random()*900)).toLocaleString('en-US'), d:1700},
        {t:'✓ CONFIRMED. ONE PING PER DROP. NO SPAM.', d:2200, ok:true}
      ];
      queue.forEach(q=>{
        setTimeout(()=>{
          const div = document.createElement('div');
          div.textContent = q.t;
          if(q.ok) div.className = 'ok';
          el.appendChild(div);
          if(q.ok){
            const c = document.createElement('span');
            c.className = 'cursor';
            el.appendChild(c);
          }
        }, q.d);
      });
    }

    acqForm.addEventListener('submit', async e=>{
      e.preventDefault();
      let valid = true;
      const email = document.getElementById('acqEmail');
      const emailField = email.closest('.field');
      emailField.classList.remove('err');
      if(!emailOk(email.value)){ emailField.classList.add('err'); valid = false; }
      const terms = document.getElementById('acqTerms');
      const termsField = terms.closest('.field');
      termsField.classList.remove('err');
      if(!terms.checked){ termsField.classList.add('err'); valid = false; }
      if(!valid) return;

      const btn = acqForm.querySelector('.btn-acq');
      const handle = document.getElementById('acqHandle');
      const drop = document.getElementById('acqDrop');
      btn.textContent = 'TRANSMITTING…';
      btn.disabled = true;
      log.classList.add('on');
      runTermLog(log);

      try {
        await submitToW3F({
          subject: 'DRIP — Allowlist (Full Form)',
          email: email.value,
          handle: handle ? handle.value : '',
          drop_preference: drop ? drop.value : '',
          from_name: 'DRIP Acquire Form'
        });
      } catch(_){}

      setTimeout(()=>{ btn.textContent = '✓ ON THE LIST'; }, 2200);
    });
  }
})();
