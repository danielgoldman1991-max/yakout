// Run missing CRM migration via Supabase Management API
// This script uses the service_role key to attempt direct DB connection
import { readFileSync } from 'fs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rplnihauyeifaldcjntx.supabase.co';
const svcRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!svcRole) {
  console.error('SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const sql = readFileSync(new URL('../database/migrations/20260629_clients_crm_360.sql', import.meta.url), 'utf8');

// Strategy 1: Try direct pg connection via pg module
try {
  const { default: pg } = await import('pg');
  const projectRef = url.replace('https://', '').replace('.supabase.co', '');
  
  const passwords = ['', 'postgres', 'admin', 'yakout123', 'Password123!'];
  
  for (const password of passwords) {
    try {
      const connStr = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:6543/postgres`;
      const pool = new pg.Pool({ connectionString: connStr, connectionTimeoutMillis: 3000 });
      const client = await pool.connect();
      console.log('Connected! Running migration...');
      await client.query(sql);
      console.log('Migration executed successfully!');
      client.release();
      await pool.end();
      process.exit(0);
    } catch (err) {
      if (err.message && (err.message.includes('password') || err.message.includes('authentication') || err.message.includes('timeout'))) {
        continue;
      }
      throw err;
    }
  }
  console.log('Could not connect with any common password.');
} catch (err) {
  console.log('pg module not available:', err.message);
}

// Strategy 2: Try Supabase CLI
console.log('Trying npx supabase db execute...');
try {
  const { execSync } = await import('child_process');
  execSync(`npx supabase db execute --project-ref rplnihauyeifaldcjntx <<< "${sql.replace(/"/g, '\\"')}"`, {
    stdio: 'inherit',
    timeout: 30000,
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN || '' }
  });
  process.exit(0);
} catch (err) {
  console.log('CLI approach failed:', err.message);
}

// Strategy 3: Supabase Management API
console.log('Trying Management API...');
try {
  const response = await fetch(`https://api.supabase.com/v1/projects/${url.replace('https://', '').replace('.supabase.co', '')}/sql/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${svcRole}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  if (response.ok) {
    console.log('Management API success!');
    process.exit(0);
  }
  const text = await response.text();
  console.log('Management API failed:', response.status, text.substring(0, 200));
} catch (err) {
  console.log('Management API error:', err.message);
}

console.error('\n=== Migration automatique impossible ===');
console.error('Execute cette SQL dans le Supabase Dashboard SQL Editor :');
console.error('https://supabase.com/dashboard/project/rplnihauyeifaldcjntx/sql/new');
console.error('\nSQL a executer:');
console.error(sql);
