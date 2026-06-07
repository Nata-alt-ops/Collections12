import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import { useLocation, Link as RouterLink, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const pathnames = location.pathname.split('/').filter((x) => x);

    const getPathName = (path: string) => {
        switch (path) {
            case 'dashboard': return 'Дашборд';
            case 'collections': return 'Коллекции';
            case 'items': return 'Предметы';
            case 'new': return 'Создание';
            case 'edit': return 'Редактирование';
            default: return path;
        }
    };

    if (pathnames.length === 0) return null;

    return (
        <Box sx={{ px: 3, py: 1.5, background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <MuiBreadcrumbs separator={<NavigateNextIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.7)' }} />}>
                <Link component={RouterLink} to="/dashboard" sx={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                    <HomeIcon sx={{ mr: 0.5 }} fontSize="small" /> Главная
                </Link>
                {pathnames.map((name, index) => {
                    const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    return isLast ? (
                        <Typography key={name} sx={{ color: 'white' }}>
                            {getPathName(name)}
                        </Typography>
                    ) : (
                        <Link key={name} component={RouterLink} to={routeTo} sx={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                            {getPathName(name)}
                        </Link>
                    );
                })}
            </MuiBreadcrumbs>
        </Box>
    );
};

export default Breadcrumbs;