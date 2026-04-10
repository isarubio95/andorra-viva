import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Visitas y métricas',
    description: (
      <>
        Regla de una visita por visitante y negocio al mes (UTC), clave anónima o{' '}
        <code>auth.uid()</code>, y fusión al iniciar sesión.
      </>
    ),
  },
  {
    title: 'Roles y planes',
    description: (
      <>
        <code>basic</code>, <code>professional</code>, <code>admin</code>; suscripciones y{' '}
        <code>get_my_access</code> para <code>has_pro_access</code>.
      </>
    ),
  },
  {
    title: 'Reseñas',
    description: (
      <>
        Valoración 1–5 y comentario opcional; una reseña por usuario y negocio, editable vía RPC.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
