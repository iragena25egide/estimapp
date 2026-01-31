import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{

  constructor() {
    console.log('🚀 NotificationsGateway initialized');
  }

  @WebSocketServer()
  server: Server;

  
  private onlineUsers = new Map<string, Set<string>>();

  handleConnection(socket: Socket) {
    const role = socket.handshake.query.role as string;
    if (!role) return;

    if (!this.onlineUsers.has(role)) {
      this.onlineUsers.set(role, new Set());
    }

    this.onlineUsers.get(role)!.add(socket.id);
    console.log(`Socket connected: ${socket.id}, role: ${role}`);
  }

  handleDisconnect(socket: Socket) {
    for (const [role, sockets] of this.onlineUsers.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        console.log(`Socket disconnected: ${socket.id}, role: ${role}`);
      }
    }
  }

  
  isRoleOnline(role: string): boolean {
    return (this.onlineUsers.get(role)?.size ?? 0) > 0;
  }

  
  emitToRole(role: string, event: string, payload: any) {
    this.onlineUsers.get(role)?.forEach((socketId) => {
      this.server.to(socketId).emit(event, payload);
    });
  }
}
