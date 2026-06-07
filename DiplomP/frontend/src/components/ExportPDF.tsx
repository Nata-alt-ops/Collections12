import { Button } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

interface ExportDOCXProps {
    items: any[];
    collectionName: string;
}

export default function ExportDOCX({ items, collectionName }: ExportDOCXProps) {
    const exportToDoc = () => {
        if (items.length === 0) {
            alert('Нет предметов для экспорта');
            return;
        }

        let docContent = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Каталог коллекции ${collectionName}</title>
            <style>
                body {
                    font-family: 'Times New Roman', Arial, sans-serif;
                    margin: 30px;
                }
                h1 {
                    color: #1A73E8;
                    text-align: center;
                    font-size: 24px;
                    border-bottom: 2px solid #1A73E8;
                    padding-bottom: 10px;
                }
                h2 {
                    text-align: center;
                    color: #5F6368;
                    font-size: 16px;
                    margin-bottom: 30px;
                }
                .info {
                    text-align: center;
                    margin: 20px 0;
                    color: #666;
                }
                .item {
                    margin-bottom: 20px;
                    padding: 12px;
                    border-bottom: 1px solid #ddd;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    page-break-inside: avoid;
                }
                .item-image {
                    width: 100px;
                    height: 100px;
                    flex-shrink: 0;
                    background: #f5f5f5;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .item-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .item-image .no-image {
                    font-size: 32px;
                }
                .item-info {
                    flex: 1;
                }
                .item-title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #1A73E8;
                    margin-bottom: 8px;
                }
                .fields {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px 16px;
                }
                .field {
                    font-size: 12px;
                    min-width: 120px;
                }
                .field-label {
                    font-weight: bold;
                    color: #5F6368;
                }
                .field-value {
                    color: #202124;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #ddd;
                    font-size: 10px;
                    color: #999;
                }
            </style>
        </head>
        <body>
            <h1>Каталог коллекции</h1>
            <h2>${collectionName}</h2>
            <div class="info">Всего предметов: ${items.length} | Дата: ${new Date().toLocaleDateString('ru-RU')}</div>
            <hr/>
        `;

        items.forEach((item, idx) => {
            // Формируем правильный путь для картинки
            let imageUrl = '';
            if (item.image_path) {
                if (item.image_path.startsWith('http')) {
                    imageUrl = item.image_path;
                } else if (item.image_path.startsWith('uploads/')) {
                    imageUrl = `http://localhost:8000/${item.image_path}`;
                } else {
                    imageUrl = `http://localhost:8000/uploads/${item.image_path}`;
                }
            }
            
            docContent += `
                <div class="item">
                    <div class="item-image">
                        ${imageUrl ? 
                            `<img src="${imageUrl}" alt="${item.title}" />` : 
                            '<div class="no-image">📷</div>'
                        }
                    </div>
                    <div class="item-info">
                        <div class="item-title">${idx + 1}. ${item.title}</div>
                        <div class="fields">
            `;
            
            Object.entries(item.custom_values).forEach(([key, value]) => {
                let displayValue = String(value);
                if (typeof value === 'boolean') displayValue = value ? 'Да' : 'Нет';
                docContent += `
                            <div class="field">
                                <span class="field-label">${key}:</span>
                                <span class="field-value">${displayValue}</span>
                            </div>
                `;
            });
            
            docContent += `
                        </div>
                    </div>
                </div>
            `;
        });

        docContent += `
            <div class="footer">
                Сгенерировано в Digital Collections • ${new Date().toLocaleString('ru-RU')}
            </div>
        </body>
        </html>`;

        const bom = "\uFEFF";
        const blob = new Blob([bom + docContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${collectionName.replace(/\s/g, '_')}_каталог.doc`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (items.length === 0) {
        return (
            <Button variant="contained" disabled startIcon={<PictureAsPdfIcon />} sx={{ bgcolor: '#1A73E8' }}>
                Нет предметов
            </Button>
        );
    }

    return (
        <Button 
            variant="contained" 
            startIcon={<PictureAsPdfIcon />} 
            onClick={exportToDoc}
            sx={{ bgcolor: '#1A73E8', '&:hover': { bgcolor: '#1661C4' } }}
        >
            Сохранить каталог (DOC)
        </Button>
    );
}