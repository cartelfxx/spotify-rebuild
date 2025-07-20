import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MusicPlayer } from "@/components/MusicPlayer";
import { AlbumCard } from "@/components/AlbumCard";
import { SearchBar } from "@/components/SearchBar";
import { TrackList } from "@/components/TrackList";
import { useAuth } from "@/hooks/useAuth";
import { tracksAPI, albumsAPI, playlistsAPI, Track, Album, Playlist } from "@/lib/api";

const Index = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);


        const tracksResponse = await tracksAPI.getAll(undefined, 50, 0, token || undefined);
        if (tracksResponse.tracks) {
          setTracks(tracksResponse.tracks);
        }


        const albumsResponse = await albumsAPI.getAll(20, 0, token || undefined);
        if (albumsResponse.albums) {
          setAlbums(albumsResponse.albums);
        }


        if (token) {
          const playlistsResponse = await playlistsAPI.getAll(token);
          if (playlistsResponse.playlists) {
            setPlaylists(playlistsResponse.playlists);
          }


          const favoritesResponse = await tracksAPI.getFavorites(token);
          if (favoritesResponse.tracks) {
            setFavoriteTracks(favoritesResponse.tracks);
          }
        }
      } catch (err) {
        console.error('Veri yükleme hatası:', err);
        setError('Müzik verileri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);


  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, token]);

  const performSearch = async () => {
    if (!searchQuery.trim() || !token) return;
    
    try {
      setSearchLoading(true);
      const response = await tracksAPI.getAll(searchQuery, 50, 0, token);
      if (response.tracks) {
        setSearchResults(response.tracks);
      }
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };


  useEffect(() => {
    if (activeTab.startsWith('playlist-')) {
      const playlistId = activeTab.replace('playlist-', '');
      const playlist = playlists.find(p => p.id === playlistId);
      setCurrentPlaylist(playlist || null);
    } else {
      setCurrentPlaylist(null);
    }
  }, [activeTab, playlists]);


  const filteredTracks = searchQuery 
    ? tracks.filter(track => 
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.album.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tracks;

  const handleTrackSelect = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id);
    const nextTrack = tracks[currentIndex + 1] || tracks[0];
    setCurrentTrack(nextTrack);
  };

  const handlePrevious = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id);
    const prevTrack = tracks[currentIndex - 1] || tracks[tracks.length - 1];
    setCurrentTrack(prevTrack);
  };

  const handleAlbumPlay = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (album && album.tracks && album.tracks.length > 0) {
      handleTrackSelect(album.tracks[0]);
    }
  };

  const handleTrackUpdate = (trackId: string, updates: Partial<Track>) => {

    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    ));
    
    setFavoriteTracks(prev => {
      if (updates.isFavorite === false) {
        return prev.filter(track => track.id !== trackId);
      } else if (updates.isFavorite === true) {
        const track = tracks.find(t => t.id === trackId);
        return track ? [...prev, { ...track, ...updates }] : prev;
      }
      return prev;
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Müzik yükleniyor...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-primary hover:underline"
            >
              Tekrar dene
            </button>
          </div>
        </div>
      );
    }


    if (activeTab.startsWith('playlist-') && currentPlaylist) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{currentPlaylist.name}</h1>
            <p className="text-muted-foreground">{currentPlaylist.trackCount} şarkı</p>
          </div>
          
          {currentPlaylist.tracks && currentPlaylist.tracks.length > 0 ? (
            <TrackList 
              tracks={currentPlaylist.tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onTrackSelect={handleTrackSelect}
              onPlayPause={handlePlayPause}
              onTrackUpdate={handleTrackUpdate}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Bu çalma listesinde şarkı yok</p>
            </div>
          )}
        </div>
      );
    }

    switch (activeTab) {
      case "search":
        return (
          <div className="space-y-6">
            <SearchBar onSearch={setSearchQuery} />
            {searchQuery ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">Arama Sonuçları</h2>
                {searchLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Aranıyor...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <TrackList 
                    tracks={searchResults}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    onTrackSelect={handleTrackSelect}
                    onPlayPause={handlePlayPause}
                    onTrackUpdate={handleTrackUpdate}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">"{searchQuery}" için şarkı bulunamadı</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-2">Müzik ara</h2>
                <p className="text-muted-foreground">Favori şarkılarını, sanatçılarını ve albümlerini bul</p>
              </div>
            )}
          </div>
        );
      
      case "favorites":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Beğenilen Şarkılar</h1>
            {favoriteTracks.length > 0 ? (
              <TrackList 
                tracks={favoriteTracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onTrackSelect={handleTrackSelect}
                onPlayPause={handlePlayPause}
                onTrackUpdate={handleTrackUpdate}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Henüz beğenilen şarkı yok</p>
              </div>
            )}
          </div>
        );
      
      case "library":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Kütüphanen</h1>
            
            {}
            <div>
              <h2 className="text-2xl font-bold mb-4">Albümler</h2>
              {albums.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {albums.map(album => (
                    <AlbumCard 
                      key={album.id} 
                      album={album} 
                      onPlay={handleAlbumPlay} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Kütüphanende henüz albüm yok</p>
                </div>
              )}
            </div>

            {}
            <div>
              <h2 className="text-2xl font-bold mb-4">Çalma Listeleri</h2>
              {playlists.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {playlists.map(playlist => (
                    <div 
                      key={playlist.id}
                      className="bg-card p-4 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => setActiveTab(`playlist-${playlist.id}`)}
                    >
                      <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-secondary rounded-md mb-3 flex items-center justify-center">
                        <span className="text-2xl">🎵</span>
                      </div>
                      <h3 className="font-medium truncate">{playlist.name}</h3>
                      <p className="text-sm text-muted-foreground">{playlist.trackCount} şarkı</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Kütüphanende henüz çalma listesi yok</p>
                </div>
              )}
            </div>
          </div>
        );
      
      default: // home
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">İyi akşamlar</h1>
              <p className="text-muted-foreground">Dinlemek için bir şeyler bulalım</p>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-4">Son Çalınanlar</h2>
              {albums.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {albums.slice(0, 5).map(album => (
                    <AlbumCard 
                      key={album.id} 
                      album={album} 
                      onPlay={handleAlbumPlay} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Albüm bulunamadı</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Popüler Şarkılar</h2>
              {tracks.length > 0 ? (
                <TrackList 
                  tracks={tracks.slice(0, 6)}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onTrackSelect={handleTrackSelect}
                  onPlayPause={handlePlayPause}
                  onTrackUpdate={handleTrackUpdate}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Şarkı bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      {}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto p-6 pb-24">
          {renderContent()}
        </main>
      </div>

      {}
      <MusicPlayer 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
  );
};

export default Index;
