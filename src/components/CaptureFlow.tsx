'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, Upload, AlertCircle, Loader2, RefreshCw, Trash2, Zap, ZapOff, ZoomIn, ZoomOut } from 'lucide-react';
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

  // Advanced camera controls states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [capabilities, setCapabilities] = useState<any>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [focusPoint, setFocusPoint] = useState<{ x: number, y: number } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastVolumeRef = useRef<number>(0.5);
  const [isVolumeShutterReady, setIsVolumeShutterReady] = useState(false);

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
        const track = mediaStream.getVideoTracks()[0];
        if (track) {
          console.log('Camera active track:', track.label);
          
          // Detect advanced capabilities
          if (typeof track.getCapabilities === 'function') {
            const caps = track.getCapabilities();
            console.log('Camera capabilities:', caps);
            setCapabilities(caps);
            
            // Sync initial zoom if available
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((caps as any).zoom) {
               const settings = track.getSettings();
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               setZoomLevel((settings as any).zoom || (caps as any).zoom.min || 1);
            }
            
            // Sync initial torch if available
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((caps as any).torch) {
               const settings = track.getSettings();
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               setTorchOn(!!(settings as any).torch);
            }
          }
        }

        // Stream is ready, state update will trigger the useLayoutEffect to bind it
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

    // We initialize the camera whenever facingMode or retakeCount changes
    initCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode, retakeCount]); // Removed cameraState to prevent immediate cleanup

  // Bind the stream to the video element whenever the state changes to streaming
  useEffect(() => {
    if (cameraState === 'streaming' && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.muted = true;
      
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      
      // Some browsers need explicit play even with autoPlay
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Video play error during binding:", error);
          // Retry playing after a short delay for Safari
          setTimeout(() => {
            if (videoRef.current && cameraState === 'streaming') {
              videoRef.current.play().catch(e => console.error("Retry play failed:", e));
            }
          }, 500);
        });
      }
    }
  }, [cameraState]);

  // Flip camera
  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCameraState('idle');
  };

  // Flash preference toggle (will fire on capture)
  const toggleFlashPreference = () => {
    setTorchOn(!torchOn);
  };

  // Zoom control
  const handleZoom = async (targetZoom: number) => {
    if (!streamRef.current || !capabilities?.zoom) return;
    const track = streamRef.current.getVideoTracks()[0];
    const min = capabilities.zoom.min || 1;
    const max = capabilities.zoom.max || 3;
    
    const newZoom = Math.max(min, Math.min(targetZoom, max));

    try {
      await track.applyConstraints({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        advanced: [{ zoom: newZoom } as any]
      });
      setZoomLevel(newZoom);
    } catch (e) {
      console.warn('Failed to apply zoom', e);
    }
  };

  // Tap to focus
  const handleTapToFocus = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (cameraState !== 'streaming') return;
    
    // Always show visual focus ring for UX
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setFocusPoint({ x, y });
    setTimeout(() => setFocusPoint(null), 1500); // Hide ring after 1.5s

    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    
    // Check if device supports programmatic focus
    if (track && capabilities?.focusMode) {
      try {
        // Calculate relative coordinates 0.0 to 1.0 for constraints
        const relX = x / rect.width;
        const relY = y / rect.height;

        await track.applyConstraints({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          advanced: [{
            focusMode: 'single-shot',
            pointsOfInterest: [{ x: relX, y: relY }]
          } as any]
        });
      } catch (err) {
        console.warn('Failed to set focus point', err);
      }
    }
  };

  // Snaps photo from the <video> stream to a <canvas>
  const capturePhoto = useCallback(async () => {
    if (videoRef.current && canvasRef.current && streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      
      // Hardware Flash Execution
      let didFlash = false;
      if (torchOn && track && capabilities?.torch) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await track.applyConstraints({ advanced: [{ torch: true } as any] });
          didFlash = true;
          // Wait briefly for the camera sensor's exposure to adjust to the new light
          await new Promise(resolve => setTimeout(resolve, 350));
        } catch (e) {
          console.warn('Hardware flash failed during capture', e);
        }
      }

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

        // Turn off hardware flash immediately after drawing frame
        if (didFlash && track) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await track.applyConstraints({ advanced: [{ torch: false } as any] });
          } catch (e) {
            console.warn('Failed to turn off hardware flash', e);
          }
        }

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
  }, [facingMode, torchOn, capabilities]);

  // Keep latest capturePhoto without stale closures for the volume event
  const capturePhotoRef = useRef(capturePhoto);
  useEffect(() => { capturePhotoRef.current = capturePhoto; }, [capturePhoto]);

  const activateVolumeShutter = useCallback(() => {
    if (isVolumeShutterReady) return;

    const audio = new Audio();
    // Silent 1s WAV — no network request
    audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    audio.loop = true;
    audio.volume = 0.5;

    let isResettingVolume = true; // The initial assignment to 0.5 will fire an event

    audio.addEventListener('volumechange', () => {
      // Ignore events caused by our own programmatic volume resets
      if (isResettingVolume) {
        isResettingVolume = false;
        return;
      }

      // User pressed a physical volume button!
      // Reset volume immediately so buttons keep firing in both directions without hitting 0% or 100%
      isResettingVolume = true;
      audio.volume = 0.5;
      
      capturePhotoRef.current();
    });

    audio.play().then(() => {
      setIsVolumeShutterReady(true);
      // Failsafe: if the initial volumechange never fired, unlock it
      setTimeout(() => { isResettingVolume = false; }, 100);
    }).catch(() => {
      // Gesture wasn't sufficient — reset so next tap retries
      setIsVolumeShutterReady(false);
    });

    audioRef.current = audio;
  }, [isVolumeShutterReady]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const handleViewfinderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    activateVolumeShutter(); // must be first — needs to be inside the gesture
    handleTapToFocus(e);
  };

  // Volume Shutter Support (Desktop/Android)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block native volume changes if we are streaming to use it as shutter
      if (['AudioVolumeUp', 'AudioVolumeDown', 'VolumeUp', 'VolumeDown', ' '].includes(e.key) || e.keyCode === 32) {
        if (cameraState === 'streaming') {
          e.preventDefault();
          capturePhoto();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cameraState, capturePhoto]);

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

        <div className={styles.instaxPhotoArea} onClick={handleViewfinderClick}>
          {cameraState === 'idle' && (
            <div className={styles.cameraPlaceholder}>
              <Loader2 className={`${styles.loaderIcon} animate-spin`} />
              <span>Starting camera feed...</span>
            </div>
          )}

          {/* Render video tag unconditionally to guarantee React preserves the DOM element across state transitions */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline
            webkit-playsinline="true"
            muted 
            onLoadedMetadata={(e) => {
              const video = e.target as HTMLVideoElement;
              video.play().catch(err => console.error("onLoadedMetadata play failed:", err));
            }}
            className={styles.cameraVideo} 
            style={{ 
              opacity: cameraState === 'streaming' ? 1 : 0,
              pointerEvents: cameraState === 'streaming' ? 'auto' : 'none',
              visibility: cameraState === 'streaming' ? 'visible' : 'hidden'
            }}
          />

          {cameraState === 'streaming' && (
            <>
              {/* Focus Ring Indicator */}
              {focusPoint && (
                <div 
                  className={styles.focusRing} 
                  style={{ left: focusPoint.x, top: focusPoint.y }}
                />
              )}
              
              {/* Camera Action Overlays (Flash & Zoom) */}
              <div className={styles.cameraControlsOverlay}>
                {capabilities?.torch && (
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); toggleFlashPreference(); }} 
                    className={`${styles.controlButton} ${torchOn ? styles.controlButtonActive : ''}`}
                    title="Toggle Flash"
                  >
                    {torchOn ? <Zap size={16} /> : <ZapOff size={16} />}
                  </button>
                )}
              </div>

              {/* Volume shutter hint */}
              <div className={styles.volumeHint}>
                {isVolumeShutterReady
                  ? '🔊 Volume keys ready'
                  : 'Tap viewfinder to enable volume shutter'}
              </div>

              {/* Native-style iPhone zoom pill at the bottom center */}
              {capabilities?.zoom && (
                <div className={styles.zoomRow}>
                  {capabilities.zoom.min <= 0.5 && (
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); handleZoom(0.5); }} 
                      className={`${styles.zoomTextButton} ${zoomLevel < 1 ? styles.zoomTextButtonActive : ''}`}
                    >
                      .5
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); handleZoom(1); }} 
                    className={`${styles.zoomTextButton} ${zoomLevel >= 1 && zoomLevel < (capabilities.zoom.max >= 2 ? 2 : capabilities.zoom.max + 0.1) ? styles.zoomTextButtonActive : ''}`}
                  >
                    1x
                  </button>
                  {capabilities.zoom.max >= 2 && (
                    <button 
                      type="button" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const maxZoom = capabilities.zoom.max >= 3 ? 3 : Math.floor(capabilities.zoom.max);
                        handleZoom(maxZoom); 
                      }} 
                      className={`${styles.zoomTextButton} ${zoomLevel >= 2 ? styles.zoomTextButtonActive : ''}`}
                    >
                      {capabilities.zoom.max >= 3 ? '3' : Math.floor(capabilities.zoom.max)}
                    </button>
                  )}
                </div>
              )}

              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); toggleFacingMode(); }} 
                className={styles.flipButton}
                title="Flip Camera"
              >
                <RefreshCw size={18} />
              </button>
            </>
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
