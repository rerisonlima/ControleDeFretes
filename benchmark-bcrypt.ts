import bcrypt from 'bcryptjs';

async function benchmark() {
  const password = '1Tijolo!';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash created');
  
  const start = Date.now();
  for (let i = 0; i < 5; i++) {
    const s = Date.now();
    await bcrypt.compare(password, hash);
    console.log(`Compare ${i} took ${Date.now() - s}ms`);
  }
  console.log(`Average: ${(Date.now() - start) / 5}ms`);
}

benchmark();
