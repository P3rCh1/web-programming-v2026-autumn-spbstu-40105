import {useState} from 'react';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {
  applyMove,
  hasAnyLegalMoves,
  isInCheck,
  legalMoves,
  makePiece,
} from './rules.js';
import './styles.css';

function initialBoard() {
  const backRank = [
    'rook',
    'knight',
    'bishop',
    'queen',
    'king',
    'bishop',
    'knight',
    'rook',
  ];
  const board = Array.from({length: 8}, () => Array(8).fill(null));

  for (let column = 0; column < 8; column += 1) {
    board[0][column] = makePiece(backRank[column], 'black');
    board[1][column] = makePiece('pawn', 'black');
    board[6][column] = makePiece('pawn', 'white');
    board[7][column] = makePiece(backRank[column], 'white');
  }

  return board;
}

function Board() {
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('white');
  const [selectedPieceSquare, setSelectedPieceSquare] = useState(null);
  const [availableMoves, setAvailableMoves] = useState([]);
  const [enPassantSquare, setEnPassantSquare] = useState(null);
  const [promotionPending, setPromotionPending] = useState(null);

  function handleCellClick(row, column) {
    const clickedSquare = {row, column};
    const clickedPiece = board[row][column];

    if (selectedPieceSquare && isAvailableMove(row, column)) {
      makeMove(selectedPieceSquare, clickedSquare);
      return;
    }

    if (
      selectedPieceSquare &&
      selectedPieceSquare.row === row &&
      selectedPieceSquare.column === column
    ) {
      clearSelection();
      return;
    }

    if (clickedPiece && clickedPiece.color === turn) {
      setSelectedPieceSquare(clickedSquare);
      setAvailableMoves(legalMoves(board, row, column, enPassantSquare));
      return;
    }

    clearSelection();
  }

  function makeMove(fromSquare, toSquare) {
    const movingPiece = board[fromSquare.row][fromSquare.column];
    const lastRow = movingPiece.color === 'white' ? 0 : 7;

    if (movingPiece.type === 'pawn' && toSquare.row === lastRow) {
      setPromotionPending({fromSquare, toSquare});
      return;
    }

    finishMove(fromSquare, toSquare, 'queen');
  }

  function finishMove(fromSquare, toSquare, promotionType) {
    const nextBoard = applyMove(board, fromSquare, toSquare, promotionType);
    const movingPiece = board[fromSquare.row][fromSquare.column];
    const nextTurn = turn === 'white' ? 'black' : 'white';
    const doublePawnStep =
      movingPiece.type === 'pawn' &&
      Math.abs(toSquare.row - fromSquare.row) === 2;
    const nextEnPassantSquare = doublePawnStep
      ? {
          row: (fromSquare.row + toSquare.row) / 2,
          column: toSquare.column,
        }
      : null;

    setBoard(nextBoard);
    setTurn(nextTurn);
    setEnPassantSquare(nextEnPassantSquare);
    setPromotionPending(null);
    clearSelection();
  }

  function clearSelection() {
    setSelectedPieceSquare(null);
    setAvailableMoves([]);
  }

  function gameStatus() {
    const checked = isInCheck(board, turn);

    if (!hasAnyLegalMoves(board, turn, enPassantSquare)) {
      return checked
        ? `Мат! Победили ${turn === 'white' ? 'чёрные' : 'белые'}`
        : 'Пат — ничья';
    }

    if (checked) {
      return `Шах ${turn === 'white' ? 'белым' : 'чёрным'}!`;
    }

    return turn === 'white' ? 'Ход белых' : 'Ход чёрных';
  }

  function isAvailableMove(row, column) {
    return availableMoves.some(
      (move) => move.row === row && move.column === column,
    );
  }

  function cellClass(row, column, isSelected) {
    const classes = ['cell'];

    classes.push((row + column) % 2 === 0 ? 'cell-light' : 'cell-dark');

    if (isSelected) {
      classes.push('cell-selected');
    }

    if (isAvailableMove(row, column)) {
      classes.push('cell-move');
    }

    return classes.join(' ');
  }

  return (
    <div>
      <p className="status" data-testid="game-status">
        {gameStatus()}
      </p>
      <div className="board" data-testid="chess-board">
        {board.map((boardRow, rowIndex) =>
          boardRow.map((piece, columnIndex) => (
            <div
              key={`${rowIndex}-${columnIndex}`}
              className={cellClass(
                rowIndex,
                columnIndex,
                selectedPieceSquare &&
                  selectedPieceSquare.row === rowIndex &&
                  selectedPieceSquare.column === columnIndex,
              )}
              data-testid={
                isAvailableMove(rowIndex, columnIndex)
                  ? 'available-move'
                  : 'chess-cell'
              }
              onClick={() => handleCellClick(rowIndex, columnIndex)}
            >
              {piece && (
                <span
                  className={`piece piece-${piece.color}`}
                  data-testid={
                    piece.color === turn ? 'movable-piece' : 'chess-piece'
                  }
                >
                  {symbol(piece)}
                </span>
              )}
            </div>
          )),
        )}
      </div>
      {promotionPending && (
        <div className="promotion-overlay" data-testid="promotion-dialog">
          <div className="promotion-dialog">
            {['queen', 'rook', 'bishop', 'knight'].map((pieceType) => (
              <button
                key={pieceType}
                type="button"
                className={`promotion-option piece-${
                  board[promotionPending.fromSquare.row][
                    promotionPending.fromSquare.column
                  ].color
                }`}
                data-testid={`promotion-${pieceType}`}
                onClick={() =>
                  finishMove(
                    promotionPending.fromSquare,
                    promotionPending.toSquare,
                    pieceType,
                  )
                }
              >
                {SYMBOLS[pieceType]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const SYMBOLS = {
  king: '♚',
  queen: '♛',
  rook: '♜',
  bishop: '♝',
  knight: '♞',
  pawn: '♟',
};

function symbol(piece) {
  return piece ? SYMBOLS[piece.type] : '';
}

function App() {
  return (
    <div>
      <Board />
    </div>
  );
}

const rootElement = document.querySelector('[data-testid="app"]');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
