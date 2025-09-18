import HeroStrip from '@/components/HeroStrip';
import Section from '@/components/Section';
import FeatureCard from '@/components/FeatureCard';
import PillRow from '@/components/PillRow';
import FrontierInnovation from '@/components/FrontierInnovation';

// Force dynamic rendering to avoid Privy issues during build
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="space-y-16 sm:space-y-20 lg:space-y-24 pb-16 sm:pb-20 lg:pb-24">
      <HeroStrip />
      <Section title="Lo que hacemos" subtitle="Programas para builders y comunidad en México">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard title="Pagos & MiniApps" description="Construye experiencias móviles y pagos estables." icon="pm" />
          <FeatureCard title="Programas de Desarrollo" description="Cohorts, mentores y becas para acelerar tu dApp." icon="ok" />
          <FeatureCard title="Comunidad & Grants" description="Eventos, grants y apoyo para comunidades en LATAM." icon="knpo" />
          <FeatureCard title="Herramientas Open Source" description="Plantillas, SDKs y repos abiertos para builders." icon="ipkm" />
        </div>
      </Section>
      <Section title="Ecosistema" subtitle="Aliados y proyectos que hacen esto posible">
        <PillRow />
      </Section>
      <Section title="Innovación de Celo como Frontier Chain">
        <FrontierInnovation />
      </Section>
    </div>
  );
}
