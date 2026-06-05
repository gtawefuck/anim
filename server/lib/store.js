// Ephemeral in-memory data stores for SoulScythe auth.
// NOTE: For production, swap these Maps for a persistent store:
//   - Redis (with TTL) for OTPs / reset codes / magic tokens
//   - Postgres or Mongo for the users table
// The rest of the server only depends on the Map interface below.

export const users = new Map();   // emailLower -> { name, email, passHash, createdAt }
export const pending = new Map(); // emailLower -> { name, email, passHash, otpHash, otpExpires }
export const resets = new Map();  // emailLower -> { otpHash, expires }
