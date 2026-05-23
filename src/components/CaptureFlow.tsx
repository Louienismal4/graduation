'use client';

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, Upload, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import styles from './CaptureFlow.module.css';
import StoryCard from './StoryCard';

export default function CaptureFlow() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please capture or select a photo first.');
      return;
    }
    if (!journal.trim()) {
      setError('Please add a journal entry for your time capsule.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // For this task, if no session, we'll try to get user directly or use a mock if environment is not set up
      // But we should follow the real logic
      if (sessionError) throw sessionError;
      
      const user = session?.user;
      
      if (!user) {
        // Fallback for development/testing if auth isn't fully set up
        // In a real app, this would be protected by middleware
        throw new Error('Authentication required. Please sign in to upload moments.');
      }

      // 2. Upload to Storage (bucket: moments)
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('moments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('moments')
        .getPublicUrl(fileName);

      // 4. Insert into moments table
      const { error: insertError } = await supabase.from('moments').insert({
        user_id: user.id,
        image_url: publicUrl,
        journal_entry: journal,
        is_capsule: true,
      });

      if (insertError) {
        // Cleanup: try to delete the uploaded image if insert fails
        await supabase.storage.from('moments').remove([fileName]);
        throw insertError;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setJournal('');
    setSuccess(false);
    setError(null);
  };

  if (success && preview) {
    return (
      <StoryCard 
        imageUrl={preview} 
        journalEntry={journal} 
        onReset={reset} 
      />
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Time Machine</h1>
        <p className={styles.subtitle}>Capture a memory for your future self</p>
      </header>

      <div 
        className={`${styles.dropzone} ${preview ? styles.dropzoneWithImage : ''}`}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <Image 
            src={preview} 
            alt="Preview" 
            fill 
            className={styles.previewImage}
            unoptimized // Using unoptimized for local blob URLs
          />
        ) : (
          <>
            <Camera className={styles.uploadIcon} />
            <span className={styles.uploadText}>Tap to take a photo</span>
          </>
        )}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Journal Entry</label>
        <textarea 
          className={styles.textarea}
          placeholder="What's on your mind? How does this moment feel?"
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
        />
      </div>

      {error && (
        <div className={styles.error}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <button 
        className={styles.button}
        onClick={handleUpload}
        disabled={loading || !file || !journal.trim()}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <Upload size={20} />
            <span>Seal in Time Capsule</span>
          </>
        )}
      </button>
    </div>
  );
}
