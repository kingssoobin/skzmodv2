export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const presets = await prisma.textPreset.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json(presets);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const preset = await prisma.textPreset.create({
      data: {
        name: String(body?.name ?? 'Sin nombre'),
        line1: String(body?.line1 ?? ''),
        line2: String(body?.line2 ?? ''),
        line3: String(body?.line3 ?? ''),
        numLines: Number(body?.numLines ?? 1),
        font: String(body?.font ?? 'Arial'),
        fontSize: Number(body?.fontSize ?? 24),
      },
    });
    return NextResponse.json(preset, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: 500 });
  }
}
