export type LegalPageKey = 'privacy_policy' | 'legal_notice' | 'terms_of_use';

export interface LegalPageDocument {
  title: string;
  lastUpdated: string;
  version: string;
  summary: string;
  bodyHtml: string;
}

export const LEGAL_PAGE_KEYS: LegalPageKey[] = [
  'privacy_policy',
  'legal_notice',
  'terms_of_use',
];

export const LEGAL_PAGE_LABELS: Record<LegalPageKey, string> = {
  privacy_policy: 'Política de protección de datos',
  legal_notice: 'Aviso legal',
  terms_of_use: 'Condiciones de uso',
};

export const LEGAL_PAGE_ROUTES: Record<LegalPageKey, string> = {
  privacy_policy: '/politica-proteccion-datos',
  legal_notice: '/aviso-legal',
  terms_of_use: '/condiciones-de-uso',
};

const COMPANY = 'STANSA APP CORPORATION SL';
const CIF = 'B01781954';
const ADDRESS = 'Río Linares 7, 3º 1ª, 26140 Lardero (La Rioja), España';
const PLATFORM = 'Andorra Viva';
const PRIVACY_EMAIL = 'privacidad@andorraviva.ad';
const LEGAL_EMAIL = 'legal@andorraviva.ad';
const WEBSITE = 'andorraviva.ad';

