/**
 * Utility script to generate admin password hash
 * Usage: node scripts/generateAdminPassword.js <your-password>
 */
const bcrypt = require("bcryptjs");

async function generateHash() {
  const password = process.argv[2];

  if (!password) {
    console.error("Usage: node scripts/generateAdminPassword.js <your-password>");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  
  console.log("\n✅ Password hash generated successfully!\n");
  console.log("Add this to your .env file:");
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log("\nAlso add a JWT secret:");
  console.log(`JWT_SECRET=${generateRandomSecret()}`);
  console.log("\n");
}

function generateRandomSecret() {
  return require("crypto").randomBytes(32).toString("hex");
}

generateHash().catch(console.error);
