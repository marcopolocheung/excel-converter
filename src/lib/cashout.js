// Reads a saved day from the China Rose cash-out page (chinarosesa.com/internal/cash-out).
// Needs the manager code — the same one that unlocks the scheduler demo. Never stored.
const API = 'https://chinarose-schedule-api.crbrucecheung.workers.dev';

const dollars = (cents) => (cents === null || cents === undefined ? '' : (cents / 100).toFixed(2));

export function storeForLocation(location) {
  if (location.includes('CHINA ROSE #3')) return 'CR3';
  if (location.includes('CHINA ROSE #2')) return 'CR2';
  return null;
}

/** Form fields for C4–C7, or null when nothing was saved that day. Blank over/short stays blank. */
export async function fetchCashoutFields(store, date, code) {
  const res = await fetch(`${API}/api/cashout/${store}/${date}`, {
    headers: { Authorization: `Bearer ${code}` },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (res.status === 401) throw new Error('That manager code was not accepted.');
  if (res.status === 429) throw new Error('Too many wrong codes. Wait a bit and try again.');
  if (!res.ok) throw new Error('Could not reach the cash-out store.');
  const { totals } = await res.json();
  return {
    amDeposit: dollars(totals.amDeposit),
    pmDeposit: dollars(totals.pmDeposit),
    amOverShort: dollars(totals.amOverShort),
    pmOverShort: dollars(totals.pmOverShort),
  };
}