const PRIVACY_BODY = `
<section>
  <h2>1. Responsable del tratamiento</h2>
  <p>
    El responsable del tratamiento de sus datos personales es <strong>${COMPANY}</strong>
    (CIF ${CIF}), con domicilio en ${ADDRESS}, titular y operador de la plataforma
    <strong>${PLATFORM}</strong>, directorio de negocios y experiencias en el Principado de Andorra.
  </p>
  <ul>
    <li>
      <strong>Correo de contacto en materia de privacidad:</strong>
      <a href="mailto:${PRIVACY_EMAIL}">${PRIVACY_EMAIL}</a>
    </li>
    <li>
      <strong>Sitio web:</strong> ${WEBSITE}
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
      La <strong>Llei 29/2021, del 28 d&apos;octubre, qualificada de protecció de dades personals</strong> (LQPD).
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
    La autoridad de control competente es la <strong>Agència Andorrana de Protecció de Dades (APDA)</strong>.
    Puede consultar información y presentar reclamaciones en
    <a href="https://www.apda.ad" target="_blank" rel="noopener noreferrer">www.apda.ad</a>.
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
    <li>Identificador anónimo en almacenamiento local del navegador para el registro de visitas a fichas de negocio.</li>
    <li>Cookies y tecnologías similares, conforme a la sección 10 de esta política.</li>
  </ul>
</section>

<section>
  <h2>4. Finalidades y bases jurídicas del tratamiento</h2>
  <p>Tratamos sus datos personales para las finalidades y con las bases jurídicas siguientes:</p>
  <ol>
    <li><strong>Gestión del registro y de la cuenta de usuario</strong>: ejecución del contrato o medidas precontractuales (art. 6.1.b LQPD).</li>
    <li><strong>Prestación del directorio, mapa, favoritos y sistema de valoraciones</strong>: ejecución del contrato (art. 6.1.b LQPD).</li>
    <li><strong>Gestión de suscripciones y pagos de planes profesionales</strong>: ejecución del contrato y obligaciones legales fiscales y contables (art. 6.1.b y 6.1.c LQPD).</li>
    <li><strong>Publicación de perfiles de negocios en el directorio</strong>: ejecución del contrato con el profesional titular (art. 6.1.b LQPD).</li>
    <li><strong>Atención de consultas y ejercicio de derechos</strong>: obligaciones legales e interés legítimo (art. 6.1.c y 6.1.f LQPD).</li>
    <li><strong>Seguridad, prevención del fraude y mejora técnica</strong>: interés legítimo (art. 6.1.f LQPD).</li>
    <li><strong>Comunicaciones comerciales o newsletters</strong>, cuando proceda: consentimiento del interesado (art. 6.1.a LQPD).</li>
  </ol>
</section>

<section>
  <h2>5. Destinatarios y encargados del tratamiento</h2>
  <p>Sus datos podrán ser comunicados a los siguientes destinatarios, únicamente en la medida necesaria:</p>
  <ul>
    <li>Proveedores de infraestructura y alojamiento (encargados del tratamiento con contrato conforme al art. 28 LQPD).</li>
    <li><strong>Supabase Inc.</strong>, proveedor de autenticación y base de datos.</li>
    <li><strong>Stripe, Inc.</strong>, procesador de pagos para suscripciones de planes de pago.</li>
    <li><strong>Autoridades públicas</strong>, cuando exista obligación legal de facilitar información.</li>
  </ul>
</section>

<section>
  <h2>6. Transferencias internacionales de datos</h2>
  <p>
    Algunos proveedores tecnológicos pueden estar ubicados fuera del Principat d&apos;Andorra o del Espacio
    Económico Europeo. En tales casos, ${COMPANY} garantiza las salvaguardias previstas en la LQPD
    (arts. 44 a 49). Puede solicitar información adicional escribiendo a
    <a href="mailto:${PRIVACY_EMAIL}">${PRIVACY_EMAIL}</a>.
  </p>
</section>

<section>
  <h2>7. Plazo de conservación</h2>
  <ul>
    <li><strong>Datos de la cuenta:</strong> mientras mantenga su cuenta activa y, tras la baja, el plazo necesario para responsabilidades legales.</li>
    <li><strong>Datos de facturación:</strong> plazos exigidos por la normativa fiscal y mercantil aplicable.</li>
    <li><strong>Reseñas y valoraciones:</strong> mientras permanezcan publicadas o hasta solicitud de supresión.</li>
    <li><strong>Logs de seguridad:</strong> normalmente no superior a doce meses.</li>
  </ul>
</section>

<section>
  <h2>8. Derechos de las personas interesadas</h2>
  <p>Conforme a los arts. 12 a 22 de la LQPD, usted tiene derecho de acceso, rectificación, supresión, limitación, oposición, portabilidad y retirada del consentimiento.</p>
  <p>
    Para ejercer sus derechos, envíe una solicitud escrita a
    <a href="mailto:${PRIVACY_EMAIL}">${PRIVACY_EMAIL}</a>, acreditando su identidad.
    También puede presentar una reclamación ante la APDA.
  </p>
</section>

<section>
  <h2>9. Cookies y tecnologías similares</h2>
  <p>
    Utilizamos cookies y almacenamiento local estrictamente necesarios para la sesión, autenticación y
    seguridad. También empleamos un identificador anónimo en el navegador para métricas de visitas a
    fichas de negocio. Si incorporamos cookies analíticas o de publicidad, se le informará y se solicitará
    consentimiento cuando sea legalmente exigible.
  </p>
</section>

<section>
  <h2>10. Menores de edad</h2>
  <p>
    Los servicios de ${PLATFORM} no están dirigidos a menores de catorce (14) años. Si un menor nos ha
    facilitado datos sin consentimiento del titular de la patria potestad, contacte con nosotros para
    proceder a su supresión.
  </p>
</section>

<section>
  <h2>11. Seguridad de los datos</h2>
  <p>
    ${COMPANY} aplica medidas técnicas y organizativas apropiadas (art. 32 LQPD), incluyendo cifrado de
    contraseñas, control de acceso y revisión periódica de proveedores.
  </p>
</section>

<section>
  <h2>12. Modificaciones de la política</h2>
  <p>
    Podemos actualizar la presente política para adaptarla a cambios normativos, técnicos o de los servicios.
    Publicaremos la versión vigente en esta página. Cuando los cambios sean sustanciales, se lo comunicaremos
    por medios razonables.
  </p>
</section>

<section>
  <h2>13. Contacto</h2>
  <p>
    Para consultas sobre protección de datos: <a href="mailto:${PRIVACY_EMAIL}">${PRIVACY_EMAIL}</a>.
  </p>
</section>
`.trim();

