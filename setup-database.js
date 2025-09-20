/**
 * Database Setup Script
 * Run this to set up your database with the new schema
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function setupDatabase() {
  console.log('🚀 Setting up database with comprehensive balance sheet schema...\n');

  try {
    // Step 1: Generate Prisma client first (to avoid type errors)
    console.log('📝 Step 1: Generating Prisma client...');
    await execPromise('npx prisma generate');
    console.log('✅ Prisma client generated successfully\n');

    // Step 2: Apply the migration
    console.log('📝 Step 2: Applying database migration...');
    await execPromise('npx prisma migrate dev --name "comprehensive-balance-sheet-schema"');
    console.log('✅ Database migration applied successfully\n');

    // Step 3: Reset database (optional, if you want a clean start)
    console.log('📝 Step 3: Resetting database (clean start)...');
    await execPromise('npx prisma migrate reset --force');
    console.log('✅ Database reset successfully\n');

    // Step 4: Apply migration again after reset
    console.log('📝 Step 4: Re-applying migration after reset...');
    await execPromise('npx prisma migrate dev --name "comprehensive-balance-sheet-schema-final"');
    console.log('✅ Final migration applied successfully\n');

    console.log('🎉 Database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: node test-ingestion.js (to load your data)');
    console.log('2. Start your dev server: npm run dev');
    console.log('3. Visit /screener to test the stock screener');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Manual steps to fix:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Run: npx prisma migrate dev');
    console.log('3. Run: npx prisma db push (if migrate fails)');
  }
}

setupDatabase().catch(console.error);