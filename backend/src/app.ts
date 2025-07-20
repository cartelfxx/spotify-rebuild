import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection, initDatabase } from './config/database';


import authRoutes from './routes/auth';
import tracksRoutes from './routes/tracks';
import albumsRoutes from './routes/albums';
import playlistsRoutes from './routes/playlists';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Spotify Clone API çalışıyor' });
});


app.use('/api/auth', authRoutes);
app.use('/api/tracks', tracksRoutes);
app.use('/api/albums', albumsRoutes);
app.use('/api/playlists', playlistsRoutes);


app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Hata:', err);
  
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: 'Dosya yükleme hatası' });
  }
  
  res.status(500).json({ message: 'Sunucu içi hata' });
});


app.use((req, res) => {
  res.status(404).json({ message: 'Rota bulunamadı' });
});


const startServer = async () => {
  try {

    await testConnection();
    

    await initDatabase();
    

    app.listen(PORT, () => {
      console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
      console.log(`📡 API adresi: http://localhost:${PORT}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`📁 Yüklemeler: http://localhost:${PORT}/uploads`);
    });
  } catch (error) {
    console.error('Sunucu başlatılamadı:', error);
    process.exit(1);
  }
};

startServer();

export default app; 