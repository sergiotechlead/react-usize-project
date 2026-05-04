import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt, faCode, faDatabase, faGear, faPuzzlePiece,
  faCircleInfo, faTriangleExclamation, faCircleCheck,
  faCopy, faBars, faXmark, faBook,
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './DocsPage.css';

const SECTIONS = [
  { id: 'intro',       icon: faBook,          label: 'Introducción' },
  { id: 'quickstart',  icon: faBolt,          label: 'Instalación rápida' },
  { id: 'training',    icon: faDatabase,      label: 'Datos de entrenamiento' },
  { id: 'options',     icon: faGear,          label: 'Opciones del widget' },
  { id: 'api',         icon: faCode,          label: 'Referencia de la API' },
  { id: 'integration', icon: faPuzzlePiece,   label: 'Plataformas' },
  { id: 'faq',         icon: faCircleInfo,    label: 'Preguntas frecuentes' },
];

function CodeBlock({ lang, code, label }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="doc-code-block">
      <div className="doc-code-bar">
        <span className="doc-code-lang">{lang || label}</span>
        <button className="doc-code-copy" onClick={copy}>
          <FontAwesomeIcon icon={faCopy} /> {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="doc-code-pre"><code>{code}</code></pre>
    </div>
  );
}

function Callout({ type, children }) {
  const icons = { info: faCircleInfo, warning: faTriangleExclamation, success: faCircleCheck };
  return (
    <div className={`doc-callout doc-callout--${type}`}>
      <FontAwesomeIcon icon={icons[type] || faCircleInfo} className="callout-icon" />
      <div>{children}</div>
    </div>
  );
}

