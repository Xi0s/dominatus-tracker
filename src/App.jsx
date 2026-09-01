import { useEffect, useRef, useState } from 'react';
import OverviewTab from './features/OverviewTab';
import RosterTab from './features/RosterTab';
import BattlesTab from './features/BattlesTab';
import { BATTLE_HONOURS_DATA, BATTLE_SKILLS_DATA } from './data/referenceData';
import { defaultCampaign, defaultPlayer } from './lib/campaign';
import { clearCampaign, createId, exportCampaign, importCampaign, loadCampaign, saveCampaign } from './lib/localDatabase';

const TABS = [
  ['overview', 'Campaign'],
  ['roster', 'Roster'],
  ['battles', 'Battle Log'],
];

export default function DominatusTracker() {
  const [campaign, setCampaign] = useState(() => loadCampaign(defaultCampaign));
  const [tab, setTab] = useState('overview');
  const [saveFlash, setSaveFlash] = useState(false);
  const titleRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => {
    saveCampaign(campaign);
    setSaveFlash(true);
    const timeoutId = window.setTimeout(() => setSaveFlash(false), 900);
    return () => window.clearTimeout(timeoutId);
  }, [campaign]);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [campaign.campaignName]);

  const persist = (updater) => {
    setCampaign((previous) => typeof updater === 'function'
      ? updater(previous)
      : { ...previous, ...updater });
  };

  const updateCampaign = (patch) => persist((previous) => ({ ...previous, ...patch }));

  const addPlayer = () => {
    persist((previous) => ({ ...previous, players: [...previous.players, defaultPlayer()] }));
    setTab('roster');
  };

  const updatePlayer = (id, patch) => {
    persist((previous) => ({
      ...previous,
      players: previous.players.map((player) => player.id === id ? { ...player, ...patch } : player),
    }));
  };

  const removePlayer = (id) => {
    persist((previous) => ({ ...previous, players: previous.players.filter((player) => player.id !== id) }));
  };

  const updateBattle = (id, patch) => {
    persist((previous) => ({
      ...previous,
      battles: previous.battles.map((battle) => battle.id === id ? { ...battle, ...patch } : battle),
    }));
  };

  const removeBattle = (id) => {
    persist((previous) => ({ ...previous, battles: previous.battles.filter((battle) => battle.id !== id) }));
  };

  const recordBattle = (battle) => {
    persist((previous) => ({
      ...previous,
      battles: [...previous.battles, battle],
      players: previous.players.map((player) => {
        const commander = battle.commanders.find((entry) => entry.playerId === player.id);
        if (!commander) return player;

        const recordKey = commander.outcome === 'win' ? 'wins' : commander.outcome === 'loss' ? 'losses' : 'draws';
        const record = { ...player.record, [recordKey]: player.record[recordKey] + 1 };
        const phaseRecord = player.recordByPhase[battle.phase];
        const recordByPhase = { ...player.recordByPhase, [battle.phase]: { ...phaseRecord, [recordKey]: phaseRecord[recordKey] + 1 } };
        let upgrades = player.upgrades;
        const deck = commander.outcome === 'win'
          ? BATTLE_HONOURS_DATA.filter((honour) => honour.group === `Phase ${battle.phase}`)
          : BATTLE_SKILLS_DATA;

        if (battle.phase === 3) {
          if (commander.outcome === 'win') {
            upgrades = [...upgrades, {
              id: createId(), type: 'battle_honour', name: 'Path to Conquest', effectText: '',
              phase: battle.phase, equipped: false, battleId: battle.id,
            }];
          }
        } else {
          const heldNames = new Set(upgrades.filter((upgrade) => upgrade.type === (commander.outcome === 'win' ? 'battle_honour' : 'battle_skill')).map((upgrade) => upgrade.name));
          const available = deck.filter((card) => !heldNames.has(card.name));
          const card = (available.length ? available : deck)[Math.floor(Math.random() * (available.length || deck.length))];
          if (card) {
            upgrades = [...upgrades, {
              id: createId(), type: commander.outcome === 'win' ? 'battle_honour' : 'battle_skill',
              name: card.name, effectText: card.effect, phase: battle.phase, equipped: false, battleId: battle.id,
            }];
          }
        }

        const agendaAchieved = commander.agendaAchieved && player.agendaAchieved.length < 3
          ? [...player.agendaAchieved, { id: createId(), phase: battle.phase, text: commander.agendaName, battleId: battle.id }]
          : player.agendaAchieved;

        return { ...player, record, recordByPhase, upgrades, agendaAchieved };
      }),
    }));
  };

  const resetCampaign = () => {
    if (!window.confirm('Delete this locally stored campaign? This cannot be undone.')) return;
    clearCampaign();
    setCampaign(defaultCampaign());
    setTab('overview');
  };

  const handleImport = async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      setCampaign(await importCampaign(file));
      setTab('overview');
    } catch (error) {
      window.alert(error.message);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0c0f10', color: '#e4e9ea', fontFamily: "'Chakra Petch', sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,400;0,500;0,600;0,700;1,500&family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      <header style={{ borderBottom: '4px double #e4e9ea', padding: '1.4rem 1.5rem 1.1rem' }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.15em', color: '#6e7d83', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          War Zone Armageddon - Warmaster's Ledger
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem' }}>
          <textarea
            value={campaign.campaignName}
            ref={titleRef}
            onChange={(event) => updateCampaign({ campaignName: event.target.value })}
            rows={1}
            onInput={(event) => { event.target.style.height = 'auto'; event.target.style.height = `${event.target.scrollHeight}px`; }}
            style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 'clamp(1.1rem, 5.5vw, 1.9rem)', lineHeight: 1.15, background: 'transparent', border: 'none', outline: 'none', color: '#e4e9ea', padding: 0, margin: 0, width: '100%', minWidth: 0, textTransform: 'uppercase', boxSizing: 'border-box', resize: 'none', overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          />
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: saveFlash ? '#5fae6a' : '#6e7d83', whiteSpace: 'nowrap', marginTop: '0.3rem' }}>
            {saveFlash ? 'SAVED' : 'LOCAL'}
          </span>
        </div>
        <nav style={{ display: 'flex', gap: '0.4rem', marginTop: '1.1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ fontFamily: "'Chakra Petch', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.8rem', fontWeight: 600, padding: '0.5rem 1.1rem', border: '1.5px solid #e4e9ea', background: tab === id ? '#e4e9ea' : 'transparent', color: tab === id ? '#0c0f10' : '#e4e9ea', cursor: 'pointer', borderRadius: '3px 3px 0 0' }}>
              {label}
            </button>
          ))}
          <button onClick={resetCampaign} title="Delete the locally stored campaign" style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #8b1a1a', borderRadius: '3px', color: '#c0524f', cursor: 'pointer', padding: '0.45rem 0.7rem', fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.7rem', textTransform: 'uppercase' }}>
            Reset local data
          </button>
          <button onClick={() => exportCampaign(campaign)} style={{ background: 'transparent', border: '1px solid #3a4448', borderRadius: '3px', color: '#e4e9ea', cursor: 'pointer', padding: '0.45rem 0.7rem', fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.7rem', textTransform: 'uppercase' }}>
            Export JSON
          </button>
          <button onClick={() => importRef.current?.click()} style={{ background: 'transparent', border: '1px solid #3a4448', borderRadius: '3px', color: '#e4e9ea', cursor: 'pointer', padding: '0.45rem 0.7rem', fontFamily: "'Chakra Petch', sans-serif", fontSize: '0.7rem', textTransform: 'uppercase' }}>
            Import JSON
          </button>
          <input ref={importRef} type="file" accept="application/json,.json" onChange={handleImport} hidden />
        </nav>
      </header>
      <main style={{ padding: '1.6rem', maxWidth: '1100px', margin: '0 auto' }}>
        {tab === 'overview' && <OverviewTab campaign={campaign} updateCampaign={updateCampaign} players={campaign.players} />}
        {tab === 'roster' && <RosterTab players={campaign.players} addPlayer={addPlayer} updatePlayer={updatePlayer} removePlayer={removePlayer} currentPhase={campaign.currentPhase} />}
        {tab === 'battles' && <BattlesTab campaign={campaign} recordBattle={recordBattle} updateBattle={updateBattle} removeBattle={removeBattle} />}
      </main>
    </div>
  );
}
