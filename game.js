// Константы игры
const CANVAS_SIZE = 400;
const CELL_SIZE = 16;
const GRID_SIZE = CANVAS_SIZE / CELL_SIZE; // 25x25 ячеек

// Получаем canvas и контекст
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Состояние игры
let snake = [];
let food = {};
let direction = { x: 1, y: 0 }; // Начальное направление: вправо
let nextDirection = { x: 1, y: 0 };
let score = 0;
let gameRunning = true;
let gameSpeed = 500; // Интервал обновления в миллисекундах
let lastUpdateTime = 0;

// Состояние анимации поедания
let eatAnimation = null; // { x, y, progress, startTime }

// Инициализация аудио контекста для звуков
let audioContext = null;

// Инициализация игры
function initGame() {
    // Начальная позиция змейки в центре поля
    const startX = Math.floor(GRID_SIZE / 2);
    const startY = Math.floor(GRID_SIZE / 2);
    
    // Создаем змейку из 4 клеток
    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
        { x: startX - 3, y: startY }
    ];
    
    // Сбрасываем направление
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    gameRunning = true;
    eatAnimation = null; // Сбрасываем анимацию
    updateScore();
    
    // Генерируем первую еду
    generateFood();
}

// Генерация еды
function generateFood() {
    let foodPosition;
    let isOnSnake;
    
    do {
        foodPosition = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        
        // Проверяем, не находится ли еда на змейке
        isOnSnake = snake.some(segment => 
            segment.x === foodPosition.x && segment.y === foodPosition.y
        );
    } while (isOnSnake);
    
    food = foodPosition;
}

// Обновление счета
function updateScore() {
    scoreElement.textContent = score;
}

// Отрисовка одной клетки
function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
}

// Отрисовка змейки
function drawSnake() {
    snake.forEach((segment, index) => {
        // Голова змейки немного ярче
        if (index === 0) {
            drawCell(segment.x, segment.y, '#4ade80');
        } else {
            drawCell(segment.x, segment.y, '#22c55e');
        }
    });
}

// Отрисовка еды
function drawFood() {
    // Еда - красный квадрат размером 15x15 пикселей
    ctx.fillStyle = '#ef4444';
    const pixelX = food.x * CELL_SIZE + (CELL_SIZE - 15) / 2;
    const pixelY = food.y * CELL_SIZE + (CELL_SIZE - 15) / 2;
    ctx.fillRect(pixelX, pixelY, 15, 15);
}

// Отрисовка анимации поедания еды
function drawEatAnimation(currentTime) {
    if (!eatAnimation) return;
    
    const elapsed = currentTime - eatAnimation.startTime;
    const duration = 300; // Длительность анимации в миллисекундах
    const progress = Math.min(elapsed / duration, 1);
    
    // Эффект пульсации: размер меняется от 15 до 25 и обратно
    const baseSize = 15;
    const maxSize = 25;
    const pulse = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5; // От 0 до 1
    const size = baseSize + (maxSize - baseSize) * pulse;
    
    // Эффект мерцания: прозрачность меняется
    const alpha = 1 - progress * 0.5; // Постепенно исчезает
    
    const pixelX = eatAnimation.x * CELL_SIZE + (CELL_SIZE - size) / 2;
    const pixelY = eatAnimation.y * CELL_SIZE + (CELL_SIZE - size) / 2;
    
    // Рисуем пульсирующий квадрат с эффектом свечения
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Внешнее свечение
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff6b6b';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(pixelX, pixelY, size, size);
    
    // Внутренний яркий квадрат
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd700';
    const innerSize = size * 0.6;
    const innerX = pixelX + (size - innerSize) / 2;
    const innerY = pixelY + (size - innerSize) / 2;
    ctx.fillRect(innerX, innerY, innerSize, innerSize);
    
    ctx.restore();
    
    // Если анимация завершена, очищаем её
    if (progress >= 1) {
        eatAnimation = null;
    }
}

// Отрисовка сетки (опционально, для визуализации)
function drawGrid() {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
        // Вертикальные линии
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();
        
        // Горизонтальные линии
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
    }
}

// Отрисовка всего игрового поля
function draw(currentTime) {
    // Очищаем canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Отрисовываем сетку
    drawGrid();
    
    // Отрисовываем еду (только если нет активной анимации на этом месте)
    if (!eatAnimation || eatAnimation.x !== food.x || eatAnimation.y !== food.y) {
        drawFood();
    }
    
    // Отрисовываем змейку
    drawSnake();
    
    // Отрисовываем анимацию поедания (если есть)
    if (eatAnimation && currentTime) {
        drawEatAnimation(currentTime);
    }
}

// Воспроизведение звука поедания еды
function playEatSound() {
    try {
        // Инициализируем AudioContext при первом использовании
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Создаем простой звук "поедания" через Web Audio API
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Подключаем узлы
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Настройки звука: короткий "поп" звук
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        // Огибающая громкости: быстро затухает
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        // Тип волны для более приятного звука
        oscillator.type = 'sine';
        
        // Воспроизводим звук
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // Игнорируем ошибки аудио (например, если браузер требует взаимодействия пользователя)
        console.log('Аудио недоступно:', error);
    }
}

