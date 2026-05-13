import { z } from 'zod';

// Notification Types
export enum NotificationType {
  GAME_INVITE = 'game_invite',
  GAME_STARTING = 'game_starting',
  GAME_FINISHED = 'game_finished',
  PLAYER_JOINED = 'player_joined',
  RANK_CHANGE = 'rank_change',
  CHALLENGE_RECEIVED = 'challenge_received',
  SYSTEM = 'system',
}

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

// Request Schemas
export const RegisterTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.nativeEnum(Platform),
  deviceName: z.string().optional(),
});

export const PreferenceUpdateSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  gameInvites: z.boolean().optional(),
  gameStarting: z.boolean().optional(),
  gameResults: z.boolean().optional(),
  playerJoined: z.boolean().optional(),
  rankChanges: z.boolean().optional(),
  nearbyGames: z.boolean().optional(),
  favoriteCourtIds: z.array(z.number()).optional(),
});

// Event Types
export interface SessionCreatedEvent {
  event_type: 'session.created';
  session_id: number;
  court_id: number;
  court_name: string;
  creator_id: number;
  game_mode: string;
  timestamp: string;
}

export interface SessionStartingEvent {
  event_type: 'session.starting';
  session_id: number;
  court_id: number;
  court_name: string;
  player_ids: number[];
  starts_in_minutes: number;
  timestamp: string;
}

export interface SessionFinishedEvent {
  event_type: 'session.finished';
  session_id: number;
  court_id: number;
  winner_ids: number[];
  loser_ids: number[];
  score: string;
  timestamp: string;
}

export interface PlayerJoinedEvent {
  event_type: 'session.player_joined';
  session_id: number;
  court_id: number;
  player_id: number;
  player_username: string;
  current_player_count: number;
  max_players: number;
  creator_id: number;
  timestamp: string;
}

export interface RankChangedEvent {
  event_type: 'user.rank_changed';
  user_id: number;
  old_rating: number;
  new_rating: number;
  old_rank_tier: number;
  new_rank_tier: number;
  rank_name: string;
  timestamp: string;
}

export type HoopsEvent =
  | SessionCreatedEvent
  | SessionStartingEvent
  | SessionFinishedEvent
  | PlayerJoinedEvent
  | RankChangedEvent;

// Response Types
export interface NotificationResponse {
  id: number;
  type: string;
  title: string;
  body: string;
  data: any;
  read: boolean;
  createdAt: Date;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  unreadCount: number;
}