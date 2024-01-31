import Cards from "../../data/cards.json"

export function getPairCard(pairAmount) {
    const cardIds = []
    const cards = []
  
    for (let i = 0; i < pairAmount; i++) {
      let randCardId
      do {
        randCardId = Math.round(Math.random() * (Cards.length - 1))
      } while (cardIds.indexOf(randCardId) > -1)
      cardIds.push(randCardId)
    }
  
    console.log(cardIds)
  
    for (let cardId of cardIds) {
      const cardObj = {...Cards.find(card => card.id === cardId), isFliped: false}
      cards.push({...cardObj})
      cards.push({...cardObj})
    }
  
    return cards
  }