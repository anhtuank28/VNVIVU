const crypto= require("crypto");

module.exports.generateRandomNumber=(length)=>{
    let result="";
    for(let i=0;i<length;i++){
        result+=crypto.randomInt(0,10);
    }
    return result;
}