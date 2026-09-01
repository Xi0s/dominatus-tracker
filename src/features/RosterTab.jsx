import { useState } from 'react';
import { ALLIANCES, BATTLE_HONOURS_DATA, BATTLE_SKILLS_DATA, PHASES, RELICS_DATA, UPGRADE_TYPES } from '../data/referenceData';
import { Button, Combobox, EmptyState, SectionHeader, Select, StampLabel, TextArea, TextInput } from '../components/ui';
import { createId } from '../lib/localDatabase';

export default function RosterTab({ players, addPlayer, updatePlayer, removePlayer, currentPhase }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <SectionHeader sub="Commanders mustered for this campaign.">Roster</SectionHeader>
        <Button onClick={addPlayer}>+ Muster Commander</Button>
      </div>

      {players.length === 0 && (
        <EmptyState text="No commanders mustered yet. Add the first to begin the campaign." />
      )}

      <div style={{ display: 'grid', gap: '0.8rem' }}>
        {players.map(p => (
          <PlayerCard
            key={p.id}
            player={p}
            expanded={expandedId === p.id}
            onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
            onUpdate={(patch) => updatePlayer(p.id, patch)}
            onRemove={() => removePlayer(p.id)}
            currentPhase={currentPhase}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerCard({ player, expanded, onToggle, onUpdate, onRemove, currentPhase }) {
  const alliance = ALLIANCES[player.alliance];
  const totalRecord = player.record;

  const addAgenda = () => {
    if (player.agendaAchieved.length >= 3) return;
    onUpdate({ agendaAchieved: [...player.agendaAchieved, { id: createId(), phase: currentPhase, text: '' }] });
  };
  const updateAgenda = (id, text) => {
    onUpdate({ agendaAchieved: player.agendaAchieved.map(a => a.id === id ? { ...a, text } : a) });
  };
  const removeAgenda = (id) => {
    onUpdate({ agendaAchieved: player.agendaAchieved.filter(a => a.id !== id) });
  };

  // Returns the correct card deck to draw from for a given upgrade type, scoped to
  // phase (Battle Honours are phase-specific) or alliance (Relics are alliance-specific).
  const deckFor = (type) => {
    if (type === 'battle_skill') return BATTLE_SKILLS_DATA;
    if (type === 'battle_honour') return BATTLE_HONOURS_DATA.filter(h => h.group === `Phase ${currentPhase}`);
    return RELICS_DATA.filter(r => r.alliance === player.alliance);
  };

  const addUpgrade = (type) => {
    onUpdate({ upgrades: [...player.upgrades, { id: createId(), type, name: '', effectText: '', phase: currentPhase, equipped: false }] });
  };

  // Random draw — picks a card the player doesn't already hold (no duplicates per the
  // rules), then auto-fills its name and effect text. If every card in the relevant deck
  // is already held, falls back to a blank entry rather than silently failing.
  const drawRandomUpgrade = (type) => {
    const deck = deckFor(type);
    const heldNames = new Set(player.upgrades.filter(u => u.type === type).map(u => u.name));
    const available = deck.filter(c => !heldNames.has(c.name));
    const pool = available.length > 0 ? available : deck;
    if (pool.length === 0) {
      addUpgrade(type);
      return;
    }
    const drawn = pool[Math.floor(Math.random() * pool.length)];
    onUpdate({
      upgrades: [...player.upgrades, {
        id: createId(), type, name: drawn.name, effectText: drawn.effect,
        phase: currentPhase, equipped: false,
      }],
    });
  };

  const updateUpgrade = (id, patch) => {
    onUpdate({ upgrades: player.upgrades.map(u => u.id === id ? { ...u, ...patch } : u) });
  };
  const removeUpgrade = (id) => {
    onUpdate({ upgrades: player.upgrades.filter(u => u.id !== id) });
  };


  return (
    <div style={{
      background: '#15191b',
      border: `1.5px solid ${alliance.color}`,
      borderLeft: `6px solid ${alliance.color}`,
      borderRadius: '4px',
      overflow: 'hidden',
    }}>
      <div
        onClick={onToggle}
        style={{ padding: '1rem 1.2rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <StampLabel>{alliance.label}</StampLabel>
          <div>
            <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, fontSize: '1.05rem' }}>
              {player.armyName || 'Unnamed Army'}
            </div>
            <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontStyle: 'italic', fontSize: '0.85rem', color: '#6e7d83' }}>
              {player.name || 'Unnamed Commander'} · {player.faction || 'Faction unset'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem' }}>
          <span>W{totalRecord.wins} / L{totalRecord.losses} / D{totalRecord.draws}</span>
          <span style={{ color: '#6e7d83' }}>{player.agendaAchieved.length}/3 Agendas</span>
          <span style={{ color: '#6e7d83' }}>{player.upgrades.length} upgrades earned</span>
          <span style={{ fontSize: '1.1rem' }}>{expanded ? '▾' : '▸'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 1.2rem 1.2rem', borderTop: '1px solid #3a4448' }}>
          {/* Basic info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.7rem', margin: '1rem 0' }}>
            <LabeledInput label="Commander Name" value={player.name} onChange={(v) => onUpdate({ name: v })} />
            <LabeledInput label="Army Name" value={player.armyName} onChange={(v) => onUpdate({ armyName: v })} />
            <LabeledInput label="Faction" value={player.faction} onChange={(v) => onUpdate({ faction: v })} />
            <div>
              <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6e7d83', marginBottom: '0.25rem' }}>Alliance</div>
              <Select
                value={player.alliance}
                onChange={(v) => onUpdate({ alliance: v })}
                options={Object.entries(ALLIANCES).map(([k, a]) => ({ value: k, label: a.label }))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Battle record by phase */}
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6e7d83', marginBottom: '0.4rem' }}>
              Battle Record by Phase
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {PHASES.map(ph => {
                const r = player.recordByPhase[ph.id];
                return (
                  <div key={ph.id} style={{ border: '1px solid #3a4448', borderRadius: '3px', padding: '0.4rem 0.7rem', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem' }}>
                    <div style={{ color: '#6e7d83', fontSize: '0.65rem' }}>PHASE {ph.id}</div>
                    W{r.wins} / L{r.losses} / D{r.draws}
                  </div>
                );
              })}
              <div style={{ border: '1px solid #e4e9ea', borderRadius: '3px', padding: '0.4rem 0.7rem', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', fontWeight: 700 }}>
                <div style={{ color: '#6e7d83', fontSize: '0.65rem' }}>TOTAL</div>
                W{totalRecord.wins} / L{totalRecord.losses} / D{totalRecord.draws}
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6e7d83', marginTop: '0.3rem', fontStyle: 'italic' }}>
              Record updates automatically from the Battle Log.
            </div>
          </div>

          {/* Agenda Achieved */}
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6e7d83' }}>
                Agenda Achieved Cards ({player.agendaAchieved.length}/3)
              </div>
              <Button variant="ghost" onClick={addAgenda} style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}>+ Add</Button>
            </div>
            {player.agendaAchieved.length === 0 && <div style={{ fontSize: '0.85rem', color: '#6e7d83', fontStyle: 'italic' }}>None held yet.</div>}
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {player.agendaAchieved.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <StampLabel>P{a.phase}</StampLabel>
                  <TextInput
                    value={a.text}
                    onChange={(v) => updateAgenda(a.id, v)}
                    placeholder="Which Agenda, and notes…"
                    style={{ flex: 1 }}
                  />
                  <Button variant="danger" onClick={() => removeAgenda(a.id)} style={{ padding: '0.4rem 0.6rem' }}>×</Button>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrades */}
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
              <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6e7d83' }}>
                Upgrade Cards Earned <span style={{ color: '#6e7d83', fontWeight: 400, textTransform: 'none' }}>— equip up to 3 per battle from the Battle Log</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {UPGRADE_TYPES.map(t => (
                  <div key={t.id} style={{ display: 'flex', gap: '0.15rem' }}>
                    <Button variant="ghost" onClick={() => addUpgrade(t.id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.65rem' }}>
                      + {t.label}
                    </Button>
                    <button
                      onClick={() => drawRandomUpgrade(t.id)}
                      title={`Randomly draw a ${t.label} card`}
                      style={{
                        background: 'transparent', border: '1.5px solid #3a4448', borderRadius: '3px',
                        color: '#6e7d83', cursor: 'pointer', padding: '0.3rem 0.5rem', fontSize: '0.85rem',
                      }}
                    >🎲</button>
                  </div>
                ))}
              </div>
            </div>
            {player.upgrades.length === 0 && <div style={{ fontSize: '0.85rem', color: '#6e7d83', fontStyle: 'italic' }}>None earned yet — auto-granted after recording battles, or add manually.</div>}
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {player.upgrades.map(u => {
                const typeInfo = UPGRADE_TYPES.find(t => t.id === u.type);
                const deck = u.type === 'battle_skill' ? BATTLE_SKILLS_DATA
                  : u.type === 'battle_honour' ? BATTLE_HONOURS_DATA.filter(h => h.group === `Phase ${u.phase}`)
                  : RELICS_DATA.filter(r => r.alliance === player.alliance);
                return (
                  <div key={u.id} style={{ border: '1px solid #3a4448', borderRadius: '3px', padding: '0.6rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <StampLabel>{typeInfo.label}</StampLabel>
                      {u.phase && <StampLabel>Phase {u.phase}</StampLabel>}
                      <div style={{ flex: 1 }} />
                      <Button variant="danger" onClick={() => removeUpgrade(u.id)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.65rem' }}>×</Button>
                    </div>
                    <Combobox
                      value={u.name}
                      onChange={(v) => {
                        const match = deck.find(d => d.name === v);
                        updateUpgrade(u.id, { name: v, effectText: match ? match.effect : u.effectText });
                      }}
                      suggestions={deck.map(d => d.name)}
                      placeholder="Card name (which did you draw?)"
                      style={{ width: '100%', marginBottom: '0.4rem' }}
                    />
                    {u.effectText && (
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', lineHeight: 1.5, color: '#aab8be', whiteSpace: 'pre-wrap' }}>
                        {u.effectText}
                      </p>
                    )}
                    <TextInput
                      value={u.notes || ''}
                      onChange={(v) => updateUpgrade(u.id, { notes: v })}
                      placeholder="Assigned unit / notes (optional)"
                      style={{ width: '100%' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Narrative */}
          <div>
            <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6e7d83', marginBottom: '0.4rem' }}>
              Army Narrative
            </div>
            <TextArea
              value={player.narrative}
              onChange={(v) => onUpdate({ narrative: v })}
              placeholder="The story of this army from the grand perspective — background, commander lore, characters, growing legend…"
              rows={5}
            />
          </div>

          <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #3a4448', paddingTop: '0.8rem' }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#5fae6a', letterSpacing: '0.08em' }}>
              ◆ ALL FIELDS SAVE AUTOMATICALLY
            </span>
            <Button variant="danger" onClick={onRemove}>Remove Commander</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function LabeledInput({ label, value, onChange }) {
  return (
    <div>
      <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6e7d83', marginBottom: '0.25rem' }}>{label}</div>
      <TextInput value={value} onChange={onChange} style={{ width: '100%' }} />
    </div>
  );
}

