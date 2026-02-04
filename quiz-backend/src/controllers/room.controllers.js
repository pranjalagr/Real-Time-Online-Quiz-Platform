import { response } from 'express';
import {createroom,joinroom,startquiz,leaveroom, restartroom,submitanswer} from '../services/room.services.js'
async function createroomcontroller(req,res){
    let userid=req.user.id;
    console.log(userid);
    if(!userid){return response.status(404).json({error:"email not found"})}
    try{
        const response=await createroom(userid);
        return res.status(200).json({response});
    }catch(error){
        return res.status(400).json({response});
    }
}

async function joinroomcontroller(req,res){
    let playerid=req.user.id;
    let roomcode=req.body.room_code;
    console.log(`player id ${playerid}`);
    console.log("yyyyyyyyyyyyyyyyyy");
    if(!playerid){return response.status(404).json({error:"playerid not found"})}
    if(!roomcode){return response.status(404).json({error:"roomcode not found"})}
    try{
        const response=await joinroom(playerid,roomcode);
        return res.status(200).json({response});
    }catch(error){
        return res.status(400).json({response});
    }
}

async function startquizcontroller(req,res){
    let roomid=req.params.roomid;
    let userid=req.user.id;
    let timelimit=req.body.timelimit;
    let quiztopic=req.body.quiztopic;
    console.log(roomid);console.log(userid);
    if(!roomid){return response.status(404).json({error:"roomid not found"})}
    if(!userid){return response.status(404).json({error:"userid not found"})}
    if(!timelimit){return response.status(404).json({error:"timelimit not found"})}
    if(!quiztopic){return response.status(404).json({error:"quiztopic not found"})}
    try{
        console.log("startquizcontroller");
        const response=await startquiz(roomid,userid,timelimit,quiztopic);
        return res.status(200).json({response});
    }catch(error){
        if(error.type=="Room doesnt exist"){return res.status(404).json({error});}
        else if(error.type=="User is not a host"){return res.status(401).json({error});}
        else if(error.type=="Incorrect state"){return res.status(403).json({error});}
        else{return res.status(400).json({error});}
    }
}

async function leaveroomcontroller(req,res){
    let userid=req.user.id;
    let roomid=req.params.roomid;
    if(!roomid){return response.status(404).json({error:"roomid not found"})}
    if(!userid){return response.status(404).json({error:"userid not found"})}
    try{
        const response=await leaveroom(roomid,userid);
        return res.status(200).json({response});
    }catch(error){
        return res.status(400).json({error});
    }
}

async function restartroomcontroller(req,res){
    let userid=req.user.id;
    let roomid=req.params.roomid;
    if(!roomid){return response.status(404).json({error:"roomid not found"})}
    if(!userid){return response.status(404).json({error:"userid not found"})}
    try{
        const response=await restartroom(roomid,userid);
        return res.status(200).json({response});
    }catch(error){
        return res.status(400).json({error});
    }
}

async function submitanswercontroller(req,res){
    let userid=req.user.id;
    let roomid=req.params.roomid;
    let questionid=req.params.questionid;
    let selected_option=req.body.selected_option;
    let quizid=req.params.quizid;
    console.log(userid);console.log(roomid);console.log(questionid);console.log(selected_option);
    if(!roomid){return response.status(404).json({error:"roomid not found"})}
    if(!userid){return response.status(404).json({error:"userid not found"})}
    if(!questionid){return response.status(404).json({error:"questionid not found"})}
    if(!quizid){return response.status(404).json({error:"quizid not found"})}
    try{
        const response=await submitanswer(userid,roomid,questionid,selected_option,quizid);
        return res.status(200).json({response});
    }catch(error){
        return res.status(400).json({error});
    }
}
export {createroomcontroller,joinroomcontroller,startquizcontroller,leaveroomcontroller,restartroomcontroller,submitanswercontroller};