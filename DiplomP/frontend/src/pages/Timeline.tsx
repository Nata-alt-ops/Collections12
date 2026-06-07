import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';
import { Timeline as MuiTimeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent, TimelineOppositeContent } from '@mui/lab';
import { Card, CardContent, CardMedia } from '@mui/material';
import { getItems, getCollections } from '../services/api';
import { Item, Collection } from '../types';

export default function Timeline() {
    const { collectionId } = useParams();
    const [items, setItems] = useState<Item[]>([]);
    const [collection, setCollection] = useState<Collection | null>(null);

    useEffect(() => {
        loadData();
    }, [collectionId]);

    const loadData = async () => {
        if (!collectionId) return;
        const colsRes = await getCollections();
        const col = colsRes.data.find(c => c.id === Number(collectionId));
        setCollection(col || null);
        
        const itemsRes = await getItems(Number(collectionId));
        // Сортируем по id (порядок добавления)
        const sorted = [...itemsRes.data].sort((a, b) => a.id - b.id);
        setItems(sorted);
    };

    const getItemImage = (item: Item) => {
        return item.image_path ? `http://localhost:8000/${item.image_path}` : null;
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#4d4a4a' }}>
                    📅 Хронология: {collection?.name}
                </Typography>
                <Typography variant="body1" sx={{ color: '#4d4a4a' }}>
                    История пополнения коллекции (по порядку добавления)
                </Typography>
            </Box>
            
            <Box sx={{ bgcolor: 'white', borderRadius: 3, p: 3, minHeight: 500 }}>
                {items.length === 0 ? (
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 5 }}>
                        Нет предметов для отображения на временной шкале
                    </Typography>
                ) : (
                    <MuiTimeline position="alternate">
                        {items.map((item, index) => {
                            const imageUrl = getItemImage(item);
                            return (
                                <TimelineItem key={item.id}>
                                    <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
                                        {index + 1} место
                                    </TimelineOppositeContent>
                                    <TimelineSeparator>
                                        <TimelineDot color="primary" />
                                        {index < items.length - 1 && <TimelineConnector />}
                                    </TimelineSeparator>
                                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                                        <Card sx={{ borderRadius: 3, maxWidth: 400, transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
                                            {imageUrl && (
                                                <CardMedia
                                                    component="img"
                                                    height="140"
                                                    image={imageUrl}
                                                    alt={item.title}
                                                    sx={{ objectFit: 'contain', p: 1 }}
                                                />
                                            )}
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    #{index + 1} {item.title}
                                                </Typography>
                                                {Object.entries(item.custom_values).slice(0, 3).map(([key, value]) => (
                                                    <Typography key={key} variant="body2" sx={{ color: 'text.secondary' }}>
                                                        <strong>{key}:</strong> {String(value)}
                                                    </Typography>
                                                ))}
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                                                    Добавлен в коллекцию
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </TimelineContent>
                                </TimelineItem>
                            );
                        })}
                    </MuiTimeline>
                )}
            </Box>
        </Container>
    );
}