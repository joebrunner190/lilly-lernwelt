// Each round has its own key, so simultaneous tabs cannot overwrite one another.
const Wortstand = (() => {
  const prefix = 'woerterwald.3.runde.';
  const inMemory = new Map();
  let durable = true;
  const chapters = wortKapitel.map((chapter, index) => {
    const cards = Object.entries(chapter.groups).flatMap(([kind, rows]) => rows.map(([word, form, past]) => ({
      id: (index + 1) + ':' + word, word, kind, form, past
    })));
    return { title: chapter.title, icon: chapter.icon, cards };
  });
  const knownIds = new Set(chapters.flatMap(chapter => chapter.cards.map(card => card.id)));
  function validRound(round) {
    return round && typeof round === 'object' && /^[a-z\d-]{8,80}$/i.test(round.id)
      && typeof round.time === 'string' && Number.isFinite(Date.parse(round.time))
      && Array.isArray(round.answers) && round.answers.length <= 5
      && new Set(round.answers.map(a => a?.word)).size === round.answers.length
      && round.answers.every(a => a && knownIds.has(a.word) && typeof a.correct === 'boolean');
  }
  function save(round) {
    if (!validRound(round)) throw Error('Ungültige Runde');
    inMemory.set(round.id, round);
    try { localStorage.setItem(prefix + round.id, JSON.stringify(round)); }
    catch { durable = false; }
  }
  function rounds() {
    const all = new Map();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(prefix)) continue;
        let item;
        try { item = JSON.parse(localStorage.getItem(key)); } catch { continue; }
        if (validRound(item)) all.set(item.id, item);
      }
    } catch { durable = false; }
    for (const [id, record] of inMemory) {
      if (!all.has(id) || record.answers.length > all.get(id).answers.length) all.set(id, record);
    }
    return [...all.values()].sort((a,b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
  }
  function dayKey(date) {
    return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
  }
  function summary(history = rounds()) {
    const words = new Map(), days = {};
    for (const round of history) {
      const date = new Date(round.time), key = dayKey(date);
      const day = days[key] ??= { correct: 0, total: 0, lastTime: '' };
      day.lastTime = date.toLocaleTimeString('de-AT', {hour:'2-digit',minute:'2-digit'});
      for (const answer of round.answers) {
        const prev = words.get(answer.word);
        words.set(answer.word, { streak: answer.correct ? (prev?.streak || 0)+1 : 0, time: round.time });
        day.total++;
        if (answer.correct) day.correct++;
      }
    }
    return { words, days };
  }
  function draw(cards, words, size=5) {
    // Mix equal-priority words. Revisit misses first, then vary unseen and familiar words.
    const shuffled = [...cards];
    for (let i=shuffled.length-1; i>0; i--) {
      const j=Math.floor(Math.random()*(i+1));
      [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
    }
    const missed=[], fresh=[], review=[], collected=[];
    for (const card of shuffled) {
      const state=words.get(card.id);
      if (!state) fresh.push(card);
      else if (state.streak===0) missed.push(card);
      else if (state.streak===1) review.push(card);
      else collected.push(card);
    }
    const byAge=(a,b)=>words.get(a.id).time.localeCompare(words.get(b.id).time);
    missed.sort(byAge);review.sort(byAge);collected.sort(byAge);
    // Keep a slot for an unseen word so repeated misses do not hide the rest of the chapter.
    const firstMisses = missed.splice(0, Math.max(0, size - (fresh.length ? 1 : 0)));
    const available = size - firstMisses.length - (fresh.length ? 1 : 0);
    const revisit = review.splice(0, Math.min(2, Math.max(0, available)));
    return [...firstMisses, ...revisit, ...fresh, ...missed, ...review, ...collected].slice(0,size);
  }
  function restore(data) {
    if (data?.format !== 'woerterwald-3-v1' || !Array.isArray(data.rounds) || !data.rounds.every(validRound)) throw Error('Ungültige Sicherung');
    const existing = new Map(rounds().map(r=>[r.id,r]));
    for (const round of data.rounds) {
      const prev = existing.get(round.id);
      if (!prev || (prev.time===round.time && round.answers.length>prev.answers.length &&
          prev.answers.every((a,i)=>a.word===round.answers[i].word && a.correct===round.answers[i].correct))) {
        save(round); existing.set(round.id,round);
      }
    }
  }
  return { chapters, rounds, save, summary, draw, dayKey, restore, get durable(){return durable;} };
})();
