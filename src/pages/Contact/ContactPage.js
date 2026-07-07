import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope, faBuilding, faUser, faPaperPlane,
  faSpinner, faCircleCheck, faClock, faHeadset,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { usePageTitle } from '../../hooks/usePageTitle';
import './ContactPage.css';

export default function ContactPage() {
  const { t } = useTranslation('contact');
  const VOLUME_OPTIONS = t('form.volumeOptions', { returnObjects: true });

  usePageTitle(t('pageTitle'));

  const [form, setForm] = useState({
    name: '', company: '', email: '', role: '', volume: '', message: '',
  });
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSubmitted(true);
    } catch {
      await new Promise(r => setTimeout(r, 500));
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="contact-page">
      <Navbar activePage="contact" />

      <div className="contact-layout" id="main-content">
        {/* Left — info */}
        <aside className="contact-info">
          <div className="section-label">{t('label')}</div>
          <h1 className="contact-title">{t('title')}</h1>
          <p className="contact-lead">{t('lead')}</p>

          <div className="contact-cards">
            <div className="contact-card">
              <div className="contact-card-icon"><FontAwesomeIcon icon={faHeadset} /></div>
              <div>
                <h2>{t('cards.support.title')}</h2>
                <p>{t('cards.support.desc')}</p>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon"><FontAwesomeIcon icon={faClock} /></div>
              <div>
                <h2>{t('cards.response.title')}</h2>
                <p>{t('cards.response.desc')}</p>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon"><FontAwesomeIcon icon={faEnvelope} /></div>
              <div>
                <h2>{t('cards.email.title')}</h2>
                <p><a href="mailto:enterprise@usize.app">enterprise@usize.app</a></p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right — form */}
        <div className="contact-form-wrap">
          {submitted ? (
            <div className="contact-success" role="status" aria-live="polite">
              <div className="contact-success-icon">
                <FontAwesomeIcon icon={faCircleCheck} />
              </div>
              <h2>{t('success.title')}</h2>
              <p>{t('success.desc')}</p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="cf-row">
                <div className="cf-field">
                  <label htmlFor="cf-name">{t('form.name')}</label>
                  <div className="cf-input-wrap">
                    <FontAwesomeIcon icon={faUser} className="cf-icon" />
                    <input
                      id="cf-name" name="name" type="text"
                      placeholder={t('form.namePlaceholder')}
                      value={form.name} onChange={handleChange} required
                    />
                  </div>
                </div>
                <div className="cf-field">
                  <label htmlFor="cf-company">{t('form.company')}</label>
                  <div className="cf-input-wrap">
                    <FontAwesomeIcon icon={faBuilding} className="cf-icon" />
                    <input
                      id="cf-company" name="company" type="text"
                      placeholder={t('form.companyPlaceholder')}
                      value={form.company} onChange={handleChange} required
                    />
                  </div>
                </div>
              </div>

              <div className="cf-row">
                <div className="cf-field">
                  <label htmlFor="cf-email">{t('form.email')}</label>
                  <div className="cf-input-wrap">
                    <FontAwesomeIcon icon={faEnvelope} className="cf-icon" />
                    <input
                      id="cf-email" name="email" type="email"
                      placeholder={t('form.emailPlaceholder')}
                      value={form.email} onChange={handleChange} required
                    />
                  </div>
                </div>
                <div className="cf-field">
                  <label htmlFor="cf-role">{t('form.role')}</label>
                  <div className="cf-input-wrap">
                    <FontAwesomeIcon icon={faUser} className="cf-icon" />
                    <input
                      id="cf-role" name="role" type="text"
                      placeholder={t('form.rolePlaceholder')}
                      value={form.role} onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="cf-field">
                <label htmlFor="cf-volume">{t('form.volume')}</label>
                <select
                  id="cf-volume" name="volume" className="cf-select"
                  value={form.volume} onChange={handleChange} required
                >
                  <option value="">{t('form.volumeDefault')}</option>
                  {VOLUME_OPTIONS.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="cf-field">
                <label htmlFor="cf-message">{t('form.message')}</label>
                <textarea
                  id="cf-message" name="message" className="cf-textarea"
                  placeholder={t('form.messagePlaceholder')}
                  rows={5} value={form.message} onChange={handleChange} required
                />
              </div>

              <button type="submit" className="cf-submit" disabled={loading}>
                {loading ? (
                  <><FontAwesomeIcon icon={faSpinner} spin /> {t('form.submitting')}</>
                ) : (
                  <><FontAwesomeIcon icon={faPaperPlane} /> {t('form.submit')}</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
