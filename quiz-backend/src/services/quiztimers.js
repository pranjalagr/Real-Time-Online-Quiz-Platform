function registerquiztimer(roomid,duration,onExpire){
    // takes duration in ms, not in seconds
    setTimeout(()=>onExpire(roomid),(duration*1000))
}
export {registerquiztimer};