
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Track as TrackType } from '../types';
import TrackLane from './TrackLane';
import { getRemixIdeas } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import StopIcon from './icons/StopIcon';

interface AudioNodes {
  [key: number]: {
    filter: BiquadFilterNode;
    gain: GainNode;
    reverbGain: GainNode;
  };
}

interface EditorScreenProps {
  tracks: TrackType[];
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
  audioFile: File;
  onReset: () => void;
}

const EditorScreen: React.FC<EditorScreenProps> = ({ tracks, setTracks, audioFile, onReset }) => {
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isReady, setIsReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [masterVolume, setMasterVolume] = useState(80);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const nodesRef = useRef<AudioNodes>({});
  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const createReverbImpulseResponse = (context: BaseAudioContext): AudioBuffer => {
    const sampleRate = context.sampleRate;
    const duration = 2;
    const decay = 5;
    const impulse = context.createBuffer(2, duration * sampleRate, sampleRate);
    for (let i = 0; i < 2; i++) {
        const channel = impulse.getChannelData(i);
        for (let j = 0; j < impulse.length; j++) {
            channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / impulse.length, decay);
        }
    }
    return impulse;
  };

  useEffect(() => {
    const initializeAudio = async () => {
      if (!audioFile) return;
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;

        const arrayBuffer = await audioFile.arrayBuffer();
        const decodedBuffer = await context.decodeAudioData(arrayBuffer);
        audioBufferRef.current = decodedBuffer;
        
        masterGainRef.current = context.createGain();
        masterGainRef.current.connect(context.destination);

        reverbNodeRef.current = context.createConvolver();
        reverbNodeRef.current.buffer = createReverbImpulseResponse(context);
        reverbNodeRef.current.connect(masterGainRef.current);
        
        const createdNodes: AudioNodes = {};
        tracks.forEach(track => {
          const filter = context.createBiquadFilter();
          filter.type = track.filterType;
          filter.frequency.value = track.filterFreq;
          filter.Q.value = track.filterQ;

          const gain = context.createGain();
          gain.gain.value = track.volume / 100;

          const reverbGain = context.createGain();
          reverbGain.gain.value = track.reverb / 100;
          
          filter.connect(gain).connect(masterGainRef.current!);
          filter.connect(reverbGain).connect(reverbNodeRef.current!);

          createdNodes[track.id] = { filter, gain, reverbGain };
        });
        nodesRef.current = createdNodes;
        setIsReady(true);
      } catch (error) {
        console.error("Error initializing audio:", error);
        alert("خطا در پردازش فایل صوتی. لطفاً فایل دیگری را امتحان کنید.");
      }
    };
    
    initializeAudio();
    
    return () => {
        audioContextRef.current?.close().catch(e => console.error(e));
        audioContextRef.current = null;
    }
  }, [audioFile, tracks]);

  const handleTrackChange = useCallback((updatedTrack: TrackType) => {
    setTracks(prevTracks => {
      const newTracks = prevTracks.map(t => (t.id === updatedTrack.id ? updatedTrack : t));

      // If a track was just soloed, unsolo every other track.
      if (updatedTrack.isSolo) {
        return newTracks.map(t =>
          t.id === updatedTrack.id ? t : { ...t, isSolo: false }
        );
      }
      return newTracks;
    });
  }, [setTracks]);
  
  useEffect(() => {
    if (!isReady || !audioContextRef.current) return;
    const context = audioContextRef.current;
    const soloTrack = tracks.find(t => t.isSolo);

    tracks.forEach(track => {
        const nodeGroup = nodesRef.current[track.id];
        if (nodeGroup) {
            const isEffectivelyMuted = track.isMuted || (soloTrack && soloTrack.id !== track.id);
            const targetVolume = isEffectivelyMuted ? 0 : track.volume / 100;
            const targetReverb = isEffectivelyMuted ? 0 : track.reverb / 100;

            nodeGroup.gain.gain.setTargetAtTime(targetVolume, context.currentTime, 0.015);
            nodeGroup.reverbGain.gain.setTargetAtTime(targetReverb, context.currentTime, 0.015);
        }
    });

    if (masterGainRef.current) {
        masterGainRef.current.gain.setTargetAtTime(masterVolume / 100, context.currentTime, 0.015);
    }
  }, [tracks, masterVolume, isReady]);

  const handlePlayPause = useCallback(() => {
    if (!isReady || !audioContextRef.current || !audioBufferRef.current) return;
    const context = audioContextRef.current;
    
    if (isPlaying) {
        sourceNodeRef.current?.stop();
        sourceNodeRef.current = null;
        setIsPlaying(false);
    } else {
        context.resume(); // Ensure context is running
        const source = context.createBufferSource();
        source.buffer = audioBufferRef.current;
        Object.values(nodesRef.current).forEach(nodeGroup => {
            source.connect(nodeGroup.filter);
        });
        source.start(0);
        source.onended = () => {
            if(sourceNodeRef.current === source){
                setIsPlaying(false);
                sourceNodeRef.current = null;
            }
        }
        sourceNodeRef.current = source;
        setIsPlaying(true);
    }
  }, [isReady, isPlaying]);

  const handleStop = useCallback(() => {
    if (!isPlaying || !sourceNodeRef.current) return;
    sourceNodeRef.current.stop();
    sourceNodeRef.current = null;
    setIsPlaying(false);
  }, [isPlaying]);
  
  const handleGenerateSuggestion = async () => {
    setIsGenerating(true);
    setAiSuggestion('');
    try {
        const trackNames = tracks.map(t => t.name);
        const suggestion = await getRemixIdeas(trackNames, audioFile.name);
        setAiSuggestion(suggestion);
    } catch (error) {
        console.error("Error generating suggestion:", error);
        setAiSuggestion("متاسفانه در دریافت پیشنهاد از هوش مصنوعی خطایی رخ داد. لطفا دوباره تلاش کنید.");
    } finally {
        setIsGenerating(false);
    }
  };
  
  const hasSolo = useMemo(() => tracks.some(t => t.isSolo), [tracks]);

  const bufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferOut = new ArrayBuffer(length);
    const view = new DataView(bufferOut);
    let pos = 0;

    const setUint16 = (data: number) => {
        view.setUint16(pos, data, true);
        pos += 2;
    }
    const setUint32 = (data: number) => {
        view.setUint32(pos, data, true);
        pos += 4;
    }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length of format data
    setUint16(1); // PCM - integer samples
    setUint16(numOfChan); // channels
    setUint32(buffer.sampleRate); // sample rate
    setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    const channels = Array.from({ length: numOfChan }, (_, i) => buffer.getChannelData(i));
    
    for (let i = 0; i < buffer.length; i++) {
        for (let chan = 0; chan < numOfChan; chan++) {
            let sample = Math.max(-1, Math.min(1, channels[chan][i]));
            sample = sample < 0 ? sample * 32768 : sample * 32767;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
    }
    return bufferOut;
  }

  const handleDownload = async () => {
      if (!audioBufferRef.current || isDownloading) return;
      setIsDownloading(true);
      try {
        const offlineContext = new OfflineAudioContext({
            numberOfChannels: audioBufferRef.current.numberOfChannels,
            length: audioBufferRef.current.length,
            sampleRate: audioBufferRef.current.sampleRate,
        });
        
        const offlineSource = offlineContext.createBufferSource();
        offlineSource.buffer = audioBufferRef.current;
        
        const offlineMasterGain = offlineContext.createGain();
        offlineMasterGain.gain.value = masterVolume / 100;
        offlineMasterGain.connect(offlineContext.destination);

        const offlineReverb = offlineContext.createConvolver();
        offlineReverb.buffer = createReverbImpulseResponse(offlineContext);
        offlineReverb.connect(offlineMasterGain);
        
        const soloTrack = tracks.find(t => t.isSolo);

        tracks.forEach(track => {
            const filter = offlineContext.createBiquadFilter();
            filter.type = track.filterType;
            filter.frequency.value = track.filterFreq;
            filter.Q.value = track.filterQ;

            const isEffectivelyMuted = track.isMuted || (soloTrack && soloTrack.id !== track.id);
            const targetVolume = isEffectivelyMuted ? 0 : track.volume / 100;
            const targetReverb = isEffectivelyMuted ? 0 : track.reverb / 100;

            const gain = offlineContext.createGain();
            gain.gain.value = targetVolume;
            
            const reverbGain = offlineContext.createGain();
            reverbGain.gain.value = targetReverb;

            offlineSource.connect(filter);
            filter.connect(gain).connect(offlineMasterGain);
            filter.connect(reverbGain).connect(offlineReverb);
        });
        
        offlineSource.start(0);
        const renderedBuffer = await offlineContext.startRendering();
        
        const wav = bufferToWav(renderedBuffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${audioFile.name.replace(/\.[^/.]+$/, "")}_remix.wav`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch(e) {
        console.error("Error during download:", e);
        alert("خطا در هنگام ساخت فایل دانلود. لطفاً دوباره تلاش کنید.");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">ویرایشگر موزیک</h1>
            <p className="text-gray-400">فایل: {audioFile.name}</p>
        </div>
        <div className="flex gap-2">
            <button onClick={onReset} className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">
              شروع مجدد
            </button>
             <button onClick={handleDownload} disabled={!isReady || isDownloading} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-800 disabled:cursor-not-allowed">
                {isDownloading ? <><SpinnerIcon className="w-5 h-5"/> در حال ساخت...</> : 'دانلود (WAV)'}
            </button>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-xl p-4 md:p-6 shadow-2xl">
        <div className="bg-gray-900/50 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex justify-center items-center gap-4">
                <button onClick={handlePlayPause} disabled={!isReady} className="p-3 bg-cyan-500 text-white rounded-full disabled:bg-gray-600 hover:bg-cyan-400 transition-all">
                    {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                </button>
                <button onClick={handleStop} disabled={!isReady || !isPlaying} className="p-3 bg-gray-700 text-white rounded-full disabled:opacity-50 hover:bg-gray-600 transition-all">
                    <StopIcon className="w-6 h-6"/>
                </button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-64" title="صدای کلی (Master Volume)">
                <label htmlFor="master-volume" className="text-sm text-gray-300">صدای کلی</label>
                <input
                    id="master-volume"
                    type="range"
                    min="0"
                    max="100"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    disabled={!isReady}
                />
                 <span className="text-sm text-gray-400 w-8 text-center">{masterVolume}</span>
            </div>
        </div>
        <div className="space-y-4">
          {tracks.map(track => (
            <TrackLane 
              key={track.id} 
              track={track}
              onTrackChange={handleTrackChange}
              hasSolo={hasSolo}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-4">پیشنهاد هوش مصنوعی برای ریمیکس</h2>
        <button onClick={handleGenerateSuggestion} disabled={isGenerating} className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-bold rounded-lg shadow-lg hover:bg-violet-700 transition-colors disabled:bg-violet-900 disabled:cursor-not-allowed">
          {isGenerating ? <><SpinnerIcon className="w-5 h-5" /><span>در حال دریافت...</span></> : <><SparklesIcon className="w-5 h-5" /><span>برایم ایده تولید کن</span></>}
        </button>
        {aiSuggestion && (
           <div className="mt-4 p-4 bg-gray-800 border border-violet-500/50 rounded-lg whitespace-pre-wrap">
              <p className="text-gray-300">{aiSuggestion}</p>
           </div>
        )}
      </div>

    </div>
  );
};

export default EditorScreen;
