import {useState} from 'react';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

function piece(type, color) {
  return {type, color};
}

function initialBoard() {
  const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  const board = Array.from({length: 8}, () => Array(8).fill(null));

  for (let c = 0; c < 8; c += 1) {
    board[0][c] = piece(backRank[c], 'black');
    board[1][c] = piece('pawn', 'black');
    board[6][c] = piece('pawn', 'white');
    board[7][c] = piece(backRank[c], 'white');
  }

  return board;
}

function Board() {
  const [board] = useState(initialBoard);

  return (
    <div className="board">
      {
        board.map(
          (row, r) => row.map(
            (cell, c) => (
<div
                    key={`${r}-${c}`}
                    className={`${cellClass(r, c)} ${cell ? `piece-${cell.color}` : ''}`}
                  >
                    {symbol(cell)}
                  </div>
            )
          ),
        )
      }
    </div>
  );
}

function cellClass(r, c) {
  return (r + c) % 2 === 0 ? 'cell cell-light' : 'cell cell-dark';
}

const SYMBOLS = {
  king: '♚',
  queen: '♛',
  rook: '♜',
  bishop: '♝',
  knight: '♞',
  pawn: '♟',
};

function symbol(p) {
  return p ? SYMBOLS[p.type] : '';
}

function App() {
  return (
    <div>
      <h1>Шахматы</h1>
      <Board />
    </div>
  );
}

const rootElement = document.querySelector('[data-testid="app"]');

if (!rootElement) {
  throw new Error('Корневой элемент приложения не найден.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);