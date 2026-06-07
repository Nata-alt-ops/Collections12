import { useState } from 'react';
import { Container, Paper, Typography, Avatar, Box, Button, TextField, Alert, Divider, Link } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import BackButton from '../components/BackButton';
import api from '../services/api';  // Попробуйте оба варианта

export default function Profile() {
    const { user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [email, setEmail] = useState(user?.email || '');
    const [username, setUsername] = useState(user?.username || '');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const getInitials = () => {
        return user?.username?.charAt(0).toUpperCase() || 'U';
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.put('/auth/profile', { email, username });
            setSuccess('Данные профиля обновлены');
            setIsEditing(false);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка обновления');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('Новый пароль и подтверждение не совпадают');
            return;
        }
        if (newPassword.length < 6) {
            setError('Пароль должен быть не менее 6 символов');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await api.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
            }
            
            setSuccess('Пароль успешно изменён');
            setIsChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка смены пароля');
        } finally {
            setLoading(false);
        }
    };

    const handleSendFeedback = () => {
        window.location.href = 'mailto:feedback@digitalcollections.ru?subject=Отзыв о приложении Digital Collections';
    };

    return (
        <Container maxWidth="md" sx={{ mt: 3, mb: 4 }}>
            <BackButton />
            
            <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ width: 100, height: 100, bgcolor: '#1A73E8', fontSize: 40, mb: 2 }}>
                        {getInitials()}
                    </Avatar>
                    <Typography variant="h5">{user?.username}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Пользователь</Typography>
                </Box>

                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                    {isEditing ? (
                        <>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Имя пользователя"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                margin="normal"
                            />
                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                <Button variant="outlined" fullWidth onClick={() => setIsEditing(false)}>
                                    Отмена
                                </Button>
                                <Button variant="contained" fullWidth onClick={handleSaveProfile} disabled={loading} sx={{ bgcolor: '#1A73E8' }}>
                                    {loading ? 'Сохранение...' : 'Сохранить'}
                                </Button>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Email</Typography>
                                <Typography variant="body1">{user?.email || '—'}</Typography>
                            </Box>
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Имя пользователя</Typography>
                                <Typography variant="body1">{user?.username}</Typography>
                            </Box>
                            <Button 
                                variant="outlined" 
                                fullWidth 
                                onClick={() => setIsEditing(true)} 
                                sx={{ mt: 2, borderColor: '#1A73E8', color: '#1A73E8' }}
                            >
                                ✏️ Редактировать профиль
                            </Button>
                        </>
                    )}

                    {!isEditing && !isChangingPassword && (
                        <Button 
                            variant="outlined" 
                            fullWidth 
                            onClick={() => setIsChangingPassword(true)} 
                            sx={{ mt: 2, borderColor: '#1A73E8', color: '#1A73E8' }}
                        >
                            🔒 Сменить пароль
                        </Button>
                    )}

                    {isChangingPassword && (
                        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>Смена пароля</Typography>
                            <TextField
                                fullWidth
                                type="password"
                                label="Текущий пароль"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                margin="normal"
                                size="small"
                            />
                            <TextField
                                fullWidth
                                type="password"
                                label="Новый пароль"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                margin="normal"
                                size="small"
                            />
                            <TextField
                                fullWidth
                                type="password"
                                label="Подтвердите пароль"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                margin="normal"
                                size="small"
                            />
                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                <Button variant="outlined" fullWidth onClick={() => setIsChangingPassword(false)}>
                                    Отмена
                                </Button>
                                <Button variant="contained" fullWidth onClick={handleChangePassword} disabled={loading} sx={{ bgcolor: '#1A73E8' }}>
                                    {loading ? 'Смена...' : 'Сменить пароль'}
                                </Button>
                            </Box>
                        </Box>
                    )}

                

                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: '#9AA0A6' }}>
                        Все пожелания и критику вы можете отправить на почту:<br/>
                        <Link href="mailto:feedback@digitalcollections.ru" underline="hover" sx={{ color: '#1A73E8' }}>
                            feedback@digitalcollections.ru
                        </Link>
                    </Typography>

                   

                    <Button 
                        variant="text" 
                        color="error" 
                        fullWidth 
                        onClick={logout} 
                        sx={{ mt: 1 }}
                    >
                        Выйти из аккаунта
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}