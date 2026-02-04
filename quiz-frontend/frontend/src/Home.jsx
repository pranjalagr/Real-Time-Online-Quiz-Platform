import { useState } from 'react'
import { socket } from './socket/socketclient'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { useNavigate } from "react-router-dom";
function Home() {
  const [home, setHome] = useState('');
  const [mode,setmode]=useState(null);
  const [roomcode,setroomcode]=useState("");
  const navigate = useNavigate();
  console.log("Hii");
  // localStorage.setItem("token","");
  console.log(localStorage.getItem("token"));
  return (
    <>
      {
        mode==null && (
            <div>
              <div className="Createroom">
              <button onClick={
                () => (socket.emit("createroom",{id:null}))
                }>
                Create Room
              </button>
            </div>
            <div className="Joinroom">
              <button onClick={()=>(setmode('Join'))}>
                Join Room
              </button>
            </div>
          </div>
        )
      }
      {
        mode=='Join' &&(
          <div>
            <input type="text" placeholder='Type your Room Code here' onChange={(e)=>(setroomcode(e.target.value))}/>
            <button onClick={()=>(socket.emit("joinroom",{room_code:roomcode}))}>Submit</button>
          </div>
        )
      }
    </>
  )
}
export default Home;