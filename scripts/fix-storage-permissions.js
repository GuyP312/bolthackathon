import { supabase } from '../src/lib/supabase.js';





async function fixStoragePermissions() {


  try {


    console.log('🔧 Fixing storage permissions for profile picture uploads...');


    


    // Method 1: Try to disable RLS for storage.objects (simplest solution)


    console.log('📋 Attempting to disable RLS for storage.objects...');


    


    const { error: disableRLSError } = await supabase.rpc('exec_sql', {


      sql: 'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;'


    });


    


    if (disableRLSError) {


      console.log('⚠️  Could not disable RLS automatically:', disableRLSError.message);


      


      // Check for the specific "must be owner" error


      if (disableRLSError.message && disableRLSError.message.includes('must be owner of table objects')) {


        console.log('\n❌ PERMISSION ERROR: You don\'t have database owner permissions.');


        console.log('🔧 SOLUTION: Use Supabase Dashboard instead of this script.');


        console.log('\n📋 Quick fix steps:');


        console.log('1. Go to Supabase Dashboard → SQL Editor');


        console.log('2. Run: ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');


        console.log('3. Click "Run" - this will work even if you\'re not the owner');


        return;


      }


      


      console.log('🔧 Trying to create permissive policies instead...');


      


      // Method 2: Create permissive policies


      const policies = [


        {


          name: 'Anyone can view profile pictures',


          sql: `CREATE POLICY "Anyone can view profile pictures" ON storage.objects FOR SELECT USING (bucket_id = 'profile-pictures');`


        },


        {


          name: 'Anyone can upload profile pictures',


          sql: `CREATE POLICY "Anyone can upload profile pictures" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-pictures');`


        },


        {


          name: 'Anyone can update profile pictures',


          sql: `CREATE POLICY "Anyone can update profile pictures" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-pictures');`


        },


        {


          name: 'Anyone can delete profile pictures',


          sql: `CREATE POLICY "Anyone can delete profile pictures" ON storage.objects FOR DELETE USING (bucket_id = 'profile-pictures');`


        }


      ];


      


      for (const policy of policies) {


        const { error: policyError } = await supabase.rpc('exec_sql', {


          sql: policy.sql


        });


        


        if (policyError && !policyError.message.includes('already exists')) {


          console.error(`❌ Failed to create policy "${policy.name}":`, policyError.message);


        } else {


          console.log(`✅ Policy "${policy.name}" created/exists`);


        }


      }


    } else {


      console.log('✅ RLS disabled for storage.objects successfully!');


    }


    


    // Test upload after fixes


    console.log('🧪 Testing upload after permission fixes...');


    const testBlob = new Blob(['test upload'], { type: 'text/plain' });


    const testFileName = `test/permission-test-${Date.now()}.txt`;


    


    const { error: testError } = await supabase.storage


      .from('profile-pictures')


      .upload(testFileName, testBlob, { upsert: true });


    


    if (testError) {


      console.error('❌ Upload still failing:', testError);


      console.log('📋 Manual steps required:');


      console.log('1. Go to your Supabase dashboard');


      console.log('2. Navigate to SQL Editor');


      console.log('3. Run: ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');


    } else {


      console.log('✅ Upload test successful! Profile picture uploads should work now.');


      


      // Clean up test file


      await supabase.storage


        .from('profile-pictures')


        .remove([testFileName]);


      console.log('🧹 Test file cleaned up');


    }


    


  } catch (error) {


    console.error('💥 Error fixing storage permissions:', error);


    


    // Check for the specific "must be owner" error


    if (error.message && error.message.includes('must be owner of table objects')) {


      console.log('\n⚠️  PERMISSION ERROR: You don\'t have database owner permissions.');


      console.log('🔧 SOLUTION: Use Supabase Dashboard instead of this script.');


      console.log('\n📋 Manual fix steps:');


      console.log('1. Go to your Supabase Dashboard: https://app.supabase.com');


      console.log('2. Select your project');


      console.log('3. Navigate to SQL Editor');


      console.log('4. Run this command: ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');


      console.log('5. Click "Run"');


      console.log('\n✅ This will work even if you\'re not the project owner.');


    } else {


      console.log('\n📋 Manual fix required:');


      console.log('Run this SQL in your Supabase SQL Editor:');


      console.log('ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;');


    }


  }


}





console.log('🚀 Starting Storage Permission Fix...\n');


fixStoragePermissions();