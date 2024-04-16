import mariadb from "mariadb";
import fs from "fs"; 

interface Game {
    id:number;
    white_player:number|null;
    black_player:number|null;
    pgn:string|null;
    winner:string;
    date:string;
    status:string|null;
}

//config pool
let pool:mariadb.Pool|undefined;
fs.readFile("./config.json", function(err, data) { 
    if (err) throw err; 

    const config:mariadb.PoolConfig = JSON.parse(data.toString("utf8")); 
    pool = mariadb.createPool(config);
}); 

async function get_all_games(limit:number=Infinity):Promise<Game[]>{
    if (pool===undefined){
        throw Error("get_all_games: not connected to the db");
    }
    let conn:mariadb.PoolConnection|undefined;
    let games:Game[] = [];

    try {
        //query
        const limit_sql:string = limit === Infinity ? "" : ` LIMIT ${limit}`;
        const sql:string = `
            SELECT id, white_player, black_player, pgn, winner,
            DATE_FORMAT(date, "%d/%m/%y %H:%i") AS date,
            status
            FROM chess_game
            ORDER BY date DESC, id DESC
            ${limit_sql};
        `;
        //request
        conn = await pool.getConnection();
        games = await conn.query(sql);

    }catch (error){
        console.error("Error retrieving games:", error);
    }finally {
        if (conn!==undefined)conn.release();
        return games;
    }
}

async function insert_game(pgn:string, winner:string, status:string){
    if (pool===undefined){
        throw Error("get_all_games: not connected to the db");
    }
    let conn:mariadb.PoolConnection|undefined;
    try {
        //query
        const sql:string = "INSERT INTO `chess_game` (`pgn`, `winner`, `status`) VALUES(?,?,?)";
        //request
        conn = await pool.getConnection();
        await conn.query(sql, [pgn, winner, status]);
    }catch (error) {
        console.error("Error insering game:", error);
        console.log(`pgn: ${pgn}`);
    }finally {
        if (conn!==undefined)conn.release();
    }
}

export { get_all_games, insert_game, Game };