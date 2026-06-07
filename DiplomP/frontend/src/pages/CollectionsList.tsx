import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Grid, Card, CardContent, Typography, Button, IconButton, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel, Box, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import { getCollections, deleteCollection, getItems } from '../services/api';
import { Collection } from '../types';
import EditCollectionModal from '../components/EditCollectionModal';

export default function CollectionsList() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [itemCounts, setItemCounts] = useState<Record<number, number>>({});
    const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const res = await getCollections();
        setCollections(res.data);
        
        const counts: Record<number, number> = {};
        for (const col of res.data) {
            const itemsRes = await getItems(col.id);
            counts[col.id] = itemsRes.data.length;
        }
        setItemCounts(counts);
        filterAndSort(res.data, searchTerm, sortBy, counts);
    };

    const filterAndSort = (cols: Collection[], search: string, sort: string, counts: Record<number, number>) => {
        let filtered = [...cols];
        if (search) {
            filtered = filtered.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
        }
        filtered.sort((a, b) => {
            if (sort === 'name') return a.name.localeCompare(b.name);
            if (sort === 'items') return (counts[b.id] || 0) - (counts[a.id] || 0);
            return 0;
        });
        setFilteredCollections(filtered);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        filterAndSort(collections, value, sortBy, itemCounts);
    };

    const handleSort = (e: any) => {
        const value = e.target.value;
        setSortBy(value);
        filterAndSort(collections, searchTerm, value, itemCounts);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Удалить коллекцию? Все предметы тоже удалятся.')) {
            await deleteCollection(id);
            load();
        }
    };

    const getCollectionIcon = (name: string) => {
        const icons: Record<string, string> = {
            книги: '📚', монеты: '💰', винил: '🎵', марки: '✉️',
            фигурки: '🎨', открытки: '🗺️', часы: '⌚', автомобили: '🚗',
            вино: '🍷', игрушки: '🧸', фотографии: '📷', значки: '🎖️'
        };
        for (const [key, icon] of Object.entries(icons)) {
            if (name.toLowerCase().includes(key)) return icon;
        }
        return '📦';
    };

    // Функция для получения правильного URL картинки
    const getImageUrl = (imagePath: string | null) => {
        if (!imagePath) return null;
        // Если путь уже начинается с http, возвращаем как есть
        if (imagePath.startsWith('http')) return imagePath;
        // Если путь начинается с uploads/, подставляем localhost
        if (imagePath.startsWith('uploads/')) {
            return `http://localhost:8000/${imagePath}`;
        }
        // Если путь без uploads/, добавляем
        return `http://localhost:8000/uploads/${imagePath}`;
    };

    return (
        <Box sx={{ bgcolor: '#F8F4E9', minHeight: '100vh', py: 3 }}>
            <Container maxWidth="xl">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h4" sx={{ color: '#202124', fontWeight: 500 }}>Мои коллекции</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/collections/new')} sx={{ bgcolor: '#1A73E8' }}>
                        Новая коллекция
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    <TextField
                        placeholder="Поиск коллекций..."
                        value={searchTerm}
                        onChange={handleSearch}
                        sx={{ bgcolor: 'white', borderRadius: 2, flex: 1 }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#1A73E8' }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    <FormControl sx={{ minWidth: 180, bgcolor: 'white', borderRadius: 2 }}>
                        <InputLabel>Сортировка</InputLabel>
                        <Select value={sortBy} onChange={handleSort} label="Сортировка">
                            <MenuItem value="name">По названию</MenuItem>
                            <MenuItem value="items">По количеству предметов</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {filteredCollections.length === 0 ? (
                    <Card sx={{ textAlign: 'center', py: 8, bgcolor: 'white', borderRadius: 3 }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>У вас пока нет коллекций</Typography>
                        <Button variant="contained" onClick={() => navigate('/collections/new')} sx={{ mt: 2, bgcolor: '#1A73E8' }}>
                            Создать первую коллекцию
                        </Button>
                    </Card>
                ) : (
                    <Grid container spacing={3}>
                        {filteredCollections.map(col => {
                            const imageUrl = getImageUrl(col.image_path);
                            return (
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={col.id}>
                                    <Card sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }, position: 'relative', overflow: 'hidden' }}>
                                        <Box 
                                            sx={{ 
                                                width: '100%', 
                                                aspectRatio: 1, 
                                                bgcolor: '#E8F0FE', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => navigate(`/collections/${col.id}/items`)}
                                        >
                                            {imageUrl ? (
                                                <img 
                                                    src={imageUrl} 
                                                    alt={col.name} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                    onError={(e) => {
                                                        // Если картинка не загрузилась, показываем эмодзи
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                            parent.style.display = 'flex';
                                                            parent.style.alignItems = 'center';
                                                            parent.style.justifyContent = 'center';
                                                            parent.innerHTML = `<span style="font-size: 64px;">${getCollectionIcon(col.name)}</span>`;
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <Typography variant="h1" sx={{ fontSize: 64 }}>
                                                    {getCollectionIcon(col.name)}
                                                </Typography>
                                            )}
                                        </Box>
                                        
                                        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                            <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.9)' }} onClick={() => setEditingCollectionId(col.id)}>
                                                <EditIcon fontSize="small" sx={{ color: '#1A73E8' }} />
                                            </IconButton>
                                            <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.9)' }} onClick={() => handleDelete(col.id)}>
                                                <DeleteIcon fontSize="small" sx={{ color: '#dc3545' }} />
                                            </IconButton>
                                        </Box>
                                        
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>{col.name}</Typography>
                                            <Typography variant="body2" color="textSecondary" noWrap>{col.description || 'Нет описания'}</Typography>
                                            <Chip label={`${itemCounts[col.id] || 0} предметов`} size="small" sx={{ mt: 1, mb: 2, bgcolor: '#E8F0FE', color: '#1A73E8' }} />
                                            <Button fullWidth variant="outlined" onClick={() => navigate(`/collections/${col.id}/items`)} sx={{ borderColor: '#1A73E8', color: '#1A73E8' }}>
                                                Открыть →
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Container>

            {/* Модальное окно редактирования */}
            <EditCollectionModal
                open={!!editingCollectionId}
                collectionId={editingCollectionId || 0}
                onClose={() => setEditingCollectionId(null)}
                onSuccess={load}
            />
        </Box>
    );
}