import dotenv from "dotenv";
dotenv.config();
async function call_llm(quiz_topic){ 
  let prompt= `You are a quiz generator.Generate exactly 10 questions on the topic ${quiz_topic}. Each question must exactly have 4 options and exactly one option must be correct. The correct option must be represented by index (1,2,3 or 4). Return only valid JSON. Do not include explainations.Do not include markdown.Do not include any text outside the JSON.
  Here is the JSON format to follow strictly: 
  {
      "questions":[
          {
              "question_text": "string",
              "options": ["string","string","string","string"],
              "correct_option":number
          }
      ]
  }`;
  let questions;
  try{
     const response =await fetch("https://api.groq.com/openai/v1/chat/completions",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${process.env.LLM_api_key}`
      },
      body:JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages:[
          {role: "user", content:prompt}
        ]
      })
    })
    const data= await response.json();
    const text= data.choices[0].message.content;
    questions=JSON.parse(text);
  }
  catch(error){
    console.log(error);
  }
  // fetch("https://api.groq.com/openai/v1/chat/completions",{
  //   method:"POST",
  //   headers:{
  //     "Content-Type":"application/json",
  //     "Authorization":`Bearer ${process.env.LLM_api_key}`
  //   },
  //   body:JSON.stringify({
  //     model: "llama-3.1-8b-instant",
  //     messages:[
  //       {role: "user", content:prompt}
  //     ]
  //   })
  // }).then(response=>response.json())
  // .then(data=>{
  //   questions=data.choices[0].message.content;
  //   // console.log(data.choices[0].message.content);
  // })
  // .catch(error=>{
  //   console.log(error);
  // })
  return questions;
}
export {call_llm};