const LEGAL_NOTICE_BODY = `
<section>
  <h2>1. Datos identificativos del titular</h2>
  <p>En cumplimiento del deber de información, se facilitan los siguientes datos del titular del sitio web:</p>
  <ul>
    <li><strong>Denominación social:</strong> ${COMPANY}</li>
    <li><strong>CIF:</strong> ${CIF}</li>
    <li><strong>Domicilio social:</strong> ${ADDRESS}</li>
    <li><strong>Nombre comercial de la plataforma:</strong> ${PLATFORM}</li>
    <li><strong>Correo electrónico:</strong> <a href="mailto:${LEGAL_EMAIL}">${LEGAL_EMAIL}</a></li>
    <li><strong>Sitio web:</strong> ${WEBSITE}</li>
  </ul>
</section>

<section>
  <h2>2. Objeto</h2>
  <p>
    El presente aviso legal regula el acceso y la utilización del sitio web ${WEBSITE} (en adelante, el
    «Sitio Web»), titularidad de ${COMPANY}, a través del cual se ofrece la plataforma ${PLATFORM},
    directorio digital de negocios, experiencias y servicios en el Principado de Andorra.
  </p>
  <p>
    El acceso al Sitio Web atribuye la condición de usuario e implica la aceptación plena de este aviso
    legal, así como de las <a href="/condiciones-de-uso">Condiciones de Uso</a> y la
    <a href="/politica-proteccion-datos">Política de Protección de Datos</a>.
  </p>
</section>

<section>
  <h2>3. Condiciones de acceso y uso</h2>
  <p>
    El usuario se compromete a utilizar el Sitio Web, sus contenidos y servicios de conformidad con la ley,
    la moral, el orden público y el presente aviso legal. Queda prohibido cualquier uso con fines ilícitos,
    lesivos de derechos e intereses de terceros, o que pueda dañar, inutilizar o sobrecargar el Sitio Web.
  </p>
  <p>
    ${COMPANY} se reserva el derecho de denegar o retirar el acceso al Sitio Web, sin necesidad de
    preaviso, a usuarios que incumplan estas condiciones.
  </p>
</section>

<section>
  <h2>4. Propiedad intelectual e industrial</h2>
  <p>
    Todos los contenidos del Sitio Web —incluyendo, a título enunciativo, textos, fotografías, gráficos,
    logotipos, iconos, software, diseño y estructura de navegación— son titularidad de ${COMPANY} o de
    terceros que han autorizado su uso, y están protegidos por la normativa de propiedad intelectual e
    industrial aplicable.
  </p>
  <p>
    Queda prohibida la reproducción, distribución, comunicación pública, transformación o cualquier otra
    explotación no autorizada de los contenidos sin el consentimiento expreso y por escrito de
    ${COMPANY}.
  </p>
</section>

<section>
  <h2>5. Responsabilidad</h2>
  <p>
    ${COMPANY} no garantiza la disponibilidad continua del Sitio Web ni la ausencia de errores en sus
    contenidos, aunque adoptará las medidas razonables para mantener su correcto funcionamiento.
  </p>
  <p>
    Las fichas de negocios, descripciones, precios, horarios, imágenes y demás información publicada por
    profesionales o terceros son responsabilidad exclusiva de quienes las facilitan. ${PLATFORM} actúa como
    plataforma de intermediación y directorio, sin asumir responsabilidad por la exactitud, vigencia o
    legalidad de dicha información, salvo en los supuestos legalmente exigibles.
  </p>
</section>

<section>
  <h2>6. Enlaces externos</h2>
  <p>
    El Sitio Web puede contener enlaces a sitios de terceros. ${COMPANY} no se responsabiliza del
    contenido, políticas o prácticas de dichos sitios externos. El acceso a enlaces externos es bajo la
    exclusiva responsabilidad del usuario.
  </p>
</section>

<section>
  <h2>7. Protección de datos</h2>
  <p>
    El tratamiento de datos personales se rige por la
    <a href="/politica-proteccion-datos">Política de Protección de Datos</a> de ${PLATFORM}.
  </p>
</section>

<section>
  <h2>8. Modificaciones</h2>
  <p>
    ${COMPANY} se reserva el derecho de modificar el presente aviso legal para adaptarlo a novedades
    legislativas, jurisprudenciales o de los servicios ofrecidos. Las modificaciones serán publicadas en
    esta página con indicación de la fecha de actualización.
  </p>
</section>

<section>
  <h2>9. Legislación aplicable y jurisdicción</h2>
  <p>
    El presente aviso legal se rige por la legislación española, sin perjuicio de las normas imperativas
    aplicables en el Principado de Andorra en lo relativo a los usuarios y servicios allí prestados.
  </p>
  <p>
    Para la resolución de controversias, las partes se someten a los juzgados y tribunales del domicilio
    del consumidor cuando la normativa de protección de consumidores así lo establezca; en caso contrario,
    a los juzgados y tribunales de Logroño (La Rioja), salvo norma imperativa en contrario.
  </p>
</section>

<section>
  <h2>10. Contacto</h2>
  <p>
    Para cualquier consulta relacionada con este aviso legal: <a href="mailto:${LEGAL_EMAIL}">${LEGAL_EMAIL}</a>.
  </p>
</section>
`.trim();

