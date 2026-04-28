/**
 * HackHive – External Hackathon Sync Service
 * Pulls real-world hackathons from:
 *   1. Devfolio   → GraphQL API
 *   2. HackerEarth → Public REST API
 *   3. Unstop      → Public search API
 *   4. MLH         → Public events JSON
 */

const axios = require('axios');
const Hackathon = require('../models/Hackathon');

// ── Helpers ─────────────────────────────────────────────────

const axiosClient = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; HackHive/1.0)',
    'Accept': 'application/json',
  },
});

function toDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function inferStatus(startDate, endDate) {
  const now = new Date();
  if (!startDate) return 'upcoming';
  if (now < startDate) return 'upcoming';
  if (now >= startDate && (!endDate || now <= endDate)) return 'active';
  return 'ended';
}

function pickAccent(source) {
  const map = { devfolio: '#3b82f6', hackerearth: '#22d3ee', unstop: '#f472b6', mlh: '#7c3aed', devpost: '#fb923c' };
  return map[source] || '#7c3aed';
}

function pickEmoji(tags = []) {
  const t = tags.join(' ').toLowerCase();
  if (t.includes('ai') || t.includes('ml')) return '🤖';
  if (t.includes('web3') || t.includes('blockchain')) return '⛓️';
  if (t.includes('health')) return '🏥';
  if (t.includes('game')) return '🎮';
  if (t.includes('climate') || t.includes('environment')) return '🌍';
  if (t.includes('finance') || t.includes('fintech')) return '💰';
  if (t.includes('mobile') || t.includes('app')) return '📱';
  if (t.includes('open source')) return '🔓';
  return '🏆';
}

// ── 1. DEVFOLIO ──────────────────────────────────────────────

async function fetchDevfolio() {
  const results = [];
  try {
    const query = `
      query ListHackathons($filters: HackathonFiltersInput, $page: Int, $per_page: Int) {
        hackathons(filters: $filters, page: $page, per_page: $per_page) {
          hackathons {
            id slug name tagline starts_at ends_at prize status
            cover_image_url
            city country is_online
            team_min team_max
            tracks { name }
            organization { name }
          }
          total
        }
      }
    `;

    const res = await axiosClient.post(
      'https://api.devfolio.co/api/graphql',
      { query, variables: { filters: { status: ['upcoming', 'ongoing'] }, page: 1, per_page: 20 } },
      { headers: { 'Content-Type': 'application/json', 'x-client-secret': 'public' } }
    );

    const hackathons = res.data?.data?.hackathons?.hackathons || [];
    for (const h of hackathons) {
      const tags = (h.tracks || []).map(t => t.name).filter(Boolean);
      results.push({
        source: 'devfolio',
        externalId: h.id || h.slug,
        externalUrl: `https://devfolio.co/hackathons/${h.slug}`,
        title: h.name,
        organizer: h.organization?.name || 'Devfolio Community',
        description: h.tagline || `Join ${h.name} on Devfolio!`,
        logoUrl: h.cover_image_url || '',
        startDate: toDate(h.starts_at),
        endDate: toDate(h.ends_at),
        prize: { total: h.prize ? `$${Number(h.prize).toLocaleString()}` : 'Prizes TBA', breakdown: [] },
        tags: tags.length ? tags : ['Hackathon'],
        maxTeamSize: h.team_max || 4,
        minTeamSize: h.team_min || 1,
        mode: h.is_online ? 'online' : 'in-person',
        location: h.is_online ? 'Online' : `${h.city || ''}, ${h.country || ''}`.trim().replace(/^,|,$/, ''),
        status: inferStatus(toDate(h.starts_at), toDate(h.ends_at)),
        emoji: pickEmoji(tags),
        accentColor: pickAccent('devfolio'),
        featured: false,
        isExternal: true,
      });
    }
    console.log(`  ✅ Devfolio: ${results.length} hackathons fetched`);
  } catch (err) {
    console.warn(`  ⚠️  Devfolio fetch failed: ${err.message}`);
  }
  return results;
}

