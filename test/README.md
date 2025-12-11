# Automated Testing Guide

This directory contains end-to-end (E2E) tests for the Pickleball API.

## Test Structure

- `helpers/test-utils.ts` - Test utilities and helpers
- `auth.e2e-spec.ts` - Authentication and authorization tests
- `api-endpoints.e2e-spec.ts` - Individual API endpoint tests
- `flows.e2e-spec.ts` - Complete user flow tests

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test Suites
```bash
# Authentication tests only
npm run test:auth

# API endpoint tests only
npm run test:api

# Flow tests only
npm run test:flows
```

### Watch Mode
```bash
npm run test:e2e:watch
```

## Test Coverage

### Authentication Tests (`auth.e2e-spec.ts`)
- User registration
- User login
- JWT token generation
- Protected route access
- Invalid credentials handling

### API Endpoint Tests (`api-endpoints.e2e-spec.ts`)
- User profile management
- Organization management
- Player profiles
- Teams
- Notifications
- All CRUD operations

### Flow Tests (`flows.e2e-spec.ts`)
- **Flow 1**: Manager creates tournament (register → login → create org → create tournament → add category)
- **Flow 2**: Player registration flow
- **Flow 3**: Team creation and management (create team → invite member → accept invite → verify membership)

## Test Utilities

The `TestUtils` class provides helper methods:

```typescript
// Setup/Teardown
await testUtils.setup();
await testUtils.teardown();

// Create test data
const user = await testUtils.createUser({ name, email, password });
const userWithToken = await testUtils.createUserWithToken({ name, email, password });
const token = await testUtils.login(user);

// Create entities
const game = await testUtils.createGame({ key, name });
const org = await testUtils.createOrganization(userId, { name, slug });
const tournament = await testUtils.createTournament(orgId, gameId, userId, { name, slug });
```

## Environment Setup

⚠️ **CRITICAL WARNING**: Tests will DELETE ALL DATA from the database!

### Option 1: Use a Separate Test Database (RECOMMENDED)

Create a `.env.test` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pickleball_test?schema=public"
JWT_SECRET="test-secret-key"
PORT=3001
```

Update `test/jest-e2e.json` to load test environment:
```json
{
  "setupFiles": ["<rootDir>/jest.env.js"]
}
```

Create `test/jest.env.js`:
```javascript
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
```

Run tests with:
```bash
TEST_DATABASE_URL="postgresql://..." npm run test:e2e
```

### Option 2: Use Current Database (NOT RECOMMENDED)

Tests automatically:
- **DELETE ALL DATA** after each test suite
- Clean up all test data after execution
- Create necessary seed data (games)
- **WILL DELETE YOUR PRODUCTION/DEVELOPMENT DATA**

⚠️ **DO NOT RUN TESTS AGAINST PRODUCTION DATABASE!**

## Writing New Tests

### Example Test Structure

```typescript
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { TestUtils, TestUser } from './helpers/test-utils';

describe('Feature Name (e2e)', () => {
  let app: INestApplication<App>;
  let testUtils: TestUtils;
  let user: TestUser;

  beforeAll(async () => {
    testUtils = new TestUtils();
    const { app: testApp } = await testUtils.setup();
    app = testApp;
  });

  afterAll(async () => {
    await testUtils.teardown();
  });

  it('should test something', async () => {
    const response = await request(app.getHttpServer())
      .get('/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('expectedField');
  });
});
```

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run E2E Tests
  run: |
    npm install
    npm run test:e2e
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    JWT_SECRET: test-secret
```

## Troubleshooting

### Tests fail with database connection error
- Check `DATABASE_URL` in `.env`
- Ensure database is running and accessible

### Tests fail with authentication errors
- Check `JWT_SECRET` is set in `.env`
- Verify JWT configuration matches test expectations

### Tests timeout
- Increase Jest timeout in `jest-e2e.json`
- Check database performance
- Verify network connectivity

