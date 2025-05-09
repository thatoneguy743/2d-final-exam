const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const player1ScoreElem = document.getElementById('player1Score');
const player2ScoreElem = document.getElementById('player2Score');
const levelElem = document.getElementById('level');
const startButton = document.getElementById('startButton');
const healthBars = document.getElementById('healthBars');
const player1HealthFill = document.getElementById('player1HealthFill');
const player2HealthFill = document.getElementById('player2HealthFill');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');
  // player and enemies info //
const playerWidth = 50;
const playerHeight = 60;
const swordLength = 40;
const swordWidth = 10;
let swordSpeed = 10;
let playerSpeed = 5;
let level = 1;
let enemies = [];
console.log('wtf');

const player1 = {
  x: 100,
  y: canvas.height / 2,
  color: 'red',
  controls: { left: 'a', right: 'd', up: 'w', down: 's', sword: ' ' },
  direction: 'right',
  score: 0,
  health: 100
};

const player2 = {
  x: canvas.width - 150,
  y: canvas.height / 2,
  color: 'blue',
  controls: { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', sword: 'Enter' },
  direction: 'left',
  score: 0,
  health: 100
};

const blasterSound = new Audio("https://www.soundjay.com/button/sounds/beep-07.mp3");
function playBlasterSound() {
  if (!blasterSound) return;
  try {
    blasterSound.currentTime = 0;
    blasterSound.play();
  } catch (e) {
    console.warn('Blaster sound failed to play:', e);
  }
}

}
// Unlock audio playback on first user interaction
window.addEventListener('click', () => {
  blasterSound.play().then(() => {
    blasterSound.pause();
    blasterSound.currentTime = 0;
  }).catch(() => {});
}, { once: true });


let sword1 = null;
let sword2 = null;
let keysPressed = {};
let gameRunning = false;

document.addEventListener('keydown', (e) => keysPressed[e.key] = true);
document.addEventListener('keyup', (e) => keysPressed[e.key] = false);

startButton.addEventListener('click', () => {
  // Unlock audio
  blasterSound.play().then(() => {
    blasterSound.pause();
    blasterSound.currentTime = 0;
  }).catch(() => {});

  // Start game logic
  startButton.style.display = 'none';
  document.getElementById('gameInfo').style.display = 'block';
  healthBars.style.display = 'block';
  spawnEnemies(level + 1);
  gameRunning = true;
  gameLoop();
}, { once: true });


function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (player1.health > 0) {
    updatePlayer(player1, player1.controls, () => {
      if (!sword1) sword1 = createSword(player1);
    });
  }

  if (player2.health > 0) {
    updatePlayer(player2, player2.controls, () => {
      if (!sword2) sword2 = createSword(player2);
    });
  }

  drawPlayer(player1);
  drawPlayer(player2);

  handleSword(sword1, () => sword1 = null);
  handleSword(sword2, () => sword2 = null);

  updateEnemies();
  drawEnemies();

  checkCollisions();
  checkPlayerDamage();

  updateScore();
  updateHealthBars();

  if (player1.health <= 0 && player2.health <= 0) {
    endGame();
    return;
  }

  requestAnimationFrame(gameLoop);
}

let lastSwordTime = 0;

function updatePlayer(player, controls, fireSword) {
  if (keysPressed[controls.left] && player.x > 0) {
    player.x -= playerSpeed;
    player.direction = 'left';
  }
  if (keysPressed[controls.right] && player.x + playerWidth < canvas.width) {
    player.x += playerSpeed;
    player.direction = 'right';
  }
  if (keysPressed[controls.up] && player.y > 0) {
    player.y -= playerSpeed;
    player.direction = 'up';
  }
  if (keysPressed[controls.down] && player.y + playerHeight < canvas.height) {
    player.y += playerSpeed;
    player.direction = 'down';
  }

  const now = performance.now();
  if (keysPressed[controls.sword] && now - lastSwordTime > 300) {
    lastSwordTime = now;
    fireSword();
    playBlasterSound();
  }
}



function createSword(player) {
  const dir = { x: 0, y: 0 };
  if (player.direction === 'right') dir.x = 1;
  if (player.direction === 'left') dir.x = -1;
  if (player.direction === 'up') dir.y = -1;
  if (player.direction === 'down') dir.y = 1;

  return {
    x: player.x + playerWidth / 2,
    y: player.y + playerHeight / 2,
    direction: dir,
    color: player.color
  };
}

function handleSword(sword, clear) {
  if (!sword) return;
  ctx.fillStyle = sword.color;
  ctx.fillRect(sword.x, sword.y, swordWidth, swordLength);
  sword.x += swordSpeed * sword.direction.x;
  sword.y += swordSpeed * sword.direction.y;

  if (
    sword.x < 0 || sword.x > canvas.width ||
    sword.y < 0 || sword.y > canvas.height
  ) clear();
}

function drawPlayer(player) {
  if (player.health <= 0) return;
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, playerWidth, playerHeight);
}

function spawnEnemies(count) {
  enemies = [];
  for (let i = 0; i < count; i++) {
    enemies.push({
      x: Math.random() * (canvas.width - 60) + 30,
      y: Math.random() * (canvas.height - 60) + 30,
      health: 100,
      color: 'green',
      speed: 1.5
    });
  }

  // Revive players if only one was alive
  if (player1.health <= 0 && player2.health > 0) revivePlayer(player1);
  if (player2.health <= 0 && player1.health > 0) revivePlayer(player2);
}

