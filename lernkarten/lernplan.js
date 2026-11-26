// Use calendar days so daylight saving time cannot shift a review or test date.
const Lernplan = (() => {
  const dayLength = 86400000;
  const initial = {chapter: 5, date: '2026-11-27'};
  function dayNumber(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    const stamp = Date.parse(value+'T12:00:00Z');
    if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0,10) !== value) return NaN;
    return Math.floor(stamp / dayLength);
  }
  function valid(anchor) {
    return anchor && Number.isInteger(anchor.chapter) && anchor.chapter >= 1 &&
      anchor.chapter <= wortKapitel.length && Number.isFinite(dayNumber(anchor.date));
  }
  function windowFor(anchor, today) {
    const cycle = Math.ceil((dayNumber(today) - dayNumber(anchor.date)) / 14);
    const chapter = Math.max(1, Math.min(wortKapitel.length, anchor.chapter + cycle));
    return {chapter, ended:anchor.chapter + cycle > wortKapitel.length};
  }
  function exam(anchor, chapter, today) {
    const day = dayNumber(anchor.date) + (chapter - anchor.chapter) * 14;
    const date = new Date((day + 0.5) * dayLength);
    return {daysLeft:day-dayNumber(today), label:date.toLocaleDateString('de-AT',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'})};
  }
  return {initial, valid, dayNumber, windowFor, exam};
})();
