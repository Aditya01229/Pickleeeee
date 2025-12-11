# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pickleball?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"

# Server Port (optional, defaults to 3000)
PORT=3000
```

## Important Notes

1. **JWT_SECRET**: 
   - Change this to a strong, random string in production
   - Minimum recommended length: 32 characters
   - You can generate one using: `openssl rand -base64 32`

2. **DATABASE_URL**: 
   - Update with your actual PostgreSQL connection string
   - Format: `postgresql://username:password@host:port/database?schema=public`

3. **PORT**: 
   - Optional, defaults to 3000 if not provided

## Next Steps After Setup

1. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
   This will update your database schema to include the `password` field in the `users` table.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm run start:dev
   ```

