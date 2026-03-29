import { prisma } from '@/lib/db';
import { publishEvent, TOPICS } from '@/lib/kafka/producer';
import { v4 as uuidv4 } from 'uuid';

export interface CreateRoomInput {
  hostUserId: string;
  hostName: string;
  expiresInHours?: number;
}

export interface JoinRoomInput {
  roomId: string;
  userId: string;
  userName: string;
}

export class RoomService {
  // Create a new room
  static async createRoom(input: CreateRoomInput) {
    const { hostUserId, hostName, expiresInHours = 24 } = input;
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    try {
      // Create room in database
      const room = await prisma.room.create({
        data: {
          hostUserId,
          status: 'waiting',
          expiresAt,
          participants: {
            create: {
              userId: hostUserId,
              name: hostName,
            },
          },
        },
        include: {
          participants: true,
        },
      });

      // Publish ROOM_CREATED event to Kafka
      await publishEvent(TOPICS.ROOM_EVENTS, {
        type: 'ROOM_CREATED',
        roomId: room.id,
        userId: hostUserId,
        timestamp: Date.now(),
        data: {
          hostUserId,
          hostName,
          expiresAt: room.expiresAt,
        },
      });

      return room;
    } catch (error) {
      console.error('Error creating room:', error);
      throw new Error('Failed to create room');
    }
  }

  // Get room by ID
  static async getRoomById(roomId: string) {
    try {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          participants: {
            orderBy: { joinedAt: 'asc' },
          },
          votes: true,
          suggestions: {
            orderBy: { generatedAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!room) {
        throw new Error('Room not found');
      }

      // Check if room has expired
      if (new Date() > room.expiresAt) {
        throw new Error('Room has expired');
      }

      return room;
    } catch (error) {
      console.error('Error getting room:', error);
      throw error;
    }
  }

  // Join an existing room
  static async joinRoom(input: JoinRoomInput) {
    const { roomId, userId, userName } = input;

    try {
      // Check if room exists and is not expired
      console.log("joinRoom input:", input);
      console.log(`Room id : ${roomId}`);
      const room = await this.getRoomById(roomId);

      if (room.status === 'completed') {
        throw new Error('Room has already completed');
      }

      // Check if user is already in the room
      const existingParticipant = await prisma.participant.findUnique({
        where: {
          roomId_userId: {
            roomId,
            userId,
          },
        },
      });

      if (existingParticipant) {
        return { room, participant: existingParticipant, isNewParticipant: false };
      }

      // Add participant to room
      const participant = await prisma.participant.create({
        data: {
          roomId,
          userId,
          name: userName,
        },
      });

      // Publish USER_JOINED_ROOM event
      await publishEvent(TOPICS.ROOM_EVENTS, {
        type: 'USER_JOINED_ROOM',
        roomId,
        userId,
        timestamp: Date.now(),
        data: {
          userName,
          participantCount: room.participants.length + 1,
        },
      });

      // Get updated room
      const updatedRoom = await this.getRoomById(roomId);

      return { room: updatedRoom, participant, isNewParticipant: true };
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

  // Leave room
  static async leaveRoom(roomId: string, userId: string) {
    try {
      const room = await this.getRoomById(roomId);
      // Don't allow host to leave if there are other participants
      if (room.hostUserId === userId && room.participants.length > 1) {
        throw new Error('Host cannot leave while other participants are in the room');
      }

      // Remove participant
      await prisma.participant.delete({
        where: {
          roomId_userId: {
            roomId,
            userId,
          },
        },
      });

      // Publish USER_LEFT_ROOM event
      await publishEvent(TOPICS.ROOM_EVENTS, {
        type: 'USER_LEFT_ROOM',
        roomId,
        userId,
        timestamp: Date.now(),
        data: {
          participantCount: room.participants.length - 1,
        },
      });

      // If host left and no participants remain, delete the room
      if (room.hostUserId === userId) {
        await prisma.room.delete({
          where: { id: roomId },
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error leaving room:', error);
      throw error;
    }
  }

  // Update room status
  static async updateRoomStatus(roomId: string, status: string) {
    try {
      const room = await prisma.room.update({
        where: { id: roomId },
        data: { status },
        include: {
          participants: true,
        },
      });

      await publishEvent(TOPICS.ROOM_EVENTS, {
        type: 'ROOM_CREATED',
        roomId,
        timestamp: Date.now(),
        data: {
          status,
        },
      });

      return room;
    } catch (error) {
      console.error('Error updating room status:', error);
      throw error;
    }
  }

  // Get all active rooms (for debugging/admin)
  static async getActiveRooms() {
    try {
      const rooms = await prisma.room.findMany({
        where: {
          expiresAt: {
            gt: new Date(),
          },
          status: {
            not: 'completed',
          },
        },
        include: {
          participants: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return rooms;
    } catch (error) {
      console.error('Error getting active rooms:', error);
      throw error;
    }
  }
}