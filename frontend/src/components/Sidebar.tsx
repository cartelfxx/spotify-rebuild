import { Home, Search, Library, Plus, Heart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { playlistsAPI, Playlist } from "@/lib/api";
import { useState, useEffect } from "react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const { token } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchPlaylists();
    }
  }, [token]);

  const fetchPlaylists = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await playlistsAPI.getAll(token);
      if (response.playlists) {
        setPlaylists(response.playlists);
      }
    } catch (error) {
      console.error('Çalma listelerini getirme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!token) return;
    
    const name = prompt('Çalma listesi adını girin:');
    if (!name) return;

    try {
      await playlistsAPI.create(name, token);
      fetchPlaylists(); // Refresh playlists
    } catch (error) {
      console.error('Çalma listesi oluşturma hatası:', error);
      alert('Çalma listesi oluşturulamadı');
    }
  };

  const menuItems = [
    { id: "home", label: "Ana Sayfa", icon: Home },
    { id: "search", label: "Ara", icon: Search },
    { id: "library", label: "Kütüphanen", icon: Library },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      {}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Spotify MVP</h1>
      </div>

      {}
      <nav className="px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-left",
                activeTab === item.id && "bg-secondary text-primary"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={20} />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {}
      <div className="px-3 mt-6">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3"
          onClick={handleCreatePlaylist}
        >
          <Plus size={20} />
          Çalma Listesi Oluştur
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3"
          onClick={() => onTabChange("favorites")}
        >
          <Heart size={20} />
          Beğenilen Şarkılar
        </Button>
      </div>

      {}
      <div className="flex-1 px-3 mt-4 overflow-y-auto">
        <div className="space-y-1">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : playlists.length > 0 ? (
            playlists.map((playlist) => (
              <Button
                key={playlist.id}
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => onTabChange(`playlist-${playlist.id}`)}
              >
                {playlist.name}
              </Button>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">Henüz çalma listesi yok</p>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="px-3 mt-4 pb-4">
        <Link to="/admin">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
            <Settings size={20} />
            Yönetici Paneli
          </Button>
        </Link>
      </div>
    </div>
  );
};