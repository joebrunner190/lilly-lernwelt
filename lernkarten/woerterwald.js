(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const chapters = Wortstand.chapters;
  let chapter = 5, round = null;
  try {
    const n = Number(localStorage.getItem('woerterwald.3.kapitel'));
    if (Number.isInteger(n) && chapters[n-1]) chapter=n;
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
  function exercise(card) {
    if (card.kind === 'Zeitwort') {
      const subject = card.form.split(' ')[0];
      return {
        prompt: 'Schreib die Grundform. Schreib dann die Gegenwart und die Mitvergangenheit mit „'+subject+'“.',
        solution: [card.word, card.form, subject+' '+card.past].join(' · ')
      };
    }
    if (card.kind === 'Namenwort' && card.form) {
      return {prompt:'Schreib Einzahl und Mehrzahl mit Artikel.', solution:card.word+' · '+card.form};
    }
    return {prompt:'Schreib das Wort ins Heft.', solution:card.word};
  }
  function weekOverview(cards, words) {
    const friday = new Date();
    friday.setDate(friday.getDate() + (5 - friday.getDay() + 7) % 7);
    $('weekly-title').textContent = 'Bis Freitag, '+friday.toLocaleDateString('de-AT', {day:'numeric',month:'long'});
    const list = $('word-list');
    list.replaceChildren();
    const groups = [
      {title:'Noch üben', cards:[]},
      {title:'Einmal richtig', cards:[]},
      {title:'Noch nicht abgefragt', cards:[]},
      {title:'Sicher im Rucksack', cards:[]}
    ];
    for (const card of cards) {
      const state = words.get(card.id);
      if (!state) groups[2].cards.push(card);
      else if (state.streak >= 2) groups[3].cards.push(card);
      else groups[state.streak].cards.push(card);
    }
    for (const [i, group] of groups.entries()) {
      if (!group.cards.length) continue;
      const details = element('details','');
      details.open = i === 0;
      details.append(element('summary',group.title+' ('+group.cards.length+')'));
      const ul = element('ul','');
      for (const card of group.cards) ul.append(element('li',exercise(card).solution));
      details.append(ul);
      list.append(details);
    }
  }
  function home() {
    round=null;
    show('home');
    const current=chapters[chapter-1], {words,days}=Wortstand.summary();
    $('chapter').value=chapter;
    $('chapter-tag').textContent='Kapitel '+chapter+' von 16';
    $('chapter-title').textContent=current.icon+' '+current.title;
    const packed=current.cards.filter(c=>(words.get(c.id)?.streak || 0)>=2).length;
    $('mastered').textContent=packed; $('out-of').textContent='von '+current.cards.length+' Wörtern';
    $('mastery').max=current.cards.length; $('mastery').value=packed;
    const today=days[Wortstand.dayKey(new Date())]?.total || 0;
    $('today').textContent=today===0?'Heute ist noch Platz für deine erste Runde.':'Heute hast du '+today+(today===1?' Wort':' Wörter')+' geübt.';
    weekOverview(current.cards,words);
    notifyStorage();
  }
  $('chapter').onchange=e=>{chapter=Number(e.target.value);storeSetting('kapitel',chapter);home();};
  function start() {
    const queue=Wortstand.draw(chapters[chapter-1].cards,Wortstand.summary().words);
    const id=typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
    round={cards:queue,retry:[],i:0,repeat:false,recovered:0,locked:false,record:{id,time:new Date().toISOString(),answers:[]}};
    show('play'); question();
  }
  function currentCard() { return (round.repeat?round.retry:round.cards)[round.i]; }
  function question() {
    round.locked=false;
    const queue=round.repeat?round.retry:round.cards;
    const card=currentCard(), item=exercise(card);
    $('round-meta').textContent=(round.repeat?'Zweiter Versuch':'Heftdiktat')+' · Kapitel '+chapter;
    $('steps').textContent=(round.i+1)+' von '+queue.length;
    $('round-progress').max=queue.length;
    $('round-progress').value=round.i;
    const cardEl=$('card'), actions=$('actions');
    cardEl.replaceChildren(element('p','Zum Vorlesen · '+card.kind,'over'),element('h2',card.word),element('p',item.prompt));
    const title=cardEl.querySelector('h2');
    title.tabIndex=-1;
    title.focus({preventScroll:true});
    actions.replaceChildren(button('Lösung zum Vergleichen',()=>{
      cardEl.append(element('p',item.solution,'answer'));
      actions.replaceChildren(button('Richtig',()=>grade(true),true),button('Falsch',()=>grade(false)));
    },true));
  }
  function grade(correct) {
    if (!round || round.locked) return;
    round.locked=true;
    const card=currentCard();
    if (!round.repeat) {
      round.record.answers.push({word:card.id,correct});
      if (!correct) round.retry.push(card);
      Wortstand.save(round.record);
      notifyStorage();
    } else if (correct) {
      round.recovered++;
    }
    const queue=round.repeat?round.retry:round.cards;
    if (++round.i < queue.length) {
      question();
    } else if (!round.repeat && round.retry.length) {
      round.repeat=true;
      round.i=0;
      question();
    } else {
      finish();
    }
  }
  function finish() {
    const successes=round.record.answers.filter(a=>a.correct).length;
    const length=round.cards.length;
    $('score').textContent=successes===length?'Alle '+length+' Wörter gleich beim ersten Versuch geschafft!':successes+' von '+length+' Wörtern konntest du gleich beim ersten Versuch.';
    $('retry-score').textContent=round.retry.length?'Beim zweiten Versuch hast du '+round.recovered+' von '+round.retry.length+' geschafft.':'';
    $('souvenirs').replaceChildren();
    if (round.retry.length) {
      $('souvenirs').append(element('p','Diese Wörter kommen in der nächsten Runde bevorzugt dran.'),
        ...round.retry.map(c=>element('span',c.word,'word-chip')));
    }
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
