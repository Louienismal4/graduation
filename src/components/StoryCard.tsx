'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share2, Loader2, CheckCircle2 } from 'lucide-react';
import { generateStoryCard } from '@/lib/imageUtils';
import styles from './StoryCard.module.css';

interface StoryCardProps {
  imageUrl: string;
  journalEntry: string;
  onReset: () => void;
}

export default function StoryCard({ imageUrl, journalEntry, onReset }: StoryCardProps) {
  const [storyDataUrl, setStoryDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    async function createCard() {
      try {
        const dataUrl = await generateStoryCard(imageUrl, journalEntry);
        setStoryDataUrl(dataUrl);
      } catch (error) {
        console.error('Failed to generate story card:', error);
      } finally {
        setLoading(false);
      }
    }
    createCard();
  }, [imageUrl, journalEntry]);

  const handleDownload = () => {
    if (!storyDataUrl) return;
    const link = document.createElement('a');
    link.href = storyDataUrl;
    link.download = `graduation-moment-${Date.now()}.png`;
    link.click();
  };

  const handleShare = async () => {
    if (!storyDataUrl) return;

    try {
      // Convert data URL to Blob
      const res = await fetch(storyDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'graduation-moment.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Graduation 2026 Moment',
          text: 'Check out my graduation time capsule moment!',
        });
      } else {
        // Fallback: Copy to clipboard (or just show success if we can't do much else in browser)
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch (error) {
      console.error('Sharing failed:', error);
    }
  };

  return (
    <div className={styles.cardContainer}>
      <div className={styles.cardHeader}>
        <CheckCircle2 className={styles.successIcon} />
        <h2 className={styles.title}>Moment Sealed!</h2>
        <p className={styles.subtitle}>Your story card is ready to share.</p>
      </div>

      <div className={styles.previewContainer}>
        {loading ? (
          <div className={styles.loader}>
            <Loader2 className="animate-spin" size={40} />
            <p>Generating your Story Card...</p>
          </div>
        ) : storyDataUrl ? (
          <img src={storyDataUrl} alt="Graduation Story Card" className={styles.storyImage} />
        ) : (
          <div className={styles.error}>Failed to generate preview.</div>
        )}
      </div>

      <div className={styles.actions}>
        <button 
          onClick={handleDownload} 
          className={styles.downloadButton}
          disabled={!storyDataUrl}
        >
          <Download size={20} />
          <span>Download</span>
        </button>
        <button 
          onClick={handleShare} 
          className={styles.shareButton}
          disabled={!storyDataUrl}
        >
          {shared ? <CheckCircle2 size={20} /> : <Share2 size={20} />}
          <span>{shared ? 'Link Copied' : 'Share'}</span>
        </button>
      </div>

      <button onClick={onReset} className={styles.resetButton}>
        Capture Another
      </button>
    </div>
  );
}
