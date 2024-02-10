import Board from './Board.js';
import Player from './Player';

const DEFAULT_TIME = '00:00:30.00'
const MAX_LEVEL = 11

export default class Game {
    constructor() {
        this.mode = 0
        this.board = new Board()
        this.players = {
            p1: new Player(),
            p2: new Player(),
        }
        this.level = 1
        this.time = DEFAULT_TIME
        this.playerTurn = 1
    }

    switchTurn() {
        this.playerTurn = this.playerTurn === 1 ? 2 : 1
    }

    startTimer() {
        // To be implemented
    }

    reset() {
        this.mode = 0
        this.board.clearCards()
        this.players.p1.reset()
        this.players.p2.reset()
        this.level = 1
        this.time = DEFAULT_TIME
        this.playerTurn = 1

        console.log('Game has been reset!')
    }

    nextLevel() {
        if (this.level === MAX_LEVEL) {
            console.log('Game has reached the maximum level')
            return
        }
        setTimeout(() => {
            this.board.setFlipAllCards(false)
        }, 500)
        setTimeout(() => {
            this.level++
            this.board.clearCards()
            this.board.getPairCard(this.level + 1)
            this.board.shuffle()
        }, 1000)
    }

    
}