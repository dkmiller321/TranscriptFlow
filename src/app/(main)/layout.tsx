import { Header } from '@/components/layout/Header';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="main-content-responsive" style={{
        maxWidth: 'var(--max-content-width)',
        margin: '0 auto',
      }}>
        {children}
      </main>
    </>
  );
}
