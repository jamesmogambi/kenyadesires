// scripts/fix-missing-tokens.ts
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin (reuse your existing config)
const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
          ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(
              /\\n/g,
              "\n",
            ).replace(/^"|"$/g, "")
          : undefined,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  : getApps()[0];

const adminStorage = getStorage(app);
const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET!);

async function fixMissingTokens() {
  console.log('🔍 Starting token fix for cleaned_images...');
  console.log(`📦 Bucket: ${bucket.name}`);
  
  try {
    // List all files in cleaned_images folder
    const [files] = await bucket.getFiles({
      prefix: 'cleaned_images/'
    });

    console.log(`📁 Found ${files.length} files in cleaned_images folder`);

    let fixedCount = 0;
    let alreadyHasTokenCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        // Get current metadata
        const [metadata] = await file.getMetadata();
        
        // Check if download token exists
        const hasToken = metadata.metadata?.firebaseStorageDownloadTokens;
        
        if (!hasToken) {
          console.log(`🔄 Adding token to: ${file.name}`);
          
          // Generate new token
          const downloadToken = uuidv4();
          
          // Update metadata with token
          await file.setMetadata({
            metadata: {
              ...metadata.metadata,
              firebaseStorageDownloadTokens: downloadToken,
              // Add additional metadata for tracking
              tokenAdded: new Date().toISOString(),
              tokenFixed: 'true'
            }
          });
          
          console.log(`✅ Token added to: ${file.name} (token: ${downloadToken.substring(0, 8)}...)`);
          fixedCount++;
        } else {
          console.log(`✅ Token already exists for: ${file.name}`);
          alreadyHasTokenCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Fixed: ${fixedCount} files`);
    console.log(`✅ Already had token: ${alreadyHasTokenCount} files`);
    console.log(`❌ Errors: ${errorCount} files`);
    console.log(`📁 Total: ${files.length} files`);

  } catch (error) {
    console.error('❌ Error listing files:', error);
  }
}

// Run the script
fixMissingTokens();