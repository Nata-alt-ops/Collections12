import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, Paper, TextField, Button, Typography, Box, 
    FormControlLabel, Checkbox, CircularProgress, Grid, Divider 
} from '@mui/material';
import { ArrowBack, CloudUpload } from '@mui/icons-material';
import { createItem, updateItem, getItems, getCollections, uploadImage } from '../services/api';
import { Collection } from '../types';

export default function ItemForm() {
    const { collectionId, itemId } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [customValues, setCustomValues] = useState<Record<string, any>>({});
    const [collection, setCollection] = useState<Collection | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        getCollections().then(res => {
            const col = res.data.find(c => c.id === Number(collectionId));
            setCollection(col || null);
            if (col) {
                const defaults: Record<string, any> = {};
                col.custom_fields.forEach(f => {
                    if (f.type === 'boolean') defaults[f.name] = false;
                    else defaults[f.name] = '';
                });
                setCustomValues(defaults);
            }
        });
        if (itemId) {
            getItems(Number(collectionId)).then(res => {
                const item = res.data.find(i => i.id === Number(itemId));
                if (item) {
                    setTitle(item.title);
                    setCustomValues(item.custom_values);
                    if (item.image_path) setImagePreview(`http://localhost:8000/${item.image_path}`);
                }
            });
        }
    }, [collectionId, itemId]);

    const handleCustomChange = (name: string, value: any, type: string) => {
        let newValue = value;
        if (type === 'number') newValue = value === '' ? null : Number(value);
        setCustomValues({ ...customValues, [name]: newValue });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Введите название предмета');
            return;
        }
        setSaving(true);
        setError('');
        try {
            let item;
            if (itemId) {
                const res = await updateItem(Number(itemId), { title, custom_values: customValues });
                item = res.data;
            } else {
                const res = await createItem(Number(collectionId), { title, custom_values: customValues });
                item = res.data;
            }
            if (imageFile) await uploadImage(item.id, imageFile);
            navigate(`/collections/${collectionId}/items`);
        } catch (err) { 
            setError('Ошибка сохранения предмета');
        }
        setSaving(false);
    };

    const fillExample = () => {
        const example: Record<string, any> = {};
        collection?.custom_fields.forEach(f => {
            if (f.type === 'text') example[f.name] = `Пример ${f.name}`;
            if (f.type === 'number') example[f.name] = 100;
            if (f.type === 'date') example[f.name] = new Date().toISOString().split('T')[0];
            if (f.type === 'boolean') example[f.name] = true;
        });
        setCustomValues(example);
        setTitle('Пример предмета');
    };

    if (!collection) return <CircularProgress />;

    const renderField = (field: { name: string; type: string }) => {
        const value = customValues[field.name] ?? '';
        switch (field.type) {
            case 'text':
                return (
                    <TextField
                        key={field.name}
                        fullWidth
                        label={field.name}
                        value={value}
                        onChange={e => handleCustomChange(field.name, e.target.value, 'text')}
                        variant="outlined"
                        size="small"
                    />
                );
            case 'number':
                return (
                    <TextField
                        key={field.name}
                        fullWidth
                        label={field.name}
                        type="number"
                        value={value}
                        onChange={e => handleCustomChange(field.name, e.target.value, 'number')}
                        variant="outlined"
                        size="small"
                    />
                );
            case 'date':
                return (
                    <TextField
                        key={field.name}
                        fullWidth
                        label={field.name}
                        type="date"
                        value={value}
                        onChange={e => handleCustomChange(field.name, e.target.value, 'date')}
                        variant="outlined"
                        size="small"
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                );
            case 'boolean':
                return (
                    <FormControlLabel
                        key={field.name}
                        control={
                            <Checkbox
                                checked={!!value}
                                onChange={e => handleCustomChange(field.name, e.target.checked, 'boolean')}
                            />
                        }
                        label={field.name}
                    />
                );
            default: return null;
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8F4E9', py: 4 }}>
            <Container maxWidth="md">
                <Button 
                    startIcon={<ArrowBack />} 
                    onClick={() => navigate(-1)}
                    sx={{ mb: 3, color: '#1A73E8' }}
                >
                    Назад
                </Button>

                <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <Box sx={{ bgcolor: '#1A73E8', px: 4, py: 3 }}>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 500 }}>
                            {itemId ? '✏️ Редактировать предмет' : '✨ Добавить предмет'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
                            {collection?.name}
                        </Typography>
                    </Box>

                    <Box sx={{ p: 4 }}>
                        {error && (
                            <Box sx={{ bgcolor: '#FCE8E6', color: '#D93025', p: 2, borderRadius: 2, mb: 3 }}>
                                {error}
                            </Box>
                        )}

                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Название предмета"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                variant="outlined"
                                sx={{ mb: 3 }}
                                placeholder="Например: Серебряная монета 1896 года"
                            />

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2, color: '#1A73E8' }}>
                                📋 Дополнительные характеристики
                            </Typography>
                            <Grid container spacing={2}>
                                {collection.custom_fields.map(f => (
                                    <Grid size={{ xs: 12, sm: f.type === 'boolean' ? 12 : 6 }} key={f.name}>
                                        {renderField(f)}
                                    </Grid>
                                ))}
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2, color: '#1A73E8' }}>
                                🖼️ Изображение
                            </Typography>
                            
                            <Box
                                sx={{
                                    border: '2px dashed #DADCE0',
                                    borderRadius: 3,
                                    p: 3,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    bgcolor: imagePreview ? '#E8F0FE' : 'transparent',
                                    '&:hover': { borderColor: '#1A73E8', bgcolor: '#E8F0FE' }
                                }}
                                onClick={() => document.getElementById('imageInput')?.click()}
                            >
                                <input
                                    id="imageInput"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={e => {
                                        if (e.target.files?.[0]) {
                                            setImageFile(e.target.files[0]);
                                            setImagePreview(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }}
                                />
                                {imagePreview ? (
                                    <Box>
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginBottom: 12 }} 
                                        />
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                            <Button 
                                                size="small" 
                                                variant="outlined" 
                                                onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                                                sx={{ borderColor: '#D93025', color: '#D93025' }}
                                            >
                                                Удалить фото
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box>
                                        <CloudUpload sx={{ fontSize: 48, color: '#1A73E8', mb: 1 }} />
                                        <Typography variant="body2" sx={{ color: '#5F6368' }}>
                                            Нажмите для загрузки изображения
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#9AA0A6' }}>
                                            PNG, JPG, GIF до 5MB
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                                <Button 
                                    variant="outlined" 
                                    onClick={() => navigate(-1)}
                                    sx={{ borderColor: '#DADCE0', color: '#5F6368' }}
                                >
                                    Отмена
                                </Button>
                                <Button 
                                    type="submit" 
                                    variant="contained" 
                                    disabled={saving}
                                    sx={{ bgcolor: '#1A73E8', '&:hover': { bgcolor: '#1661C4' }, minWidth: 120 }}
                                >
                                    {saving ? 'Сохранение...' : 'Сохранить предмет'}
                                </Button>
                            </Box>
                        </form>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}