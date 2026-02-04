import pool from '../db/index.js'
async function check(io,endquiz){
    let rw=await pool.query('SELECT id FROM rooms WHERE state=$1',['LIVE']);
    for(let i=0;i<rw.rowCount;i++){
        let room_id=rw.rows[i].id;
        console.log(`room id hai ${room_id}`);
        let rw1=await pool.query('SELECT expires_at FROM quizzes WHERE room_id=$1',[room_id]);
        let expiredtime=rw1.rows[0].expires_at;
        const now = Date.now();
        if(now>=expiredtime){
            endquiz(room_id);
            io.to(`room_${room_id}`).emit("quizevent","quiz_ended");
        }
    }
}
function expirycheck(io,endquiz){
    setInterval(()=>check(io,endquiz),(5000))
}
export{expirycheck}