'use client';

import React, { useEffect, useState } from 'react';
import { supabase, isPlaceholder } from '@/lib/supabase';
import { Loader2, X } from 'lucide-react';
import Image from 'next/image';
import styles from './GraduationWall.module.css';

interface Moment {
  id: string;
  image_url: string;
  journal_entry: string;
  created_at: string;
}

export default function GraduationWall() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);

  useEffect(() => {
    async function fetchMoments() {
      try {
        const { data, error } = await supabase
          .from('moments')
          .select('id, image_url, journal_entry, created_at')
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMoments(data || []);
      } catch (err: unknown) {
        const error = err as { message?: string, details?: string, hint?: string };
        console.error('Error fetching moments:', {
          message: error?.message || 'Unknown error',
          details: error?.details || 'None',
          hint: error?.hint || 'None',
          fullError: err
        });
        if (isPlaceholder) {
          console.warn('CRITICAL: Using placeholder Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchMoments();
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 className="animate-spin" size={40} />
        <p>Curating the wall...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>The Graduation Wall</h1>
        <p className={styles.subtitle}>Curated moments from the Class of 2026</p>
      </header>

      {moments.length === 0 ? (
        <div className={styles.empty}>
          <p>No moments have been shared on the wall yet.</p>
        </div>
      ) : (
        <div className={styles.masonry}>
          {moments.map((moment) => (
            <div 
              key={moment.id} 
              className={styles.momentCard}
              onClick={() => setSelectedMoment(moment)}
            >
              <div className={styles.imageContainer}>
                <Image 
                  src={moment.image_url} 
                  alt="Graduation Moment" 
                  className={styles.momentImage}
                  width={500}
                  height={500}
                  style={{ height: 'auto', width: '100%' }}
                  loading="lazy"
                  unoptimized // External Supabase URLs might need this or proper config
                />
              </div>
              <div className={styles.momentContent}>
                <p className={styles.journalEntry}>{moment.journal_entry}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMoment && (
        <div className={styles.modalOverlay} onClick={() => setSelectedMoment(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setSelectedMoment(null)}>
              <X size={24} />
            </button>
            <div className={styles.modalImageContainer}>
              <Image 
                src={selectedMoment.image_url} 
                alt="Graduation Moment" 
                className={styles.modalImage}
                width={1200}
                height={1200}
                style={{ objectFit: 'contain' }}
                unoptimized
              />
            </div>
            <div className={styles.modalInfo}>
              <h2 className={styles.modalTitle}>A Moment Shared</h2>
              <p className={styles.modalJournal}>{selectedMoment.journal_entry}</p>
              <p className={styles.modalDate}>
                {new Date(selectedMoment.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
