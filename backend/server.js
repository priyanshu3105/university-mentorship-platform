import 'dotenv/config';
import http from 'http';
import { app } from './app.js';
import { initSocketServer } from './socket/socketServer.js';


const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
const io = initSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { server, io };
