// Constants and variables
let tileSize = 50;
let rows = 18;
let columns = 17;

let board;
let boardWidth = tileSize * columns;
let boardHeight = tileSize * rows;
let context;

// Ship
let shipWidth = tileSize * 1;
let shipHeight = tileSize;
let shipX = tileSize * columns / 2 - tileSize;
let shipY = tileSize * rows - tileSize * 1;

let ship = {
    x: shipX,
    y: shipY,
    width: shipWidth,
    height: shipHeight,
};

let shipImg;
let shipVelocityX = tileSize;

// Aliens
let alienArray = [];
let alienWidth = tileSize * 2;
let alienHeight = tileSize;
let alienX = tileSize;
let alienY = tileSize;
let alienImg;

let alienRows = 2;
let alienColumns = 3;
let alienCount = 0;
let alienVelocityX = 1;

// Bullets
let bulletArray = [];
let bulletVelocityY = -10;

// Alien Bullets
let alienBulletArray = [];
let alienBulletVelocityY = 5;

let score = 0;
let gameOver = false;

// Variable to track if the interval is set
let alienShootingIntervalSet = false;

window.onload = function () {
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");

    shipImg = new Image();
    shipImg.src = "./ship.png";
    shipImg.onload = function () {
        // Draw the initial ship
        context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);
    };

    alienImg = new Image();
    alienImg.src = "./alien.png";
    createAliens();

    // Start the game loop
    requestAnimationFrame(update);

    // Add event listeners for ship movement and shooting
    document.addEventListener("keydown", moveShip);
    document.addEventListener("keyup", shoot);

    // Function to set the alien shooting interval
    function setAlienShootingInterval() {
        if (!alienShootingIntervalSet) {
            setInterval(alienShootControl, 5); // 5 Millisekunden Intervall für das Alien-Schießen
            alienShootingIntervalSet = true;
        }
    }

    // Call the function to set the interval
    setAlienShootingInterval();
};

function update() {
    requestAnimationFrame(update);

    if (gameOver) {
        context.fillStyle = "text";
        context.font = "30px courier";
        context.fillText("Game Over", boardWidth / 2 - 75, boardHeight / 2 - 15);
        context.fillText("Press Space to Restart", boardWidth / 2 - 140, boardHeight / 2 + 25);

        // Check for Space key to restart the game
        document.addEventListener("keydown", function (e) {
            if (e.code == "Space") {
                resetGame();
            }
        });

        return;
    }

    // Clear the canvas
    context.clearRect(0, 0, board.width, board.height);

    // Draw the ship
    context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);

    // Move and draw aliens
    for (let i = 0; i < alienArray.length; i++) {
        let alien = alienArray[i];
        if (alien.alive) {
            alien.x += alienVelocityX;

            if (alien.x + alien.width >= board.width || alien.x <= 0) {
                alienVelocityX *= -1;
                alien.x += alienVelocityX * 2;

                for (let j = 0; j < alienArray.length; j++) {
                    alienArray[j].y += alienHeight;
                }
            }
            context.drawImage(alienImg, alien.x, alien.y, alien.width, alien.height);

            if (alien.y >= ship.y) {
                gameOver = true;
            }
        }
    }

    // Move and draw bullets
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        bullet.y += bulletVelocityY;
        context.fillStyle = "white";
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Check for bullet collision with aliens
        for (let j = 0; j < alienArray.length; j++) {
            let alien = alienArray[j];
            if (!bullet.used && alien.alive && detectCollision(bullet, alien)) {
                bullet.used = true;
                alien.alive = false;
                alienCount--;
                score += 20;
                bulletArray.splice(i, 1); // Remove the bullet from the array
                i--; // Decrement i to account for the removed bullet
            }
        }
    }

    // Move and draw alien bullets
    moveAlienBullets();

    // Clear alien bullets that are out of bounds and remove them if they hit the ship
    for (let i = 0; i < alienBulletArray.length; i++) {
        let alienBullet = alienBulletArray[i];
        alienBullet.y += alienBulletVelocityY;
        context.fillStyle = "red";
        context.fillRect(alienBullet.x, alienBullet.y, alienBullet.width, alienBullet.height);

        if (!alienBullet.used && detectCollision(alienBullet, ship)) {
            alienBullet.used = true;
            gameOver = true;
        }

        if (alienBullet.used || alienBullet.y >= board.height) {
            alienBulletArray.splice(i, 1); // Remove the alien bullet from the array
            i--; // Decrement i to account for the removed bullet
        }
    }

    // Next level logic
    if (alienCount == 0) {
        // Increase the number of aliens in columns and rows by 1
        alienColumns = Math.min(alienColumns + 1, columns / 2 - 2); // Cap at 16/2 - 2 = 6
        alienRows = Math.min(alienRows + 1, rows - 4); // Cap at 16 - 4 = 12
        alienVelocityX += 0.2; // Increase the alien movement speed
        alienArray = [];
        bulletArray = [];
        createAliens();
    }

    // Score display
    context.fillStyle = "text";
    context.font = "16px courier";
    context.fillText(score, 5, 20);
}

