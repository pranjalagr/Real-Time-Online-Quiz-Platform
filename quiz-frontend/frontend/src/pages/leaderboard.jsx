// scores
// restart (for host)
///////////////////////////////////////////////////////
import { socket } from '../socket/socketclient'
function Leaderboardpage({roomid,roomcode,leaderboard,host}){
    return (
        <>
            <div>
                <div>{roomcode}</div>
                <div>{leaderboard.map((entry, index) => (
                    <div key={entry.userid} className="leaderboard-row">
                    <span>{index + 1}</span>
                    <span>{entry.userid}</span>
                    <span>{entry.score}</span>
                    </div>
                    ))}
                </div>
            </div>
            {
                (host==true) && (
                    <button onClick={()=>(socket.emit("restartroom",{roomid:roomid,room_code:roomcode}))}>Restart</button>
                )
            }
            {
                (host==false) &&(
                    <button onClick={()=>(socket.emit("lobby",{room_code:roomcode}))}>Go To Lobby</button>
                ) 
            }
        </>
    )
}
export {Leaderboardpage};