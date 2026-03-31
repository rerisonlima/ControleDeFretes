import bcrypt from 'bcryptjs';

async function testBcrypt() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Testing bcrypt compare...');
  const start = Date.now();
  const result = await bcrypt.compare(password, hash);
  const end = Date.now();
  
  console.log(`Bcrypt compare took ${end - start}ms`);
  console.log('Result:', result);
}

testBcrypt();
