import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Circle } from 'react-native-svg';
import {
  Camera,
  CheckCircle2,
  Hand,
  Loader,
  PhoneCall,
  ScanLine,
  Search,
  Sun,
  X,
} from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { usePatient } from '../../context/PatientContext';
import { requestPharmacistReview, submitHandScan } from '../../api/endpoints';
import type { HandScanResult } from '../../api/types';
import { formatShortDate } from '../../utils/date';

type ScanStep = 'guide' | 'camera' | 'analyzing' | 'result';

export default function ScanFlowScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { patientId, refreshRecommendation } = usePatient();

  const [step, setStep] = useState<ScanStep>('guide');
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState('');
  const [result, setResult] = useState<HandScanResult | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Lets the tab navigator hide its bar during the full-bleed camera and
  // analyzing states (TabNavigator reads route.params.scanStep) — mirrors
  // the prototype's showTabs logic without needing a separate navigator.
  useEffect(() => {
    // @ts-expect-error -- setParams accepts a partial params object
    navigation.setParams({ scanStep: step });
  }, [step, navigation]);

  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        setError(t('handScanner.cameraDenied'));
        return;
      }
    }
    setError('');
    setStep('camera');
  };

  const capture = async () => {
    if (!cameraRef.current || !patientId) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      if (!photo?.base64) throw new Error('no image');
      setStep('analyzing');
      const res = await submitHandScan({ patientId, imageBase64: photo.base64, mimeType: 'image/jpeg' });
      if (res.ok && res.data) {
        setPreviousScore(result?.overallScore ?? null);
        setResult(res.data);
        setRequested(false);
        setStep('result');
        await refreshRecommendation();
      } else {
        setError(res.error || t('handScanner.analysisFailed'));
        setStep('camera');
      }
    } catch {
      setError(t('handScanner.analysisFailedRetry'));
      setStep('guide');
    }
  };

  const handleRequestReview = async () => {
    if (!patientId || !result?.scanId) return;
    setRequesting(true);
    const res = await requestPharmacistReview({ patientId, source: 'hand_scan', scanId: result.scanId });
    setRequesting(false);
    if (res.ok) setRequested(true);
  };

  if (step === 'camera') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cameraBg }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                width: 196,
                height: 258,
                borderWidth: 2,
                borderColor: 'rgba(34,211,238,0.7)',
                borderStyle: 'dashed',
                borderRadius: 40,
              }}
            />
            <Text
              style={{
                position: 'absolute',
                bottom: 130,
                paddingHorizontal: 30,
                color: 'rgba(255,255,255,0.92)',
                fontFamily: fonts.headingSemibold,
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              {t('handScanner.cameraHint')}
            </Text>
          </View>

          <View style={{ position: 'absolute', top: 16, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable
              onPress={() => setStep('guide')}
              style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} color="#fff" />
            </Pressable>
            <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>
              {t('mobile.scan.stepOf', { n: 2, label: t('mobile.scan.stepCapture') })}
            </Text>
          </View>

          <View style={{ position: 'absolute', bottom: 44, left: 0, right: 0, paddingHorizontal: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: 48, height: 48 }} />
            <Pressable
              onPress={capture}
              style={{ width: 76, height: 76, borderRadius: radius.full, backgroundColor: colors.gold, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
            >
              <Camera size={30} color="#fff" />
            </Pressable>
            <View style={{ width: 48, height: 48 }} />
          </View>
        </CameraView>
      </View>
    );
  }

  if (step === 'analyzing') {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: spacing.md }}>
          <Loader size={40} color={colors.teal} />
          <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 22, color: colors.text, letterSpacing: -0.3 }}>{t('handScanner.analyzingTitle')}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{t('handScanner.analyzingSubtitle')}</Text>
          <View style={{ marginTop: 12, gap: 13, alignSelf: 'stretch', maxWidth: 260 }}>
            {[t('handScanner.analyzingStep1'), t('handScanner.analyzingStep2'), t('handScanner.analyzingStep3'), t('handScanner.analyzingStep4')].map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.teal }} />
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      </Screen>
    );
  }

  if (step === 'result' && result) {
    const delta = previousScore != null && result.overallScore != null ? result.overallScore - previousScore : null;
    return (
      <Screen>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.teal }}>
            {t('mobile.scan.stepOf', { n: 3, label: t('mobile.scan.stepResult') })}
          </Text>
          <Pressable onPress={() => { setStep('guide'); setResult(null); }}>
            <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 13, color: colors.muted }}>{t('mobile.scan.rescan')}</Text>
          </Pressable>
        </View>

        {result.overallScore != null && (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <View style={{ width: 86, height: 86 }}>
              <Svg viewBox="0 0 80 80" width={86} height={86}>
                <Circle cx={40} cy={40} r={34} fill="none" stroke={colors.border} strokeWidth={6} />
                <Circle
                  cx={40}
                  cy={40}
                  r={34}
                  fill="none"
                  stroke={colors.gold}
                  strokeWidth={6}
                  strokeDasharray={`${(result.overallScore / 100) * 213.6} 213.6`}
                  strokeLinecap="round"
                  rotation={-90}
                  origin="40, 40"
                />
              </Svg>
              <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 25, color: colors.text }}>{result.overallScore}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 17, color: colors.text }}>{t('handScanner.wellnessScore')}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2, lineHeight: 18 }}>
                {delta != null ? t('mobile.scan.scoreImproved', { delta }) : t('mobile.scan.scoreFirst')} {t('mobile.scan.basedOnVisible')}
              </Text>
            </View>
          </Card>
        )}

        {result.signals.length > 0 && (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Search size={17} color={colors.teal} />
              <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 15, color: colors.text }}>{t('mobile.scan.threeThings')}</Text>
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginBottom: 14 }}>{t('mobile.scan.threeThingsSub')}</Text>
            {result.signals.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 14 }}>
                <View style={{ width: 26, alignItems: 'center' }}>
                  <View style={{ width: 26, height: 26, borderRadius: radius.full, backgroundColor: colors.tealGlow, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 11, color: colors.teal }}>{i + 1}</Text>
                  </View>
                  {i < result.signals.length - 1 && <View style={{ flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4 }} />}
                </View>
                <View style={{ flex: 1, paddingBottom: i < result.signals.length - 1 ? 18 : 0 }}>
                  <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 13.5, color: colors.text }}>{s.area}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted, marginTop: 3 }}>{s.observation}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        <Card>
          <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 15, color: colors.text, marginBottom: 14 }}>{t('mobile.scan.whatHappensNext')}</Text>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 26, height: 26, borderRadius: radius.full, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={14} color="#fff" />
              </View>
              <Text style={{ flex: 1, fontFamily: fonts.headingSemibold, fontSize: 13.5, color: colors.text }}>{t('mobile.scan.stepSaved')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 26, height: 26, borderRadius: radius.full, borderWidth: 2, borderColor: colors.teal, alignItems: 'center', justifyContent: 'center' }}>
                <Loader size={13} color={colors.teal} />
              </View>
              <Text style={{ flex: 1, fontFamily: fonts.headingSemibold, fontSize: 13.5, color: colors.text }}>{t('mobile.scan.stepReviewing')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 26, height: 26, borderRadius: radius.full, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 11, color: colors.muted }}>3</Text>
              </View>
              <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: colors.muted }}>{t('mobile.scan.stepAppears')}</Text>
            </View>
          </View>

          {requested ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <CheckCircle2 size={16} color={colors.teal} />
              <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 13.5, color: colors.teal }}>{t('handScanner.requestReviewSent')}</Text>
            </View>
          ) : (
            <Button
              label={requesting ? t('handScanner.requestingReview') : t('mobile.scan.askFasterReview')}
              icon={<PhoneCall size={16} color={colors.text} />}
              variant="secondary"
              onPress={handleRequestReview}
              loading={requesting}
              fullWidth
              style={{ marginTop: 16 }}
            />
          )}
        </Card>

        <Text style={{ fontFamily: fonts.body, fontSize: 11.5, lineHeight: 18, color: colors.muted }}>{t('mobile.scan.diagnosticNote')}</Text>
      </Screen>
    );
  }

  // ── guide ──
  return (
    <Screen>
      <Text style={{ minHeight: 44, fontFamily: fonts.headingSemibold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.teal }}>
        {t('mobile.scan.stepOf', { n: 1, label: t('mobile.scan.stepPrepare') })}
      </Text>
      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
        <ScanLine size={44} color={colors.teal} />
        <Text style={{ fontFamily: fonts.headingExtrabold, fontSize: 25, color: colors.text, letterSpacing: -0.4 }}>{t('handScanner.guideTitle')}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.muted, textAlign: 'center', maxWidth: 290 }}>{t('handScanner.guideSubtitle')}</Text>
      </View>

      <View style={{ gap: 11 }}>
        <GuideTip icon={<Sun size={20} color={colors.gold} />} title={t('handScanner.tipLightTitle')} body={t('handScanner.tipLightBody')} />
        <GuideTip icon={<Hand size={20} color={colors.teal} />} title={t('handScanner.tipPalmTitle')} body={t('handScanner.tipPalmBody')} />
        <GuideTip icon={<Camera size={20} color={colors.teal} />} title={t('handScanner.tipFrameTitle')} body={t('handScanner.tipFrameBody')} />
      </View>

      {!!error && <Text style={{ color: colors.danger, fontSize: 13, fontFamily: fonts.body }}>{error}</Text>}

      <Button label={t('handScanner.openCamera')} icon={<Camera size={20} color="#fff" />} onPress={openCamera} fullWidth />
    </Screen>
  );
}

function GuideTip({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 13, padding: 15, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg }}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.headingSemibold, fontSize: 14, color: colors.text }}>{title}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted, marginTop: 2 }}>{body}</Text>
      </View>
    </View>
  );
}
