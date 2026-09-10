import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  FlipHorizontal,
  ChevronLeft,
  Sun,
  Sparkles,
  Stethoscope,
  AlertTriangle,
  Search,
  ClipboardCheck,
  PhoneCall,
  CheckCircle2,
  Droplets,
  Eye,
  ShieldCheck,
  Upload,
  Clock,
  HeartHandshake
} from 'lucide-react';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './FaceScanner.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

type ScanState = 'guide' | 'camera' | 'analyzing' | 'done';

export default function FaceScanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<ScanState>('guide');
  const [facing, setFacing] = useState<'user' | 'environment'>('user'); // Default to selfie for face
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
    setError('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((trk) => trk.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState('camera');
    } catch (err) {
      setError(t('faceScanner.cameraDenied', 'Camera access denied or unavailable. You can also upload a photo below.'));
      console.error(err);
    }
  }, [facing, t]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((trk) => trk.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const flipCamera = async () => {
    const newFacing = facing === 'user' ? 'environment' : 'user';
    setFacing(newFacing);
    if (streamRef.current) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      stopCamera();
      setState('analyzing');
      const base64 = dataUrl.split(',')[1];
      const mime = file.type || 'image/jpeg';
      await sendImageForAnalysis(base64, mime);
    };
    reader.readAsDataURL(file);
  };

  // Capture from live video stream + analyze
  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Countdown 3, 2, 1
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d')!;

    // If front camera, mirror image for natural selfie orientation
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    if (facing === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    stopCamera();
    setState('analyzing');

    try {
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.88).split(',')[1];
      await sendImageForAnalysis(imageBase64, 'image/jpeg');
    } catch (err) {
      console.error(err);
      setError(t('faceScanner.analysisFailedRetry', 'Analysis failed. Please try again.'));
      setState('guide');
    }
  };

  const sendImageForAnalysis = async (imageBase64: string, mimeType: string) => {
    try {
      const res = await fetch(`${API_URL}/analysis/face-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, imageBase64, mimeType }),
      });

      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        setState('done');
      } else {
        setError(json.error || t('faceScanner.analysisFailed', 'Face analysis failed.'));
        setState('guide');
      }
    } catch (err) {
      console.error(err);
      setError(t('faceScanner.analysisFailedRetry', 'Analysis failed. Please try again.'));
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
        body: JSON.stringify({ patientId, source: 'face_scan', scanId: result.scanId }),
      });
      const json = await res.json();
      if (json.success) setReviewRequested(true);
      else setReviewRequestError(json.error || t('faceScanner.requestReviewFailed', "Couldn't send request."));
    } catch (err) {
      console.error(err);
      setReviewRequestError(t('faceScanner.requestReviewFailed', "Couldn't send request."));
    } finally {
      setRequestingReview(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--teal)';
    if (score >= 65) return 'var(--gold)';
    return '#f87171';
  };

  const getScoreStatusText = (score: number) => {
    if (score >= 80) return t('faceScanner.statusRadiant', 'Radiant & Balanced');
    if (score >= 65) return t('faceScanner.statusHealthy', 'Healthy Glow · Hydration Potential');
    return t('faceScanner.statusNourish', 'Nourishment & Barrier Care Advised');
  };

  // ── Guide screen ──
  if (state === 'guide') {
    return (
      <div className="face-scanner-page animate-fade-in">
        <div className="scanner-top-bar">
          <button className="scanner-back" onClick={() => navigate('/client/dashboard')}>
            <ChevronLeft size={18} /> {t('faceScanner.back', 'Back to Dashboard')}
          </button>
          <LanguageSwitcher />
        </div>

        <div className="scanner-guide glass-panel">
          <div className="guide-icon-badge">
            <Sparkles size={36} className="text-gold animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">
            {t('faceScanner.guideTitle', 'Facial Skin & Beauty Wellness Scan')}
          </h1>
          <p className="text-muted text-sm mb-8 text-center" style={{ maxWidth: 420 }}>
            {t(
              'faceScanner.guideSubtitle',
              'Our AI assesses skin hydration, radiance, texture clarity, and eye contour vitality to create your personalized beauty wellness regimen.'
            )}
          </p>

          <div className="guide-tips">
            <div className="guide-tip">
              <Sun size={20} className="text-gold" />
              <div>
                <strong>{t('faceScanner.tipLightTitle', 'Soft Natural Light')}</strong>
                <p>{t('faceScanner.tipLightBody', 'Face a window or soft daytime lighting. Avoid harsh shadows or strong backlighting.')}</p>
              </div>
            </div>
            <div className="guide-tip">
              <Sparkles size={20} className="text-teal" />
              <div>
                <strong>{t('faceScanner.tipExpressionTitle', 'Neutral Expression')}</strong>
                <p>{t('faceScanner.tipExpressionBody', 'Look directly forward with a relaxed, neutral facial expression for accurate tone and texture analysis.')}</p>
              </div>
            </div>
            <div className="guide-tip">
              <Camera size={20} className="text-teal" />
              <div>
                <strong>{t('faceScanner.tipClearTitle', 'Clear Facial Framing')}</strong>
                <p>{t('faceScanner.tipClearBody', 'Tuck hair behind ears and remove glasses or heavy makeup if convenient for the deepest analysis.')}</p>
              </div>
            </div>
          </div>

          {error && <p className="scanner-error mt-4">{error}</p>}

          <div className="guide-actions mt-8 w-full flex flex-col sm:flex-row gap-3">
            <button className="btn btn-primary btn-lg flex-1 justify-center" onClick={startCamera}>
              <Camera size={20} /> {t('faceScanner.openCamera', 'Open Camera')}
            </button>
            <button
              className="btn btn-secondary btn-lg flex-1 justify-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={20} /> {t('faceScanner.uploadPhoto', 'Upload Photo')}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Analyzing screen ──
  if (state === 'analyzing') {
    return (
      <div className="face-scanner-page scanner-analyzing animate-fade-in">
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="analyzing-content glass-panel">
          <div className="face-scan-pulse-ring" />
          <div className="face-scan-radar">
            <Sparkles size={38} className="text-gold animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-text mt-4">
            {t('faceScanner.analyzingTitle', 'Analyzing Facial Skin & Beauty Metrics')}
          </h2>
          <p className="text-muted text-sm mt-2 text-center" style={{ maxWidth: 360 }}>
            {t('faceScanner.analyzingSubtitle', 'Examining skin barrier, hydration levels, radiance, and periorbital vitality...')}
          </p>

          <div className="analyzing-steps mt-6">
            {[
              t('faceScanner.step1', 'Evaluating skin barrier & hydration levels'),
              t('faceScanner.step2', 'Measuring radiance & luminosity balance'),
              t('faceScanner.step3', 'Assessing eye contour vitality & fatigue markers'),
              t('faceScanner.step4', 'Synthesizing beauty-nutrition & skincare rituals'),
            ].map((s, i) => (
              <div key={i} className="analyzing-step">
                <div className="analyzing-step-dot" style={{ animationDelay: `${i * 0.35}s` }} />
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
    const score = result.overallScore || 75;
    const scoreColor = getScoreColor(score);

    return (
      <div className="face-scanner-page scanner-results animate-fade-in">
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="results-header">
          <button className="scanner-back" onClick={() => navigate('/client/dashboard')}>
            <ChevronLeft size={18} /> {t('faceScanner.viewDashboard', 'Return to Dashboard')}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setState('guide');
              setResult(null);
            }}
          >
            {t('faceScanner.scanAgain', 'Scan Again')}
          </button>
        </div>

        {result.analysisMode === 'simulated' && (
          <div className="scanner-demo-banner flex items-center gap-2">
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            {t('faceScanner.demoModeBanner', 'Running in demo mode — set an Anthropic API key for live vision inference')}
          </div>
        )}

        {/* Primary Overall Skin Beauty Score */}
        <div className="score-card glass-panel face-score-hero">
          <div className="score-ring">
            <svg viewBox="0 0 88 88" className="score-svg">
              <circle cx="44" cy="44" r="38" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="44"
                cy="44"
                r="38"
                fill="none"
                stroke={scoreColor}
                strokeWidth="6"
                strokeDasharray={`${(score / 100) * 238.7} 238.7`}
                strokeLinecap="round"
                transform="rotate(-90 44 44)"
              />
            </svg>
            <span className="score-number">{score}</span>
          </div>
          <div className="face-score-meta">
            <div className="face-score-badge" style={{ borderColor: scoreColor, color: scoreColor }}>
              <Sparkles size={14} /> {getScoreStatusText(score)}
            </div>
            <h3 className="text-xl font-bold text-text mt-1">
              {t('faceScanner.beautyIndex', 'Skin Beauty & Wellness Index')}
            </h3>
            <p className="text-muted text-sm mt-1">
              {t('faceScanner.skinTypeLabel', 'Detected Tendency')}:{' '}
              <strong className="text-text capitalize">{result.skinTypeDetected || 'Combination'}</strong>
            </p>
          </div>
        </div>

        {/* 4-Metric Grid */}
        <div className="beauty-metrics-grid">
          <div className="beauty-metric-card glass-panel">
            <div className="metric-card-header">
              <Droplets size={18} className="text-teal" />
              <span className="metric-card-name">{t('faceScanner.metricHydration', 'Hydration Barrier')}</span>
            </div>
            <div className="metric-card-val text-teal">{result.hydrationScore || 74}%</div>
            <div className="metric-bar-bg">
              <div className="metric-bar-fill bg-teal" style={{ width: `${result.hydrationScore || 74}%` }} />
            </div>
            <span className="metric-card-hint">{t('faceScanner.hydrationHint', 'Cellular moisture retention')}</span>
          </div>

          <div className="beauty-metric-card glass-panel">
            <div className="metric-card-header">
              <Sun size={18} className="text-gold" />
              <span className="metric-card-name">{t('faceScanner.metricRadiance', 'Radiance & Glow')}</span>
            </div>
            <div className="metric-card-val text-gold">{result.radianceScore || 82}%</div>
            <div className="metric-bar-bg">
              <div className="metric-bar-fill bg-gold" style={{ width: `${result.radianceScore || 82}%` }} />
            </div>
            <span className="metric-card-hint">{t('faceScanner.radianceHint', 'Tone clarity & light reflection')}</span>
          </div>

          <div className="beauty-metric-card glass-panel">
            <div className="metric-card-header">
              <Sparkles size={18} className="text-teal" />
              <span className="metric-card-name">{t('faceScanner.metricTexture', 'Texture & Clarity')}</span>
            </div>
            <div className="metric-card-val text-teal">{result.textureScore || 79}%</div>
            <div className="metric-bar-bg">
              <div className="metric-bar-fill bg-teal" style={{ width: `${result.textureScore || 79}%` }} />
            </div>
            <span className="metric-card-hint">{t('faceScanner.textureHint', 'Pore refinement & surface smoothness')}</span>
          </div>

          <div className="beauty-metric-card glass-panel">
            <div className="metric-card-header">
              <ShieldCheck size={18} className="text-gold" />
              <span className="metric-card-name">{t('faceScanner.metricVitality', 'Elasticity & Vitality')}</span>
            </div>
            <div className="metric-card-val text-gold">{result.vitalityScore || 76}%</div>
            <div className="metric-bar-bg">
              <div className="metric-bar-fill bg-gold" style={{ width: `${result.vitalityScore || 76}%` }} />
            </div>
            <span className="metric-card-hint">{t('faceScanner.vitalityHint', 'Collagen firmness & resilience')}</span>
          </div>
        </div>

        {/* Eye Contour Vitality Card */}
        {result.eyeContour && (
          <div className="eye-contour-card glass-panel">
            <div className="eye-contour-header flex items-center gap-2">
              <Eye size={18} className="text-teal" />
              <h4 className="font-bold text-text">{t('faceScanner.eyeContourTitle', 'Eye Contour & Fatigue Vitality')}</h4>
            </div>
            <p className="text-muted text-sm mt-2">{result.eyeContour.observation}</p>
            <div className="eye-contour-tags mt-3 flex gap-2">
              <span className="contour-tag">
                {t('faceScanner.darkCircles', 'Dark Circles')}:{' '}
                <strong className="capitalize">{result.eyeContour.darkCircles || 'low'}</strong>
              </span>
              <span className="contour-tag">
                {t('faceScanner.puffiness', 'Puffiness')}:{' '}
                <strong className="capitalize">{result.eyeContour.puffiness || 'low'}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Facial Observations */}
        {result.signals?.length > 0 && (
          <section className="results-section glass-panel">
            <h2 className="results-section-title flex items-center gap-2">
              <Search size={18} className="text-teal" /> {t('faceScanner.whatWeObserved', 'Facial Observations')}
            </h2>
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

        {/* Skincare & Wellness Rituals */}
        {result.skincareRituals && (
          <section className="results-section glass-panel">
            <h2 className="results-section-title flex items-center gap-2">
              <Clock size={18} className="text-gold" /> {t('faceScanner.ritualsTitle', 'Tailored Daily Beauty Rituals')}
            </h2>

            <div className="rituals-columns">
              <div className="ritual-box">
                <h4 className="ritual-box-title flex items-center gap-2 text-teal">
                  <Sun size={15} /> {t('faceScanner.amRitual', 'Morning Glow & Protect')}
                </h4>
                <ul className="ritual-steps">
                  {result.skincareRituals.morning?.map((step: string, i: number) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>

              <div className="ritual-box">
                <h4 className="ritual-box-title flex items-center gap-2 text-gold">
                  <Sparkles size={15} /> {t('faceScanner.pmRitual', 'Evening Barrier Repair')}
                </h4>
                <ul className="ritual-steps">
                  {result.skincareRituals.evening?.map((step: string, i: number) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>

            {result.skincareRituals.wellnessNudge && (
              <div className="wellness-nudge-box mt-4">
                <HeartHandshake size={16} className="text-teal shrink-0" />
                <span className="text-sm text-muted">{result.skincareRituals.wellnessNudge}</span>
              </div>
            )}
          </section>
        )}

        {/* Clinical / Pharmacist Review Gating Notice */}
        <section className="results-section glass-panel">
          <h2 className="results-section-title flex items-center gap-2">
            <ClipboardCheck size={18} className="text-gold" />{' '}
            {t('faceScanner.reviewGatedTitle', 'Personalized Beauty Supplements & Review')}
          </h2>
          <p className="text-muted text-sm">
            {t(
              'faceScanner.reviewGatedBody',
              'Dermal nutrition concepts (such as Marine Collagen, Hyaluronic Acid, and Vitamin C complexes) are routed to our clinical review queue. Once reviewed by a licensed pharmacist, they will appear in your customized supplement plan.'
            )}
          </p>

          {reviewRequestError && <p className="scanner-error mt-3">{reviewRequestError}</p>}

          {reviewRequested ? (
            <span className="pending-review-requested flex items-center gap-2 mt-4">
              <CheckCircle2 size={16} /> {t('faceScanner.reviewRequestSent', 'Review prioritized by clinical team.')}
            </span>
          ) : (
            <button
              className="btn btn-secondary mt-4 flex items-center gap-2"
              onClick={handleRequestReview}
              disabled={requestingReview}
            >
              <PhoneCall size={16} />{' '}
              {requestingReview
                ? t('faceScanner.requestingReview', 'Sending request...')
                : t('faceScanner.requestReviewCta', 'Request Pharmacist Consultation')}
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
    <div className="face-scanner-page scanner-camera">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      <div className="camera-container">
        <video
          ref={videoRef}
          className={`camera-feed ${facing === 'user' ? 'mirrored' : ''}`}
          playsInline
          muted
        />

        {/* Face Oval Guide Overlay with Laser Line */}
        <div className="face-camera-overlay">
          <div className="face-oval-frame">
            <div className="face-scanning-laser" />
            <div className="face-corner-marker top-left" />
            <div className="face-corner-marker top-right" />
            <div className="face-corner-marker bottom-left" />
            <div className="face-corner-marker bottom-right" />
          </div>
          <p className="camera-hint">{t('faceScanner.cameraHint', 'Position face inside the oval · Natural lighting')}</p>
        </div>

        {countdown !== null && <div className="countdown-overlay">{countdown}</div>}

        {/* Controls */}
        <div className="camera-controls">
          <button
            className="camera-ctrl-btn"
            title="Back"
            onClick={() => {
              stopCamera();
              setState('guide');
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <button className="camera-capture-btn" title="Capture Face" onClick={captureAndAnalyze}>
            <Camera size={28} />
          </button>
          <button className="camera-ctrl-btn" title="Flip Camera" onClick={flipCamera}>
            <FlipHorizontal size={22} />
          </button>
          <button
            className="camera-ctrl-btn"
            title="Upload Photo"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