function moveShip(e) {
    if (gameOver) {
        return;
    }

    if (e.code == "ArrowLeft" && ship.x - shipVelocityX >= 0) {
        ship.x -= shipVelocityX;
    } else if (e.code == "ArrowRight" && ship.x + shipVelocityX + shipWidth <= board.width) {
        ship.x += shipVelocityX;
    }
}

function createAliens() {
    for (let c = 0; c < alienColumns; c++) {
        for (let r = 0; r < alienRows; r++) {
            let alien = {
                img: alienImg,
                x: alienX + c * alienWidth,
                y: alienY + r * alienHeight,
                width: alienWidth,
                height: alienHeight,
                alive: true,
            };

            alienArray.push(alien);
        }
    }
    alienCount = alienArray.length;
}

function shoot(e) {
    if (gameOver) {
        return;
    }
    if (e.code == "Space") {
        let bullet = {
            x: ship.x + shipWidth * 15 / 32,
            y: ship.y,
            width: tileSize / 8,
            height: tileSize / 2,
            used: false,
        };
        bulletArray.push(bullet);
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

function moveAlienBullets() {
    for (let i = 0; i < alienBulletArray.length; i++) {
        let alienBullet = alienBulletArray[i];
        alienBullet.y += alienBulletVelocityY;
        context.fillStyle = "red";
        context.fillRect(alienBullet.x, alienBullet.y, alienBullet.width, alienBullet.height);

        if (!alienBullet.used && detectCollision(alienBullet, ship)) {
            alienBullet.used = true;
            gameOver = true;
        }

        if (alienBullet.used || alienBullet.y >= board.height) {
            alienBulletArray.splice(i, 1); // Remove the alien bullet from the array
            i--; // Decrement i to account for the removed bullet
        }
    }
}

function alienShoot(alien) {
    let alienBullet = {
        x: alien.x + alien.width / 2,
        y: alien.y + alien
    


 .height,
        width: tileSize / 8,
        height: tileSize / 2,
        used: false,
    };
    alienBulletArray.push(alienBullet);
}

// Function to set the alien shooting interval
function setAlienShootingInterval() {
    if (!alienShootingIntervalSet) {
        setInterval(alienShootControl, 5); // 5 Milliseconds interval for alien shooting
        alienShootingIntervalSet = true;
    }
}

// Call the function to set the interval
setAlienShootingInterval();

// Function to reset the game
function resetGame() {
    score = 0;
    gameOver = false;
    ship.x = shipX;
    alienArray = [];
    bulletArray = [];
    createAliens();
    context.clearRect(0, 0, board.width, board.height);
    requestAnimationFrame(update);
}

