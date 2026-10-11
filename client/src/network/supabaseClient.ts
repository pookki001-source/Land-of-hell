import { createClient } from "@supabase/supabase-js";
import { LocalPlayerData } from "./colyseusClient";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://ibixvfsmzvbtrwtgqwgt.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliaXh2ZnNtenZidHJ3dGdxd2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MjA3MjksImV4cCI6MjEwNzI5NjcyOX0.HoaWwqPhlCk_pIqwEXc0Bqs9q7wudEpaaH-hyd6sOvU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Save or Update character in Supabase Cloud
export async function saveCharacterToCloud(data: LocalPlayerData): Promise<boolean> {
  try {
    const { error } = await supabase.from("characters").upsert(
      {
        name: data.name,
        character_class: data.characterClass,
        level: data.level,
        exp: data.exp,
        hp: data.hp,
        max_hp: data.maxHp,
        dps: data.dps,
        chaos_orbs: data.chaosOrbs,
        divine_orbs: data.divineOrbs,
        wisdom_scrolls: data.wisdomScrolls,
        kills: data.kills,
        updated_at: new Date().toISOString()
      },
      { onConflict: "name" }
    );

    if (error) {
      console.warn("Supabase Cloud Save notice:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to save to Supabase:", err);
    return false;
  }
}

// Fetch all characters in account
export async function fetchUserCharacters(): Promise<LocalPlayerData[]> {
  try {
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((d: any) => ({
      name: d.name,
      characterClass: d.character_class || "Duelist",
      level: d.level || 1,
      exp: d.exp || 0,
      maxExp: Math.floor(100 * Math.pow(1.5, (d.level || 1) - 1)),
      hp: d.hp || 250,
      maxHp: d.max_hp || 250,
      energyShield: 0,
      maxEnergyShield: 0,
      mana: 100,
      maxMana: 100,
      strength: 20,
      dexterity: 20,
      intelligence: 20,
      armour: 40,
      evasion: 40,
      dps: d.dps || 40,
      chaosOrbs: d.chaos_orbs || 0,
      divineOrbs: d.divine_orbs || 0,
      wisdomScrolls: d.wisdom_scrolls || 5,
      kills: d.kills || 0,
      partyId: ""
    }));
  } catch (err) {
    console.error("Failed to fetch characters from Supabase:", err);
    return [];
  }
}

// Delete character from Cloud
export async function deleteCharacterFromCloud(name: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("characters").delete().eq("name", name);
    return !error;
  } catch (err) {
    return false;
  }
}

// Load character from Supabase Cloud by Name
export async function loadCharacterFromCloud(name: string): Promise<Partial<LocalPlayerData> | null> {
  try {
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("name", name)
      .maybeSingle();

    if (error || !data) return null;

    return {
      name: data.name,
      characterClass: data.character_class,
      level: data.level,
      exp: data.exp,
      hp: data.hp,
      maxHp: data.max_hp,
      dps: data.dps,
      chaosOrbs: data.chaos_orbs,
      divineOrbs: data.divine_orbs,
      wisdomScrolls: data.wisdom_scrolls,
      kills: data.kills
    };
  } catch (err) {
    console.error("Failed to load from Supabase:", err);
    return null;
  }
}

// Get Top 10 Leaderboard
export async function getLeaderboard(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("characters")
      .select("name, character_class, level, kills, chaos_orbs, divine_orbs")
      .order("level", { ascending: false })
      .order("kills", { ascending: false })
      .limit(10);

    if (error || !data) return [];
    return data;
  } catch (err) {
    return [];
  }
}
