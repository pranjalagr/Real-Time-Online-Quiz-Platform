import { login, register } from "./authService.js";
import { use, useState } from 'react'
import { useNavigate } from "react-router-dom";
function Registerpage(){
    const [email,useemail]=useState("");
    const [pass,usepass]=useState("");
    const [mess,usemess]=useState(null);
    const navigate = useNavigate();
    console.log("mess");
    async function registercall(email,pass){
        const res=await register(email,pass);
        if(res=="true"){usemess("true");}
        else{usemess(res.error);}
    }
    return (
        <>
          <div>
            <input type="text" placeholder="Email" onChange={(e)=>(useemail(e.target.value))}/>
            <input type="text" placeholder="Password" onChange={(e)=>(usepass(e.target.value))}/>
            <button onClick={()=>(registercall(email,pass))}>Submit</button>
            {
                mess== "true" && (
                    navigate("/login")
                ) 
            }
            {
                mess!=("true") && (
                    <div>{mess}</div>
                )
            }
          </div>
        </>
    )
}
export {Registerpage};