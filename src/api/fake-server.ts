export const DEFAULT_BOOKINGS_FIXTURE: unknown[] = [
  {
    id: 'studio',
    title: 'Studio visit',
    startsAt: '2026-06-01T15:00:00.000Z',
    timezone: 'America/New_York',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    location: 'Studio B, 524 Broadway, New York, NY',
    category: 'Creative Production',
    host: 'Elena Rostova • Lead Producer',
    duration: '2 hours',
    instructions: 'Check in at 6th floor reception with photo ID. Freight elevator available on Mercer St.',
  },
  {
    id: 'site',
    title: 'Site walkthrough',
    startsAt: '2026-06-01T18:00:00.000Z',
    timezone: 'America/Los_Angeles',
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    location: '8400 Wilshire Blvd, Beverly Hills, CA',
    category: 'Architecture & Build',
    host: 'Marcus Vance • Site Superintendent',
    duration: '1.5 hours',
    instructions: 'PPE (hard hat, high-vis vest, steel-toe boots) required on site. Sign in at Gate 2 trailer.',
  },
  {
    id: 'broken',
    title: 'Broken row',
  },
  {
    id: 'review',
    title: 'Plan review',
    startsAt: '2026-06-01T14:00:00.000Z',
    timezone: 'Europe/London',
    imageUrl: 'https://images.unsplash.com/photo-1581291518655-952384493033?auto=format&fit=crop&w=800&q=80',
    location: '100 Victoria Embankment, London, UK',
    category: 'Engineering & Planning',
    host: 'Alistair Sterling • Senior Architect',
    duration: '1 hour',
    instructions: 'Security clearance badge provided at main lobby desk. Bring printed copy of revision D.',
  },
  {
    id: 'consult',
    title: 'Design consultation',
    startsAt: '2026-06-02T16:00:00.000Z',
    timezone: 'America/Chicago',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    location: '233 S Wacker Dr, 44th Fl, Chicago, IL',
    category: 'Interior Architecture',
    host: 'Claire Dupont • Principal Designer',
    duration: '2 hours',
    instructions: 'Register with building security for Willis Tower tower access. Conference Room 44A.',
  },
  {
    id: 'audit',
    title: 'Field security audit',
    startsAt: '2026-06-02T20:00:00.000Z',
    timezone: 'America/Denver',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    location: '1125 17th St, Suite 1800, Denver, CO',
    category: 'Security & Operations',
    host: 'David Kim • Systems Inspector',
    duration: '3 hours',
    instructions: 'NDA badge verification at security checkpoint. Escort required in server room.',
  },
  {
    id: 'rehearsal',
    title: 'Sound stage rehearsal',
    startsAt: '2026-06-03T11:00:00.000Z',
    timezone: 'Asia/Tokyo',
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
    location: 'Roppongi Hills Mori Tower, Tokyo, Japan',
    category: 'Audio Engineering',
    host: 'Kenji Takahashi • Sound Director',
    duration: '2.5 hours',
    instructions: 'Acoustic Soundstage 3. Please silence mobile devices before entering sound booth.',
  },
  {
    id: 'strategy',
    title: 'Executive strategy sync',
    startsAt: '2026-06-04T08:00:00.000Z',
    timezone: 'Europe/Paris',
    imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
    location: '12 Place Vendôme, Paris, France',
    category: 'Corporate Strategy',
    host: 'Camille Moreau • VP Operations',
    duration: '1.5 hours',
    instructions: 'Boardroom Suite 5. Executive briefing packet available on table upon arrival.',
  },
];

export function createFakeFetch(): typeof fetch {
  return async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    const mode = process.env.EXPO_PUBLIC_BOOKINGS;

    if (mode === 'empty') {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'error') {
      return new Response(JSON.stringify({ error: 'unavailable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(DEFAULT_BOOKINGS_FIXTURE), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
