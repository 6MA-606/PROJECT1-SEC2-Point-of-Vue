<script setup>
import { computed, reactive, ref, toRefs, watch } from 'vue'
import GitHubIcon from './assets/github.svg?raw'
import BookIcon from './assets/book.svg?raw'
import DoorIcon from'./assets/door-open.svg?raw'
import SettingIcon from './assets/gear.svg?raw'
import ArrowLeftIcon from './assets/arrow-left.svg?raw'
import BigArrow from './assets/big-arrow.svg?raw'
import XIcon from './assets/x.svg?raw'
import { gotoUrl } from './utils/helperFunction.js'
import Cards from '../data/cards.json'
import Game from '../classes/Game'
import Cursor from '../classes/Cursor'
import SoundController from '../classes/SoundController.js'
import Scoreboard from '../classes/Scoreboard'

const SINGLEPLAYER_START_TIME = 30

const router = reactive({
  id: parseInt(localStorage.getItem('router_id')) || 100,
})
const scoreboard = reactive(new Scoreboard())
const isLoading = ref(false)
const pNameErrorMsg = ref('')

scoreboard.load()

// Start Page ID:100
// Select mode page ID:101
// Single player Mode ID:200
function setRouterId(id, saveRoute) {
  router.id = id
  localStorage.setItem('router_id', saveRoute ? id : 100)
}

const modes = [
  {
    title: "Challenge Mode (1P)",
    description: "More quick, more score",
    thumbnail: "/gamemode/singleplayer",
    gif: "https://media.giphy.com/media/CjmvTCZf2U3p09Cn0h/giphy.gif?cid=ecf05e475c1xpfvg5yn3inqfpb2ua5sn0l9jievwe1j3p4c4&ep=v1_gifs_search&rid=giphy.gif&ct=g",
    routerId: 200
  },
  {
    title: "Versus Mode (2P)",
    description: "Play with your friend",
    thumbnail: "/gamemode/multiplayer",
    gif: "https://media.giphy.com/media/CjmvTCZf2U3p09Cn0h/giphy.gif?cid=ecf05e475c1xpfvg5yn3inqfpb2ua5sn0l9jievwe1j3p4c4&ep=v1_gifs_search&rid=giphy.gif&ct=g",
    routerId: 201
  },
]

const cursor = reactive(new Cursor())
const soundController = new SoundController()

const gameContext = reactive(new Game())
if (!gameContext.loadSetting()) gameContext.saveSetting()



const { board, players, setting } = toRefs(gameContext)
const { p1, p2 } = players.value

p1.accuracy = computed(() => {
  if (p1.counter.flip === 0) return 0
  return ((p1.counter.pair / p1.counter.flip) * 100).toFixed(2)
})

/** @param {Event} e */
const handleBgClick = (e) => {
  if (e.target.id !== 'mode-select') return
  gameContext.mode = 0
}

let loadingCardId = 0
const routeWithTransition = (routerId, milliseconds, saveRoute) => {
  function getRandomCardLoading() {
    return Math.floor(Math.random() * (Cards.length - 1))
  }
  loadingCardId = getRandomCardLoading()
  isLoading.value = true
  setTimeout(() => {
    setRouterId(routerId, saveRoute)
    isLoading.value = false
  }, milliseconds)
}

const handleQuitBtn = () => {
  routeWithTransition(100, 2000, true)
}

const handleRestartBtn = (startModeFunction) => {
  routeWithTransition(200, 2000, false)
  setTimeout(() => {
    gameContext.reset()
    startModeFunction()
  }, 2000)
}

const handlePlayBtn = (routerId) => {
  if(routerId === 200){
    const errMsg = p1.isNameInvalid()
    if(errMsg.length > 0){
      pNameErrorMsg.value = errMsg
      return
    } else{
      routeWithTransition(routerId, 2000, false)
    }
  } else {
    routeWithTransition(routerId, 2000, false)
  }
}

function startSinglePlayerMode() {
  // if (p1.name === '') p1.name = 'Guest'

  gameContext.mode = 1
  gameContext.level = 1
  board.value.clearCards()
  board.value.getPairCard(2)
  board.value.shuffle()
  gameContext.startTimer(3)
  scoreboard.load()
  scoreboard.addPlayer(p1)
  scoreboard.sliceScoreboard(5)
}

const singlePlayerCardClick = (card) => {
  console.log('singlePlayerCardClick')
  if (!gameContext.isPaused && gameContext.isPlaying && !card.isRevealed && p1.selectedCards.length < 2) {
    soundController.playSFX("/sounds/flipcard.mp3")
    card.reveal()
    p1.addCard(card)
  } else return
  
  if (p1.selectedCards.length === 2) {
    p1.addFlipCount()
    if (p1.isPaired()) {
      soundController.playSFX('/sounds/pointGain.mp3')
      p1.addPairCount()
      p1.addScores(gameContext.level * gameContext.scoreMultiplier++)
      p1.clearCards()
      scoreboard.updatePlayerScore(p1)
      scoreboard.sliceScoreboard(5)
      if (gameContext.level < 11) gameContext.addTime(5)
    } else {
      gameContext.scoreMultiplier = 1
      gameContext.pause()
      setTimeout(() => {
        p1.concealAllSelectedCard()
        p1.clearCards()
        gameContext.resume()
      }, 1000)
    }
  }

  if (board.value.isAllCardRevealed()) {
    gameContext.nextLevel()
  }
}

function startMultiPlayerMode() {
  gameContext.bgm = "bgmMultiplayer"
  board.value.clearCards()
  board.value.getPairCard(12)
  board.value.shuffle()
  if(Math.random() < 0.5) gameContext.switchTurn()
}

const multiplayerCardsClick = (card) => {
  const currentPlayer = players.value[`p${gameContext.playerTurn}`]
  if (!gameContext.isPaused && !card.isRevealed && currentPlayer.selectedCards.length < 2) {
    soundController.playSFX("/sounds/flipcard.mp3")
    card.reveal()
    currentPlayer.addCard(card)
  } else return

  if (currentPlayer.selectedCards.length === 2) {
    if (currentPlayer.isPaired()) {
      currentPlayer.addScores(1)
      currentPlayer.clearCards()
      soundController.playSFX('/sounds/pointGain.mp3')
    } else {
      setTimeout(() => {
        currentPlayer.concealAllSelectedCard()
        currentPlayer.clearCards()
        gameContext.switchTurn()
      }, 1000)
    }
  }
  if(board.value.isAllCardRevealed()){
    if(p1.scores !== p2.scores){
      gameContext.winner = p1.scores > p2.scores ? 1 : 2
    } else {
      gameContext.pause()
      setTimeout(() => {
        board.value.concealAllCard()
        setTimeout(() => {
          board.value.clearCards()
          board.value.getPairCard(12)
          board.value.shuffle()
          gameContext.resume()
        }, 1000)
      }, 500)
    }
  }
}

watch(
  () => router.id,
  (newRouterId) => {
    console.log(newRouterId)
    switch (newRouterId) {
      case 100:
        gameContext.reset()
        board.value.getPairCard(2)
        board.value.shuffle()
        break
      case 200:
        console.log('single player mode start')
        startSinglePlayerMode()
        break
      case 201:
        console.log('multiplayer mode start')
        startMultiPlayerMode()
        break
    }
  },
  { immediate: true }
)

