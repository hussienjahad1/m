import React, { useState, useEffect, useMemo, useRef } from 'react';
// Fix: Import missing types
import type { User, SchoolSettings, ClassData, Student, Conversation, ChatMessage, MessageAttachment, StudentNotification } from '../../types';
import { db, storage } from '../../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { Send, Paperclip, X, Loader2, Image as ImageIcon, File as FileIcon, MessageCircle, Download, UserPlus, Users } from 'lucide-react';

// ===================================
// Reusable Lightbox Component
// ===================================
const ImageLightbox = ({ imageUrl, imageName, onClose }: { imageUrl: string; imageName: string; onClose: () => void; }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
                <img src={imageUrl} alt="Full size preview" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
                <button onClick={onClose} className="absolute -top-2 -right-2 bg-white text-black rounded-full p-2 shadow-lg hover:scale-110 transition-transform">
                    <X size={24} />
                </button>
                <a href={imageUrl} download={imageName} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-cyan-600 text-white rounded-lg flex items-center gap-2 hover:bg-cyan-700 transition-colors">
                    <Download size={20} />
                    تحميل الصورة
                </a>
            </div>
        </div>
    );
};


// ===================================
// Image Compression Utility
// ===================================
const compressImage = (file: File, maxSizeKB: number = 300, maxWidth: number = 1280): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
        resolve(file); // Don't process non-images
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      