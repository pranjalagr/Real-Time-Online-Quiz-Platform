import pool from '../db/index.js'
import dotenv from "dotenv";
dotenv.config();
import jwt from 'jsonwebtoken'
function authsocket(authHeader){
    // console.log(authHeader);
    if(!authHeader){
        return (null);
    }
    const parts = authHeader.split(" ");
    if(parts.length!=2||parts[0]!="Bearer"){
        return (null);
    }
    try{
        const decoded=jwt.verify(parts[1],process.env.JWT_SECRET);
        // console.log("chalu ho gya");
        // console.log(authHeader);
        // console.log("chalu ho gya");
        return (decoded);
    }catch(err){
        return (null);
    }
}
async function joinroomsocket(roomid,playerid){
    try{
        let rw=await pool.query('SELECT state FROM rooms WHERE id=$1',[roomid]);
        if(rw.rowCount==0||rw.rows[0].state!='LOBBY'){
            console.log("bkchosdi yaha");
            return (null);
        }
        console.log(2122);
        let rw1=await pool.query('SELECT room_id,user_id FROM room_users WHERE room_id=$1 AND user_id=$2',[roomid,playerid]);
        if(rw1.rowCount==0){
            console.log("bkchodi yaha");
            return (null);
        }
        console.log(rw1.rows[0].room_id);
        return (rw1.rows[0].room_id);
    }
    catch(err){
        return (null);
    }
}
export {authsocket,joinroomsocket}