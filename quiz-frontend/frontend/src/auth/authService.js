// import express from 'express';
// const app = express();
// const PORT = 5000;
// app.use(express.json());
// function login(email,password){
//     let success=false;
//     app.post("/auth/login",(req,res)=>{
//         req.body.email=email;req.body.password=password;
//         if(res.status==200){
//             success=true;
//             const token=res.token;
//            localStorage.setItem("token",token);
//         }
//     });
//     return success;
// }

// function register(email,password){
//     let success=false;
//     app.post("/auth/register",(req,res)=>{
//         req.body.email=email;req.body.password=password;
//         if(res.status==200){
//             success=true;
//         }
//     });
//     return success;
// }
// export {login,register};
import { connectSocket } from "../socket/socketclient";
const API_BASE="http://localhost:5000";

async function login(email,password){
  const res=await fetch(`${API_BASE}/auth/login`,{
        method:"POST",
        headers:{
            "Content-Type": "application/json",
        },
        body:JSON.stringify({ email, password }),
    });
    if(!res.ok){
      console.log(res);
      console.log("fail");
        return (res.json());
    }
    const data = await res.json();
    console.log(data);
    localStorage.setItem("token", `Bearer ${data}`);
    console.log(`call ${localStorage.getItem("token")}`);
    connectSocket(localStorage.getItem("token"));
   return ("true");
}
async function register(email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body:JSON.stringify({email,password}),
  });
   if (!res.ok) {
     return (res.json());
   }
   console.log("tt");
  return ("true");
}
export { login, register };