'use strict'

const SIZE = 8;
const HANDS = ["rock", "paper", "scissors"];
const INITIAL_DURABILITY = 1;
const ANIM_TIME = 0.5;

const getRandomHand = () => HANDS[Math.floor(Math.random() * HANDS.length)];
const getRandomDurability = () => Math.random() < 0.5 / (1. + 1000 / score) ? 2 : INITIAL_DURABILITY;

const getInitialGrid = () =>
  Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ hand: getRandomHand(), durability: INITIAL_DURABILITY }))
  );

const beats = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};

const handColors = {
  rock: "#7f3f3f",
  paper: "#3f7f3f",
  scissors: "#3f3f7f",
};

const handColorDurable = "#2f2f2f";

const handColorsHighlighted = {
    rock: "rgba(191, 127, 127, 0)",
    paper: "rgba(127, 191, 127, 0)",
    scissors: "rgba(127, 127, 191, 0)",
};

const handEmojis = {
    rock: "👊",
    paper: "✋",
    scissors: "✌️"
};
  
let grid = getInitialGrid();
let score = 0;
let erasing = [];
let toErase = [];

const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

function handleClick(row, col) {
    if (toErase.length) return; // Previous erasure is ongoing
    const cell = grid[row][col];
    const hand = cell.hand;
    const target = beats[hand];

    const setFlashing = cell => {
        const cellElem = cell.elem;
        cellElem.style.transition = "";
        cellElem.style.backgroundColor = "#cf0000";
        if (1 < cell.durability) {
            cellElem.style.border = "3px solid red";
        }
        // Set timeout immediately to show flashing
        setTimeout(() => {
            if (1 < cell.durability) {
                cellElem.style.transition = `border ${ANIM_TIME}s, background ${ANIM_TIME}s`;
                cellElem.style.border = "3px solid gray";
                cellElem.style.backgroundColor = handColorDurable;
            }
            else {
                cellElem.style.transition = `background ${ANIM_TIME}s`;
                cellElem.style.backgroundColor = handColors[cell.hand];
            }
        });
    };

    if (1 < cell.durability) {
        setFlashing(cell);
        return;
    }

    const surroundingTargets = directions.filter(([dr, dc]) => {
      const nr = row + dr;
      const nc = col + dc;
      return nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && grid[nr][nc].hand === target && grid[nr][nc].durability <= 1;
    });

    if (surroundingTargets.length < 2) {
        setFlashing(cell);

        for (let [dr, dc] of surroundingTargets) {
            const [nr, nc] = [row + dr, col + dc];
            setFlashing(grid[nr][nc]);
        }
        return;
    }

    const visited = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

    const dfs = (r, c) => {
      if (
        r < 0 ||
        c < 0 ||
        r >= SIZE ||
        c >= SIZE ||
        visited[r][c]
      )
        return;
      visited[r][c] = true;
      // If the cell is durable, it won't allow erasure to propagate, but itself will have
      // reduced durability.
      if (1 < grid[r][c].durability) {
        toErase.push([r, c]);
        return;
      }
      if (grid[r][c].hand !== target) return;
      toErase.push([r, c]);
      dfs(r - 1, c);
      dfs(r + 1, c);
      dfs(r, c - 1);
      dfs(r, c + 1);
    };

    directions.forEach(([dr, dc]) => dfs(row + dr, col + dc));

    for (let cid of toErase) {
        const erasingCell = grid[cid[0]][cid[1]];
        const cellElem = erasingCell.elem;
        if (1 < erasingCell.durability) {
            cellElem.style.transition = `border ${ANIM_TIME}s, background ${ANIM_TIME}s`;
            cellElem.style.border = "3px solid #ffffff";
            cellElem.style.backgroundColor = handColors[erasingCell.hand];
        }
        else {
            cellElem.style.transition = `background ${ANIM_TIME}s`;
            cellElem.style.backgroundColor = handColorsHighlighted[erasingCell.hand];
        }
    }

    setTimeout(() => {
      const newGrid = grid.map(row => row.map(cell => ({ ...cell })));

      // Update clicked cell's durability
      newGrid[row][col].durability += 1;

      toErase.forEach(([r, c]) => {
        if (1 < grid[r][c].durability) {
            newGrid[r][c].durability--;
            return;
        }
        for (let i = r; i > 0; i--) {
          newGrid[i][c] = { ...newGrid[i - 1][c] };
        }
        newGrid[0][c] = { hand: getRandomHand(), durability: getRandomDurability() };
      });

      // Reward longer chains
      score += toErase.length * (toErase.length + 1) / 2;
      grid = newGrid;
      erasing = [];
      toErase = [];
      gameOver = checkGameOver();
      render();
    }, ANIM_TIME * 1000.);

};

function checkGameOver() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = grid[r][c];
        if (1 < cell.durability) continue;
        const target = beats[cell.hand];
        const surroundingTargets = directions.filter(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          if (!(nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE)) return false;
          const adjacentCell = grid[nr][nc];
          return adjacentCell.hand === target && adjacentCell.durability <= 1;
        });
        if (surroundingTargets.length >= 2) {
          return false;
        }
      }
    }
    return true;
}

let gameOver = checkGameOver();

const gridElem = document.getElementById("grid");
const scoreElem = document.getElementById("score");
const gameOverElem = document.getElementById("gameOver");

function render() {
    scoreElem.innerHTML = score;

    gameOverElem.style.display = gameOver ? "block" : "none";

    while(gridElem.firstChild) gridElem.removeChild(gridElem.firstChild);

    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            const cell = grid[row][col];
            const cellElem = document.createElement("div");
            cellElem.className="noselect";
            cellElem.style.position = "absolute";
            cellElem.style.left = `${col * 50}px`;
            cellElem.style.top = `${row * 50}px`;
            cellElem.style.width = '40px';
            cellElem.style.height = '40px';
            cellElem.style.backgroundColor = handColors[cell.hand];
            cellElem.style.textAlign = "center";
            cellElem.style.verticalAlign = "middle";
            cellElem.style.color = "white";
            if(cell.durability > 1) {
                cellElem.style.backgroundColor = handColorDurable;
                cellElem.style.margin = "-3px";
                cellElem.style.border = "3px solid gray";
            }
            else {
                cellElem.innerHTML = handEmojis[cell.hand]
            }
            cellElem.addEventListener("click", () => handleClick(row, col));
            gridElem.appendChild(cellElem);
            cell.elem = cellElem;
        }
    }
}

window.addEventListener("load", render);

for (let id of ["restart", "restartOutside"]) {
    document.getElementById(id).addEventListener("click", () => {
        grid = getInitialGrid();
        score = 0;
        gameOver = checkGameOver();
        render();
    });
}
