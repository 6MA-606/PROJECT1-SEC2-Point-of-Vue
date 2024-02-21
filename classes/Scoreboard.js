import { encrypt, decrypt } from '../src/utils/encryptionFunction'

export default class Scoreboard {
    constructor() {
        this.data = []
        this.currentPlayer = null
    }

    load() {
        const localData = localStorage.getItem('scoreboard')
        if (localData) {
            try {
                this.data = decrypt(localData)
            } catch (error) {
                return
            }
        } else return
    }

    save() {
        localStorage.setItem('scoreboard', encrypt(this.data))
    }

    addPlayer(player) {
        const currentPlayerScoreObj = {
            id: this.data.length,
            name: player.name,
            score: 0
        }
        this.data.push(currentPlayerScoreObj)
        this.currentPlayer = currentPlayerScoreObj
    }

    updatePlayerScore(player) {
        this.currentPlayer.score = player.scores
        this.data.sort((current, next) => next.score - current.score)
    }
}