const TERMS_BODY = `
<section>
  <h2>1. Identificación y aceptación</h2>
  <p>
    Las presentes Condiciones de Uso regulan el acceso y utilización de la plataforma ${PLATFORM},
    titularidad de ${COMPANY} (CIF ${CIF}), con domicilio en ${ADDRESS}.
  </p>
  <p>
    Al registrarse, publicar un negocio, contratar un plan o utilizar los servicios de la plataforma, el
    usuario declara haber leído y aceptado estas Condiciones de Uso, el
    <a href="/aviso-legal">Aviso Legal</a> y la
    <a href="/politica-proteccion-datos">Política de Protección de Datos</a>.
  </p>
</section>

<section>
  <h2>2. Descripción del servicio</h2>
  <p>
    ${PLATFORM} es un directorio digital que permite a los usuarios descubrir negocios y experiencias en
    Andorra, consultar fichas, mapas, valoraciones y reseñas, y guardar favoritos. Los profesionales
    pueden registrar y gestionar la ficha de su negocio, publicar noticias (según plan) y contratar planes
    de suscripción con funcionalidades ampliadas.
  </p>
</section>

<section>
  <h2>3. Registro y cuentas de usuario</h2>
  <ul>
    <li>El usuario debe facilitar información veraz y mantenerla actualizada.</li>
    <li>Es responsable de la confidencialidad de sus credenciales de acceso.</li>
    <li>Debe notificar sin demora cualquier uso no autorizado de su cuenta.</li>
    <li>El registro requiere la aceptación expresa de la Política de Protección de Datos.</li>
    <li>${COMPANY} puede suspender o cancelar cuentas que incumplan estas condiciones.</li>
  </ul>
</section>

<section>
  <h2>4. Usuarios y profesionales</h2>
  <p><strong>Usuarios:</strong> pueden consultar el directorio, valorar negocios, publicar reseñas conforme a las normas de la plataforma y gestionar favoritos.</p>
  <p><strong>Profesionales:</strong> pueden registrar un negocio (salvo restricciones indicadas en la plataforma), editar su ficha, contratar planes de pago y acceder a herramientas de gestión según su suscripción.</p>
</section>

<section>
  <h2>5. Publicación de negocios</h2>
  <p>El profesional titular garantiza que:</p>
  <ul>
    <li>Dispone de legitimación para publicar la información del negocio.</li>
    <li>Los datos, imágenes y descripciones son exactos, actuales y no vulneran derechos de terceros.</li>
    <li>Cumple la normativa aplicable a su actividad en el Principado de Andorra.</li>
  </ul>
  <p>
    ${COMPANY} puede revisar, moderar, ocultar o eliminar fichas que incumplan estas condiciones o resulten
    inadecuadas, sin perjuicio de otras acciones que procedan.
  </p>
</section>

<section>
  <h2>6. Reseñas y contenido de usuarios</h2>
  <p>
    Las valoraciones y reseñas deben basarse en experiencias reales, ser respetuosas y no incluir contenido
    difamatorio, ofensivo, discriminatorio, publicitario encubierto ni datos personales de terceros.
  </p>
  <p>
    ${COMPANY} se reserva el derecho de moderar o eliminar contenido que vulnere estas reglas. Los titulares
    de negocios no deben publicar reseñas sobre su propio establecimiento ni manipular valoraciones.
  </p>
</section>

<section>
  <h2>7. Planes de suscripción y pagos</h2>
  <ul>
    <li>Los planes de pago, precios y funcionalidades se describen en la página de planes vigente en la plataforma.</li>
    <li>Los pagos se procesan a través de <strong>Stripe, Inc.</strong>; ${COMPANY} no almacena datos completos de tarjetas.</li>
    <li>La contratación implica la aceptación del precio y condiciones del plan seleccionado.</li>
    <li>El usuario puede gestionar o cancelar su suscripción según las opciones disponibles en su cuenta y la política de Stripe.</li>
    <li>${COMPANY} puede modificar precios o características de los planes, informando con antelación razonable cuando afecte a suscripciones activas.</li>
  </ul>
</section>

<section>
  <h2>8. Propiedad intelectual</h2>
  <p>
    El profesional conserva los derechos sobre el contenido que aporte (textos, logotipos, fotografías), pero
    concede a ${COMPANY} una licencia no exclusiva, gratuita y con alcance mundial para alojar, reproducir,
    comunicar públicamente y mostrar dicho contenido en ${PLATFORM} mientras la ficha permanezca publicada.
  </p>
</section>

<section>
  <h2>9. Uso prohibido</h2>
  <p>Queda prohibido, entre otros:</p>
  <ul>
    <li>Utilizar la plataforma con fines ilícitos o fraudulentos.</li>
    <li>Suplantar identidades o falsear datos.</li>
    <li>Introducir virus, malware o realizar ataques contra la infraestructura.</li>
    <li>Extraer datos de forma masiva (scraping) sin autorización.</li>
    <li>Utilizar la plataforma para spam o publicidad no consentida.</li>
  </ul>
</section>

<section>
  <h2>10. Suspensión y cancelación</h2>
  <p>
    ${COMPANY} puede suspender o cancelar el acceso de un usuario o profesional ante incumplimientos graves
    o reiterados de estas condiciones. El usuario puede solicitar la baja de su cuenta conforme a la
    Política de Protección de Datos.
  </p>
</section>

<section>
  <h2>11. Limitación de responsabilidad</h2>
  <p>
    ${PLATFORM} se ofrece «tal cual», dentro de los límites legalmente permitidos. ${COMPANY} no será
    responsable de daños indirectos, lucro cesante o pérdida de datos derivados del uso de la plataforma,
    salvo dolo o negligencia grave, ni de la conducta o información de terceros usuarios o negocios listados.
  </p>
</section>

<section>
  <h2>12. Protección de datos</h2>
  <p>
    El tratamiento de datos personales se describe en la
    <a href="/politica-proteccion-datos">Política de Protección de Datos</a>.
  </p>
</section>

<section>
  <h2>13. Modificaciones</h2>
  <p>
    ${COMPANY} puede actualizar estas Condiciones de Uso. La versión vigente se publicará en esta página.
    El uso continuado de la plataforma tras cambios sustanciales podrá requerir nueva aceptación.
  </p>
</section>

<section>
  <h2>14. Legislación y resolución de conflictos</h2>
  <p>
    Estas condiciones se rigen por la legislación española, con aplicación supletoria de la normativa
    imperativa de protección de consumidores y, en materia de datos personales de usuarios en Andorra, por
    la LQPD.
  </p>
  <p>
    Salvo norma imperativa en contrario, las partes se someten a los juzgados y tribunales de Logroño
    (La Rioja).
  </p>
</section>

<section>
  <h2>15. Contacto</h2>
  <p>
    Consultas sobre estas condiciones: <a href="mailto:${LEGAL_EMAIL}">${LEGAL_EMAIL}</a>.
  </p>
</section>
`.trim();