watch(
  () => gameContext.isTimerRunning,
  (runningState) => {
    if (gameContext.mode === 1) {
      if (!runningState && gameContext.isPlaying) {
        soundController.clearBGM()
        gameContext.gameOver()
        scoreboard.save()
      } else if (!runningState && !gameContext.isPlaying) {
        gameContext.isPlaying = true
      }
    }
  }
)

watch(
  () => gameContext.isPlaying,
  (playingState) => {
    if (playingState && gameContext.mode === 1) {
      gameContext.startTimer(SINGLEPLAYER_START_TIME)
      console.log('play')
    }
  }
)

watch(
  () => gameContext.level,
  (newLevel) => {
    if (newLevel === 1) {
      gameContext.bgm = 'bgmPhase1'
    } else if (newLevel === 5) {
      gameContext.bgm = 'bgmPhase2'
    } else if (newLevel === 11) {
      gameContext.bgm = 'bgmPhase3'
    }
  }
)

watch(
  () => gameContext.bgm,
  (newBgm) => {
    
    if (newBgm === '') {
      soundController.clearBGM()
      return
    }
    soundController.playBGM(`/sounds/${newBgm}.mp3`)
  }
)

watch(
  () => gameContext.setting.bgmVolume,
  (newValue)=>{
    soundController.setBGMVolume(newValue)
    console.log("Sound volume is ", newValue);
  },
  {immediate:true}
)

watch(
  () => gameContext.setting.sfxVolume,
  (newValue)=>{
    soundController.setSFXVolume(newValue)
    console.log("Sound volume is ", newValue);
  },
  {immediate:true}
)

//handle mute function
watch(
  ()=> gameContext.setting.isBgmMute,
  (newValue)=>{
    console.log('isBgmMute executed')
    soundController.setMute('bgm', newValue, gameContext.setting.bgmVolume)
  },
  {immediate:true}
)

watch(
  ()=> gameContext.setting.isSfxMute,
  (newValue)=>{
    console.log('isSfxMute executed')
    soundController.setMute('sfx', newValue, gameContext.setting.sfxVolume)
  },
  {immediate:true}
)

watch(
  () => gameContext.setting,
  () => { gameContext.saveSetting() },
  { deep: true }
)

</script>

