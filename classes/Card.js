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
        if (!id || !name || !arts || !color) throw new Error('Card must have id, name, arts, and color')
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