import Card from "./Card"

export default class Player {

    /**
     * Create a new player
     */
    constructor () {
        this.name = 'Guest'
        this.selectedCards = []
        this.scores = 0
        this.counter = {
            flip: 0,
            pair: 0
        }
        this.accuracy = 0
    }

    /**
     * Set player name
     * @param {String} name 
     */
    setName(name) {
        this.name = name
    }

    /**
     * Add card to the player's selected cards
     * @param {Card} card - Card to be added to the player's selected cards
     * @returns {Number} Return the amount of selected cards
     */
    addCard(card) {
        this.selectedCards.push(card)
        return this.selectedCards.length
    }

    /**
     * Add scores to the player
     * @param {Number} scores 
     * @returns {Number} Return the total scores of the player
     */
    addScores(scores) {
        this.scores += scores
        return this.scores
    }
    addFlipCount(){
        this.counter.flip++
    }
    addPairCount(){
        this.counter.pair++
    }

    /**
     * Clear all selected cards from the player
     * @returns {Array<Card>} Return all selected cards that are removed from the player
     */
    clearCards() {
        return this.selectedCards.splice(0, this.selectedCards.length)
    }

    /**
     * Clear all scores from the player
     */
    clearScores() {
        this.scores = 0
    }

    clearCounter(){
        this.counter.flip = 0
        this.counter.pair = 0
    }

    /**
     * Reset the player cards and scores
     */
    reset() {
        this.clearCards()
        this.clearScores()
        this.clearCounter()
    }

    /**
     * Check if the selected cards are paired
     * @returns {Boolean} Return true if the selected cards are paired, otherwise return false
     */
    isPaired() {
        return this.selectedCards[0].id === this.selectedCards[1].id
    }

    revealAllSelectedCard(){
        this.selectedCards.forEach((card) => {
            card.reveal()
        })
    }

    concealAllSelectedCard(){
        this.selectedCards.forEach((card) => {
            card.conceal()
        })
    }

    isNameInvalid(){
        if(this.name.length === 0 || this.name.length > 16){
            return 'Player name must have 1-16 characters'
        }
        if(this.name.trim().length === 0){
            return 'Player name can\'t be only whitespace'
        }
        if(/^\s/.test(this.name) || /\s$/.test(this.name)){
            return 'Player name can\'t be start or end with whitespace'
        }
        return ''
    }
}