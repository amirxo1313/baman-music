
export interface Track {
  id: number;
  name: string;
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  color: string;
  reverb: number;
  filterType: BiquadFilterType;
  filterFreq: number;
  filterQ: number;
}
