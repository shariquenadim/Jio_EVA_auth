const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const app = require('../index');
const router = require('../router');
const jest = require('jest')

// Mock the response for the '/' route
jest.mock('../router', () => {
  return jest.fn().mockImplementation(() => {
    return {
      get: jest.fn().mockImplementation((path, handler) => {
        if (path === '/') {
          return handler({}, {
            sendStatus: jest.fn().mockReturnValue(200),
          });
        }
      }),
    };
  });
});

describe('Index.js', () => {
  let server;

  beforeAll(async () => {
    server = app.listen(3000);
    await new Promise((resolve) => server.on('listening', resolve));
  });

  afterAll(async () => {
    server.close();
    await mongoose.disconnect();
  });

  it('should connect to MongoDB', async () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  it('should start the server', async () => {
    expect(server.listening).toBe(true);
  });

  it('should handle errors correctly', async () => {
    const response = await request(app).get('/nonexistent-route');
    expect(response.status).toBe(404);
    expect(response.text).toBe('Something went wrong!');
  });

  it('should handle routes correctly', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });
});