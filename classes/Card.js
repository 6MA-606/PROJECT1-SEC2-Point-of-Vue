export class Card{

    /**
     * Create a new card
     * @param {Object} object 
     * @param {Number} object.id - Card id
     * @param {String} object.name - Card name
     * @param {String} object.arts - Card arts
     * @param {String} object.color - Card color
     * @param {String} object.color.primary - Card primary color
     * @param {String} object.color.secondary - Card secondary color
     */
    constructor({id, name, arts, color}){
        const argsCheck = ['id', 'name', 'arts', 'color']
        for (let key in arguments[0]) {
            argsCheck.splice(argsCheck.indexOf(key), 1)
        }
        if (argsCheck.length > 0) throw new Error(`Missing arguments: ${argsCheck.join(', ')}`)
            
        this.id = id
        this.name = name
        this.arts = arts
        this.color = color
        this.isFliped = false
    }

    /**
     * Set flip state of the card
     * @param {Boolean} flipState - Flip state of the card
     */
    setFlip(flipState){
        this.isFliped = flipState
    }

}