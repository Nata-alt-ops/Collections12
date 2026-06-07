import { useState } from 'react';
import { 
    Container, Paper, TextField, Button, Typography, Box, Checkbox, 
    FormControlLabel, Link, Divider, Alert, IconButton, InputAdornment 
} from '@mui/material';
import { Visibility, VisibilityOff, Google } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(username, password);
            if (rememberMe) {
                localStorage.setItem('remember', 'true');
            } else {
                localStorage.removeItem('remember');
            }
            navigate('/dashboard');
        } catch (err) {
            setError('Неверное имя пользователя или пароль');
        }
        setLoading(false);
    };
    const handleGoogleLogin = () => {
        alert('Вход через Google будет добавлен в следующей версии');
    };
    const handleForgotPassword = () => {
        alert('Функция восстановления пароля будет добавлена в следующей версии');
    };
    return (
         <Box sx={{minHeight: '100vh', display: 'flex', alignItems: 'center',background: '#F8F4E9'}}>
            <Container maxWidth="md">
                <Paper elevation={6} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                        {/* Левая панель*/}
                        <Box sx={{ flex: 1,  bgcolor: '#1A73E8', color: 'white', p: 4,display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Collection
                            </Typography>
                            <Typography variant="subtitle1" sx={{ mb: 3, opacity: 0.9 }}>
                                Все ваши коллекции в одном месте
                            </Typography>
                        </Box>
                        {/* Правая панель*/}
                        <Box sx={{ flex: 1, p: 4, bgcolor: 'white' }}>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold'}}>
                                Вход
                            </Typography>
                            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                            <form onSubmit={handleSubmit}>
                                <TextField fullWidth label="Логин" value={username} onChange={(e) => setUsername(e.target.value)} margin="normal" required autoFocus/>
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
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
                                    <FormControlLabel
                                        control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />}
                                        label="Запомнить меня"
                                    />
                                    <Link 
                                        component="button" 
                                        type="button" 
                                        underline="hover" 
                                        variant="body2"
                                        onClick={handleForgotPassword}
                                    >
                                        Забыли пароль?
                                    </Link>
                                </Box>
                                <Button 
                                    type="submit" 
                                    fullWidth 
                                    variant="contained" 
                                    size="large"
                                    disabled={loading}
                                    sx={{ mb: 2, py: 1.5, bgcolor: '#1A73E8', '&:hover': { bgcolor: '#1A73E8' } }}
                                >
                                    {loading ? 'Вход...' : 'Войти'}
                                </Button>
                                <Divider sx={{ my: 2 }}>или</Divider>
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    
                                    onClick={handleGoogleLogin}
                                    sx={{ mb: 2, py: 1.2 }}
                                >
                                    Войти через Yandex
                                </Button>

                                <Typography variant="body2" align="center">
                                    Нет аккаунта?{' '}
                                    <Link href="#" underline="hover" onClick={() => navigate('/register')}>
                                        Зарегистрируйтесь
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