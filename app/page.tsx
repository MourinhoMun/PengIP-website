export const revalidate = 60;
import prisma from '@/app/lib/db';
import { Navbar, Hero, Experience, Services, Tools, Footer } from './components';

export default async function Home() {
  const tools = await prisma.tool.findMany({
    where: { status: { in: ['active', 'coming'] }, visible: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      nameEn: true,
      description: true,
      descriptionEn: true,
      points: true,
      icon: true,
      status: true,
    },
  });

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Experience />
        <Services />
        <Tools tools={tools} />
      </main>
      <Footer />
    </>
  );
}
