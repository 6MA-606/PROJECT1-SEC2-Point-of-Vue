const DEFAULT_GAIN = 0.5 // 1

export default class SoundController {
    constructor() {
        this.audioContext = new AudioContext()
        this.bgmGainNode = this.audioContext.createGain()
        this.sfxGainNode = this.audioContext.createGain()
        this.currentBgmSource = null
        
        this.bgmGainNode.connect(this.audioContext.destination)
        this.sfxGainNode.connect(this.audioContext.destination)
        
        this.bgmGainNode.gain.value = DEFAULT_GAIN
        this.sfxGainNode.gain.value = DEFAULT_GAIN
    }

    playBGM(soundPath) {
        const audio = new Audio(soundPath)
        this.currentBgmSource?.disconnect()
        const audioSource = this.audioContext.createMediaElementSource(audio)
        audioSource.connect(this.bgmGainNode)
        this.currentBgmSource = audioSource
        audio.loop = true
        audio.play()
        this.audioContext.resume()
    }

    playSFX(soundPath) {
        const audio = new Audio(soundPath)
        const audioSource = this.audioContext.createMediaElementSource(audio)
        audioSource.connect(this.sfxGainNode)
        audio.play()
        this.audioContext.resume()
    }

    setBGMVolume(volume) {
        this.bgmGainNode.gain.value = volume /200
    }

    setSFXVolume(volume) {
        this.sfxGainNode.gain.value = volume /200
    }

    setMute(soundType, muteState, currentVolume) {
        if(soundType === 'bgm'){
            this.bgmGainNode.gain.value = muteState ? 0 : currentVolume / 200
        } else {
            this.sfxGainNode.gain.value = muteState ? 0 : currentVolume / 200
        }
    }

    clearBGM() {
        this.currentBgmSource?.disconnect()
    }
}