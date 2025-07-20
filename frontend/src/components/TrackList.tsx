import { Play, Pause, Heart, HeartOff, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { tracksAPI } from "@/lib/api";
import { useState } from "react";

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

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onTrackSelect: (track: Track) => void;
  onPlayPause: () => void;
  onTrackUpdate?: (trackId: string, updates: Partial<Track>) => void;
}

export const TrackList = ({ 
  tracks, 
  currentTrack, 
  isPlaying, 
  onTrackSelect, 
  onPlayPause,
  onTrackUpdate
}: TrackListProps) => {
  const { token } = useAuth();
  const [favoriteStates, setFavoriteStates] = useState<Record<string, boolean>>({});

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleFavorite = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;

    try {
      const result = await tracksAPI.toggleFavorite(track.id, token);
      setFavoriteStates(prev => ({
        ...prev,
        [track.id]: result.isFavorite
      }));
      

      if (onTrackUpdate) {
        onTrackUpdate(track.id, { isFavorite: result.isFavorite });
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  const isFavorite = (track: Track) => {
    return favoriteStates[track.id] ?? track.isFavorite ?? false;
  };

  return (
    <div className="space-y-1">
      {tracks.map((track, index) => {
        const isCurrentTrack = currentTrack?.id === track.id;
        const trackIsFavorite = isFavorite(track);
        
        return (
          <div 
            key={track.id}
            className="group flex items-center gap-4 p-2 rounded-md hover:bg-accent cursor-pointer"
            onClick={() => onTrackSelect(track)}
          >
            {}
            <div className="w-6 flex items-center justify-center">
              {isCurrentTrack ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-6 h-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayPause();
                  }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </Button>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground group-hover:hidden">
                    {index + 1}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-6 h-6 p-0 hidden group-hover:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTrackSelect(track);
                    }}
                  >
                    <Play size={14} />
                  </Button>
                </>
              )}
            </div>

            {}
            <img 
              src={track.image} 
              alt={track.album}
              className="w-10 h-10 rounded object-cover"
            />

            {}
            <div className="flex-1 min-w-0">
              <div className={`font-medium truncate ${isCurrentTrack ? 'text-primary' : 'text-foreground'}`}>
                {track.title}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {track.artist}
              </div>
            </div>

            {}
            <div className="hidden md:block w-48 text-sm text-muted-foreground truncate">
              {track.album}
            </div>

            {}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-8 h-8 p-0"
                onClick={(e) => handleToggleFavorite(track, e)}
              >
                {trackIsFavorite ? (
                  <Heart className="text-red-500 fill-red-500" size={14} />
                ) : (
                  <HeartOff size={14} />
                )}
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <MoreHorizontal size={14} />
              </Button>
            </div>

            {}
            <div className="w-12 text-sm text-muted-foreground text-right">
              {formatTime(track.duration)}
            </div>
          </div>
        );
      })}
    </div>
  );
};