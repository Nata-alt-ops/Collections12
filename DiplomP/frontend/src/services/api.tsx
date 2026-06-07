import axios from 'axios';
import { Collection, Item } from '../types';

export const api = axios.create({ baseURL: 'http://localhost:8000/api' });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auth
export const register = (email: string, username: string, password: string) =>
    api.post('/auth/register', { email, username, password });
export const login = (username: string, password: string) =>
    api.post('/auth/login', { username, password });
export const getMe = () => api.get('/auth/me');

// Collections
export const getCollections = () => api.get<Collection[]>('/collections');
export const createCollection = (data: { name: string; description?: string; custom_fields: any[] }) =>
    api.post<Collection>('/collections', data);
export const deleteCollection = (id: number) => api.delete(`/collections/${id}`);
export const updateCollection = (id: number, data: { name: string; description?: string; custom_fields: any[] }) =>
    api.put<Collection>(`/collections/${id}`, data);
export const getCollectionById = (id: number) => api.get<Collection>(`/collections/${id}`);

// Items
export const getItems = (collectionId: number) => api.get<Item[]>(`/collections/${collectionId}/items`);
export const createItem = (collectionId: number, data: { title: string; custom_values: Record<string, any> }) =>
    api.post<Item>(`/collections/${collectionId}/items`, data);
export const updateItem = (itemId: number, data: { title: string; custom_values: Record<string, any> }) =>
    api.put<Item>(`/items/${itemId}`, data);
export const deleteItem = (itemId: number) => api.delete(`/items/${itemId}`);
export const uploadImage = (itemId: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/items/${itemId}/upload`, fd);
};

// Collection image
export const uploadCollectionImage = (collectionId: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/collections/${collectionId}/upload`, fd);
};

// В файле api.tsx добавьте эту функцию:

export const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;
    
    // Если это blob URL (новое загруженное изображение)
    if (imagePath.startsWith('blob:')) {
        return imagePath;
    }
    
    // Если уже полный URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // Если путь начинается с uploads/, используем статическую раздачу
    if (imagePath.startsWith('uploads/')) {
        return `http://localhost:8000/${imagePath}`;
    }
    
    // Если путь не содержит uploads/, добавляем
    if (!imagePath.includes('/')) {
        return `http://localhost:8000/uploads/${imagePath}`;
    }
    
    // В противном случае - как есть
    return `http://localhost:8000/${imagePath}`;
};

export default api;