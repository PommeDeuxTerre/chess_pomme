function get_html_square(x, y){
    const ranks = document.querySelectorAll("#chessboard > div");
    const rank = ranks[ranks.length-y-1];
    const squares = rank.querySelectorAll(".square");
    const square = squares[x];
    return square;
}

function get_html_piece(x, y){
    const square = get_html_square(x, y);
    const piece = square.querySelector(".piece");
    return piece;
}

function get_xy_from_piece(piece){
    const x = piece.parentElement.classList[1];
    const y = piece.parentElement.parentElement.classList[1];
    return [x, y];
}

function move_piece(start_x, start_y, target_x , target_y, player_number, animation_delay=300){
    const chessboard_sens = sessionStorage.getItem("chessboard_sens") ?? 1;
    const sens_move = chessboard_sens==="1" ? 1 : -1;
    const piece = get_html_piece(start_x, start_y);
    const piece_to_take = get_html_piece(target_x, target_y);
    const square = get_html_square(target_x, target_y);
    const width_squares = get_width_squares();
    const trans_x = ((target_x-start_x)*width_squares*sens_move).toString()+"px";
    const trans_y = ((-target_y+start_y)*width_squares*sens_move).toString()+"px";
    piece.style.transitionDuration = "300ms";
    piece.style.transform = "translate("+trans_x+", "+trans_y+")";
    const make_final_insert = function (){
        if (piece_to_take)piece_to_take.remove();
        square.insertAdjacentElement("beforeend", piece);
        piece.style.transform = "translate(0, 0)";
        piece.style.transitionDuration = "0ms";
    }
    if (animation_delay === 0){
        make_final_insert();
        return;
    }
    setTimeout(make_final_insert, animation_delay);
}

function insert_move(move_notation){
    const moves = document.querySelector("#moves");
    let move_div = document.createElement('div');
    let move_p = document.createElement('p');

    move_div.classList.add("move");
    if (moves.childElementCount%2===0)move_p.textContent = (moves.childElementCount/2+1).toString()+". ";
    move_p.textContent += move_notation;
    move_div.insertAdjacentElement("beforeend", move_p);

    moves.insertAdjacentElement("beforeend", move_div);
    moves.scrollBy(0, 10000);
}

function get_width_squares(){
    return document.querySelector(".square").getBoundingClientRect().width;
}

function close_end_message(){
    const alert_message = document.querySelector("#alert-message");
    if (alert_message)alert_message.remove();
}

function remove_draw_proposal(){
    const buttons = document.querySelector("#draw-buttons");
    if (!buttons)return false;
    buttons.remove();
    return true;
}

function update_board_sens(sens){
    const chessboard_sens = sens ?? sessionStorage.getItem("chessboard_sens");

    let chessboard = document.querySelector("#chessboard");
    const ranks = chessboard.querySelectorAll(".rank");
    const order_sens = chessboard_sens!=1 ? -1 : 1;

    ranks.forEach((rank, i)=>{
        rank.style.order = i*order_sens;
        const squares = rank.querySelectorAll(".square");
        squares.forEach((square, j)=>{
            square.style.order = j*order_sens;
        });
    });

    //timers
    const timer1 = document.querySelector("#timer1");
    const timer2 = document.querySelector("#timer2");
    const oppenent = document.querySelector("#opponent-infos");
    const user = document.querySelector("#user-infos");
    if (chessboard_sens===1){
        user.insertAdjacentElement("beforeend", timer1);
        oppenent.insertAdjacentElement("beforeend", timer2);
    }else{
        user.insertAdjacentElement("beforeend", timer2);
        oppenent.insertAdjacentElement("beforeend", timer1);
    }
}

function invert_board(){
    const chessboard_sens = sessionStorage.getItem("chessboard_sens") ?? 1;
    sessionStorage.setItem("chessboard_sens", chessboard_sens%2+1);
    update_board_sens();
}

function reset_red_squares(events_listeners){
    for (const event of events_listeners){
        event[0].removeEventListener("click", event[1]);
        if (!event[0].classList.contains("to_move")){
            //if square not given
            if (event.length<=2)continue;
            event[2].classList.remove("to_move")
        }else{
            event[0].classList.remove("to_move");
        }
    }
    events_listeners.splice(0); 
}

//makes changes on the html board for special moves (castle, promotion, en-passant)
function special_change(the_move, piece_to_move, data_board, animation_delay=undefined){
        const notation_move = the_move.get_notation_move();
        if (/^O-O(-O)?[#+]?$/.test(notation_move)){
            //castle
            const y = data_board.moves.length%2===0 ? 0 : 7;
            const x = /O-O-O/.test(notation_move) ? 0 : 7;
            const target_x = x===0 ? 3 : 5;
            move_piece(x, y, target_x, y, undefined, animation_delay);
        }else if (the_move.piece==="P" && (the_move.target_y===7 || the_move.target_y===0)){
            //promotion
            //update the class
            piece_to_move.classList.remove("pawn");
            const type_pieces = ["Q", "R", "B", "N"];
            const class_pieces = ["queen", "rook", "bishop", "knight"];
            piece_to_move.classList.add(class_pieces[type_pieces.indexOf(the_move.promotion[1])]);
            //update the img
            const piece_set = get_piece_set();
            const piece_img = piece_to_move.querySelector("img");
            const piece_color = the_move.target_y===7 ? "w" : "b";
            piece_img.src = `./piece/${piece_set}/${piece_color}${the_move.promotion[1]}.svg`;
            console.log(the_move);
        }else if (the_move.piece==="P" && the_move.is_taking && data_board.board[the_move.target_y][the_move.target_x]===0){
            //if en-passant
            get_html_piece(the_move.target_x, the_move.y).remove();
        }
}

function event_moves_buttons(ws){
    const resign_button = document.querySelector("#resign-button");
    const draw_button = document.querySelector("#draw-button");
    const rematch_button = document.querySelector("#rematch-button");
    const new_game_button = document.querySelector("#new-game-button");
    //resign
    if (resign_button)resign_button.addEventListener("click", function (){
        ws.send("R:");
    })
    //draw proposal
    if (draw_button)draw_button.addEventListener("click", function (){
        ws.send("DP");
    })
    //rematch proposal
    if (rematch_button)rematch_button.addEventListener("click", function(){
        if (location.pathname==="/stockfish"){
            window.location.reload();
        }
        ws.send("RP:");
    })
    if (new_game_button)new_game_button.addEventListener("click", function(){
        if (location.pathname==="/stockfish"){
            window.location.reload();
        }
        //doesn't work for now
    })
}

function get_piece_set(){
    return  "cburnett";
}

// board_sens == 1 for white and 2 for black
function update_usernames(white_username, black_username, board_sens){
  const usernames_html = document.querySelectorAll(".user-name");
  console.log(white_username);
  console.log(black_username);
  console.log(board_sens);
  console.log(usernames_html);
  if (board_sens === 1){
    usernames_html[0].textContent = black_username;
    usernames_html[1].textContent = white_username;
  }else {
    usernames_html[0].textContent = white_username;
    usernames_html[1].textContent = black_username;
  }
}

export { get_html_square, get_html_piece, get_xy_from_piece, move_piece, insert_move,
         get_width_squares, close_end_message, remove_draw_proposal, invert_board,
         update_board_sens, reset_red_squares, special_change, event_moves_buttons,
         get_piece_set, update_usernames };
