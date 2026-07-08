// app/api/fix-image-tokens/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { bucket } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// POST handler - Fix tokens
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { escortId, dryRun = false } = body;

    console.log('🔍 Starting token fix...');
    console.log(`📋 Escort ID: ${escortId || 'All'}`);
    console.log(`🧪 Dry run: ${dryRun}`);

    const prefix = escortId ? `cleaned_images/${escortId}/` : 'cleaned_images/';
    const [files] = await bucket.getFiles({ prefix });
    
    console.log(`📁 Found ${files.length} files`);

    const results = {
      total: files.length,
      fixed: 0,
      alreadyHaveToken: 0,
      errors: 0,
      details: [] as any[]
    };

    for (const file of files) {
      try {
        const [metadata] = await file.getMetadata();
        const hasToken = metadata.metadata?.firebaseStorageDownloadTokens;
        
        if (!hasToken) {
          const downloadToken = uuidv4();
          
          if (!dryRun) {
            await file.setMetadata({
              metadata: {
                ...metadata.metadata,
                firebaseStorageDownloadTokens: downloadToken,
                tokenFixedAt: new Date().toISOString(),
                tokenFixedBy: 'api-endpoint'
              }
            });
            
            results.fixed++;
            results.details.push({
              file: file.name,
              status: 'fixed',
              token: downloadToken.substring(0, 8) + '...',
              size: metadata.size,
              contentType: metadata.contentType,
              updated: metadata.updated
            });
          } else {
            results.details.push({
              file: file.name,
              status: 'would-fix',
              message: 'Dry run - token would be added',
              size: metadata.size,
              contentType: metadata.contentType
            });
          }
        } else {
          results.alreadyHaveToken++;
          results.details.push({
            file: file.name,
            status: 'already-has-token',
            token: String(metadata.metadata?.firebaseStorageDownloadTokens || '').substring(0, 8) + '...',
            size: metadata.size,
            contentType: metadata.contentType,
            updated: metadata.updated
          });
        }
      } catch (error: any) {
        results.errors++;
        results.details.push({
          file: file.name,
          status: 'error',
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun ? 'Dry run completed' : 'Token fix completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error in fix-tokens API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fix tokens' 
      },
      { status: 500 }
    );
  }
}

// GET handler - Check status with detailed info
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const escortId = searchParams.get('escortId');
    const detailed = searchParams.get('detailed') === 'true';
    
    const prefix = escortId ? `cleaned_images/${escortId}/` : 'cleaned_images/';
    
    // Get all files
    const [files] = await bucket.getFiles({ prefix });
    
    let withToken = 0;
    let withoutToken = 0;
    let totalSize = 0;
    const filesWithDetails = [];
    const filesWithoutToken = [];
    
    for (const file of files) {
      try {
        const [metadata] = await file.getMetadata();
        const hasToken = metadata.metadata?.firebaseStorageDownloadTokens;
        const fileSize = parseInt(String(metadata.size || '0'));
        totalSize += fileSize;
        
        const fileInfo = {
          name: file.name,
          size: fileSize,
          sizeFormatted: formatFileSize(fileSize),
          contentType: metadata.contentType || 'unknown',
          created: metadata.timeCreated,
          updated: metadata.updated,
          hasToken: !!hasToken,
          token: hasToken ? String(hasToken).substring(0, 8) + '...' : null,
          // Generate download URL if token exists
          downloadUrl: hasToken ? 
            `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${hasToken}` :
            null
        };
        
        if (hasToken) {
          withToken++;
          filesWithDetails.push(fileInfo);
        } else {
          withoutToken++;
          filesWithoutToken.push(fileInfo);
        }
      } catch (error: any) {
        withoutToken++;
        filesWithoutToken.push({
          name: file.name,
          error: error.message,
          hasToken: false
        });
      }
    }
    
    // Build response based on detail level
    const response: any = {
      success: true,
      summary: {
        total: files.length,
        withToken,
        withoutToken,
        totalSize: formatFileSize(totalSize),
        message: withoutToken > 0 
          ? `⚠️ ${withoutToken} files need token fixes` 
          : '✅ All files have tokens'
      },
      timestamp: new Date().toISOString()
    };
    
    if (detailed) {
      response.files = {
        withToken: filesWithDetails,
        withoutToken: filesWithoutToken
      };
    } else {
      response.filesWithoutToken = filesWithoutToken.map(f => f.name).slice(0, 50);
      if (filesWithoutToken.length > 50) {
        response.filesWithoutToken.push(`... and ${filesWithoutToken.length - 50} more`);
      }
    }
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Error in GET handler:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to check status' 
      },
      { status: 500 }
    );
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}