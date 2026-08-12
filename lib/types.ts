export interface RecordRow {
  id: number;
  nickname: string;
  game: string;
  date: string; // 'YYYY-MM-DD'
  minutes: number;
  created_at?: string;
  updated_at?: string;
}

export interface LeaderboardRow {
  nickname: string;
  total_minutes: number;
}
