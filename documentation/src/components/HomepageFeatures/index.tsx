import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

/** Mismas claves que `CATEGORY_GROUP_MAP` en la app (`src/constants/categoryGroups.ts`) */
const FeatureList: FeatureItem[] = [
  {
    title: 'Gastronomía',
    description: <>Restaurantes y experiencias culinarias en el país.</>,
  },
  {
    title: 'Wellness',
    description: <>Spas, bienestar y cuidado personal.</>,
  },
  {
    title: 'Noche',
    description: <>Bares y discotecas para salir de fiesta.</>,
  },
  {
    title: 'Shopping',
    description: <>Tiendas y compras en Andorra.</>,
  },
  {
    title: 'Montaña',
    description: <>Hoteles y actividades al aire libre.</>,
  },
  {
    title: 'Cultura',
    description: <>Museos y propuestas culturales.</>,
  },
];

function directorioHref(grupo: string): string {
  return `/directorio?grupo=${encodeURIComponent(grupo)}`;
}

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <a href={directorioHref(title)} className={styles.cardLink}>
        <div className="text--center padding-horiz--md">
          <Heading as="h3" className={styles.cardTitle}>
            {title}
          </Heading>
          <p className={styles.cardDescription}>{description}</p>
        </div>
      </a>
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
