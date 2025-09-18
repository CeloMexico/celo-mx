import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return new Response('Missing email', { status: 400 });
  try {
    await prisma.emailSubscriber.create({ data: { email } });
    return new Response('ok');
  } catch (e) {
    return new Response('error', { status: 500 });
  }
}



