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

function move_piece(start_x, start_y, target_x , target_y, player_number){
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
    setTimeout(function (){
        if (piece_to_take)piece_to_take.remove();
        square.insertAdjacentElement("beforeend", piece);
        piece.style.transform = "translate(0, 0)";
        piece.style.transitionDuration = "0ms";
    }, 300);
}

function instant_move_piece(piece, piece_pos, target_x, target_y){
    const width_squares = get_width_squares();
    const origin_x = piece_pos.x+width_squares/2;
    const origin_y = piece_pos.y+width_squares/2;
    const x = target_x - origin_x;
    const y = target_y - origin_y;
    const style = "translate("+x+"px,"+y+"px)";
    piece.style.transform = style;
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

function insert_message(username, message, separator=" : "){
    //message
    let message_p = document.createElement("p");
    message_p.classList.add("message");
    message_p.textContent = message;
    //username
    if (username){
        let user_span = document.createElement("span")
        user_span.classList.add("user-name");
        user_span.textContent = username+separator;
        message_p.insertAdjacentElement("afterbegin", user_span);
    }
    //insert
    const messages = document.querySelector("#messages");
    messages.insertAdjacentElement("beforeend", message_p);
    messages.scrollBy(0, 10000);
}

function get_width_squares(){
    return document.querySelector(".square").getBoundingClientRect().width;
}

function insert_end_message(result, reason){
    let result_message;
    if (result===1)result_message = "VOUS AVEZ GAGNÉ";
    else if (result===-1)result_message = "VOUS AVEZ PERDU";
    else result_message = "MATCH NULLE";
    const chessboard_div = document.querySelector("#chessboard");
    let alert_div = document.createElement("div");
    alert_div.id = "alert-message";
    if (result===1)alert_div.classList.add("win");
    else if (result===-1)alert_div.classList.add("lose");
    else alert_div.classList.add("draw");
    //if draw win or lose
    let result_h3 = document.createElement("h3");
    alert_div.classList.add("result-message");
    result_h3.textContent = result_message;
    //why he lost won or draw
    let reason_message = document.createElement("p");
    alert_div.classList.add("reason-message");
    reason_message.textContent = reason;
    //button to close
    let close_button = document.createElement("button");
    close_button.id = "close-button";
    close_button.addEventListener("click", close_end_message);

    alert_div.insertAdjacentElement("afterbegin", result_h3);
    alert_div.insertAdjacentElement("beforeend", reason_message);
    alert_div.insertAdjacentElement("beforeend", close_button);
    chessboard_div.insertAdjacentElement("beforeend", alert_div);
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

function insert_draw_proposal(ws, username="Anonyme"){
    //message
    insert_message(username, "vous propose match nulle", " ");
    //button accept
    let validate_button = document.createElement("button");
    validate_button.id = "accept-draw";
    validate_button.addEventListener("click", function (){
        ws.send("DA");
        remove_draw_proposal();
        return
    });
    //button decline
    let decline_button = document.createElement("button");
    decline_button.id = "decline-draw";
    decline_button.addEventListener("click", function (){
        ws.send("DD");
        remove_draw_proposal();
        return
    });
    //insert buttons
    let buttons = document.createElement("div")
    buttons.id = "draw-buttons";
    buttons.insertAdjacentElement("afterbegin", decline_button);
    buttons.insertAdjacentElement("afterbegin", validate_button);
    const messages = document.querySelector("#messages");
    messages.insertAdjacentElement("beforeend", buttons);
    messages.scrollBy(0, 10000);
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
            if (event.length===1)continue;
            event[2].classList.remove("to_move")
        }else{
            event[0].classList.remove("to_move");
        }
    }
    events_listeners.splice(0); 
}

//makes changes on the html board for special moves (castle, promotion, en-passant)
function special_change(the_move, piece_to_move, data_board){
        const notation_move = the_move.get_notation_move();
        //castle
        if (/^O-O(-O)?[#+]?$/.test(notation_move)){
            const y = data_board.moves.length%2===0 ? 0 : 7;
            const x = /O-O-O/.test(notation_move) ? 0 : 7;
            const target_x = x===0 ? 3 : 5;
            move_piece(x, y, target_x, y);
        }else if (the_move.piece==="P" && (the_move.target_y===7 || the_move.target_y===0)){
            piece_to_move.classList.remove("pawn");
            const type_pieces = ["Q", "R", "B", "N"];
            const class_pieces = ["queen", "rook", "bishop", "knight"];
            piece_to_move.classList.add(class_pieces[type_pieces.indexOf(the_move.promotion[1])]);
        }else if (the_move.piece==="P" && the_move.is_taking && data_board.board[the_move.target_y][the_move.target_x]===0){
            //if en-passant
            get_html_piece(the_move.target_x, the_move.y).remove();
        }
}

//when recieve move
function make_move(data_board, notation_move, events_listeners, player_number){
    insert_move(notation_move);
    reset_red_squares(events_listeners);
    //get the move
    let the_move;
    for (const move of data_board.get_every_moves()){
        if (move.get_notation_move()===notation_move){
            the_move=move;
            break;
        }
    }
    if (!the_move){
        console.log("move : "+notation_move+" non trouvé")
        return;
    }
    //make the html move
    move_piece(the_move.x, the_move.y, the_move.target_x, the_move.target_y, player_number);
    special_change(the_move, get_html_piece(the_move.x, the_move.y), data_board);
    //make the move in the datas
    const piece = data_board.board[the_move.y][the_move.x];
    data_board.board = piece.do_move(data_board.board, the_move, piece.edit_func);
    data_board.moves.push(the_move);
}

export { get_html_square, get_html_piece, get_xy_from_piece, move_piece, instant_move_piece, insert_move,
         insert_message, get_width_squares, insert_end_message, close_end_message, insert_draw_proposal,
         remove_draw_proposal, invert_board, update_board_sens, reset_red_squares, special_change, make_move };