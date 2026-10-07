import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { prisma } from './services/prisma';

// Use Render's PORT environment variable, fallback to 3001 for local development
const PORT = Number(process.env.PORT) || 3001;

// Verify database connection with a real liveness query
async function verifyDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error("❌ PostgreSQL connection failed (network/auth error):", error);
    process.exit(1);
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ PostgreSQL connected successfully");
  } catch (error) {
    console.error("❌ PostgreSQL query failed (connection established but query error):", error);
    process.exit(1);
  }
}

// Start server only after database connection is verified
async function startServer(): Promise<void> {
  await verifyDatabaseConnection();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Server closed');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forcing shutdown...');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Start the server
startServer();
