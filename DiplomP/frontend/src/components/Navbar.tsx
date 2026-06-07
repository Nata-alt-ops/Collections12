import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, Avatar, TextField, InputAdornment, useMediaQuery, Drawer, List, ListItem, ListItemText } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuIcon from '@mui/icons-material/Menu';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
    toggleTheme?: () => void;
    isDarkMode?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleTheme, isDarkMode = false }) => {
    const { user, logout, isAdmin } = useAuth(); // Объединили вызов useAuth()
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchQuery) {
            navigate(`/search?q=${searchQuery}`);
            setSearchQuery('');
        }
    };

    const getInitials = () => {
        return user?.username?.charAt(0).toUpperCase() || 'U';
    };

    const menuItems = [
        { text: '📁 Коллекции', path: '/collections' },
    ];

    // Добавляем пункт админ-панели, если пользователь администратор
    if (isAdmin) {
        menuItems.push({ text: '👑 Админ-панель', path: '/admin' });
    }

    return (
        <>
            <AppBar position="sticky" sx={{ background: isDarkMode ? '#1a1a2e' : '#1A73E8', backdropFilter: 'blur(10px)' }}>
                <Toolbar>
                    {isMobile && (
                        <IconButton color="inherit" onClick={() => setDrawerOpen(true)} edge="start" sx={{ mr: 2 }}>
                            <MenuIcon />
                        </IconButton>
                    )}
                    
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            flexGrow: 1, 
                            cursor: 'pointer', 
                            fontWeight: 700,
                            fontSize: isMobile ? '1rem' : '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }} 
                        onClick={() => navigate('/dashboard')}
                    >
                        Collections
                    </Typography>

                    {/* Десктопное меню */}
                    {!isMobile && (
                        <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                            {menuItems.map((item) => (
                                <Button 
                                    key={item.path}
                                    color="inherit" 
                                    onClick={() => navigate(item.path)}
                                    sx={{ 
                                        fontWeight: location.pathname === item.path ? 700 : 400,
                                        borderBottom: location.pathname === item.path ? '2px solid white' : 'none',
                                        borderRadius: 0
                                    }}
                                >
                                    {item.text}
                                </Button>
                            ))}
                        </Box>
                    )}

                    {/* Поиск (опционально, можно раскомментировать) */}
                    {/* <TextField
                        size="small"
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleSearch}
                        sx={{ 
                            mr: 2, 
                            bgcolor: 'rgba(255,255,255,0.15)', 
                            borderRadius: 2,
                            '& .MuiInputBase-root': { color: 'white' },
                            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
                        }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    /> */}

                    {toggleTheme && (
                        <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
                            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    )}

                    <IconButton color="inherit" sx={{ mr: 1 }}>
                        <NotificationsIcon />
                    </IconButton>

                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#ffffff', color: '#1A73E8' }}>
                            {getInitials()}
                        </Avatar>
                    </IconButton>

                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                            <AccountCircleIcon sx={{ mr: 1 }} /> Профиль
                        </MenuItem>
                        {isAdmin && (
                            <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin'); }}>
                                <AdminPanelSettingsIcon sx={{ mr: 1 }} /> Админ-панель
                            </MenuItem>
                        )}
                        <MenuItem onClick={() => { logout(); setAnchorEl(null); }}>
                            Выйти
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Мобильное меню (Drawer) */}
            <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: 280, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                        <Avatar sx={{ bgcolor: '#1A73E8' }}>
                            {getInitials()}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                {user?.username}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {isAdmin ? 'Администратор' : 'Пользователь'}
                            </Typography>
                        </Box>
                    </Box>
                    
                    <List>
                        <ListItem 
                            component="button" 
                            onClick={() => {
                                navigate('/dashboard');
                                setDrawerOpen(false);
                            }}
                            sx={{ 
                                borderRadius: 2, 
                                mb: 1,
                                bgcolor: location.pathname === '/dashboard' ? '#E8F0FE' : 'transparent',
                                color: location.pathname === '/dashboard' ? '#1A73E8' : 'inherit',
                                '&:hover': { bgcolor: '#E8F0FE' }
                            }}
                        >
                            <ListItemText primary="📊 Дашборд" />
                        </ListItem>
                        
                        {menuItems.map((item) => (
                            <ListItem 
                                key={item.path} 
                                component="button" 
                                onClick={() => {
                                    navigate(item.path);
                                    setDrawerOpen(false);
                                }}
                                sx={{ 
                                    borderRadius: 2, 
                                    mb: 1,
                                    bgcolor: location.pathname === item.path ? '#E8F0FE' : 'transparent',
                                    color: location.pathname === item.path ? '#1A73E8' : 'inherit',
                                    '&:hover': { bgcolor: '#E8F0FE' }
                                }}
                            >
                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                        
                        <ListItem 
                            component="button" 
                            onClick={() => {
                                navigate('/profile');
                                setDrawerOpen(false);
                            }}
                            sx={{ 
                                borderRadius: 2, 
                                mb: 1,
                                bgcolor: location.pathname === '/profile' ? '#E8F0FE' : 'transparent'
                            }}
                        >
                            <ListItemText primary="👤 Профиль" />
                        </ListItem>
                        
                        <ListItem 
                            component="button" 
                            onClick={() => {
                                logout();
                                setDrawerOpen(false);
                            }}
                            sx={{ 
                                borderRadius: 2, 
                                mt: 2,
                                color: '#dc3545',
                                '&:hover': { bgcolor: '#FCE8E6' }
                            }}
                        >
                            <ListItemText primary="🚪 Выйти" />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
        </>
    );
};

export default Navbar;