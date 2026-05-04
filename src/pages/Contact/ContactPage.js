import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope, faBuilding, faUser, faPaperPlane,
  faSpinner, faCircleCheck, faClock, faHeadset,
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './ContactPage.css';

const VOLUME_OPTIONS = [
  'Menos de 1 000 predicciones/mes',
  '1 000 – 10 000 predicciones/mes',
  '10 000 – 100 000 predicciones/mes',
  'Más de 100 000 predicciones/mes',
];

export default function ContactPage() {
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
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="contact-page">
      <Navbar activePage="contact" />

      <div className="contact-layout">
        {/* Left — info */}
        <aside className="contact-info">
          <div className="section-label">Contacto</div>
          <h1 className="contact-title">Hablemos de tu proyecto</h1>
          <p className="contact-lead">
            ¿Tienes una tienda de moda de alto volumen o necesitas una integración
            personalizada? Cuéntanos tu caso y te preparamos una propuesta a medida.
          </p>

          <div className="contact-cards">
            <div className="contact-card">
              <div className="contact-card-icon">
                <FontAwesomeIcon icon={faHeadset} />
              </div>
              <div>
                <h3>Soporte Enterprise</h3>
                <p>Manager de cuenta dedicado y SLA 99.9 % de disponibilidad.</p>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div>
                <h3>Tiempo de respuesta</h3>
                <p>Respondemos en menos de 24 horas en días hábiles.</p>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon">
                <FontAwesomeIcon icon={faEnvelope} />
              </div>
              <div>
                <h3>Email directo</h3>
                <p>
                  <a href="mailto:enterprise@usize.app">enterprise@usize.app</a>
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right — form */}
        <div className="contact-form-wrap">
          {submitted ? (
            <div className="contact-success">
              <div className="contact-success-icon">
                <FontAwesomeIcon icon={faCircleCheck} />
              </div>
              <h2>Mensaje enviado</h2>
              <p>
                Gracias por contactarnos. Revisaremos tu solicitud y te
                responderemos en menos de 24 horas.
              </p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="cf-row">
                <div className="cf-field">
                  <label htmlFor="cf-name">Nombre completo</label>
                  <div className="cf-input-wrap">
                    <FontAwesomeIcon icon={faUser} className="cf-icon" />
                    <input
                      id="cf-name" name="name" type="text"
                      placeholder="Tu nombre"
                      value={form.name} onChange={handleChange} required
                    />
                  </div>
                </div>
                <div className="cf-field">
                  <label htmlFor="cf-company">Empresa</label>
                  <div className="cf-input-wrap">
                    <FontAwesomeIcon icon={faBuilding} className="cf-icon" />
                    <input
                      id="cf-company" name="company" type="text"
                      placeholder="Tu empresa"
                      value={form.company} onChange={handleChange} required
                    />
                  </div>
                </div>
              </div>

              <div className="cf-row">
                <div className="cf-field">
                  <label htmlFor="cf-email">Email de trabajo</label>
                  <div className="cf-input-wrap">
                    <FontAwesomeIcon icon={faEnvelope} className="cf-icon" />
                    <input
                      id="cf-email" name="email" type="email"
                      placeholder="tu@empresa.com"
                      value={form.email} onChange={handleChange} required
                    />
                  </div>
                </div>
                <div className="cf-field">
                  <label htmlFor="cf-role">Cargo</label>
                  <div className="cf-input-wrap">
                    <FontAwesomeIcon icon={faUser} className="cf-icon" />
                    <input
                      id="cf-role" name="role" type="text"
                      placeholder="CEO, CTO, Marketing…"
                      value={form.role} onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="cf-field">
                <label htmlFor="cf-volume">Volumen esperado de predicciones</label>
                <select
                  id="cf-volume" name="volume"
                  className="cf-select"
                  value={form.volume} onChange={handleChange} required
                >
                  <option value="">Selecciona un rango…</option>
                  {VOLUME_OPTIONS.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="cf-field">
                <label htmlFor="cf-message">Cuéntanos tu caso</label>
                <textarea
                  id="cf-message" name="message"
                  className="cf-textarea"
                  placeholder="Describe tu tienda, plataforma y qué necesitas de USize…"
                  rows={5}
                  value={form.message} onChange={handleChange} required
                />
              </div>

              <button type="submit" className="cf-submit" disabled={loading}>
                {loading ? (
                  <><FontAwesomeIcon icon={faSpinner} spin /> Enviando…</>
                ) : (
                  <><FontAwesomeIcon icon={faPaperPlane} /> Enviar mensaje</>
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
