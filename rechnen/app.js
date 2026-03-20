// ============================================================
// LILLYS RECHEN-APP (1x1, Division, Gewichte)
// ============================================================

(function() {
  'use strict';

  // ========== WEIGHT EXERCISES ==========
  const WEIGHT_EXERCISES = {
    // Category 1: g <-> dag
    'w:10g_dag':   { value: 10,   fromUnit: 'g',   toUnit: 'dag', answer: 1,    category: 1 },
    'w:20g_dag':   { value: 20,   fromUnit: 'g',   toUnit: 'dag', answer: 2,    category: 1 },
    'w:50g_dag':   { value: 50,   fromUnit: 'g',   toUnit: 'dag', answer: 5,    category: 1 },
    'w:100g_dag':  { value: 100,  fromUnit: 'g',   toUnit: 'dag', answer: 10,   category: 1 },
    'w:200g_dag':  { value: 200,  fromUnit: 'g',   toUnit: 'dag', answer: 20,   category: 1 },
    'w:1dag_g':    { value: 1,    fromUnit: 'dag', toUnit: 'g',   answer: 10,   category: 1 },
    'w:2dag_g':    { value: 2,    fromUnit: 'dag', toUnit: 'g',   answer: 20,   category: 1 },
    'w:5dag_g':    { value: 5,    fromUnit: 'dag', toUnit: 'g',   answer: 50,   category: 1 },
    'w:10dag_g':   { value: 10,   fromUnit: 'dag', toUnit: 'g',   answer: 100,  category: 1 },
    'w:20dag_g':   { value: 20,   fromUnit: 'dag', toUnit: 'g',   answer: 200,  category: 1 },
    // Category 2: dag <-> kg
    'w:100dag_kg': { value: 100,  fromUnit: 'dag', toUnit: 'kg',  answer: 1,    category: 2 },
    'w:200dag_kg': { value: 200,  fromUnit: 'dag', toUnit: 'kg',  answer: 2,    category: 2 },
    'w:300dag_kg': { value: 300,  fromUnit: 'dag', toUnit: 'kg',  answer: 3,    category: 2 },
    'w:500dag_kg': { value: 500,  fromUnit: 'dag', toUnit: 'kg',  answer: 5,    category: 2 },
    'w:1000dag_kg':{ value: 1000, fromUnit: 'dag', toUnit: 'kg',  answer: 10,   category: 2 },
    'w:1kg_dag':   { value: 1,    fromUnit: 'kg',  toUnit: 'dag', answer: 100,  category: 2 },
    'w:2kg_dag':   { value: 2,    fromUnit: 'kg',  toUnit: 'dag', answer: 200,  category: 2 },
    'w:3kg_dag':   { value: 3,    fromUnit: 'kg',  toUnit: 'dag', answer: 300,  category: 2 },
    'w:5kg_dag':   { value: 5,    fromUnit: 'kg',  toUnit: 'dag', answer: 500,  category: 2 },
    'w:10kg_dag':  { value: 10,   fromUnit: 'kg',  toUnit: 'dag', answer: 1000, category: 2 },
    // Category 3: g <-> kg
    'w:1000g_kg':  { value: 1000, fromUnit: 'g',   toUnit: 'kg',  answer: 1,    category: 3 },
    'w:2000g_kg':  { value: 2000, fromUnit: 'g',   toUnit: 'kg',  answer: 2,    category: 3 },
    'w:3000g_kg':  { value: 3000, fromUnit: 'g',   toUnit: 'kg',  answer: 3,    category: 3 },
    'w:5000g_kg':  { value: 5000, fromUnit: 'g',   toUnit: 'kg',  answer: 5,    category: 3 },
    'w:500g_kg':   { value: 500,  fromUnit: 'g',   toUnit: 'kg',  answer: 0.5,  category: 3 },
    'w:1kg_g':     { value: 1,    fromUnit: 'kg',  toUnit: 'g',   answer: 1000, category: 3 },
    'w:2kg_g':     { value: 2,    fromUnit: 'kg',  toUnit: 'g',   answer: 2000, category: 3 },
    'w:3kg_g':     { value: 3,    fromUnit: 'kg',  toUnit: 'g',   answer: 3000, category: 3 },
    'w:5kg_g':     { value: 5,    fromUnit: 'kg',  toUnit: 'g',   answer: 5000, category: 3 },
    'w:4kg_g':     { value: 4,    fromUnit: 'kg',  toUnit: 'g',   answer: 4000, category: 3 }
  };

  const WEIGHT_CATEGORY_LABELS = {
    1: 'g \u2194 dag',
    2: 'dag \u2194 kg',
    3: 'g \u2194 kg'
  };

  // ========== STORE (Firestore + LocalStorage Fallback) ==========
  const STORE_KEY = 'lilly-mathe-app';

  const Store = {
    _data: null,
    _saveTimer: null,
    _firestoreReady: false,

    _defaultLicenses() {
      return {
        multiply: {
          bronze: { passed: false, date: null, score: null },
          silver: { passed: false, date: null, score: null },
          gold: { passed: false, date: null, score: null }
        },
        divide: {
          bronze: { passed: false, date: null, score: null },
          silver: { passed: false, date: null, score: null },
          gold: { passed: false, date: null, score: null }
        },
        weight: {
          bronze: { passed: false, date: null, score: null },
          silver: { passed: false, date: null, score: null },
          gold: { passed: false, date: null, score: null }
        }
      };
    },

    defaults() {
      return {
        playerName: '',
        leitner: {},
        licenses: this._defaultLicenses(),
        stats: {
          totalPracticed: 0,
          streakDays: 0,
          lastPracticeDate: null,
          sessionsCompleted: 0
        }
      };
    },

    // Migrate old flat licenses to new namespaced structure
    _migrateLicenses() {
      const lic = this._data.licenses;
      if (lic && lic.bronze && !lic.multiply) {
        const old = { ...lic };
        this._data.licenses = this._defaultLicenses();
        this._data.licenses.multiply = old;
        this.save();
      }
      // Ensure all modes exist
      if (!lic.multiply) this._data.licenses.multiply = { bronze: { passed: false, date: null, score: null }, silver: { passed: false, date: null, score: null }, gold: { passed: false, date: null, score: null } };
      if (!lic.divide) this._data.licenses.divide = { bronze: { passed: false, date: null, score: null }, silver: { passed: false, date: null, score: null }, gold: { passed: false, date: null, score: null } };
      if (!lic.weight) this._data.licenses.weight = { bronze: { passed: false, date: null, score: null }, silver: { passed: false, date: null, score: null }, gold: { passed: false, date: null, score: null } };
    },

    // Load: localStorage first (instant), then Firestore (async merge)
    load() {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        this._data = raw ? { ...this.defaults(), ...JSON.parse(raw) } : this.defaults();
      } catch(e) {
        this._data = this.defaults();
      }
      this._migrateLicenses();
      this._loadFromFirestore();
      return this._data;
    },

    async _loadFromFirestore() {
      if (typeof db === 'undefined') return;
      const name = this._data.playerName;
      if (!name) return;
      try {
        const doc = await db.collection('users').doc(name).get();
        if (doc.exists) {
          const remote = doc.data();
          if (remote.stats && remote.stats.totalPracticed > (this._data.stats?.totalPracticed || 0)) {
            this._data = { ...this.defaults(), ...remote };
            this._migrateLicenses();
            this._saveLocal();
            if (App.currentPage === 'dashboard') App.navigate('dashboard');
          } else if (remote.stats) {
            this._saveToFirestore();
          }
        } else {
          this._saveToFirestore();
        }
        this._firestoreReady = true;
        console.log('Firestore connected for user:', name);
      } catch(e) {
        console.log('Firestore offline, using localStorage:', e.message);
      }
    },

    save() {
      this._saveLocal();
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => this._saveToFirestore(), 2000);
    },

    _saveLocal() {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(this._data));
      } catch(e) { /* ignore */ }
    },

    async _saveToFirestore() {
      if (typeof db === 'undefined') return;
      const name = this._data.playerName;
      if (!name) return;
      try {
        await db.collection('users').doc(name).set(this._data);
      } catch(e) {
        console.log('Firestore save failed (offline?):', e.message);
      }
    },

    async syncAfterLogin() {
      await this._loadFromFirestore();
    },

    get data() {
      if (!this._data) this.load();
      return this._data;
    },

    // Leitner helpers

    // Get commutative twin key for multiply (3x6 <-> 6x3)
    _getTwinKey(key) {
      if (key.startsWith('d:') || key.startsWith('w:')) return null;
      const parts = key.split('x');
      if (parts.length !== 2) return null;
      return parts[1] + 'x' + parts[0];
    },

    getCard(key) {
      // For multiply keys, check both AxB and BxA, use the better one
      const twin = this._getTwinKey(key);
      if (twin && this.data.leitner[twin] && !this.data.leitner[key]) {
        // Twin exists but this key doesn't - copy twin's progress
        this.data.leitner[key] = { ...this.data.leitner[twin] };
      } else if (twin && this.data.leitner[twin] && this.data.leitner[key]) {
        // Both exist - use the one with higher box
        if (this.data.leitner[twin].box > this.data.leitner[key].box) {
          this.data.leitner[key] = { ...this.data.leitner[twin] };
        }
      }
      if (!this.data.leitner[key]) {
        this.data.leitner[key] = { box: 1, lastReviewed: null, correct: 0, wrong: 0 };
      }
      return this.data.leitner[key];
    },

    promoteCard(key) {
      const card = this.getCard(key);
      if (card.box < 5) card.box++;
      card.correct++;
      card.lastReviewed = Date.now();
      this.data.stats.totalPracticed++;
      // Sync commutative twin
      const twin = this._getTwinKey(key);
      if (twin) this.data.leitner[twin] = { ...this.data.leitner[key] };
      this._updateStreak();
      this.save();
    },

    demoteCard(key) {
      const card = this.getCard(key);
      if (card.box > 1) card.box--;
      card.wrong++;
      card.lastReviewed = Date.now();
      this.data.stats.totalPracticed++;
      // Sync commutative twin
      const twin = this._getTwinKey(key);
      if (twin) this.data.leitner[twin] = { ...this.data.leitner[key] };
      this._updateStreak();
      this.save();
    },

    _updateStreak() {
      const today = new Date().toDateString();
      const last = this.data.stats.lastPracticeDate;
      if (last !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (last === yesterday) {
          this.data.stats.streakDays++;
        } else if (last !== today) {
          this.data.stats.streakDays = 1;
        }
        this.data.stats.lastPracticeDate = today;
      }
    },

    getBoxCounts(groups, mode) {
      const counts = [0, 0, 0, 0, 0];
      const keys = this._getKeysForMode(groups, mode || 'multiply');
      keys.forEach(key => {
        const card = this.getCard(key);
        counts[card.box - 1]++;
      });
      return counts;
    },

    getCardsForBox(groups, box, mode) {
      const keys = this._getKeysForMode(groups, mode || 'multiply');
      return keys.filter(key => this.getCard(key).box === box);
    },

    getDueCards(groups, mode) {
      const now = Date.now();
      const intervals = [0, 0, 2*86400000, 4*86400000, 7*86400000, 14*86400000];
      const keys = this._getKeysForMode(groups, mode || 'multiply');
      return keys.filter(key => {
        const card = this.getCard(key);
        if (!card.lastReviewed) return true;
        return (now - card.lastReviewed) >= intervals[card.box];
      });
    },

    getTableProgress(table) {
      return this.getGroupProgress(table, 'multiply');
    },

    getGroupProgress(group, mode) {
      const keys = this._getKeysForMode([group], mode || 'multiply');
      const total = keys.length;
      if (total === 0) return 0;
      let mastered = 0;
      keys.forEach(key => {
        const card = this.getCard(key);
        if (card.box >= 4) mastered++;
      });
      return Math.round((mastered / total) * 100);
    },

    getHardestFacts(limit, mode) {
      const entries = Object.entries(this.data.leitner);
      return entries
        .filter(([key, card]) => {
          if ((card.correct + card.wrong) === 0) return false;
          if (mode === 'multiply') return !key.startsWith('d:') && !key.startsWith('w:');
          if (mode === 'divide') return key.startsWith('d:');
          if (mode === 'weight') return key.startsWith('w:');
          return !key.startsWith('d:') && !key.startsWith('w:');
        })
        .map(([key, card]) => ({
          key,
          total: card.correct + card.wrong,
          errorRate: card.wrong / (card.correct + card.wrong),
          box: card.box
        }))
        .sort((a, b) => b.errorRate - a.errorRate)
        .slice(0, limit || 5);
    },

    _getKeysForTables(tables) {
      const keys = [];
      tables.forEach(t => {
        for (let i = 1; i <= 10; i++) {
          keys.push(`${i}x${t}`);
        }
      });
      return keys;
    },

    _getKeysForMode(groups, mode) {
      if (mode === 'divide') {
        const keys = [];
        groups.forEach(t => {
          for (let i = 1; i <= 10; i++) {
            keys.push(`d:${i * t}x${t}`);
          }
        });
        return keys;
      }
      if (mode === 'weight') {
        return this._getKeysForWeightCategories(groups);
      }
      return this._getKeysForTables(groups);
    },

    _getKeysForWeightCategories(categories) {
      return Object.keys(WEIGHT_EXERCISES)
        .filter(k => categories.includes(WEIGHT_EXERCISES[k].category));
    }
  };

  // ========== SOUNDS (Web Audio API) ==========
  const Sounds = {
    _ctx: null,

    _getCtx() {
      if (!this._ctx) {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return this._ctx;
    },

    play(type) {
      try {
        const ctx = this._getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        switch(type) {
          case 'correct':
            osc.frequency.setValueAtTime(523, ctx.currentTime);
            osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
            break;

          case 'wrong':
            osc.frequency.setValueAtTime(330, ctx.currentTime);
            osc.frequency.setValueAtTime(277, ctx.currentTime + 0.15);
            osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
            break;

          case 'click':
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.08);
            break;

          case 'fanfare':
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g);
              g.connect(ctx.destination);
              o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
              o.type = 'triangle';
              g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
              g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);
              o.start(ctx.currentTime + i * 0.15);
              o.stop(ctx.currentTime + i * 0.15 + 0.4);
            });
            break;
        }
      } catch(e) { /* sounds optional */ }
    }
  };

  // ========== CONFETTI ==========
  const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animating: false,

    init() {
      this.canvas = document.getElementById('confetti-canvas');
      this.ctx = this.canvas.getContext('2d');
      this._resize();
      window.addEventListener('resize', () => this._resize());
    },

    _resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    burst() {
      const colors = ['#6C5CE7', '#FD79A8', '#00CEC9', '#FDCB6E', '#00B894', '#F39C12'];
      this.particles = [];
      for (let i = 0; i < 80; i++) {
        this.particles.push({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15 - 5,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 10,
          life: 1
        });
      }
      if (!this.animating) {
        this.animating = true;
        this._animate();
      }
    },

    _animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.particles = this.particles.filter(p => p.life > 0);
      if (this.particles.length === 0) {
        this.animating = false;
        return;
      }
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life -= 0.015;
        p.rotation += p.rotSpeed;
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation * Math.PI / 180);
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        this.ctx.restore();
      });
      requestAnimationFrame(() => this._animate());
    }
  };

  // ========== HELPERS ==========
  function parseKey(key) {
    if (key.startsWith('d:')) {
      const parts = key.substring(2).split('x');
      return { a: parseInt(parts[0]), b: parseInt(parts[1]), mode: 'divide' };
    }
    if (key.startsWith('w:')) {
      const ex = WEIGHT_EXERCISES[key];
      return { mode: 'weight', key: key, value: ex.value, fromUnit: ex.fromUnit, toUnit: ex.toUnit, answer: ex.answer };
    }
    const parts = key.split('x');
    return { a: parseInt(parts[0]), b: parseInt(parts[1]), mode: 'multiply' };
  }

  function getQuestionText(key) {
    const parsed = parseKey(key);
    if (parsed.mode === 'divide') return `${parsed.a} \u00F7 ${parsed.b}`;
    if (parsed.mode === 'weight') return `${parsed.value} ${parsed.fromUnit} = ? ${parsed.toUnit}`;
    return `${parsed.a} \u00D7 ${parsed.b}`;
  }

  function getCorrectAnswer(key) {
    const parsed = parseKey(key);
    if (parsed.mode === 'divide') return parsed.a / parsed.b;
    if (parsed.mode === 'weight') return parsed.answer;
    return parsed.a * parsed.b;
  }

  function getAnswerText(key) {
    const parsed = parseKey(key);
    const answer = getCorrectAnswer(key);
    if (parsed.mode === 'weight') return `${answer} ${parsed.toUnit}`;
    return `= ${answer}`;
  }

  function getFactDisplayText(key) {
    const parsed = parseKey(key);
    const answer = getCorrectAnswer(key);
    if (parsed.mode === 'divide') return `${parsed.a} \u00F7 ${parsed.b} = ${answer}`;
    if (parsed.mode === 'weight') return `${parsed.value} ${parsed.fromUnit} = ${answer} ${parsed.toUnit}`;
    return `${parsed.a} \u00D7 ${parsed.b} = ${answer}`;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateWrongAnswers(correct, count, mode) {
    const wrongs = new Set();
    const range = (mode === 'weight' && correct > 100) ? Math.max(20, Math.floor(correct * 0.5)) : 20;
    while (wrongs.size < count) {
      let offset = Math.floor(Math.random() * range) - Math.floor(range / 2);
      if (offset === 0) offset = Math.random() < 0.5 ? 1 : -1;
      const wrong = correct + offset;
      if (wrong > 0 && wrong !== correct) wrongs.add(wrong);
    }
    return [...wrongs];
  }

  function el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (k === 'className') e.className = v;
        else if (k === 'onclick') e.onclick = v;
        else if (k === 'oninput') e.oninput = v;
        else if (k === 'onkeydown') e.onkeydown = v;
        else if (k === 'style') e.style.cssText = v;
        else if (k.startsWith('data')) e.setAttribute(k.replace(/([A-Z])/g, '-$1').toLowerCase(), v);
        else e.setAttribute(k, v);
      });
    }
    children.forEach(c => {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  }

  // Render quiz question as DOM element (mode-aware)
  function renderQuestionDOM(key) {
    const parsed = parseKey(key);
    if (parsed.mode === 'weight') {
      return el('div', { className: 'quiz-question animate-bounce-in' },
        `${parsed.value} ${parsed.fromUnit}`,
        el('span', { className: 'quiz-operator' }, ' = '),
        el('span', { className: 'quiz-blank', id: 'quiz-answer-display' }, '?'),
        el('span', { className: 'quiz-unit' }, ` ${parsed.toUnit}`)
      );
    }
    const operator = parsed.mode === 'divide' ? ' \u00F7 ' : ' \u00D7 ';
    return el('div', { className: 'quiz-question animate-bounce-in' },
      `${parsed.a}`,
      el('span', { className: 'quiz-operator' }, operator),
      `${parsed.b}`,
      el('span', { className: 'quiz-equals' }, ' = '),
      el('span', { className: 'quiz-blank', id: 'quiz-answer-display' }, '?')
    );
  }

  // ========== MODE CONFIG ==========
  function getModeTitle(mode) {
    const name = Store.data.playerName;
    if (mode === 'divide') return `${name}s 1:1`;
    if (mode === 'weight') return `${name}s Gewichte`;
    return `${name}s 1x1`;
  }

  function getModeSectionTitle(mode) {
    if (mode === 'divide') return 'W\u00E4hle deine Divisionsreihe';
    if (mode === 'weight') return 'W\u00E4hle die Kategorie';
    return 'W\u00E4hle dein Einmaleins';
  }

  function getModeLicenseTitle(mode) {
    if (mode === 'divide') return 'Divisions-F\u00FChrerschein';
    if (mode === 'weight') return 'Gewichte-F\u00FChrerschein';
    return 'Rechenf\u00FChrerschein';
  }

  function getTiersForMode(mode) {
    if (mode === 'weight') {
      return [
        {
          key: 'bronze', medal: '\uD83E\uDD49', name: 'Bronze',
          desc: 'g \u2194 dag Umrechnungen \u2022 10 Aufgaben \u2022 80% zum Bestehen',
          tables: [1], count: 10, passRate: 80
        },
        {
          key: 'silver', medal: '\uD83E\uDD48', name: 'Silber',
          desc: 'dag \u2194 kg Umrechnungen \u2022 10 Aufgaben \u2022 80% zum Bestehen',
          tables: [2], count: 10, passRate: 80
        },
        {
          key: 'gold', medal: '\uD83E\uDD47', name: 'Gold',
          desc: 'g \u2194 kg Umrechnungen \u2022 10 Aufgaben \u2022 85% zum Bestehen',
          tables: [3], count: 10, passRate: 85
        }
      ];
    }
    // Same tiers for multiply and divide
    return [
      {
        key: 'bronze', medal: '\uD83E\uDD49', name: 'Bronze',
        desc: '2er, 5er und 10er Reihe \u2022 10 Aufgaben \u2022 80% zum Bestehen',
        tables: [2, 5, 10], count: 10, passRate: 80
      },
      {
        key: 'silver', medal: '\uD83E\uDD48', name: 'Silber',
        desc: '3er, 4er und 9er Reihe \u2022 15 Aufgaben \u2022 80% zum Bestehen',
        tables: [3, 4, 9], count: 15, passRate: 80
      },
      {
        key: 'gold', medal: '\uD83E\uDD47', name: 'Gold',
        desc: '6er, 7er und 8er Reihe + Mix \u2022 20 Aufgaben \u2022 85% zum Bestehen',
        tables: [6, 7, 8], count: 20, passRate: 85
      }
    ];
  }

  // ========== ROUTER / APP ==========
  const App = {
    currentPage: 'dashboard',
    pageHistory: [],
    selectedTables: [2],
    selectedCount: 10,
    quizType: 'choice',
    mode: 'multiply',

    init() {
      Store.load();
      Confetti.init();

      if (!Store.data.playerName) {
        this._showNameInput();
      } else {
        this.navigate('dashboard');
        Store.syncAfterLogin();
      }
    },

    _showNameInput() {
      const content = document.getElementById('content');
      content.innerHTML = '';
      const screen = el('div', { className: 'name-input-screen' },
        el('div', { className: 'welcome-icon' }, '\uD83C\uDF1F'),
        el('h2', null, 'Willkommen!\nWie hei\u00DFt du?'),
        el('input', {
          className: 'name-input',
          type: 'text',
          placeholder: 'Dein Name',
          id: 'name-field',
          onkeydown: (e) => { if (e.key === 'Enter') this._saveName(); }
        }),
        el('button', {
          className: 'btn-start',
          onclick: () => this._saveName()
        }, 'Los geht\'s!')
      );
      content.appendChild(screen);
      setTimeout(() => document.getElementById('name-field')?.focus(), 100);
    },

    async _saveName() {
      const val = document.getElementById('name-field')?.value?.trim();
      if (!val) return;
      Store.data.playerName = val;
      Store.save();
      await Store.syncAfterLogin();
      this.navigate('dashboard');
    },

    navigate(page, params) {
      if (this.currentPage !== page) {
        this.pageHistory.push(this.currentPage);
      }
      this.currentPage = page;
      this._params = params || {};

      // Update nav
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
      });

      // Back button
      const backBtn = document.getElementById('btn-back');
      backBtn.style.display = (page === 'dashboard') ? 'none' : '';

      // Update title
      const titles = {
        dashboard: getModeTitle(this.mode),
        flashcards: 'Lernkarten',
        quiz: 'Quiz',
        'quiz-play': 'Quiz',
        license: getModeLicenseTitle(this.mode),
        'license-test': 'Pr\u00FCfung',
        'license-practice': 'Generalprobe',
        stats: 'Statistik',
        'flashcard-session': 'Lernkarten'
      };
      document.getElementById('header-title').textContent = titles[page] || getModeTitle(this.mode);

      // Render page
      const content = document.getElementById('content');
      content.innerHTML = '';

      switch(page) {
        case 'dashboard': Views.dashboard(content); break;
        case 'flashcards': Views.flashcards(content); break;
        case 'flashcard-session': Views.flashcardSession(content); break;
        case 'quiz': Views.quiz(content); break;
        case 'quiz-play': Views.quizPlay(content); break;
        case 'license': Views.license(content); break;
        case 'license-practice': Views.licenseTest(content, true); break;
        case 'license-test': Views.licenseTest(content, false); break;
        case 'stats': Views.stats(content); break;
        default: Views.dashboard(content);
      }

      Sounds.play('click');
      content.scrollTop = 0;
      window.scrollTo(0, 0);
    },

    goBack() {
      const prev = this.pageHistory.pop() || 'dashboard';
      this.currentPage = '__';
      this.navigate(prev);
    },

    setMode(mode) {
      this.mode = mode;
      // Reset selected tables for weight mode
      if (mode === 'weight') {
        this.selectedTables = [1];
      } else {
        if (this.selectedTables.some(t => t > 10)) {
          this.selectedTables = [2];
        }
      }
      this.navigate('dashboard');
    }
  };

  // ========== VIEWS ==========
  const Views = {
    // --- MODE SELECTOR ---
    _renderModeSelector(container) {
      const modes = [
        { key: 'multiply', icon: '\u00D7', label: 'Malnehmen' },
        { key: 'divide', icon: '\u00F7', label: 'Teilen' },
        { key: 'weight', icon: '\u2696\uFE0F', label: 'Gewichte' }
      ];
      const selector = el('div', { className: 'mode-selector' });
      modes.forEach(m => {
        selector.appendChild(el('button', {
          className: `mode-btn ${App.mode === m.key ? 'selected' : ''}`,
          onclick: () => App.setMode(m.key)
        },
          el('span', { className: 'mode-icon' }, m.icon),
          el('span', null, m.label)
        ));
      });
      container.appendChild(selector);
    },

    // --- TABLE / CATEGORY GRID ---
    _renderGroupSelector(container, navigateTo) {
      if (App.mode === 'weight') {
        // Weight categories
        container.appendChild(el('div', { className: 'section-title' }, getModeSectionTitle(App.mode)));
        const grid = el('div', { className: 'category-grid' });
        [1, 2, 3].forEach(cat => {
          const isSelected = App.selectedTables.includes(cat);
          const progress = Store.getGroupProgress(cat, App.mode);
          grid.appendChild(el('button', {
            className: `category-btn ${isSelected ? 'selected' : ''}`,
            onclick: () => {
              const idx = App.selectedTables.indexOf(cat);
              if (idx >= 0) App.selectedTables.splice(idx, 1);
              else App.selectedTables.push(cat);
              Sounds.play('click');
              App.navigate(navigateTo);
            }
          },
            el('span', null, WEIGHT_CATEGORY_LABELS[cat]),
            el('div', { className: 'category-progress' },
              el('div', { className: 'category-progress-fill', style: `width:${progress}%` })
            )
          ));
        });
        container.appendChild(grid);
      } else {
        // Tables 1-10
        container.appendChild(el('div', { className: 'section-title' }, getModeSectionTitle(App.mode)));
        const grid = el('div', { className: 'table-grid' });
        for (let i = 1; i <= 10; i++) {
          const isSelected = App.selectedTables.includes(i);
          const progress = Store.getGroupProgress(i, App.mode);
          const btn = el('button', {
            className: `table-btn ${isSelected ? 'selected' : ''}`,
            onclick: () => {
              const idx = App.selectedTables.indexOf(i);
              if (idx >= 0) App.selectedTables.splice(idx, 1);
              else App.selectedTables.push(i);
              Sounds.play('click');
              App.navigate(navigateTo);
            }
          },
            el('span', null, `${i}`),
            el('div', { className: 'progress-ring' },
              el('div', { className: 'progress-fill', style: `width:${progress}%` })
            )
          );
          btn.dataset.table = i;
          grid.appendChild(btn);
        }
        container.appendChild(grid);
      }
    },

    // --- DASHBOARD ---
    dashboard(container) {
      const name = Store.data.playerName;
      const hour = new Date().getHours();
      let greeting = 'Guten Morgen';
      if (hour >= 12 && hour < 17) greeting = 'Hallo';
      else if (hour >= 17) greeting = 'Guten Abend';

      container.appendChild(el('div', { className: 'greeting' }, `${greeting}, ${name}!`));
      container.appendChild(el('div', { className: 'greeting-sub' }, 'Was m\u00F6chtest du heute \u00FCben?'));

      // Mode selector
      this._renderModeSelector(container);

      // Quick actions
      const qa = el('div', { className: 'quick-actions' },
        el('button', { className: 'quick-action qa-quiz', onclick: () => App.navigate('quiz') },
          el('span', { className: 'qa-icon' }, '\uD83E\uDDE0'),
          el('span', null, 'Quiz starten')
        ),
        el('button', { className: 'quick-action qa-license', onclick: () => App.navigate('license') },
          el('span', { className: 'qa-icon' }, '\uD83C\uDFC6'),
          el('span', null, getModeLicenseTitle(App.mode))
        )
      );
      container.appendChild(qa);

      // Table / category selection
      this._renderGroupSelector(container, 'dashboard');

      // Count selector
      container.appendChild(el('div', { className: 'section-title' }, 'Anzahl der Aufgaben'));
      const counts = el('div', { className: 'count-selector' });
      [5, 10, 15, 20].forEach(n => {
        counts.appendChild(el('button', {
          className: `count-btn ${App.selectedCount === n ? 'selected' : ''}`,
          onclick: () => {
            App.selectedCount = n;
            Sounds.play('click');
            App.navigate('dashboard');
          }
        }, `${n}`));
      });
      container.appendChild(counts);

      // Start button
      container.appendChild(el('button', {
        className: 'btn-start',
        onclick: () => App.navigate('flashcard-session'),
        disabled: App.selectedTables.length === 0 ? 'disabled' : undefined
      }, '\uD83D\uDCDA Lernkarten starten'));

      // Streak info
      if (Store.data.stats.streakDays > 0) {
        const streak = el('div', { className: 'card text-center', style: 'margin-top:16px' },
          el('span', { style: 'font-size:2rem' }, '\uD83D\uDD25'),
          el('div', { style: 'font-weight:800;font-size:1.1rem' }, `${Store.data.stats.streakDays} Tage Streak!`),
          el('div', { style: 'color:var(--text-light);font-size:0.85rem' }, 'Weiter so!')
        );
        container.appendChild(streak);
      }
    },

    _toggleTable(num) {
      const idx = App.selectedTables.indexOf(num);
      if (idx >= 0) {
        App.selectedTables.splice(idx, 1);
      } else {
        App.selectedTables.push(num);
      }
      App.navigate('dashboard');
    },

    // --- FLASHCARDS OVERVIEW ---
    flashcards(container) {
      // Mode selector
      this._renderModeSelector(container);

      container.appendChild(el('div', { className: 'section-title' }, 'Leitner-Box System'));
      container.appendChild(el('p', { style: 'color:var(--text-light);margin-bottom:16px;font-size:0.9rem' },
        'Richtige Antworten steigen auf, falsche fallen zur\u00FCck. So lernst du am besten!'));

      const allTables = App.selectedTables.length > 0 ? App.selectedTables :
        (App.mode === 'weight' ? [1, 2, 3] : [1,2,3,4,5,6,7,8,9,10]);
      const counts = Store.getBoxCounts(allTables, App.mode);
      const boxLabels = ['Neu', '\u00DCben', 'Lernen', 'Gut', 'Super'];

      const boxes = el('div', { className: 'leitner-boxes' });
      counts.forEach((count, i) => {
        boxes.appendChild(el('div', { className: `leitner-box box-${i+1}` },
          el('span', { className: 'box-count' }, `${count}`),
          el('span', null, boxLabels[i])
        ));
      });
      container.appendChild(boxes);

      // Due cards info
      const dueCards = Store.getDueCards(allTables, App.mode);
      if (dueCards.length > 0) {
        container.appendChild(el('div', { className: 'card' },
          el('div', { style: 'font-weight:800;margin-bottom:8px' }, `${dueCards.length} Karten f\u00E4llig`),
          el('div', { style: 'color:var(--text-light);font-size:0.9rem;margin-bottom:12px' },
            'Diese Karten sind bereit zum \u00DCben!'),
          el('button', {
            className: 'btn-start',
            onclick: () => App.navigate('flashcard-session')
          }, '\uD83D\uDCDA Jetzt \u00FCben')
        ));
      } else {
        container.appendChild(el('div', { className: 'card text-center' },
          el('div', { style: 'font-size:2.5rem;margin-bottom:8px' }, '\u2705'),
          el('div', { style: 'font-weight:700' }, 'Alle Karten sind auf dem neusten Stand!'),
          el('div', { style: 'color:var(--text-light);font-size:0.9rem' }, 'Komm sp\u00E4ter wieder.')
        ));
      }

      // Table selection reminder
      const selectedLabel = App.mode === 'weight'
        ? `Ausgew\u00E4hlte Kategorien: ${allTables.map(c => WEIGHT_CATEGORY_LABELS[c]).join(', ')}`
        : `Ausgew\u00E4hlte Reihen: ${allTables.join(', ')}`;
      container.appendChild(el('div', { className: 'section-title', style: 'margin-top:20px' }, selectedLabel));
      container.appendChild(el('p', { style: 'color:var(--text-light);font-size:0.85rem' },
        '\u00C4ndere die Auswahl auf der Startseite.'));
    },

    // --- FLASHCARD SESSION ---
    flashcardSession(container) {
      const tables = App.selectedTables.length > 0 ? App.selectedTables :
        (App.mode === 'weight' ? [1] : [2]);
      let cards = Store.getDueCards(tables, App.mode);
      if (cards.length === 0) {
        cards = Store._getKeysForMode(tables, App.mode);
      }
      cards = shuffle(cards).slice(0, App.selectedCount);

      if (cards.length === 0) {
        const emptyMsg = App.mode === 'weight'
          ? 'Keine Karten verf\u00FCgbar. W\u00E4hle Kategorien auf der Startseite.'
          : 'Keine Karten verf\u00FCgbar. W\u00E4hle Reihen auf der Startseite.';
        container.appendChild(el('div', { className: 'empty-state' },
          el('div', { className: 'empty-state-icon' }, '\uD83D\uDCDA'),
          el('p', null, emptyMsg)
        ));
        return;
      }

      let current = 0;
      let showingAnswer = false;
      const mode = App.mode;

      function render() {
        container.innerHTML = '';
        if (current >= cards.length) {
          renderComplete();
          return;
        }

        const key = cards[current];
        const answer = getCorrectAnswer(key);
        const card = Store.getCard(key);

        // Progress
        container.appendChild(el('div', { className: 'flashcard-progress' },
          `Karte ${current + 1} von ${cards.length} \u2022 Box ${card.box}`));

        // Leitner boxes mini
        const allCounts = Store.getBoxCounts(tables, mode);
        const boxLabels = ['1', '2', '3', '4', '5'];
        const boxes = el('div', { className: 'leitner-boxes mb-16' });
        allCounts.forEach((count, i) => {
          boxes.appendChild(el('div', { className: `leitner-box box-${i+1}` },
            el('span', { className: 'box-count' }, `${count}`),
            el('span', null, boxLabels[i])
          ));
        });
        container.appendChild(boxes);

        // Flashcard
        const questionText = getQuestionText(key);
        const answerText = getAnswerText(key);
        const flashcard = el('div', { className: 'flashcard-container' },
          el('div', {
            className: 'flashcard animate-bounce-in',
            onclick: () => { if (!showingAnswer) { showingAnswer = true; render(); } }
          },
            showingAnswer
              ? el('div', null,
                  el('div', { className: 'flashcard-question', style: 'font-size:1.5rem;color:var(--text-light);margin-bottom:8px' }, questionText),
                  el('div', { className: 'flashcard-answer' }, answerText)
                )
              : el('div', null,
                  el('div', { className: 'flashcard-question' }, questionText),
                  el('div', { className: 'flashcard-hint' }, 'Tippe um die L\u00F6sung zu sehen')
                )
          )
        );
        container.appendChild(flashcard);

        if (showingAnswer) {
          const btns = el('div', { className: 'answer-buttons' },
            el('button', {
              className: 'btn-wrong',
              onclick: () => {
                Store.demoteCard(key);
                Sounds.play('wrong');
                showingAnswer = false;
                current++;
                render();
              }
            }, '\u274C Falsch'),
            el('button', {
              className: 'btn-correct',
              onclick: () => {
                Store.promoteCard(key);
                Sounds.play('correct');
                showingAnswer = false;
                current++;
                render();
              }
            }, '\u2705 Richtig')
          );
          container.appendChild(btns);
        } else {
          container.appendChild(el('button', {
            className: 'btn-show-answer',
            onclick: () => { showingAnswer = true; render(); }
          }, '\uD83D\uDC41\uFE0F L\u00F6sung zeigen'));
        }
      }

      function renderComplete() {
        Store.data.stats.sessionsCompleted++;
        Store.save();
        Sounds.play('fanfare');
        Confetti.burst();

        container.appendChild(el('div', { className: 'result-screen' },
          el('div', { className: 'result-emoji' }, '\uD83C\uDF89'),
          el('div', { className: 'result-title' }, 'Geschafft!'),
          el('div', { className: 'result-detail' }, `Du hast ${cards.length} Karten durchgearbeitet!`),
          el('button', {
            className: 'btn-start',
            style: 'margin-bottom:12px',
            onclick: () => App.navigate('flashcard-session')
          }, '\uD83D\uDD04 Nochmal \u00FCben'),
          el('button', {
            className: 'btn-start',
            style: 'background:var(--secondary)',
            onclick: () => App.navigate('dashboard')
          }, '\uD83C\uDFE0 Zur\u00FCck')
        ));
      }

      render();
    },

    // --- QUIZ SETUP ---
    quiz(container) {
      // Mode selector
      this._renderModeSelector(container);

      container.appendChild(el('div', { className: 'section-title' }, 'Quiz-Modus'));
      container.appendChild(el('p', { style: 'color:var(--text-light);margin-bottom:20px;font-size:0.9rem' },
        'Teste dein Wissen! W\u00E4hle wie du antworten m\u00F6chtest.'));

      // Quiz type
      container.appendChild(el('div', { className: 'section-title' }, 'Antwortart'));
      const types = el('div', { className: 'quiz-type-selector' });
      [
        { key: 'choice', label: 'Auswahl' },
        { key: 'input', label: 'Eintippen' }
      ].forEach(t => {
        types.appendChild(el('button', {
          className: `quiz-type-btn ${App.quizType === t.key ? 'selected' : ''}`,
          onclick: () => { App.quizType = t.key; Sounds.play('click'); App.navigate('quiz'); }
        }, t.label));
      });
      container.appendChild(types);

      // Table/category selection
      const sectionTitle = App.mode === 'weight' ? 'Kategorien' :
        (App.mode === 'divide' ? 'Divisionsreihen' : 'Einmaleins-Reihen');
      this._renderGroupSelector(container, 'quiz');

      // Count
      container.appendChild(el('div', { className: 'section-title' }, 'Anzahl'));
      const counts = el('div', { className: 'count-selector' });
      [5, 10, 15, 20].forEach(n => {
        counts.appendChild(el('button', {
          className: `count-btn ${App.selectedCount === n ? 'selected' : ''}`,
          onclick: () => { App.selectedCount = n; Sounds.play('click'); App.navigate('quiz'); }
        }, `${n}`));
      });
      container.appendChild(counts);

      // Start
      container.appendChild(el('button', {
        className: 'btn-start',
        onclick: () => App.navigate('quiz-play'),
        disabled: App.selectedTables.length === 0 ? 'disabled' : undefined
      }, '\uD83D\uDE80 Quiz starten'));
    },

    // --- QUIZ PLAY ---
    quizPlay(container) {
      const tables = App.selectedTables.length > 0 ? App.selectedTables :
        (App.mode === 'weight' ? [1] : [2]);
      let allKeys = Store._getKeysForMode(tables, App.mode);
      let questions = shuffle(allKeys).slice(0, App.selectedCount);
      let current = 0;
      let results = [];
      let answered = false;
      const mode = App.mode;

      function render() {
        container.innerHTML = '';
        if (current >= questions.length) {
          renderResult();
          return;
        }

        const key = questions[current];
        const correctAnswer = getCorrectAnswer(key);
        answered = false;

        // Header
        const header = el('div', { className: 'quiz-header' },
          el('span', { style: 'font-weight:700' }, `Frage ${current + 1}/${questions.length}`),
          el('span', { className: 'badge badge-primary' },
            `${results.filter(r => r.correct).length} richtig`)
        );
        container.appendChild(header);

        // Progress bar
        const progressBar = el('div', { className: 'quiz-progress-bar' },
          el('div', {
            className: 'quiz-progress-fill',
            style: `width:${(current / questions.length) * 100}%`
          })
        );
        container.appendChild(progressBar);

        // Question (mode-aware)
        container.appendChild(renderQuestionDOM(key));

        if (App.quizType === 'choice') {
          renderChoiceMode(container, correctAnswer, key);
        } else {
          renderInputMode(container, correctAnswer, key);
        }
      }

      function renderChoiceMode(container, correctAnswer, key) {
        const wrongs = generateWrongAnswers(correctAnswer, 3, mode);
        const options = shuffle([correctAnswer, ...wrongs]);

        const optionsDiv = el('div', { className: 'quiz-options' });
        options.forEach(opt => {
          const btn = el('button', {
            className: 'quiz-option',
            onclick: () => {
              if (answered) return;
              answered = true;
              const isCorrect = opt === correctAnswer;
              btn.classList.add(isCorrect ? 'correct' : 'wrong');

              if (isCorrect) {
                Store.promoteCard(key);
                Sounds.play('correct');
                document.getElementById('quiz-answer-display').textContent = correctAnswer;
              } else {
                Store.demoteCard(key);
                Sounds.play('wrong');
                optionsDiv.querySelectorAll('.quiz-option').forEach(b => {
                  if (b.textContent == correctAnswer) b.classList.add('correct');
                });
                document.getElementById('quiz-answer-display').textContent = correctAnswer;
              }

              results.push({ key, correct: isCorrect, given: opt, answer: correctAnswer });
              setTimeout(() => { current++; render(); }, 1200);
            }
          }, `${opt}`);
          optionsDiv.appendChild(btn);
        });
        container.appendChild(optionsDiv);
      }

      function renderInputMode(container, correctAnswer, key) {
        const inputContainer = el('div', { className: 'quiz-input-container' });
        const input = el('input', {
          className: 'quiz-input',
          type: 'number',
          id: 'quiz-input-field',
          placeholder: '?',
          onkeydown: (e) => { if (e.key === 'Enter') submitAnswer(); }
        });
        const submitBtn = el('button', {
          className: 'btn-submit',
          onclick: submitAnswer
        }, '\u2714');

        inputContainer.appendChild(input);
        inputContainer.appendChild(submitBtn);
        container.appendChild(inputContainer);

        setTimeout(() => input.focus(), 100);

        function submitAnswer() {
          if (answered) return;
          const val = parseFloat(input.value);
          if (isNaN(val)) return;
          answered = true;

          const isCorrect = val === correctAnswer;
          input.classList.add(isCorrect ? 'correct' : 'wrong');
          document.getElementById('quiz-answer-display').textContent = correctAnswer;

          if (isCorrect) {
            Store.promoteCard(key);
            Sounds.play('correct');
          } else {
            Store.demoteCard(key);
            Sounds.play('wrong');
          }

          results.push({ key, correct: isCorrect, given: val, answer: correctAnswer });
          setTimeout(() => { current++; render(); }, 1200);
        }
      }

      function renderResult() {
        Store.data.stats.sessionsCompleted++;
        Store.save();

        const correctCount = results.filter(r => r.correct).length;
        const percent = Math.round((correctCount / results.length) * 100);

        let emoji = '\uD83C\uDF89';
        let title = 'Fantastisch!';
        if (percent < 50) { emoji = '\uD83D\uDCAA'; title = 'Weiter \u00FCben!'; }
        else if (percent < 80) { emoji = '\uD83D\uDC4D'; title = 'Gut gemacht!'; }
        else if (percent < 100) { emoji = '\uD83C\uDF1F'; title = 'Super!'; }

        if (percent >= 80) {
          Confetti.burst();
          Sounds.play('fanfare');
        }

        const resultScreen = el('div', { className: 'result-screen' },
          el('div', { className: 'result-emoji' }, emoji),
          el('div', { className: 'result-title' }, title),
          el('div', { className: 'result-score' }, `${percent}%`),
          el('div', { className: 'result-detail' }, `${correctCount} von ${results.length} richtig`)
        );
        container.appendChild(resultScreen);

        // Fact list
        const facts = el('div', { className: 'result-facts' });
        results.forEach(r => {
          facts.appendChild(el('div', {
            className: `result-fact ${r.correct ? 'is-correct' : 'is-wrong'}`
          },
            el('span', { className: 'result-fact-icon' }, r.correct ? '\u2705' : '\u274C'),
            el('span', null, getFactDisplayText(r.key)),
            !r.correct ? el('span', { style: 'color:var(--danger);margin-left:auto' }, `(${r.given})`) : null
          ));
        });
        container.appendChild(facts);

        // Buttons
        container.appendChild(el('button', {
          className: 'btn-start mb-12',
          onclick: () => App.navigate('quiz-play')
        }, '\uD83D\uDD04 Nochmal'));

        container.appendChild(el('button', {
          className: 'btn-start',
          style: 'background:var(--secondary)',
          onclick: () => App.navigate('dashboard')
        }, '\uD83C\uDFE0 Zur\u00FCck'));
      }

      render();
    },

    // --- LICENSE (Fuehrerschein) ---
    license(container) {
      // Mode selector
      this._renderModeSelector(container);

      const licenseTitle = getModeLicenseTitle(App.mode);
      container.appendChild(el('div', { className: 'section-title' }, `Dein ${licenseTitle}`));
      container.appendChild(el('p', { style: 'color:var(--text-light);margin-bottom:20px;font-size:0.9rem' },
        'Bestehe alle drei Pr\u00FCfungen und werde zum Profi!'));

      const tiers = getTiersForMode(App.mode);
      const modeLicenses = Store.data.licenses[App.mode];

      const tiersDiv = el('div', { className: 'license-tiers' });

      tiers.forEach((tier, idx) => {
        const license = modeLicenses[tier.key];
        const prevPassed = idx === 0 || modeLicenses[tiers[idx-1].key].passed;
        let statusText = 'Gesperrt';
        let statusClass = 'locked';

        if (license.passed) {
          statusText = '\u2705 Bestanden';
          statusClass = 'passed';
        } else if (prevPassed) {
          statusText = 'Bereit';
          statusClass = 'ready';
        }

        const tierEl = el('div', {
          className: 'license-tier',
          onclick: () => {
            if (!prevPassed && !license.passed) return;
            App._params = { tier };
            if (license.passed) {
              this._showCertificate(container, tier);
            } else {
              this._showLicenseOptions(container, tier);
            }
          }
        },
          el('div', { className: 'license-medal' }, tier.medal),
          el('div', { className: 'license-info' },
            el('h3', null, tier.name),
            el('p', null, tier.desc)
          ),
          el('div', { className: `license-status ${statusClass}` }, statusText)
        );
        tiersDiv.appendChild(tierEl);
      });

      container.appendChild(tiersDiv);
    },

    _showLicenseOptions(container, tier) {
      container.innerHTML = '';
      container.appendChild(el('div', { style: 'text-align:center;margin-bottom:24px' },
        el('div', { style: 'font-size:4rem;margin-bottom:8px' }, tier.medal),
        el('h2', { style: 'font-weight:900' }, `${tier.name}-Pr\u00FCfung`),
        el('p', { style: 'color:var(--text-light)' }, tier.desc)
      ));

      container.appendChild(el('button', {
        className: 'btn-start mb-12',
        style: 'background:var(--secondary)',
        onclick: () => {
          App._params = { tier };
          App.navigate('license-practice', { tier });
        }
      }, '\uD83D\uDCDD Generalprobe (\u00DCbung)'));

      container.appendChild(el('button', {
        className: 'btn-start',
        onclick: () => {
          App._params = { tier };
          App.navigate('license-test', { tier });
        }
      }, '\uD83C\uDFC1 Echte Pr\u00FCfung starten'));

      container.appendChild(el('button', {
        className: 'btn-start',
        style: 'background:var(--text-light);margin-top:12px',
        onclick: () => App.navigate('license')
      }, '\u2190 Zur\u00FCck'));
    },

    _showCertificate(container, tier) {
      container.innerHTML = '';
      const modeLicenses = Store.data.licenses[App.mode];
      const license = modeLicenses[tier.key];

      container.appendChild(el('div', { className: 'certificate animate-bounce-in' },
        el('div', { className: 'certificate-title' }, getModeLicenseTitle(App.mode)),
        el('div', { className: 'certificate-medal' }, tier.medal),
        el('div', { className: 'certificate-name' }, Store.data.playerName),
        el('div', { className: 'certificate-detail' }, `hat den ${tier.name}-Schein bestanden!`),
        el('div', { className: 'certificate-detail' }, `Ergebnis: ${license.score}%`),
        el('div', { className: 'certificate-detail' }, `Datum: ${new Date(license.date).toLocaleDateString('de-DE')}`)
      ));

      container.appendChild(el('button', {
        className: 'btn-start',
        style: 'background:var(--text-light)',
        onclick: () => App.navigate('license')
      }, '\u2190 Zur\u00FCck'));
    },

    // --- LICENSE TEST ---
    licenseTest(container, isPractice) {
      const tier = App._params?.tier;
      if (!tier) { App.navigate('license'); return; }

      let allKeys = Store._getKeysForMode(tier.tables, App.mode);
      let questions = shuffle(allKeys).slice(0, tier.count);
      let current = 0;
      let results = [];
      let answered = false;
      const mode = App.mode;

      function render() {
        container.innerHTML = '';
        if (current >= questions.length) {
          renderLicenseResult();
          return;
        }

        const key = questions[current];
        const correctAnswer = getCorrectAnswer(key);
        answered = false;

        // Header
        container.appendChild(el('div', { className: 'quiz-header' },
          el('span', { style: 'font-weight:700' }, `${isPractice ? '\u00DCbung' : 'Pr\u00FCfung'} ${current + 1}/${questions.length}`),
          el('span', null, `${tier.medal} ${tier.name}`)
        ));

        // Progress
        container.appendChild(el('div', { className: 'quiz-progress-bar' },
          el('div', {
            className: 'quiz-progress-fill',
            style: `width:${(current / questions.length) * 100}%`
          })
        ));

        // Question (mode-aware)
        container.appendChild(renderQuestionDOM(key));

        // Input mode for license tests
        const inputContainer = el('div', { className: 'quiz-input-container' });
        const input = el('input', {
          className: 'quiz-input',
          type: 'number',
          id: 'license-input',
          placeholder: '?',
          onkeydown: (e) => { if (e.key === 'Enter') submit(); }
        });
        const submitBtn = el('button', { className: 'btn-submit', onclick: submit }, '\u2714');
        inputContainer.appendChild(input);
        inputContainer.appendChild(submitBtn);
        container.appendChild(inputContainer);
        setTimeout(() => input.focus(), 100);

        function submit() {
          if (answered) return;
          const val = parseFloat(input.value);
          if (isNaN(val)) return;
          answered = true;
          const isCorrect = val === correctAnswer;

          input.classList.add(isCorrect ? 'correct' : 'wrong');
          document.getElementById('quiz-answer-display').textContent = correctAnswer;

          if (isCorrect) {
            Store.promoteCard(key);
            Sounds.play('correct');
          } else {
            Store.demoteCard(key);
            Sounds.play('wrong');
          }

          results.push({ key, correct: isCorrect, given: val, answer: correctAnswer });
          setTimeout(() => { current++; render(); }, 1000);
        }
      }

      function renderLicenseResult() {
        const correctCount = results.filter(r => r.correct).length;
        const percent = Math.round((correctCount / results.length) * 100);
        const passed = percent >= tier.passRate;

        if (passed && !isPractice) {
          Store.data.licenses[mode][tier.key] = {
            passed: true,
            date: Date.now(),
            score: percent
          };
          Store.data.stats.sessionsCompleted++;
          Store.save();
          Confetti.burst();
          Sounds.play('fanfare');
        } else if (!passed) {
          Store.data.stats.sessionsCompleted++;
          Store.save();
        }

        container.innerHTML = '';

        if (passed) {
          if (!isPractice) {
            container.appendChild(el('div', { className: 'certificate animate-bounce-in' },
              el('div', { className: 'certificate-title' }, getModeLicenseTitle(mode)),
              el('div', { className: 'certificate-medal' }, tier.medal),
              el('div', { className: 'certificate-name' }, Store.data.playerName),
              el('div', { className: 'certificate-detail' }, `hat den ${tier.name}-Schein bestanden!`),
              el('div', { className: 'certificate-detail' }, `Ergebnis: ${percent}%`),
              el('div', { className: 'certificate-detail' }, `Datum: ${new Date().toLocaleDateString('de-DE')}`)
            ));
          } else {
            container.appendChild(el('div', { className: 'result-screen' },
              el('div', { className: 'result-emoji' }, '\uD83C\uDF89'),
              el('div', { className: 'result-title' }, 'Generalprobe bestanden!'),
              el('div', { className: 'result-score' }, `${percent}%`),
              el('div', { className: 'result-detail' }, 'Du bist bereit f\u00FCr die echte Pr\u00FCfung!')
            ));
          }
        } else {
          container.appendChild(el('div', { className: 'result-screen' },
            el('div', { className: 'result-emoji' }, '\uD83D\uDCAA'),
            el('div', { className: 'result-title' }, isPractice ? 'Weiter \u00FCben!' : 'Noch nicht bestanden'),
            el('div', { className: 'result-score' }, `${percent}%`),
            el('div', { className: 'result-detail' }, `${tier.passRate}% ben\u00F6tigt \u2022 ${correctCount} von ${results.length} richtig`)
          ));
        }

        // Show incorrect answers
        const wrongResults = results.filter(r => !r.correct);
        if (wrongResults.length > 0) {
          container.appendChild(el('div', { className: 'section-title', style: 'margin-top:20px' }, 'Das musst du noch \u00FCben:'));
          const facts = el('div', { className: 'result-facts' });
          wrongResults.forEach(r => {
            facts.appendChild(el('div', { className: 'result-fact is-wrong' },
              el('span', { className: 'result-fact-icon' }, '\u274C'),
              el('span', null, getFactDisplayText(r.key)),
              el('span', { style: 'color:var(--danger);margin-left:auto' }, `(${r.given})`)
            ));
          });
          container.appendChild(facts);
        }

        // Buttons
        if (!isPractice && passed) {
          container.appendChild(el('button', {
            className: 'btn-start mb-12',
            onclick: () => App.navigate('license')
          }, '\uD83C\uDFC6 Zur\u00FCck zu den Scheinen'));
        } else {
          container.appendChild(el('button', {
            className: 'btn-start mb-12',
            onclick: () => {
              App._params = { tier };
              App.navigate(isPractice ? 'license-practice' : 'license-test', { tier });
            }
          }, '\uD83D\uDD04 Nochmal versuchen'));
        }

        container.appendChild(el('button', {
          className: 'btn-start',
          style: 'background:var(--text-light)',
          onclick: () => App.navigate('license')
        }, '\u2190 Zur\u00FCck'));
      }

      render();
    },

    // --- STATS ---
    stats(container) {
      // Mode selector
      this._renderModeSelector(container);

      container.appendChild(el('div', { className: 'section-title' }, '\u00DCbersicht'));

      // Stat cards
      const statGrid = el('div', { className: 'stat-grid' });
      statGrid.appendChild(el('div', { className: 'stat-card' },
        el('div', { className: 'stat-value' }, `${Store.data.stats.totalPracticed}`),
        el('div', { className: 'stat-label' }, 'Aufgaben ge\u00FCbt')
      ));
      statGrid.appendChild(el('div', { className: 'stat-card' },
        el('div', { className: 'stat-value' }, `${Store.data.stats.streakDays}`),
        el('div', { className: 'stat-label' }, 'Tage Streak')
      ));
      statGrid.appendChild(el('div', { className: 'stat-card' },
        el('div', { className: 'stat-value' }, `${Store.data.stats.sessionsCompleted || 0}`),
        el('div', { className: 'stat-label' }, 'Sessions')
      ));

      // Count mastered cards for current mode
      const allCards = Object.entries(Store.data.leitner);
      const mastered = allCards.filter(([key, c]) => {
        if (App.mode === 'multiply') return !key.startsWith('d:') && !key.startsWith('w:') && c.box >= 4;
        if (App.mode === 'divide') return key.startsWith('d:') && c.box >= 4;
        if (App.mode === 'weight') return key.startsWith('w:') && c.box >= 4;
        return false;
      }).length;
      statGrid.appendChild(el('div', { className: 'stat-card' },
        el('div', { className: 'stat-value' }, `${mastered}`),
        el('div', { className: 'stat-label' }, 'Gemeistert')
      ));
      container.appendChild(statGrid);

      // Licenses for current mode
      const licenseTitle = getModeLicenseTitle(App.mode);
      container.appendChild(el('div', { className: 'section-title', style: 'margin-top:8px' }, licenseTitle));
      const licenseInfo = el('div', { className: 'card' });
      const medals = { bronze: '\uD83E\uDD49', silver: '\uD83E\uDD48', gold: '\uD83E\uDD47' };
      const names = { bronze: 'Bronze', silver: 'Silber', gold: 'Gold' };
      const modeLicenses = Store.data.licenses[App.mode];
      ['bronze', 'silver', 'gold'].forEach(key => {
        const lic = modeLicenses[key];
        licenseInfo.appendChild(el('div', {
          style: 'display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0'
        },
          el('span', { style: 'font-size:1.5rem' }, medals[key]),
          el('span', { style: 'font-weight:700;flex:1' }, names[key]),
          el('span', {
            style: `font-weight:700;color:${lic.passed ? 'var(--success)' : 'var(--text-light)'}`
          }, lic.passed ? `\u2705 ${lic.score}%` : '\u2014')
        ));
      });
      container.appendChild(licenseInfo);

      // Progress per group
      const progressColors = ['#E17055', '#F39C12', '#FDCB6E', '#00CEC9', '#00B894',
                               '#6C5CE7', '#A29BFE', '#FD79A8', '#74B9FF', '#55EFC4'];

      if (App.mode === 'weight') {
        container.appendChild(el('div', { className: 'section-title', style: 'margin-top:20px' }, 'Fortschritt pro Kategorie'));
        [1, 2, 3].forEach((cat, idx) => {
          const progress = Store.getGroupProgress(cat, App.mode);
          container.appendChild(el('div', { className: 'table-progress' },
            el('div', { className: 'table-progress-header' },
              el('span', null, WEIGHT_CATEGORY_LABELS[cat]),
              el('span', null, `${progress}%`)
            ),
            el('div', { className: 'table-progress-bar' },
              el('div', {
                className: 'table-progress-fill',
                style: `width:${progress}%;background:${progressColors[idx]}`
              })
            )
          ));
        });
      } else {
        container.appendChild(el('div', { className: 'section-title', style: 'margin-top:20px' }, 'Fortschritt pro Reihe'));
        for (let i = 1; i <= 10; i++) {
          const progress = Store.getGroupProgress(i, App.mode);
          container.appendChild(el('div', { className: 'table-progress' },
            el('div', { className: 'table-progress-header' },
              el('span', null, `${i}er Reihe`),
              el('span', null, `${progress}%`)
            ),
            el('div', { className: 'table-progress-bar' },
              el('div', {
                className: 'table-progress-fill',
                style: `width:${progress}%;background:${progressColors[i-1]}`
              })
            )
          ));
        }
      }

      // Hardest facts for current mode
      const hardFacts = Store.getHardestFacts(5, App.mode);
      if (hardFacts.length > 0) {
        container.appendChild(el('div', { className: 'section-title', style: 'margin-top:20px' },
          'Schwierigste Aufgaben'));
        const hardDiv = el('div', { className: 'hard-facts' });
        hardFacts.forEach(fact => {
          const rate = Math.round(fact.errorRate * 100);
          let rateClass = 'rate-high';
          if (rate > 50) rateClass = 'rate-low';
          else if (rate > 25) rateClass = 'rate-mid';

          hardDiv.appendChild(el('div', { className: 'hard-fact-item' },
            el('span', { className: 'hard-fact-task' }, getQuestionText(fact.key)),
            el('span', null, `Box ${fact.box}`),
            el('span', { className: `hard-fact-rate ${rateClass}` }, `${rate}% Fehler`)
          ));
        });
        container.appendChild(hardDiv);
      }

      // Reset button
      container.appendChild(el('div', { style: 'margin-top:30px;text-align:center' },
        el('button', {
          style: 'background:none;border:none;color:var(--text-light);font-family:var(--font);font-size:0.85rem;cursor:pointer;text-decoration:underline',
          onclick: () => {
            if (confirm('Wirklich alle Daten zur\u00FCcksetzen? Das kann nicht r\u00FCckg\u00E4ngig gemacht werden!')) {
              localStorage.removeItem(STORE_KEY);
              Store._data = null;
              Store.load();
              App.navigate('dashboard');
            }
          }
        }, 'Alle Daten zur\u00FCcksetzen')
      ));
    }
  };

  // ========== INIT ==========
  window.App = App;
  document.addEventListener('DOMContentLoaded', () => App.init());

})();
