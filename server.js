const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const donationsFile = path.join(dataDir, 'donations.json');
const ngosFile = path.join(dataDir, 'ngos.json');

if (!fs.existsSync(donationsFile)) fs.writeFileSync(donationsFile, JSON.stringify([], null, 2));
if (!fs.existsSync(ngosFile)) {
  const sampleNgos = [
    { id: 1, name: 'Haryana Relief Foundation', lat: 28.4595, lon: 77.0266, location: 'Gurgaon, Haryana', sector: 'Disaster Relief', impactMetric: '5000+ beneficiaries' },
    { id: 2, name: 'Rural Education Trust', lat: 28.7041, lon: 77.1025, location: 'Delhi', sector: 'Education', impactMetric: '2500+ students' },
    { id: 3, name: 'Health for All Initiative', lat: 12.9716, lon: 77.5946, location: 'Bangalore, Karnataka', sector: 'Healthcare', impactMetric: '1000+ clinics' },
    { id: 4, name: 'Kerala Aid Network', lat: 9.9312, lon: 76.2673, location: 'Kochi, Kerala', sector: 'Disaster Relief', impactMetric: '3200+ families' }
  ];
  fs.writeFileSync(ngosFile, JSON.stringify(sampleNgos, null, 2));
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file)); } catch (e) { return []; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.get('/api/donations', (req, res) => {
  const donations = readJSON(donationsFile);
  res.json(donations.slice().reverse()); // newest first
});

app.post('/api/donations', (req, res) => {
  const donations = readJSON(donationsFile);
  const donation = req.body;

  // simple projects mapping with coordinates for recipient locations
  const projects = {
    1: { id: 1, name: 'Disaster Relief - Kerala Floods', lat: 9.9312, lon: 76.2673 },
    2: { id: 2, name: 'Education - Rural Schools', lat: 31.7087, lon: 76.9319 },
    3: { id: 3, name: 'Healthcare - Mobile Clinics', lat: 12.9716, lon: 77.5946 }
  };

  donation.id = donations.length ? (donations[donations.length - 1].id + 1) : 1;
  donation.timestamp = donation.timestamp || Date.now();
  donation.donor_location = donation.donor_location || { lat: donation.lat, lon: donation.lon };
  const proj = projects[donation.project_id] || projects[1];
  donation.recipient_location = { lat: proj.lat, lon: proj.lon };
  donation.project_lat = proj.lat;
  donation.project_lon = proj.lon;

  // timeline milestones
  donation.timeline = donation.timeline || [
    { stage: 'sent', timestamp: donation.timestamp, location: 'Donor Location' },
    { stage: 'processing', timestamp: donation.timestamp + 60 * 1000, location: 'Stellar Network' },
    { stage: 'received', timestamp: donation.timestamp + 2 * 60 * 1000, location: 'Project Site' }
  ];

  donations.push(donation);
  writeJSON(donationsFile, donations);
  res.status(201).json(donation);
});

app.get('/api/ngos', (req, res) => {
  const ngos = readJSON(ngosFile);
  res.json(ngos);
});

// serve frontend static files if present
app.use('/', express.static(path.join(__dirname, 'frontend')));

app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));
