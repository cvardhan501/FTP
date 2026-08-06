const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;

// Active rooms mapping: code -> { hostSocketId, peers: [] }
const rooms = new Map();

// Active discovery devices list: socketId -> deviceMetaData
const discoveryDevices = new Map();

// Periodically prune offline devices (every 10 seconds)
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [id, dev] of discoveryDevices.entries()) {
    if (now - dev.lastSeen > 20000) { // 20s timeout
      discoveryDevices.delete(id);
      changed = true;
    }
  }
  if (changed) {
    io.emit("discovery-update", Array.from(discoveryDevices.values()));
  }
}, 10000);

app.get("/health", (req, res) => {
  res.json({ status: "ok", activeRooms: rooms.size, activeDevices: discoveryDevices.size });
});

io.on("connection", (socket) => {
  console.log(`[Signaling] Device connected: ${socket.id}`);

  // Device discovery presence & heartbeat
  socket.on("announce-device", (deviceData) => {
    const info = {
      ...deviceData,
      id: socket.id,
      lastSeen: Date.now(),
    };
    discoveryDevices.set(socket.id, info);
    io.emit("discovery-update", Array.from(discoveryDevices.values()));
  });

  socket.on("heartbeat", () => {
    const dev = discoveryDevices.get(socket.id);
    if (dev) {
      dev.lastSeen = Date.now();
    }
  });

  // Direct Device Invite & Pairing Handshake
  socket.on("device-invite", ({ targetId, sessionCode, senderDevice }) => {
    console.log(`[Signaling] Device invite from ${socket.id} to ${targetId}`);
    io.to(targetId).emit("device-invite", {
      senderId: socket.id,
      sessionCode,
      senderDevice,
    });
  });

  socket.on("device-invite-accept", ({ senderId, sessionCode }) => {
    console.log(`[Signaling] Device invite accepted by ${socket.id}`);
    io.to(senderId).emit("device-invite-accepted", { receiverId: socket.id, sessionCode });
  });

  // Create room with session code
  socket.on("create-room", ({ sessionCode, deviceData }, callback) => {
    socket.join(sessionCode);
    rooms.set(sessionCode, {
      hostSocketId: socket.id,
      peers: [socket.id],
    });
    console.log(`[Signaling] Room created: ${sessionCode} by ${socket.id}`);
    if (callback) callback({ success: true, sessionCode });
  });

  // Join room by session code
  socket.on("join-room", ({ sessionCode, deviceData }, callback) => {
    const room = rooms.get(sessionCode);
    if (!room) {
      if (callback) callback({ success: false, error: "Invalid or expired session code" });
      return;
    }

    socket.join(sessionCode);
    if (!room.peers.includes(socket.id)) {
      room.peers.push(socket.id);
    }

    console.log(`[Signaling] ${socket.id} joined room ${sessionCode}`);

    // Notify host that a receiver/peer joined
    socket.to(sessionCode).emit("peer-joined", {
      peerId: socket.id,
      deviceData,
    });

    if (callback) callback({ success: true, hostId: room.hostSocketId });
  });

  // Relay WebRTC signaling: Offer, Answer, ICE Candidates
  socket.on("signal-offer", ({ targetId, offer, sessionCode, deviceData }) => {
    if (targetId) {
      io.to(targetId).emit("signal-offer", { senderId: socket.id, offer, deviceData });
    } else if (sessionCode) {
      socket.to(sessionCode).emit("signal-offer", { senderId: socket.id, offer, deviceData });
    }
  });

  socket.on("signal-answer", ({ targetId, answer, sessionCode }) => {
    if (targetId) {
      io.to(targetId).emit("signal-answer", { senderId: socket.id, answer });
    } else if (sessionCode) {
      socket.to(sessionCode).emit("signal-answer", { senderId: socket.id, answer });
    }
  });

  socket.on("signal-ice", ({ targetId, candidate, sessionCode }) => {
    if (targetId) {
      io.to(targetId).emit("signal-ice", { senderId: socket.id, candidate });
    } else if (sessionCode) {
      socket.to(sessionCode).emit("signal-ice", { senderId: socket.id, candidate });
    }
  });

  // Transfer handshake relay
  socket.on("file-meta", ({ targetId, sessionCode, fileMeta }) => {
    if (targetId) {
      io.to(targetId).emit("file-meta", { senderId: socket.id, fileMeta });
    } else if (sessionCode) {
      socket.to(sessionCode).emit("file-meta", { senderId: socket.id, fileMeta });
    }
  });

  socket.on("file-accept", ({ targetId, sessionCode, transferId }) => {
    if (targetId) {
      io.to(targetId).emit("file-accept", { receiverId: socket.id, transferId });
    }
    if (sessionCode) {
      socket.to(sessionCode).emit("file-accept", { receiverId: socket.id, transferId });
    }
  });

  socket.on("file-reject", ({ targetId, sessionCode, transferId, reason }) => {
    if (targetId) {
      io.to(targetId).emit("file-reject", { receiverId: socket.id, transferId, reason });
    }
    if (sessionCode) {
      socket.to(sessionCode).emit("file-reject", { receiverId: socket.id, transferId, reason });
    }
  });

  socket.on("file-chunk-stream", ({ targetId, sessionCode, chunkIndex, totalChunks, dataHex }) => {
    if (targetId) {
      io.to(targetId).emit("file-chunk-stream", { chunkIndex, totalChunks, dataHex });
    } else if (sessionCode) {
      socket.to(sessionCode).emit("file-chunk-stream", { chunkIndex, totalChunks, dataHex });
    }
  });

  // Clipboard sync
  socket.on("clipboard-sync", ({ sessionCode, text, senderName }) => {
    socket.to(sessionCode).emit("clipboard-sync", {
      id: Date.now().toString(),
      text,
      senderName,
      timestamp: Date.now(),
    });
  });

  socket.on("disconnect", () => {
    console.log(`[Signaling] Device disconnected: ${socket.id}`);
    discoveryDevices.delete(socket.id);
    io.emit("discovery-update", Array.from(discoveryDevices.values()));

    // Clean up rooms
    for (const [code, room] of rooms.entries()) {
      if (room.peers.includes(socket.id)) {
        room.peers = room.peers.filter((p) => p !== socket.id);
        io.to(code).emit("peer-left", { peerId: socket.id });
        if (room.peers.length === 0) {
          rooms.delete(code);
        }
      }
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`===================================================`);
  console.log(`🚀 AirDropX Socket.IO Signaling Server running on 0.0.0.0:${PORT}`);
  console.log(`===================================================`);
});
