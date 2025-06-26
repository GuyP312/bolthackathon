import { supabase } from '../src/lib/supabase.js';





async function checkStorageSetup() {


  try {


    console.log('🔍 Checking Supabase Storage setup...');


    


    // List all buckets


    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();


    


    if (bucketsError) {


      console.error('❌ Error listing buckets:', bucketsError);


      return;


    }


    


    console.log('📂 Available buckets:', buckets?.map(b => b.name));


    


    // Check if profile-pictures bucket exists


    const profileBucket = buckets?.find(bucket => bucket.name === 'profile-pictures');


    


    if (!profileBucket) {


      console.log('⚠️  profile-pictures bucket not found');


      console.log('🔧 Attempting to create bucket...');


      


      const { error: createError } = await supabase.storage.createBucket('profile-pictures', {


        public: true,


        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],


        fileSizeLimit: 5242880 // 5MB


      });


      


      if (createError) {


        console.error('❌ Failed to create bucket:', createError);


        console.log('📋 Manual steps required:');


        console.log('1. Go to your Supabase dashboard');


        console.log('2. Navigate to Storage');


        console.log('3. Create a new bucket named "profile-pictures"');


        console.log('4. Set it as public');


      } else {


        console.log('✅ Bucket created successfully!');


      }


    } else {


      console.log('✅ profile-pictures bucket exists');


      console.log('📊 Bucket info:', {


        id: profileBucket.id,


        name: profileBucket.name,


        public: profileBucket.public


      });


    }


    


    // Test upload permissions


    console.log('🧪 Testing upload permissions...');


    const testBlob = new Blob(['test'], { type: 'text/plain' });


    


    const { error: uploadError } = await supabase.storage


      .from('profile-pictures')


      .upload(`test/test-${Date.now()}.txt`, testBlob, { upsert: true });


    


    if (uploadError) {


      console.error('❌ Upload test failed:', uploadError);


      


      if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('Unauthorized')) {


        console.log('🔒 RLS (Row Level Security) is blocking uploads');


        console.log('📋 Quick fix - Run this SQL in Supabase SQL Editor:');


        console.log('   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');


        console.log('');


        console.log('🔄 Or create proper policies:');


        console.log('   CREATE POLICY "Anyone can upload profile pictures"');


        console.log('   ON storage.objects FOR INSERT');


        console.log('   WITH CHECK (bucket_id = \'profile-pictures\');');


      }


    } else {


      console.log('✅ Upload test successful');


      


      // Clean up test file


      await supabase.storage


        .from('profile-pictures')


        .remove([`test/test-${Date.now()}.txt`]);


      console.log('🧹 Test file cleaned up');


    }


    


  } catch (error) {


    console.error('💥 Error during storage check:', error);


  }


}





// Add database column check


async function checkDatabaseSetup() {


  try {


    console.log('🔍 Checking database setup...');


    


    // Check if profile_picture column exists


    const { data, error } = await supabase


      .from('members')


      .select('profile_picture')


      .limit(1);


    


    if (error) {


      if (error.message.includes('column "profile_picture" does not exist')) {


        console.log('⚠️  profile_picture column not found in members table');


        console.log('📋 Run this SQL in your Supabase SQL Editor:');


        console.log('ALTER TABLE members ADD COLUMN profile_picture TEXT;');


      } else {


        console.error('❌ Database error:', error);


      }


    } else {


      console.log('✅ profile_picture column exists');


    }


    


  } catch (error) {


    console.error('💥 Error during database check:', error);


  }


}





async function runDiagnostics() {


  console.log('🚀 Starting Profile Picture Setup Diagnostics\n');


  


  await checkDatabaseSetup();


  console.log('');


  await checkStorageSetup();


  


  console.log('\n✨ Diagnostics complete!');


}





runDiagnostics();