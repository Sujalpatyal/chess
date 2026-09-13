import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import 'dotenv/config';

interface PlayerSession {
  socketId: string;
  displayName: string;
  color: 'w' | 'b';
}

interface RoomData {
  roomCode: string;
  players: PlayerSession[];
  timeMinutes: number;
  whiteTimeMs: number;
  blackTimeMs: number;
  fen: string;
  moves: string[];
  status: 'waiting' | 'playing' | 'finished';
}

const rooms = new Map<string, RoomData>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: '*' },
  });

  // Hosting platforms provide PORT dynamically; retain 3000 for local development.
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check API
  app.get(['/health', '/api/health'], (req, res) => {
    res.json({
      status: 'ok',
      activeRooms: rooms.size,
      service: 'AI Chess Assistant Server',
    });
  });

  // Socket.IO Multiplayer Chess Handler
  io.on('connection', (socket: Socket) => {
    // 1. Create Room
    socket.on('create_room', (data: { displayName: string; timeMinutes?: number }) => {
      const roomCode = generateRoomCode();
      const timeMinutes = data.timeMinutes || 10;
      const hostColor: 'w' | 'b' = Math.random() > 0.5 ? 'w' : 'b';

      const newRoom: RoomData = {
        roomCode,
        players: [
          {
            socketId: socket.id,
            displayName: data.displayName || 'Host',
            color: hostColor,
          },
        ],
        timeMinutes,
        whiteTimeMs: timeMinutes * 60 * 1000,
        blackTimeMs: timeMinutes * 60 * 1000,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moves: [],
        status: 'waiting',
      };

      rooms.set(roomCode, newRoom);
      socket.join(roomCode);

      socket.emit('room_created', {
        roomCode,
        color: hostColor,
      });
    });

    // 2. Join Room
    socket.on('join_room', (data: { roomCode: string; displayName: string }) => {
      const code = data.roomCode.toUpperCase();
      const room = rooms.get(code);

      if (!room) {
        socket.emit('error_message', 'Room not found. Please check the code.');
        return;
      }

      if (room.players.length >= 2) {
        socket.emit('error_message', 'Room is already full.');
        return;
      }

      const host = room.players[0];
      const guestColor = host.color === 'w' ? 'b' : 'w';

      const guest: PlayerSession = {
        socketId: socket.id,
        displayName: data.displayName || 'Challenger',
        color: guestColor,
      };

      room.players.push(guest);
      room.status = 'playing';
      socket.join(code);

      // Start game for both players
      socket.emit('game_start', {
        opponentName: host.displayName,
        color: guestColor,
        timeMs: room.whiteTimeMs,
      });

      socket.to(host.socketId).emit('game_start', {
        opponentName: guest.displayName,
        color: host.color,
        timeMs: room.whiteTimeMs,
      });
    });

    // 3. Make Move
    socket.on('make_move', (data: { roomCode: string; move: any; fen: string }) => {
      const room = rooms.get(data.roomCode);
      if (!room) return;

      room.fen = data.fen;
      room.moves.push(data.move.san || `${data.move.from}${data.move.to}`);

      // Broadcast move to other player in room
      socket.to(data.roomCode).emit('opponent_move', {
        move: data.move,
        fen: data.fen,
      });
    });

    // 4. Clock Sync
    socket.on('clock_sync', (data: { roomCode: string; whiteTimeMs: number; blackTimeMs: number }) => {
      const room = rooms.get(data.roomCode);
      if (!room) return;

      room.whiteTimeMs = data.whiteTimeMs;
      room.blackTimeMs = data.blackTimeMs;

      socket.to(data.roomCode).emit('clock_sync', {
        whiteTimeMs: data.whiteTimeMs,
        blackTimeMs: data.blackTimeMs,
      });
    });

    // 5. Resign
    socket.on('resign', (data: { roomCode: string }) => {
      socket.to(data.roomCode).emit('opponent_resigned');
      const room = rooms.get(data.roomCode);
      if (room) room.status = 'finished';
    });

    // 6. Draw Negotiation
    socket.on('offer_draw', (data: { roomCode: string }) => {
      socket.to(data.roomCode).emit('draw_offered');
    });

    socket.on('draw_response', (data: { roomCode: string; accept: boolean }) => {
      if (data.accept) {
        socket.to(data.roomCode).emit('draw_accepted');
        const room = rooms.get(data.roomCode);
        if (room) room.status = 'finished';
      } else {
        socket.to(data.roomCode).emit('draw_declined');
      }
    });

    // 7. Disconnect Handling
    socket.on('disconnect', () => {
      for (const [code, room] of rooms.entries()) {
        const playerIndex = room.players.findIndex((p) => p.socketId === socket.id);
        if (playerIndex !== -1) {
          socket.to(code).emit('opponent_disconnected');
          // Remove player or clear room
          if (room.players.length <= 1) {
            rooms.delete(code);
          }
          break;
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Chess Server running on http://localhost:${PORT}`);
  });
}

startServer();
