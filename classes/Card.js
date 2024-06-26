export default class Card{

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
    constructor(jsonCard){
        if (typeof jsonCard !== 'object') throw new Error('Card data must be an object')
        
        const {id, name, arts, color} = jsonCard

        const argsCheck = ['id', 'name', 'arts', 'color']
        for (let key in arguments[0]) {
            argsCheck.splice(argsCheck.indexOf(key), 1)
        }
        if (argsCheck.length > 0) throw new Error(`Missing arguments: ${argsCheck.join(', ')}`)
            
        this.id = id
        this.name = name
        this.arts = arts
        this.color = color
        this.isRevealed = false
    }

    reveal(){
        this.isRevealed = true
    }
    
    conceal(){
        this.isRevealed = false
    }

}