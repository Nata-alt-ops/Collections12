import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, Paper, Button, IconButton, Typography, TextField, 
    InputAdornment, Box, Chip, TablePagination, Card, CardContent 
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { getItems, deleteItem, getCollections, getImageUrl } from '../services/api';
import { Item, Collection } from '../types';
import ExportDOCX from '../components/ExportPDF';

export default function ItemsList() {
    const { collectionId } = useParams();
    const navigate = useNavigate();
    const [items, setItems] = useState<Item[]>([]);
    const [filteredItems, setFilteredItems] = useState<Item[]>([]);
    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (collectionId) {
            getCollections().then(res => {
                const col = res.data.find(c => c.id === Number(collectionId));
                setCollection(col || null);
            });
            loadItems();
        }
    }, [collectionId]);

    const loadItems = async () => {
        if (!collectionId) return;
        const res = await getItems(Number(collectionId));
        setItems(res.data);
        setFilteredItems(res.data);
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Удалить предмет?')) {
            await deleteItem(id);
            loadItems();
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        const filtered = items.filter(item => 
            item.title.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredItems(filtered);
        setPage(0);
    };

    const handleImageError = (itemId: number) => {
        setImageErrors(prev => ({ ...prev, [itemId]: true }));
    };

    const paginatedItems = filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    if (loading) return <div>Загрузка...</div>;

    return (
        <Box sx={{ bgcolor: '#F8F4E9', minHeight: '100vh', py: 3 }}>
            <Container maxWidth="xl">
                {/* Верхняя панель */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h4" sx={{ color: '#202124', fontWeight: 500 }}>
                        {collection?.name} – Предметы ({filteredItems.length})
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <ExportDOCX items={items} collectionName={collection?.name || 'Коллекция'} />
                        <Button 
                            variant="outlined" 
                            onClick={() => navigate(`/collections/${collectionId}/visual-search`)}
                            sx={{ borderColor: '#1A73E8', color: '#1A73E8' }}
                        >
                            🔍 Визуальный поиск
                        </Button>
                        
                        <Button 
                            variant="outlined" 
                            onClick={() => navigate(`/collections/${collectionId}/showcase`)}
                            sx={{ borderColor: '#1A73E8', color: '#1A73E8' }}
                        >
                            🖼️ Витрина
                        </Button>
                        
                        <Button 
                            variant="outlined" 
                            onClick={() => navigate(`/collections/${collectionId}/timeline`)}
                            sx={{ borderColor: '#1A73E8', color: '#1A73E8' }}
                        >
                            📅 Хронология
                        </Button>
                        
                        <IconButton 
                            onClick={() => setViewMode('table')} 
                            sx={{ color: viewMode === 'table' ? '#1A73E8' : '#aaa' }}
                        >
                            <TableRowsIcon />
                        </IconButton>
                        <IconButton 
                            onClick={() => setViewMode('grid')} 
                            sx={{ color: viewMode === 'grid' ? '#1A73E8' : '#aaa' }}
                        >
                            <GridViewIcon />
                        </IconButton>
                        
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            onClick={() => navigate(`/collections/${collectionId}/items/new`)}
                            sx={{ bgcolor: '#1A73E8' }}
                        >
                            Добавить предмет
                        </Button>
                    </Box>
                </Box>

                {/* Поиск - используем slotProps для MUI v5 */}
                <TextField
                    placeholder="Поиск по названию..."
                    value={search}
                    onChange={handleSearch}
                    sx={{ bgcolor: 'white', borderRadius: 2, mb: 3, width: '100%' }}
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

                {/* Режим таблицы */}
                {viewMode === 'table' ? (
                    <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#1A73E8' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white' }}>Изображение</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Название</TableCell>
                                    {collection?.custom_fields.map(f => (
                                        <TableCell key={f.name} sx={{ color: 'white' }}>{f.name}</TableCell>
                                    ))}
                                    <TableCell sx={{ color: 'white' }}>Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedItems.map(item => {
                                    const imageUrl = getImageUrl(item.image_path);
                                    const hasError = imageErrors[item.id];
                                    
                                    return (
                                        <TableRow key={item.id} hover>
                                            <TableCell>
                                                {imageUrl && !hasError ? (
                                                    <img 
                                                        src={imageUrl} 
                                                        alt={item.title}
                                                        style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }}
                                                        onError={() => handleImageError(item.id)}
                                                    />
                                                ) : (
                                                    <Box sx={{ 
                                                        width: 50, 
                                                        height: 50, 
                                                        borderRadius: 2, 
                                                        bgcolor: '#f0f0f0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 24
                                                    }}>
                                                        📷
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell><strong>{item.title}</strong></TableCell>
                                            {collection?.custom_fields.map(f => {
                                                let val = item.custom_values[f.name];
                                                if (f.type === 'boolean') val = val ? '✅ Да' : '❌ Нет';
                                                if (f.type === 'date') val = val ? new Date(val).toLocaleDateString() : '';
                                                return <TableCell key={f.name}>{val !== undefined && val !== '' ? val : '—'}</TableCell>;
                                            })}
                                            <TableCell>
                                                <IconButton onClick={() => navigate(`/collections/${collectionId}/items/${item.id}/edit`)} sx={{ color: '#1A73E8' }}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(item.id)} sx={{ color: '#dc3545' }}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        <TablePagination 
                            rowsPerPageOptions={[5, 10, 25, 50]} 
                            component="div" 
                            count={filteredItems.length} 
                            rowsPerPage={rowsPerPage} 
                            page={page} 
                            onPageChange={(e, p) => setPage(p)} 
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }} 
                        />
                    </TableContainer>
                ) : (
                    // Режим плитки - используем Grid2 с size
                    <Grid container spacing={3}>
                        {paginatedItems.map(item => {
                            const imageUrl = getImageUrl(item.image_path);
                            const hasError = imageErrors[item.id];
                            
                            return (
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
                                    <Card sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, minHeight: 120 }}>
                                                {imageUrl && !hasError ? (
                                                    <img 
                                                        src={imageUrl} 
                                                        alt={item.title}
                                                        style={{ width: 120, height: 120, borderRadius: 8, objectFit: 'cover' }}
                                                        onError={() => handleImageError(item.id)}
                                                    />
                                                ) : (
                                                    <Box sx={{ 
                                                        width: 120, 
                                                        height: 120, 
                                                        bgcolor: '#f0f0f0', 
                                                        borderRadius: 2, 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        fontSize: 48 
                                                    }}>
                                                        📷
                                                    </Box>
                                                )}
                                            </Box>
                                            <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 500 }}>
                                                {item.title}
                                            </Typography>
                                            {collection?.custom_fields.slice(0, 2).map(f => {
                                                let val = item.custom_values[f.name];
                                                if (f.type === 'boolean') val = val ? 'Да' : 'Нет';
                                                return val && (
                                                    <Chip 
                                                        key={f.name} 
                                                        label={`${f.name}: ${val}`} 
                                                        size="small" 
                                                        sx={{ m: 0.5, bgcolor: '#e8f0fe', color: '#1A73E8' }} 
                                                    />
                                                );
                                            })}
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                                                <IconButton size="small" onClick={() => navigate(`/collections/${collectionId}/items/${item.id}/edit`)} sx={{ color: '#1A73E8' }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDelete(item.id)} sx={{ color: '#dc3545' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                {/* Пустое состояние */}
                {filteredItems.length === 0 && items.length === 0 && (
                    <Card sx={{ textAlign: 'center', py: 8, mt: 4, bgcolor: 'white', borderRadius: 3 }}>
                        <Typography variant="h6" color="textSecondary" gutterBottom>В этой коллекции пока нет предметов</Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`/collections/${collectionId}/items/new`)} sx={{ bgcolor: '#1A73E8', mt: 2 }}>
                            Добавить первый предмет
                        </Button>
                    </Card>
                )}
            </Container>
        </Box>
    );
}