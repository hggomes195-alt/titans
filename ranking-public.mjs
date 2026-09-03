// Public display only. Never delete the game server's collected-item files.
const collectionKey = value => /(?:itenscollected|itemscollected|itenscoletados|collecteditems)/i.test(String(value).replace(/[\s_-]/g, ''));
const collectionRecord = value => /(?:^|[-_])(?:itenscollected|itemscollected|itenscoletados)(?:\.txt)?$/i.test(String(value || '').trim());

function withoutCollectionFields(value) {
  if (Array.isArray(value)) return value.map(withoutCollectionFields);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !collectionKey(key))
    .map(([key, item]) => [key, withoutCollectionFields(item)]));
}

export function publicRankingEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.filter(entry => entry && typeof entry === 'object' && !Array.isArray(entry)
    && !['player', 'name', 'character', 'filename', 'file'].some(key => collectionRecord(entry[key])))
    .map(withoutCollectionFields);
}

export function sanitizeRankings(data) {
  const safe = withoutCollectionFields(data && typeof data === 'object' ? data : {});
  return { ...safe, pvp: publicRankingEntries(safe.pvp), guilds: publicRankingEntries(safe.guilds) };
}
