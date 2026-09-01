import { BRIEFINGS_DATA, DISPOSITIONS, LOCATIONS_DATA } from '../data/referenceData';
import { createId } from './localDatabase';

export function defaultCampaign() {
  return {
    campaignName: 'The Dominatus Campaign',
    currentPhase: 1,
    locationByPhase: { 1: null, 2: null, 3: null }, // Location card id, once drawn/chosen for that phase
    locationControlByPhase: {}, // { [phase]: allianceKey } — set once that phase resolves
    briefingNotesByPhase: { 1: '', 2: '', 3: '' },
    campaignNarrative: '',
    narrativeOverrides: {}, // { [cardId]: { [field]: editedText } }
    phaseHistory: [], // resolved phase records — see resolvePhase()
    players: [],
    battles: [],
  };
}

export function defaultPlayer() {
  return {
    id: createId(),
    name: '',
    armyName: '',
    faction: '',
    alliance: 'Liberators',
    record: { wins: 0, losses: 0, draws: 0 },
    recordByPhase: { 1: { wins: 0, losses: 0, draws: 0 }, 2: { wins: 0, losses: 0, draws: 0 }, 3: { wins: 0, losses: 0, draws: 0 } },
    agendaAchieved: [], // array of {id, phase, text}
    upgrades: [], // array of {id, type, name, effectText, phase, equipped}
    narrative: '',
  };
}

// ---------- Card data resolvers ----------

// Maps the DISPOSITIONS ids used in the UI to the exact label strings used in BRIEFINGS_DATA.
const DISPOSITION_LABEL_BY_ID = Object.fromEntries(DISPOSITIONS.map(d => [d.id, d.label]));

// Given a commander's Alliance, the current campaign phase, their own Force Disposition,
// and their opponent's, returns the resolved Agenda name — or null if no single opponent
// disposition is selected yet (lookup needs exactly one "their" disposition to match against).
export function resolveAgenda(allianceUsed, phase, yourDispositionId, opponentDispositionId) {
  if (!yourDispositionId || !opponentDispositionId) return null;
  const briefing = BRIEFINGS_DATA.find(b => b.alliance === allianceUsed && b.phase === phase);
  if (!briefing) return null;
  const yourLabel = DISPOSITION_LABEL_BY_ID[yourDispositionId];
  const oppLabel = DISPOSITION_LABEL_BY_ID[opponentDispositionId];
  const row = briefing.dispositionLookup.find(entry =>
    entry.yourDisposition && entry.yourDisposition.split(' or ').map(s => s.trim()).includes(yourLabel) &&
    entry.opponentDispositions.includes(oppLabel)
  );
  return row ? row.agenda : null;
}

export function getBriefing(alliance, phase) {
  return BRIEFINGS_DATA.find(b => b.alliance === alliance && b.phase === phase) || null;
}

export function getLocationsForPhase(phase) {
  return LOCATIONS_DATA.filter(l => l.phase === phase);
}

export function getLocationById(id) {
  return LOCATIONS_DATA.find(l => l.id === id) || null;
}

// Random Location draw for a phase, using the d6 ranges from the source data
// (each phase has 3 Locations, each covering a 1-2/3-4/5-6 d6 range).
export function rollLocationForPhase(phase) {
  const options = getLocationsForPhase(phase);
  if (options.length === 0) return null;
  const roll = Math.floor(Math.random() * 6) + 1;
  const match = options.find(l => {
    const [lo, hi] = (l.d6 || '').split('-').map(Number);
    return roll >= lo && roll <= hi;
  });
  return match || options[Math.floor(Math.random() * options.length)];
}

// Resolves narrative text for a given card id + field, preferring a campaign-level
// override if one exists, falling back to the original source data otherwise.
// `overrides` is campaign.narrativeOverrides: { [cardId]: { [field]: text } }
export function resolveNarrativeText(overrides, cardId, field, fallback) {
  if (overrides && overrides[cardId] && overrides[cardId][field] !== undefined) {
    return overrides[cardId][field];
  }
  return fallback;
}
