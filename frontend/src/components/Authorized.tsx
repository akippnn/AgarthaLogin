import { CheckCircle2 } from 'lucide-preact'
import { Stack, Admonition } from './ui'
import { useTranslation } from '../lib/i18n';

export default function Authorized() {
  const { t } = useTranslation();
  return (
    <Stack gap="1.5rem" align="center">
      <Admonition variant="success" title={t("Success!")}>
        <Stack gap="1rem" align="center">
          <CheckCircle2 size={64} color="var(--color-success)" />
          <div style={{ textAlign: 'center' }}>
            <p>{t("You have been authorized in-game.")}</p>
            <p className="typography-subheading" style={{ marginTop: '0.5rem' }}>
              {t("You may now close this window.")}
            </p>
          </div>
        </Stack>
      </Admonition>
    </Stack>
  )
}
