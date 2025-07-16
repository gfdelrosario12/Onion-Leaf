// index.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 8000;

// __dirname equivalent for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Routes for specific HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/upload.html'));
});

app.get('/live', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/live.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Web server running at http://localhost:${PORT}`);
});
