USE `chess_pomme`;

INSERT INTO `chess_game` (`pgn`, `winner`, `status`)
VALUES(
    '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#',
    'white',
    'checkmate'
),(
    '1. g4 e5 2. f3 Qh4#',
    'black',
    'checkmate'
)
;