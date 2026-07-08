// app/api/escorts/[escortId]/images/clean/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { imageCleaner } from '@/lib/services/imageCleaner';
import { uploadToFirebase } from '@/lib/firebase/storage';
import { getEscortById, updateEscortImages, logCleaningEvent } from '@/lib/firebase/firestore';
// import { verifyAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { escortId: string } }
) {
  const startTime = Date.now();
  const { escortId } = params;

  try {
    // Verify authentication
    // const authResult = await verifyAuth(request);
    // if (!authResult.success) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const model = formData.get('model') as string || 'text-removal';
    const format = formData.get('format') as string || 'jpeg';
    const quality = parseInt(formData.get('quality') as string) || 90;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate escort exists
    const escort = await getEscortById(escortId);
    if (!escort) {
      return NextResponse.json(
        { success: false, error: `Escort with ID ${escortId} not found` },
        { status: 404 }
      );
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Clean the image
    const cleaningResult = await imageCleaner.cleanImage(buffer, {
      model: model as any,
      outputFormat: format as any,
      quality,
    });

    if (!cleaningResult.success) {
      throw new Error(cleaningResult.error || 'Cleaning failed');
    }

    // Upload cleaned image to Firebase Storage
    const uploadResult = await uploadToFirebase(
      escortId,
      cleaningResult.cleanedBuffer,
      {
        metadata: {
          originalSize: file.size.toString(),
          cleanedBy: 'replicate',
          model: cleaningResult.method,
          processingTime: cleaningResult.processingTime.toString(),
          originalName: file.name,
        },
      }
    );

    // Update Firestore
    await updateEscortImages(escortId, [uploadResult.url], {
      cleanedAt: new Date(),
      processingTime: cleaningResult.processingTime,
      cleaningMethod: cleaningResult.method,
    });

    // Log success
    await logCleaningEvent(escortId, {
      type: 'success',
      imageCount: 1,
      method: cleaningResult.method,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: uploadResult.url,
        storagePath: uploadResult.path,
        processingTime: cleaningResult.processingTime,
        method: cleaningResult.method,
        originalSize: cleaningResult.originalSize,
        cleanedSize: cleaningResult.cleanedSize,
        metadata: uploadResult.metadata,
      },
    });

  } catch (error) {
    console.error('Image cleaning route error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await logCleaningEvent(escortId, {
      type: 'error',
      imageCount: 1,
      method: 'unknown',
      error: errorMessage,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { success: false, error: errorMessage || 'Failed to process image' },
      { status: 500 }
    );
  }
}