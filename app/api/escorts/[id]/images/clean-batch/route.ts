// app/api/escorts/[escortId]/images/clean-batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { imageCleaner } from '@/lib/services/imageCleaner';

export async function POST(
  request: NextRequest,
  { params }: { params: { escortId: string } }
) {
  const startTime = Date.now();
  const { escortId } = params;

  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const model = formData.get('model') as string || 'text-removal';
    const format = formData.get('format') as string || 'jpeg';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images provided' },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Maximum 10 images per batch' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Firebase storage not available. This feature requires Firebase configuration." },
      { status: 503 }
    );

  } catch (error) {
    console.error('Batch cleaning error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to process batch' },
      { status: 500 }
    );
  }
}