// ── 2. HACKEREARTH ──────────────────────────────────────────

async function fetchHackerEarth() {
  const results = [];
  try {
    // HackerEarth public challenges endpoint (no auth needed for basic data)
    const res = await axiosClient.get(
      'https://www.hackerearth.com/api/developer/challenges/?limit=20&offset=0&client_secret=hackhive_public',
      { headers: { 'Content-Type': 'application/json' } }
    );

    const challenges = res.data?.response || [];
    for (const c of challenges) {
      if (!c.challenge_name) continue;
      const tags = (c.tags || []).map(t => t.name || t).filter(Boolean);
      results.push({
        source: 'hackerearth',
        externalId: String(c.id || c.challenge_id || ''),
        externalUrl: c.url || `https://www.hackerearth.com/challenges/hackathon/`,
        title: c.challenge_name,
        organizer: c.company_name || 'HackerEarth',
        description: c.description || `Participate in ${c.challenge_name} on HackerEarth.`,
        logoUrl: c.cover_image || '',
        startDate: toDate(c.start_time),
        endDate: toDate(c.end_time),
        registrationDeadline: toDate(c.registration_deadline),
        prize: { total: c.prize ? `$${c.prize}` : 'Prizes TBA', breakdown: [] },
        tags: tags.length ? tags : ['Competitive Programming'],
        maxTeamSize: c.max_team_size || 4,
        minTeamSize: 1,
        mode: 'online',
        location: 'Online',
        status: inferStatus(toDate(c.start_time), toDate(c.end_time)),
        emoji: pickEmoji(tags),
        accentColor: pickAccent('hackerearth'),
        featured: false,
        isExternal: true,
      });
    }
    console.log(`  ✅ HackerEarth: ${results.length} challenges fetched`);
  } catch (err) {
    console.warn(`  ⚠️  HackerEarth fetch failed: ${err.message}`);
  }
  return results;
}

// ── 3. UNSTOP ───────────────────────────────────────────────

async function fetchUnstop() {
  const results = [];
  try {
    const res = await axiosClient.get(
      'https://unstop.com/api/public/opportunity/search?opportunity=hackathon&per_page=20&page=1',
      {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://unstop.com/',
        },
      }
    );

    const items = res.data?.data?.data || res.data?.data || [];
    for (const item of items) {
      const start = toDate(item.start_date || item.starts_at);
      const end = toDate(item.end_date || item.ends_at);
      const tags = (item.filters || item.tags || [])
        .map(f => f.label || f.name || f)
        .filter(t => typeof t === 'string')
        .slice(0, 5);

      const prizeRaw = item.prize_pool || item.prize || 0;
      const prizeFormatted = prizeRaw
        ? (typeof prizeRaw === 'number'
          ? (prizeRaw >= 100000 ? `₹${(prizeRaw / 100000).toFixed(1)}L` : `₹${prizeRaw.toLocaleString()}`)
          : String(prizeRaw))
        : 'Prizes TBA';

      results.push({
        source: 'unstop',
        externalId: String(item.id || ''),
        externalUrl: item.seo_url
          ? `https://unstop.com/${item.seo_url}`
          : `https://unstop.com/hackathons`,
        title: item.title || item.name,
        organizer: item.organisation?.name || item.organiser || 'Unstop',
        description: item.tagline || item.short_description || `Join this hackathon on Unstop!`,
        logoUrl: item.logo_image || item.cover_image || '',
        startDate: start,
        endDate: end,
        registrationDeadline: toDate(item.registration_deadline),
        prize: { total: prizeFormatted, breakdown: [] },
        tags: tags.length ? tags : ['Hackathon'],
        maxTeamSize: item.max_team_size || 4,
        minTeamSize: item.min_team_size || 1,
        mode: item.type === 'online' ? 'online' : item.type === 'offline' ? 'in-person' : 'hybrid',
        location: item.college_city || item.location || 'Online',
        status: inferStatus(start, end),
        emoji: pickEmoji(tags),
        accentColor: pickAccent('unstop'),
        featured: false,
        isExternal: true,
      });
    }
    console.log(`  ✅ Unstop: ${results.length} hackathons fetched`);
  } catch (err) {
    console.warn(`  ⚠️  Unstop fetch failed: ${err.message}`);
  }
  return results;
}