function updateEnemies() {
  enemies.forEach(enemy => {
    const target = (player1.health > 0 && player2.health > 0)
      ? (Math.random() < 0.5 ? player1 : player2)
      : (player1.health > 0 ? player1 : player2);
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    enemy.x += (dx / dist) * enemy.speed;
    enemy.y += (dy / dist) * enemy.speed;
  });
}

function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, playerWidth, playerHeight);
  });
}
 // how the enemies hurt the player /
function checkCollisions() {
  const allSwords = [sword1, sword2];
  allSwords.forEach((sword, i) => {
    if (!sword) return;

    enemies.forEach((enemy, index) => {
      if (
        sword.x < enemy.x + playerWidth &&
        sword.x + swordWidth > enemy.x &&
        sword.y < enemy.y + playerHeight &&
        sword.y + swordLength > enemy.y
      ) {
        // enemies health and scoring/
        enemy.health -= 50;
        if (enemy.health <= 0) {
          animateEnemyDeath(enemy);
          enemies.splice(index, 1);
          (i === 0 ? player1 : player2).score++;
          if (enemies.length === 0) {
            level++;
            levelElem.textContent = `Level: ${level}`;
            spawnEnemies(level + 1);
          }
        }
        if (i === 0) sword1 = null;
        if (i === 1) sword2 = null;
      }
    });
  });
}

function animateEnemyDeath(enemy) {
  const div = document.createElement('div');
  div.className = 'enemy-hit';
  div.style.left = canvas.offsetLeft + enemy.x + 'px';
  div.style.top = canvas.offsetTop + enemy.y + 'px';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 500);
}

function checkPlayerDamage() {
  enemies.forEach(enemy => {
    if (enemyCollides(enemy, player1)) {
      player1.health -= 0.5;
    }
    if (enemyCollides(enemy, player2)) {
      player2.health -= 0.5;
    }
  });
}
 // how the enemies do damage/
function enemyCollides(enemy, player) {
  return (
    player.health > 0 &&
    enemy.x < player.x + playerWidth &&
    enemy.x + playerWidth > player.x &&
    enemy.y < player.y + playerHeight &&
    enemy.y + playerHeight > player.y
  );
}
 // scoreing /
function updateScore() {
  player1ScoreElem.textContent = `Player 1: ${player1.score}`;
  player2ScoreElem.textContent = `Player 2: ${player2.score}`;
}
// player revive/ 
function updateHealthBars() {
  player1HealthFill.style.width = `${Math.max(player1.health, 0)}%`;
  player2HealthFill.style.width = `${Math.max(player2.health, 0)}%`;
 // player regen /
  if (player1.health > 0 && player1.health < 100) player1.health += 0.1;
  if (player2.health > 0 && player2.health < 100) player2.health += 0.1;
}
 // game over/
function endGame() {
  gameRunning = false;
  gameOverScreen.style.display = 'flex';
}
// also player revive/
function revivePlayer(player) {
  player.health = 50;

  const glow = document.createElement('div');
  glow.style.position = 'absolute';
  glow.style.width = `${playerWidth}px`;
  glow.style.height = `${playerHeight}px`;
  glow.style.borderRadius = '8px';
  glow.style.boxShadow = `0 0 20px 10px ${player.color}`;
  glow.style.left = canvas.offsetLeft + player.x + 'px';
  glow.style.top = canvas.offsetTop + player.y + 'px';
  glow.style.zIndex = 5;
  glow.style.animation = 'pulseGlow 1s ease-out';
  document.body.appendChild(glow);

  const message = document.createElement('div');
  message.textContent = `${player === player1 ? 'Player 1' : 'Player 2'} Revived!`;
  message.style.position = 'absolute';
  message.style.left = canvas.offsetLeft + player.x + 'px';
  message.style.top = canvas.offsetTop + player.y - 30 + 'px';
  message.style.color = 'white';
  message.style.fontSize = '20px';
  message.style.fontWeight = 'bold';
  message.style.textShadow = `0 0 5px ${player.color}`;
  message.style.animation = 'riseFade 1.2s ease-out';
  document.body.appendChild(message);

  setTimeout(() => {
    glow.remove();
    message.remove();
  }, 1200);
}

restartButton.addEventListener('click', () => {
  player1.health = 100;
  player2.health = 100;
  player1.score = 0;
  player2.score = 0;
  level = 1;
  enemies = [];
  sword1 = null;
  sword2 = null;

  levelElem.textContent = `Level: ${level}`;
  player1ScoreElem.textContent = `Player 1: 0`;
  player2ScoreElem.textContent = `Player 2: 0`;

  gameOverScreen.style.display = 'none';
  gameRunning = true;
  spawnEnemies(level + 1);
  gameLoop();
});

// Moved this OUTSIDE the event listener — was accidentally nested
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
// Easter Egg: Custom Konami Code
const easterEggCode = ['i', 'i', 'k', 'k', 'j', 'l', 'j', 'l', 'b', 'n', 'ShiftRight'];
let easterEggProgress = 0;

document.addEventListener('keydown', (e) => {
  const key = e.code === 'ShiftRight' ? 'ShiftRight' : e.key.toLowerCase();
  
  if (key === easterEggCode[easterEggProgress]) {
    easterEggProgress++;
    if (easterEggProgress === easterEggCode.length) {
      triggerEasterEgg();
      easterEggProgress = 0; // Reset after success
    }
  } else {
    easterEggProgress = 0; // Reset if wrong key
  }
});

function triggerEasterEgg() {
  alert('Easter Egg Activated! Super Health Mode!');
  player1.health = 200;
  player2.health = 200;
  updateHealthBars();
}
