'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, Upload, AlertCircle, Loader2, RefreshCw, Trash2 } from 'lucide-react';
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
  
  // Camera-specific states
  const [cameraState, setCameraState] = useState<'idle' | 'streaming' | 'captured' | 'fallback'>('idle');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFlashing, setIsFlashing] = useState(false);
  const [retakeCount, setRetakeCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Callback ref to bind stream instantly when the video element mounts or remounts
  const setVideoRef = React.useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      console.log('Callback ref binding stream successfully to video node');
      node.muted = true;
      // Only set if different to avoid stream interruption
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      // Play is handled by onLoadedMetadata, but we can try here as well
      node.play().catch(e => console.warn('Callback video play failed:', e));
    }
  }, []);

  // Initialize camera stream reactively based on facingMode & retakeCount
  useEffect(() => {
    let active = true;
    
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
          },
          audio: false,
        });
        
        if (!active) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = mediaStream;
        
        // Log video tracks for systematic debugging
        const videoTracks = mediaStream.getVideoTracks();
        console.log('Camera initialized successfully. Active video tracks:', videoTracks.map(t => ({
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState
        })));

        if (videoRef.current) {
          console.log('Ref binding stream successfully to video element');
          videoRef.current.muted = true;
          if (videoRef.current.srcObject !== mediaStream) {
            videoRef.current.srcObject = mediaStream;
          }
          videoRef.current.play().catch(e => console.warn('Video play failed:', e));
        }
        setCameraState('streaming');
        setError(null);
      } catch (err) {
        console.warn('Webcam stream failed. Falling back to standard file upload:', err);
        if (active) {
          setCameraState('fallback');
          if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
              setError('Camera permission denied. Please allow camera access in your browser settings.');
            } else if (err.name === 'NotReadableError') {
              setError('Camera is already in use by another application.');
            } else if (err.name === 'NotFoundError') {
              setError('No camera device found on this system.');
            } else {
              setError(`Camera access error: ${err.message}`);
            }
          } else {
            setError('Could not access camera feed.');
          }
        }
      }
    };

    if (cameraState === 'idle') {
      initCamera();
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode, retakeCount, cameraState]);

  // Flip camera
  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCameraState('idle');
  };

  // Snaps photo from the <video> stream to a <canvas>
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && streamRef.current) {
      // Trigger camera flash visual feedback
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Calculate center square crop
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const size = Math.min(videoWidth, videoHeight);
        
        canvas.width = size;
        canvas.height = size;
        
        const sx = (videoWidth - size) / 2;
        const sy = (videoHeight - size) / 2;

        // Draw and mirror if using front camera
        ctx.save();
        if (facingMode === 'user') {
          ctx.translate(size, 0);
          ctx.scale(-1, 1);
        }
        
        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
        ctx.restore();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setPreview(dataUrl);
        setCameraState('captured');

        // Turn canvas into an uploadable file
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFile(capturedFile);
          }
        }, 'image/jpeg', 0.95);

        // Turn off camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }
    }
  };

  // Reset to webcam streaming
  const retakePhoto = () => {
    setFile(null);
    setPreview(null);
    setCameraState('idle');
    setRetakeCount(prev => prev + 1);
  };

  // Fallback file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      setCameraState('captured');
      setError(null);
    }
  };

  // Upload to Supabase storage & moments table
  const handleUpload = async () => {
    if (!file) {
      setError('Please capture or select a photo first.');
      return;
    }
    if (!journal.trim()) {
      setError('Please write a caption or journal note on your film.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      const user = session?.user;
      if (!user) {
        throw new Error('Authentication required. Please sign in to upload moments.');
      }

      // 2. Upload to storage (moments bucket)
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('moments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 3. Retrieve public URL
      const { data: { publicUrl } } = supabase.storage
        .from('moments')
        .getPublicUrl(fileName);

      // 4. Save to moments database table
      const { error: insertError } = await supabase.from('moments').insert({
        user_id: user.id,
        image_url: publicUrl,
        journal_entry: journal,
        is_capsule: true,
      });

      if (insertError) {
        // Cleanup file if DB insert fails
        await supabase.storage.from('moments').remove([fileName]);
        throw insertError;
      }

      setSuccess(true);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      console.error('Upload error:', err);
      setError(errorObj?.message || 'An unexpected error occurred during sealing.');
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
    setCameraState('idle');
    setRetakeCount(prev => prev + 1);
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
        <p className={styles.subtitle}>Snap a live moment to seal into your capsule</p>
      </header>

      {/* Neo-Brutalist Instax Film Frame Wrapper */}
      <div className={styles.instaxFrame}>
        {/* Virtual Sticker Emojis */}
        <div className={`${styles.sticker} ${styles.stickerGrad}`} aria-hidden="true">🎓</div>
        <div className={`${styles.sticker} ${styles.stickerSparkle}`} aria-hidden="true">✨</div>
        <div className={`${styles.sticker} ${styles.stickerStar}`} aria-hidden="true">🌟</div>
        <div className={`${styles.sticker} ${styles.stickerHeart}`} aria-hidden="true">💖</div>

        <div className={styles.instaxPhotoArea}>
          {cameraState === 'idle' && (
            <div className={styles.cameraPlaceholder}>
              <Loader2 className={`${styles.loaderIcon} animate-spin`} />
              <span>Starting camera feed...</span>
            </div>
          )}

          {/* Render video tag unconditionally to guarantee React preserves the DOM element across state transitions */}
          <video 
            ref={setVideoRef} 
            autoPlay 
            playsInline 
            muted 
            onLoadedMetadata={(e) => {
              const video = e.target as HTMLVideoElement;
              video.play().catch(err => console.error("onLoadedMetadata play failed:", err));
            }}
            className={styles.cameraVideo} 
            style={{ 
              opacity: cameraState === 'streaming' ? 1 : 0,
              pointerEvents: cameraState === 'streaming' ? 'auto' : 'none'
            }}
          />

          {cameraState === 'streaming' && (
            <button 
              type="button" 
              onClick={toggleFacingMode} 
              className={styles.flipButton}
              title="Flip Camera"
            >
              <RefreshCw size={18} />
            </button>
          )}

          {cameraState === 'captured' && preview && (
            <Image 
              src={preview} 
              alt="Captured memory preview" 
              fill 
              className={styles.capturedPreviewImage}
              unoptimized
            />
          )}

          {cameraState === 'fallback' && (
            <div 
              className={styles.uploadFallbackArea}
              onClick={() => {
                if (!preview) {
                  fileInputRef.current?.click();
                }
              }}
            >
              {preview ? (
                <Image 
                  src={preview} 
                  alt="Uploaded preview" 
                  fill 
                  className={styles.capturedPreviewImage}
                  unoptimized
                />
              ) : (
                <div className={styles.lockedArea}>
                  <Camera className={styles.uploadIcon} />
                  <span className={styles.lockedTitle}>Camera Access Locked</span>
                  <span className={styles.lockedText}>
                    {"Please enable camera permissions in your browser's address bar settings."}
                  </span>
                  <button
                    type="button"
                    className={styles.retryButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setError(null);
                      setCameraState('idle');
                      setRetakeCount(prev => prev + 1);
                    }}
                  >
                    Retry Camera
                  </button>
                  <span className={styles.fallbackUploadLink}>
                    or click here to choose a photo file
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Flash screen overlay animation */}
          {isFlashing && <div className={styles.flashOverlay} />}
        </div>

        {/* Instax cardboard paper footer for handwriting journal entries */}
        <div className={styles.instaxFooter}>
          <textarea
            className={styles.handwrittenInput}
            placeholder="Write your story on the print... ✏️"
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            disabled={loading}
            maxLength={120}
          />
          <div className={styles.instaxDate}>
            {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Hidden file input for fallback */}
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      {/* Hidden canvas for taking snapshot */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {error && (
        <div className={styles.error}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Controls Container */}
      <div className={styles.actionsContainer}>
        {cameraState === 'streaming' && (
          <div className={styles.shutterRow}>
            <button 
              type="button" 
              onClick={capturePhoto} 
              className={styles.shutterButton}
              aria-label="Capture Photo"
            >
              <span className={styles.shutterInner} />
            </button>
          </div>
        )}

        {cameraState === 'captured' && (
          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              onClick={retakePhoto} 
              className={styles.retakeButton}
              disabled={loading}
            >
              <Trash2 size={16} />
              <span>Retake</span>
            </button>

            <button 
              type="button" 
              onClick={handleUpload} 
              className={styles.submitButton}
              disabled={loading || !journal.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Sealing...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Seal Capsule</span>
                </>
              )}
            </button>
          </div>
        )}

        {cameraState === 'fallback' && (
          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className={styles.retakeButton}
              disabled={loading}
            >
              <Camera size={16} />
              <span>Choose Photo</span>
            </button>

            {preview && (
              <button 
                type="button" 
                onClick={handleUpload} 
                className={styles.submitButton}
                disabled={loading || !journal.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Sealing...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Seal Capsule</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