export default function DocsPage() {
  const [active, setActive] = useState('intro');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && SECTIONS.find(s => s.id === hash)) setActive(hash);
  }, []);

  function navTo(id) {
    setActive(id);
    setSidebarOpen(false);
    window.location.hash = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="docs-page">
      <Navbar activePage="docs" />

      <div className="docs-layout">
        {/* Sidebar */}
        <aside className={`docs-sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <div className="docs-sidebar-header">
            <span>Documentación</span>
            <button className="docs-sidebar-close" onClick={() => setSidebarOpen(false)}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          <nav className="docs-sidebar-nav">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                className={`docs-nav-item${active === s.id ? ' is-active' : ''}`}
                onClick={() => navTo(s.id)}
              >
                <FontAwesomeIcon icon={s.icon} className="docs-nav-icon" />
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile sidebar toggle */}
        <button className="docs-mobile-toggle" onClick={() => setSidebarOpen(v => !v)}>
          <FontAwesomeIcon icon={faBars} /> Menú de documentación
        </button>

        {/* Content */}
        <main className="docs-content">
          {active === 'intro' && (
            <article className="doc-article">
              <h1>Introducción a USize</h1>
              <p className="doc-lead">
                USize es un SaaS que permite a cualquier tienda de moda añadir un widget
                inteligente de predicción de tallas entrenado con los datos específicos de su marca.
              </p>
              <h2>¿Cómo funciona?</h2>
              <p>
                La arquitectura se basa en TensorFlow.js, lo que permite que el modelo de red
                neuronal se entrene y ejecute directamente en el navegador del usuario. Esto
                garantiza máxima privacidad ya que ningún dato personal abandona el dispositivo.
              </p>
              <ol className="doc-list">
                <li>El comercio sube sus datos de tallas a través del dashboard.</li>
                <li>El modelo se entrena en el navegador en segundos.</li>
                <li>Se genera un snippet de integración único con tu API key.</li>
                <li>Los visitantes de tu tienda obtienen predicciones personalizadas.</li>
              </ol>
              <h2>Arquitectura del modelo</h2>
              <p>La red neuronal acepta 4 variables de entrada:</p>
              <div className="doc-table-wrap">
                <table className="doc-table">
                  <thead>
                    <tr><th>Variable</th><th>Unidad</th><th>Rango típico</th><th>Descripción</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><code>espalda</code></td><td>cm</td><td>38–56</td><td>Ancho de espalda</td></tr>
                    <tr><td><code>altura</code></td><td>cm</td><td>155–190</td><td>Altura total</td></tr>
                    <tr><td><code>peso</code></td><td>kg</td><td>50–100</td><td>Peso corporal</td></tr>
                    <tr><td><code>edad</code></td><td>años</td><td>18–65</td><td>Edad de la persona</td></tr>
                  </tbody>
                </table>
              </div>
              <p>La salida es una clasificación de 4 clases: <code>S</code>, <code>M</code>, <code>L</code>, <code>XL</code>.</p>
              <Callout type="info">
                La arquitectura de la red es: <strong>4 → 100 → 1000 → 100 → 4 (softmax)</strong>.
                Entrenada con Adam optimizer y categorical crossentropy.
              </Callout>
            </article>
          )}

          {active === 'quickstart' && (
            <article className="doc-article">
              <h1>Instalación rápida</h1>
              <p className="doc-lead">
                Integra el widget de predicción de tallas en menos de 5 minutos.
              </p>

              <h2>Paso 1 — Crea tu cuenta</h2>
              <p>
                <Link to="/register">Regístrate</Link> para obtener tu API key personal.
                El plan Starter es completamente gratuito.
              </p>

              <h2>Paso 2 — Entrena tu modelo</h2>
              <p>
                Descarga la plantilla Excel desde tu dashboard, rellénala con los datos
                de medidas y tallas de tu marca, y cárgala para entrenar el modelo.
              </p>
              <Callout type="warning">
                Necesitas al menos <strong>20 filas de datos</strong> para obtener predicciones
                confiables. Te recomendamos incluir al menos 10 muestras por talla.
              </Callout>

              <h2>Paso 3 — Pega el snippet</h2>
              <p>Añade el siguiente código en tu tienda:</p>
              <CodeBlock lang="HTML" code={`<!-- En el <head> de tu página -->
<link rel="stylesheet" href="https://cdn.usize.app/widget.css">

<!-- Donde quieres que aparezca el botón -->
<div id="usize-widget"></div>

<!-- Antes de </body> -->
<script src="https://cdn.usize.app/widget.js"></script>
<script>
  USize.init({
    apiKey: "us_live_TU_API_KEY",
    container: "#usize-widget"
  });
</script>`} />

              <Callout type="success">
                El widget es completamente responsive y se adapta al estilo de tu tienda
                a través de las opciones de configuración.
              </Callout>

              <h2>Verificar la instalación</h2>
              <p>
                Abre las herramientas de desarrollador del navegador (F12). Si la instalación
                es correcta, verás el mensaje <code>USize: initialized</code> en la consola.
              </p>
            </article>
          )}

          {active === 'training' && (
            <article className="doc-article">
              <h1>Datos de entrenamiento</h1>
              <p className="doc-lead">
                El modelo se entrena con datos específicos de tu marca para que las
                predicciones sean precisas para tu tabla de tallas.
              </p>

              <h2>Formato del archivo Excel</h2>
              <p>El archivo debe tener las siguientes columnas (se aceptan variantes):</p>
              <div className="doc-table-wrap">
                <table className="doc-table">
                  <thead>
                    <tr><th>Columna</th><th>Variantes aceptadas</th><th>Tipo</th><th>Requerida</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><code>espalda_cm</code></td><td>espalda</td><td>Número</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td></tr>
                    <tr><td><code>altura_cm</code></td><td>altura</td><td>Número</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td></tr>
                    <tr><td><code>peso_kg</code></td><td>peso</td><td>Número</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td></tr>
                    <tr><td><code>edad_años</code></td><td>edad</td><td>Número</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td></tr>
                    <tr><td><code>talla</code></td><td>Talla, TALLA</td><td>S / M / L / XL</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td></tr>
                  </tbody>
                </table>
              </div>

              <h2>Ejemplo de datos</h2>
              <CodeBlock lang="CSV" code={`espalda_cm,altura_cm,peso_kg,edad_años,talla
41,157,56,22,S
47,174,65,28,M
48,170,72,35,L
49,183,80,42,XL`} />

              <Callout type="info">
                Puedes descargar la plantilla pre-rellenada con datos de ejemplo desde
                el <Link to="/dashboard">dashboard</Link> en la sección "Modelo IA".
              </Callout>

              <h2>Recomendaciones</h2>
              <ul className="doc-list">
                <li>Mínimo 20 filas; recomendado 50+</li>
                <li>Distribuye las tallas de forma equilibrada</li>
                <li>Usa datos reales de clientes si es posible</li>
                <li>Puedes combinar tus datos con los datos base del modelo</li>
              </ul>
            </article>
          )}

          {active === 'options' && (
            <article className="doc-article">
              <h1>Opciones del widget</h1>
              <p className="doc-lead">
                Personaliza el comportamiento y apariencia del widget mediante el objeto
                de configuración pasado a <code>USize.init()</code>.
              </p>
              <div className="doc-table-wrap">
                <table className="doc-table">
                  <thead>
                    <tr><th>Opción</th><th>Tipo</th><th>Requerida</th><th>Descripción</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><code>apiKey</code></td><td>string</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td><td>Tu API key única del dashboard.</td></tr>
                    <tr><td><code>container</code></td><td>string</td><td><FontAwesomeIcon icon={faCircleCheck} className="cmp-yes" /></td><td>Selector CSS del contenedor del widget.</td></tr>
                    <tr><td><code>brandColor</code></td><td>string</td><td>—</td><td>Color principal en formato hex. Default: <code>#53a0f8</code>.</td></tr>
                    <tr><td><code>buttonText</code></td><td>string</td><td>—</td><td>Texto del botón. Default: <code>"¿Cuál es mi talla?"</code>.</td></tr>
                    <tr><td><code>position</code></td><td>string</td><td>—</td><td><code>after-add-to-cart</code> | <code>before-add-to-cart</code> | <code>floating</code></td></tr>
                    <tr><td><code>locale</code></td><td>string</td><td>—</td><td>Idioma: <code>es</code> (default) | <code>en</code> | <code>pt</code>.</td></tr>
                  </tbody>
                </table>
              </div>
              <h2>Ejemplo con todas las opciones</h2>
              <CodeBlock lang="JS" code={`USize.init({
  apiKey: "us_live_••••••••",
  container: "#usize-widget",
  brandColor: "#e63946",
  buttonText: "Encontrar mi talla",
  position: "after-add-to-cart",
  locale: "es"
});`} />
            </article>
          )}

          {active === 'api' && (
            <article className="doc-article">
              <h1>Referencia de la API</h1>
              <p className="doc-lead">
                Documenta todos los métodos públicos que expone el objeto <code>USize</code>
                en el contexto del navegador.
              </p>

              <h2><code>USize.init(config)</code></h2>
              <p>Inicializa el widget. Debe llamarse una sola vez por página.</p>
              <CodeBlock lang="JS" code={`USize.init({ apiKey: "us_live_...", container: "#usize-widget" });`} />

              <h2><code>USize.predict(data)</code></h2>
              <p>Ejecuta una predicción manualmente. Retorna una promesa con el resultado.</p>
              <CodeBlock lang="JS" code={`const result = await USize.predict({
  espalda: 44,   // cm
  altura: 170,   // cm
  peso: 68,      // kg
  edad: 29       // años
});
console.log(result); // { size: "M", confidence: 0.87 }`} />

              <h2><code>USize.on(event, callback)</code></h2>
              <p>Suscribe a eventos del widget.</p>
              <CodeBlock lang="JS" code={`USize.on("predict", ({ size, confidence }) => {
  console.log("Talla predicha:", size);
  // Aquí puedes integrar con tu analytics
  gtag("event", "usize_predict", { size });
});

// Eventos disponibles:
// "predict"  — cuando se realiza una predicción
// "open"     — cuando el modal se abre
// "close"    — cuando el modal se cierra`} />

              <Callout type="warning">
                Los eventos sólo están disponibles en los planes Pro y Enterprise.
              </Callout>
            </article>
          )}

          {active === 'integration' && (
            <article className="doc-article">
              <h1>Integración por plataforma</h1>
              <p className="doc-lead">
                Instrucciones específicas para las plataformas de e-commerce más populares.
              </p>

              <h2>Shopify</h2>
              <p>
                Edita el archivo <code>theme.liquid</code> de tu tema y añade el snippet
                antes del cierre de <code>&lt;/body&gt;</code>. Para añadir el widget en
                la página de producto, edita <code>product.liquid</code>.
              </p>
              <CodeBlock lang="Liquid" code={`{% comment %} USize widget {% endcomment %}
<link rel="stylesheet" href="https://cdn.usize.app/widget.css">
<div id="usize-widget"></div>
<script src="https://cdn.usize.app/widget.js"></script>
<script>
  USize.init({
    apiKey: "{{ shop.metafields.usize.api_key }}",
    container: "#usize-widget",
    brandColor: "{{ settings.color_accent }}"
  });
</script>`} />

              <h2>WooCommerce</h2>
              <p>
                Añade el snippet a través de <strong>Apariencia → Editor de temas</strong>
                o usando un plugin como <em>Code Snippets</em>.
              </p>
              <CodeBlock lang="PHP" code={`<?php
add_action('woocommerce_after_add_to_cart_button', 'usize_widget');
function usize_widget() { ?>
  <link rel="stylesheet" href="https://cdn.usize.app/widget.css">
  <div id="usize-widget"></div>
  <script src="https://cdn.usize.app/widget.js"></script>
  <script>
    USize.init({ apiKey: "TU_API_KEY", container: "#usize-widget" });
  </script>
<?php }`} />

              <h2>HTML estático</h2>
              <p>Añade el snippet directamente en tu archivo HTML:</p>
              <CodeBlock lang="HTML" code={`<html>
  <head>
    <link rel="stylesheet" href="https://cdn.usize.app/widget.css">
  </head>
  <body>
    <!-- Tu contenido -->
    <div id="usize-widget"></div>
    <script src="https://cdn.usize.app/widget.js"></script>
    <script>
      USize.init({ apiKey: "TU_API_KEY", container: "#usize-widget" });
    </script>
  </body>
</html>`} />
            </article>
          )}

          {active === 'faq' && (
            <article className="doc-article" id="faq">
              <h1>Preguntas frecuentes</h1>
              <p className="doc-lead">Respuestas a las dudas más comunes sobre USize.</p>

              <h2>¿El widget funciona sin conexión a internet?</h2>
              <p>
                Una vez que el modelo está entrenado y guardado en el localStorage del
                navegador, las predicciones funcionan completamente offline.
              </p>

              <h2>¿Qué navegadores son compatibles?</h2>
              <p>
                USize es compatible con Chrome 80+, Firefox 78+, Safari 14+, Edge 80+.
                No es compatible con Internet Explorer.
              </p>

              <h2>¿Puedo personalizar los tamaños más allá de S/M/L/XL?</h2>
              <p>
                Actualmente el modelo predice 4 clases estándar. El soporte para tallas
                numéricas (28, 30, 32...) o tallas extendidas (XS, XXL) está planificado
                para una versión futura.
              </p>

              <h2>¿Cómo sé si mi modelo tiene buena precisión?</h2>
              <p>
                En el dashboard puedes ver la métrica de <em>accuracy</em> del último
                entrenamiento. Un valor por encima del 90 % indica un buen modelo.
                Si es inferior, añade más datos de entrenamiento.
              </p>

              <h2>¿Mis datos de clientes están seguros?</h2>
              <p>
                Sí. El modelo se entrena y ejecuta en el navegador del usuario. No se
                envían medidas personales a ningún servidor externo. Tu API key solo
                se usa para validar tu suscripción.
              </p>

              <Callout type="info">
                ¿Tienes una pregunta que no está aquí? Escríbenos a{' '}
                <a href="mailto:soporte@usize.app">soporte@usize.app</a>.
              </Callout>
            </article>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
