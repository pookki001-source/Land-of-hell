import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { TownRoom } from "./rooms/TownRoom.js";
import { MapRoom } from "./rooms/MapRoom.js";

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

app.get(["/", "/healthz"], (req, res) => {
  res.json({
    status: "online",
    game: "Land of Hell: Idle Online Server",
    time: new Date().toISOString()
  });
});

const server = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
});

// Register Rooms
gameServer.define("town", TownRoom);
gameServer.define("map", MapRoom);

gameServer.listen(port).then(() => {
  console.log(`⚔️ [Land of Hell Server] Running on http://localhost:${port}`);
  console.log(`🌐 WebSocket Game Server active on ws://localhost:${port}`);
});