<template>
  <main
    @mousemove="cursor.handleMouseMove($event)"
    @mouseleave="cursor.reset()"
    @mousedown="cursor.mouseDown()"
    @mouseup="cursor.mouseUp()"
    class="relative overflow-hidden h-screen transition-all duration-500"
  >
    <!-- * mouse cursor -->
    <div
      :style="`transform: translate(${cursor.x}, ${cursor.y})`"
      class="hidden lg:block absolute pointer-events-none z-[100] filter drop-shadow-glow"
    >
      <div class="absolute translate-x-[-50%] translate-y-[-250%]"></div>
      <div
        :class="cursor.isHovered ? 'opacity-50 scale-75' : ''"
        class="absolute w-5 h-5 translate-x-[-50%] translate-y-[-50%] transition-all duration-150 bg-mythmatch-100 rounded-full"
      >
      </div>
      <div
        :class="`${cursor.isHovered && !cursor.isMouseDown ? 'opacity-50 scale-125' : ''} ${cursor.isMouseDown ? 'opacity-50 scale-75' : ''}`"
        class="absolute w-10 h-10 translate-x-[-50%] translate-y-[-50%] transition-all duration-150 border-2 border-mythmatch-200 rounded-full"
      >
      </div>
    </div>

    <!-- * landing page section begin -->
    <section
      v-if="router.id === 100"
      id="landing-page"
      class="h-screen flex flex-col justify-center items-center gap-16 sm:gap-20"
    >
      <div id="game-title" class="flex gap-2 sm:gap-6">
        <div class="hidden sm:block -rotate-12 text-[0.5rem] sm:text-[1rem]">
          <div
            :style="`background-image: linear-gradient(135deg, ${Cards[0].color.primary} 0% 10%, #303 10% 90% , ${Cards[0].color.secondary} 90% 100%)`"
            class="absolute w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex flex-col justify-center items-center rounded-lg border-2 border-mythmatch-100 origin-bottom -rotate-45"
          >
            <div class="font-bold font-mythmatch text-xs text-mythmatch-100">
              {{ Cards[0].name }}
            </div>
            <img
              :src="`/cards/${gameContext.setting.quality}/${Cards[0].arts}.${setting.quality === 'high' ? 'png' : 'webp'}`"
              :alt="Cards[0].name"
              class="rounded-lg w-10/12"
            />
            <div class="rotate-180 font-bold font-mythmatch text-xs text-mythmatch-100">
              {{ Cards[0].name }}
            </div>
          </div>
          <div class="bg-black w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex justify-center items-center rounded-lg border-2 border-mythmatch-100 overflow-hidden">
            <img
              :src="`/cards/${gameContext.setting.quality}/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
              alt="backcard"
              class="w-full h-full"
            />
          </div>
        </div>
        <div>
          <img
            :src="`/logo/${gameContext.setting.quality === 'low' ? 'MythMatch_logo_low.svg':'MythMatch_logo.svg'}`"
            alt="MythMatch_logo"
            class="w-[22rem] lg:w-[30rem] filter drop-shadow-glow animate-[pulse_2.5s_infinite_6000ms]"
          />
        </div>
        <div class="hidden sm:block rotate-12 text-[0.5rem] sm:text-[1rem]">
          <div class="absolute bg-black w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex justify-center items-center rounded-lg border-2 border-mythmatch-100 overflow-hidden origin-bottom rotate-45 z-10">
            <img
              :src="`/cards/${gameContext.setting.quality}/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
              alt="backcard"
              class="w-full h-full"
            />
          </div>
          <div
            :style="`background-image: linear-gradient(135deg, ${Cards[1].color.primary} 0% 10%, #303 10% 90% , ${Cards[1].color.secondary} 90% 100%)`"
            class="w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex flex-col justify-center items-center rounded-lg border-2 border-mythmatch-100"
          >
            <div class="font-bold font-mythmatch text-xs text-mythmatch-100">
              {{ Cards[1].name }}
            </div>
            <img
              :src="`/cards/${gameContext.setting.quality}/${Cards[1].arts}.${setting.quality === 'high' ? 'png' : 'webp'}`"
              :alt="Cards[1].name"
              class="rounded-lg w-10/12"
            />
            <div class="rotate-180 font-bold font-mythmatch text-xs text-mythmatch-100">
              {{ Cards[1].name }}
            </div>
          </div>
        </div>
      </div>
      <div id="landing-4-card" class="hidden gap-8 y-xs:flex flex-wrap">
        <div
          v-for="(card, index) of board.cards"
          @mouseover="cursor.hover()"
          @mouseleave="cursor.unHover()"
          :key="index"
          :class="index > 0 ? 'hidden sm:block w-[8rem] h-[11.2rem]' : 'w-[10rem] h-[14rem] sm:w-[8rem] sm:h-[11.2rem]'"
          class="lg:w-[10rem] lg:h-[14rem] bg-transparent transition-all duration-500 perspective-1000 filter hover:drop-shadow-glow active:scale-95"
          @click="card.isRevealed = !card.isRevealed; soundController.playSFX('/sounds/flipcard.mp3')"
        >
          <div
            :class="card.isRevealed ? 'flip' : ''"
            class="transition-transform w-full h-full duration-500 transform-style-3d relative"
          >
            <div class="absolute bg-black w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-4 border-mythmatch-100">
              <img
                :src="`/cards/${gameContext.setting.quality}/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
                alt="backcard"
                class="w-full h-full"
              />
            </div>
            <div
              :style="`background-image: linear-gradient(135deg, ${card.color.primary} 0% 10%, #303 10% 90% , ${card.color.secondary} 90% 100%)`"
              class="flip absolute w-full h-full flex flex-col gap-1 justify-center items-center rounded-lg border-4 border-mythmatch-100"
            >
              <div class="font-bold font-mythmatch text-xl text-mythmatch-100">
                {{ card.name }}
              </div>
              <img :src="`/cards/${gameContext.setting.quality}/${card.arts}.${setting.quality === 'high' ? 'png' : 'webp'}`" :alt="card.name" class="rounded-lg w-10/12" />
              <div class="rotate-180 font-bold font-mythmatch text-xl text-mythmatch-100">
                {{ card.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col items-center gap-5">
        <button
          id="play-btn"
          type="button"
          class="btn-mythmatch-landing"
          alt="home-play-btn"
          @mouseover="cursor.hover()"
          @mouseleave="cursor.unHover()"
          @click="routeWithTransition(101, 2000, true)"
        >
          Play
        </button>
        <button
          @mouseover="cursor.hover()"
          @mouseleave="cursor.unHover()"
          @click="gameContext.setSettingOpenState(true)"
          class="btn bg-gray-800 text-stone-100 hover:bg-gray-800 border-0 w-10/12"
          type="button"
        >
          Setting
        </button>
      </div>
      <div
        id="corner-btn-group"
        class="absolute flex xs:flex-col gap-2 right-4 bottom-4"
      >
        <div
          class="lg:tooltip hover:tooltip-open lg:tooltip-left tooltip-info"
          data-tip="How to play?"
        >
          <button
            @mouseover="cursor.hover()"
            @mouseleave="cursor.unHover()"
            @click="gameContext.setManualOpenState(true)"
            type="button"
            class="btn btn-circle bg-mythpurple-600 border-2 border-mythmatch-100 hover:border-mythmatch-100 btn-lg hover:bg-mythpurple-700 text-mythmatch-100"
          >
            <div v-html="BookIcon" class="scale-[1.75]"></div>
          </button>
        </div>
        <div
          class="lg:tooltip hover:tooltip-open lg:tooltip-left tooltip-info"
          data-tip="This project on GitHub"
        >
          <button
            @mouseover="cursor.hover()"
            @mouseleave="cursor.unHover()"
            @click="gotoUrl('https://github.com/6MA-606/PROJECT1-SEC2-Point-of-Vue/', true)"
            type="button"
            class="btn btn-circle border-2 border-mythmatch-100 hover:border-mythmatch-100 btn-lg bg-gray-800 hover:bg-gray-600 text-mythmatch-100"
          >
            <div v-html="GitHubIcon" class="scale-[2]"></div>
          </button>
        </div>
      </div>
    </section>
    <!-- * landing page section end -->

    <!-- * select mode section begin -->
    <section
      v-if="router.id === 101"
      @click="handleBgClick"
      class="grid place-items-center select-none"
    >
      <button
        @click="routeWithTransition(100, 2000, true)"
        type="button"
        class="btn btn-warning absolute left-4 top-4 z-20"
      >
        <div v-html="ArrowLeftIcon"></div>
        <div>Back</div>
      </button>

      <div
      id="mode-select"
      class="w-full h-screen overflow-hidden y-xs:overflow-auto y-xs:lg:overflow-hidden flex flex-row y-xs:flex-col y-xs:lg:flex-row items-center justify-center y-xs:justify-start y-xs:lg:justify-center y-xs:py-36 lg:py-0 gap-20 perspective-1000"
      >
        <!-- pc -->
        <div
          v-for="(mode, index) in modes"
          :key="index"
          :class="[
            gameContext.mode === index + 1 && gameContext.mode !== 0
              ? 'border-2 z-10 lg:scale-110 transform-style-3d h-[32rem] drop-shadow-2xl'
              : '',
            gameContext.mode === index + 1 && gameContext.mode === 1 ? 'rotate-y-12' : '',
            gameContext.mode === index + 1 && gameContext.mode === 2 ? '-rotate-y-12' : '',
          ]"
          @mouseover="cursor.hover()"
          @mouseleave="cursor.unHover()"
          @click="gameContext.mode = index + 1"
          class="hidden y-xs:lg:flex relative w-[15rem] y-xs:w-[20rem] h-[24rem] y-xs:lg:w-[22rem] px-5 py-10 flex-col justify-center items-center gap-4 bg-[#0007] backdrop-blur-sm border border-mythmatch-100 rounded-lg hover:shadow-lg hover:shadow-[#fff5]  transition-all duration-500 linear cursor-pointer"
        >
          <div class="w-[7em] h-[7em] y-xs:w-[13rem] y-xs:h-[13rem] y-xs:lg:w-[13rem] y-xs:lg:h-[13rem]">
            <img
              :src="(
                gameContext.mode === index + 1 && gameContext.mode !== 0
                  ? mode.gif
                  : mode.thumbnail + '.webp'
              )"
              :alt="mode.title"
              class="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div class="flex flex-col gap-2">
            <div class="text-center text-[2em] font-bold font-mythmatch text-stone-100">
              {{ mode.title }}
            </div>
            <div class="text-center text-[1em] text-stone-100">{{ mode.description }}</div>
          </div>
          <div class="flex flex-col items-center gap-4 w-full">
            <div
              v-if="index + 1 === 1"
              :class="[
                gameContext.mode === index + 1
                  ? 'h-20'
                  : 'h-0'
              ]"
              class="flex flex-col items-center transition-all duration-500 linear w-full overflow-hidden"
            >
              <div
                :class="[
                  gameContext.mode === index + 1
                    ? 'opacity-100 -translate-x-[100%] delay-500'
                    : 'opacity-0 -translate-x-[150%]'
                ]"
                v-html="BigArrow"
                class="absolute scale-75 transition-all duration-1000 linear text-mythmatch-100 -translate-y-1"
              >
              </div>
              <div
                :class="[
                  gameContext.mode === index + 1
                    ? 'opacity-100 translate-x-[100%] delay-500'
                    : 'opacity-0 translate-x-[150%]'
                ]"
                v-html="BigArrow"
                class="absolute scale-75 rotate-180 transition-all duration-[1000ms] linear text-mythmatch-100 -translate-y-1"
              >
              </div>
              <label class="flex flex-col items-center gap-2">
                <div
                  :class="pNameErrorMsg ? 'text-red-500' : 'text-stone-100'"
                  class="text-xs"
                >
                  {{pNameErrorMsg ? pNameErrorMsg : 'Enter your name (or play as guest)'}}
                </div>
                <input
                  v-model="p1.name"
                  type="text"
                  placeholder="Your name"
                  class="input-mythmatch max-w-[13rem]"
                />
              </label>
            </div>
            <button
              type="button"
              @click="handlePlayBtn(mode.routerId)"
              alt="play-challengeMode-button"
              :class="[
                gameContext.mode === index + 1
                  ? 'h-12'
                  : 'h-0'
              ]"
              class="btn-mythmatch-play text-[1em] font-semibold overflow-hidden"
              style="transition: height 250ms linear, transform 150ms, border 150ms"
            >
              Play
            </button>
          </div>
        </div>

        <!-- mobile -->
        <div
          v-for="(mode, index) in modes"
          :key="index"
          :class="[
            gameContext.mode === index + 1 && gameContext.mode !== 0
              ? 'border-2 z-10 transition-all duration-500 drop-shadow-2xl'
              : ''
          ]"
          @click="gameContext.mode = index + 1"
          class="flex y-xs:lg:hidden relative w-[15rem] y-xs:w-[20rem] px-5 py-10 flex-col justify-center items-center gap-4 border rounded-lg transition-all hover:shadow-lg hover:shadow-[#fff5] bg-mythpurple-800 border-mythmatch-100"
        >
          <div class="w-[7em] h-[7em] y-xs:w-[13rem] y-xs:h-[13rem] y-xs:lg:w-[13rem] y-xs:lg:h-[13rem]">
            <img
              :src="mode.thumbnail + '.svg'"
              :alt="mode.title"
            />
          </div>
          <div class="flex flex-col gap-2">
            <div class="text-center text-[1.5em] text-stone-100 font-bold font-mythmatch">
              {{ mode.title }}
            </div>
            <div class="text-center text-[0.875em] text-stone-100 opacity-50">{{ mode.description }}</div>
          </div>
          <div v-show="gameContext.mode === index + 1" class="flex flex-col justify-center h-[50%] y-xs:h-[40%] w-full items-center gap-[0.45rem] absolute bottom-0 bg-mythpurple-800 rounded-lg">
            <div
              v-if="gameContext.mode === index + 1 && gameContext.mode === 1" 
              class="flex flex-col items-center gap-2 text-sm"
            >
              <div
                :class="pNameErrorMsg ? 'text-red-400' : 'text-stone-100'"
                class="text-xs text-center"
              >
                {{pNameErrorMsg ? pNameErrorMsg : 'Enter your name (or play as guest)'}}
              </div>
              <input
                v-model="p1.name"
                type="text"
                placeholder="Your name"
                class="w-10/12 h-[2rem] text-center bg-mythpurple-900 text-stone-100 rounded-lg"
              />
            </div>
            <button
              type="button"
              @click="handlePlayBtn(mode.routerId)"
              class="btn-mythmatch-play text-[1em] text-stone-100 font-semibold"
              alt="play-challengeMode-button"
            >
              Play
            </button>
          </div>
        </div>
      </div>
    </section>
    <!-- * select mode section end -->

    <!-- * single player mode section begin -->
    <section
      v-if="router.id === 200"
      :style="`background-image: url(/bg/bg${gameContext.level >= 11 ? '2' : ''}.svg); background-size: cover; background-position: center; background-repeat: no-repeat;`"
      class="h-screen flex flex-col lg:flex-row lg:justify-center items-center"
    >
      <!-- mobile setting section (top right) -->
      <div class="flex y-xs:lg:hidden absolute top-3 right-3 gap-3 z-10">
        <button @click="gameContext.setSettingOpenState(true)" class="btn-mythmatch-circle bg-mythpurple-800 text-stone-100" type="button">
          <div v-html="SettingIcon"></div>
        </button>
        <button @click="gameContext.setQuitOpenState(true)" class="btn-mythmatch-circle bg-red-400 text-stone-100" type="button">
          <div v-html="DoorIcon"></div>
        </button>
      </div>

      <!-- mobile horizontal logo section (left) -->
      <div class="flex y-xs:hidden w-[20%] flex-col items-center absolute left-0 top-5">
        <img :src="`/logo/${gameContext.setting.quality === 'low' ? 'MythMatch_logo_low.svg':'MythMatch_logo.svg'}`" alt="logo" class="w-32" />
      </div>

      <!-- mobile horizontal score section (left) -->
      <div class="flex y-xs:hidden w-[20%] flex-col justify-center items-center absolute left-0 h-full">
        <div class="h-3/6 flex flex-col gap-10">
          <div class="flex flex-col items-center">
            <div class="text-2xl text-mythmatch-100 font-mythmatch">Level</div>
            <div class="text-3xl text-mythmatch-100 font-semibold font-mythmatch">{{ gameContext.level }}</div>
          </div>
          <div class="flex flex-col items-center">
            <div class="text-2xl text-mythmatch-100 font-mythmatch">Scores</div>
            <div class="text-3xl text-mythmatch-100 font-semibold font-mythmatch">{{ p1.scores }}</div>
            <div v-show="gameContext.scoreMultiplier > 1" class="text-mythmatch-100 font-mythmatch self-end">Combo x {{ gameContext.scoreMultiplier }}</div>
          </div>
        </div>
      </div>
      <!-- mobile horizontal score section (right) -->
      <div class="flex y-xs:hidden w-[20%] flex-col justify-center items-center absolute right-0 h-full">
        <div class="h-3/6 flex flex-col gap-10">
          <div class="flex flex-col text-center">
            <div class="text-2xl text-mythmatch-100 font-mythmatch">Time</div>
            <div class="text-3xl text-mythmatch-100 font-bold font-mythmatch-mono tracking-wide">{{ gameContext.time }}</div>
          </div>
          <div class="flex flex-col items-center">
            <div class="text-2xl text-mythmatch-100 font-mythmatch">Your Rank</div>
            <div class="text-3xl text-mythmatch-100 font-semibold font-mythmatch">{{ scoreboard.data.findIndex((player) => player.id === scoreboard.currentPlayer.id) + 1 }}</div>
          </div>
        </div>
      </div>

      <!-- mobile vertical score section -->
      <div class="hidden y-xs:flex y-xs:lg:hidden w-full mb-4 flex-col items-center">
        <div class="w-full flex flex-col">
          <div class="my-5 flex justify-evenly w-full">
            <img :src="`/logo/${gameContext.setting.quality === 'low' ? 'MythMatch_logo_low.svg':'MythMatch_logo.svg'}`" alt="logo" class="w-40" />
          </div>
          <div class="flex justify-evenly items-center">
            <div class="flex flex-col items-center">
              <div class="text-2xl text-mythmatch-100 font-mythmatch">Level</div>
              <div class="text-3xl text-mythmatch-100 font-semibold font-mythmatch">{{ gameContext.level }}</div>
            </div>
            <div class="flex flex-col items-center">
              <div v-show="gameContext.scoreMultiplier > 1" class="absolute text-xs text-mythmatch-100 font-mythmatch -translate-y-[90%] self-end">Combo x {{ gameContext.scoreMultiplier }}</div>
              <div class="text-2xl text-mythmatch-100 font-mythmatch">Scores</div>
              <div class="text-3xl text-mythmatch-100 font-semibold font-mythmatch">{{ p1.scores }}</div>
            </div>
            <div class="flex flex-col items-center">
              <div class="text-2xl text-mythmatch-100 font-mythmatch">Your Rank</div>
              <div class="text-3xl text-mythmatch-100 font-semibold font-mythmatch">{{ scoreboard.data.findIndex((player) => player.id === scoreboard.currentPlayer.id) + 1 }}</div>
            </div>
            <div class="flex flex-col text-center">
              <div class="text-2xl text-mythmatch-100 font-mythmatch">Time</div>
              <div class="text-3xl text-mythmatch-100 font-bold font-mythmatch-mono tracking-wide">{{ gameContext.time }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- card section -->
      <div class="w-full h-full y-xs:h-auto lg:w-9/12 grid place-items-center">
        <div
          :class="`grid-cols-${gameContext.level < 4 ? gameContext.level + 1 : 4} xs:grid-cols-${gameContext.level < 6 ? gameContext.level + 1 : 6}`"
          class="w-fit grid grid-flow-row gap-1 xs:gap-2"
        >
          <div
            v-for="(card, index) of board.cards"
            @mouseover="cursor.hover()"
            @mouseleave="cursor.unHover()"
            :key="index"
            class="cursor-pointer w-[5rem] h-[5rem] lg:w-[7rem] lg:h-[9.8rem] xl:w-[7.6rem] xl:h-[10.64rem] bg-transparent transition-all duration-500 perspective-1000 filter hover:drop-shadow-glow active:scale-95"
            @click="singlePlayerCardClick(card)"
          >
            <div
              :class="card.isRevealed ? 'flip' : ''"
              class="transition-transform w-full h-full duration-500 transform-style-3d relative"
            >
              <div class="absolute bg-black w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-2 lg:border-4 border-mythmatch-100">
                <img
                  :src="`/cards/${gameContext.setting.quality}/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
                  alt="backcard"
                  class="w-full lg:h-full"
                />
              </div>
              <div
                :style="`background-image: linear-gradient(135deg, ${card.color.primary} 0% 10%, #303 10% 90% , ${card.color.secondary} 90% 100%)`"
                class="flip transition-all absolute w-full h-full flex flex-col gap-1 justify-center items-center rounded-lg border-2 lg:border-4 border-mythmatch-100"
              >
                <div class="hidden lg:flex font-bold font-mythmatch text-xl text-mythmatch-100">
                  {{ card.name }}
                </div>
                <img
                  :src="`/cards/${gameContext.setting.quality}/${card.arts}.${setting.quality === 'high' ? 'png' : 'webp'}`"
                  :alt="card.name"
                  class="rounded-lg w-10/12"
                />
                <div
                  class="hidden lg:flex rotate-180 font-bold font-mythmatch text-xl text-mythmatch-100"
                >
                  {{ card.name }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- lg: left info section begin -->
      <div class="hidden lg:block lg:w-3/12">
        <div class="h-screen w-full relative">
          <div class="absolute inset-4 bg-[#0003] rounded-lg border-2 border-mythmatch-100 backdrop-blur-md flex flex-col justify-around items-center">
            <div class="w-full flex flex-col items-center gap-6">
              <div class="w-10/12">
                <img :src="`/logo/${gameContext.setting.quality === 'low' ? 'MythMatch_logo_low.svg':'MythMatch_logo.svg'}`" alt="logo" />
              </div>
              <div class="w-full flex justify-evenly">
                <div class="text-mythmatch-100 flex flex-col items-center justify-center">
                  <div class="text-3xl font-mythmatch">Level</div>
                  <div class="text-5xl font-bold font-mythmatch">{{ gameContext.level }}</div>
                </div>
                <div class="text-mythmatch-100 flex flex-col items-center justify-center">
                  <div v-show="gameContext.scoreMultiplier > 1" class="absolute font-mythmatch -translate-y-[215%] self-end">Combo x {{ gameContext.scoreMultiplier }}</div>
                  <div class="text-3xl font-mythmatch">Your Score</div>
                  <div class="text-5xl font-bold font-mythmatch">{{ p1.scores }}</div>
                </div>
              </div>
              <div class="text-mythmatch-100 flex flex-col items-center justify-center">
                <div class="text-3xl font-mythmatch">Time</div>
                <div class="text-5xl font-mythmatch-mono tracking-wide">{{ gameContext.time }}</div>
              </div>
            </div>
            <div class="rounded-lg overflow-hidden w-10/12 h-[40%] border-mythmatch-100 border-2 bg-mythpurple-800">
              <table class="table table-sm h-full">
                <thead class="bg-mythpurple-500 text-mythmatch-50">
                  <tr class="text-center border-0">
                    <th colspan="3">Leader Board</th>
                  </tr>
                  <tr class="text-center">
                    <th></th>
                    <th>Player</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody class="bg-mythpurple-700 text-mythmatch-100">
                  <tr
                    v-for="(playerScore, index) in scoreboard.sliceData"
                    :key="index"
                    :class="playerScore.id === scoreboard.currentPlayer.id ? 'bg-mythpurple-800' : 'bg-mythpurple-700'"
                    class="text-center border-mythpurple-600"
                  >
                    <td>{{ playerScore.rank }}</td>
                    <td>{{ playerScore.name }}{{ playerScore.id === scoreboard.currentPlayer.id ? ' (You)' : '' }}</td>
                    <td>{{ playerScore.score }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="flex gap-4">
              <button
                @click="gameContext.setSettingOpenState(true)"
                type="button"
                class="btn"
              >
                Setting
              </button>
              <button
                @click="gameContext.setQuitOpenState(true)"
                type="button"
                class="btn btn-error"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- * single player mode section end -->

    <!-- * single player countdown section begin -->
    <section
      v-if="gameContext.mode === 1 && !gameContext.isPlaying && gameContext.isTimerRunning"
      class="absolute top-0 left-0 z-40 w-full h-screen bg-[#000c] flex flex-col justify-center items-center"
    >
      <div class="text-6xl font-mythmatch text-mythmatch-100">{{ Math.round(gameContext.time) }}</div>
    </section>
    <!-- * single player countdown section end -->
    
    <!-- * single player quit section begin -->
    <section
      v-if="router.id === 200"
      :class="gameContext.isQuitOpen ? 'translate-y-[-100%] opacity-100' : 'translate-y-[0%] opacity-0'"
      class="absolute transition-opacity z-40 w-full h-screen bg-[#000c] backdrop-blur-sm flex flex-col gap-16 justify-center items-center text-center"
    >
      <div class="text-6xl y-xs:text-5xl y-xs:xs:text-8xl font-mythmatch text-mythmatch-100">You wanna exit?!</div>
      <div class="flex flex-col gap-3">
        <div class="text-xl flex items-center gap-2 text-stone-100">
          <div>If you want restart, you can click</div>
          <button
            @click="handleRestartBtn(startSinglePlayerMode)"
            type="button"
            class="btn btn-sm btn-outline text-stone-100 btn-warning"
          >
            <div>Restart</div>
          </button>
        </div>
        <div class="text-xl text-stone-100">but you want to really quit, right?</div>
      </div>
      <div class="flex gap-8">
        <button
          @click="handleQuitBtn"
          type="button"
          class="btn btn-lg"
        >
          <div>Yes</div>
        </button>
        <button
          @click="gameContext.setQuitOpenState(false)"
          type="button"
          class="btn btn-lg btn-warning"
        >
          <div>No</div>
        </button>
      </div>
    </section>
    <!-- * single player quit section end -->

    <!-- * single player game over begin -->
    <section
      v-if="router.id === 200"
      :class="gameContext.isGameOver && gameContext.mode === 1 ? 'translate-y-[-100%] opacity-100' : 'translate-y-[0%] opacity-0'"
      class="absolute transition-opacity duration-[2.5s] z-40 w-full h-screen bg-[#000c] flex flex-col gap-16 justify-start lg:justify-center items-center text-center overflow-y-auto py-32 lg:py-0"
    >
      <div class="text-6xl xs:text-8xl font-mythmatch text-mythmatch-100">Game Over</div>
      <div class="flex flex-col items-center lg:flex-row lg:justify-center gap-24">
        <div class="flex flex-col gap-10 justify-center">
          <div class="flex justify-center">
            <div class="flex flex-col items-center gap-3 w-48 xs:w-64">
              <div class="text-2xl xs:text-3xl text-stone-100 font-mythmatch">Total Score</div>
              <div class="text-4xl xs:text-6xl font-semibold text-mythmatch-100 font-mythmatch">{{ p1.scores }}</div>
            </div>
            <div class="w-1 rounded-lg bg-mythmatch-200"></div>
            <div class="flex flex-col items-center gap-3 w-48 xs:w-64">
              <div class="text-2xl xs:text-3xl text-stone-100 font-mythmatch">Rank</div>
              <div class="text-4xl xs:text-6xl font-semibold text-mythmatch-100 font-mythmatch">{{ scoreboard.data.findIndex((player) => player.id === scoreboard.currentPlayer.id) + 1 }}</div>
            </div>
          </div>
          <div>
            <div class="text-xl xs:text-2xl text-stone-100">You've flipped {{ p1.counter.flip }} pair(s)</div>
            <div class="text-xl xs:text-2xl text-stone-100">You've collected {{ p1.counter.pair }} correct pair(s)</div>
            <div class="text-xl xs:text-2xl text-stone-100">Accuracy {{ p1.accuracy }}%</div>
          </div>
        </div>
        <div class="w-[90vw] lg:w-[30vw] rounded-lg border-mythmatch-100 border-2 h-96 overflow-y-auto bg-mythpurple-800">
          <table class="table table-sm table-pin-rows w-full">
            <thead class="text-mythmatch-50">
              <tr class="text-center bg-mythpurple-500 border-0">
                <th colspan="3">Leader Board</th>
              </tr>
              <tr class="text-center bg-mythpurple-500">
                <th></th>
                <th>Player</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody class="bg-mythpurple-700 text-mythmatch-100">
              <tr
                v-for="(playerScore, index) in scoreboard.data"
                :id="playerScore === scoreboard.currentPlayer ? 'current-player' : ''"
                :key="index"
                :class="scoreboard.currentPlayer === playerScore ? 'bg-mythpurple-800' : 'bg-mythpurple-700'"
                class="text-center border-t-[1px] border-mythpurple-600"
              >
                <td>{{ index + 1 }}</td>
                <td>{{ playerScore.name }}{{ scoreboard.currentPlayer === playerScore ? ' (You)' : '' }}</td>
                <td>{{ playerScore.score }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <button
        @click="handleQuitBtn" 
        type="button" 
        class="btn btn-warning"
      >
        <div v-html="ArrowLeftIcon"></div>
        <div>Quit</div>
      </button>
    </section>
    <!-- * single player game over end -->
    
    <!-- * multiplayer mode section begin -->
    <section
      v-if="router.id === 201"
      class="h-screen flex items-center justify-evenly" 
      :style="(
        gameContext.playerTurn === 1
          ? 'background-image: linear-gradient(to right, #f55a 0%, #0000 50% 100%)' 
          : 'background-image: linear-gradient(to left, #f55a 0%, #0000 50% 100%)'
      )"
    >
      <!-- {{ gameContext.playerTurn }} -->
      <div class="hidden sm:flex flex-col lg:flex items-center justify-center text-mythmatch-100">
        <div class="text-[1rem] y-xs:lg:text-[2rem] font-mythmatch ">Player 1 score</div>
        <div class="text-[4rem] y-xs:lg:text-[8rem] font-mythmatch font-bold drop-shadow-glow">{{ p1.scores }}</div>
      </div>
      <div class="lg:w-fit grid place-items-center">
        <div class="sm:hidden w-full mb-4 flex flex-col items-center">
          <div class="w-full flex flex-col">
            <div class="my-5 flex justify-evenly w-full">
              <img
                :src="`/logo/${gameContext.setting.quality === 'low' ? 'MythMatch_logo_low.svg':'MythMatch_logo.svg'}`"
                alt="logo"
                class="w-40"
              />
            </div>
            <div class="flex justify-evenly items-center gap-2">
              <div class="flex flex-col  lg:flex items-center justify-center text-mythmatch-100">
                <div class="text-[1rem] font-mythmatch">Player 1 score</div>
                <div class="text-[2rem] font-mythmatch drop-shadow-glow">{{ p1.scores }}</div>
              </div>
              <div class="flex flex-col lg:flex text-mythmatch-100 items-center justify-center">
                <div class="text-[1rem] font-mythmatch">Player 2 score</div>
                <div class="text-[2rem] font-mythmatch drop-shadow-glow">{{ p2.scores }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="hidden sm:block w-24 absolute top-3 left-5">
          <img
            :src="`/logo/${gameContext.setting.quality === 'low' ? 'MythMatch_logo_low.svg':'MythMatch_logo.svg'}`"
            alt="logo"
            class="w-40" 
          />    
        </div>
        <div class="absolute top-3 right-3 flex gap-3">
          <button
            @click="gameContext.setSettingOpenState(true)"
            class="btn-mythmatch-circle bg-mythpurple-800 text-stone-100"
            type="button"
          >
            <div v-html="SettingIcon"></div>
          </button>
          <button
            @click="handleQuitBtn"
            class="btn-mythmatch-circle bg-red-400 text-stone-100"
            type="button"
          >
            <div v-html="DoorIcon"></div>
          </button>
        </div>
        <div class="grid-cols-4 sm:grid-cols-6 w-fit grid grid-flow-row gap-3 " >
          <div
            v-for="(card, index) of board.cards"
            @mouseover="cursor.hover()"
            @mouseleave="cursor.unHover()"
            :key="index"
            class="cursor-pointer w-[5rem] h-[5rem] lg:w-[7rem] lg:h-[9.8rem] xl:w-[7.6rem] xl:h-[10.64rem] bg-transparent transition-all duration-500 perspective-1000 filter hover:drop-shadow-glow active:scale-95"
            @click="multiplayerCardsClick(card)"
          >
            <div
              :class="card.isRevealed ? 'flip' : ''"
              class="transition-transform w-full h-full duration-500 transform-style-3d relative"
            >
              <div class="absolute bg-black w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-2 lg:border-4 border-mythmatch-100">
                <img
                  :src="`/cards/${gameContext.setting.quality}/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
                  alt="backcard"
                  class="w-full lg:h-full"
                />
              </div>
              <div
                :style="`background-image: linear-gradient(135deg, ${card.color.primary} 0% 10%, #303 10% 90% , ${card.color.secondary} 90% 100%)`"
                class="flip transition-all absolute w-full h-full flex flex-col gap-1 justify-center items-center rounded-lg border-2 lg:border-4 border-mythmatch-100"
              >
                <div class="hidden lg:flex font-bold font-mythmatch text-xl text-mythmatch-100">
                  {{ card.name }}
                </div>
                <img
                  :src="`/cards/${gameContext.setting.quality}/${card.arts}.${setting.quality === 'high' ? 'png' : 'webp'}`"
                  :alt="card.name"
                  class="rounded-lg w-10/12"
                />
                <div
                  class="hidden lg:flex rotate-180 font-bold font-mythmatch text-xl text-mythmatch-100"
                >
                  {{ card.name }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>  
      <div class="hidden sm:flex text-mythmatch-100  flex-col items-center justify-center">
        <div class="text-[1rem] y-xs:lg:text-[2rem] font-mythmatch ">Player 2 score</div>
        <div class="text-[4rem] y-xs:lg:text-[8rem] font-mythmatch font-bold drop-shadow-glow">{{ p2.scores }}</div>
      </div>
    </section>
    <!-- * multiplayer mode section end -->

    <!-- * multiplayer winner section begin -->
    <section
      v-if="router.id === 201"
      :class="gameContext.winner > 0 ? 'opacity-100 translate-y-[0%]' : 'opacity-0 translate-y-[100%]'"
      class="absolute top-0 left-0 w-full h-screen z-40 bg-[#000c] backdrop-blur-sm grid place-items-center transition-opacity duration-1000"
    >
      <div class="flex flex-col justify-center items-center gap-20">
        <div class="text-6xl text-mythmatch-100 font-mythmatch">
          Player {{ gameContext.winner }} win!
        </div>
        <div class="flex justify-center">
            <div class="flex flex-col items-center gap-3 w-48 xs:w-64">
              <div class="text-2xl xs:text-3xl text-stone-100 font-mythmatch">Player 1</div>
              <div class="text-4xl xs:text-6xl font-semibold text-mythmatch-100 font-mythmatch">{{ p1.scores }}</div>
            </div>
            <div class="w-1 rounded-lg bg-mythmatch-200"></div>
            <div class="flex flex-col items-center gap-3 w-48 xs:w-64">
              <div class="text-2xl xs:text-3xl text-stone-100 font-mythmatch">Player 2</div>
              <div class="text-4xl xs:text-6xl font-semibold text-mythmatch-100 font-mythmatch">{{ p2.scores }}</div>
            </div>
          </div>
        <button
          @click="handleQuitBtn"
          type="button"
          class="btn btn-lg btn-warning"
        >
          Quit
        </button>
      </div>
    </section>
    <!-- * multiplayer winner section end -->

    <!-- * setting section begin -->
    <section
      v-show="gameContext.isSettingOpen"
      class="absolute w-full h-screen translate-y-[-100%] bg-[#0005] backdrop-blur-sm flex justify-center items-center z-30"
    >
      <div class="relative min-w-fit w-3/12 h-[15rem] flex flex-col items-center bg-mythpurple-800 border border-mythmatch-100 rounded-lg">
        <div class="text-center text-mythmatch-100 text-4xl font-mythmatch font-bold my-5">Setting</div>
        <div class="flex flex-col items-start gap-3 px-5">
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2">
              <div class="text-sm text-stone-100 w-24">Music</div>
              <input
                @mouseover="cursor.hover()"
                @mouseleave="cursor.unHover()"
                v-model="gameContext.setting.bgmVolume"
                :disabled="gameContext.setting.isBgmMute"
                type="range"
                class="range range-sm range-primary disabled:opacity-70 disabled:cursor-not-allowed"
                min="0"
                max="100"
                step="5"
              >
            </label>
            <button
              @mouseover="cursor.hover()"
              @mouseleave="cursor.unHover()"
              @click="gameContext.toggleMute('bgm')"
              :class="setting.isBgmMute ? 'bg-red-400' : 'bg-[#222]'"
              class="w-6 h-6 grid place-items-center rounded-lg"
            >
              <img
                v-if="setting.isBgmMute"
                src="/setting/sound_off.svg"
                alt="muted"
              />
              <img
                v-else
                src="/setting/sound_on.svg"
                alt="volume"
              />
            </button>
          </div>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2">
              <div class="text-sm text-stone-100 w-24">Sound FX</div>
              <input
                @mouseover="cursor.hover()"
                @mouseleave="cursor.unHover()" 
                v-model="gameContext.setting.sfxVolume" 
                :disabled="gameContext.setting.isSfxMute"
                type="range"
                class="range range-sm range-primary disabled:opacity-70 disabled:cursor-not-allowed"
                min="0"
                max="100"
                step="5"
              />
            </label>
            <button
              @mouseover="cursor.hover()"
              @mouseleave="cursor.unHover()"
              @click="gameContext.toggleMute('sfx')"
              :class="setting.isSfxMute ? 'bg-red-400' : 'bg-[#222]'"
              class="w-6 h-6 grid place-items-center rounded-lg"
            >
              <img
                v-if="setting.isSfxMute"
                src="/setting/sound_off.svg"
                alt="muted"
              />
              <img
                v-else
                src="/setting/sound_on.svg"
                alt="volume"
              />
            </button>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-sm text-stone-100 w-16">Quality</div>
            <label
              @mouseover="cursor.hover()"
              @mouseleave="cursor.unHover()"
              class="flex gap-1 items-center"
            >
              <input
                v-model="gameContext.setting.quality"
                type="radio"
                name="quality"
                value="low"
                class="radio radio-xs radio-primary"
              />
              <span class="text-stone-100">low</span>
            </label>
            <label
              @mouseover="cursor.hover()"
              @mouseleave="cursor.unHover()"
              class="flex gap-1 items-center"
            >
              <input
                v-model="gameContext.setting.quality"
                type="radio"
                name="quality"
                value="medium"
                class="radio radio-xs radio-primary"
              >
              <span class="text-stone-100">Medium</span>
            </label>
            <label
              @mouseover="cursor.hover()"
              @mouseleave="cursor.unHover()"
              class="flex gap-1 items-center"
            >
              <input
                v-model="gameContext.setting.quality"
                type="radio"
                name="quality"
                value="high"
                class="radio radio-xs radio-primary"
              >
              <span class="text-stone-100">High</span>
            </label>
          </div>
        </div>
        <div class="absolute top-2 right-2">
          <button
            @mouseover="cursor.hover()"
            @mouseleave="cursor.unHover()"
            @click="gameContext.setSettingOpenState(false)"
            class="btn btn-sm btn-circle bg-gray-800 hover:bg-gray-700 text-stone-100 border-0">
            <div>X</div>
          </button>
        </div>
      </div>
    </section>
    <!-- * setting modal section end -->

    <!-- * manual section begin -->
    <section
      v-if="router.id === 100"
      :class="gameContext.isManualOpen ? 'opacity-100 translate-y-[-100%]' : 'opacity-0 translate-y-[0%]'"
      class="flex justify-center z-40 w-full h-screen absolute transition-all duration-1000 backdrop-blur-sm overflow-y-auto"
    >
      <div class="relative h-screen bg-slate-900 w-11/12 md:w-10/12 lg:w-9/12 overflow-y-auto scroll-smooth p-[1rem] sm:p-[3.5rem] rounded-lg">
        <div class="absolute right-[4rem] top-[2rem]">
          <div class="flex justify-end fixed">
            <button 
              @mouseover="cursor.hover()"
              @mouseleave="cursor.unHover()"
              @click="gameContext.setManualOpenState(false)" 
              class="btn-mythmatch-circle bg-slate-400 text-slate-800 grid place-items-center"
              >
                <div v-html="XIcon"></div>
              </button>
          </div>
        </div>
        <article class="prose prose-sm xs:prose-base prose-headings:text-mythmatch-100 prose-p:text-stone-100 prose-blockquote:text-slate-400 prose-li:marker:text-stone-100  prose-li:text-stone-100 prose-a:text-slate-200 prose-hr:bg-slate-600 max-w-none">
          <h1>Unleash Your Memory Magic: Mastering Memory Match!</h1>
          <p>Ready to test your memory and challenge your friends? Dive into the thrilling world of Memory Match! This guide will equip you with the knowledge to conquer both single-player and versus modes, turning you into a memory maestro.</p>

          <h3>Table of Contents</h3>
          <ul>
            <li>
              <a
                @mouseover="cursor.hover()"
                @mouseleave="cursor.unHover()"
                href="#challenge"
              >
                Challenge Mode
              </a>
            </li>
            <ul>
              <li>
                <a
                @mouseover="cursor.hover()"
                @mouseleave="cursor.unHover()"
                  href="#combo"
                >
                  Combo Power-Up!
                </a>
              </li>
            </ul>
            <li>
              <a
                @mouseover="cursor.hover()"
                @mouseleave="cursor.unHover()"
                href="#versus"
              >
                Versus Mode
              </a>
            </li>
          </ul>

          <hr />

          <h2 id="challenge">Challenge Mode: A Memory Match Marathon! (Single player)</h2>
          <ol>
            <li><b>Picture Perfect Grid:</b> The game starts with a grid of cards, all facing down, hiding various pictures.</li>
            <li><b>Memory Mayhem:</b> Click on two cards to reveal their hidden images. Remember, it's a race against time!</li>
            <li><b>Match Made in Memory Heaven:</b> If the two cards are identical, they stay face up, and you score points (current level x <a href="#combo">combo</a>) and bonus time (+5 seconds).</li>
            <li><b>Memory Mishap:</b> Not an identical pair? No worries! Flip them back down and try again. Keep your focus sharp!</li>
            <li><b>Level Up!</b> Clear all pairs before time runs out, and you'll be whisked away to a new level, where your memory will be further challenged.</li>
            <li><b>Gridlock Alert!</b> If the board fills up (12 pairs), the tension rises with a red background. While you won't get extra time for correct matches, keep scoring those points!</li>
            <li><b>Time's Up!</b> When the clock strikes zero, the game ends, showcasing your score and ranking on the leader board. Did you become the memory champion?</li>
          </ol>

          <h3 id="combo">Combo Power-Up!</h3>
          <p>The combo system is your secret weapon for racking up points. Here's how it works:</p>

          <ul>
            <li><b>Double the Joy:</b> With each correct match, your combo increases (Combo x2, x3, and so on). This multiplies your points, making your memory prowess truly shine!</li>
            <li><b>Streak Saver:</b> Keep the correct matches coming, and your combo keeps climbing. But remember, a wrong match resets your combo, so stay focused!</li>
          </ul>

          <h2 id="versus">Versus Mode: Face-Off Fun! (Two player)</h2>
          <p>Ready to challenge your friends? Versus mode is your battleground!</p>

          <ol>
            <li><b>Randomized Rounds:</b> The game randomly picks who starts, indicated by the red side. Remember, the first one to strike wins the round!</li>
            <li><b>Your Turn to Shine:</b> On your turn, reveal two cards. Match them correctly, and you earn a point and keep going until you miss.</li>
            <li><b>Turnover Time:</b> Make a mistake, and your turn ends, passing the spotlight to your opponent.</li>
            <li><b>Memory Marathon:</b> Keep playing until all cards are flipped. The player with the highest score wins! But wait, there's a twist...</li>
            <li><b>Draw? No Problem!</b> If it's a tie, all cards flip back down, and the memory battle continues! The player with the most points after this second round is the ultimate memory champion.</li>
          </ol>
          <p>So, are you ready to embark on this exciting memory adventure? With these tips and tricks, you'll be a Memory Match master in no time!</p>
        </article>
      </div>
    </section>
    <!-- * manual section end -->

    <!-- * loading screen section begin -->
    <section
      :class="isLoading ? 'translate-y-[-100%]' : 'translate-y-[0%]'"
      class="fixed grid place-items-center transition-transform duration-1000 w-full h-screen bg-purple-950 z-50"
    >
      <div class="absolute w-[8rem] h-[11.2rem] lg:w-[10rem] lg:h-[14rem] bg-transparent transition-all duration-500 perspective-1000 filter hover:drop-shadow-glow active:scale-95">
        <div class="animate-con-flip transition-transform w-full h-full duration-500 transform-style-3d relative">
          <div class="back-load-card absolute bg-black w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-4 border-mythmatch-100">
            <img
              :src="`/cards/${gameContext.setting.quality}/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
              alt="backcard"
              class="w-full h-full"
            />
          </div>
          <div
            :style="`background-image: linear-gradient(135deg, ${Cards[loadingCardId].color.primary} 0% 10%, #303 10% 90% , ${Cards[loadingCardId].color.secondary} 90% 100%)`"
            class="front-load-card absolute w-full h-full flex flex-col gap-1 justify-center items-center rounded-lg border-4 border-mythmatch-100"
          >
            <div class="font-bold font-mythmatch text-xl text-mythmatch-100">
              {{ Cards[loadingCardId].name }}
            </div>
            <img
              :src="`/cards/${gameContext.setting.quality}/${Cards[loadingCardId].arts}.${setting.quality === 'high' ? 'png' : 'webp'}`"
              :alt="Cards[loadingCardId].name"
              class="rounded-lg w-10/12"
            />
            <div class="rotate-180 font-bold font-mythmatch text-xl text-mythmatch-100">
              {{ Cards[loadingCardId].name }}
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- * loading screen section end -->
  </main>
</template>

<style scoped>
.rotate-y-12 {
  transform: rotateY(12deg);
}

.-rotate-y-12 {
  transform: rotateY(-12deg);
}

.flip {
  /* perspective: 1000px; */
  transform: rotateY(180deg);
  backface-visibility: hidden;
}

.animate-con-flip {
  animation: animate-con-flip 2.5s infinite forwards linear;
}

.animate-con-flip > .back-load-card {
  backface-visibility: hidden;
  transform: rotate(12deg);
}

.animate-con-flip > .front-load-card {
  backface-visibility: hidden;
  transform: rotate(12deg) rotateY(180deg);
}

@keyframes animate-con-flip {
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}

.transform-style-3d {
  transform-style: preserve-3d;
}

.perspective-1000 {
  perspective: 1000px;
}

.btn-mythmatch {
  @apply w-52 h-16 text-2xl transition-all text-mythmatch-200 bg-mythmatch-100 border-4 hover:border-0 border-mythmatch-200 rounded-lg font-bold active:scale-95 hover:scale-105 hover:bg-mythmatch-200 hover:text-mythmatch-100;
}

.btn-mythmatch-landing {
  @apply box-border text-4xl transition-all w-60 h-16 font-mythmatch text-mythpurple-500 bg-mythmatch-100 border-0 hover:border-2 border-mythmatch-200 rounded-lg font-bold active:scale-95 hover:scale-110 hover:bg-mythpurple-400 hover:text-mythmatch-100;
}

.btn-mythmatch-play {
  @apply text-2xl px-10 py-1 font-mythmatch text-mythmatch-100 bg-mythpurple-500 border-0 hover:border-2 border-mythmatch-200 rounded-lg font-bold active:scale-95 hover:scale-105 hover:bg-mythpurple-400 hover:text-mythmatch-100;
}

.btn-mythmatch-circle {
  @apply w-12 h-12 text-2xl rounded-full grid place-items-center drop-shadow-lg;
}

.input-mythmatch {
  @apply input text-stone-100 text-center bg-gray-800;
}
</style>
