export class Player {
    constructor () {
        this.name = ''
        this.selectedCards = []
        this.scores = 0
    }

    setName(name) {
        this.name = name
    }

    addCard(card) {
        this.selectedCards.push(card)
        return this.selectedCards.length
    }

    addScores(scores) {
        this.scores += scores
        return this.scores
    }

    clearCards() {
        this.selectedCards.splice(0, this.selectedCards.length)
    }

    clearScores() {
        this.scores = 0
    }

    reset() {
        this.clearCards()
        this.clearScores()
    }

    isPaired() {
        return this.selectedCards[0].id === this.selectedCards[1].id
    }
}