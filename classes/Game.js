import Board from './Board.js';
import Player from './Player';

const DEFAULT_TIME = '30.00'
const MAX_LEVEL = 11

export default class Game {
    constructor() {
        this.mode = 0
        this.isPlaying = false
        this.board = new Board()
        this.players = {
            p1: new Player(),
            p2: new Player(),
        }
        this.setting = {
            volume: 100,
            isQuality: false,
            isMute: false,
        }
        this.level = 0
        this.time = DEFAULT_TIME
        this.timerInterval = null
        this.isTimerRunning = false
        this.isQuitOpen = false
        this.isGameOver = false
        this.playerTurn = 1
        this.bgm = ''
        this.endTime = 0
        this.winner = 0
        this.isSettingOpen = false
    }

    toggleMute() {
        this.setting.isMute = !this.setting.isMute
        console.log(this.setting.isMute);
    }

    setVolume(volume) {
        this.setting.volume = volume
    }

    setSettingOpenState(openState){
        this.isSettingOpen = openState
    }

    setQuitOpenState(openState){
        this.isQuitOpen = openState
    }

    switchTurn() {
        this.playerTurn = this.playerTurn === 1 ? 2 : 1
    }

    startTimer(second) {
        this.isTimerRunning = true
        this.endTime = Date.now() + (second * 1000)
        this.timerInterval = setInterval(() => {
            const durationLeft = this.endTime - Date.now()
            if(durationLeft <= 0){
                clearInterval(this.timerInterval)
                this.isTimerRunning = false
                this.time = '0.00'
            } else {
                this.time = Math.floor(durationLeft / 1000) + '.' + Math.floor(durationLeft % 1000 / 10).toString().padStart(2, '0')
            }
        }, 100)
    }

    addTime(second){
        this.endTime += second * 1000
    }

    reset() {
        this.mode = 0
        this.isPlaying = false
        this.board.clearCards()
        this.players.p1.reset()
        this.players.p2.reset()
        this.level = 0
        this.time = DEFAULT_TIME
        this.playerTurn = 1
        this.endTime = 0
        this.isGameOver = false
        this.bgm = ''
        this.isSettingOpen = false
        this.isQuitOpen = false
        clearInterval(this.timerInterval)
        this.isTimerRunning = false
        this.winner = 0

        console.log('Game has been reset!')
    }

    gameOver() {
        this.isGameOver = true
        this.isPlaying = false
        this.isSettingOpen = false
        this.isQuitOpen = false
        this.bgm = ''
    }

    nextLevel() {
        setTimeout(() => {
            this.board.setFlipAllCards(false)
        }, 500)
        setTimeout(() => {
            this.level++
            this.board.clearCards()
            this.board.getPairCard(this.level < 11 ? this.level + 1 : 12)
            this.board.shuffle()
        }, 1000)
    }
}