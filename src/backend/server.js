const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src/frontend')));

// API routes
const apiRoutes = require('./routes/api');  // Fixed path: removed 'src/backend/'
app.use('/api', apiRoutes);

// Serve frontend
app.get('/', (req, res) => {
  console.log("Sending index.html from route /");
  res.sendFile(path.join(__dirname, "..", "..", 'src/frontend/index.html'));
});

app.get("/js/:jsScript", (req, res) => {
  const jsScript = req.params.jsScript;
  console.log("Sending file ", jsScript, "from route /js/:jsScript");
  res.sendFile(path.join(__dirname, "..", "..", 'src/frontend/js', jsScript));
});

app.get("/assets/:asset", (req, res) => {
  const asset = req.params.asset;
  console.log("Sending file ", asset, "from route /assets/:asset");
  res.sendFile(path.join(__dirname, "..", "..", 'src/frontend/assets', asset));
});

app.get("/css/:css", (req, res) => {
  const css = req.params.css;
  console.log("Sending file ", css, "from route /css/:css");
  res.sendFile(path.join(__dirname, "..", "..", 'src/frontend/css', css));
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});