import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { spawn } from "child_process";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Build state
  let isBuilding = false;
  let buildLogs: string[] = [];

  io.on("connection", (socket) => {
    console.log("Client connected");
    socket.emit("build-status", { isBuilding, logs: buildLogs });

    socket.on("start-build", async (config) => {
      if (isBuilding) return;
      isBuilding = true;
      buildLogs = [];
      io.emit("build-status", { isBuilding, logs: buildLogs });

      const addLog = (data: string) => {
        const lines = data.split("\n").filter(l => l.trim());
        lines.forEach(line => {
          const timestamp = new Date().toLocaleTimeString();
          const formattedLine = `[${timestamp}] ${line}`;
          buildLogs.push(formattedLine);
          io.emit("log", formattedLine);
        });
      };

      addLog("Starting build process...");
      addLog(`Kernel Source: ${config.repoUrl}`);
      addLog(`Branch: ${config.branch}`);
      addLog(`Defconfig: ${config.defconfig}`);
      addLog(`KernelSU: ${config.enableKernelSU ? "Enabled" : "Disabled"}`);
      addLog(`SUSFS: ${config.enableSusfs ? "Enabled" : "Disabled"}`);

      // Simulation of build steps for the demo environment
      // In a real environment, we would run actual shell commands
      
      const steps = [
        { name: "Checking environment...", duration: 2000 },
        { name: "Cloning kernel source...", duration: 5000 },
        { name: "Setting up toolchain...", duration: 3000 },
        { name: "Applying KernelSU patches...", duration: 4000, condition: config.enableKernelSU },
        { name: "Applying SUSFS patches...", duration: 4000, condition: config.enableSusfs },
        { name: "Configuring kernel...", duration: 3000 },
        { name: "Compiling kernel (this may take a while)...", duration: 10000 },
        { name: "Packaging Image.gz-dtb...", duration: 3000 },
      ];

      for (const step of steps) {
        if (step.condition === false) continue;
        addLog(`>>> ${step.name}`);
        await new Promise(resolve => setTimeout(resolve, step.duration));
        
        // Random "progress" logs
        if (step.name.includes("Compiling")) {
          addLog("  CC      arch/arm64/kernel/process.o");
          addLog("  CC      arch/arm64/kernel/stacktrace.o");
          addLog("  CC      drivers/char/mem.o");
          addLog("  CC      kernel/sched/core.o");
          addLog("  LD      vmlinux");
        }
      }

      addLog("Build completed successfully!");
      isBuilding = false;
      io.emit("build-status", { isBuilding, logs: buildLogs });
      io.emit("build-complete", { success: true, downloadUrl: "#" });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
