const STORAGE_KEY = 'dominatus-campaign-tracker.v1';

export function createId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
}

export function loadCampaign(createDefaultCampaign) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultCampaign();
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : createDefaultCampaign();
  } catch {
    return createDefaultCampaign();
  }
}

export function saveCampaign(campaign) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(campaign));
}

export function clearCampaign() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function exportCampaign(campaign) {
  const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'dominatus-campaign.json';
  link.click();
  URL.revokeObjectURL(url);
}

export async function importCampaign(file) {
  const parsed = JSON.parse(await file.text());
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.players) || !Array.isArray(parsed.battles)) {
    throw new Error('The selected file is not a Dominatus campaign.');
  }
  return parsed;
}