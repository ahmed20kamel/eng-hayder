import { useTranslation } from 'react-i18next'
import { FaGlobe } from 'react-icons/fa'

export default function LanguageSwitcher(){
  const { i18n, t } = useTranslation()
  const toggle = () => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')
  return (
    <button className="btn secondary" onClick={toggle} title="Language">
      <FaGlobe style={{marginInlineEnd:8}}/>{t('language')}
    </button>
  )
}
