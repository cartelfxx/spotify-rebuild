import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, HeartOff, Repeat, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { tracksAPI } from "@/lib/api";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  image: string;
  duration: number;
  audioUrl: string;
  isFavorite?: boolean;
}

interface MusicPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const getAudioUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:3001${url}`;
};

export const MusicPlayer = ({ 
  currentTrack, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious 
}: MusicPlayerProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(0);
  const [volume, setVolume] = useState([80]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [seeking, setSeeking] = useState(false);
  const { token } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume[0] / 100;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    setCurrentTime(0);
    setActualDuration(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    setIsFavorite(!!currentTrack?.isFavorite);
  }, [currentTrack]);

  const handleToggleFavorite = async () => {
    if (!currentTrack || !token) return;
    try {
      const result = await tracksAPI.toggleFavorite(currentTrack.id, token);
      setIsFavorite(result.isFavorite);
    } catch (e) {

    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  const displayDuration = actualDuration > 0 ? actualDuration : currentTrack?.duration || 0;

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 z-50">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img 
            src={currentTrack.image} 
            alt={currentTrack.album}
            className="w-14 h-14 rounded object-cover"
          />
          <div className="min-w-0">
            <div className="font-medium text-foreground truncate">
              {currentTrack.title}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {currentTrack.artist}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleToggleFavorite} aria-label="Toggle Favorite">
            {isFavorite ? <Heart className="text-red-500 fill-red-500" size={16} /> : <HeartOff size={16} />}
          </Button>
        </div>

        {}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Shuffle size={16} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onPrevious}>
              <SkipBack size={16} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full w-8 h-8 p-0"
              onClick={onPlayPause}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onNext}>
              <SkipForward size={16} />
            </Button>
            <Button variant="ghost" size="sm">
              <Repeat size={16} />
            </Button>
          </div>
          {}
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-muted-foreground">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              onValueChange={(value) => {
                setCurrentTime(value[0]);
                if (audioRef.current && !seeking) {
                  audioRef.current.currentTime = value[0];
                }
              }}
              onValueCommit={(value) => {
                setSeeking(false);
                if (audioRef.current) {
                  audioRef.current.currentTime = value[0];
                }
              }}
              onPointerDown={() => setSeeking(true)}
              max={displayDuration}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground">
              {formatTime(displayDuration)}
            </span>
          </div>
          {}
          <audio
            ref={audioRef}
            src={getAudioUrl(currentTrack.audioUrl)}
            autoPlay={isPlaying}
            onTimeUpdate={() => {
              if (!audioRef.current) return;
              setCurrentTime(audioRef.current.currentTime);
            }}
            onEnded={onNext}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
                setActualDuration(audioRef.current.duration);
              }
            }}
            onCanPlay={() => {
              if (audioRef.current && actualDuration === 0) {
                setActualDuration(audioRef.current.duration);
              }
            }}
          />
        </div>

        {}
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
          <Volume2 size={16} />
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
};