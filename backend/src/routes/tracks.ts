import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { audioUpload, getFileUrl } from '../config/upload';

const router = Router();


router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    const cartelcik = (req as any).user?.id;

    const connection = await pool.getConnection();

    let query = `
      SELECT 
        t.id,
        t.title,
        t.artist,
        t.duration,
        t.audio_url,
        t.image_url,
        a.title as album_title,
        a.id as album_id,
        a.image_url as album_image,
        a.year as album_year,
        CASE WHEN uf.user_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM tracks t
      LEFT JOIN albums a ON t.album_id = a.id
      LEFT JOIN user_favorites uf ON t.id = uf.track_id AND uf.user_id = ?
    `;

    const params: any[] = [cartelcik || 0];

    if (search) {
      query += ` WHERE t.title LIKE ? OR t.artist LIKE ? OR a.title LIKE ?`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [tracks] = await connection.execute(query, params);


    const transformedTracks = (tracks as any[]).map(track => ({
      id: track.id.toString(),
      title: track.title,
      artist: track.artist,
      album: track.album_title || 'Bilinmeyen Albüm',
      image: track.image_url || track.album_image || '/default-album.jpg',
      duration: track.duration,
      audioUrl: track.audio_url,
      albumId: track.album_id,
      isFavorite: track.is_favorite === 1,
    }));

    connection.release();

    res.json({ tracks: transformedTracks });
  } catch (error) {
    console.error('Şarkıları getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.get('/user/favorites', authenticateToken, async (req: Request, res: Response) => {
  try {
    const cartelcik = (req as any).user.id;

    const connection = await pool.getConnection();

    const [favorites] = await connection.execute(`
      SELECT 
        t.id,
        t.title,
        t.artist,
        t.duration,
        t.audio_url,
        t.image_url,
        a.title as album_title,
        a.image_url as album_image
      FROM user_favorites uf
      JOIN tracks t ON uf.track_id = t.id
      LEFT JOIN albums a ON t.album_id = a.id
      WHERE uf.user_id = ?
      ORDER BY uf.created_at DESC
    `, [cartelcik]);

    const transformedFavorites = (favorites as any[]).map(track => ({
      id: track.id.toString(),
      title: track.title,
      artist: track.artist,
      album: track.album_title || 'Bilinmeyen Albüm',
      image: track.image_url || track.album_image || '/default-album.jpg',
      duration: track.duration,
      audioUrl: track.audio_url,
      isFavorite: true,
    }));

    connection.release();

    res.json({ tracks: transformedFavorites });
  } catch (error) {
    console.error('Favorileri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cartelcik = (req as any).user?.id;

    const connection = await pool.getConnection();

    const [tracks] = await connection.execute(`
      SELECT 
        t.id,
        t.title,
        t.artist,
        t.duration,
        t.audio_url,
        t.image_url,
        a.title as album_title,
        a.id as album_id,
        a.image_url as album_image,
        a.year as album_year,
        CASE WHEN uf.user_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM tracks t
      LEFT JOIN albums a ON t.album_id = a.id
      LEFT JOIN user_favorites uf ON t.id = uf.track_id AND uf.user_id = ?
      WHERE t.id = ?
    `, [cartelcik || 0, id]);

    const track = (tracks as any[])[0];

    if (!track) {
      connection.release();
      return res.status(404).json({ message: 'Şarkı bulunamadı' });
    }

    const transformedTrack = {
      id: track.id.toString(),
      title: track.title,
      artist: track.artist,
      album: track.album_title || 'Bilinmeyen Albüm',
      image: track.image_url || track.album_image || '/default-album.jpg',
      duration: track.duration,
      audioUrl: track.audio_url,
      albumId: track.album_id,
      isFavorite: track.is_favorite === 1,
    };

    connection.release();

    res.json({ track: transformedTrack });
  } catch (error) {
    console.error('Şarkı getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.post('/', authenticateToken, audioUpload.single('audio'), async (req: Request, res: Response) => {
  try {
    const { title, artist, albumId, duration } = req.body;
    const audioFile = (req as any).file;

    if (!title || !artist || !audioFile) {
      return res.status(400).json({ message: 'Başlık, sanatçı ve ses dosyası gereklidir' });
    }

    const connection = await pool.getConnection();


    const audioUrl = getFileUrl(audioFile.filename, 'audio');


    const [result] = await connection.execute(
      'INSERT INTO tracks (title, artist, album_id, duration, audio_url) VALUES (?, ?, ?, ?, ?)',
      [title, artist, albumId || null, parseInt(duration) || 0, audioUrl]
    );

    const trackId = (result as any).insertId;


    const [tracks] = await connection.execute(
      'SELECT * FROM tracks WHERE id = ?',
      [trackId]
    );

    const track = (tracks as any[])[0];

    connection.release();

    res.status(201).json({
      message: 'Şarkı başarıyla yüklendi',
      track: {
        id: track.id.toString(),
        title: track.title,
        artist: track.artist,
        album: 'Bilinmeyen Albüm',
        image: '/default-album.jpg',
        duration: track.duration,
        audioUrl: track.audio_url,
      },
    });
  } catch (error) {
    console.error('Şarkı yükleme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.post('/:id/favorite', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cartelcik = (req as any).user.id;

    const connection = await pool.getConnection();


    const [existing] = await connection.execute(
      'SELECT id FROM user_favorites WHERE user_id = ? AND track_id = ?',
      [cartelcik, id]
    );

    if ((existing as any[]).length > 0) {

      await connection.execute(
        'DELETE FROM user_favorites WHERE user_id = ? AND track_id = ?',
        [cartelcik, id]
      );
      connection.release();
      return res.json({ message: 'Favorilerden kaldırıldı', isFavorite: false });
    } else {

      await connection.execute(
        'INSERT INTO user_favorites (user_id, track_id) VALUES (?, ?)',
        [cartelcik, id]
      );
      connection.release();
      return res.json({ message: 'Favorilere eklendi', isFavorite: true });
    }
  } catch (error) {
    console.error('Favori değiştirme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});

export default router; 