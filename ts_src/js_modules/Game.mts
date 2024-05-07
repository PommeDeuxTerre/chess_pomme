import { SocketGames, Sockets, board, color, game, move, piece } from "../types";

import * as Board from "./Board.mjs";
import * as ModelGame from "../model/Game.mjs";
import ws from "ws";

class Game implements game{
    player_1:Player|undefined;
    player_2:Player|undefined;
    id:number;
    board:board;
    moves:Move[];
    result:string|null;
    timestamp; //minutes * seconds * ms
    constructor(player_1:Player|undefined, id:number){
        this.player_1 = player_1;
        this.player_2 = undefined;
        this.id = id;
        this.board = new Board.Board();
        this.moves = [];
        this.result = null;
        this.timestamp = 20 * 60 * 1000; //minutes * seconds * ms
    }
    play(move:string, filter_good_move=(m:move)=>m.get_notation_move()===move):boolean{
        const moves:move[] = this.board.get_every_moves(0);
        const good_moves:move[] = moves.filter(filter_good_move);
        if (good_moves.length===0){
            console.log(moves.map((move)=>move.get_notation_move()));
            console.log(move)
            return false;
        }
        const good_move:move = good_moves[0];

        const piece:piece = this.board.board[good_move.y][good_move.x] as piece;
        this.board.make_move(piece, good_move);
        console.log(good_move.get_notation_move());
        return true;
    }
    finish(winner:Player|null, message:string):void{
        if (winner===null){
            if (this.player_1 && this.player_1.socket)this.player_1.socket.send("R:D:"+message);
            if (this.player_2 && this.player_2.socket)this.player_2.socket.send("R:D:"+message);
            this.result = "D";
        }
        else if (this.player_1===winner){
            if (this.player_1 && this.player_1.socket)this.player_1.socket.send("R:W:"+message);
            if (this.player_2 && this.player_2.socket)this.player_2.socket.send("R:L:"+message);
            this.result = "W";
        }else if (this.player_2===winner){
            if (this.player_1 && this.player_1.socket)this.player_1.socket.send("R:L:"+message);
            if (this.player_2 && this.player_2.socket)this.player_2.socket.send("R:W:"+message);
            this.result = "L";
        }

        //insert in db
        const winner_db = this.result === "D" ? "draw" : "W" ? "white" : "black";
        if (this.moves.length>1)ModelGame.insert_game(this.get_pgn(), winner_db, message);
    }
    close(id_games:(game|undefined)[], socket_games:SocketGames, sockets:Sockets):void{
        id_games[this.id] = undefined;

        //player 1
        if (this.player_1 && this.player_1.socket){
            this.player_1.socket.close();
            delete socket_games[this.player_1.socket_id];
            delete sockets[this.player_1.socket_id];
        }
        //player 2
        if (this.player_2 && this.player_2.socket){
            this.player_2.socket.close();
            delete socket_games[this.player_2.socket_id];
            delete sockets[this.player_2.socket_id];
        }
    }
    check_timeout():void{
        const player_turn:color = this.board.current_player;
        const current_player:Player|undefined = [this.player_1, this.player_2][player_turn];
        //if game finished
        if (!current_player)return;
        const total_timestamp:number = current_player.total_timestamp - (this.moves.length<2 ? 0 : Date.now() - this.moves.at(-2)!.timestamp);
        if (total_timestamp<=0){
            const winner:Player|undefined = this.player_1===current_player ? this.player_2 : this.player_1;
            if (winner)this.finish(winner, "timeout");
        }
    }
    get_pgn():string{
        let pgn:string = "";
        for (let i=0;i<this.moves.length;i++){
            console.log(this.moves[i].move)
            const move:string = this.moves[i].move;
            if (i)pgn+=" ";
            if (i%2===0)pgn+=`${Math.floor(i/2)+1}. `;
            pgn+=move;
        }
        return pgn;
    }
}

class Player{
    socket?:ws.WebSocket;
    socket_id:string;
    total_timestamp:number;
    draw_proposal:boolean;
    rematch_proposal:boolean;
    user_id?:number;
    constructor(total_timestamp:number, user_id?:number){
        this.socket_id = this.generate_id();
        this.total_timestamp = total_timestamp;
        this.draw_proposal = false;
        this.rematch_proposal = false;
        this.user_id = user_id;
    }
    generate_id():string{
        let id = "";
        for (let i=0;i<10;i++){
            id+=String.fromCharCode(Math.floor(Math.random()*26)+97);
        }
        return id;
    }
}

class Move{
    move:string;
    timestamp:number;
    player:Player;
    constructor(move:string, timestamp:number, player:Player){
        this.move = move;
        this.timestamp = timestamp;
        this.player = player;
    }
}

export { Game, Player, Move };