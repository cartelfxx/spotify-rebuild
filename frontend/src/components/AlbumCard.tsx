import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Album {
  id: string;
  title: string;
  artist: string;
  image: string;
  year?: number;
  tracks?: any[];
  trackCount?: number;
}

interface AlbumCardProps {
  album: Album;
  onPlay: (albumId: string) => void;
}

export const AlbumCard = ({ album, onPlay }: AlbumCardProps) => {
  const navigate = useNavigate();

  const handleAlbumClick = () => {
    navigate(`/album/${album.id}`);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay(album.id);
  };

  return (
    <div 
      className="group relative bg-card rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
      onClick={handleAlbumClick}
    >
      <div className="relative mb-4">
        <img 
          src={album.image} 
          alt={album.title}
          className="w-full aspect-square rounded object-cover"
        />
        <Button 
          variant="outline" 
          size="sm" 
          className="absolute bottom-2 right-2 rounded-full w-10 h-10 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handlePlayClick}
        >
          <Play size={16} />
        </Button>
      </div>
      
      <div className="min-w-0">
        <h3 className="font-medium text-foreground truncate">
          {album.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate">
          {album.artist}
        </p>
        {album.year && (
          <p className="text-xs text-muted-foreground mt-1">
            {album.year}
          </p>
        )}
      </div>
    </div>
  );
};