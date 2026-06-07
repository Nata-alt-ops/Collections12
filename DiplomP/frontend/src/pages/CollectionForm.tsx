import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Container, Paper, TextField, Button, Typography, Box,
    Alert, Grid, Card, CardContent, Dialog, DialogTitle,
    DialogContent, Radio, RadioGroup, FormControlLabel, MenuItem,
    CircularProgress, IconButton
} from '@mui/material';
import { ArrowBack, CloudUpload, Create, Delete } from '@mui/icons-material';
import { createCollection, getCollections, updateCollection, uploadCollectionImage, getCollectionById } from '../services/api';

// Шаблоны коллекций
const TEMPLATES = [
    { id: 'books', name: '📚 Книги', description: 'Для коллекции книг', icon: '📚', fields: [{ name: 'Автор', type: 'text' }, { name: 'Жанр', type: 'text' }, { name: 'Год издания', type: 'number' }, { name: 'Прочитана', type: 'boolean' }] },
    { id: 'coins', name: '💰 Монеты', description: 'Для нумизматической коллекции', icon: '💰', fields: [{ name: 'Страна', type: 'text' }, { name: 'Металл', type: 'text' }, { name: 'Вес (г)', type: 'number' }, { name: 'Год чеканки', type: 'number' }] },
    { id: 'stamps', name: '✉️ Марки', description: 'Для филателистической коллекции', icon: '✉️', fields: [{ name: 'Страна', type: 'text' }, { name: 'Год выпуска', type: 'number' }, { name: 'Номинал', type: 'text' }, { name: 'Состояние', type: 'text' }] },
    { id: 'vinyl', name: '🎵 Винил', description: 'Для коллекции пластинок', icon: '🎵', fields: [{ name: 'Исполнитель', type: 'text' }, { name: 'Альбом', type: 'text' }, { name: 'Год выпуска', type: 'number' }, { name: 'Состояние', type: 'text' }] },
    { id: 'watches', name: '⌚ Часы', description: 'Для коллекции часов', icon: '⌚', fields: [{ name: 'Бренд', type: 'text' }, { name: 'Модель', type: 'text' }, { name: 'Механизм', type: 'text' }, { name: 'Год выпуска', type: 'number' }] },
];

