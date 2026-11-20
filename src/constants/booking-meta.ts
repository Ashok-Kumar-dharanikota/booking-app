import { Booking } from '@/types/booking';

export interface BookingMeta {
  imageUrl: string;
  location: string;
  category: string;
  host: string;
  duration: string;
  instructions: string;
}

export const BOOKING_METADATA_REGISTRY: Record<string, BookingMeta> = {
  studio: {
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    location: 'Studio B, 524 Broadway, New York, NY',
    category: 'Creative Production',
    host: 'Elena Rostova • Lead Producer',
    duration: '2 hours',
    instructions: 'Check in at 6th floor reception with photo ID. Freight elevator available on Mercer St.',
  },
  site: {
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    location: '8400 Wilshire Blvd, Beverly Hills, CA',
    category: 'Architecture & Build',
    host: 'Marcus Vance • Site Superintendent',
    duration: '1.5 hours',
    instructions: 'PPE (hard hat, high-vis vest, steel-toe boots) required on site. Sign in at Gate 2 trailer.',
  },
  review: {
    imageUrl: 'https://images.unsplash.com/photo-1581291518655-952384493033?auto=format&fit=crop&w=800&q=80',
    location: '100 Victoria Embankment, London, UK',
    category: 'Engineering & Planning',
    host: 'Alistair Sterling • Senior Architect',
    duration: '1 hour',
    instructions: 'Security clearance badge provided at main lobby desk. Bring printed copy of revision D.',
  },
  consult: {
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    location: '233 S Wacker Dr, 44th Fl, Chicago, IL',
    category: 'Interior Architecture',
    host: 'Claire Dupont • Principal Designer',
    duration: '2 hours',
    instructions: 'Register with building security for Willis Tower tower access. Conference Room 44A.',
  },
  audit: {
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    location: '1125 17th St, Suite 1800, Denver, CO',
    category: 'Security & Operations',
    host: 'David Kim • Systems Inspector',
    duration: '3 hours',
    instructions: 'NDA badge verification at security checkpoint. Escort required in server room.',
  },
  rehearsal: {
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
    location: 'Roppongi Hills Mori Tower, Tokyo, Japan',
    category: 'Audio Engineering',
    host: 'Kenji Takahashi • Sound Director',
    duration: '2.5 hours',
    instructions: 'Acoustic Soundstage 3. Please silence mobile devices before entering sound booth.',
  },
  strategy: {
    imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
    location: '12 Place Vendôme, Paris, France',
    category: 'Corporate Strategy',
    host: 'Camille Moreau • VP Operations',
    duration: '1.5 hours',
    instructions: 'Boardroom Suite 5. Executive briefing packet available on table upon arrival.',
  },
};

const DEFAULT_META: BookingMeta = {
  imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
  location: 'Global Workspace Center',
  category: 'General Appointment',
  host: 'Appointment Coordinator',
  duration: '1 hour',
  instructions: 'Please arrive 10 minutes prior to scheduled start time.',
};

export function getBookingMeta(booking: Booking): BookingMeta {
  const registered = BOOKING_METADATA_REGISTRY[booking.id];
  return {
    imageUrl: booking.imageUrl || registered?.imageUrl || DEFAULT_META.imageUrl,
    location: booking.location || registered?.location || DEFAULT_META.location,
    category: booking.category || registered?.category || DEFAULT_META.category,
    host: booking.host || registered?.host || DEFAULT_META.host,
    duration: booking.duration || registered?.duration || DEFAULT_META.duration,
    instructions: booking.instructions || registered?.instructions || DEFAULT_META.instructions,
  };
}
