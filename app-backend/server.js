const express = require("express");

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN || "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const organizations = [
  { id: 1, name: "Wildlife SOS", city: "Delhi", area: "Delhi NCR", type: "Wildlife & domestic", responseTime: "15 min", phone: "+91 98765 43210", notificationEndpoint: "ops@wildlifesos.example" },
  { id: 2, name: "Friendicoes SECA", city: "Delhi", area: "Defence Colony", type: "Domestic animals", responseTime: "20 min", phone: "+91 98100 34212", notificationEndpoint: "ops@friendicoes.example" },
  { id: 3, name: "Bombay Animal Rights", city: "Mumbai", area: "Andheri & Bandra", type: "Domestic animals", responseTime: "18 min", phone: "+91 98204 88019", notificationEndpoint: "ops@barc.example" },
  { id: 4, name: "People For Animals", city: "Bengaluru", area: "Bannerghatta", type: "Wildlife & domestic", responseTime: "25 min", phone: "+91 98450 41106", notificationEndpoint: "ops@pfa.example" },
  { id: 5, name: "Blue Cross of India", city: "Chennai", area: "Guindy & Adyar", type: "Domestic animals", responseTime: "22 min", phone: "+91 94441 12001", notificationEndpoint: "ops@bluecross.example" },
  { id: 6, name: "ResQ Charitable Trust", city: "Pune", area: "Pune & PCMC", type: "Wildlife & domestic", responseTime: "20 min", phone: "+91 99230 46191", notificationEndpoint: "ops@resq.example" },
];

const incidents = [];
const notifications = [];

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/organizations", (req, res) => {
  const city = String(req.query.city || "").trim().toLowerCase();
  const data = city ? organizations.filter((organization) => organization.city.toLowerCase() === city) : organizations;
  res.json({ data });
});

app.post("/api/incidents", async (req, res) => {
  const { city, situation, location, details = "" } = req.body;
  if (![city, situation, location].every((value) => typeof value === "string" && value.trim())) {
    return res.status(400).json({ error: "city, situation, and location are required" });
  }

  const incident = { id: crypto.randomUUID(), city: city.trim(), situation: situation.trim(), location: location.trim(), details: String(details).trim(), status: "reported", createdAt: new Date().toISOString() };
  incidents.push(incident);
  const recipients = organizations.filter((organization) => organization.city.toLowerCase() === incident.city.toLowerCase());
  const incidentNotifications = recipients.map((organization) => ({ id: crypto.randomUUID(), incidentId: incident.id, organizationId: organization.id, channel: "email", destination: organization.notificationEndpoint, status: "queued", createdAt: incident.createdAt }));
  notifications.push(...incidentNotifications);

  // Replace this queue with AWS SNS, SES, or EventBridge in production. Persist incidents
  // and organizations in a database, then deliver notifications asynchronously with retries.
  res.status(201).json({ data: incident, notifiedOrganizations: recipients.map(({ id, name }) => ({ id, name })), notificationsQueued: incidentNotifications.length });
});

app.get("/api/incidents/:id/notifications", (req, res) => res.json({ data: notifications.filter((notification) => notification.incidentId === req.params.id) }));

app.listen(port, () => console.log(`PawReach API listening on ${port}`));
