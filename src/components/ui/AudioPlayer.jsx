import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

export function AudioPlayer({
  src,
  speechText, // fallback: synthesize reference speech using browser SpeechSynthesis
  title = 'Audio Playback',
  className = '',
  autoPlay = false,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (src && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.warn('Play error:', e));
      }
    } else if (speechText && window.speechSynthesis) {
      // Use browser text-to-speech for model reference
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 0.85; // slightly slower for speech therapy clarity
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else if (speechText) {
      togglePlay();
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 bg-slate-50 border border-[#E5E9F2] rounded-xl ${className}`}>
      {src && <audio ref={audioRef} src={src} preload="metadata" />}
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-[#5865E8] hover:bg-[#4752c4] text-white shadow-xs transition-colors shrink-0 cursor-pointer"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs font-medium text-[#172033] mb-1">
          <span className="truncate flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#5865E8]" />
            {title}
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            {src ? `${formatDuration(currentTime)} / ${formatDuration(duration || 3)}` : 'Model Voice'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-[#5865E8] h-full transition-all duration-100 rounded-full"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : isPlaying ? 100 : 0}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={restart}
        title="Replay"
        className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors shrink-0 cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
}
