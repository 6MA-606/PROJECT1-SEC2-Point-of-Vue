import Board from './Board.js';
import Player from './Player';

const DEFAULT_TIME = '00:00:30.00'

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
        this.level++
        this.board.clearCards()
        this.board.getPairCard(this.level + 1)
    }

    
}