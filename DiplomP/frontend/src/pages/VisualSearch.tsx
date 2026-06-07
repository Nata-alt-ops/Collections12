import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box, Grid, Card, CardContent, CircularProgress, TextField, InputAdornment } from '@mui/material';
import { Search, CloudUpload, ArrowBack } from '@mui/icons-material';
import { getItems, getCollections } from '../services/api';
import { Item, Collection } from '../types';
import axios from 'axios';

export default function VisualSearch() {
    const { collectionId } = useParams();
    const navigate = useNavigate();
    const [items, setItems] = useState<Item[]>([]);
    const [collection, setCollection] = useState<Collection | null>(null);
    const [searchImage, setSearchImage] = useState<File | null>(null);
    const [searchPreview, setSearchPreview] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [similarItems, setSimilarItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (collectionId) {
            getCollections().then(res => {
                const col = res.data.find(c => c.id === Number(collectionId));
                setCollection(col || null);
            });
            getItems(Number(collectionId)).then(res => setItems(res.data));
        }
    }, [collectionId]);

    // Поиск по тексту
    const handleTextSearch = () => {
        if (!searchText.trim()) {
            setSimilarItems([]);
            return;
        }
        setLoading(true);
        const similar = items.filter(item => 
            item.title.toLowerCase().includes(searchText.toLowerCase()) ||
            Object.values(item.custom_values).some(v => 
                String(v).toLowerCase().includes(searchText.toLowerCase())
            )
        ).map(item => ({ ...item, similarity: null }));
        setTimeout(() => {
            setSimilarItems(similar);
            setLoading(false);
        }, 300);
    };

    // Поиск по фото (реальный визуальный поиск)
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setSearchImage(file);
        setSearchPreview(URL.createObjectURL(file));
        setLoading(true);
        
        // Отправляем на бэкенд для сравнения
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:8000/api/items/visual-search/${collectionId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            setSimilarItems(response.data.similar_items);
        } catch (error) {
            console.error('Ошибка визуального поиска:', error);
            alert('Ошибка при поиске. Попробуйте другое фото.');
        } finally {
            setLoading(false);
        }
    };

    const getItemImage = (item: any) => {
        return item.image_path ? `http://localhost:8000/${item.image_path}` : null;
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8F4E9', py: 4 }}>
            <Container maxWidth="lg">
                <Button 
                    startIcon={<ArrowBack />} 
                    onClick={() => navigate(`/collections/${collectionId}/items`)}
                    sx={{ mb: 3, color: '#1A73E8' }}
                >
                    Назад к предметам
                </Button>

                <Typography variant="h4" sx={{ color: '#1A73E8', fontWeight: 500, mb: 3 }}>
                    🔍 Визуальный поиск: {collection?.name}
                </Typography>

                {/* Поиск по тексту */}
                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>📝 Поиск по названию</Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                            fullWidth
                            placeholder="Введите название предмета..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
                            sx={{ flex: 1 }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ color: '#9AA0A6' }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <Button 
                            variant="contained" 
                            onClick={handleTextSearch}
                            sx={{ bgcolor: '#1A73E8', px: 4 }}
                        >
                            Найти
                        </Button>
                    </Box>
                </Paper>

                {/* Поиск по фото */}
                <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>🖼️ Поиск по фото</Typography>
                    <Typography variant="body2" sx={{ color: '#5F6368', mb: 2 }}>
                        Загрузите фотографию предмета – система найдёт похожие изображения в коллекции
                    </Typography>
                    
                    <Box
                        sx={{
                            border: '2px dashed #DADCE0',
                            borderRadius: 3,
                            p: 3,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            bgcolor: searchPreview ? '#E8F0FE' : 'transparent',
                            '&:hover': { borderColor: '#1A73E8', bgcolor: '#E8F0FE' }
                        }}
                        onClick={() => document.getElementById('searchImageInput')?.click()}
                    >
                        <input
                            id="searchImageInput"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleImageUpload}
                        />
                        {searchPreview ? (
                            <Box>
                                <img 
                                    src={searchPreview} 
                                    alt="Search preview" 
                                    style={{ maxWidth: 200, maxHeight: 150, borderRadius: 8, marginBottom: 12 }} 
                                />
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <Button 
                                        size="small" 
                                        variant="outlined" 
                                        onClick={(e) => { e.stopPropagation(); setSearchPreview(null); setSearchImage(null); setSimilarItems([]); }}
                                        sx={{ borderColor: '#D93025', color: '#D93025' }}
                                    >
                                        Очистить
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            <Box>
                                <CloudUpload sx={{ fontSize: 48, color: '#1A73E8', mb: 1 }} />
                                <Typography variant="body2" sx={{ color: '#5F6368' }}>
                                    Нажмите для загрузки фото
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#9AA0A6' }}>
                                    PNG, JPG, GIF (до 5MB)
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Paper>

                {/* Результаты поиска */}
                {loading && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress sx={{ color: '#1A73E8' }} />
                        <Typography sx={{ mt: 2, color: '#5F6368' }}>Поиск похожих изображений...</Typography>
                    </Box>
                )}

                {similarItems.length > 0 && !loading && (
                    <>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                            🎯 Найдено {similarItems.length} совпадений
                        </Typography>
                        <Grid container spacing={3}>
                            {similarItems.map((item: any) => {
                                const imageUrl = getItemImage(item);
                                return (
                                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
                                        <Card sx={{ borderRadius: 3, cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }} onClick={() => navigate(`/collections/${collectionId}/items/${item.id}/edit`)}>
                                            <Box sx={{ height: 160, bgcolor: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <Typography variant="h1" sx={{ fontSize: 48 }}>📷</Typography>
                                                )}
                                            </Box>
                                            <CardContent>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>{item.title}</Typography>
                                                {item.similarity && (
                                                    <Typography variant="caption" sx={{ color: '#1A73E8' }}>
                                                        Похожесть: {item.similarity}%
                                                    </Typography>
                                                )}
                                                <Typography variant="caption" sx={{ color: '#5F6368', display: 'block' }}>
                                                    {Object.entries(item.custom_values).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </>
                )}

                {(searchPreview || searchText) && similarItems.length === 0 && !loading && (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ color: '#5F6368', mb: 1 }}>😕 Ничего не найдено</Typography>
                        <Typography variant="body2" sx={{ color: '#9AA0A6' }}>
                            Попробуйте другое фото или измените запрос
                        </Typography>
                    </Paper>
                )}
            </Container>
        </Box>
    );
}