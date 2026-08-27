import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, FlipHorizontal, Loader2, ChevronLeft, Sun, Hand, Stethoscope, AlertTriangle, Search, ClipboardCheck, PhoneCall, CheckCircle2 } from 'lucide-react';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './HandScanner.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

type ScanState = 'guide' | 'camera' | 'analyzing' | 'done';

export default function HandScanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<ScanState>('guide');
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [requestingReview, setRequestingReview] = useState(false);
  const [reviewRequested, setReviewRequested] = useState(false);
  const [reviewRequestError, setReviewRequestError] = useState('');

  const patientId = localStorage.getItem('hyg3_patient_id');

  useEffect(() => {
    if (!patientId) {
      navigate('/client/onboard');
    }
  }, [patientId, navigate]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState('camera');
    } catch (err) {
      setError(t('handScanner.cameraDenied'));
      console.error(err);
    }
  }, [facing, t]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const flipCamera = async () => {
    const newFacing = facing === 'environment' ? 'user' : 'environment';
    setFacing(newFacing);
    if (streamRef.current) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  };

  // Capture + analyze
  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Countdown
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    stopCamera();
    setState('analyzing');

    try {
      // Convert to base64 JPEG
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];

      const res = await fetch(`${API_URL}/analysis/hand-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, imageBase64, mimeType: 'image/jpeg' }),
      });

      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        setState('done');
      } else {
        setError(json.error || t('handScanner.analysisFailed'));
        setState('camera');
        startCamera();
      }
    } catch (err) {
      setError(t('handScanner.analysisFailedRetry'));
      setState('guide');
    }
  };

  const handleRequestReview = async () => {
    if (!result?.scanId || !patientId) return;
    setRequestingReview(true);
    setReviewRequestError('');
    try {
      const res = await fetch(`${API_URL}/telemedicine/request-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, source: 'hand_scan', scanId: result.scanId }),
      });
      const json = await res.json();
      if (json.success) setReviewRequested(true);
      else setReviewRequestError(json.error || t('handScanner.requestReviewFailed'));
    } catch (err) {
      console.error(err);
      setReviewRequestError(t('handScanner.requestReviewFailed'));
    } finally {
      setRequestingReview(false);
    }
  };

  // ── Guide screen ──
  if (state === 'guide') {
    return (
      <div className="scanner-page animate-fade-in">
        <div className="scanner-top-bar">
          <button className="scanner-back" onClick={() => navigate('/client/dashboard')}>
            <ChevronLeft size={18} /> {t('handScanner.back')}
          </button>
          <LanguageSwitcher />
        </div>

        <div className="scanner-guide glass-panel">
          <Hand size={48} className="text-teal mb-4" />
          <h1 className="text-2xl font-bold text-text mb-2">{t('handScanner.guideTitle')}</h1>
          <p className="text-muted text-sm mb-8 text-center" style={{ maxWidth: 380 }}>
            {t('handScanner.guideSubtitle')}
          </p>

          <div className="guide-tips">
            <div className="guide-tip">
              <Sun size={20} className="text-gold" />
              <div>
                <strong>{t('handScanner.tipLightTitle')}</strong>
                <p>{t('handScanner.tipLightBody')}</p>
              </div>
            </div>
            <div className="guide-tip">
              <Hand size={20} className="text-teal" />
              <div>
                <strong>{t('handScanner.tipPalmTitle')}</strong>
                <p>{t('handScanner.tipPalmBody')}</p>
              </div>
            </div>
            <div className="guide-tip">
              <Camera size={20} className="text-teal" />
              <div>
                <strong>{t('handScanner.tipFrameTitle')}</strong>
                <p>{t('handScanner.tipFrameBody')}</p>
              </div>
            </div>
          </div>

          {error && <p className="scanner-error">{error}</p>}

          <button className="btn btn-primary btn-lg mt-6" onClick={startCamera}>
            <Camera size={20} /> {t('handScanner.openCamera')}
          </button>
        </div>
      </div>
    );
  }

  // ── Analyzing screen ──
  if (state === 'analyzing') {
    return (
      <div className="scanner-page scanner-analyzing animate-fade-in">
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="analyzing-content glass-panel">
          <div className="analyzing-pulse" />
          <Loader2 size={40} className="text-teal animate-spin mb-4" />
          <h2 className="text-xl font-bold text-text">{t('handScanner.analyzingTitle')}</h2>
          <p className="text-muted text-sm mt-2">{t('handScanner.analyzingSubtitle')}</p>
          <div className="analyzing-steps">
            {[
              t('handScanner.analyzingStep1'),
              t('handScanner.analyzingStep2'),
              t('handScanner.analyzingStep3'),
              t('handScanner.analyzingStep4'),
            ].map((s, i) => (
              <div key={i} className="analyzing-step">
                <div className="analyzing-step-dot" style={{ animationDelay: `${i * 0.4}s` }} />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Results screen ──
  if (state === 'done' && result) {
    return (
      <div className="scanner-page scanner-results animate-fade-in">
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="results-header">
          <button className="scanner-back" onClick={() => navigate('/client/dashboard')}>
            <ChevronLeft size={18} /> {t('handScanner.viewFullReport')}
          </button>
          <button className="btn btn-secondary" onClick={() => { setState('guide'); setResult(null); }}>
            {t('handScanner.scanAgain')}
          </button>
        </div>

        {result.analysisMode === 'simulated' && (
          <div className="scanner-demo-banner flex items-center gap-2">
            <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {t('handScanner.demoModeBanner')}
          </div>
        )}

        {/* Score */}
        {result.overallScore && (
          <div className="score-card glass-panel">
            <div className="score-ring">
              <svg viewBox="0 0 80 80" className="score-svg">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke={result.overallScore >= 80 ? 'var(--teal)' : result.overallScore >= 60 ? 'var(--gold)' : '#f87171'}
                  strokeWidth="6"
                  strokeDasharray={`${(result.overallScore / 100) * 213.6} 213.6`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <span className="score-number">{result.overallScore}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-text">{t('handScanner.wellnessScore')}</h3>
              <p className="text-muted text-sm">{t('handScanner.wellnessScoreSub')}</p>
            </div>
          </div>
        )}

        {/* Detected Signals */}
        {result.signals?.length > 0 && (
          <section className="results-section glass-panel">
            <h2 className="results-section-title flex items-center gap-2"><Search size={18} className="text-teal" /> {t('handScanner.whatWeDetected')}</h2>
            <div className="signals-list">
              {result.signals.map((s: any, i: number) => (
                <div key={i} className="signal-item">
                  <span className="signal-area">{s.area}</span>
                  <span className="signal-obs">{s.observation}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pending pharmacist review — deficiencies, food/vitamin suggestions, and
            the meal plan no longer come back directly in this response. They're
            reviewed by a pharmacist first (same pipeline as AI Insights review)
            and only appear on the dashboard once approved. */}
        <section className="results-section glass-panel">
          <h2 className="results-section-title flex items-center gap-2">
            <ClipboardCheck size={18} className="text-gold" /> {t('handScanner.pendingReviewTitle')}
          </h2>
          <p className="text-muted text-sm">{t('handScanner.pendingReviewBody')}</p>

          {reviewRequestError && <p className="scanner-error">{reviewRequestError}</p>}

          {reviewRequested ? (
            <span className="pending-review-requested flex items-center gap-2">
              <CheckCircle2 size={16} /> {t('handScanner.requestReviewSent')}
            </span>
          ) : (
            <button
              className="btn btn-secondary mt-4 flex items-center gap-2"
              onClick={handleRequestReview}
              disabled={requestingReview}
            >
              <PhoneCall size={16} /> {requestingReview ? t('handScanner.requestingReview') : t('handScanner.requestReviewCta')}
            </button>
          )}
        </section>

        {/* Disclaimer */}
        <div className="disclaimer-banner flex items-center gap-2">
          <Stethoscope size={16} style={{ flexShrink: 0 }} /> {result.disclaimer}
        </div>
      </div>
    );
  }

  // ── Camera screen ──
  return (
    <div className="scanner-page scanner-camera">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="camera-container">
        <video ref={videoRef} className="camera-feed" playsInline muted />

        {/* Hand guide overlay */}
        <div className="camera-overlay">
          <div className="hand-guide-outline" />
          <p className="camera-hint">{t('handScanner.cameraHint')}</p>
        </div>

        {countdown !== null && (
          <div className="countdown-overlay">{countdown}</div>
        )}

        {/* Controls */}
        <div className="camera-controls">
          <button className="camera-ctrl-btn" onClick={() => { stopCamera(); setState('guide'); }}>
            <ChevronLeft size={22} />
          </button>
          <button className="camera-capture-btn" onClick={captureAndAnalyze}>
            <Camera size={28} />
          </button>
          <button className="camera-ctrl-btn" onClick={flipCamera}>
            <FlipHorizontal size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
