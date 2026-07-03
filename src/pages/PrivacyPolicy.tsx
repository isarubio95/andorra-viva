import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import { PRIVACY_POLICY_LAST_UPDATED, PRIVACY_POLICY_VERSION } from '@/constants/privacy-policy';

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <article className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
          <header className="mb-10 space-y-3">
            <p className="text-sm text-muted-foreground">Última actualización: {PRIVACY_POLICY_LAST_UPDATED}</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Política de Protección de Datos Personales
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              La presente política informa sobre el tratamiento de datos personales realizado por{' '}
              <strong>Andorra Viva</strong> en el marco de la{' '}
              <em>Llei qualificada 29/2021, del 28 d&apos;octubre, de protecció de dades personals</em>{' '}
              (LQPD) y su Reglamento de aplicación (Decret 391/2022, del 28 de setembre).
            </p>
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed md:text-base [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:text-base [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
            <section>
              <h2>1. Responsable del tratamiento</h2>
              <p>
                El responsable del tratamiento de sus datos personales es <strong>Andorra Viva</strong>,
                plataforma de directorio de negocios y experiencias en el Principado de Andorra.
              </p>
              <ul>
                <li>
                  <strong>Correo de contacto en materia de privacidad:</strong>{' '}
                  <a href="mailto:privacidad@andorraviva.ad" className="text-primary hover:underline">
                    privacidad@andorraviva.ad
                  </a>
                </li>
                <li>
                  <strong>Sitio web:</strong>{' '}
                  <Link to="/" className="text-primary hover:underline">
                    andorraviva.ad
                  </Link>
                </li>
              </ul>
            </section>

            <section>
              <h2>2. Marco normativo aplicable</h2>
              <p>
                El tratamiento de datos personales se rige por la legislación andorrana, en particular:
              </p>
              <ul>
                <li>
                  La <strong>Llei 29/2021, del 28 d&apos;octubre, qualificada de protecció de dades personals</strong>{' '}
                  (LQPD).
                </li>
                <li>
                  El <strong>Decret 391/2022, del 28 de setembre</strong>, d&apos;aprovació del Reglament
                  d&apos;aplicació de la LQPD.
                </li>
                <li>
                  La normativa complementaria vigente en el Principat d&apos;Andorra en materia de protección
                  de datos y servicios de la sociedad de la información.
                </li>
              </ul>
              <p>
                La autoridad de control competente es la{' '}
                <strong>Agència Andorrana de Protecció de Dades (APDA)</strong>. Puede consultar información
                y presentar reclamaciones en{' '}
                <a
                  href="https://www.apda.ad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.apda.ad
                </a>
                .
              </p>
            </section>

            <section>
              <h2>3. Datos personales que tratamos</h2>
              <p>Según el uso que haga de la plataforma, podemos tratar las siguientes categorías de datos:</p>

              <h3>3.1. Usuarios registrados</h3>
              <ul>
                <li>Nombre completo.</li>
                <li>Dirección de correo electrónico.</li>
                <li>Contraseña (almacenada de forma cifrada; no conservamos la contraseña en texto plano).</li>
                <li>Tipo de cuenta (usuario o profesional) y plan de suscripción.</li>
                <li>Fecha de aceptación de la presente política de protección de datos.</li>
                <li>Datos de actividad en la plataforma: favoritos, valoraciones y reseñas publicadas.</li>
              </ul>

              <h3>3.2. Profesionales y titulares de negocios</h3>
              <ul>
                <li>Datos de identificación y contacto del negocio (nombre comercial, teléfono, sitio web).</li>
                <li>Ubicación, dirección y coordenadas geográficas.</li>
                <li>Descripción, categoría, servicios, horarios, imágenes y galería fotográfica.</li>
                <li>Información de facturación y suscripción cuando contrate un plan de pago.</li>
              </ul>

              <h3>3.3. Datos técnicos y de navegación</h3>
              <ul>
                <li>Dirección IP, tipo de navegador, dispositivo y datos de sesión necesarios para el funcionamiento y la seguridad del servicio.</li>
                <li>Cookies y tecnologías similares, conforme a la sección 10 de esta política.</li>
              </ul>
            </section>

            <section>
              <h2>4. Finalidades y bases jurídicas del tratamiento</h2>
              <p>Tratamos sus datos personales para las finalidades y con las bases jurídicas siguientes:</p>
              <ol>
                <li>
                  <strong>Gestión del registro y de la cuenta de usuario</strong> (creación de cuenta, autenticación,
                  acceso a funcionalidades): ejecución del contrato o medidas precontractuales a petición del
                  interesado (art. 6.1.b LQPD).
                </li>
                <li>
                  <strong>Prestación del directorio, mapa, favoritos y sistema de valoraciones</strong>: ejecución
                  del contrato (art. 6.1.b LQPD).
                </li>
                <li>
                  <strong>Gestión de suscripciones y pagos de planes profesionales</strong>: ejecución del contrato
                  y cumplimiento de obligaciones legales en materia fiscal y contable (art. 6.1.b y 6.1.c LQPD).
                </li>
                <li>
                  <strong>Publicación de perfiles de negocios en el directorio</strong>: ejecución del contrato con
                  el profesional titular del negocio (art. 6.1.b LQPD).
                </li>
                <li>
                  <strong>Atención de consultas y ejercicio de derechos</strong>: cumplimiento de obligaciones
                  legales y interés legítimo en atender las solicitudes de los interesados (art. 6.1.c y 6.1.f LQPD).
                </li>
                <li>
                  <strong>Seguridad, prevención del fraude y mejora técnica de la plataforma</strong>: interés
                  legítimo en garantizar la integridad y disponibilidad del servicio (art. 6.1.f LQPD).
                </li>
                <li>
                  <strong>Comunicaciones comerciales o newsletters</strong>, cuando proceda: consentimiento del
                  interesado, que podrá retirar en cualquier momento (art. 6.1.a LQPD).
                </li>
              </ol>
              <p>
                El alta como usuario requiere la lectura y aceptación expresa de la presente política. Sin esta
                aceptación no es posible crear una cuenta, conforme al principio de licitud, lealtad y transparencia
                (art. 5 LQPD).
              </p>
            </section>

            <section>
              <h2>5. Destinatarios y encargados del tratamiento</h2>
              <p>
                Sus datos podrán ser comunicados a los siguientes destinatarios, únicamente en la medida necesaria
                para las finalidades indicadas:
              </p>
              <ul>
                <li>
                  <strong>Proveedores de infraestructura y alojamiento</strong> que alojan la plataforma y la base
                  de datos (encargados del tratamiento con contrato de encargo conforme al art. 28 LQPD).
                </li>
                <li>
                  <strong>Supabase Inc.</strong>, proveedor de autenticación y base de datos.
                </li>
                <li>
                  <strong>Stripe, Inc.</strong>, procesador de pagos para la gestión de suscripciones de planes de
                  pago, cuando el usuario contrate un plan de pago.
                </li>
                <li>
                  <strong>Autoridades públicas</strong>, cuando exista una obligación legal de facilitar información.
                </li>
              </ul>
              <p>
                Los datos de perfil público de los negocios (nombre, ubicación, descripción, imágenes, valoraciones
                agregadas, etc.) son accesibles a los visitantes del directorio en la medida en que el profesional
                haya publicado su ficha.
              </p>
            </section>

            <section>
              <h2>6. Transferencias internacionales de datos</h2>
              <p>
                Algunos de nuestros proveedores tecnológicos pueden estar ubicados fuera del Principat
                d&apos;Andorra o del Espacio Económico Europeo. En tales casos, Andorra Viva garantiza que las
                transferencias se realizan con las salvaguardias previstas en la LQPD (arts. 44 a 49), tales como
                decisiones de adecuación, cláusulas contractuales tipo u otras garantías apropiadas adoptadas por
                el encargado o el responsable del tratamiento.
              </p>
              <p>
                Puede solicitar información adicional sobre las garantías aplicables escribiendo a{' '}
                <a href="mailto:privacidad@andorraviva.ad" className="text-primary hover:underline">
                  privacidad@andorraviva.ad
                </a>
                .
              </p>
            </section>

            <section>
              <h2>7. Plazo de conservación</h2>
              <p>Conservamos los datos personales durante el tiempo necesario para cumplir las finalidades descritas:</p>
              <ul>
                <li>
                  <strong>Datos de la cuenta de usuario:</strong> mientras mantenga su cuenta activa y, tras su
                  baja, durante el plazo necesario para atender responsabilidades legales o reclamaciones.
                </li>
                <li>
                  <strong>Datos de facturación y pagos:</strong> durante los plazos exigidos por la normativa
                  fiscal y mercantil aplicable en Andorra.
                </li>
                <li>
                  <strong>Reseñas y valoraciones:</strong> mientras permanezcan publicadas o hasta que el usuario
                  solicite su supresión, sin perjuicio de la conservación bloqueada que exija la ley.
                </li>
                <li>
                  <strong>Datos de navegación y logs de seguridad:</strong> durante el plazo estrictamente necesario
                  para fines de seguridad y auditoría, normalmente no superior a doce meses.
                </li>
              </ul>
              <p>
                Transcurridos dichos plazos, los datos serán suprimidos o anonimizados de forma segura.
              </p>
            </section>

            <section>
              <h2>8. Derechos de las personas interesadas</h2>
              <p>
                Conforme a los arts. 12 a 22 de la LQPD, usted tiene derecho a:
              </p>
              <ul>
                <li>
                  <strong>Acceso:</strong> conocer si tratamos sus datos y obtener información sobre el tratamiento.
                </li>
                <li>
                  <strong>Rectificación:</strong> solicitar la corrección de datos inexactos o incompletos.
                </li>
                <li>
                  <strong>Supresión («derecho al olvido»):</strong> solicitar la eliminación de sus datos cuando
                  concurran las circunstancias previstas en la ley.
                </li>
                <li>
                  <strong>Limitación del tratamiento:</strong> solicitar la restricción del tratamiento en los
                  supuestos legalmente previstos.
                </li>
                <li>
                  <strong>Oposición:</strong> oponerse al tratamiento basado en interés legítimo, por motivos
                  relacionados con su situación particular.
                </li>
                <li>
                  <strong>Portabilidad:</strong> recibir los datos que nos haya facilitado en un formato
                  estructurado y de uso común, y transmitirlos a otro responsable cuando el tratamiento se base
                  en el consentimiento o en un contrato y se efectúe por medios automatizados.
                </li>
                <li>
                  <strong>Retirada del consentimiento:</strong> cuando el tratamiento se base en el consentimiento,
                  puede retirarlo en cualquier momento sin que afecte a la licitud del tratamiento previo.
                </li>
              </ul>
              <p>
                Para ejercer sus derechos, envíe una solicitud escrita a{' '}
                <a href="mailto:privacidad@andorraviva.ad" className="text-primary hover:underline">
                  privacidad@andorraviva.ad
                </a>
                , acreditando su identidad. Responderemos en el plazo máximo establecido por la LQPD y su
                Reglamento de aplicación.
              </p>
              <p>
                Asimismo, tiene <strong>derecho a presentar una reclamación</strong> ante la Agència Andorrana de
                Protecció de Dades (APDA) si considera que el tratamiento de sus datos vulnera la normativa
                vigente.
              </p>
            </section>

            <section>
              <h2>9. Obligatoriedad de facilitar los datos</h2>
              <p>
                Los datos marcados como obligatorios en los formularios de registro son necesarios para crear y
                gestionar su cuenta. La negativa a facilitarlos impedirá la prestación del servicio solicitado.
                Otros datos (por ejemplo, teléfono o sitio web del negocio) pueden ser facultativos según el
                formulario correspondiente.
              </p>
            </section>

            <section>
              <h2>10. Cookies y tecnologías similares</h2>
              <p>
                Utilizamos cookies y almacenamiento local estrictamente necesarios para el funcionamiento de la
                sesión, la autenticación y la seguridad de la plataforma. Estas cookies no requieren consentimiento
                previo por ser imprescindibles para el servicio solicitado.
              </p>
              <p>
                Si en el futuro incorporamos cookies analíticas o de publicidad, se le informará previamente y se
                solicitará su consentimiento cuando sea legalmente exigible.
              </p>
            </section>

            <section>
              <h2>11. Menores de edad</h2>
              <p>
                Los servicios de Andorra Viva no están dirigidos a menores de catorce (14) años. No recopilamos
                deliberadamente datos de menores de esa edad. Si tiene conocimiento de que un menor nos ha
                facilitado datos personales sin el consentimiento del titular de la patria potestad o tutela, rogamos
                contacte con nosotros para proceder a su supresión.
              </p>
            </section>

            <section>
              <h2>12. Seguridad de los datos</h2>
              <p>
                Andorra Viva aplica medidas técnicas y organizativas apropiadas para proteger los datos personales
                frente a la destrucción accidental o ilícita, la pérdida, la alteración, la divulgación o el acceso
                no autorizado (art. 32 LQPD), incluyendo cifrado de contraseñas, control de acceso, políticas de
                seguridad en la infraestructura y revisión periódica de los proveedores.
              </p>
            </section>

            <section>
              <h2>13. Decisiones automatizadas y elaboración de perfiles</h2>
              <p>
                Andorra Viva no adopta decisiones basadas únicamente en el tratamiento automatizado, incluida la
                elaboración de perfiles, que produzcan efectos jurídicos o le afecten significativamente de modo
                similar. Los listados del directorio (por ejemplo, negocios mejor valorados o más visitados) se
                basan en criterios objetivos y transparentes de actividad en la plataforma.
              </p>
            </section>

            <section>
              <h2>14. Modificaciones de la política</h2>
              <p>
                Podemos actualizar la presente política para adaptarla a cambios normativos, técnicos o de los
                servicios ofrecidos. Publicaremos la versión vigente en esta página, indicando la fecha de la
                última actualización. Cuando los cambios sean sustanciales, se lo comunicaremos por medios
                razonables (por ejemplo, aviso en la plataforma o correo electrónico).
              </p>
              <p>
                <strong>Versión actual:</strong> {PRIVACY_POLICY_VERSION}
              </p>
            </section>

            <section>
              <h2>15. Contacto</h2>
              <p>
                Para cualquier consulta relacionada con la protección de sus datos personales, puede contactar con
                nosotros en{' '}
                <a href="mailto:privacidad@andorraviva.ad" className="text-primary hover:underline">
                  privacidad@andorraviva.ad
                </a>
                .
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
