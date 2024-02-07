import Cards from '../data/cards.json'
import { Card } from './Card'

export class Board {

  /**
   * Create a new board
   */
  constructor () {
    this.cards = []
  }
  
  /**
   * Add cards to the board
   * @param  {...Card} cards 
   * @returns 
   */
  addCards(...cards) {
    if (cards.length === 0) return
    if (cards.some((card) => !(card instanceof Card))) throw new Error('All cards must be instance of Card')
    return this.cards.push(...cards)
  }
  
  /**
   * Clear all cards from the board
   * @returns {Array<Card>} - Return all cards that are removed from the board
   */
  clearCards(){
    return this.cards.splice(0, this.cards.length)
  }

  /**
   * Add pairs of cards to the board
   * @param {Number} pairAmount - Amount of pairs of cards to be added to the board
   */
  getPairCard(pairAmount) {
    if (pairAmount < 1) throw new Error('Pair amount must be greater than 0')
    const cardIds = []
    const newCards = []

    for (let i = 0; i < pairAmount; i++) {
      let randCardId
      do {
        randCardId = Math.round(Math.random() * (Cards.length - 1))
      } while (cardIds.indexOf(randCardId) > -1)
      cardIds.push(randCardId)
    }

    for (let cardId of cardIds) {
      const jsonCard = Cards.find((card) => card.id === cardId)
      newCards.push(new Card(jsonCard))
      newCards.push(new Card(jsonCard))
    }

    this.clearCards()
    this.addCards(...newCards)
  }

  /**
   * Shuffle position of cards in the board
   */
  // TODO: Improve shuffle algorithm
  shuffle() {
    for (let i = 0; i < this.cards.length; i++) {
      const temp = this.cards[i]
      let rand
      do {
        rand = Math.floor(Math.random() * this.cards.length)
      } while (rand === i)
      this.cards[i] = this.cards[rand]
      this.cards[rand] = temp
    }
    if(this.cards.indexOf(undefined) !== -1){
      this.cards.splice(this.cards.indexOf(undefined),1)
    }
  }
} 