// Запуск анимации поедания еды
function startEatAnimation(x, y, currentTime) {
    eatAnimation = {
        x: x,
        y: y,
        startTime: currentTime
    };
}

// Проверка столкновения змейки с собой
function checkSelfCollision() {
    const head = snake[0];
    
    // Проверяем столкновение головы с телом
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Обновление состояния игры
function update(currentTime) {
    if (!gameRunning) {
        return;
    }
    
    // Ограничиваем частоту обновления
    if (currentTime - lastUpdateTime < gameSpeed) {
        requestAnimationFrame(update);
        return;
    }
    
    lastUpdateTime = currentTime;
    
    // Обновляем направление
    direction = { ...nextDirection };
    
    // Вычисляем новую позицию головы
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // Циклическое движение через границы
    if (head.x < 0) {
        head.x = GRID_SIZE - 1;
    } else if (head.x >= GRID_SIZE) {
        head.x = 0;
    }
    
    if (head.y < 0) {
        head.y = GRID_SIZE - 1;
    } else if (head.y >= GRID_SIZE) {
        head.y = 0;
    }
    
    // Добавляем новую голову
    snake.unshift(head);
    
    // Проверяем, съела ли змейка еду
    if (head.x === food.x && head.y === food.y) {
        // Запускаем анимацию и звук поедания
        startEatAnimation(food.x, food.y, currentTime);
        playEatSound();
        
        // Обновляем счет
        score++;
        updateScore();
        
        // Генерируем новую еду
        generateFood();
    } else {
        // Если не съела, удаляем хвост
        snake.pop();
    }
    
    // Проверяем столкновение с собой
    if (checkSelfCollision()) {
        // Рестарт игры
        setTimeout(() => {
            initGame();
        }, 500);
        gameRunning = false;
    }
    
    // Перерисовываем (передаем currentTime для анимации)
    draw(currentTime);
    
    // Продолжаем игровой цикл
    requestAnimationFrame(update);
}

// Изменение направления движения (общая функция для клавиатуры и кнопок)
function changeDirection(newDirection) {
    // Предотвращаем движение в противоположном направлении
    if (newDirection.x === 0 && newDirection.y === -1) {
        // Вверх
        if (direction.y === 0) {
            nextDirection = { x: 0, y: -1 };
        }
    } else if (newDirection.x === 0 && newDirection.y === 1) {
        // Вниз
        if (direction.y === 0) {
            nextDirection = { x: 0, y: 1 };
        }
    } else if (newDirection.x === -1 && newDirection.y === 0) {
        // Влево
        if (direction.x === 0) {
            nextDirection = { x: -1, y: 0 };
        }
    } else if (newDirection.x === 1 && newDirection.y === 0) {
        // Вправо
        if (direction.x === 0) {
            nextDirection = { x: 1, y: 0 };
        }
    }
}

// Обработка нажатий клавиш
function handleKeyPress(event) {
    // Проверяем, что это курсорные клавиши
    const key = event.key;
    
    switch (key) {
        case 'ArrowUp':
            changeDirection({ x: 0, y: -1 });
            event.preventDefault();
            break;
        case 'ArrowDown':
            changeDirection({ x: 0, y: 1 });
            event.preventDefault();
            break;
        case 'ArrowLeft':
            changeDirection({ x: -1, y: 0 });
            event.preventDefault();
            break;
        case 'ArrowRight':
            changeDirection({ x: 1, y: 0 });
            event.preventDefault();
            break;
    }
}

// Инициализация виртуальных кнопок управления
function initVirtualControls() {
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    
    // Обработчики кликов
    btnUp.addEventListener('click', () => {
        changeDirection({ x: 0, y: -1 });
    });
    
    btnDown.addEventListener('click', () => {
        changeDirection({ x: 0, y: 1 });
    });
    
    btnLeft.addEventListener('click', () => {
        changeDirection({ x: -1, y: 0 });
    });
    
    btnRight.addEventListener('click', () => {
        changeDirection({ x: 1, y: 0 });
    });
    
    // Поддержка touch событий для мобильных устройств
    btnUp.addEventListener('touchstart', (e) => {
        e.preventDefault();
        changeDirection({ x: 0, y: -1 });
    });
    
    btnDown.addEventListener('touchstart', (e) => {
        e.preventDefault();
        changeDirection({ x: 0, y: 1 });
    });
    
    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        changeDirection({ x: -1, y: 0 });
    });
    
    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        changeDirection({ x: 1, y: 0 });
    });
}

// Запуск игры
function startGame() {
    initGame();
    draw(performance.now());
    requestAnimationFrame(update);
}

// Добавляем обработчик клавиатуры
document.addEventListener('keydown', handleKeyPress);

// Запускаем игру при загрузке страницы
window.addEventListener('load', () => {
    initVirtualControls();
    startGame();
});

