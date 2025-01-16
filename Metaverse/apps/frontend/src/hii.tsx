import React, { useEffect, useRef, useState } from 'react';

interface User {
  x: number;
  y: number;
  userId: string;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

const Arena = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [params, setParams] = useState({ token: '', spaceId: '' });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || '';
    const spaceId = urlParams.get('spaceId') || '';
    setParams({ token, spaceId });

    wsRef.current = new WebSocket('ws://localhost:8080');
    
    wsRef.current.onopen = () => {
      wsRef.current?.send(JSON.stringify({
        type: 'join',
        payload: { spaceId, token }
      }));
    };

    wsRef.current.onmessage = (event: MessageEvent) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    return () => wsRef.current?.close();
  }, []);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'space-joined':
        const newUser = {
          x: message.payload.spawn.x,
          y: message.payload.spawn.y,
          userId: message.payload.userId
        };
        console.log('Setting current user:', newUser);
        setCurrentUser(newUser);
        
        const userMap = new Map<string, User>();
        message.payload.users.forEach((user: User) => {
          if (user.userId !== message.payload.userId) {
            userMap.set(user.userId, user);
          }
        });
        setUsers(userMap);
        break;

      case 'user-joined':
        setUsers(prev => {
          const newUsers = new Map(prev);
          newUsers.set(message.payload.userId, {
            x: message.payload.x,
            y: message.payload.y,
            userId: message.payload.userId
          });
          return newUsers;
        });
        break;

      case 'movement':
        if (message.payload.userId === currentUser?.userId) {
          setCurrentUser(prev => prev ? ({
            ...prev,
            x: message.payload.x,
            y: message.payload.y
          }) : null);
        } else {
          setUsers(prev => {
            const newUsers = new Map(prev);
            newUsers.set(message.payload.userId, {
              x: message.payload.x,
              y: message.payload.y,
              userId: message.payload.userId
            });
            return newUsers;
          });
        }
        break;

      case 'user-left':
        setUsers(prev => {
          const newUsers = new Map(prev);
          newUsers.delete(message.payload.userId);
          return newUsers;
        });
        break;
    }
  };

  const handleMove = (newX: number, newY: number) => {
    if (!wsRef.current || !currentUser) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'move',
      payload: {
        x: newX,
        y: newY,
        userId: currentUser.userId
      }
    }));

    setCurrentUser(prev => prev ? ({
      ...prev,
      x: newX,
      y: newY
    }) : null);
  };

  useEffect(() => {
         const canvas = canvasRef.current;
         if (!canvas) return;
  
         const ctx = canvas.getContext('2d');
         if (!ctx) return;
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         // Draw grid
         ctx.strokeStyle = '#eee';
         for (let i = 0; i < canvas.width; i += 50) {
           ctx.beginPath();
           ctx.moveTo(i, 0);
           ctx.lineTo(i, canvas.height);
           ctx.stroke();
         }
         for (let i = 0; i < canvas.height; i += 50) {
           ctx.beginPath();
           ctx.moveTo(0, i);
           ctx.lineTo(canvas.width, i);
           ctx.stroke();
         }

         users.forEach(user => {
                   if (user.x === undefined) return;
                   ctx.beginPath();
                   ctx.fillStyle = '#4ECDC4';
                   ctx.arc(user.x, user.y, 20, 0, Math.PI * 2);
                   ctx.fill();
                   ctx.fillStyle = '#000';
                   ctx.font = '14px Arial';
                   ctx.textAlign = 'center';
                   ctx.fillText(`User ${user.userId}`, user.x, user.y + 40);
                 });
            
                 if (currentUser) {
                   ctx.beginPath();
                //    ctx.fillStyle = isMoving ? '#FFB6B6' : '#FF6B6B';
                   ctx.arc(currentUser.x, currentUser.y, 20, 0, Math.PI * 2);
                   ctx.fill();
                   ctx.fillStyle = '#000';
                   ctx.font = '14px Arial';
                   ctx.textAlign = 'center';
                   ctx.fillText('You', currentUser.x, currentUser.y + 40);
                 }
  }, [currentUser, users]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!currentUser) return;

    const { x, y } = currentUser;
    switch (e.key) {
      case 'ArrowUp':
        handleMove(x, y - 1);
        break;
      case 'ArrowDown':
        handleMove(x, y + 1);
        break;
      case 'ArrowLeft':
        handleMove(x - 1, y);
        break;
      case 'ArrowRight':
        handleMove(x + 1, y);
        break;
    }
  };

  return (
    <div 
      className="p-4" 
      onKeyDown={handleKeyDown} 
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <h1 className="text-2xl font-bold mb-4">Arena</h1>
      <div className="mb-4">
        <p className="text-sm text-gray-600">Token: {params.token}</p>
        <p className="text-sm text-gray-600">Space ID: {params.spaceId}</p>
        <p className="text-sm text-gray-600">Connected Users: {users.size + (currentUser ? 1 : 0)}</p>
        <p className="text-sm text-gray-600">Current Position: ({currentUser?.x || 0}, {currentUser?.y || 0})</p>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={2000}
          height={2000}
          className="bg-white"
        />
      </div>
      <p className="mt-2 text-sm text-gray-500">Use arrow keys to move your avatar</p>
    </div>
  );
};

export default Arena;