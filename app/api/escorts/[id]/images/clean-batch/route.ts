// app/api/escorts/[escortId]/images/clean-batch/route.ts
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
    // const authResult = await verifyAuth(request);
    // if (!authResult.success) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

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

    const escort = await getEscortById(escortId);
    if (!escort) {
      return NextResponse.json(
        { success: false, error: `Escort with ID ${escortId} not found` },
        { status: 404 }
      );
    }

    const results = [];
    const successfulUrls = [];

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        
        const cleaningResult = await imageCleaner.cleanImage(buffer, {
          model: model as any,
          outputFormat: format as any,
        });

        if (!cleaningResult.success) {
          results.push({
            originalName: file.name,
            success: false,
            error: cleaningResult.error || 'Cleaning failed',
            processingTime: cleaningResult.processingTime,
          });
          continue;
        }

        const uploadResult = await uploadToFirebase(
          escortId,
          cleaningResult.cleanedBuffer,
          {
            metadata: {
              originalName: file.name,
              originalSize: file.size.toString(),
              cleanedBy: 'replicate',
              model: cleaningResult.method,
            },
          }
        );

        successfulUrls.push(uploadResult.url);
        results.push({
          originalName: file.name,
          success: true,
          imageUrl: uploadResult.url,
          processingTime: cleaningResult.processingTime,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
            ? error
            : 'Unknown error';

        results.push({
          originalName: file.name,
          success: false,
          error: errorMessage,
          processingTime: 0,
        });
      }
    }

    if (successfulUrls.length > 0) {
      await updateEscortImages(escortId, successfulUrls, {
        cleanedAt: new Date(),
        processingTime: Date.now() - startTime,
        cleaningMethod: model,
      });
    }

    await logCleaningEvent(escortId, {
      type: successfulUrls.length === files.length ? 'success' : 'partial',
      imageCount: files.length,
      method: model,
      duration: Date.now() - startTime,
      error: successfulUrls.length < files.length ? `${files.length - successfulUrls.length} images failed` : undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        total: files.length,
        successful: successfulUrls.length,
        failed: files.length - successfulUrls.length,
        results,
        summary: {
          totalImages: files.length,
          cleanedCount: successfulUrls.length,
          failedCount: files.length - successfulUrls.length,
        },
      },
    });

  } catch (error) {
    console.error('Batch cleaning error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to process batch' },
      { status: 500 }
    );
  }
}