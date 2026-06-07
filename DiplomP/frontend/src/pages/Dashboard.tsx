import { useEffect, useState } from 'react';
import { Container, Grid, Card, CardContent, Typography, Button, Box, Avatar, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCollections, getItems } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import CollectionsIcon from '@mui/icons-material/Collections';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddIcon from '@mui/icons-material/Add';
import ViewListIcon from '@mui/icons-material/ViewList';
import EditIcon from '@mui/icons-material/Edit';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [totalCollections, setTotalCollections] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerCollection, setItemsPerCollection] = useState<{ name: string; count: number }[]>([]);
    const [recentItems, setRecentItems] = useState<any[]>([]);
    
    // Цель – загружаем из localStorage, по умолчанию 100
    const [goal, setGoal] = useState(() => {
        const saved = localStorage.getItem('collection_goal');
        return saved ? Number(saved) : 100;
    });
    const [goalDialogOpen, setGoalDialogOpen] = useState(false);
    const [tempGoal, setTempGoal] = useState(goal);

    useEffect(() => {
        const fetchData = async () => {
            const colsRes = await getCollections();
            const collections = colsRes.data;
            setTotalCollections(collections.length);

            let itemsCount = 0;
            const counts: { name: string; count: number }[] = [];
            const recent: any[] = [];
            
            for (const col of collections) {
                const itemsRes = await getItems(col.id);
                itemsCount += itemsRes.data.length;
                counts.push({ name: col.name, count: itemsRes.data.length });
                recent.push(...itemsRes.data.map(i => ({ ...i, collectionName: col.name })));
            }
            
            setTotalItems(itemsCount);
            setItemsPerCollection(counts);
            setRecentItems(recent.slice(-5).reverse());
        };
        fetchData();
    }, []);

    const handleSaveGoal = () => {
        if (tempGoal > 0) {
            setGoal(tempGoal);
            localStorage.setItem('collection_goal', String(tempGoal));
            setGoalDialogOpen(false);
        }
    };

    const getInitials = () => {
        return user?.username?.charAt(0).toUpperCase() || 'U';
    };

    const progress = Math.min((totalItems / goal) * 100, 100);

    return (
        <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
            {/* Приветствие с аватаркой */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="h4" sx={{ color: '#202124' }}>
                        Добро пожаловать, {user?.username}!
                    </Typography>
                </Box>
            </Box>

            {/* Карточки-статистики */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Карточка "Коллекции" – не трогаем */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ background: 'linear-gradient(135deg, #1A73E8 0%, #4285F4 100%)', color: 'white', borderRadius: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h6">Коллекции</Typography>
                                    <Typography variant="h3">{totalCollections}</Typography>
                                </Box>
                                <CollectionsIcon sx={{ fontSize: 48, opacity: 0.7 }} />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <Button 
                                    size="small" 
                                    variant="contained" 
                                    startIcon={<AddIcon />} 
                                    onClick={() => navigate('/collections/new')} 
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                                >
                                    Добавить
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <Button 
                                    size="small" 
                                    variant="contained" 
                                    startIcon={<ViewListIcon />} 
                                    onClick={() => navigate('/collections')} 
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                                >
                                    Все коллекции
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Карточка "Предметы" – не трогаем */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card sx={{ background: 'linear-gradient(135deg, #1A73E8 0%, #4285F4 100%)', color: 'white', borderRadius: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h6">Предметы</Typography>
                                    <Typography variant="h3">{totalItems}</Typography>
                                </Box>
                                <InventoryIcon sx={{ fontSize: 48, opacity: 0.7 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Карточка "Цель" – добавляем возможность редактировать */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                   <Card sx={{ background: 'linear-gradient(135deg, #1A73E8 0%, #4285F4 100%)', color: 'white', borderRadius: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="h6">Цель (предметы)</Typography>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => {
                                                setTempGoal(goal);
                                                setGoalDialogOpen(true);
                                            }} 
                                            sx={{ color: 'white', p: 0.5 }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Typography variant="h3">{totalItems}/{goal}</Typography>
                                </Box>
                                <Box sx={{ width: 100 }}>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={progress} 
                                        sx={{ 
                                            height: 8, 
                                            borderRadius: 4, 
                                            bgcolor: 'rgba(255,255,255,0.3)', 
                                            '& .MuiLinearProgress-bar': { bgcolor: 'white' } 
                                        }}  
                                    />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            {/* Графики */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ background: 'rgba(255,255,255,0.95)', borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Соотношение коллекций и предметов</Typography>
                            <Pie data={{ labels: ['Коллекции', 'Предметы'], datasets: [{ data: [totalCollections, totalItems], backgroundColor: ['#6c5ce7', '#00cec9'] }] }} />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ background: 'rgba(255,255,255,0.95)', borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Предметы по коллекциям</Typography>
                            {itemsPerCollection.length > 0 ? 
                                <Bar data={{ labels: itemsPerCollection.map(i => i.name), datasets: [{ label: 'Кол-во', data: itemsPerCollection.map(i => i.count), backgroundColor: '#6c5ce7' }] }} /> : 
                                <Typography>Нет данных</Typography>
                            }
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Последние добавленные предметы */}
            {recentItems.length > 0 && (
                <Card sx={{ mt: 4, background: 'rgba(255,255,255,0.95)', borderRadius: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>📦 Последние добавленные предметы</Typography>
                        <Grid container spacing={2}>
                            {recentItems.map(item => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderBottom: '1px solid #eee' }}>
                                        {item.image_path ? 
                                            <img src={`http://localhost:8000/${item.image_path}`} width={40} height={40} style={{ borderRadius: 8, objectFit: 'cover' }} alt="" /> : 
                                            <Box sx={{ width: 40, height: 40, bgcolor: '#eee', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</Box>
                                        }
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {item.title}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {item.collectionName}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Пустое состояние */}
            {totalCollections === 0 && (
                <Card sx={{ mt: 4, textAlign: 'center', p: 4, background: 'rgba(255,255,255,0.95)', borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom>📭 У вас пока нет коллекций</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/collections/new')}  sx={{ bgcolor: '#1A73E8' }}>
                        Создать первую коллекцию
                    </Button>
                </Card>
            )}

            {/* Диалог для изменения цели */}
            <Dialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)}>
                <DialogTitle>Редактирование цели</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Установите цель
                    </Typography>
                    <TextField
                        autoFocus
                        type="number"
                        label="Количество предметов"
                        value={tempGoal}
                        onChange={(e) => setTempGoal(Number(e.target.value))}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setGoalDialogOpen(false)}>Отмена</Button>
                    <Button onClick={handleSaveGoal} variant="contained">Сохранить</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}