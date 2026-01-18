import { Header } from '@/components/layout/Header';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main style={{
        maxWidth: 'var(--max-content-width)',
        margin: '0 auto',
        padding: 'var(--spacing-xl)'
      }}>
        {children}
      </main>
    </>
  );
}
