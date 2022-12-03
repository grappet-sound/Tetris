var gameDisplay = document.getElementById("gameDisplay");

var ctx = gameDisplay.getContext('2d');

var nextDisplay = document.getElementById("nextDisplay");
var nextCtx = nextDisplay.getContext('2d');

var requestId = null;
var time = {start: 0, elapsed: 0, level: 1000};

var scoreDisplay = document.getElementById("score");
var accountValues = {
    score : 0,
    lines : 0,
    level : 0
};

var gameOverDisplay = document.getElementById("gameOver");
var gScoreDisplay = document.getElementById("gScore");
var hScoreDisplay = document.getElementById("hScore");

var highscore = 0;
highscore = localStorage.getItem("highscore");
if(!highscore) highscore = 0;

function updateUI(){
    scoreDisplay.innerHTML = accountValues.score;
}

ctx.canvas.width = COLS * BLOCKSIZE;
ctx.canvas.height = ROWS * BLOCKSIZE;

ctx.scale(BLOCKSIZE, BLOCKSIZE);

nextCtx.canvas.width = 5 * BLOCKSIZE;
nextCtx.canvas.height = 4 * BLOCKSIZE;

nextCtx.scale(BLOCKSIZE, BLOCKSIZE);

class Board {
    piece;
    grid;
    next;

    getNewBoard(){
        this.grid = [];
        for(var i = 0; i < ROWS; i++){
            var row = [];
            for(var j = 0; j < COLS; j++){
                row.push(0);
            }
            this.grid.push(row);
        }
    }

    valid(p){
        for(var row = 0; row < p.shape.length; row++){
            for(var col = 0; col<p.shape[0].length; col++){
                var x = p.x + col;
                var y = p.y + row;
                if(p.shape[row][col] == 0) continue;
                if(!this.insideWalls(x, y) || !this.notOccupied(x, y)) return false;
            }
        }
        return true; 
    }
    insideWalls(x, y){
        if(x < 0) return false;
        if(x >= COLS) return false;
        if(y >= ROWS) return false;
        return true;
    }

    notOccupied(x, y){
        return this.grid[y][x] === 0;
    }
    draw(){
        this.piece.draw();
        this.drawBoard();
    }
    drop(){
        var p = moves[KEY.DOWN](this.piece);
        if(this.valid(p)){
            this.piece.move(p);
        }else{
            //freeze and new piece
            this.freeze();
            this.clearLines();
            if(this.piece.y === 0){
                return false;
            }
            this.piece = this.next;
            this.piece.setStartingPosition();
            this.piece.ctx = ctx;
            this.getNewPiece();
        }
        return true;
    }
    freeze(){
        for(var row = 0; row < this.piece.shape.length; row++){
            for(var col = 0; col < this.piece.shape.length; col++){
                if(this.piece.shape[row][col] > 0){
                    this.grid[this.piece.y + row][this.piece.x + col] = this.piece.shape[row][col];
                }
            }
        }
    }
    drawBoard(){
        for(var row = 0; row < ROWS; row++){
            for(var col = 0; col < COLS; col++){
                if(this.grid[row][col] > 0){
                    var value = this.grid[row][col];
                    ctx.fillStyle = TETROMINO[value - 1].color;
                    ctx.fillRect(col, row, 1, 1);
                }
            }
        }
    }
    getNewPiece(){
        const {width, height} = nextCtx.canvas;
        this.next = new Piece(nextCtx);
        nextCtx.clearRect(0, 0, width, height);
        this.next.x = 1;
        this.next.y = 1;

        this.next.draw();
    }

    clearLines(){
        var lines = 0;
        for(var row = 0; row < ROWS; row++){
            var line = true;
            for(var col = 0; col < COLS; col++){
                if(this.grid[row][col] === 0){
                    line = false;
                    break;
                }
            }
            if(line){
                lines++;
                this.grid.splice(row, 1);
                this.grid.unshift( Array(COLS).fill(0) );
            }
        }
        if(lines > 0){
            if(lines == 1) accountValues.score += POINT.SINGLE * (accountValues.level + 1);
            else if(lines == 2) accountValues.score += POINT.DOUBLE * (accountValues.level + 1);
            else if(lines == 3) accountValues.score += POINT.TRIPLET * (accountValues.level + 1);
            else if(lines == 4) accountValues.score += POINT.TETRIS * (accountValues.level + 1);
            updateUI();

            accountValues.lines += lines;

            if(accountValues.lines >= LINES_PER_LEVEL){
                accountValues.level ++;
                accountValues.lines -= LINES_PER_LEVEL;
                time.level = LEVEL[accountValues.level];
            }
        }
    }
}

