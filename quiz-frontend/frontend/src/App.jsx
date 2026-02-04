import { useEffect, useState } from 'react'
import {connectSocket} from './socket/socketclient'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Loginpage } from './auth/login'
import { Registerpage } from './auth/register'
import {Lobbypage} from './pages/lobby'
import {Quizpage} from './pages/quiz'
import { QuizHostpage } from './pages/quizhost'
import { Leaderboardpage } from './pages/leaderboard'
// import {Resultspage} from './pages/results'
import Home from './Home'
import { BrowserRouter,Routes,Route,Navigate,useNavigate } from "react-router-dom";
import './App.css'
function App(){
  let [quizstate,usequiz]=useState(null);
  const navigate = useNavigate();
  console.log(` app ${localStorage.getItem("token")}`);
  let socket=connectSocket(localStorage.getItem("token"));
  useEffect(()=>{
    const handler=((state)=>{
      console.log(state);
      console.log("upar wala hai");
      usequiz(state);
      console.log("state settled");
    });
    socket.on("state",handler)
    socket.on("broadcast-question",handler)
    return (()=>{
      socket.off("state",handler);
      socket.off("broadcast-question",handler)
    });
  },[]);
  useEffect(()=>{
    if(quizstate){
      if(quizstate.room_state=='LOBBY'){
        navigate(`/${quizstate.roomid}/lobby`, { replace: true });
      }
      if(quizstate.room_state=='LIVE'){
        navigate(`/${quizstate.roomid}/live`, { replace: true });
      }
      if(quizstate.room_state=='LIVE_HOST'){
        navigate(`/${quizstate.roomid}/livehost`, { replace: true });
      }
      if(quizstate.room_state=='ENDED'){
        navigate(`/${quizstate.roomid}/leaderboard`, { replace: true });
      }
    }
  },[quizstate])
  if(quizstate){console.log(quizstate.participants);}
  return (
    <Routes>
        <Route path="/login" element={<Loginpage/>} />
        <Route path="/register" element={<Registerpage/>} />
        <Route path="/home" element={<Home/>} />
        <Route path="/:roomid/lobby" element={
          quizstate &&quizstate.room_state=='LOBBY'
          ? <Lobbypage room_code={quizstate.room_code}
           hostid={quizstate.hostid}
           participants_username={quizstate.participants}
           userid={quizstate.userid}
           roomid={quizstate.roomid}/>
          : <Navigate to="/home" />
        }/>
        <Route path="/:roomid/live" element={
          quizstate &&quizstate.room_state=='LIVE'
          ?<Quizpage quiztopic={quizstate.quiztopic}
          endtime={quizstate.endtime}
          question={quizstate.question}
          quizid={quizstate.quizid}
          />
        : <Navigate to="/home" />
        } />
        <Route path="/:roomid/livehost" element={
          quizstate &&quizstate.room_state=='LIVE_HOST'
          ?<QuizHostpage endtime={quizstate.endtime}
          roomid={quizstate.roomid}
          />
        : <Navigate to="/home" />
        } />
        <Route path="/:roomid/leaderboard" element={
          quizstate &&quizstate.room_state=='ENDED'
          ?<Leaderboardpage roomid={quizstate.roomid}
          roomcode={quizstate.roomcode}
          leaderboard={quizstate.leaderboard}
          host={quizstate.host}
          />
        : <Navigate to="/home" />
        } />
        <Route
          path="/"
          element={
            localStorage.getItem("token")
              ? <Home />
              : <Navigate to="/register" replace />
          }
        />
    </Routes>
  );
}
export default App