// ── 4. MLH (Major League Hacking) ───────────────────────────

async function fetchMLH() {
  const results = [];
  try {
    // MLH public events JSON – updated each season
    const year = new Date().getFullYear();
    const res = await axiosClient.get(`https://mlh.io/seasons/${year}/events.json`);
    const events = Array.isArray(res.data) ? res.data : [];

    for (const e of events) {
      const start = toDate(e.start_date);
      const end = toDate(e.end_date);
      results.push({
        source: 'mlh',
        externalId: String(e.id || e.name || ''),
        externalUrl: e.website || 'https://mlh.io',
        title: e.name,
        organizer: 'MLH',
        description: `${e.name} — An official MLH Member Event. ${e.is_online ? 'Online hackathon open to everyone.' : `Happening in ${e.location || 'person'}.`}`,
        logoUrl: e.logo || '',
        startDate: start,
        endDate: end,
        prize: { total: 'MLH Prizes', breakdown: ['MLH Prize Kit', 'Sponsor Prizes'] },
        tags: ['Student Hackathon', 'MLH', e.is_online ? 'Online' : 'In-person'].filter(Boolean),
        maxTeamSize: 4,
        minTeamSize: 1,
        mode: e.is_online ? 'online' : 'in-person',
        location: e.location || (e.is_online ? 'Online' : 'TBA'),
        status: inferStatus(start, end),
        emoji: '🎓',
        accentColor: pickAccent('mlh'),
        featured: false,
        isExternal: true,
      });
    }
    console.log(`  ✅ MLH: ${results.length} events fetched`);
  } catch (err) {
    console.warn(`  ⚠️  MLH fetch failed: ${err.message}`);
  }
  return results;
}

// ── MAIN SYNC FUNCTION ───────────────────────────────────────

async function syncExternalHackathons() {
  console.log('\n🔄 Syncing external hackathons...');
  const start = Date.now();

  const [devfolioData, hackerEarthData, unstopData, mlhData] = await Promise.allSettled([
    fetchDevfolio(),
    fetchHackerEarth(),
    fetchUnstop(),
    fetchMLH(),
  ]);

  const allExternal = [
    ...(devfolioData.status === 'fulfilled' ? devfolioData.value : []),
    ...(hackerEarthData.status === 'fulfilled' ? hackerEarthData.value : []),
    ...(unstopData.status === 'fulfilled' ? unstopData.value : []),
    ...(mlhData.status === 'fulfilled' ? mlhData.value : []),
  ].filter(h => h.title && h.title.length > 2);

  let upserted = 0;
  let skipped = 0;

  for (const data of allExternal) {
    try {
      // Find a default createdBy user (system) or skip if no users exist
      const User = require('../models/User');
      let systemUser = await User.findOne({ handle: 'hackhive_system' });
      if (!systemUser) {
        // Use first available user as system user
        systemUser = await User.findOne({});
      }
      if (!systemUser) { skipped++; continue; }

      await Hackathon.findOneAndUpdate(
        { source: data.source, externalId: data.externalId },
        {
          $set: {
            ...data,
            createdBy: systemUser._id,
          },
        },
        { upsert: true, new: true, runValidators: false }
      );
      upserted++;
    } catch (err) {
      console.warn(`  ⚠️  Failed to upsert "${data.title}": ${err.message}`);
      skipped++;
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`✅ Sync complete in ${elapsed}s: ${upserted} upserted, ${skipped} skipped\n`);
  return { upserted, skipped, total: allExternal.length };
}

module.exports = { syncExternalHackathons };
