import { useState, useEffect, MouseEvent } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, 
    Box, Typography, IconButton, Grid as Grid, MenuItem, Alert, CircularProgress 
} from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';
import { updateCollection, uploadCollectionImage, getCollectionById, getImageUrl } from '../services/api';

interface EditCollectionModalProps {
    open: boolean;
    collectionId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditCollectionModal({ open, collectionId, onClose, onSuccess }: EditCollectionModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [customFields, setCustomFields] = useState<{ name: string; type: string }[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImagePath, setExistingImagePath] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    // Функции для работы с полями
    const updateField = (index: number, field: string, value: string) => {
        const newFields = [...customFields];
        newFields[index] = { ...newFields[index], [field]: value };
        setCustomFields(newFields);
    };

    const removeField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const addField = () => {
        setCustomFields([...customFields, { name: '', type: 'text' }]);
    };

    // Загружаем данные коллекции
    useEffect(() => {
        if (open && collectionId) {
            setInitialLoading(true);
            setImageError(false);
            getCollectionById(collectionId)
                .then(res => {
                    const col = res.data;
                    setName(col.name);
                    setDescription(col.description || '');
                    setCustomFields(col.custom_fields || []);
                    if (col.image_path) {
                        setExistingImagePath(col.image_path);
                        const imageUrl = getImageUrl(col.image_path);
                        setImagePreview(imageUrl);
                    } else {
                        setExistingImagePath(null);
                        setImagePreview(null);
                    }
                })
                .catch(err => {
                    console.error(err);
                    setError('Ошибка загрузки коллекции');
                })
                .finally(() => setInitialLoading(false));
        }
    }, [open, collectionId]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Введите название коллекции');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await updateCollection(collectionId, { 
                name, 
                description, 
                custom_fields: customFields 
            });
            
            if (imageFile) {
                await uploadCollectionImage(collectionId, imageFile);
            }
            
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Ошибка сохранения');
        }
        setLoading(false);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            setImageError(false);
        }
    };

    const handleRemoveImage = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setImageFile(null);
        setImagePreview(null);
        setExistingImagePath(null);
        setImageError(false);
    };

    const handleImageLoadError = () => {
        setImageError(true);
    };

    // Очищаем URL объект при размонтировании
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    if (initialLoading) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogContent sx={{ textAlign: 'center', py: 5 }}>
                    <CircularProgress />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1A73E8', color: 'white' }}>
                ✏️ Редактировать коллекцию
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* Обложка */}
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: '#1A73E8' }}>
                    Обложка коллекции
                </Typography>
                <Box
                    sx={{
                        border: '2px dashed #DADCE0',
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        bgcolor: imagePreview ? '#E8F0FE' : 'transparent',
                        mb: 2,
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: '#1A73E8', bgcolor: '#E8F0FE' }
                    }}
                    onClick={() => document.getElementById('editCollectionImageInput')?.click()}
                >
                    <input
                        id="editCollectionImageInput"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageChange}
                    />
                    {imagePreview ? (
                        <Box>
                            <img 
                                src={imagePreview} 
                                alt="Preview" 
                                style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 8, objectFit: 'contain' }}
                                onError={handleImageLoadError}
                            />
                            {imageError && (
                                <Typography variant="caption" sx={{ color: '#dc3545', display: 'block', mt: 1 }}>
                                    ⚠️ Не удалось загрузить изображение
                                </Typography>
                            )}
                            <Button 
                                size="small" 
                                color="error" 
                                onClick={handleRemoveImage} 
                                sx={{ mt: 1 }}
                            >
                                <Delete fontSize="small" /> Удалить изображение
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            <CloudUpload sx={{ fontSize: 40, color: '#1A73E8' }} />
                            <Typography variant="caption" sx={{ color: '#5F6368', display: 'block' }}>
                                Нажмите для загрузки обложки
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9AA0A6', display: 'block', fontSize: 10 }}>
                                PNG, JPG, GIF до 5MB
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Название */}
                <TextField
                    fullWidth
                    label="Название коллекции"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    margin="normal"
                    size="small"
                />

                {/* Описание */}
                <TextField
                    fullWidth
                    label="Описание"
                    multiline
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    margin="normal"
                    size="small"
                />

                {/* Пользовательские поля */}
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 500, color: '#1A73E8' }}>
                    Пользовательские поля
                </Typography>
                
                {customFields.map((field, idx) => (
                    <Grid container spacing={1} key={idx} sx={{ mb: 1 }}>
                        <Grid size={6}>
                            <TextField
                                size="small"
                                label="Название поля"
                                value={field.name}
                                onChange={e => updateField(idx, 'name', e.target.value)}
                                fullWidth
                                placeholder="например: Автор"
                            />
                        </Grid>
                        <Grid size={4}>
                            <TextField
                                size="small"
                                select
                                label="Тип данных"
                                value={field.type}
                                onChange={e => updateField(idx, 'type', e.target.value)}
                                fullWidth
                            >
                                <MenuItem value="text">📝 Текст</MenuItem>
                                <MenuItem value="number">🔢 Число</MenuItem>
                                <MenuItem value="date">📅 Дата</MenuItem>
                                <MenuItem value="boolean">✅ Да/Нет</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={2}>
                            <Button 
                                variant="outlined" 
                                color="error" 
                                size="small" 
                                onClick={() => removeField(idx)} 
                                fullWidth
                                sx={{ height: '100%', minHeight: 40 }}
                            >
                                🗑️
                            </Button>
                        </Grid>
                    </Grid>
                ))}
                
                <Button 
                    variant="text" 
                    onClick={addField} 
                    sx={{ mt: 1, color: '#1A73E8' }}
                >
                    + Добавить поле
                </Button>
                
                {customFields.length === 0 && (
                    <Typography variant="caption" sx={{ color: '#9AA0A6', display: 'block', mt: 1 }}>
                        Добавьте поля для описания предметов (например: Автор, Год выпуска и т.д.)
                    </Typography>
                )}
            </DialogContent>
            
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button variant="outlined" onClick={onClose}>
                    Отмена
                </Button>
                <Button 
                    variant="contained" 
                    onClick={handleSubmit} 
                    disabled={loading}
                    sx={{ bgcolor: '#1A73E8', '&:hover': { bgcolor: '#1661C4' } }}
                >
                    {loading ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}