export class Card{
    constructor({id,name,arts,color}){
        this.id = id
        this.name = name
        this.arts = arts
        this.color = color
        this.isFliped = false
    }
    setFlip(flipState){
        this.isFliped = flipState
    }

}