import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { formKey, json } = await req.json();
  if (!formKey || !json) return new Response('Missing', { status: 400 });
  try {
    await prisma.formSubmission.create({ data: { formKey, json } });
    return new Response('ok');
  } catch (e) {
    return new Response('error', { status: 500 });
  }
}



