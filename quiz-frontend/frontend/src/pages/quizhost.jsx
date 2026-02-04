// question 
// options
// next and submit button
// time left
///////////////////////////////////////////////////////
import { use, useEffect, useState } from 'react'
import { socket } from '../socket/socketclient'
function QuizHostpage({endtime,roomid}){
    const [remaining,setremaining]=useState(0);
    useEffect(()=>{
        const handler=(()=>{
            socket.emit("leaderboard_update",{roomid:roomid});
       });
        console.log(`endtime ${Number(endtime)}`);
        setremaining(endtime);
        console.log(`endtime ${remaining}`);
        const interval=setInterval(()=>{
            setremaining((prev)=>{
                if(prev<=1){handler();clearInterval(interval);}
                return prev-1;
            });
        },1000);
        return () => clearInterval(interval);
    },[]);
    return (
        <>
            <div>{remaining}</div>
        </>
    )
}
export {QuizHostpage};