
export const isProfitable = (minOutputAmount:bigint,profitAmount:bigint)=>{
    if(profitAmount > minOutputAmount){
        return true
    } else { 
        return false
    }
}