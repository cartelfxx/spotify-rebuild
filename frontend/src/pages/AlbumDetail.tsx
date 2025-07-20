import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, Heart, HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { albumsAPI, tracksAPI, Track, Album } from "@/lib/api";

const AlbumDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAlbum();
    }
  }, [id, token]);

  const fetchAlbum = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await albumsAPI.getById(id!, token);
      if (response.album) {
        setAlbum(response.album);
      } else {
        setError('Albüm bulunamadı');
      }
    } catch (err) {
      console.error('Albüm getirme hatası:', err);
      setError('Albüm yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSelect = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePlayAlbum = () => {
    if (album?.tracks && album.tracks.length > 0) {
      handleTrackSelect(album.tracks[0]);
    }
  };

  const handleToggleFavorite = async (track: Track) => {
    if (!token) return;
    
    try {
      await tracksAPI.toggleFavorite(track.id, token);

      fetchAlbum();
    } catch (error) {
      console.error('Favori değiştirme hatası:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Albüm yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Albüm bulunamadı'}</p>
          <Button onClick={() => navigate('/')}>
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {}
      <div className="relative h-96 bg-gradient-to-b from-primary/20 to-background">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-end p-8">
          <div className="flex items-end gap-6">
            <img 
              src={album.image} 
              alt={album.title}
              className="w-48 h-48 rounded-lg shadow-2xl object-cover"
            />
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-2">{album.title}</h1>
              <p className="text-xl mb-4">{album.artist}</p>
              <p className="text-sm opacity-80">
                {album.year} • {album.tracks?.length || 0} şarkı
              </p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="p-8">
        {}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Geri
          </Button>
          
          <Button 
            onClick={handlePlayAlbum}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Play size={20} className="mr-2" />
            Albümü Çal
          </Button>
        </div>

        {}
        <div className="space-y-1">
          {album.tracks && album.tracks.length > 0 ? (
            album.tracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              
              return (
                <div 
                  key={track.id}
                  className="group flex items-center gap-4 p-3 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => handleTrackSelect(track)}
                >
                  {}
                  <div className="w-8 flex items-center justify-center">
                    {isCurrentTrack ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-8 h-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPause();
                        }}
                      >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      </Button>
                    ) : (
                      <>
                        <span className="text-sm text-muted-foreground group-hover:hidden">
                          {index + 1}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-8 h-8 p-0 hidden group-hover:flex"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackSelect(track);
                          }}
                        >
                          <Play size={16} />
                        </Button>
                      </>
                    )}
                  </div>

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
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-8 h-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(track);
                      }}
                    >
                      {track.isFavorite ? (
                        <Heart className="text-red-500 fill-red-500" size={16} />
                      ) : (
                        <HeartOff size={16} />
                      )}
                    </Button>
                  </div>

                  {}
                  <div className="w-12 text-sm text-muted-foreground text-right">
                    {formatTime(track.duration)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Bu albümde şarkı yok</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlbumDetail; 