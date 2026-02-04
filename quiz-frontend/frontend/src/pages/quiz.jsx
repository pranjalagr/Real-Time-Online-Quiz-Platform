// question 
// options
// next and submit button
// time left
///////////////////////////////////////////////////////
import { use, useEffect, useState } from 'react'
import { socket } from '../socket/socketclient'
function Quizpage({quiztopic,endtime,question,quizid}){
    let questionid=question.question_id;
    let questiontext=question.question_text;
    let questionoptions=question.question_options;
    const [remaining,setremaining]=useState(0);
    const [buttonid,setbuttonid]=useState(null);
    console.log(`buttonid ${buttonid}`);
    useEffect(()=>{
        console.log(`endtime ${Number(endtime)}`);
        setremaining(endtime);
        console.log(`endtime ${remaining}`);
        const interval=setInterval(()=>{
            setremaining((prev)=>{
                if(prev<=1){clearInterval(interval);}
                return prev-1;
            });
        },1000);
        return () => clearInterval(interval);
    },[]);
    return (
        <>
            <div>
                <div>{remaining}</div>
                <div>{quiztopic}</div>
                <div>{questiontext}</div>
                <div>{questionoptions.map(user => (
                    <button key={user.id} onClick={()=>(setbuttonid(user.id))}>{user.text}</button>
                    ))}
                </div>
                <div>
                    <button onClick={()=>(socket.emit("submit_answer",{quizid:quizid,questionid:questionid,selected_option:buttonid,endtime:endtime}))}>Submit</button>
                    <button onClick={()=>(socket.emit("question_duration_expires",{quizid:quizid,questionid:questionid,endtime:endtime,quiztopic:quiztopic}))}>Next</button>
                </div>
            </div>
        </>
    )
}
export {Quizpage};