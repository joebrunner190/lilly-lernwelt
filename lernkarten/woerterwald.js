(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const chapters = Wortstand.chapters;
  let chapter = 5, mode = 'cards', round = null;
  try {
    const n = Number(localStorage.getItem('woerterwald.3.kapitel'));
    if (Number.isInteger(n) && chapters[n-1]) chapter=n;
    if (localStorage.getItem('woerterwald.3.modus') === 'write') mode='write';
  } catch { /* The round also works in memory. */ }
  const element = (tag, text, cls) => {
    const el=document.createElement(tag); el.textContent=text; if(cls) el.className=cls; return el;
  };
  function button(text, action, primary=false) {
    const el=element('button',text,primary?'primary':''); el.type='button'; el.onclick=action; return el;
  }
  function storeSetting(key,value) {
    try { localStorage.setItem('woerterwald.3.'+key,value); } catch { /* Optional preference */ }
  }
  function notifyStorage() {
    $('storage-note').textContent=Wortstand.durable?'':'Dieser Browser kann den Lernstand gerade nur bis zum Schließen behalten. Du kannst ihn in der Übersicht sichern.';
  }
  function show(page) {
    for (const id of ['home','play','result']) $(id).hidden=id!==page;
    window.scrollTo(0,0);
  }
  chapters.forEach(({title},i)=>$('chapter').add(new Option((i+1)+' · '+title,i+1)));
  function wordForms(card) {
    if (card.past) return card.word+' – '+card.form+' / '+card.past;
    if (card.form && card.kind==='Namenwort') return card.word+' – '+card.form;
    return card.form || card.word;
  }
  function home() {
    round=null;
    show('home');
    const current=chapters[chapter-1], {words,days}=Wortstand.summary();
    $('chapter').value=chapter;
    $('chapter-tag').textContent='Kapitel '+chapter+' von 16';
    $('chapter-title').textContent=current.icon+' '+current.title;
    $('mode-hint').textContent=mode==='cards'?'Dreh die Karte um und vergleiche deine Antwort.':'Schreib die Mehrzahl, eine Zeitform oder ein gemerktes Wort.';
    document.querySelector('input[name="mode"][value="'+mode+'"]').checked=true;
    const packed=current.cards.filter(c=>(words.get(c.id)?.streak || 0)>=2).length;
    $('mastered').textContent=packed; $('out-of').textContent='von '+current.cards.length+' Wörtern';
    $('mastery').max=current.cards.length; $('mastery').value=packed;
    const today=days[Wortstand.dayKey(new Date())]?.total || 0;
    $('today').textContent=today===0?'Heute ist noch Platz für deine erste Runde.':'Heute hast du '+today+(today===1?' Wort':' Wörter')+' geübt.';
    $('word-count').textContent='('+current.cards.length+')'; $('word-list').replaceChildren();
    const labels={Namenwort:'Namenwörter',Zeitwort:'Zeitwörter',Eigenschaftswort:'Eigenschaftswörter',Merkwort:'Weitere Lernwörter'};
    for (const [kind,title] of Object.entries(labels)) {
      const group=current.cards.filter(c=>c.kind===kind);
      if (!group.length) continue;
      const ul=element('ul','');
      group.forEach(c=>ul.append(element('li',wordForms(c))));
      $('word-list').append(element('h3',title),ul);
    }
    notifyStorage();
  }
  $('chapter').onchange=e=>{chapter=Number(e.target.value);storeSetting('kapitel',chapter);home();};
  document.querySelectorAll('[name=mode]').forEach(input=>input.onchange=()=>{mode=input.value;storeSetting('modus',mode);home();});
  function start() {
    const queue=Wortstand.draw(chapters[chapter-1].cards,Wortstand.summary().words);
    const id=typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
    round={cards:queue,retry:[],i:0,repeat:false,recovered:0,locked:false,record:{id,time:new Date().toISOString(),answers:[]}};
    show('play'); question();
  }
  function task(card) {
    if (card.kind==='Zeitwort') {
      const subject=card.form.split(' ')[0];
      return {cue:card.form, ask:'Wie heißt das in der Mitvergangenheit?', target:card.past, alternatives:[subject+' '+card.past, subject[0].toUpperCase()+subject.slice(1)+' '+card.past], solution:card.word+' – '+card.form+' / '+subject+' '+card.past};
    }
    if (card.kind==='Namenwort' && card.form) return {cue:card.word, ask:'Wie heißt die Mehrzahl mit Artikel?',target:card.form,alternatives:[card.form[0].toUpperCase()+card.form.slice(1)],solution:card.form};
    return {cue:card.word,ask:'Lies das Wort und merk dir die Schreibweise.',target:card.word,alternatives:[],solution:card.form || card.word,memory:true};
  }
  function currentCard() { return (round.repeat?round.retry:round.cards)[round.i]; }
  function question() {
    round.locked=false;
    const queue=round.repeat?round.retry:round.cards, card=currentCard(), exercise=task(card);
    $('round-meta').textContent=round.repeat?'Zweiter Versuch · Kapitel '+chapter:'Kapitel '+chapter+' · '+(mode==='cards'?'Wortkarten':'Schreibspiel');
    $('steps').textContent=(round.i+1)+' von '+queue.length;
    $('round-progress').max=queue.length;$('round-progress').value=round.i;
    const cardEl=$('card'),actions=$('actions');
    actions.replaceChildren();
    cardEl.replaceChildren(element('p',card.kind,'over'),element('h2',exercise.cue),element('p',exercise.ask));
    cardEl.querySelector('h2').tabIndex=-1;cardEl.querySelector('h2').focus({preventScroll:true});
    const renderInput=()=>{
      if(exercise.memory) cardEl.replaceChildren(element('p',card.kind,'over'),element('h2','Wie schreibt man das Wort?'));
      const label=element('label','Deine Antwort');label.htmlFor='entry';
      const input=document.createElement('input'); input.type='text'; input.id='entry'; input.autocomplete='off'; input.autocapitalize='off'; input.spellcheck=false;input.setAttribute('autocorrect','off');
      cardEl.append(label,input);
      function check() {
        if(!input.value.trim()) {input.focus();return;}
        const normalize=value=>value.normalize('NFC').trim().replace(/\s+/g,' ');
        const correct=[exercise.target,...exercise.alternatives].map(normalize).includes(normalize(input.value));
        grade(correct,exercise.solution,input.value.trim());
      }
      input.onkeydown=e=>{if(e.key==='Enter' && !e.isComposing) check();};
      actions.replaceChildren(button('Prüfen',check,true),button('Zeig es mir',()=>grade(false,exercise.solution)));
      if (exercise.memory) input.focus();
    };
    if(mode==='write') {
      if(exercise.memory) actions.append(button('Wort verdecken',renderInput,true));
      else renderInput();
    } else {
      actions.append(button(exercise.memory?'Wort verdecken':'Lösung aufdecken',()=>{
        if (exercise.memory) {
          cardEl.replaceChildren(element('p',card.kind,'over'),element('h2','Buchstabiere das Wort.'));
          actions.replaceChildren(button('Auflösen',reveal,true));
        } else reveal();
      },true));
      function reveal() {
        cardEl.append(element('p',exercise.solution,'answer'));
        actions.replaceChildren(button('Das konnte ich',()=>grade(true,exercise.solution),true),button('Noch einmal üben',()=>grade(false,exercise.solution)));
      }
    }
  }
  function grade(correct,solution,typed) {
    if(!round || round.locked) return;
    round.locked=true;
    const card=currentCard();
    if(!round.repeat) {
      round.record.answers.push({word:card.id,correct});
      if(!correct) round.retry.push(card);
      Wortstand.save(round.record);notifyStorage();
    } else if(correct) round.recovered++;
    const feedback=correct?'Das stimmt!':round.repeat?'Das Wort üben wir in einer anderen Runde weiter.':'Das Wort kommt am Ende der Runde noch einmal.';
    $('card').replaceChildren(element('p',correct?'Geschafft':'Zum Merken','over'),element('h2',solution),element('p',feedback,correct?'feedback':'feedback retry'));
    if(!correct && typed) $('card').append(element('p','Deine Antwort: '+typed));
    $('round-progress').value=round.i+1;
    const queue=round.repeat?round.retry:round.cards, last=round.i+1===queue.length;
    const label=last?(round.repeat || !round.retry.length?'Runde abschließen':'Die Merkwörter wiederholen'):'Nächstes Wort →';
    const next=button(label,()=>{
      if(!last) {round.i++;question();}
      else if(!round.repeat && round.retry.length) {round.repeat=true;round.i=0;question();}
      else finish();
    },true);
    $('actions').replaceChildren(next);next.focus({preventScroll:true});
  }
  function finish() {
    const successes=round.record.answers.filter(a=>a.correct).length;
    const length=round.cards.length;
    $('score').textContent=successes===length?'Alle '+length+' Wörter gleich beim ersten Versuch geschafft!':successes+' von '+length+' Wörtern konntest du gleich beim ersten Versuch.';
    $('retry-score').textContent=round.retry.length?'Beim zweiten Versuch hast du '+round.recovered+' von '+round.retry.length+' geschafft.':'';
    $('souvenirs').replaceChildren(...round.cards.map(c=>element('span',c.word,'word-chip')));
    show('result');$('end-title').focus({preventScroll:true});
  }
  $('start').onclick=start;$('again').onclick=start;$('done').onclick=home;
  $('stop').onclick=()=>{if(confirm('Zur Übersicht gehen? Deine bisherigen Antworten bleiben gespeichert.')) home();};
  $('export').onclick=()=>{
    const blob=new Blob([JSON.stringify({format:'woerterwald-3-v1',rounds:Wortstand.rounds()})],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Woerterwald-Lernstand.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };
  $('import').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    try {Wortstand.restore(JSON.parse(await file.text()));home();$('backup-status').textContent='Lernstände zusammengeführt.';}
    catch {$('backup-status').textContent='Diese Datei ist keine gültige Wörterwald-Sicherung.';}
    e.target.value='';
  };
  window.addEventListener('storage',()=>{if(!$('home').hidden) home();});
  home();
})();
