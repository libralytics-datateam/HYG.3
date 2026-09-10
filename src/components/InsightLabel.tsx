import { useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleHelp, Microscope, GitBranch, Lightbulb, CircleDashed } from 'lucide-react';
import './InsightLabel.css';

export type InsightKind = 'fact' | 'inference' | 'recommendation' | 'uncertain';

const ICONS = {
  fact: Microscope,
  inference: GitBranch,
  recommendation: Lightbulb,
  uncertain: CircleDashed,
} as const;

// The explainability affordance behind hard gate (c): every AI-generated
// insight on a patient report carries one of four epistemic labels — FACT,
// INFERENCE, RECOMMENDATION, UNCERTAIN — and a "why this label?" toggle that
// spells out, in plain language, what the label means and where the data
// under it came from. Reused across every report section rather than
// re-explained per screen.
export default function InsightLabel({ kind, source }: { kind: InsightKind; source?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const Icon = ICONS[kind];

  return (
    <span className={`insight-label insight-label-${kind}`}>
      <span className="insight-label-tag">
        <Icon size={12} />
        {t(`insightLabel.${kind}.tag`)}
      </span>
      <button
        type="button"
        className="insight-label-why"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <CircleHelp size={13} />
        <span className="sr-only">{t('insightLabel.whyButton')}</span>
      </button>
      {open && (
        <span className="insight-label-panel" id={panelId} role="note">
          <strong>{t(`insightLabel.${kind}.title`)}</strong>
          <span>{t(`insightLabel.${kind}.body`)}</span>
          {source && <span className="insight-label-source">{t('insightLabel.dataFrom', { source })}</span>}
        </span>
      )}
    </span>
  );
}