export const DEFAULT_LEGAL_PAGES: Record<LegalPageKey, LegalPageDocument> = {
  privacy_policy: {
    title: 'Política de Protección de Datos Personales',
    lastUpdated: '8 de julio de 2026',
    version: '2026-07-08',
    summary: `La presente política informa sobre el tratamiento de datos personales realizado por <strong>${COMPANY}</strong>, titular de la plataforma <strong>${PLATFORM}</strong>, en el marco de la <em>Llei qualificada 29/2021, del 28 d&apos;octubre, de protecció de dades personals</em> (LQPD) y su Reglamento de aplicación (Decret 391/2022, del 28 de setembre).`,
    bodyHtml: PRIVACY_BODY,
  },
  legal_notice: {
    title: 'Aviso Legal',
    lastUpdated: '8 de julio de 2026',
    version: '2026-07-08',
    summary: `Información legal del sitio web <strong>${WEBSITE}</strong>, operado por <strong>${COMPANY}</strong> (CIF ${CIF}) bajo la marca <strong>${PLATFORM}</strong>.`,
    bodyHtml: LEGAL_NOTICE_BODY,
  },
  terms_of_use: {
    title: 'Condiciones de Uso',
    lastUpdated: '8 de julio de 2026',
    version: '2026-07-08',
    summary: `Condiciones que regulan el acceso y uso de la plataforma <strong>${PLATFORM}</strong>, prestada por <strong>${COMPANY}</strong>.`,
    bodyHtml: TERMS_BODY,
  },
};

export function mergeLegalPages(
  remote: Partial<Record<LegalPageKey, Partial<LegalPageDocument>>> | undefined,
): Record<LegalPageKey, LegalPageDocument> {
  const merged = {} as Record<LegalPageKey, LegalPageDocument>;
  for (const key of LEGAL_PAGE_KEYS) {
    const defaults = DEFAULT_LEGAL_PAGES[key];
    const overrides = remote?.[key];
    merged[key] = {
      title: overrides?.title?.trim() || defaults.title,
      lastUpdated: overrides?.lastUpdated?.trim() || defaults.lastUpdated,
      version: overrides?.version?.trim() || defaults.version,
      summary: overrides?.summary?.trim() || defaults.summary,
      bodyHtml: overrides?.bodyHtml?.trim() || defaults.bodyHtml,
    };
  }
  return merged;
}
