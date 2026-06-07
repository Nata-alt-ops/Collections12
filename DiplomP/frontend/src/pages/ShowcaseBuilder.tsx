import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Box, Select, MenuItem, FormControl, InputLabel, Typography, Grid, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { ArrowBack, CloudUpload, Close, Delete } from '@mui/icons-material';
import { getItems, getCollections } from '../services/api';
import { Item, Collection } from '../types';

// Предустановленные фоны
const PRESET_BACKGROUNDS: Record<string, string> = {
    дерево: 'url(https://www.transparenttextures.com/patterns/wood.png)',
    стекло: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(200,200,200,0.5))',
    бархат: '#800020',
    мрамор: 'url(https://www.transparenttextures.com/patterns/marble.png)',
    бетон: 'url(https://www.transparenttextures.com/patterns/concrete.png)',
    градиент: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ночь: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'
};

export default function ShowcaseBuilder() {
    const { collectionId } = useParams();
    const navigate = useNavigate();
    const [items, setItems] = useState<Item[]>([]);
    const [collection, setCollection] = useState<Collection | null>(null);
    const [background, setBackground] = useState('дерево');
    const [customBackground, setCustomBackground] = useState<string | null>(null);
    const [customBackgroundFile, setCustomBackgroundFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [draggedItem, setDraggedItem] = useState<number | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, [collectionId]);

    const loadData = async () => {
        if (!collectionId) return;
        const colsRes = await getCollections();
        const col = colsRes.data.find(c => c.id === Number(collectionId));
        setCollection(col || null);
        
        const itemsRes = await getItems(Number(collectionId));
        
        // Загружаем сохранённый порядок
        const savedOrder = localStorage.getItem(`showcase_order_${collectionId}`);
        if (savedOrder) {
            const orderIds = JSON.parse(savedOrder);
            const orderedItems = orderIds
                .map((id: number) => itemsRes.data.find(item => item.id === id))
                .filter(Boolean);
            if (orderedItems.length === itemsRes.data.length) {
                setItems(orderedItems);
            } else {
                setItems(itemsRes.data);
            }
        } else {
            setItems(itemsRes.data);
        }
        
        // Загружаем сохранённый фон (URL или base64)
        const savedBg = localStorage.getItem(`showcase_bg_${collectionId}`);
        if (savedBg) {
            if (savedBg.startsWith('data:image') || savedBg.startsWith('http')) {
                setCustomBackground(savedBg);
                setBackground('custom');
            } else if (PRESET_BACKGROUNDS[savedBg]) {
                setBackground(savedBg);
            }
        }
        
        setLoading(false);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === dropIndex) return;
        
        const newItems = [...items];
        const [movedItem] = newItems.splice(draggedItem, 1);
        newItems.splice(dropIndex, 0, movedItem);
        
        setItems(newItems);
        localStorage.setItem(`showcase_order_${collectionId}`, JSON.stringify(newItems.map(i => i.id)));
        setDraggedItem(null);
    };

    const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setCustomBackgroundFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                const bgUrl = event.target?.result as string;
                setCustomBackground(bgUrl);
                setBackground('custom');
                localStorage.setItem(`showcase_bg_${collectionId}`, bgUrl);
                setDialogOpen(false);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Пожалуйста, выберите файл изображения (jpg, png, gif)');
        }
    };

    const handleBackgroundDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const bgUrl = event.target?.result as string;
                setCustomBackground(bgUrl);
                setBackground('custom');
                localStorage.setItem(`showcase_bg_${collectionId}`, bgUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const getBackgroundStyle = () => {
        if (background === 'custom' && customBackground) {
            return { backgroundImage: `url(${customBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' };
        }
        const bg = PRESET_BACKGROUNDS[background];
        if (bg?.startsWith('url') || bg?.startsWith('linear-gradient')) {
            return { background: bg, backgroundSize: 'cover', backgroundPosition: 'center' };
        }
        return { backgroundColor: bg };
    };

    const resetCustomBackground = () => {
        setCustomBackground(null);
        setCustomBackgroundFile(null);
        setBackground('дерево');
        localStorage.removeItem(`showcase_bg_${collectionId}`);
    };

    const getItemImage = (item: Item) => {
        return item.image_path ? `http://localhost:8000/${item.image_path}` : null;
    };

    if (loading) return <div className="loader">Загрузка...</div>;

    return (
        <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate(`/collections/${collectionId}/items`)} sx={{ mb: 2, color: '#1A73E8' }}>
                Назад к предметам
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white', borderRadius: 2 }}>
                        <InputLabel>Фон витрины</InputLabel>
                        <Select value={background === 'custom' ? 'custom' : background} onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'custom') {
                                setDialogOpen(true);
                            } else {
                                setBackground(value);
                                setCustomBackground(null);
                                localStorage.setItem(`showcase_bg_${collectionId}`, value);
                            }
                        }} label="Фон витрины">
                            <MenuItem value="дерево">🌳 Дерево</MenuItem>
                            <MenuItem value="стекло">🔮 Стекло</MenuItem>
                            <MenuItem value="бархат">❤️ Бархат</MenuItem>
                            <MenuItem value="мрамор">⬜ Мрамор</MenuItem>
                            <MenuItem value="бетон">🏭 Бетон</MenuItem>
                            <MenuItem value="градиент">🎨 Градиент</MenuItem>
                            <MenuItem value="ночь">🌙 Ночь</MenuItem>
                            <MenuItem value="custom">✨ Свой фон</MenuItem>
                        </Select>
                    </FormControl>
                    {background === 'custom' && (
                        <Button 
                            variant="outlined" 
                            startIcon={<Delete />} 
                            onClick={resetCustomBackground}
                            sx={{ borderColor: '#dc3545', color: '#dc3545' }}
                        >
                            Сбросить фон
                        </Button>
                    )}
                </Box>
            </Box>

            <Paper 
                sx={{ p: 3, borderRadius: 3, minHeight: 500, ...getBackgroundStyle(), transition: 'background 0.3s ease' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleBackgroundDrop}
            >
                {items.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <Typography variant="h6" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                            📦 В этой коллекции пока нет предметов
                        </Typography>
                        <Button variant="contained" sx={{ mt: 2, bgcolor: '#1A73E8' }} onClick={() => navigate(`/collections/${collectionId}/items/new`)}>
                            Добавить первый предмет
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {items.map((item, index) => {
                            const imageUrl = getItemImage(item);
                            return (
                                <Grid 
                                    size={{ xs: 6, sm: 4, md: 3, lg: 2 }} 
                                    key={item.id}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, index)}
                                    sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
                                >
                                    <Card sx={{ borderRadius: 3, transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }, background: 'rgba(255,255,255,0.95)' }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Box sx={{ mb: 1, color: '#1A73E8', fontSize: 12 }}>⋮⋮ Перетащите ⋮⋮</Box>
                                            {imageUrl ? (
                                                <img src={imageUrl} alt={item.title} style={{ width: '100%', height: 100, objectFit: 'contain' }} />
                                            ) : (
                                                <div style={{ fontSize: 48, padding: 20 }}>📷</div>
                                            )}
                                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>{item.title}</Typography>
                                            {Object.entries(item.custom_values).slice(0, 2).map(([key, val]) => (
                                                <Typography key={key} variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                    {key}: {String(val).slice(0, 20)}
                                                </Typography>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Paper>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.7)', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: 'white', textAlign: 'center' }}>
                    💡 Поставьте предметы как вам хочется! Не забудьте выбрать интересный фон!
                </Typography>
            </Box>

            {/* Диалог для загрузки своего фона */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#1A73E8', color: 'white' }}>
                    Загрузить свой фон
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Box
                        sx={{
                            border: '2px dashed #DADCE0',
                            borderRadius: 3,
                            p: 4,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: '#1A73E8', bgcolor: '#E8F0FE' }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file && file.type.startsWith('image/')) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    const bgUrl = event.target?.result as string;
                                    setCustomBackground(bgUrl);
                                    setBackground('custom');
                                    localStorage.setItem(`showcase_bg_${collectionId}`, bgUrl);
                                    setDialogOpen(false);
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                        onClick={() => document.getElementById('bg-file-input')?.click()}
                    >
                        <input
                            id="bg-file-input"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleBackgroundFileChange}
                        />
                        <CloudUpload sx={{ fontSize: 48, color: '#1A73E8', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: '#5F6368' }}>
                            Нажмите или перетащите изображение
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9AA0A6' }}>
                            PNG, JPG, GIF (до 5MB)
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}