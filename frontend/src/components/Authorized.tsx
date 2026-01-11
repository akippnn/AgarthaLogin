import { CheckCircle2 } from 'lucide-react'

import { useTranslation } from 'react-i18next';

export default function Authorized() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="typography-heading">{t("Success!")}</h1>
      <CheckCircle2 size={64} color="#40c057" style={{ marginBottom: '1rem' }} />
      <p>{t("You have been authorized in-game.")}</p>
      <br />
      <p className="typography-subheading">{t("You may now close this window.")}</p>
    </div>
  )
}
