import pool from '../db/index.js'
import {registerquiztimer} from './quiztimers.js'
import { call_llm } from './llminput.js';
function generate(){
    let length=8;
    let stringgene = '';
    for (let i = 0; i < length; i++) {
        stringgene += String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }
    return stringgene;
}
async function createroom(hostUserId){
    console.log("yaa");
    const client=await pool.connect();
    try{
        await client.query('BEGIN')
        let result='';
        let rw,room_id;
        for(let i=0;i<10;i++){
            try{
               result= generate();
                rw=await client.query('INSERT INTO rooms (host_id,room_code,STATE) VALUES($1,$2,$3) RETURNING id',[hostUserId,result,'LOBBY']);
                break;
            }
            catch(err){
                console.log(err);
                if(err.code=='23505'){continue;}
                else{throw new Error("Network Error");}
            }
        }
        if(!rw){
            throw new Error("Could not generate unique code");
        }
        room_id=rw.rows[0].id;
        await client.query('INSERT INTO room_users (room_id,user_id,role) VALUES($1,$2,$3)',[room_id,hostUserId,'host']);
        console.log(`room_id ${room_id} room_code ${result}`);
        await client.query('COMMIT')
        return {roomid:room_id,roomcode:result}
    }
    catch(err){
        await client.query('ROLLBACK')
        throw new Error(err);
    }finally{
        client.release();
    }
}

async function joinroom(playerid,roomcode){
    try{
        let rw=await pool.query('SELECT id,state FROM rooms WHERE room_code=$1',[roomcode]);
        if(rw.rowCount==0||rw.rows[0].state!='LOBBY'){
            throw new Error("Room doesnt exist");
        }
        await pool.query('INSERT INTO room_users (room_id,user_id,role) VALUES($1,$2,$3)',[rw.rows[0].id,playerid,'player']);
        await pool.query('INSERT INTO leaderboard (user_id,room_id,score) VALUES($1,$2,$3)',[playerid,rw.rows[0].id,0]);
        return "SUCCESSFUL";
    }
    catch(err){
        if(err.code=='23505'){throw {type:"User already in the room"};}
        throw(err);
    }
}

async function startquiz(roomid,userid,timelimit,quiztopic){
    const client=await pool.connect();
    try{
        await client.query('BEGIN')
        let rw=await client.query('SELECT host_id,state FROM rooms WHERE id=$1',[roomid]);
        if(rw.rowCount==0){
            throw {type:"Room doesnt exist"};
        }
        if(rw.rows[0].host_id!=userid){
            throw {type:"User is not a host"};
        }
        if(rw.rows[0].state!="LOBBY"){
            throw {type:"Incorrect state"};
        }
        if(timelimit<=0){
            throw {type:"Timelimit must be greater than zero"};
        }
        await client.query('UPDATE rooms SET state=$1 WHERE id=$2',['LIVE',roomid]);
        // inserting quiz data in table
        const quiz=await client.query(`INSERT INTO quizzes (room_id,quiz_topic,duration_seconds,expires_at) VALUES($1,$2,$3,NOW() + ($3::int  * INTERVAL '1 second')) RETURNING id,expires_at`,[roomid,quiztopic,timelimit]);
        console.log(`quiz id ${quiz.rows[0].id}`);
        console.log(`expires at ${quiz.rows[0].expires_at}`);
        console.log("hogya");
        /// llm call
        let quiz_question=await call_llm(quiztopic);
        const quizid=quiz.rows[0].id;
        // inserting questions in database (currently only 10 questions)
        for(let i=0;i<10;i++){
            // console.log(quiz_question.questions[i].question_text);
            // console.log(quiz_question.questions[i].options);
            let question_text=quiz_question.questions[i].question_text;
            let options=quiz_question.questions[i].options;
            let correct_option=quiz_question.questions[i].correct_option;
            let rw1=await client.query('INSERT INTO questions (quizzes_id,question_text,question_options,correct_option,question_order) VALUES($1,$2,$3,$4,$5) RETURNING id',[quizid,question_text,options,correct_option,i+1]);
            console.log(`question id ${rw1.rows[0].id} correctoption ${correct_option}`);
        }
        // to end quiz after timelimit
        await client.query('COMMIT')
        return "SUCCESSFUL";
    }
    catch(err){
        await client.query('ROLLBACK')
        console.log(err);
        throw(err);
    }finally{
        client.release();
    }
}
async function endquiz(roomid){
    console.log("endquiz");
    try{
        let rw=await pool.query('SELECT state FROM rooms WHERE id=$1',[roomid]);
        if(rw.rowCount==0){
            throw {type:"Room doesnt exist"};
        }
        if(rw.rows[0].state!="LIVE"){
            throw {type:"Incorrect state"};
        }
        await pool.query('UPDATE rooms SET state=$1 WHERE id=$2',['ENDED',roomid]);
        return "SUCCESSFUL";
    }
    catch(err){
        console.log(err);
        throw(err);
    }
}

