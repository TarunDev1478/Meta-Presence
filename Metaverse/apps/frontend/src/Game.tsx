import { useEffect, useRef, useState } from 'react';

const Arena = () => {
  const canvasRef = useRef<any>(null);
  const wsRef = useRef<any>(null);
  const [currentUser, setCurrentUser] = useState<any>({});
  const [users, setUsers] = useState(new Map());
  const [params, setParams] = useState({ token: '', spaceId: '' });
  const [spaceId, setId] = useState<string>();
  const [elements, setElements] = useState([]);
  const [sprites, setSprites] = useState<{
    left: HTMLImageElement[];
    right: HTMLImageElement[];
    up: HTMLImageElement[];
    down: HTMLImageElement[];
    idleLeft: HTMLImageElement[];
    idleRight: HTMLImageElement[];
    idleBack:HTMLImageElement[];
    idleFront:HTMLImageElement[];
  }>({
    left: [],
    right: [],
    up:[],
    down:[],
    idleLeft: [],
    idleRight: [],
    idleBack:[],
    idleFront:[]
  });
  const [lfcurrentFrame, setLfCurrentFrame] = useState(0);
  const [udcurrentFrame,setUpCurrentFrame] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' |'up'|'down'>('right');
  const [isMoving, setIsMoving] = useState(false);
  const frameRate = 50; 
  useEffect(() => {
    const loadSprites = () => {
      const leftSprites: HTMLImageElement[] = [];
      const rightSprites: HTMLImageElement[] = [];
      const backSprites: HTMLImageElement[] = [];
      const frontSprites: HTMLImageElement[] = [];
      const leftIdleSprites: HTMLImageElement[] = [];
      const rightIdleSprites: HTMLImageElement[] = [];
      const backIdleSprites: HTMLImageElement[] = [];
      const frontIdleSprites: HTMLImageElement[] = [];
      let totalImages = 15 * 7 + 14; // Total images to load
      let imagesLoaded = 0;
  
      const checkAllImagesLoaded = () => {
        if (imagesLoaded === totalImages) {
          setSprites({
            left: leftSprites,
            right: rightSprites,
            idleLeft: leftIdleSprites,
            idleRight: rightIdleSprites,
            idleBack: backIdleSprites,
            idleFront: frontIdleSprites,
            up: backSprites,
            down: frontSprites,
          });
          console.log("All images loaded successfully.");
        }
      };
  
      const loadImage = (
        src: string,
        targetArray: HTMLImageElement[],
        description: string
      ) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          console.log(`Loaded: ${description}`);
          targetArray.push(img);
          imagesLoaded++;
          checkAllImagesLoaded();
        };
        img.onerror = () => {
          console.error(`Failed to load: ${description}`);
          imagesLoaded++;
          checkAllImagesLoaded();
        };
      };
  
      // Load directional sprites (15 images each)
      for (let i = 1; i <= 15; i++) {
        loadImage(`/images//r${i}.png`, leftSprites, `Left Sprite ${i}`);
        loadImage(`/images/Right/r${i}.png`, rightSprites, `Right Sprite ${i}`);
        loadImage(`/images/back/r${i}.png`, backSprites, `Back Sprite ${i}`);
        loadImage(`/images/Front/r${i}.png`, frontSprites, `Front Sprite ${i}`);
        loadImage(`/images/l/${i}.png`, leftIdleSprites, `Left Idle ${i}`);
        loadImage(`/images/Right/${i}.png`, rightIdleSprites, `Right Idle ${i}`);
        loadImage(`/images/back/${i}.png`, backIdleSprites, `Back Idle ${i}`);
      }
  
      // Load idle front sprites (14 images)
      for (let i = 1; i <= 14; i++) {
        loadImage(`/images/Front/${i}.png`, frontIdleSprites, `Front Idle ${i}`);
      }
    };
  
    loadSprites();
  }, []);

  useEffect(() => {
    if (!isMoving) return;

    const interval = setInterval(() => {
      setLfCurrentFrame((prev) => (prev + 1) % 15);
       // 7 frames in the animation
    }, frameRate);

    // const interval2 = setInterval(() => {
    //   setUpCurrentFrame((prev) => (prev + 1) % 15); // 7 frames in the animation
    // }, frameRate);

    return () => {clearInterval(interval);}
  }, [isMoving]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || '';
    const spaceId = urlParams.get('spaceId') || '';
    setParams({ token, spaceId });
    setId(spaceId);
    // Initialize WebSocket
    wsRef.current = new WebSocket('ws://localhost:8080'); // Replace with your WS_URL

    wsRef.current.onopen = () => {
      // Join the space once connected
      wsRef.current.send(JSON.stringify({
        type: 'join',
        payload: {
          spaceId,
          token
        }
      }));
    };

    wsRef.current.onmessage = (event: any) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);


  useEffect(() => {
    const getSpace = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/v1/space/${spaceId}`, {
          method: "GET",
        });
        const data = await response.json();
        console.log(data.space.elements);
        setElements(data.space.elements);
      } catch (error) {
        console.error("Error fetching space data:", error);
      }
    };

    if (spaceId) {
      getSpace();
    }
  }, [spaceId]);
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'space-joined':
        console.log("set")
        console.log({
          x: message.payload.spawn.x,
          y: message.payload.spawn.y,
          userId: message.payload.userId
        })
        setCurrentUser({
          x: message.payload.spawn.x,
          y: message.payload.spawn.y,
          userId: message.payload.userId
        });

        const userMap = new Map();
        message.payload.users.forEach((user: any) => {
          userMap.set(user.userId, user);
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
        setUsers(prev => {
          const newUsers = new Map(prev);
          const user = newUsers.get(message.payload.userId);
          if (user) {
            user.x = message.payload.x;
            user.y = message.payload.y;
            newUsers.set(message.payload.userId, user);
          }
          return newUsers;
        });
        break;

      case 'movement-rejected':

        setCurrentUser((prev: any) => ({
          ...prev,
          x: message.payload.x,
          y: message.payload.y
        }));
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
    if (!currentUser) return;
  
    const userBoundingBox = {
      x: newX *10+300,
      y: newY *10+290,
      width: 20,
      height: 20,
    };
  
    const hasCollision = elements.some((element: any) => {
      const elementBoundingBox = {
        x: element.x,
        y: element.y,
        width: element.element.width,
        height: element.element.height,
      };
      return isCollision(userBoundingBox, elementBoundingBox);
    });
   console.log(hasCollision);
    if (hasCollision) {
      wsRef.current.send(
        JSON.stringify({
          type: "movement-rejected",
          payload: {
            x: currentUser.x,
            y: currentUser.y,
            userId: currentUser.userId,
          },
        })
      );
      console.log("Collision detected, movement rejected");
      return;
    }
  
    wsRef.current.send(
      JSON.stringify({
        type: "move",
        payload: {
          x: newX,
          y: newY,
          userId: currentUser.userId,
        },
      })
    );
  };
  
  const isCollision = (rect1: any, rect2: any) => {
    console.log(rect1.x+" "+rect1.y);
    console.log(rect2.x+" ",rect2.y);
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    if (currentUser && currentUser.x) {
      let spriteFrame;
    
      if (isMoving) {
        switch (direction) {
          case 'right':
            spriteFrame = sprites.right[lfcurrentFrame];
            break;
          case 'left':
            spriteFrame = sprites.left[lfcurrentFrame];
            break;
          case 'up':
            spriteFrame = sprites.up[lfcurrentFrame];
            break;
          case 'down':
            spriteFrame = sprites.down[lfcurrentFrame];
            break;
          default:
            spriteFrame = sprites.idleFront[lfcurrentFrame]; 
        }
      } else {
        switch (direction) {
          case 'right':
            spriteFrame = sprites.idleRight[lfcurrentFrame];
            break;
          case 'left':
            spriteFrame = sprites.idleLeft[lfcurrentFrame];
            break;
          case 'up':
            spriteFrame = sprites.idleBack[lfcurrentFrame];
            break;
          case 'down':
            spriteFrame = sprites.idleFront[lfcurrentFrame];
            break;
          default:
            spriteFrame = sprites.idleFront[lfcurrentFrame]; 
        }
      }
      if (spriteFrame instanceof HTMLImageElement) {
        ctx.drawImage(spriteFrame, currentUser.x * 10 - 15, currentUser.y * 10 - 15, 200, 200);
      }
      
    }
    

    users.forEach((user) => {
      if (!user.x) return;
      ctx.beginPath();
      ctx.fillStyle = '#4ECDC4';
      ctx.arc(user.x * 10, user.y * 10, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`User ${user.userId}`, user.x * 10, user.y * 10 + 40);
    });
  }, [currentUser, users, sprites, lfcurrentFrame, direction, isMoving]);




  const handleKeyDown = (e: any) => {
    if (!currentUser) return;

    const { x, y } = currentUser;
    setIsMoving(true); 

    switch (e.key) {
      case 'w':
        setDirection('up');
        handleMove(x, y - 1);
        break;
      case 's':
        setDirection('down');
        handleMove(x, y + 1);
        break;
      case 'a':
        setDirection('left');
        handleMove(x - 1, y);
        break;
      case 'd':
        setDirection('right');
        handleMove(x + 1, y);
        break;
    }
    
  };
  const handleKeyUp = (e: KeyboardEvent) => {
    const { key } = e;
    if (key === 'a' || key === 'd' || key==='w' || key==='s') {
      setIsMoving(false); 
      console.log(`Key released: ${key}`);
    }
  };


  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  return (
    <div className="p-4" onKeyDown={handleKeyDown} tabIndex={0}>
      <h1 className="text-2xl font-bold mb-4">Arena</h1>
      <div className="mb-4">
        <p className="text-sm text-gray-600">Token: {params.token}</p>
        <p className="text-sm text-gray-600">Space ID: {params.spaceId}</p>
        <p className="text-sm text-gray-600">Connected Users: {users.size + (currentUser ? 1 : 0)}</p>
      </div>
      <div style={{position:"relative",left:"-336px"}} className="border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={2000}
          height={2000}
          className="bg-white"

        />
      </div>
      <p className="mt-2 text-sm text-gray-500">Use arrow keys to move your avatar</p>
      {elements.map((element: any) => (
        <img
          key={element.id}
          src={element.element.imageUrl}
          alt="Element"
          style={{
            position: 'absolute',
            left: element.x , 
            top: element.y , 
            width: element.element.width,
            height: element.element.height,
          }}
        />
      ))}
    </div>
  );
};

export default Arena;  