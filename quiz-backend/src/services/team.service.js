import teamRepository from '../repositories/team.repositories.js';
import roomRepository from '../repositories/room.repositories.js';
import leaderboardRepository from '../repositories/leaderboard.repositories.js';
import { ValidationError, UserNotHostError, IncorrectStateError } from '../models/errors.js';

class TeamService {
    async createTeam(roomId, userId, teamName) {
        if (!roomId || !userId || !teamName) {
            throw new ValidationError('Room, user and team name are required');
        }

        const isHost = await roomRepository.isUserHost(roomId, userId);
        if (!isHost) {
            throw new UserNotHostError(userId, roomId);
        }

        const room = await roomRepository.getRoomById(roomId);
        if (room.room_mode !== 'TEAM') {
            throw new ValidationError('Teams can only be created in TEAM mode rooms');
        }

        if (room.state !== 'LOBBY') {
            throw new IncorrectStateError(room.state, 'LOBBY', 'create teams');
        }

        const team = await teamRepository.createTeam({
            room_id: roomId,
            team_name: teamName
        });

        await leaderboardRepository.createEntry(null, team.id, roomId, 0);

        return {
            teamId: team.id,
            roomId: team.room_id,
            teamName: team.team_name
        };
    }

    async getRoomTeams(roomId) {
        return teamRepository.getTeamsByRoomId(roomId);
    }
}

export default new TeamService();
