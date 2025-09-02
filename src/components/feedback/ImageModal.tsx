import React from 'react';
import './styles/ImageModal.css';

interface ImageModalProps {
    imageUrl: string | null;
    onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <div className="feedback-image-modal" onClick={onClose}>
            <div className="feedback-image-modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="feedback-close-modal" onClick={onClose}>&times;</span>
                <img src={imageUrl} alt="放大圖片" className="feedback-modal-image" />
            </div>
        </div>
    );
};