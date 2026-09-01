import { useState } from 'react';
import { ALLIANCES, PHASES } from '../data/referenceData';
import { getBriefing, getLocationById, getLocationsForPhase, resolveNarrativeText, rollLocationForPhase } from '../lib/campaign';
import { Button, EditableNarrativeText, SectionHeader, Select, StampLabel, TextArea } from '../components/ui';

function LocationCard({ campaign, updateCampaign }) {
  const phase = campaign.currentPhase;
  const locationId = campaign.locationByPhase[phase];
  const location = locationId ? getLocationById(locationId) : null;
  const options = getLocationsForPhase(phase);
  const controllingAlliance = campaign.locationControlByPhase[phase];

  const drawRandom = () => {
    const rolled = rollLocationForPhase(phase);
    if (rolled) updateCampaign({ locationByPhase: { ...campaign.locationByPhase, [phase]: rolled.id } });
  };

  const setOverride = (id) => {
    updateCampaign({ locationByPhase: { ...campaign.locationByPhase, [phase]: id || null } });
  };

  const saveFlavor = (text) => {
    updateCampaign({
      narrativeOverrides: { ...campaign.narrativeOverrides, [location.id]: { ...(campaign.narrativeOverrides[location.id] || {}), flavorText: text } },
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6e7d83' }}>
          Location in Effect (Phase {phase})
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button variant="ghost" onClick={drawRandom} style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}>🎲 Draw Random</Button>
          <Select
            value={locationId || ''}
            onChange={setOverride}
            options={[{ value: '', label: '— manual override —' }, ...options.map(o => ({ value: o.id, label: `${o.name} (${o.d6})` }))]}
            style={{ fontSize: '0.75rem' }}
          />
        </div>
      </div>

      {!location && (
        <div style={{ fontStyle: 'italic', color: '#6e7d83', padding: '0.8rem 0' }}>No Location drawn yet for this phase.</div>
      )}

      {location && (
        <div style={{ border: '1px solid #3a4448', borderRadius: '3px', padding: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: '1.1rem' }}>{location.name}</span>
            {controllingAlliance && <StampLabel>Controlled by {ALLIANCES[controllingAlliance]?.label || controllingAlliance}</StampLabel>}
          </div>

          <EditableNarrativeText
            cardId={location.id}
            field="flavorText"
            text={resolveNarrativeText(campaign.narrativeOverrides, location.id, 'flavorText', location.flavorText)}
            onSave={saveFlavor}
          />

          <div style={{ marginTop: '0.8rem' }}>
            <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83', marginBottom: '0.2rem' }}>
              War Zone Rules (active this phase, all battles)
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.5 }}>{location.warZoneRules}</p>
          </div>

          <div style={{ marginTop: '0.8rem' }}>
            <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83', marginBottom: '0.2rem' }}>
              Location Bonus (permanent reward for the Alliance that takes control)
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.5, color: '#c9a84c' }}>{location.locationBonus}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function BriefingDisplay({ campaign, updateCampaign }) {
  const phase = campaign.currentPhase;
  const [activeAlliance, setActiveAlliance] = useState('Liberators');
  const briefing = getBriefing(activeAlliance, phase);

  const saveIntroFlavor = (text) => {
    updateCampaign({
      narrativeOverrides: { ...campaign.narrativeOverrides, [briefing.id]: { ...(campaign.narrativeOverrides[briefing.id] || {}), flavorText: text } },
    });
  };

  const saveOutcomeText = (tierIdx, text) => {
    const key = `outcome_${tierIdx}`;
    updateCampaign({
      narrativeOverrides: { ...campaign.narrativeOverrides, [briefing.id]: { ...(campaign.narrativeOverrides[briefing.id] || {}), [key]: text } },
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem' }}>
        {Object.keys(ALLIANCES).map(key => (
          <button
            key={key}
            onClick={() => setActiveAlliance(key)}
            style={{
              flex: 1, padding: '0.4rem', borderRadius: '3px', cursor: 'pointer',
              border: activeAlliance === key ? `2px solid ${ALLIANCES[key].color}` : '1.5px solid #3a4448',
              background: activeAlliance === key ? ALLIANCES[key].color : 'transparent',
              color: activeAlliance === key ? '#0c0f10' : '#e4e9ea',
              fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.8rem', fontWeight: 600,
            }}
          >{ALLIANCES[key].label}</button>
        ))}
      </div>

      {!briefing && <div style={{ fontStyle: 'italic', color: '#6e7d83' }}>No Briefing data for this combination.</div>}

      {briefing && (
        <div>
          <EditableNarrativeText
            cardId={briefing.id}
            field="flavorText"
            text={resolveNarrativeText(campaign.narrativeOverrides, briefing.id, 'flavorText', briefing.flavorText)}
            onSave={saveIntroFlavor}
          />

          <div style={{ marginTop: '0.9rem', overflowX: 'auto' }}>
            <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83', marginBottom: '0.4rem' }}>
              Force Disposition → Agenda Lookup
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #3a4448' }}>
                  <th style={{ textAlign: 'left', padding: '0.3rem', color: '#6e7d83' }}>Your Disposition</th>
                  <th style={{ textAlign: 'left', padding: '0.3rem', color: '#6e7d83' }}>Opponent's Disposition</th>
                  <th style={{ textAlign: 'left', padding: '0.3rem', color: '#6e7d83' }}>Your Agenda</th>
                </tr>
              </thead>
              <tbody>
                {briefing.dispositionLookup.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #232a2d' }}>
                    <td style={{ padding: '0.3rem', color: '#aab8be' }}>{row.yourDisposition}</td>
                    <td style={{ padding: '0.3rem', color: '#aab8be' }}>{row.opponentDispositions.join(', ')}</td>
                    <td style={{ padding: '0.3rem', fontWeight: 600 }}>{row.agenda}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(() => {
            const isResolved = campaign.phaseHistory.some(h => h.phase === phase && h.alliance === activeAlliance);
            if (!isResolved) {
              return (
                <div style={{ marginTop: '0.9rem', padding: '0.8rem', border: '1px dashed #3a4448', borderRadius: '3px', color: '#6e7d83', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  Outcome text is sealed until Phase {phase} concludes for this Alliance — it reveals which Narrative Point tier was earned, which would spoil the phase in progress.
                </div>
              );
            }
            return (
              <div style={{ marginTop: '0.9rem' }}>
                <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83', marginBottom: '0.3rem' }}>
                  Outcome — Narrative Points: {briefing.locationControlPoints} for Location control + {briefing.ascendancyPoints} for Ascendancy (max {briefing.maxNarrativePoints})
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {briefing.outcomes.map((o, i) => (
                    <div key={i} style={{ border: '1px solid #3a4448', borderRadius: '3px', padding: '0.6rem' }}>
                      <StampLabel>{o.narrativePoints} Narrative Point{o.narrativePoints !== 1 ? 's' : ''}</StampLabel>
                      <div style={{ marginTop: '0.4rem' }}>
                        <EditableNarrativeText
                          cardId={briefing.id}
                          field={`outcome_${i}`}
                          text={resolveNarrativeText(campaign.narrativeOverrides, briefing.id, `outcome_${i}`, o.text)}
                          onSave={(text) => saveOutcomeText(i, text)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function OverviewTab({ campaign, updateCampaign, players }) {
  const phase = campaign.currentPhase;
  const gamesForPhase = (phaseId, defaultCount) => campaign.battlesPerPhase?.[phaseId] ?? defaultCount;

  const updateGamesForPhase = (phaseId, value) => {
    const games = Math.min(99, Math.max(1, Number(value) || 1));
    updateCampaign({ battlesPerPhase: { ...campaign.battlesPerPhase, [phaseId]: games } });
  };

  const allianceTally = Object.keys(ALLIANCES).reduce((acc, key) => {
    acc[key] = players.filter(p => p.alliance === key).length;
    return acc;
  }, {});

  return (
    <div style={{ display: 'grid', gap: '1.6rem' }}>
      <div style={{ background: '#15191b', border: '1.5px solid #3a4448', borderRadius: '4px', padding: '1.2rem 1.4rem' }}>
        <SectionHeader sub="Set the current campaign phase and the location card in effect.">Campaign Phase</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
          {PHASES.map(p => (
            <div
              key={p.id}
              style={{
                textAlign: 'left',
                padding: '0.8rem 1rem',
                border: phase === p.id ? '2.5px solid #e4e9ea' : '1.5px solid #3a4448',
                background: phase === p.id ? '#e4e9ea' : 'transparent',
                color: phase === p.id ? '#0c0f10' : '#e4e9ea',
                borderRadius: '3px',
              }}
            >
              <button
                onClick={() => updateCampaign({ currentPhase: p.id })}
                style={{ width: '100%', padding: 0, border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', opacity: 0.8 }}>PHASE {p.id}</div>
                <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, textTransform: 'uppercase', fontSize: '0.95rem' }}>{p.name}</div>
              </button>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.65rem', fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.8rem', fontWeight: 600 }}>
                Games per player
                <input
                  aria-label={`Games in ${p.name}`}
                  type="number"
                  min="1"
                  max="99"
                  inputMode="numeric"
                  value={gamesForPhase(p.id, p.battles)}
                  onChange={(event) => updateGamesForPhase(p.id, event.target.value)}
                  style={{ width: '4rem', minHeight: '2.25rem', marginLeft: 'auto', padding: '0.2rem 0.4rem', border: '1.5px solid currentColor', borderRadius: '3px', background: 'transparent', color: 'inherit', font: 'inherit', textAlign: 'center', boxSizing: 'border-box' }}
                />
              </label>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6e7d83', marginBottom: '0.3rem' }}>
            Alliance Standings (Commanders Mustered)
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {Object.entries(ALLIANCES).map(([key, a]) => (
              <div key={key} style={{ flex: 1, textAlign: 'center', padding: '0.4rem', border: `1.5px solid ${a.color}`, borderRadius: '3px', minWidth: 0 }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '1.3rem', color: a.color }}>{allianceTally[key]}</div>
                <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83' }}>{a.label}</div>
              </div>
            ))}
          </div>
        </div>

        <LocationCard campaign={campaign} updateCampaign={updateCampaign} />
      </div>

      <div style={{ background: '#15191b', border: '1.5px solid #3a4448', borderRadius: '4px', padding: '1.2rem 1.4rem' }}>
        <SectionHeader sub="Each Alliance's Briefing card — Force Disposition lookup and phase outcome tiers.">Phase {phase} Briefings</SectionHeader>
        <BriefingDisplay campaign={campaign} updateCampaign={updateCampaign} />
      </div>

      <div style={{ background: '#15191b', border: '1.5px solid #3a4448', borderRadius: '4px', padding: '1.2rem 1.4rem' }}>
        <SectionHeader sub="Free-text briefing for the current phase — read aloud war zone rules, set the scene.">Phase {phase} Briefing Notes</SectionHeader>
        <TextArea
          value={campaign.briefingNotesByPhase[phase] || ''}
          onChange={(v) => updateCampaign({ briefingNotesByPhase: { ...campaign.briefingNotesByPhase, [phase]: v } })}
          placeholder="Narrative briefing for this phase — what's at stake, what the Alliances have learned, what's changed since the last phase…"
          rows={6}
        />
      </div>

      <div style={{ background: '#15191b', border: '1.5px solid #3a4448', borderRadius: '4px', padding: '1.2rem 1.4rem' }}>
        <SectionHeader sub="The ongoing story of the campaign as a whole — the Warmaster's chronicle.">Campaign Narrative</SectionHeader>

        <TextArea
          value={campaign.campaignNarrative}
          onChange={(v) => updateCampaign({ campaignNarrative: v })}
          placeholder="The chronicle of the war for Armageddon — major turning points, alliances forged and broken, legends made…"
          rows={10}
        />
      </div>
    </div>
  );
}
