import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/back-button.scss';

const BackButton: React.FC = () => {
    const navigate = useNavigate();
    
    return (
        <button className="back-btn" onClick={() => navigate(-1)}>
            ← Назад
        </button>
    );
};

export default BackButton;