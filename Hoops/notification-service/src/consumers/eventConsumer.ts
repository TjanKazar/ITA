import { NotificationType, HoopsEvent } from '../models/types';
import { NotificationService } from '../services/notificationService';
import { logger } from '../utils/logger';

export async function handleEvent(routingKey: string, body: any): Promise<void> {
  const service = new NotificationService();

  try {
    switch (routingKey) {
      case 'session.created':
        await handleSessionCreated(service, body);
        break;
      case 'session.starting':
        await handleSessionStarting(service, body);
        break;
      case 'session.finished':
        await handleSessionFinished(service, body);
        break;
      case 'session.player_joined':
        await handlePlayerJoined(service, body);
        break;
      case 'user.rank_changed':
        await handleRankChanged(service, body);
        break;
      default:
        logger.warn(`Unknown event type: ${routingKey}`);
    }
  } catch (error) {
    logger.error(`Error handling event ${routingKey}:`, error);
    throw error;
  }
}

async function handleSessionCreated(
  service: NotificationService,
  body: any
): Promise<void> {
  logger.info(`Session created at court ${body.court_id}`);
  // TODO: Notify users watching this court
}

async function handleSessionStarting(
  service: NotificationService,
  body: any
): Promise<void> {
  const { player_ids, court_name, session_id, court_id } = body;

  await service.notifyUsers(
    player_ids,
    NotificationType.GAME_STARTING,
    'Game Starting Soon!',
    `Your game at ${court_name} is about to begin.`,
    { session_id, court_id }
  );
}

async function handleSessionFinished(
  service: NotificationService,
  body: any
): Promise<void> {
  const { winner_ids, loser_ids, score, session_id } = body;

  // Notify winners
  await service.notifyUsers(
    winner_ids,
    NotificationType.GAME_FINISHED,
    'Victory! 🏀',
    `You won ${score}! Your rating has been updated.`,
    { session_id }
  );

  // Notify losers
  await service.notifyUsers(
    loser_ids,
    NotificationType.GAME_FINISHED,
    'Game Finished',
    `Final score: ${score}. Better luck next time!`,
    { session_id }
  );
}

async function handlePlayerJoined(
  service: NotificationService,
  body: any
): Promise<void> {
  const {
    creator_id,
    player_username,
    current_player_count,
    max_players,
    session_id,
  } = body;

  await service.notifyUser(
    creator_id,
    NotificationType.PLAYER_JOINED,
    'Player Joined!',
    `${player_username} joined your game (${current_player_count}/${max_players})`,
    { session_id }
  );
}

async function handleRankChanged(
  service: NotificationService,
  body: any
): Promise<void> {
  const {
    user_id,
    old_rank_tier,
    new_rank_tier,
    rank_name,
    old_rating,
    new_rating,
  } = body;

  const title = new_rank_tier > old_rank_tier ? 'Rank Up! 🎉' : 'Rank Update';
  const message =
    new_rank_tier > old_rank_tier
      ? `You've reached ${rank_name}!`
      : `Your rank is now ${rank_name}`;

  await service.notifyUser(
    user_id,
    NotificationType.RANK_CHANGE,
    title,
    message,
    { old_rating, new_rating }
  );
}