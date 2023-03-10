import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import connectDB from '../../database/mongoDB.js';
import { AuthRequest } from '../../types/auth-types.js';
import app from '../../app.js';

describe('Given an app with an auth router', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUrl = mongoServer.getUri();
    await connectDB(mongoUrl);
  });

  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(async () => {
    await mongoServer.stop();
    await mongoose.connection.close();
    process.env = OLD_ENV;
  });

  describe('When a user wants to login with an invalid email format,', () => {
    test('then it should throw a 400 error and show the type of error', async () => {
      const invalidUser: AuthRequest = {
        email: 'invalid.email',
        password: 'mockPassword',
      };

      const response = await request(app)
        .post('/auth/login')
        .send(invalidUser)
        .expect(400);

      expect(response.body.error).toEqual('Bad Request');
    });
  });

  describe('When a user wants to login with an invalid password format,', () => {
    test('then it should throw a 400 error and show a descriptive message', async () => {
      const invalidUser = {
        email: 'mock@email.com',
        password: 45,
      };

      const response = await request(app)
        .post('/auth/login')
        .send(invalidUser)
        .expect(400);

      expect(response.body.details.body[0].message).toEqual(
        '"password" must be a string',
      );
    });
  });

  describe('When a user wants to login with a valid email and password,', () => {
    test('and the password encryption key environment variable does not exist, then it should return a 500 error', async () => {
      const user = {
        email: 'mock@email.com',
        password: 'mockPassword',
      };

      delete process.env.PASSWORD_ENCRYPTION_KEY;

      const response = await request(app)
        .post('/auth/login')
        .send(user)
        .expect(500);

      expect(response.status).toEqual(500);
    });
  });
});