async function leaveroom(roomid,playerid){
    try{
        let rw=await pool.query('SELECT state FROM rooms WHERE id=$1',[roomid]);
        let rw1=await pool.query('SELECT * FROM room_users WHERE room_id = $1 AND user_id = $2',[roomid,playerid]);
        if(rw.rowCount==0){
            throw {type:"Room doesnt exist"};
        }
        if(rw1.rowCount==0){
            throw {type:"USER DOES NOT EXIST IN THE ROOM"};
        }
        if(rw.rows[0].state!='LOBBY'){
            throw {type:"WRONG STATE"};
        }
        await pool.query('DELETE FROM room_users WHERE room_id = $1 AND user_id = $2',[roomid, playerid]);
        return "SUCCESSFUL";
    }
    catch(err){
        throw(err);
    }
}

async function restartroom(roomid,userid){
    const client=await pool.connect();
    try{
        await client.query('BEGIN')
        let rw=await client.query('SELECT host_id,state FROM rooms WHERE id=$1',[roomid]);
        if(rw.rowCount==0){
            throw {type:"Room doesnt exist"};
        }
        if(rw.rows[0].host_id!=userid){
            throw {type:"User is not a host"};
        }
        if(rw.rows[0].state!="ENDED"){
            throw {type:"Incorrect state"};
        }
        await client.query('UPDATE rooms SET state=$1 WHERE id=$2',['LOBBY',roomid]);
        let rw1=await client.query('SELECT * FROM quizzes WHERE room_id=$1',[roomid]);
        let quizzes_id=rw1.rows[0].id;
        let rw2=await client.query('SELECT id FROM questions WHERE quizzes_id=$1',[quizzes_id]);
        for(let i=0;i<rw2.rowCount;i++){
            let questionid=rw2.rows[i].id;
            await client.query('DELETE FROM submissions WHERE questions_id=$1',[questionid]);
        }
        await client.query('DELETE FROM questions WHERE quizzes_id=$1',[quizzes_id]);
        await client.query('DELETE FROM quizzes WHERE room_id=$1',[roomid]);
        await client.query('COMMIT')        
        return "SUCCESSFUL";
    }
    catch(err){
        await client.query('ROLLBACK')
        console.log(err);
        throw(err);
    }finally{
        client.release();
    }
}
async function submitanswer(userid,roomid,questionid,selected_option,quizid){
    const client=await pool.connect();
    try{
        await client.query('BEGIN')
        console.log("jhhh4");
        let rw=await client.query('SELECT host_id,state FROM rooms WHERE id=$1',[roomid]);
        console.log("jhhh5");
        let rw1=await client.query('SELECT * FROM room_users WHERE room_id = $1 AND user_id = $2',[roomid,userid]);
        console.log("jhhh3");
        if(rw.rowCount==0){
            throw {type:"Room doesnt exist"};
        }
        if(rw1.rowCount==0){
            throw {type:"USER DOES NOT EXIST IN THE ROOM"};
        }
        if(rw.rows[0].host_id==userid){
            throw {type:"User is a host"};
        }
        if(rw.rows[0].state!="LIVE"){
            throw {type:"Incorrect state"};
        }
        console.log("jhhh2");
        let ch=await client.query('SELECT quizzes_id FROM questions WHERE id=$1',[questionid]);
        if(ch.rowCount==0){throw {type:"Question doesnt exist"};}
        if(ch.rows[0].quizzes_id!=quizid){
            throw {type:"Question doesnt exist"};
        }
        console.log("jhhh1");
        let rw2=await client.query('SELECT * FROM submissions WHERE user_id=$1 AND questions_id=$2',[userid,questionid]);
        console.log("jhhh");
        if(rw2.rowCount!=0){
            throw {type:"ALREADY ANSWERED"};
        }
        await client.query('INSERT INTO submissions (user_id,questions_id,selected_option) VALUES($1,$2,$3)',[userid,questionid,selected_option]);
        let rw3=await client.query('SELECT correct_option FROM questions WHERE id=$1',[questionid]);
        console.log(rw3.rows[0].correct_option);
        let correct_option=rw3.rows[0].correct_option;
        let fl=0;if(selected_option==correct_option){fl=1;}
        let rw4=await client.query('SELECT score FROM leaderboard WHERE user_id=$1 AND room_id=$2',[userid,roomid]);
        if(rw4.rowCount==0){
            console.log(`current score of ${userid} is ${fl}`);
            await client.query('INSERT INTO leaderboard (user_id,room_id,score) VALUES($1,$2,$3)',[userid,roomid,fl]);
        }
        else{
            let currentscore=rw4.rows[0].score;
            if(fl==1){
                console.log(`current score of ${userid} is ${currentscore+1}`);
                await client.query('UPDATE leaderboard SET score=$1 WHERE user_id=$2 AND room_id=$3',[currentscore+1,userid,roomid]);
            }
            else{
                console.log(`current score of ${userid} is ${currentscore}`);
            }
        }
        await client.query('COMMIT')
        return "SUCCESSFUL";
    }
    catch(err){
        await client.query('ROLLBACK')
        console.log(err);
        throw(err);
    }finally{
        client.release();
    }
}
export {createroom,joinroom,startquiz,leaveroom,restartroom,submitanswer,endquiz};