class Piece {
    x;
    y;
    color;
    shape;
    ctx;

    constructor(ctx){
        this.ctx = ctx;
        this.spawn();
    }

    setStartingPosition(){
        this.x = 3;
        this.y = 0;
    }

    spawn(){
        var typeId = Math.floor(Math.random()*7);
        this.color = TETROMINO[typeId].color;
        this.shape = TETROMINO[typeId].shape;
        this.x = 3;
        this.y = 0;
    }

    draw(){
        this.ctx.fillStyle = this.color;
        for(var row = 0; row < this.shape.length; row++){
            for(var col = 0; col<this.shape[0].length; col++){
                if(this.shape[row][col] > 0){
                    this.ctx.fillRect(this.x + col, this.y + row, 1, 1);
                }
            }
        }
    }
    move(p){
        this.x = p.x;
        this.y = p.y;
    }
    rotate(piece){
        var p = JSON.parse(JSON.stringify(piece));
        for(var y = 0; y < p.shape.length; y++){
            for(var x = 0; x < y; x++){
                [p.shape[x][y], p.shape[y][x]] = [p.shape[y][x], p.shape[x][y]];
            }
        }
        p.shape.forEach((row) => row.reverse());

        if(gameBoard.valid(p)){
            this.shape = p.shape;
        }
    }
}

var gameBoard = new Board();


function gameStart(){
    gameOverDisplay.style.visibility = "hidden";
    accountValues.level = 0;
    accountValues.score = 0;
    accountValues.line = 0;
    updateUI();
    time = {start: performance.now(), elapsed: 0, level: LEVEL[accountValues.level]};

    gameBoard.getNewBoard();
    console.table(gameBoard.grid);

    var piece = new Piece(ctx);
    piece.draw();
    gameBoard.piece = piece;
    gameBoard.getNewPiece();
    animate();
}




const moves = {
    [KEY.LEFT]: (p) => ({...p, x: p.x - 1}),
    [KEY.RIGHT]: (p) => ({...p, x: p.x + 1}),
    [KEY.DOWN]: (p) => ({...p, y: p.y + 1})
}

document.addEventListener('keydown', event =>{
    if(moves[event.keyCode]){
        var p = moves[event.keyCode](gameBoard.piece);
        if(gameBoard.valid(p)){
            gameBoard.piece.move(p);
            if(event.keyCode == KEY.DOWN){
                accountValues.score += POINT.SOFT_DROP;
                updateUI();
            }

            
        }
        
    }
    if(event.keyCode === KEY.SPACE){
        var p = moves[KEY.DOWN](gameBoard.piece);
        while(gameBoard.valid(p)){
            gameBoard.piece.move(p);
            p = moves[KEY.DOWN](gameBoard.piece);
            accountValues.score += POINT.HARD_DROP;
        }
        updateUI();
    }
    if(event.keyCode === KEY.UP){
        gameBoard.piece.rotate(gameBoard.piece);
        
    } 
});


function animate(now = 0){
    time.elapsed = now - time.start;
    if(time.elapsed > time.level){
        time.start = now;
        if(!gameBoard.drop()){
            //gameover
            gameOver();
            return
        }

    }
    ctx.clearRect(0, 0, COLS, ROWS);
    gameBoard.draw();
    requestId = requestAnimationFrame(animate);
}

function gameOver(){
    gameOverDisplay.style.visibility = "visible";
    gScoreDisplay.innerHTML = accountValues.score;
    if(highscore < accountValues.score){
        highscore = accountValues.score;
        localStorage.setItem("highscore", highscore);
    }
    hScoreDisplay.innerHTML = highscore;
}