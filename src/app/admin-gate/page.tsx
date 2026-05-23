'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Lock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import styles from './AdminGate.module.css';

interface Moment {
  id: string;
  image_url: string;
  journal_entry: string;
  created_at: string;
  is_approved: boolean;
}

export default function AdminGate() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'graduation2026';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPassword) {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Invalid admin password.');
    }
  };

  const fetchMoments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('moments')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMoments(data || []);
    } catch (err: any) {
      console.error('Fetch error:', {
        message: err?.message || 'Unknown error',
        details: err?.details || 'None',
        hint: err?.hint || 'None',
        fullError: err
      });
      setError('Failed to fetch pending moments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        await fetchMoments();
      }
    };
    loadData();
  }, [isAuthenticated]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const { error: updateError } = await supabase
        .from('moments')
        .update({ is_approved: true })
        .eq('id', id);

      if (updateError) throw updateError;
      setMoments(moments.filter(m => m.id !== id));
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to approve moment.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to reject and delete this moment?')) return;
    
    setActionLoading(id);
    try {
      // 1. Delete from DB
      const { error: deleteError } = await supabase
        .from('moments')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // 2. Try to delete from storage (optional, best effort)
      try {
        const urlParts = imageUrl.split('/');
        const fileName = urlParts.slice(-2).join('/'); // user_id/filename.ext
        await supabase.storage.from('moments').remove([fileName]);
      } catch (storageErr) {
        console.warn('Failed to delete image from storage:', storageErr);
      }

      setMoments(moments.filter(m => m.id !== id));
    } catch (err) {
      console.error('Reject error:', err);
      alert('Failed to reject moment.');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className={styles.container}>
        <div className={styles.loginContainer}>
          <Lock className={styles.lockIcon} size={48} style={{ margin: '0 auto', color: '#a855f7' }} />
          <h1 className={styles.title}>Admin Access</h1>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="password"
              className={styles.input}
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button}>
              Unlock Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.title}>Moderation</h1>
          <p className={styles.subtitle}>Review pending moments for the Graduation Wall</p>
        </div>
        <button 
          className={styles.refreshBtn} 
          onClick={fetchMoments} 
          disabled={loading}
          style={{ 
            background: 'transparent', 
            border: '1px solid #27272a', 
            borderRadius: '0.5rem',
            padding: '0.5rem',
            color: '#a1a1aa',
            cursor: 'pointer'
          }}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
        </button>
      </header>

      {error && (
        <div className={styles.error} style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '1rem', borderRadius: '1rem', display: 'flex', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading && moments.length === 0 ? (
        <div className={styles.empty}>
          <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto', color: '#a855f7' }} />
          <p style={{ marginTop: '1rem' }}>Loading pending moments...</p>
        </div>
      ) : moments.length === 0 ? (
        <div className={styles.empty}>
          <p>No moments pending moderation.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {moments.map((moment) => (
            <div key={moment.id} className={styles.card}>
              <div className={styles.imageContainer}>
                <Image
                  src={moment.image_url}
                  alt="Moment"
                  fill
                  className={styles.cardImage}
                  unoptimized
                />
              </div>
              <div className={styles.cardContent}>
                <p className={styles.journalEntry}>{moment.journal_entry}</p>
                <p className={styles.timestamp}>
                  {new Date(moment.created_at).toLocaleString()}
                </p>
              </div>
              <div className={styles.actions}>
                <button
                  className={styles.approveBtn}
                  onClick={() => handleApprove(moment.id)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === moment.id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Check size={18} />
                      <span>Approve</span>
                    </>
                  )}
                </button>
                <button
                  className={styles.rejectBtn}
                  onClick={() => handleReject(moment.id, moment.image_url)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === moment.id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <X size={18} />
                      <span>Reject</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
