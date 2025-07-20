import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { imageUpload, getFileUrl } from '../config/upload';

const router = Router();


router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const connection = await pool.getConnection();

    const [albums] = await connection.execute(`
      SELECT 
        a.id,
        a.title,
        a.artist,
        a.image_url,
        a.year,
        COUNT(t.id) as track_count
      FROM albums a
      LEFT JOIN tracks t ON a.id = t.album_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit as string), parseInt(offset as string)]);

    const transformedAlbums = (albums as any[]).map(album => ({
      id: album.id.toString(),
      title: album.title,
      artist: album.artist,
      image: album.image_url || '/default-album.jpg',
      year: album.year,
      trackCount: album.track_count,
    }));

    connection.release();

    res.json({ albums: transformedAlbums });
  } catch (error) {
    console.error('Albümleri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cartelcik = (req as any).user?.id;

    const connection = await pool.getConnection();


    const [albums] = await connection.execute(`
      SELECT 
        a.id,
        a.title,
        a.artist,
        a.image_url,
        a.year
      FROM albums a
      WHERE a.id = ?
    `, [id]);

    const album = (albums as any[])[0];

    if (!album) {
      connection.release();
      return res.status(404).json({ message: 'Albüm bulunamadı' });
    }


    const [tracks] = await connection.execute(`
      SELECT 
        t.id,
        t.title,
        t.artist,
        t.duration,
        t.audio_url,
        t.image_url,
        CASE WHEN uf.user_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM tracks t
      LEFT JOIN user_favorites uf ON t.id = uf.track_id AND uf.user_id = ?
      WHERE t.album_id = ?
      ORDER BY t.id
    `, [cartelcik || 0, id]);

    const transformedTracks = (tracks as any[]).map(track => ({
      id: track.id.toString(),
      title: track.title,
      artist: track.artist,
      album: album.title,
      image: track.image_url || album.image_url || '/default-album.jpg',
      duration: track.duration,
      audioUrl: track.audio_url,
      isFavorite: track.is_favorite === 1,
    }));

    const transformedAlbum = {
      id: album.id.toString(),
      title: album.title,
      artist: album.artist,
      image: album.image_url || '/default-album.jpg',
      year: album.year,
      tracks: transformedTracks,
    };

    connection.release();

    res.json({ album: transformedAlbum, tracks: transformedTracks });
  } catch (error) {
    console.error('Albüm getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.post('/', authenticateToken, imageUpload.single('image'), async (req: Request, res: Response) => {
  try {
    const { title, artist, year } = req.body;
    const imageFile = (req as any).file;

    if (!title || !artist) {
      return res.status(400).json({ message: 'Title and artist are required' });
    }

    const connection = await pool.getConnection();

    let imageUrl = null;
    if (imageFile) {

      imageUrl = getFileUrl(imageFile.filename, 'image');
    }


    const [result] = await connection.execute(
      'INSERT INTO albums (title, artist, image_url, year) VALUES (?, ?, ?, ?)',
      [title, artist, imageUrl, year || null]
    );

    const albumId = (result as any).insertId;


    const [albums] = await connection.execute(
      'SELECT * FROM albums WHERE id = ?',
      [albumId]
    );

    const album = (albums as any[])[0];

    const transformedAlbum = {
      id: album.id.toString(),
      title: album.title,
      artist: album.artist,
      image: album.image_url || '/default-album.jpg',
      year: album.year,
      tracks: [],
    };

    connection.release();

    res.status(201).json({
      message: 'Albüm başarıyla oluşturuldu',
      album: transformedAlbum,
    });
  } catch (error) {
    console.error('Albüm oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.put('/:id', authenticateToken, imageUpload.single('image'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, artist, year } = req.body;
    const imageFile = (req as any).file;

    const connection = await pool.getConnection();


    const [existingAlbums] = await connection.execute(
      'SELECT * FROM albums WHERE id = ?',
      [id]
    );

    if ((existingAlbums as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Albüm bulunamadı' });
    }

    let imageUrl = null;
    if (imageFile) {

      imageUrl = getFileUrl(imageFile.filename, 'image');
    }


    const updateFields = [];
    const updateValues = [];

    if (title) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (artist) {
      updateFields.push('artist = ?');
      updateValues.push(artist);
    }
    if (year !== undefined) {
      updateFields.push('year = ?');
      updateValues.push(year);
    }
    if (imageUrl) {
      updateFields.push('image_url = ?');
      updateValues.push(imageUrl);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await connection.execute(
        `UPDATE albums SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }


    const [albums] = await connection.execute(
      'SELECT * FROM albums WHERE id = ?',
      [id]
    );

    const album = (albums as any[])[0];

    const transformedAlbum = {
      id: album.id.toString(),
      title: album.title,
      artist: album.artist,
      image: album.image_url || '/default-album.jpg',
      year: album.year,
    };

    connection.release();

    res.json({
      message: 'Albüm başarıyla güncellendi',
      album: transformedAlbum,
    });
  } catch (error) {
    console.error('Albüm güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});


router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();


    const [existingAlbums] = await connection.execute(
      'SELECT * FROM albums WHERE id = ?',
      [id]
    );

    if ((existingAlbums as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Albüm bulunamadı' });
    }


    await connection.execute('DELETE FROM albums WHERE id = ?', [id]);

    connection.release();

    res.json({ message: 'Albüm başarıyla silindi' });
  } catch (error) {
    console.error('Albüm silme hatası:', error);
    res.status(500).json({ message: 'Sunucu içi hata' });
  }
});

export default router;  