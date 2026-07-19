require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pgPool, connectMongo, initPostgres } = require('./db');
const Incident = require('./models/Incident');
const authMiddleware = require('./middleware/auth');
const { Resend } = require('resend');

const app = express();
const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_hackathon';
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json());
app.use((req, res, next) => {
  const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:3000").split(',').map(o => o.trim());
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Initialize Databases
connectMongo();
initPostgres();

app.get("/health", (req, res) => res.json({ status: "ok" }));

// ==========================================
// AUTHENTICATION
// ==========================================

app.post("/api/auth/register", async (req, res) => {
  const { name, city, area, type, responseTime, phone, notificationEndpoint, email, password } = req.body;
  
  if (!name || !city || !phone || !email || !password) {
    return res.status(400).json({ error: "Organization name, city, phone, email, and password are required fields." });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im;
  if (!phoneRegex.test(String(phone))) {
    return res.status(400).json({ error: "Please provide a valid phone number." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email))) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pgPool.query(
      `INSERT INTO organizations 
       (name, city, area, type, response_time, phone, notification_endpoint, email, password_hash) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, name, email`,
      [name, city, area, type, responseTime, phone, notificationEndpoint, email, passwordHash]
    );

    const org = result.rows[0];
    const token = jwt.sign({ orgId: org.id, email: org.email }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ data: org, token });
  } catch (error) {
    if (error.code === '23505') { // unique violation
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pgPool.query(`SELECT * FROM organizations WHERE email = $1`, [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: "Invalid email or password" });

    const org = result.rows[0];
    const validPassword = await bcrypt.compare(password, org.password_hash);
    if (!validPassword) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign({ orgId: org.id, email: org.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, orgId: org.id, name: org.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// PUBLIC API
// ==========================================

app.get("/api/organizations", async (req, res) => {
  const city = String(req.query.city || "").trim().toLowerCase();
  try {
    let query = "SELECT id, name, city, area, type, response_time as \"responseTime\", phone, notification_endpoint as \"notificationEndpoint\", email FROM organizations";
    const values = [];
    if (city) {
      query += " WHERE LOWER(city) = $1";
      values.push(city);
    }
    const result = await pgPool.query(query, values);
    res.json({ data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/incidents", async (req, res) => {
  const { city, situation, location, details = "" } = req.body;
  if (![city, situation, location].every((value) => typeof value === "string" && value.trim())) {
    return res.status(400).json({ error: "city, situation, and location are required" });
  }

  try {
    const incident = new Incident({ city: city.trim(), situation: situation.trim(), location: location.trim(), details: String(details).trim() });
    await incident.save();

    // Fetch rescue organizations in this city
    const orgsResult = await pgPool.query(
      `SELECT email, name FROM organizations WHERE LOWER(city) = LOWER($1) AND email IS NOT NULL AND email != ''`,
      [city.trim()]
    );
    
    const orgEmails = orgsResult.rows.map(org => org.email);
    
    if (orgEmails.length > 0 && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Alerts <alerts@jsunlocked.dev>',
          to: orgEmails,
          subject: `🚨 Emergency Alert: Animal in need in ${city.trim()}`,
          html: `
            <h2>New Animal Rescue Incident</h2>
            <p><strong>City:</strong> ${city.trim()}</p>
            <p><strong>Location:</strong> ${location.trim()}</p>
            <p><strong>Situation:</strong> ${situation.trim()}</p>
            <p><strong>Additional Details:</strong> ${details.trim() || 'None provided'}</p>
            <br/>
            <p>Please respond if your team is available to assist.</p>
          `
        });
        console.log(`Alert sent to ${orgEmails.length} orgs in ${city}`);
      } catch (err) {
        console.error('Failed to send Resend email:', err);
      }
    }

    res.status(201).json({ data: incident, message: "Incident reported successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// PROTECTED DASHBOARD API
// ==========================================

app.get("/api/organizations/me", authMiddleware, async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT id, name, city, area, type, response_time as "responseTime", phone, notification_endpoint as "notificationEndpoint", email 
       FROM organizations WHERE id = $1`,
      [req.user.orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Organization not found" });
    res.json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/organizations/me", authMiddleware, async (req, res) => {
  try {
    const result = await pgPool.query(
      `DELETE FROM organizations WHERE id = $1 RETURNING id`,
      [req.user.orgId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Organization not found" });
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/organizations/me", authMiddleware, async (req, res) => {
  const { name, city, area, type, responseTime, phone, notificationEndpoint } = req.body;
  try {
    const result = await pgPool.query(
      `UPDATE organizations SET 
       name = COALESCE($1, name), city = COALESCE($2, city), area = COALESCE($3, area), 
       type = COALESCE($4, type), response_time = COALESCE($5, response_time), 
       phone = COALESCE($6, phone), notification_endpoint = COALESCE($7, notification_endpoint)
       WHERE id = $8 RETURNING id, name, city, area, type, response_time as "responseTime", phone, notification_endpoint as "notificationEndpoint", email`,
      [name, city, area, type, responseTime, phone, notificationEndpoint, req.user.orgId]
    );
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get unassigned incidents in the org's city
app.get("/api/incidents/unassigned", authMiddleware, async (req, res) => {
  try {
    // First get the org's city
    const orgRes = await pgPool.query(`SELECT city FROM organizations WHERE id = $1`, [req.user.orgId]);
    if (orgRes.rows.length === 0) return res.status(404).json({ error: "Organization not found" });
    const city = orgRes.rows[0].city;

    // Find unassigned incidents in that city
    const incidents = await Incident.find({ 
      city: { $regex: new RegExp(`^${city}$`, 'i') }, 
      assignedTo: null 
    }).sort({ createdAt: -1 });
    
    res.json({ data: incidents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get incidents assigned to this org
app.get("/api/incidents/assigned", authMiddleware, async (req, res) => {
  try {
    const incidents = await Incident.find({ assignedTo: String(req.user.orgId) }).sort({ createdAt: -1 });
    res.json({ data: incidents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Assign an incident to this org
app.put("/api/incidents/:id/assign", authMiddleware, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: "Incident not found" });
    if (incident.assignedTo) return res.status(400).json({ error: "Incident already assigned" });

    incident.assignedTo = String(req.user.orgId);
    incident.status = 'in-progress';
    await incident.save();

    res.json({ data: incident, message: "Incident assigned successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update status of an assigned incident
app.put("/api/incidents/:id/status", authMiddleware, async (req, res) => {
  const { status } = req.body;
  if (!['reported', 'in-progress', 'resolved'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const incident = await Incident.findOne({ _id: req.params.id, assignedTo: String(req.user.orgId) });
    if (!incident) return res.status(404).json({ error: "Incident not found or not assigned to you" });

    incident.status = status;
    await incident.save();

    res.json({ data: incident, message: "Status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`PawReach API listening on ${port}`));
}

// Required for Vercel Serverless
module.exports = app;
