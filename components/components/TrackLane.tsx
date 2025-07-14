
import React from 'react';
import { Track } from '../types';

interface TrackLaneProps {
  track: Track;
  onTrackChange: (track: Track) => void;
  hasSolo: boolean;
}

const TrackLane: React.FC<TrackLaneProps> = ({ track, onTrackChange, hasSolo }) => {
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTrackChange({ ...track, volume: parseInt(e.target.value, 10) });
  };

  const handleReverbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTrackChange({ ...track, reverb: parseInt(e.target.value, 10) });
  };

  const toggleMute = () => {
    onTrackChange({ ...track, isMuted: !track.isMuted });
  };

  const toggleSolo = () => {
    onTrackChange({ ...track, isSolo: !track.isSolo });
  };

  const isEffectivelyMuted = track.isMuted || (hasSolo && !track.isSolo);
  const trackBgClass = isEffectivelyMuted ? 'bg-gray-700/80' : 'bg-gray-800/50';
  const soloedOutClass = hasSolo && !track.isSolo ? 'opacity-50' : 'opacity-100';

  return (
    <div className={`flex flex-col md:flex-row items-center p-3 rounded-lg transition-all duration-300 ${trackBgClass} ${soloedOutClass}`}>
      <div className="flex items-center gap-3 w-full md:w-48 mb-3 md:mb-0">
        <div className={`w-3 h-16 rounded-full ${track.color}`}></div>
        <span className="font-bold text-lg text-white truncate">{track.name}</span>
      </div>

      <div className="flex items-center gap-4 flex-grow w-full">
        {/* Mute/Solo buttons */}
        <div className="flex gap-2">
          <button
            onClick={toggleMute}
            className={`w-10 h-10 rounded-md font-bold transition-colors ${
              track.isMuted ? 'bg-rose-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
            }`}
            title="قطع کردن (Mute)"
            disabled={hasSolo && !track.isSolo}
          >
            M
          </button>
          <button
            onClick={toggleSolo}
            className={`w-10 h-10 rounded-md font-bold transition-colors ${
              track.isSolo ? 'bg-amber-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
            }`}
            title="پخش تکی (Solo)"
          >
            S
          </button>
        </div>

        {/* Fake Waveform */}
        <div className="flex-grow h-16 bg-gray-900/50 rounded-md flex items-center px-2 overflow-hidden">
             <div className="w-full h-full flex items-center gap-px">
                {Array.from({ length: 50 }).map((_, i) => (
                <div
                    key={i}
                    className={`rounded-full ${track.color}`}
                    style={{
                    width: '3px',
                    height: `${2 + Math.sin(i * 0.4 + track.id) * 50 + 40}%`,
                    opacity: isEffectivelyMuted ? 0.1 : 0.2 + Math.random() * 0.4,
                    }}
                ></div>
                ))}
            </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-start justify-center gap-1 w-full md:w-48 ml-4">
            {/* Volume Slider */}
            <div className="flex items-center gap-2 w-full" title="میزان صدا (Volume)">
                <label htmlFor={`volume-${track.id}`} className="text-xs text-gray-400 w-12 text-right">صدا</label>
                <input
                    id={`volume-${track.id}`}
                    type="range"
                    min="0"
                    max="100"
                    value={track.volume}
                    onChange={handleVolumeChange}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:accent-gray-600"
                    disabled={isEffectivelyMuted}
                />
                <span className="text-sm text-gray-400 w-8 text-center">{track.volume}</span>
            </div>
            {/* Reverb Slider */}
            <div className="flex items-center gap-2 w-full" title="میزان پژواک (Reverb)">
                <label htmlFor={`reverb-${track.id}`} className="text-xs text-gray-400 w-12 text-right">پژواک</label>
                <input
                    id={`reverb-${track.id}`}
                    type="range"
                    min="0"
                    max="100"
                    value={track.reverb}
                    onChange={handleReverbChange}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500 disabled:accent-gray-600"
                    disabled={isEffectivelyMuted}
                />
                <span className="text-sm text-gray-400 w-8 text-center">{track.reverb}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TrackLane;
