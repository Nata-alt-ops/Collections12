import { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, IconButton, InputAdornment, Link } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        if (password.length < 6) {
            setError('Пароль должен содержать не менее 6 символов');
            return;
        }
        setLoading(true);
        try {
            await register(email, username, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Ошибка регистрации. Возможно, пользователь уже существует.');
        }
        setLoading(false);
    };

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center',
            background: '#F8F4E9'
        }}>
            <Container maxWidth="md">
                <Paper elevation={6} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                        {/* Левая панель */}
                        <Box sx={{ 
                            flex: 1, 
                            bgcolor: '#1A73E8', 
                            color: 'white', 
                            p: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Collection
                            </Typography>
                            <Typography variant="subtitle1" sx={{ mb: 3, opacity: 0.9 }}>
                                Пройдите регистрацию на сайт
                            </Typography>
                        </Box>

                        {/* Правая панель */}
                        <Box sx={{ flex: 1, p: 4, bgcolor: 'white' }}>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Регистрация
                            </Typography>
                            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                            <form onSubmit={handleSubmit}>
                                <TextField
                                    fullWidth
                                    label="Электронная почта"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    margin="normal"
                                    autoFocus
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Имя пользователя"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    margin="normal"
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Пароль"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    margin="normal"
                                    required
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    label="Подтвердите пароль"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    margin="normal"
                                    required
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                />

                                <Button 
                                    type="submit" 
                                    fullWidth 
                                    variant="contained" 
                                    size="large"
                                    disabled={loading}
                                    sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: '#1A73E8', '&:hover': { bgcolor: '#1661c4' } }}
                                >
                                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                                </Button>

                                <Typography variant="body2" align="center">
                                    Уже есть аккаунт?{' '}
                                    <Link href="#" underline="hover" onClick={() => navigate('/login')}>
                                        Войдите
                                    </Link>
                                </Typography>
                            </form>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}