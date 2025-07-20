const API_BASE_URL = 'http://localhost:3001/api';


export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  image: string;
  duration: number;
  audioUrl: string;
  isFavorite?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  image: string;
  year?: number;
  tracks?: Track[];
  trackCount?: number;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  trackCount: number;
  createdAt: string;
}


export const authAPI = {
  register: async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, email, password }),
    });
    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  getCurrentUser: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    return response.json();
  },
};


export const tracksAPI = {
  getAll: async (search?: string, limit = 50, offset = 0, token?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/tracks?${params}`, {
      headers,
    });
    return response.json();
  },

  getById: async (id: string, token?: string) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/tracks/${id}`, {
      headers,
    });
    return response.json();
  },

  toggleFavorite: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/tracks/${id}/favorite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  getFavorites: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/tracks/user/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};


export const albumsAPI = {
  getAll: async (limit = 20, offset = 0, token?: string) => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/albums?${params}`, {
      headers,
    });
    return response.json();
  },

  getById: async (id: string, token?: string) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/albums/${id}`, {
      headers,
    });
    return response.json();
  },
};


export const playlistsAPI = {
  getAll: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/playlists`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  getById: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  create: async (name: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  addTrack: async (playlistId: string, trackId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ trackId }),
    });
    return response.json();
  },

  removeTrack: async (playlistId: string, trackId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  update: async (id: string, name: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  delete: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
}; 