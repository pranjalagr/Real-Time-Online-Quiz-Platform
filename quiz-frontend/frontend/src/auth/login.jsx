import { login } from "./authService.js";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { use, useState } from 'react'
import { useNavigate } from "react-router-dom";
function Loginpage(){
    const [email,useemail]=useState("");
    const [pass,usepass]=useState("");
    const [mess,usemess]=useState(null);
    const navigate = useNavigate();
    console.log("login");
    async function logincall(email,pass){
        const res=await login(email,pass);
        console.log(`uuuu${res}`);
        if(res=="true"){usemess("true");}
        else{usemess(res.error);}
    }
    return (
        <>
          <div>
            <input type="text" placeholder="Email" onChange={(e)=>(useemail(e.target.value))}/>
            <input type="text" placeholder="Password" onChange={(e)=>(usepass(e.target.value))}/>
            <button onClick={()=>(logincall(email,pass))}>Submit</button>
            {
                mess== "true" && (
                    navigate("/Home")
                )
            }
            {
                mess!="true" && (
                    <div>{mess}</div>
                )
            }
          </div>
        </>
    )
}
export {Loginpage};