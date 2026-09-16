export function makePiece(type, color) {
  return {type, color};
}

function insideBoard(row, column) {
  return row >= 0 && row < 8 && column >= 0 && column < 8;
}

const KNIGHT_JUMPS = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

const KING_STEPS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const RAY_DIRECTIONS = {
  rook: [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ],
  bishop: [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ],
};

function rayMoves(board, row, column, directions) {
  const piece = board[row][column];
  const moves = [];

  for (const [rowOffset, columnOffset] of directions) {
    let nextRow = row + rowOffset;
    let nextColumn = column + columnOffset;

    while (insideBoard(nextRow, nextColumn)) {
      const target = board[nextRow][nextColumn];

      if (!target) {
        moves.push({row: nextRow, column: nextColumn});
      } else {
        if (target.color !== piece.color) {
          moves.push({row: nextRow, column: nextColumn});
        }
        break;
      }

      nextRow += rowOffset;
      nextColumn += columnOffset;
    }
  }

  return moves;
}

function pawnMoves(board, row, column, enPassant) {
  const pawn = board[row][column];
  const rowDirection = pawn.color === 'white' ? -1 : 1;
  const startRow = pawn.color === 'white' ? 6 : 1;
  const moves = [];

  if (
    insideBoard(row + rowDirection, column) &&
    !board[row + rowDirection][column]
  ) {
    moves.push({row: row + rowDirection, column});

    if (row === startRow && !board[row + 2 * rowDirection][column]) {
      moves.push({row: row + 2 * rowDirection, column});
    }
  }

  for (const columnOffset of [-1, 1]) {
    const nextRow = row + rowDirection;
    const nextColumn = column + columnOffset;

    if (!insideBoard(nextRow, nextColumn)) {
      continue;
    }

    const target = board[nextRow][nextColumn];

    if (target && target.color !== pawn.color) {
      moves.push({row: nextRow, column: nextColumn});
    } else if (
      !target &&
      enPassant &&
      enPassant.row === nextRow &&
      enPassant.column === nextColumn
    ) {
      moves.push({row: nextRow, column: nextColumn, enPassant: true});
    }
  }

  return moves;
}

function getMoves(board, row, column, enPassant) {
  const piece = board[row] && board[row][column];

  if (!piece) {
    return [];
  }

  switch (piece.type) {
    case 'pawn':
      return pawnMoves(board, row, column, enPassant);
    case 'knight':
      return stepMoves(board, row, column, KNIGHT_JUMPS);
    case 'king':
      return stepMoves(board, row, column, KING_STEPS);
    case 'rook':
      return rayMoves(board, row, column, RAY_DIRECTIONS.rook);
    case 'bishop':
      return rayMoves(board, row, column, RAY_DIRECTIONS.bishop);
    case 'queen':
      return [
        ...rayMoves(board, row, column, RAY_DIRECTIONS.rook),
        ...rayMoves(board, row, column, RAY_DIRECTIONS.bishop),
      ];
    default:
      return [];
  }
}

function stepMoves(board, row, column, steps) {
  const piece = board[row][column];
  const moves = [];

  for (const [rowOffset, columnOffset] of steps) {
    const nextRow = row + rowOffset;
    const nextColumn = column + columnOffset;

    if (!insideBoard(nextRow, nextColumn)) {
      continue;
    }

    const target = board[nextRow][nextColumn];

    if (!target || target.color !== piece.color) {
      moves.push({row: nextRow, column: nextColumn});
    }
  }

  return moves;
}

export function applyMove(board, from, to, promotionType) {
  const next = board.map((boardRow) => [...boardRow]);
  const movingPiece = next[from.row][from.column];
  const isEnPassant =
    movingPiece.type === 'pawn' &&
    !next[to.row][to.column] &&
    to.column !== from.column;

  if (isEnPassant) {
    next[from.row][to.column] = null;
  }

  next[from.row][from.column] = null;
  next[to.row][to.column] = promoted(movingPiece, to.row, promotionType);

  return next;
}

function promoted(targetPiece, targetRow, promotionType) {
  if (targetPiece.type !== 'pawn') {
    return targetPiece;
  }

  const lastRow = targetPiece.color === 'white' ? 0 : 7;

  if (targetRow !== lastRow) {
    return targetPiece;
  }

  return makePiece(promotionType || 'queen', targetPiece.color);
}

function isAttacked(board, row, column, byColor) {
  for (let attackerRow = 0; attackerRow < 8; attackerRow += 1) {
    for (let attackerColumn = 0; attackerColumn < 8; attackerColumn += 1) {
      const attacker = board[attackerRow][attackerColumn];

      if (!attacker || attacker.color !== byColor) {
        continue;
      }

      if (attacker.type === 'pawn') {
        const rowDirection = byColor === 'white' ? -1 : 1;

        for (const columnOffset of [-1, 1]) {
          if (
            attackerRow + rowDirection === row &&
            attackerColumn + columnOffset === column
          ) {
            return true;
          }
        }
      } else if (
        getMoves(board, attackerRow, attackerColumn).some(
          (move) => move.row === row && move.column === column,
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

function findKing(board, color) {
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const piece = board[row][column];

      if (piece && piece.type === 'king' && piece.color === color) {
        return {row, column};
      }
    }
  }

  return null;
}

export function isInCheck(board, color) {
  const king = findKing(board, color);

  if (!king) {
    return false;
  }

  return isAttacked(
    board,
    king.row,
    king.column,
    color === 'white' ? 'black' : 'white',
  );
}

export function legalMoves(board, row, column, enPassant) {
  const piece = board[row] && board[row][column];

  if (!piece) {
    return [];
  }

  return getMoves(board, row, column, enPassant).filter((move) => {
    const next = applyMove(board, {row, column}, move);

    return !isInCheck(next, piece.color);
  });
}

export function hasAnyLegalMoves(board, color, enPassant) {
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const piece = board[row][column];

      if (
        piece &&
        piece.color === color &&
        legalMoves(board, row, column, enPassant).length > 0
      ) {
        return true;
      }
    }
  }

  return false;
}
