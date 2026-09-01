import { useState } from 'react';
import { AGENDAS_DATA, ALLIANCES, DISPOSITIONS, KNOWN_PRIMARY_MISSIONS, PHASES, UPGRADE_TYPES } from '../data/referenceData';
import { resolveAgenda } from '../lib/campaign';
import { Button, Combobox, DispositionPicker, EmptyState, SectionHeader, Select, StampLabel, TextArea, TextInput } from '../components/ui';
import { createId } from '../lib/localDatabase';

export default function BattlesTab({ campaign, recordBattle, updateBattle, removeBattle }) {
  const { players, battles, currentPhase } = campaign;
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <SectionHeader sub="Record every clash for the chronicle and the standings.">Battle Log</SectionHeader>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : '+ Record Battle'}</Button>
      </div>

      {showForm && (
        <NewBattleForm
          players={players}
          currentPhase={currentPhase}
          onSave={(battle) => {
            recordBattle(battle);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {battles.length === 0 && !showForm && (
        <EmptyState text="No battles recorded yet. The first clash awaits its chronicler." />
      )}

      <div style={{ display: 'grid', gap: '0.8rem', marginTop: showForm ? '1.4rem' : 0 }}>
        {[...battles].reverse().map(b => (
          <BattleCard
            key={b.id}
            battle={b}
            players={players}
            onUpdate={(patch) => updateBattle(b.id, patch)}
            onRemove={() => removeBattle(b.id)}
          />
        ))}
      </div>
    </div>
  );
}

function CommanderSlot({ index, slot, allSlots, players, usedPlayerIds, onChange, onRemove, removable, phase }) {
  const player = players.find(p => p.id === slot.playerId);
  const availableOptions = players.filter(p => p.id === slot.playerId || !usedPlayerIds.includes(p.id));
  const allianceUsed = slot.allianceUsed || (player ? player.alliance : 'Liberators');

  // Auto-resolution only makes unambiguous sense for exactly 2 commanders (the rules system
  // is built around 1v1 Force Disposition comparison). With 3+ commanders, "opponent" is
  // ambiguous, so the Agenda field falls back to manual entry with an explanatory note.
  const isTwoWay = allSlots.length === 2;
  const opponentSlot = isTwoWay ? allSlots.find((_, i) => i !== index) : null;
  const autoResolvedAgenda = isTwoWay
    ? resolveAgenda(allianceUsed, phase, slot.disposition, opponentSlot ? opponentSlot.disposition : null)
    : null;

  const effectiveAgendaName = slot.agendaOverride || autoResolvedAgenda || '';

  // Outcome is computed, not chosen — highest VP among all slots with a VP entered wins;
  // equal top scores are a draw. A slot with no VP entered yet shows as a draw by default.
  const allVps = allSlots.map(s => Number(s.vp) || 0);
  const myVp = Number(slot.vp) || 0;
  const maxVp = Math.max(...allVps);
  const topCount = allVps.filter(v => v === maxVp).length;
  const computedOutcome = (myVp === maxVp && topCount === 1) ? 'win' : (myVp === maxVp ? 'draw' : 'loss');

  return (
    <div style={{ border: '1px solid #3a4448', borderRadius: '3px', padding: '0.9rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <StampLabel>Commander {index + 1}</StampLabel>
        {removable && (
          <button onClick={onRemove} style={{ background: 'transparent', border: 'none', color: '#6e7d83', cursor: 'pointer', fontSize: '0.9rem' }}>✕ remove slot</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '0.7rem' }}>
        <div>
          <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83', marginBottom: '0.2rem' }}>Player</div>
          <Select
            value={slot.playerId || ''}
            onChange={(v) => {
              const p = players.find(pl => pl.id === v);
              onChange({ ...slot, playerId: v, allianceUsed: p ? p.alliance : slot.allianceUsed });
            }}
            options={[{ value: '', label: '— select —' }, ...availableOptions.map(p => ({ value: p.id, label: p.armyName || p.name || 'Unnamed' }))]}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83', marginBottom: '0.2rem' }}>
            Alliance {player && slot.allianceUsed !== player.alliance && <span style={{ color: '#c9963f' }}>(overridden)</span>}
          </div>
          <Select
            value={slot.allianceUsed || (player ? player.alliance : 'Liberators')}
            onChange={(v) => onChange({ ...slot, allianceUsed: v })}
            options={Object.entries(ALLIANCES).map(([k, a]) => ({ value: k, label: a.label }))}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83', marginBottom: '0.2rem' }}>VP Scored</div>
          <TextInput value={slot.vp} onChange={(v) => onChange({ ...slot, vp: v })} placeholder="0" style={{ width: '100%' }} />
        </div>
        <div>
          <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83', marginBottom: '0.2rem' }}>
            Outcome <span style={{ color: '#6e7d83' }}>(from VP)</span>
          </div>
          <div style={{
            padding: '0.5rem 0.6rem', border: '1.5px solid #3a4448', borderRadius: '3px', background: '#0c0f10',
            color: computedOutcome === 'win' ? '#5fae6a' : computedOutcome === 'loss' ? '#c0524f' : '#aab8be',
            fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, textTransform: 'capitalize',
          }}>
            {computedOutcome === 'win' ? 'Victory' : computedOutcome === 'loss' ? 'Defeat' : 'Draw'}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '0.6rem' }}>
        <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83', marginBottom: '0.3rem' }}>
          Force Disposition
        </div>
        {!slot.dispositionRevealed ? (
          <button
            onClick={() => onChange({ ...slot, dispositionRevealed: true })}
            style={{
              width: '100%', padding: '0.6rem', borderRadius: '3px', cursor: 'pointer',
              border: '1.5px dashed #3a4448', background: 'transparent', color: '#6e7d83',
              fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.85rem',
            }}
          >🔒 Hidden — click to reveal and choose this commander's Force Disposition</button>
        ) : (
          <DispositionPicker value={slot.disposition} onChange={(v) => onChange({ ...slot, disposition: v })} label="" />
        )}
      </div>

      <div style={{ marginBottom: '0.7rem' }}>
        <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83', marginBottom: '0.3rem' }}>
          Scoring This Battle
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          {[
            ['agenda', 'Agenda'],
            ['primary', 'Primary Mission'],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => onChange({ ...slot, scoringMethod: val })}
              style={{
                flex: 1,
                padding: '0.4rem 0.6rem',
                borderRadius: '3px',
                border: slot.scoringMethod === val ? '2px solid #e4e9ea' : '1.5px solid #3a4448',
                background: slot.scoringMethod === val ? '#e4e9ea' : 'transparent',
                color: slot.scoringMethod === val ? '#15191b' : '#e4e9ea',
                cursor: 'pointer',
                fontFamily: "'Chakra Petch', sans-serif",
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >{label}</button>
          ))}
        </div>
        {slot.scoringMethod === 'primary' ? (
          <Combobox
            value={slot.primaryMissionName}
            onChange={(v) => onChange({ ...slot, primaryMissionName: v })}
            suggestions={KNOWN_PRIMARY_MISSIONS}
            placeholder="e.g. Linchpin, Hidden Supplies… (declined Agenda this battle)"
            style={{ width: '100%' }}
          />
        ) : (
          <div>
            {isTwoWay ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: slot.agendaOverride !== null && slot.agendaOverride !== undefined ? '0.4rem' : 0 }}>
                <div style={{
                  flex: 1, padding: '0.5rem 0.6rem', border: '1.5px solid #3a4448', borderRadius: '3px',
                  background: '#0c0f10', color: autoResolvedAgenda ? '#e4e9ea' : '#6e7d83', fontFamily: "'Chakra Petch', sans-serif", fontSize: '1rem',
                }}>
                  {effectiveAgendaName || 'Select both dispositions to auto-resolve…'}
                  {autoResolvedAgenda && !slot.agendaOverride && <span style={{ color: '#6e7d83', fontSize: '0.7rem' }}> (auto)</span>}
                </div>
                <button
                  onClick={() => onChange({ ...slot, agendaOverride: (slot.agendaOverride !== null && slot.agendaOverride !== undefined) ? null : (autoResolvedAgenda || '') })}
                  title="Manually override the resolved Agenda"
                  style={{ background: 'transparent', border: '1px solid #3a4448', borderRadius: '3px', color: '#6e7d83', cursor: 'pointer', padding: '0.4rem 0.6rem', fontSize: '0.7rem', fontFamily: "'Chakra Petch', sans-serif" }}
                >{(slot.agendaOverride !== null && slot.agendaOverride !== undefined) ? 'Cancel override' : 'Override'}</button>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#6e7d83', fontStyle: 'italic', marginBottom: '0.4rem' }}>
                Auto-resolution requires exactly 2 commanders (Force Disposition lookup is 1v1). Enter the Agenda manually for multi-way battles.
              </div>
            )}
            {(!isTwoWay || (slot.agendaOverride !== null && slot.agendaOverride !== undefined)) && (
              <Combobox
                value={isTwoWay ? slot.agendaOverride : slot.agendaName}
                onChange={(v) => onChange(isTwoWay ? { ...slot, agendaOverride: v } : { ...slot, agendaName: v })}
                suggestions={AGENDAS_DATA.filter(a => a.alliance === allianceUsed && a.phase === phase).map(a => a.name)}
                placeholder="Agenda name…"
                style={{ width: '100%' }}
              />
            )}
          </div>
        )}
      </div>

      {slot.scoringMethod === 'agenda' && effectiveAgendaName && (
        <div style={{ marginBottom: '0.7rem', padding: '0.6rem', border: '1px solid #3a4448', borderRadius: '3px', background: 'rgba(95,174,106,0.05)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={!!slot.agendaAchieved}
              onChange={(e) => onChange({ ...slot, agendaAchieved: e.target.checked })}
            />
            Agenda Achieved this battle? <span style={{ color: '#6e7d83', fontSize: '0.75rem' }}>(check the conditions on the Agenda card — grants 1 Agenda Achieved card, max 3)</span>
          </label>
        </div>
      )}

      {player && player.upgrades.length > 0 && (
        <div style={{ marginBottom: '0.7rem' }}>
          <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83', marginBottom: '0.3rem' }}>
            Equip Upgrades This Battle — {(slot.equippedUpgrades || []).length}/3
          </div>
          <div style={{ display: 'grid', gap: '0.3rem' }}>
            {player.upgrades.map(u => {
              const equipped = (slot.equippedUpgrades || []).includes(u.id);
              const atCap = (slot.equippedUpgrades || []).length >= 3;
              const typeInfo = UPGRADE_TYPES.find(t => t.id === u.type);
              return (
                <label key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.8rem',
                  cursor: (!equipped && atCap) ? 'not-allowed' : 'pointer', opacity: (!equipped && atCap) ? 0.4 : 1,
                }}>
                  <input
                    type="checkbox"
                    checked={equipped}
                    disabled={!equipped && atCap}
                    onChange={(e) => {
                      const current = slot.equippedUpgrades || [];
                      const next = e.target.checked ? [...current, u.id] : current.filter(id => id !== u.id);
                      onChange({ ...slot, equippedUpgrades: next });
                    }}
                  />
                  <StampLabel>{typeInfo.label}</StampLabel>
                  {u.name || <em style={{ color: '#6e7d83' }}>(card not yet named)</em>}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83', marginBottom: '0.25rem' }}>
          {player ? `${player.name || player.armyName}'s Perspective` : "This Commander's Perspective"}
        </div>
        <TextArea value={slot.report} onChange={(v) => onChange({ ...slot, report: v })} placeholder="What happened, from this commander's point of view…" rows={6} />
      </div>
    </div>
  );
}

function NewBattleForm({ players, currentPhase, onSave, onCancel }) {
  const makeSlot = () => ({
    playerId: '', allianceUsed: null, disposition: null, dispositionRevealed: false, vp: '', outcome: 'draw', report: '',
    scoringMethod: 'agenda', agendaName: '', agendaOverride: null, agendaAchieved: false, primaryMissionName: '',
    equippedUpgrades: [],
  });
  const [slots, setSlots] = useState([makeSlot(), makeSlot()]);
  const [phase, setPhase] = useState(currentPhase);

  const usedPlayerIds = slots.map(s => s.playerId).filter(Boolean);
  const canSave = slots.filter(s => s.playerId).length >= 1;

  const updateSlot = (i, next) => setSlots(prev => prev.map((s, idx) => idx === i ? next : s));
  const addSlot = () => { if (slots.length < 4) setSlots(prev => [...prev, makeSlot()]); };
  const removeSlot = (i) => setSlots(prev => prev.filter((_, idx) => idx !== i));

  const save = () => {
    const activeSlots = slots.filter(s => s.playerId);
    const isTwoWay = activeSlots.length === 2;
    const allVps = activeSlots.map(s => Number(s.vp) || 0);
    const maxVp = Math.max(...allVps);
    const topCount = allVps.filter(v => v === maxVp).length;

    const commanders = activeSlots.map((s, idx, arr) => {
      const player = players.find(p => p.id === s.playerId);
      const allianceUsed = s.allianceUsed || (player ? player.alliance : 'Liberators');
      let resolvedAgendaName = s.agendaName;
      if (s.scoringMethod === 'agenda' && isTwoWay) {
        const opponent = arr.find((_, i) => i !== idx);
        const auto = resolveAgenda(allianceUsed, phase, s.disposition, opponent ? opponent.disposition : null);
        resolvedAgendaName = s.agendaOverride || auto || '';
      }
      const myVp = Number(s.vp) || 0;
      const outcome = (myVp === maxVp && topCount === 1) ? 'win' : (myVp === maxVp ? 'draw' : 'loss');
      return {
        playerId: s.playerId,
        allianceUsed,
        disposition: s.disposition,
        vp: myVp,
        outcome,
        report: s.report,
        scoringMethod: s.scoringMethod,
        agendaName: resolvedAgendaName,
        agendaAchieved: s.scoringMethod === 'agenda' ? !!s.agendaAchieved : false,
        primaryMissionName: s.primaryMissionName,
        equippedUpgrades: s.equippedUpgrades || [],
      };
    });
    onSave({
      id: createId(),
      phase,
      date: new Date().toISOString().slice(0, 10),
      commanders,
    });
  };

  return (
    <div style={{ background: '#15191b', border: '1.5px solid #e4e9ea', borderRadius: '4px', padding: '1.2rem 1.4rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6e7d83' }}>Phase</div>
        <Select value={phase} onChange={(v) => setPhase(Number(v))} options={PHASES.map(p => ({ value: p.id, label: `${p.id} — ${p.name}` }))} />
      </div>

      {players.length === 0 && <div style={{ fontStyle: 'italic', color: '#6e7d83', marginBottom: '1rem' }}>Add commanders in the Roster tab first.</div>}

      <div style={{ display: 'grid', gap: '0.8rem', marginBottom: '0.6rem' }}>
        {slots.map((slot, i) => (
          <CommanderSlot
            key={i}
            index={i}
            slot={slot}
            allSlots={slots}
            phase={phase}
            players={players}
            usedPlayerIds={usedPlayerIds}
            onChange={(next) => updateSlot(i, next)}
            onRemove={() => removeSlot(i)}
            removable={slots.length > 2}
          />
        ))}
      </div>

      {slots.length < 4 && (
        <div style={{ marginBottom: '1.1rem' }}>
          <button
            onClick={addSlot}
            style={{
              background: 'transparent', border: '1px dashed #3a4448', color: '#6e7d83',
              borderRadius: '3px', padding: '0.4rem 0.8rem', cursor: 'pointer',
              fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}
            title="For 2v2, 1v1v1, or other multi-commander battles"
          >+ add commander (multi-way battle)</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={save} style={canSave ? {} : { opacity: 0.4, pointerEvents: 'none' }}>Seal Battle Record</Button>
      </div>
    </div>
  );
}

function BattleCard({ battle, players, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  const updateCommanderReport = (playerId, text) => {
    onUpdate({ commanders: battle.commanders.map(c => c.playerId === playerId ? { ...c, report: text } : c) });
  };

  return (
    <div style={{ background: '#15191b', border: '1.5px solid #3a4448', borderRadius: '4px' }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: '0.9rem 1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
          <StampLabel>Phase {battle.phase}</StampLabel>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', color: '#6e7d83' }}>{battle.date}</span>
          <span style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600 }}>
            {battle.commanders.map(c => {
              const pl = players.find(p => p.id === c.playerId);
              return pl ? (pl.armyName || pl.name) : '???';
            }).join(' vs ')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', flexWrap: 'wrap' }}>
          {battle.commanders.map(c => {
            const pl = players.find(p => p.id === c.playerId);
            return (
              <span key={c.playerId} style={{ color: c.outcome === 'win' ? '#5fae6a' : c.outcome === 'loss' ? '#c0524f' : '#6e7d83' }}>
                {pl ? (pl.armyName || pl.name) : '???'}: {c.vp}VP
              </span>
            );
          })}
          <span>{expanded ? '▾' : '▸'}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 1.1rem 1.1rem', borderTop: '1px solid #3a4448' }}>
          <div style={{ display: 'grid', gap: '0.8rem', marginTop: '0.9rem' }}>
            {battle.commanders.map(c => {
              const pl = players.find(p => p.id === c.playerId);
              const alliance = ALLIANCES[c.allianceUsed] || ALLIANCES.Liberators;
              const dispInfo = DISPOSITIONS.find(d => d.id === c.disposition);
              const scoringLabel = c.scoringMethod === 'primary' ? 'Primary Mission' : 'Agenda';
              const scoringValue = c.scoringMethod === 'primary' ? c.primaryMissionName : c.agendaName;
              return (
                <div key={c.playerId} style={{ border: `1px solid ${alliance.color}`, borderLeft: `4px solid ${alliance.color}`, borderRadius: '3px', padding: '0.8rem' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600 }}>{pl ? (pl.armyName || pl.name) : 'Unknown Commander'}</span>
                    <StampLabel>{alliance.label}</StampLabel>
                    {dispInfo && <StampLabel>{dispInfo.label}</StampLabel>}
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', color: '#6e7d83' }}>{c.vp}VP · {c.outcome}</span>
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: '#6e7d83', marginBottom: '0.6rem' }}>
                    {scoringLabel}: {scoringValue || <em>none recorded</em>}
                    {c.scoringMethod === 'agenda' && (
                      <span style={{ marginLeft: '0.6rem', color: c.agendaAchieved ? '#5fae6a' : '#6e7d83' }}>
                        {c.agendaAchieved ? '✓ Achieved' : '— Not achieved'}
                      </span>
                    )}
                  </div>
                  {c.equippedUpgrades && c.equippedUpgrades.length > 0 && pl && (
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: '#6e7d83', marginBottom: '0.6rem' }}>
                      Equipped: {c.equippedUpgrades.map(uid => {
                        const u = pl.upgrades.find(x => x.id === uid);
                        return u ? (u.name || '(unnamed card)') : null;
                      }).filter(Boolean).join(', ')}
                    </div>
                  )}
                  <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', color: '#6e7d83', marginBottom: '0.3rem' }}>
                    {pl ? `${pl.name || pl.armyName}'s Perspective` : "This Commander's Perspective"}
                  </div>
                  <TextArea value={c.report} onChange={(v) => updateCommanderReport(c.playerId, v)} rows={6} />
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '0.8rem', textAlign: 'right' }}>
            <Button variant="danger" onClick={onRemove}>Delete Record</Button>
          </div>
        </div>
      )}
    </div>
  );
}

