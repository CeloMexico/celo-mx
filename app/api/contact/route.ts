import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { name, email, message } = await req.json();
  if (!name || !email || !message) return new Response('Missing', { status: 400 });
  try {
    await prisma.contactMessage.create({ data: { name, email, message } });
    return new Response('ok');
  } catch (e) {
    return new Response('error', { status: 500 });
  }
}



