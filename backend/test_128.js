const crypto = require('crypto');
const { Client } = require('pg');

function decrypt128(b64, keyStr) {
  const data = Buffer.from(b64, 'base64');
  const iv = data.subarray(0, 16);
  const cipherText = data.subarray(16);
  const key = Buffer.from(keyStr);
  const decipher = crypto.createDecipheriv('aes-128-cfb8', key, iv);
  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return decrypted.toString('utf8');
}

const key = 'E3CpyJtksuPudNO8';
const b64_1 = '6R/F5g9ppAL9G0mb/EtMRZ+9Sjq8dQ==';
const b64_2 = '0YRzrdilHC7t1YRqcn9GUa0gGutxlw==';

const pw1 = decrypt128(b64_1, key);
const pw2 = decrypt128(b64_2, key);
console.log('Decrypted 1 (aes-128-cfb8):', pw1);
console.log('Decrypted 2 (aes-128-cfb8):', pw2);

async function test(pw) {
  const c = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: pw, database: 'postgres' });
  try {
    await c.connect();
    console.log('🎉🎉🎉 SUCCESS CONNECTING TO POSTGRES WITH PASSWORD:', pw);
    
    const res = await c.query("SELECT 1 FROM pg_database WHERE datname = 'snote_db'");
    if (res.rowCount === 0) {
      await c.query('CREATE DATABASE snote_db');
      console.log('✅ DATABASE snote_db CREATED!');
    } else {
      console.log('✅ DATABASE snote_db ALREADY EXISTS!');
    }
    
    await c.end();
  } catch (err) {
    console.log('FAIL:', err.message);
  }
}
test(pw1);
test(pw2);
