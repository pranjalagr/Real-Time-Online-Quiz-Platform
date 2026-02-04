// Purpose

// Initialize Socket.IO

// Listen for new connections

// Wire up connect & disconnect handlers

// Conceptually contains

// “Socket server starts”

// “When a socket connects → call auth logic”

// “When a socket disconnects → cleanup”

// What you write (conceptually)

// Create socket server

// on connection:

// pass socket to auth

// if auth fails → disconnect

// if success → acknowledge connection

// ❌ No DB logic
// ❌ No rooms
// ❌ No quiz state

import express from "express";
import {Server} from "socket.io";
import { authsocket,joinroomsocket } from "./auth.js";
import { addsocket, removesocket } from "./registry.js";
import pool from '../db/index.js'
import {createroom,joinroom,startquiz,leaveroom, restartroom,submitanswer,endquiz} from '../services/room.services.js'
import { expirycheck } from "./expiryworker.js";
//http server
export function initsockets(httpServer){
    // added websockets here
    const io=new Server(httpServer,{
        cors:{
            origin:"*",
            methods:["GET","POST"]
        }
    });
    console.log("ppppppppppppppppppppppppppppppppppppppppppp");
    io.use((socket,next)=>{
        const res=authsocket(socket.handshake.auth.token);
        if(res==null){
            return next(new Error("Unauthorized"));
        }
        else{
            socket.user=res;
            console.log(res);
            console.log(res.id);
            addsocket(res.id,socket.id);
            next();
        }
    });
    io.on("connection",(socket)=>{
        /// socket connected here .. socket.id
        console.log("Connected:", socket.id);
        console.log("User ID:", socket.user.id);
        socket.on("createroom",async(payload)=>{
            let res=await createroom(socket.user.id);
            socket.join(`room_${res.roomid}`);
            let roomcode=res.roomcode;
            let state={room_state:'LOBBY',roomid:res.roomid,userid:socket.user.id,room_code:roomcode,hostid:socket.user.id,participants:[socket.user.id]};
            socket.emit("state",state);
        });
        socket.on("joinroom",async (payload)=>{
            console.log(payload.room_code);
            let room=await pool.query('SELECT id FROM rooms WHERE room_code=$1',[payload.room_code]);
            let room_id;
            if(room.rowCount==0){
                socket.emit("Error","Room Doesnt Exists");
            }
            else{room_id=room.rows[0].id;}
            let fl=0;
            try{
                const res1=await joinroom(socket.user.id,payload.room_code);
                fl=1;
            }catch(error){
                console.log(error);
                if(error.type=="User already in the room"){fl=1;}
            }
            if(fl){
                console.log(`fl ${fl}`)
                const res=await joinroomsocket(room_id,socket.user.id);
                console.log("yaha aaya");
                if(res==null){
                    console.log("yahas bhi");
                    return;
                }
                const roomid=res;
                let roomstring=`room_${roomid}`;
                socket.join(roomstring);
                console.log("yaha bhi");
                socket.emit("join-room",`${roomstring} joined by socketid ${socket.id}`);
                io.to(roomstring).emit("room-message",{
                    msg:"Hello everyone",
                });
                ////// state 
                let state={room_state:null,roomid:null,userid:null,room_code:null,hostid:null,participants:[],quizinfo:{current_questionindex:null,quiz_topic:null,duration_seconds:null,created_at:null},leaderboard:null};
                let rw=await pool.query('SELECT state,host_id FROM rooms WHERE room_code=$1',[payload.room_code]);
                let roomstate=rw.rows[0].state;
                state.roomid=room_id;
                state.userid=socket.user.id;
                state.room_code=payload.room_code;
                state.hostid=rw.rows[0].host_id;
                if(roomstate=='LOBBY'){
                    let rw1=await pool.query('SELECT user_id FROM room_users WHERE room_id=$1',[room_id]);
                    state.room_state='LOBBY';
                    state.participants = rw1.rows.map(r => r.user_id);
                }
                if(roomstate=='ENDED'){
                    let rw1=await pool.query('SELECT user_id,score FROM leaderboard WHERE room_id=$1',[room_id]);
                    state.room_state='ENDED';
                    state.leaderboard=rw1;
                }
                socket.emit("state",state);
            }
        });
        socket.on("startquiz",async (payload)=>{
            let userid=socket.user.id;
            let roomid=payload.roomid;
            let quiztopic=payload.quiztopic;
            let timelimit=payload.quizduration;
            let roomstring=`room_${roomid}`
            try{
                console.log("startquizcontroller");
                await startquiz(roomid,userid,timelimit,quiztopic);
                expirycheck(io,endquiz);
                io.to(roomstring).emit("room-message",{
                    msg:`quiz started at ${Date.now()} for ${timelimit} seconds`,
                });
                console.log("yayayayyayaya22");
                let quiz=await pool.query('SELECT id FROM quizzes WHERE room_id=$1',[payload.roomid]);
                let quizid=quiz.rows[0].id;
                console.log("yayayayyayaya");
                let question_temp=await pool.query('SELECT question_text,question_options,id FROM questions WHERE quizzes_id=$1 AND question_order=$2',[quizid,1]);
                console.log("yayayayyayaya1");
                console.log(`question:${question_temp.rows[0].question_text}`);
                const question_options = question_temp.rows[0].question_options.map((option, index) => ({
                    id: index + 1,
                    text: option
                }));
                let question={
                    question_id:question_temp.rows[0].id,
                    question_text:question_temp.rows[0].question_text,
                    question_options:question_options,
                };
                let current_questionindex=1;
                console.log(question);
                // quiztopic,endtime,question,userid,hostid,roomid
                const endtime=timelimit;
                socket.to(`room_${roomid}`).emit("broadcast-question",{
                    room_state:'LIVE',
                    question_index :current_questionindex,
                    question:question,
                    roomid:roomid,
                    quiztopic:quiztopic,
                    quizid:quizid,
                    endtime:endtime
                });
                socket.emit("state",{room_state:"LIVE_HOST",endtime:endtime,roomid:roomid,quiztopic:quiztopic});
            }catch(error){
                console.log(error);
                socket.emit("Error",error);
            }
        });
        // if clicked next then --
        socket.on("question_duration_expires",async (payload)=>{
            let quizid=payload.quizid;
            let questionid=payload.questionid;
            let current_questionindex=(await pool.query('SELECT question_order FROM questions WHERE id=$1',[questionid])).rows[0].question_order;
            let quiz=(await pool.query('SELECT room_id,created_at FROM quizzes WHERE id=$1',[quizid]))
            let roomid=quiz.rows[0].room_id;
            try{
                const check=await pool.query('SELECT state FROM rooms WHERE id=$1',[roomid]);
                if(check.rows[0].state!='LIVE'){
                    socket.emit("quizevent","quiz_ended");return;
                }
                if(current_questionindex>1){
                    let prevquestionid=(await pool.query('SELECT id FROM questions WHERE quizzes_id=$1 AND question_order=$2',[quizid,current_questionindex-1])).rows[0].id;
                    const res=await pool.query('SELECT id FROM submissions WHERE user_id=$1 AND questions_id=$2',[socket.user.id,prevquestionid]);
                    if(res.rowCount==0){
                        socket.emit("answer_submitted","error");return;
                    }
                }
                const response=await submitanswer(socket.user.id,roomid,questionid,-1,quizid);
                if(current_questionindex==10){
                    socket.emit("quizevent","quiz_ended");
                }
                else{
                    current_questionindex++;
                    let question_temp=await pool.query('SELECT question_text,question_options,id FROM questions WHERE quizzes_id=$1 AND question_order=$2',[quizid,current_questionindex]);
                    ////
                    const question_options = question_temp.rows[0].question_options.map((option, index) => ({
                        id: index + 1,
                        text: option
                    }));
                    let question={
                        question_id:question_temp.rows[0].id,
                        question_text:question_temp.rows[0].question_text,
                        question_options:question_options,
                    };
                    console.log(question);
                    // quiztopic,endtime,question,quizid
                    const endtime=payload.endtime+(Date.now());
                    socket.emit("broadcast-question",{
                        room_state:'LIVE',
                        question:question,
                        quiztopic:payload.quiztopic, 
                        quizid:payload.quizid,
                        endtime:endtime
                    });
                }
            }catch(error){
                socket.emit("answer_submitted","error");
            }
        });
        // if click submit then -- 
        socket.on("submit_answer",async (payload)=>{
            let quizid=payload.quizid;
            let questionid=payload.questionid;
            let selected_option=payload.selected_option;
            console.log(`question id jjjj ${questionid}`);
            let current_questionindex1=(await pool.query('SELECT question_order FROM questions WHERE id=$1',[questionid]));
            console.log(`rowcounttttttttttttttttt ${current_questionindex1.rowCount}`);
            let current_questionindex=current_questionindex1.rows[0].question_order;
            console.log(`currentquestionindex ${current_questionindex}`);
            if(selected_option<1||selected_option>4){
                socket.emit("answer_submitted","error");return;
            }
            let quiz=(await pool.query('SELECT room_id,created_at FROM quizzes WHERE id=$1',[quizid]))
            let roomid=quiz.rows[0].room_id;
            try{
                const check=await pool.query('SELECT state FROM rooms WHERE id=$1',[roomid]);
                if(check.rows[0].state!='LIVE'){
                    socket.emit("quizevent","quiz_ended");return;
                }
                if(current_questionindex>1){
                    let prevquestionid=(await pool.query('SELECT id FROM questions WHERE quizzes_id=$1 AND question_order=$2',[quizid,current_questionindex-1])).rows[0].id;
                    const res=await pool.query('SELECT id FROM submissions WHERE user_id=$1 AND questions_id=$2',[socket.user.id,prevquestionid]);
                    if(res.rowCount==0){
                        socket.emit("answer_submitted","error");return;
                    }
                }
                const response=await submitanswer(socket.user.id,roomid,questionid,selected_option,quizid);
                if(current_questionindex==10){
                    socket.emit("quizevent","quiz_ended");
                }
                else{
                    current_questionindex++;
                    let question_temp=await pool.query('SELECT question_text,question_options,id FROM questions WHERE quizzes_id=$1 AND question_order=$2',[quizid,current_questionindex]);
                    const question_options = question_temp.rows[0].question_options.map((option, index) => ({
                        id: index + 1,
                        text: option
                    }));
                    let question={
                        question_id:question_temp.rows[0].id,
                        question_text:question_temp.rows[0].question_text,
                        question_options:question_options,
                    };
                    console.log(question);
                    // quiztopic,endtime,question,userid,hostid,roomid
                    const endtime=payload.endtime+(Date.now());
                    socket.emit("broadcast-question",{
                        room_state:'LIVE',
                        question:question,
                        quiztopic:payload.quiztopic, 
                        quizid:payload.quizid,
                        endtime:endtime
                    });
                }
            }catch(error){
                console.log(error);
                socket.emit("answer_submitted","error");
            }
        });
        socket.on("leaderboard_update",async (payload)=>{
            let roomid=payload.roomid;
            let rw=await pool.query('SELECT state,room_code FROM rooms WHERE id=$1',[roomid]);
            if(rw.rows[0].state=='ENDED'){
                let rw1=await pool.query('SELECT user_id,score FROM leaderboard WHERE room_id=$1',[roomid]);
                console.log(`row count ${rw1.rowCount}`);
                let leaderboard=[];
                for(let i=0;i<rw1.rowCount;i++){
                    leaderboard.push({
                        userid:rw1.rows[0].user_id,
                        score:rw1.rows[0].score
                    });
                    console.log(rw1.rows[0].user_id);
                    console.log(rw1.rows[0].score);
                }
                console.log(leaderboard);
                let state={room_state:"ENDED",roomid:roomid,roomcode:rw.rows[0].room_code,leaderboard:leaderboard,host:false};
                let state1={room_state:"ENDED",roomid:roomid,roomcode:rw.rows[0].room_code,leaderboard:leaderboard,host:true};
                socket.to(`room_${roomid}`).emit("state",state);
                socket.emit("state",state1);
            }
        });
        socket.on("leaveroom",async (payload)=>{
            try{
                await leaveroom(payload.roomid,socket.user.id);
                socket.leave(`room_${payload.roomid}`);
            }catch(error){
                console.log(error);
            }
        });
        socket.on("restartroom",async (payload)=>{
            try{
                await restartroom(payload.roomid,socket.user.id);
                /////////////
                let state={room_state:null,roomid:null,userid:null,room_code:null,hostid:null,participants:[]};
                let rw=await pool.query('SELECT id,state,host_id FROM rooms WHERE room_code=$1',[payload.room_code]);
                let roomstate=rw.rows[0].state;
                state.roomid=rw.rows[0].id;
                state.userid=socket.user.id;
                state.room_code=payload.room_code;
                state.hostid=rw.rows[0].host_id;
                if(roomstate=='LOBBY'){
                    let rw1=await pool.query('SELECT user_id FROM room_users WHERE room_id=$1',[rw.rows[0].id]);
                    state.room_state='LOBBY';
                    state.participants = rw1.rows.map(r => r.user_id);
                    socket.emit("state",state);
                }
            }catch(error){
                console.log(error);
            }
        });
        socket.on("lobby",async(payload)=>{
            let state={room_state:null,roomid:null,userid:null,room_code:null,hostid:null,participants:[]};
            let rw=await pool.query('SELECT id,state,host_id FROM rooms WHERE room_code=$1',[payload.room_code]);
            let roomstate=rw.rows[0].state;
            state.roomid=rw.rows[0].id;
            state.userid=socket.user.id;
            state.room_code=payload.room_code;
            state.hostid=rw.rows[0].host_id;
            if(roomstate=='LOBBY'){
                let rw1=await pool.query('SELECT user_id FROM room_users WHERE room_id=$1',[rw.rows[0].id]);
                state.room_state='LOBBY';
                state.participants = rw1.rows.map(r => r.user_id);
                socket.emit("state",state);
            }
            else{
                socket.emit("Error","Not Started yet");
            }
        });
        socket.on("disconnecting", () => {
            console.log(socket.rooms); // the Set contains at least the socket ID
            removesocket(socket.user.id,socket.id);
        });
        socket.on("disconnect", () => {
            console.log("nikal gaya bhdwa");
            // socket.rooms.size === 0
        });
    });
    return io;
}