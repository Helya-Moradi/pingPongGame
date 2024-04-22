const {WebSocketServer} = require('ws')

const server = new WebSocketServer({
    port: 8000,
})

const rooms = [];

server.on('connection', (client) => {
    client.on('error', (error) => {
        console.error('Error', error)
    })

    client.on('message', (buffer) => {
        const message = Buffer.from(buffer).toString('utf-8')
        const data = JSON.parse(message)

        if (data.action === 'join') {
            joinHandler(client, data.data)
        } else if (data.action === 'move') {
            moveHandler(client, data.data)
        }

    })

})

function joinHandler(client, data) {
    client.username = data.username;
    client.position = 768 / 2 - 50;
    client.score = 0;

    let room = rooms.find(r => r.length < 2)

    if (!room) {
        room = [];
        rooms.push(room)
    }

    room.push(client)
    client.room = room;

    if (room.length === 1) {
        client.send(JSON.stringify({
            action: 'wait',
        }))
    } else {
        room.forEach(c => {
            c.send(JSON.stringify({
                action: 'ready',
                data: room.map(cl => cl.username)
            }))
        })

        let ballPosition;
        let ballSpeed;

        function resetBall(){
             ballPosition = {
                left: 1366 / 2 - 15,
                top: 768 / 2 - 15,
            };

             const ballAngle = (Math.random() * 30 + 15) * (Math.sign(Math.random() - 0.5)) + (Math.random() > 0.5 ? 180 : 0);
             ballSpeed = {
                left: Math.cos(ballAngle * Math.PI / 180) * 8 + 5,
                top: Math.sin(ballAngle * Math.PI / 180) * 8 + 5,
            };
        }

        resetBall()

        setInterval(() => {
            if (ballPosition.top < room[0].position + 100  && ballPosition.top + 30 > room[0].position && ballPosition.left < 40) {
                ballSpeed.left *= -1;
            }
            if (ballPosition.top < room[1].position + 100 && ballPosition.top + 30 > room[1].position && ballPosition.left + 30 > 1366-40) {
                ballSpeed.left *= -1;
            }

            ballPosition.left += ballSpeed.left;
            ballPosition.top += ballSpeed.top;

            let sendScore=false;
            if (ballPosition.left < 0) {
                room[1].score+=1;
                sendScore=true;
            }
            if (ballPosition.left + 30 > 1366) {
                room[0].score+=1;
                sendScore=true;
            }

            if(sendScore){
                resetBall()
            }

            if (ballPosition.top < 0 || ballPosition.top > 768 - 30) {
                ballSpeed.top *= -1;
            }

            ballPosition.top = Math.max(0, Math.min(ballPosition.top, 768 - 30));

            room.forEach(cl => {
                cl.send(JSON.stringify({
                    action: 'ball',
                    data: {
                        position: ballPosition
                    }
                }))

                if(sendScore){
                    cl.send(JSON.stringify({
                        action: 'score',
                        data: room.map(c => c.score)
                    }))
                }
            })
        }, 1000 / 30)
    }
}

function moveHandler(client, data) {
    client.position = data.position;

    const otherClient = client.room.find(cl => cl !== client)
    if (otherClient) {
        otherClient.send(JSON.stringify({
            action: 'moved',
            data: {
                position: data.position
            }
        }))
    }
}