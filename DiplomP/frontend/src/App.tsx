import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CollectionsList from './pages/CollectionsList';
import CollectionForm from './pages/CollectionForm';
import ItemsList from './pages/ItemsList';
import ItemForm from './pages/ItemForm';
import Profile from './pages/Profile';
import VisualSearch from './pages/VisualSearch';
import ShowcaseBuilder from './pages/ShowcaseBuilder';
import Timeline from './pages/Timeline';
import AdminPanel from './pages/AdminPanel';
import Breadcrumbs from './components/Breadcrumbs';

const theme = createTheme({
    palette: { primary: { main: '#1A73E8' } },
    typography: { fontFamily: '"Roboto", "Arial", sans-serif' }
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={
                            <PrivateRoute>
                                <>
                                    <Navbar />
                                    <Breadcrumbs />
                                    <Dashboard />
                                </>
                            </PrivateRoute>
                        } />
                        <Route path="/dashboard" element={
                            <PrivateRoute>
                                <>
                                    <Navbar />
                                    <Breadcrumbs />
                                    <Dashboard />
                                </>
                            </PrivateRoute>
                        } />
                        <Route path="/collections" element={
                            <PrivateRoute>
                                <>
                                    <Navbar />
                                    <Breadcrumbs />
                                    <CollectionsList />
                                </>
                            </PrivateRoute>
                        } />
                        <Route path="/collections/new" element={
                            <PrivateRoute>
                                <>
                                    <Navbar />
                                    <Breadcrumbs />
                                    <CollectionForm />
                                </>
                            </PrivateRoute>
                        } />
                        <Route path="/collections/:collectionId/items" element={
                            <PrivateRoute>
                                <>
                                    <Navbar />
                                    <Breadcrumbs />
                                    <ItemsList />
                                </>
                            </PrivateRoute>
                        } />
                        <Route path="/collections/:collectionId/items/new" element={
                            <PrivateRoute>
                                <>
                                    <Navbar />
                                    <Breadcrumbs />
                                    <ItemForm />
                                </>
                            </PrivateRoute>
                        } />
                        <Route path="/collections/:collectionId/items/:itemId/edit" element={
                            <PrivateRoute>
                                <>
                                    <Navbar />
                                    <Breadcrumbs />
                                    <ItemForm />
                                </>
                            </PrivateRoute>
                        } />
                        <Route path="/collections/:collectionId/visual-search" element={
                            <PrivateRoute>
                                <>
                                    <Navbar />
                                    <Breadcrumbs />
                                    <VisualSearch />
                                </>
                            </PrivateRoute>
                        } />
                        <Route path="/collections/:collectionId/showcase" element={
                            <PrivateRoute>
                                <>
                                    <Navbar />
                                    <Breadcrumbs />
                                    <ShowcaseBuilder />
                                </>
                            </PrivateRoute>
                        } />
                        <Route path="/collections/:collectionId/timeline" element={
                            <PrivateRoute>
                                <>
                                    <Navbar />
                                    <Breadcrumbs />
                                    <Timeline />
                                </>
                            </PrivateRoute>
                        } />
                        <Route path="/profile" element={
                            <PrivateRoute>
                                <>
                                    <Navbar />
                                    <Breadcrumbs />
                                    <Profile />
                                </>
                            </PrivateRoute>
                        } />
                        <Route path="/admin" element={
                            <PrivateRoute>
                                <>
                                    <Navbar />
                                    <Breadcrumbs />
                                    <AdminPanel />
                                </>
                            </PrivateRoute>
                        } />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;