export default function CollectionForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [openModal, setOpenModal] = useState(!id);
    const [creationMode, setCreationMode] = useState<'template' | 'custom'>('template');
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [customFields, setCustomFields] = useState<{ name: string; type: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(!!id);

    // Загружаем данные коллекции при редактировании
    useEffect(() => {
        if (id) {
            setInitialLoading(true);
            getCollectionById(Number(id))
                .then((res:any) => {
                    const col = res.data;
                    setName(col.name);
                    setDescription(col.description || '');
                    setCustomFields(col.custom_fields);
                    if (col.image_path) {
                        setImagePreview(`http://localhost:8000/${col.image_path}`);
                    }
                })
                .catch(err => {
                    console.error('Ошибка загрузки коллекции:', err);
                    setError('Ошибка загрузки коллекции');
                })
                .finally(() => setInitialLoading(false));
        }
    }, [id]);

    const filteredTemplates = TEMPLATES.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const applyTemplate = (template: any) => {
        setSelectedTemplate(template);
        setName(template.name.replace(/[^\w\s]/g, '').trim());
        setDescription(template.description);
        setCustomFields(template.fields);
        setOpenModal(false);
        setIsEditing(false);
    };

    const handleCustomCreate = () => {
        setCreationMode('custom');
        setOpenModal(false);
        setIsEditing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (customFields.some(f => !f.name)) {
            setError('Заполните названия всех полей');
            return;
        }
        setLoading(true);
        setError('');
        try {
            let response;
            if (id) {
                // Обновление существующей коллекции
                response = await updateCollection(Number(id), { name, description, custom_fields: customFields });
            } else {
                // Создание новой коллекции
                response = await createCollection({ name, description, custom_fields: customFields });
            }
            const collectionId = response.data.id;
            if (imageFile) {
                await uploadCollectionImage(collectionId, imageFile);
            }
            navigate('/collections');
        } catch (err) {
            setError('Ошибка сохранения');
        }
        setLoading(false);
    };

    const addField = () => setCustomFields([...customFields, { name: '', type: 'text' }]);
    const updateField = (index: number, field: string, value: string) => {
        const newFields = [...customFields];
        newFields[index] = { ...newFields[index], [field]: value };
        setCustomFields(newFields);
    };
    const removeField = (index: number) => setCustomFields(customFields.filter((_, i) => i !== index));

    if (initialLoading) return <CircularProgress />;

    // Модальное окно выбора шаблона (только для НОВОЙ коллекции)
    if (openModal && !id) {
        return (
            <Dialog open={openModal} onClose={() => navigate('/collections')} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: '#1A73E8', color: 'white', textAlign: 'center', py: 2 }}>
                    ✨ Создание новой коллекции
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <Box sx={{ p: 3, bgcolor: '#F8F4E9' }}>
                        <RadioGroup
                            value={creationMode}
                            onChange={(e) => setCreationMode(e.target.value as 'template' | 'custom')}
                            sx={{ flexDirection: 'row', justifyContent: 'center', gap: 4, mb: 3 }}
                        >
                            <FormControlLabel value="template" control={<Radio />} label="📋 Использовать шаблон" />
                            <FormControlLabel value="custom" control={<Radio />} label="⚙️ Создать с нуля" />
                        </RadioGroup>

                        {creationMode === 'custom' ? (
                            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                                <Create sx={{ fontSize: 64, color: '#1A73E8', mb: 2 }} />
                                <Typography variant="h6" gutterBottom>Создание с нуля</Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                    Вы сможете самостоятельно добавить любые поля
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                    <Button variant="outlined" onClick={() => navigate('/collections')}>Отмена</Button>
                                    <Button variant="contained" onClick={handleCustomCreate} sx={{ bgcolor: '#1A73E8' }}>Продолжить</Button>
                                </Box>
                            </Card>
                        ) : (
                            <>
                                <TextField
                                    fullWidth
                                    placeholder="🔍 Поиск шаблонов..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
                                    slotProps={{ input: { startAdornment: <span style={{ marginRight: 8 }}>🔍</span> } }}
                                />
                                <Grid container spacing={2}>
                                    {filteredTemplates.map((template) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={template.id}>
                                            <Card sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' } }} onClick={() => applyTemplate(template)}>
                                                <CardContent sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h2" sx={{ fontSize: 48 }}>{template.icon}</Typography>
                                                    <Typography variant="h6">{template.name}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{template.fields.length} полей</Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                                    <Button variant="outlined" onClick={() => navigate('/collections')}>Отмена</Button>
                                </Box>
                            </>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    // ФОРМА СОЗДАНИЯ/РЕДАКТИРОВАНИЯ КОЛЛЕКЦИИ
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8F4E9', py: 4 }}>
            <Container maxWidth="md">
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/collections')} sx={{ mb: 3, color: '#1A73E8' }}>
                    Назад к коллекциям
                </Button>

                <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <Box sx={{ bgcolor: '#1A73E8', px: 4, py: 3 }}>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 500 }}>
                            {id ? '✏️ Редактировать коллекцию' : '✨ Новая коллекция'}
                        </Typography>
                    </Box>

                    <Box sx={{ p: 4 }}>
                        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                        <form onSubmit={handleSubmit}>
                            

                            {/* Название коллекции */}
                            <TextField
                                fullWidth
                                label="Название коллекции"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                sx={{ mb: 3 }}
                            />

                            {/* Описание коллекции */}
                            <TextField
                                fullWidth
                                label="Описание"
                                multiline
                                rows={3}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                sx={{ mb: 3 }}
                            />

                            {/* Пользовательские поля */}
                            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2, color: '#1A73E8' }}>
                                📋 Пользовательские поля
                            </Typography>

                            {customFields.map((field, idx) => (
                                <Grid container spacing={2} key={idx} sx={{ mb: 2 }}>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField size="small" label="Название" value={field.name} onChange={e => updateField(idx, 'name', e.target.value)} fullWidth required />
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
                                        <TextField size="small" select label="Тип" value={field.type} onChange={e => updateField(idx, 'type', e.target.value)} fullWidth>
                                            <MenuItem value="text">📝 Текст</MenuItem>
                                            <MenuItem value="number">🔢 Число</MenuItem>
                                            <MenuItem value="date">📅 Дата</MenuItem>
                                            <MenuItem value="boolean">✅ Да/Нет</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid size={{ xs: 2 }}>
                                        <Button variant="outlined" color="error" size="small" onClick={() => removeField(idx)} fullWidth sx={{ height: '100%' }}>🗑️</Button>
                                    </Grid>
                                </Grid>
                            ))}

                            <Button variant="outlined" onClick={addField} sx={{ mb: 4, borderColor: '#1A73E8', color: '#1A73E8' }}>
                                + Добавить поле
                            </Button>

                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button variant="outlined" onClick={() => navigate('/collections')}>Отмена</Button>
                                <Button type="submit" variant="contained" disabled={loading} sx={{ bgcolor: '#1A73E8' }}>
                                    {loading ? 'Сохранение...' : 'Сохранить коллекцию'}
                                </Button>
                            </Box>
                        </form>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}