import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();


router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const cartelcik = (req as any).user.id;

    const connection = await pool.getConnection();

    const [playlists] = await connection.execute(`
      SELECT 
        p.id,
        p.name,
        p.created_at,
        COUNT(pt.track_id) as track_count
      FROM playlists p
      LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
      WHERE p.user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [cartelcik]);

    const transformedPlaylists = (playlists as any[]).map(playlist => ({
      id: playlist.id.toString(),
      name: playlist.name,
      trackCount: playlist.track_count,
      createdAt: playlist.created_at,
    }));

    connection.release();

    res.json({ playlists: transformedPlaylists });
  } catch (error) {
    console.error('Çalma listelerini getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const cartelcik = (req as any).user.id;

    if (!name) {
      return res.status(400).json({ message: 'Playlist name is required' });
    }

    const connection = await pool.getConnection();

    const [result] = await connection.execute(
      'INSERT INTO playlists (name, user_id) VALUES (?, ?)',
      [name, cartelcik]
    );

    const playlistId = (result as any).insertId;


    const [playlists] = await connection.execute(
      'SELECT * FROM playlists WHERE id = ?',
      [playlistId]
    );

    const playlist = (playlists as any[])[0];

    connection.release();

    res.status(201).json({
      message: 'Çalma listesi başarıyla oluşturuldu',
      playlist: {
        id: playlist.id.toString(),
        name: playlist.name,
        tracks: [],
        trackCount: 0,
        createdAt: playlist.created_at,
      },
    });
  } catch (error) {
    console.error('Çalma listesi oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.post('/:id/tracks', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { trackId } = req.body;
    const cartelcik = (req as any).user.id;

    if (!trackId) {
      return res.status(400).json({ message: 'Track ID is required' });
    }

    const connection = await pool.getConnection();


    const [playlists] = await connection.execute(
      'SELECT id FROM playlists WHERE id = ? AND user_id = ?',
      [id, cartelcik]
    );

    if ((playlists as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Playlist not found' });
    }


    const [tracks] = await connection.execute(
      'SELECT id FROM tracks WHERE id = ?',
      [trackId]
    );

    if ((tracks as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Şarkı bulunamadı' });
    }


    const [existing] = await connection.execute(
      'SELECT id FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
      [id, trackId]
    );

    if ((existing as any[]).length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Track is already in playlist' });
    }


    const [positions] = await connection.execute(
      'SELECT MAX(position) as max_position FROM playlist_tracks WHERE playlist_id = ?',
      [id]
    );

    const nextPosition = ((positions as any[])[0].max_position || 0) + 1;


    await connection.execute(
      'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)',
      [id, trackId, nextPosition]
    );

    connection.release();

    res.json({ message: 'Şarkı çalma listesine eklendi' });
  } catch (error) {
    console.error('Çalma listesine şarkı ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.delete('/:id/tracks/:trackId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, trackId } = req.params;
    const cartelcik = (req as any).user.id;

    const connection = await pool.getConnection();


    const [playlists] = await connection.execute(
      'SELECT id FROM playlists WHERE id = ? AND user_id = ?',
      [id, cartelcik]
    );

    if ((playlists as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Playlist not found' });
    }


    await connection.execute(
      'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
      [id, trackId]
    );

    connection.release();

    res.json({ message: 'Şarkı çalma listesinden kaldırıldı' });
  } catch (error) {
    console.error('Çalma listesinden şarkı kaldırma hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cartelcik = (req as any).user.id;

    const connection = await pool.getConnection();


    const [playlists] = await connection.execute(`
      SELECT id, name, created_at
      FROM playlists
      WHERE id = ? AND user_id = ?
    `, [id, cartelcik]);

    const playlist = (playlists as any[])[0];

    if (!playlist) {
      connection.release();
      return res.status(404).json({ message: 'Çalma listesi bulunamadı' });
    }


    const [tracks] = await connection.execute(`
      SELECT 
        t.id,
        t.title,
        t.artist,
        t.duration,
        t.audio_url,
        t.image_url,
        a.title as album_title,
        a.image_url as album_image,
        pt.position,
        CASE WHEN uf.user_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM playlist_tracks pt
      JOIN tracks t ON pt.track_id = t.id
      LEFT JOIN albums a ON t.album_id = a.id
      LEFT JOIN user_favorites uf ON t.id = uf.track_id AND uf.user_id = ?
      WHERE pt.playlist_id = ?
      ORDER BY pt.position
    `, [cartelcik, id]);

    const transformedTracks = (tracks as any[]).map(track => ({
      id: track.id.toString(),
      title: track.title,
      artist: track.artist,
      album: track.album_title || 'Unknown Album',
      image: track.image_url || track.album_image || '/default-album.jpg',
      duration: track.duration,
      audioUrl: track.audio_url,
      isFavorite: track.is_favorite === 1,
    }));

    const transformedPlaylist = {
      id: playlist.id.toString(),
      name: playlist.name,
      tracks: transformedTracks,
      trackCount: transformedTracks.length,
      createdAt: playlist.created_at,
    };

    connection.release();

    res.json({ playlist: transformedPlaylist, tracks: transformedTracks });
  } catch (error) {
    console.error('Çalma listesi getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const cartelcik = (req as any).user.id;

    if (!name) {
      return res.status(400).json({ message: 'Playlist name is required' });
    }

    const connection = await pool.getConnection();


    const [playlists] = await connection.execute(
      'SELECT id FROM playlists WHERE id = ? AND user_id = ?',
      [id, cartelcik]
    );

    if ((playlists as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Çalma listesi bulunamadı' });
    }


    await connection.execute(
      'UPDATE playlists SET name = ? WHERE id = ?',
      [name, id]
    );

    const [updatedPlaylists] = await connection.execute(
      'SELECT * FROM playlists WHERE id = ?',
      [id]
    );

    const updatedPlaylist = (updatedPlaylists as any[])[0];

    const transformedPlaylist = {
      id: updatedPlaylist.id.toString(),
      name: updatedPlaylist.name,
      tracks: [],
      trackCount: 0,
      createdAt: updatedPlaylist.created_at,
    };

    connection.release();

    res.json({
      message: 'Çalma listesi başarıyla güncellendi',
      playlist: transformedPlaylist,
    });
  } catch (error) {
    console.error('Çalma listesi güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cartelcik = (req as any).user.id;

    const connection = await pool.getConnection();


    const [playlists] = await connection.execute(
      'SELECT id FROM playlists WHERE id = ? AND user_id = ?',
      [id, cartelcik]
    );

    if ((playlists as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Çalma listesi bulunamadı' });
    }


    await connection.execute('DELETE FROM playlists WHERE id = ?', [id]);

    connection.release();

    res.json({ message: 'Çalma listesi başarıyla silindi' });
  } catch (error) {
    console.error('Çalma listesi silme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});

export default router; 