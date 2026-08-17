// ==========================================================================
// ABAZAR AUTO - SUPABASE CLOUD DATABASE CLIENT
// ==========================================================================

const SUPABASE_CONFIG = {
  url: 'https://fynnyzsttgjksisfrivv.supabase.co',
  key: 'sb_publishable_eik3nSboAffktmwKviJtQg_KAefaP5h'
};

let sbClient = null;

function getSupabase() {
  if (!sbClient && window.supabase) {
    try {
      sbClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    } catch (e) {
      console.warn('Supabase initialization error:', e);
    }
  }
  return sbClient;
}
