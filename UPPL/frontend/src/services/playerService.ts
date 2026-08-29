import { API_BASE, BASE_URL } from '@/config';
// src/services/playerService.ts

export async function getAllPlayers() {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/users`); // or /api/players depending on backend
    if (!res.ok) {
      throw new Error("Failed to fetch players");
    }
    return await res.json();
  } catch (err) {
    console.error("❌ getAllPlayers error:", err);
    throw err;
  }
}
