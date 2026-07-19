const request = require('supertest');
const app = require('../server');
const { pgPool } = require('../db');
const Incident = require('../models/Incident');

// Mock external dependencies
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'mock-email-id' })
    }
  }))
}));

jest.mock('../db', () => ({
  pgPool: {
    query: jest.fn()
  },
  connectMongo: jest.fn(),
  initPostgres: jest.fn()
}));

jest.mock('../models/Incident');

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn().mockReturnValue({ orgId: 1, email: 'test@rescue.com' })
}));

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/organizations', () => {
    it('should return organizations for a given city', async () => {
      const mockOrgs = [
        { id: 1, name: 'Rescue A', city: 'Delhi', email: 'test@example.com' }
      ];
      pgPool.query.mockResolvedValueOnce({ rows: mockOrgs });

      const response = await request(app).get('/api/organizations?city=Delhi');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockOrgs);
      expect(pgPool.query).toHaveBeenCalledWith(
        'SELECT id, name, city, area, type, response_time as "responseTime", phone, notification_endpoint as "notificationEndpoint", email FROM organizations WHERE LOWER(city) = $1',
        ['delhi']
      );
    });
  });

  describe('POST /api/incidents', () => {
    it('should create an incident and trigger email alert', async () => {
      const mockIncident = {
        city: 'Delhi',
        situation: 'Injured paw',
        location: 'Sector 5',
        save: jest.fn().mockResolvedValue(true)
      };
      
      Incident.mockImplementation(() => mockIncident);
      pgPool.query.mockResolvedValueOnce({ rows: [{ email: 'test@rescue.com' }] });

      const response = await request(app)
        .post('/api/incidents')
        .send({ city: 'Delhi', situation: 'Injured paw', location: 'Sector 5' });

      expect(response.status).toBe(201);
      expect(mockIncident.save).toHaveBeenCalled();
      expect(pgPool.query).toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/incidents')
        .send({ city: 'Delhi' }); // missing situation and location

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('Auth Endpoints', () => {
    it('POST /api/auth/register should create an org', async () => {
      pgPool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Rescue', email: 'test@test.com' }] });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Rescue', city: 'Delhi', phone: '1234567890', email: 'test@test.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body.token).toBe('mock_token');
    });

    it('POST /api/auth/login should authenticate org', async () => {
      pgPool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Rescue', email: 'test@test.com', password_hash: 'hashed_password' }] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('mock_token');
    });
  });

  describe('Protected Endpoints', () => {
    it('should reject requests without a token', async () => {
      const response = await request(app).get('/api/incidents/unassigned');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });

    it('should allow requests with a valid token', async () => {
      pgPool.query.mockResolvedValueOnce({ rows: [{ city: 'Delhi' }] });
      Incident.find = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      const response = await request(app)
        .get('/api/incidents/unassigned')
        .set('Authorization', 'Bearer mock_token');

      expect(response.status).toBe(200);
    });
  });
});
