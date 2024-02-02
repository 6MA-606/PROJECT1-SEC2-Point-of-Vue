import Cards from '../data/cards.json'
import { Card } from './Card'

export class Board {
    constructor () {
        this.cards = []
    }

    getPairCard(pairAmount) {
        const cardIds = []
        const newCards = []
      
        for (let i = 0; i < pairAmount; i++) {
          let randCardId
          do {
            randCardId = Math.round(Math.random() * (Cards.length - 1))
          } while (cardIds.indexOf(randCardId) > -1)
          cardIds.push(randCardId)
        }
      
        console.log(cardIds)
      
        for (let cardId of cardIds) {
          // const cardObj = {
          //   ...Cards.find((card) => card.id === cardId),
          //   isFliped: false,
          // }
          const jsonCard = Cards.find((card) => card.id === cardId)
         
          newCards.push(new Card(jsonCard))
          newCards.push(new Card(jsonCard))
          console.log(jsonCard);
          
        }

        this.cards.splice(0, this.cards.length)
        this.cards.push(...newCards)
      }

      shuffle() {
        for (let i = 0; i < this.cards.length; i++) {
          const temp = this.cards[i]
          let rand
          do {
              rand = Math.floor(Math.random() * this.cards.length)
              console.log(rand)
          } while (rand === i)
         this.cards[i] = this.cards[rand]
         this.cards[rand] = temp
        }
      }
} 