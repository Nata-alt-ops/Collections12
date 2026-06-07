import { useEffect, useState } from 'react';
import {
    Container, Paper, Typography, Box, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Select, MenuItem, FormControl, InputLabel, Card, CardContent,
    Tabs, Tab, Alert, Switch, FormControlLabel
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Delete, Edit, AdminPanelSettings } from '@mui/icons-material';
import api from '../services/api';

interface User {
    id: number;
    email: string;
    username: string;
    role: 'admin' | 'user';
    is_active: boolean;
}

interface Collection {
    id: number;
    name: string;
    description: string;
    owner_id: number;
    owner_name: string;
}

interface Item {
    id: number;
    title: string;
    collection_id: number;
    collection_name: string;
    owner_id: number;
    owner_name: string;
}

interface Stats {
    total_users: number;
    total_admins: number;
    total_collections: number;
    total_items: number;
    users_stats: Array<{
        user_id: number;
        username: string;
        collections_count: number;
        items_count: number;
    }>;
}

export default function AdminPanel() {
    const [tabValue, setTabValue] = useState(0);
    const [users, setUsers] = useState<User[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [editUserOpen, setEditUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ email: '', username: '', role: 'user', is_active: true });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersRes, collectionsRes, itemsRes, statsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/collections'),
                api.get('/admin/items'),
                api.get('/admin/stats')
            ]);
            setUsers(usersRes.data);
            setCollections(collectionsRes.data);
            setItems(itemsRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            alert('Ошибка загрузки данных админ-панели');
        }
        setLoading(false);
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setEditForm({
            email: user.email,
            username: user.username,
            role: user.role,
            is_active: user.is_active
        });
        setEditUserOpen(true);
    };

    const handleSaveUser = async () => {
        if (!selectedUser) return;
        try {
            await api.put(`/admin/users/${selectedUser.id}`, editForm);
            loadData();
            setEditUserOpen(false);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Ошибка обновления');
        }
    };

    const handleDeleteUser = async (userId: number, username: string) => {
        if (window.confirm(`Удалить пользователя "${username}"? Все его коллекции и предметы будут удалены.`)) {
            try {
                await api.delete(`/admin/users/${userId}`);
                loadData();
            } catch (err: any) {
                alert(err.response?.data?.detail || 'Ошибка удаления');
            }
        }
    };

    const handleDeleteCollection = async (collectionId: number, name: string) => {
        if (window.confirm(`Удалить коллекцию "${name}"?`)) {
            try {
                await api.delete(`/admin/collections/${collectionId}`);
                loadData();
            } catch (err) {
                alert('Ошибка удаления');
            }
        }
    };

    const handleDeleteItem = async (itemId: number, title: string) => {
        if (window.confirm(`Удалить предмет "${title}"?`)) {
            try {
                await api.delete(`/admin/items/${itemId}`);
                loadData();
            } catch (err) {
                alert('Ошибка удаления');
            }
        }
    };

    if (loading) return <div>Загрузка админ-панели...</div>;

    return (
        <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <AdminPanelSettings sx={{ fontSize: 40, color: '#1A73E8' }} />
                    <Typography variant="h4" sx={{ color: '#1A73E8', fontWeight: 500 }}>
                        Панель администратора
                    </Typography>
                </Box>

                {/* Статистика */}
                {stats && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Card sx={{ bgcolor: '#E8F0FE', textAlign: 'center' }}>
                                <CardContent>
                                    <Typography variant="h4" sx={{ color: '#1A73E8' }}>{stats.total_users}</Typography>
                                    <Typography variant="body2">Пользователей</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Card sx={{ bgcolor: '#E8F0FE', textAlign: 'center' }}>
                                <CardContent>
                                    <Typography variant="h4" sx={{ color: '#1A73E8' }}>{stats.total_admins}</Typography>
                                    <Typography variant="body2">Администраторов</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Card sx={{ bgcolor: '#E8F0FE', textAlign: 'center' }}>
                                <CardContent>
                                    <Typography variant="h4" sx={{ color: '#1A73E8' }}>{stats.total_collections}</Typography>
                                    <Typography variant="body2">Коллекций</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Card sx={{ bgcolor: '#E8F0FE', textAlign: 'center' }}>
                                <CardContent>
                                    <Typography variant="h4" sx={{ color: '#1A73E8' }}>{stats.total_items}</Typography>
                                    <Typography variant="body2">Предметов</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label="👥 Пользователи" />
                    <Tab label="📁 Коллекции" />
                    <Tab label="📦 Предметы" />
                    <Tab label="📊 Статистика" />
                </Tabs>

                {/* Пользователи */}
                {tabValue === 0 && (
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#1A73E8' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white' }}>ID</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Имя</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Email</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Роль</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Статус</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell><strong>{user.username}</strong></TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={user.role === 'admin' ? 'Админ' : 'Пользователь'}
                                                color={user.role === 'admin' ? 'primary' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={user.is_active ? 'Активен' : 'Заблокирован'}
                                                color={user.is_active ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEditUser(user)} sx={{ color: '#1A73E8' }}>
                                                <Edit />
                                            </IconButton>
                                            <IconButton onClick={() => handleDeleteUser(user.id, user.username)} sx={{ color: '#dc3545' }}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Коллекции */}
                {tabValue === 1 && (
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#1A73E8' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white' }}>ID</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Название</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Владелец</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Описание</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {collections.map(col => (
                                    <TableRow key={col.id}>
                                        <TableCell>{col.id}</TableCell>
                                        <TableCell><strong>{col.name}</strong></TableCell>
                                        <TableCell>{col.owner_name}</TableCell>
                                        <TableCell>{col.description?.slice(0, 50)}...</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleDeleteCollection(col.id, col.name)} sx={{ color: '#dc3545' }}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Предметы */}
                {tabValue === 2 && (
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#1A73E8' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white' }}>ID</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Название</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Коллекция</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Владелец</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.id}</TableCell>
                                        <TableCell><strong>{item.title}</strong></TableCell>
                                        <TableCell>{item.collection_name}</TableCell>
                                        <TableCell>{item.owner_name}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleDeleteItem(item.id, item.title)} sx={{ color: '#dc3545' }}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Статистика по пользователям */}
                {tabValue === 3 && stats && (
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#1A73E8' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white' }}>Пользователь</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Коллекций</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Предметов</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {stats.users_stats.map(stat => (
                                    <TableRow key={stat.user_id}>
                                        <TableCell><strong>{stat.username}</strong></TableCell>
                                        <TableCell>{stat.collections_count}</TableCell>
                                        <TableCell>{stat.items_count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Диалог редактирования пользователя */}
            <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Редактирование пользователя</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Имя пользователя"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        margin="normal"
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Роль</InputLabel>
                        <Select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'user' })}
                        >
                            <MenuItem value="user">Пользователь</MenuItem>
                            <MenuItem value="admin">Администратор</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={editForm.is_active}
                                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                            />
                        }
                        label="Активен (разрешен вход)"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditUserOpen(false)}>Отмена</Button>
                    <Button onClick={handleSaveUser} variant="contained" sx={{ bgcolor: '#1A73E8' }}>
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}