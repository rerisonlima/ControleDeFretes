import bcrypt from 'bcryptjs';
const hash = '$2b$10$tM.yF.7p.W6.yF.7p.W6.yF.7p.W6.yF.7p.W6.yF.7p.W6.yF.7p.W6'; // Wait, I need to get the actual hash from check-admin.ts
const password = '1Tijolo!';
bcrypt.compare(password, hash).then(res => {
  console.log('Password match:', res);
}).catch(console.error);
