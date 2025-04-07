'use strict'

const SIZE = 10;
const HANDS = ["rock", "paper", "scissors"];
const INITIAL_DURABILITY = 1;
const ANIM_TIME = 0.5;

const getRandomHand = () => HANDS[Math.floor(Math.random() * HANDS.length)];

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

function handleClick(row, col) {
    const cell = grid[row][col];
    const hand = cell.hand;
    const target = beats[hand];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    const surroundingTargets = directions.filter(([dr, dc]) => {
      const nr = row + dr;
      const nc = col + dc;
      return nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && grid[nr][nc].hand === target;
    });

    if (surroundingTargets.length < 2) {
        const setFlashing = cell => {
            const cellElem = cell.elem;
            cellElem.style.transition = "";
            cellElem.style.backgroundColor = "#af0000";
            // Set timeout immediately to show flashing
            setTimeout(() => {
                cellElem.style.transition = `background ${ANIM_TIME}s`;
                cellElem.style.backgroundColor = handColors[cell.hand];
            });
        };

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
        visited[r][c] ||
        grid[r][c].hand !== target
      )
        return;
      visited[r][c] = true;
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
        cellElem.style.transition = `background ${ANIM_TIME}s`;
        cellElem.style.backgroundColor = handColorsHighlighted[erasingCell.hand];
    }

    setTimeout(() => {
      const newGrid = grid.map(row => row.map(cell => ({ ...cell })));

      // Update clicked cell's durability
      newGrid[row][col].durability += 1;

      toErase.forEach(([r, c]) => {
        for (let i = r; i > 0; i--) {
          newGrid[i][c] = { ...newGrid[i - 1][c] };
        }
        newGrid[0][c] = { hand: getRandomHand(), durability: INITIAL_DURABILITY };
      });

      score += toErase.length;
      grid = newGrid;
      erasing = [];
      toErase = [];
      render();
    }, ANIM_TIME * 1000.);

};

function checkGameOver() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const { hand } = grid[r][c];
        const target = beats[hand];
        const directions = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        const surroundingTargets = directions.filter(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          return nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && grid[nr][nc].hand === target;
        });
        if (surroundingTargets.length >= 2) {
          return false;
        }
      }
    }
    return true;
}

const gameOver = checkGameOver();

const gridElem = document.getElementById("grid");
const scoreElem = document.getElementById("score");

function render() {
    scoreElem.innerHTML = score;

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
            for (let i = 0; i < toErase.length; i++) {
                if (toErase[i][0] === row && toErase[i][1] === col) {
                    cellElem.style.transition = `background ${ANIM_TIME}s`;
                    cellElem.style.backgroundColor = handColorsHighlighted[cell.hand];
                    break;
                }
            }
            cellElem.addEventListener("click", () => handleClick(row, col));
            cellElem.innerHTML = handEmojis[cell.hand] + (cell.durability > 1 ? `(${cell.durability})` : "")
            gridElem.appendChild(cellElem);
            cell.elem = cellElem;
        }
    }
}

window.addEventListener("load", render);
