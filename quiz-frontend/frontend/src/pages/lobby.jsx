// room code
// participants list (username)  
// start button (for host)
///////////////////////////////////////////////////////
import { use, useState } from 'react'
import { socket } from '../socket/socketclient'
function Lobbypage({participants_username,room_code,userid,hostid,roomid}){
    const [quiztopic,usequiztopic]=useState("");
    const [quizduration,usequizduration]=useState(null);
    console.log(participants_username);
    return (
        <>
          <div>
            <div>{room_code}</div>
            <div>Participants</div>
            <div>{participants_username.map(user => (
                <div key={user}>{user}</div>
                ))}
            </div>
            {
                (userid==hostid) && (
                    <div>
                        <input type="text" placeholder="Quiz Topic" onChange={(e)=>(usequiztopic(e.target.value))}/>
                       <input type="text" placeholder="Quiz Duration" onChange={(e)=>(usequizduration(e.target.value))}/>
                      <button onClick={()=>(socket.emit("startquiz",{quiztopic:quiztopic,quizduration:quizduration,roomid:roomid})
                       )}>Start</button>
                    </div>
                )
            }
          </div>
        </>
    )
}
export {Lobbypage};