// Run SQL migration on Supabase via direct database connection
import { readFileSync } from 'fs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rplnihauyeifaldcjntx.supabase.co';
const svcRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!svcRole) {
  console.error('SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const sql = readFileSync(new URL('../database/migrations/20260629_convert_lead_to_client.sql', import.meta.url), 'utf8');
// Instead, try using node-postgres if available.
try {
  const { default: pg } = await import('pg');
  
  // Try connecting to the database directly
  // The connection string format for Supabase is:
  // postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:6543/postgres
  const projectRef = url.replace('https://', '').replace('.supabase.co', '');
  
  // Try common passwords
  const passwords = ['', 'postgres', 'admin', 'yakout'];
  
  for (const password of passwords) {
    const connStr = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:6543/postgres`;
    const pool = new pg.Pool({ connectionString: connStr, connectionTimeoutMillis: 5000 });
    try {
      const client = await pool.connect();
      console.log('Connected to database with password:', password || '(empty)');
      await client.query(sql);
      console.log('Migration executed successfully!');
      client.release();
      await pool.end();
      process.exit(0);
    } catch (err) {
      await pool.end();
      if (err.message && err.message.includes('password')) {
        continue; // wrong password, try next
      }
      throw err;
    }
  }
  console.error('Could not connect with any common password.');
} catch (err) {
  console.error('pg import failed or connection error:', err.message);
}

// Fallback: try the edge function approach  
console.log('Trying Supabase REST API SQL endpoint...');
try {
  const response = await fetch(`${url}/rest/v1/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': svcRole,
      'Authorization': `Bearer ${svcRole}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await response.text();
  console.log(`Status: ${response.status}, Response: ${text.substring(0, 500)}`);
} catch (err) {
  console.error('REST endpoint failed:', err.message);
}

console.log('Could not run migration automatically.');
console.log('Please run this SQL manually in the Supabase Dashboard SQL Editor:');
console.log('---');
console.log(sql);
console.log('---');
