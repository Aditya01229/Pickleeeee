// Load test environment variables
// Set TEST_DATABASE_URL in your .env or environment to use a separate test database
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  console.log('Using test database:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
}
// Otherwise uses default DATABASE_URL from .env

