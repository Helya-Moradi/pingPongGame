let username = localStorage.getItem('username');

if (!username) {
    username = prompt('username:')

    localStorage.setItem('username', username)
}

let ball = document.querySelector('.game .ball')
let players = document.querySelectorAll('.game .player')
let playersData = document.querySelectorAll('.game .playerData')
let playerIndex = null;
let isReady = false;

let playerSpeed = 10;
let playerPosition = 768 / 2 - 50;

const socket = new WebSocket('ws://192.168.3.6:8000')

socket.onopen = function (e) {
    socket.send(JSON.stringify({
        action: 'join',
        data: {
            username
        },
    }))
}

socket.onmessage = function (e) {
    const data = JSON.parse(e.data)

    if (data.action === 'wait') {
        playerIndex = 0;
        playersData[0].firstChild.textContent = username;
        playersData[0].lastChild.textContent = '0';

        playersData[1].firstChild.textContent = 'waiting for opponent'

    } else if (data.action === 'ready') {
        if (playerIndex === null) {
            playerIndex = 1;
        }
        playersData[0].firstChild.textContent = data.data[0];
        playersData[0].lastChild.textContent = '0';

        playersData[1].firstChild.textContent = data.data[1];
        playersData[1].lastChild.textContent = '0';
        isReady = true;

    } else if (data.action === 'moved') {

        const index = playerIndex === 0 ? 1 : 0;
        players[index].style.top = data.data.position + 'px';

    } else if (data.action === 'ball') {

        ball.style.top = data.data.position.top + 'px';
        ball.style.left = data.data.position.left + 'px';

    } else if(data.action === 'score'){
        playersData[0].lastChild.textContent = data.data[0];
        playersData[1].lastChild.textContent = data.data[1];
    }
}

socket.onclose = function (e) {

}

socket.onerror = function (error) {
    console.error(error)
}


document.addEventListener('keydown', (e) => {
    if (isReady) {
        let direction = null;

        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
            direction = -1;
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            direction = +1;
        }

        if (direction) {
            playerPosition += direction * playerSpeed;
            playerPosition = Math.max(0, Math.min(playerPosition, 768 - 100));

            socket.send(JSON.stringify({
                action: "move",
                data: {
                    position: playerPosition,
                },
            }));

            players[playerIndex].style.top = playerPosition + 'px';
        }
    }
})