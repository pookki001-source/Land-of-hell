import { createClient } from "@supabase/supabase-js";
import { LocalPlayerData } from "./colyseusClient";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://ibixvfsmzvbtrwtgqwgt.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3v512O5pfGfFZba5o6qksg_PA-Xohzm";

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
