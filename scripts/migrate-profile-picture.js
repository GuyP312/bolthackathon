import { supabase } from '../src/lib/supabase.js';





async function runMigration() {


  try {


    console.log('Running profile picture migration...');


    


    // Add profile_picture column to members table


    const { error: alterError } = await supabase.rpc('exec_sql', {


      sql: 'ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_picture TEXT;'


    });


    


    if (alterError) {


      console.error('Error adding profile_picture column:', alterError);


    } else {


      console.log('✅ profile_picture column added successfully');


    }


    


    console.log('Migration completed!');


  } catch (error) {


    console.error('Migration failed:', error);


  }


}





runMigration();