import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupStorage() {


  try {


    console.log('Setting up profile pictures storage...');


    


    // First, let's check if the bucket already exists


    const { data: buckets, error: listError } = await supabase.storage.listBuckets();


    


    if (listError) {


      console.error('Error listing buckets:', listError);


      return;


    }


    


    console.log('Existing buckets:', buckets.map(b => b.name));


    


    // Check if profile-pictures bucket exists


    const bucketExists = buckets.some(bucket => bucket.name === 'profile-pictures');


    


    if (!bucketExists) {


      // Create the bucket


      const { data: createData, error: createError } = await supabase.storage.createBucket('profile-pictures', {


        public: true,


        fileSizeLimit: 5242880, // 5MB


        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']


      });


      


      if (createError) {


        console.error('Error creating bucket:', createError);


        return;


      }


      


      console.log('✅ Profile pictures bucket created successfully:', createData);


    } else {


      console.log('✅ Profile pictures bucket already exists');


    }


    


    console.log('Storage setup completed!');


    


  } catch (error) {


    console.error('Storage setup failed:', error);


  }


}





setupStorage();