
import { Track } from './types';

export const INITIAL_TRACKS: Track[] = [
  // Final Attempt: This is a "sound scalpel" setup. The goal is MAXIMUM separation.
  // The filters are extremely aggressive. Soloing each track MUST sound dramatically different.

  // 1. Sub Bass (The Deep Rumble)
  // An extremely aggressive lowpass, only allowing the sub-bass frequencies through.
  // Soloing this should be almost inaudible on small speakers, but powerful on headphones/subwoofers.
  { id: 1, name: 'ضربان عمیق', volume: 80, isMuted: false, isSolo: false, color: 'bg-red-600', reverb: 0, filterType: 'lowpass', filterFreq: 100, filterQ: 1 },

  // 2. The Punch (Snare/Kick Body)
  // A very tight bandpass focused on the "punch" frequency of a kick or snare drum.
  { id: 2, name: 'قدرت اصلی', volume: 80, isMuted: false, isSolo: false, color: 'bg-orange-500', reverb: 0, filterType: 'bandpass', filterFreq: 250, filterQ: 4 },

  // 3. The Voice (Clarity Channel)
  // A surgically narrow bandpass on the presence-frequency of vocals.
  // This will sound very thin and "radio-like" when soloed, proving the isolation.
  { id: 3, name: 'کانال وکال', volume: 80, isMuted: false, isSolo: false, color: 'bg-sky-400', reverb: 0, filterType: 'bandpass', filterFreq: 1500, filterQ: 5 },

  // 4. The Air (Cymbal Sizzle)
  // A very high highpass filter, isolating only the absolute top-end 'air' and cymbal sounds.
  { id: 4, name: 'جرقه و هوا', volume: 80, isMuted: false, isSolo: false, color: 'bg-fuchsia-500', reverb: 0, filterType: 'highpass', filterFreq: 8000, filterQ: 1 },
];
