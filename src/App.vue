<script setup>
import { computed, onMounted, reactive, ref, toRef, toRefs, watch } from 'vue'
import GitHubIcon from './assets/github.svg?raw'
import BookIcon from './assets/book.svg?raw'
import DoorIcon from'./assets/door-open.svg?raw'
import SettingIcon from './assets/gear.svg?raw'
import ArrowLeftIcon from './assets/arrow-left.svg?raw'
import InfoIcon from './assets/info-circle.svg?raw'
import BigArrow from './assets/big-arrow.svg?raw'
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
    title: "Endless Mode (1P)",
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

const gameState = reactive(new Game())
if (!gameState.loadSetting()) gameState.saveSetting()



const { board, players, setting } = toRefs(gameState)
const { p1, p2 } = players.value

p1.accuracy = computed(() => {
  if (p1.counter.flip === 0) return 0
  return ((p1.counter.pair / p1.counter.flip) * 100).toFixed(2)
})

/** @param {Event} e */
const handleBgClick = (e) => {
  if (e.target.id !== 'mode-select') return
  gameState.mode = 0
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
    gameState.reset()
    startModeFunction()
  }, 2000)
}

function startSinglePlayerMode() {
  if (p1.name === '') p1.name = 'Anonymous'
  gameState.mode = 1
  gameState.level = 1
  board.value.clearCards()
  board.value.getPairCard(2)
  board.value.shuffle()
  gameState.startTimer(3)
  scoreboard.load()
  scoreboard.addPlayer(p1)
}

const singlePlayerCardClick = (card) => {
  console.log('singlePlayerCardClick')
  if (!gameState.isPaused && gameState.isPlaying && !card.isRevealed && p1.selectedCards.length < 2) {
    soundController.playSFX("/sounds/flipcard.mp3")
    card.reveal()
    p1.addCard(card)
  } else return
  
  if (p1.selectedCards.length === 2) {
    p1.addFlipCount()
    if (p1.isPaired()) {
      soundController.playSFX('/sounds/pointGain.mp3')
      p1.addPairCount()
      p1.addScores(gameState.level * gameState.scoreMutiplier++)
      p1.clearCards()
      scoreboard.updatePlayerScore(p1)
      if (gameState.level < 11) gameState.addTime(5)
    } else {
      gameState.scoreMutiplier = 1
      gameState.pause()
      setTimeout(() => {
        p1.concealAllSelectedCard()
        p1.clearCards()
        gameState.resume()
      }, 1000)
    }
  }

  if (board.value.isAllCardRevealed()) {
    gameState.nextLevel()
  }
}

function startMultiPlayerMode() {
  gameState.bgm = "bgmMultiplayer"
  board.value.clearCards()
  board.value.getPairCard(12)
  board.value.shuffle()
  if(Math.random() < 0.5) gameState.switchTurn()
}

const multiplayerCardsClick = (card) => {
  const currentPlayer = players.value[`p${gameState.playerTurn}`]
  if (!gameState.isPaused && !card.isRevealed && currentPlayer.selectedCards.length < 2) {
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
        gameState.switchTurn()
      }, 1000)
    }
  }
  if(board.value.isAllCardRevealed()){
    if(p1.scores !== p2.scores){
      if(p1.scores > p2.scores){
        gameState.winner = 1
      } else {
        gameState.winner = 2
      }
    } else {
      gameState.pause()
      setTimeout(() => {
        board.value.concealAllSelectedCard()
        setTimeout(() => {
          board.value.clearCards()
          board.value.getPairCard(12)
          gameState.resume()
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
        gameState.reset()
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
  () => gameState.isTimerRunning,
  (runningState) => {
    if (gameState.mode === 1) {
      if (!runningState && gameState.isPlaying) {
        soundController.clearBGM()
        gameState.gameOver()
        scoreboard.save()
      } else if (!runningState && !gameState.isPlaying) {
        gameState.isPlaying = true
      }
    }
  }
)

watch(
  () => gameState.isPlaying,
  (playingState) => {
    if (playingState && gameState.mode === 1) {
      gameState.startTimer(SINGLEPLAYER_START_TIME)
      console.log('play')
    }
  }
)

watch(
  () => gameState.level,
  (newLevel) => {
    if (newLevel === 1) {
      gameState.bgm = 'bgmPhase1'
    } else if (newLevel === 5) {
      gameState.bgm = 'bgmPhase2'
    } else if (newLevel === 11) {
      gameState.bgm = 'bgmPhase3'
    }
  }
)

watch(
  () => gameState.bgm,
  (newBgm) => {
    
    if (newBgm === '') {
      soundController.clearBGM()
      return
    }
    soundController.playBGM(`/sounds/${newBgm}.mp3`)
  }
)

watch(
  () => gameState.setting.bgmVolume,
  (newValue)=>{
    soundController.setBGMVolume(newValue)
    console.log("Sound volume is ", newValue);
  },
  {immediate:true}
)

watch(
  () => gameState.setting.sfxVolume,
  (newValue)=>{
    soundController.setSFXVolume(newValue)
    console.log("Sound volume is ", newValue);
  },
  {immediate:true}
)

//handle mute function
watch(
  ()=> gameState.setting.isBgmMute,
  (newValue)=>{
    console.log('isBgmMute executed')
    soundController.setMute('bgm', newValue, gameState.setting.bgmVolume)
  },
  {immediate:true}
)

watch(
  ()=> gameState.setting.isSfxMute,
  (newValue)=>{
    console.log('isSfxMute executed')
    soundController.setMute('sfx', newValue, gameState.setting.sfxVolume)
  },
  {immediate:true}
)

watch(
  () => gameState.setting,
  () => { gameState.saveSetting() },
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
      class="hidden lg:block absolute pointer-events-none z-[100]"
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

    <!-- * loading screen section begin -->
    <section
      :class="isLoading ? 'translate-y-[0%]' : 'translate-y-[100%]'"
      class="absolute grid place-items-center transition-transform duration-1000 w-full h-screen bg-purple-950 z-50"
    >
      <div class="absolute w-[8rem] h-[11.2rem] lg:w-[10rem] lg:h-[14rem] bg-transparent transition-all duration-500 perspective-1000 filter hover:drop-shadow-glow active:scale-95">
        <div class="animate-con-flip transition-transform w-full h-full duration-500 transform-style-3d relative">
          <div class="back-load-card absolute bg-black w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-4 border-mythmatch-100">
            <img
              :src="`/cards/${gameState.setting.quality}/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
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
              :src="`/cards/${gameState.setting.quality}/${Cards[loadingCardId].arts}.${setting.quality === 'high' ? 'png' : 'webp'}`"
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
              :src="`/cards/${gameState.setting.quality}/${Cards[0].arts}.${setting.quality === 'high' ? 'png' : 'webp'}`"
              :alt="Cards[0].name"
              class="rounded-lg w-10/12"
            />
            <div class="rotate-180 font-bold font-mythmatch text-xs text-mythmatch-100">
              {{ Cards[0].name }}
            </div>
          </div>
          <div class="bg-black w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex justify-center items-center rounded-lg border-2 border-mythmatch-100 overflow-hidden">
            <img
              :src="`/cards/${gameState.setting.quality}/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
              alt="backcard"
              class="w-full h-full"
            />
          </div>
        </div>
        <div>
          <img
            :src="`/logo/${gameState.setting.quality === 'low' ? 'MythMatch_logo_low.svg':'MythMatch_logo.svg'}`"
            alt="MythMatch_logo"
            class="w-[22rem] lg:w-[30rem] filter drop-shadow-glow animate-[pulse_2.5s_infinite_6000ms]"
          />
        </div>
        <div class="hidden sm:block rotate-12 text-[0.5rem] sm:text-[1rem]">
          <div class="absolute bg-black w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex justify-center items-center rounded-lg border-2 border-mythmatch-100 overflow-hidden origin-bottom rotate-45 z-10">
            <img
              :src="`/cards/${gameState.setting.quality}/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
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
              :src="`/cards/${gameState.setting.quality}/${Cards[1].arts}.${setting.quality === 'high' ? 'png' : 'webp'}`"
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
                :src="`/cards/${gameState.setting.quality}/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
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
              <img :src="`/cards/${gameState.setting.quality}/${card.arts}.${setting.quality === 'high' ? 'png' : 'webp'}`" :alt="card.name" class="rounded-lg w-10/12" />
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
          @click="gameState.setSettingOpenState(true)"
          class="btn bg-gray-800 text-white hover:bg-gray-800 border-0 w-10/12"
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
          class="tooltip hover:tooltip-open tooltip-left tooltip-info"
          data-tip="How to play?"
        >
          <button type="button" class="btn btn-circle btn-neutral btn-lg">
            <div v-html="BookIcon" class="scale-[1.75]"></div>
          </button>
        </div>
        <div
          class="tooltip hover:tooltip-open tooltip-left tooltip-info"
          data-tip="This project on GitHub"
        >
          <button
            @click="gotoUrl('https://github.com/6MA-606/PROJECT1-SEC2-Point-of-Vue/', true)"
            type="button"
            class="btn btn-circle btn-neutral btn-lg"
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
            gameState.mode === index + 1 && gameState.mode !== 0
              ? 'border-2 z-10 lg:scale-110 transform-style-3d h-[32rem] drop-shadow-2xl'
              : '',
            gameState.mode === index + 1 && gameState.mode === 1 ? 'rotate-y-12' : '',
            gameState.mode === index + 1 && gameState.mode === 2 ? '-rotate-y-12' : '',
          ]"
          @mouseover="cursor.hover()"
          @mouseleave="cursor.unHover()"
          @click="gameState.mode = index + 1"
          class="hidden y-xs:lg:flex relative w-[15rem] y-xs:w-[20rem] h-[24rem] y-xs:lg:w-[22rem] px-5 py-10 flex-col justify-center items-center gap-4 bg-[#0007] backdrop-blur-sm border border-mythmatch-100 rounded-lg hover:shadow-lg hover:shadow-[#fff5]  transition-all duration-500 linear cursor-pointer"
        >
          <div v-html="InfoIcon" class="absolute top-4 right-4 scale-150"></div>
          <div class="w-[7em] h-[7em] y-xs:w-[13rem] y-xs:h-[13rem] y-xs:lg:w-[13rem] y-xs:lg:h-[13rem]">
            <img
              :src="(
                gameState.mode === index + 1 && gameState.mode !== 0
                  ? mode.gif
                  : mode.thumbnail + '.webp'
              )"
              :alt="mode.title"
              class="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div class="flex flex-col gap-2">
            <div class="text-center text-[2em] font-bold font-mythmatch text-white">
              {{ mode.title }}
            </div>
            <div class="text-center text-[1em] text-white">{{ mode.description }}</div>
          </div>
          <div class="flex flex-col items-center gap-4">
            <div
              v-if="index + 1 === 1"
              :class="[
                gameState.mode === index + 1
                  ? 'h-20'
                  : 'h-0'
              ]"
              class="flex flex-col items-center transition-all duration-500 linear overflow-hidden"
            >
              <div
                :class="[
                  gameState.mode === index + 1
                    ? 'opacity-100 -translate-x-[100%] delay-500'
                    : 'opacity-0 -translate-x-[150%]'
                ]"
                v-html="BigArrow"
                class="absolute scale-75 transition-all duration-1000 linear text-mythmatch-100 -translate-y-1"
              >
              </div>
              <div
                :class="[
                  gameState.mode === index + 1
                    ? 'opacity-100 translate-x-[100%] delay-500'
                    : 'opacity-0 translate-x-[150%]'
                ]"
                v-html="BigArrow"
                class="absolute scale-75 rotate-180 transition-all duration-[1000ms] linear text-mythmatch-100 -translate-y-1"
              >
              </div>
              <label class="flex flex-col items-center gap-2">
                <div class="text-white self-start">Enter your name (or play as guest)</div>
                <input
                  v-model="p1.name"
                  type="text"
                  placeholder="Your name"
                  class="input-mythmatch w-full"
                />
              </label>
            </div>
            <button
              type="button"
              @click="routeWithTransition(mode.routerId, 2000, false)"
              alt="play-endlessMode-button"
              :class="[
                gameState.mode === index + 1
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
            gameState.mode === index + 1 && gameState.mode !== 0
              ? 'border-2 z-10 transition-all duration-500 drop-shadow-2xl'
              : ''
          ]"
          @click="gameState.mode = index + 1"
          class="flex y-xs:lg:hidden relative w-[15rem] y-xs:w-[20rem] px-5 py-10 flex-col justify-center items-center gap-4 border rounded-lg transition-all hover:shadow-lg hover:shadow-[#fff5] bg-mythpurple-800 border-mythmatch-100"
        >
          <div v-html="InfoIcon" class="absolute top-4 right-4 scale-150"></div>
          <div class="w-[7em] h-[7em] y-xs:w-[13rem] y-xs:h-[13rem] y-xs:lg:w-[13rem] y-xs:lg:h-[13rem]">
            <img
              :src="mode.thumbnail + '.svg'"
              :alt="mode.title"
            />
          </div>
          <div class="flex flex-col gap-2">
            <div class="text-center text-[1.5em] text-white font-bold font-mythmatch">
              {{ mode.title }}
            </div>
            <div class="text-center text-[0.875em] text-white opacity-50">{{ mode.description }}</div>
          </div>
          <div v-show="gameState.mode === index + 1" class="flex flex-col justify-center h-[40%] w-full items-center gap-3 absolute bottom-0 bg-mythpurple-800 rounded-lg">
            <div
              v-if="gameState.mode === index + 1 && gameState.mode === 1" 
              class="flex flex-col items-center gap-2"
            >
              <div>Enter your name</div>
              <input
                v-model="p1.name"
                type="text"
                placeholder="Your name"
                class="input-mythmatch w-10/12"
              />
            </div>
            <button
              type="button"
              @click="routeWithTransition(mode.routerId, 2000, false)"
              class="btn-mythmatch-play text-[1em] text-white font-semibold"
              alt="play-endlessMode-button"
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
      :style="`background-image: url(/bg/bg${gameState.level >= 11 ? '2' : ''}.svg); background-size: cover; background-position: center; background-repeat: no-repeat;`"
      class="h-screen flex flex-col lg:flex-row lg:justify-center items-center"
    >
      <!-- mobile setting section (top right) -->
      <div class="flex y-xs:lg:hidden absolute top-3 right-3 gap-3 z-10">
        <button @click="gameState.setSettingOpenState(true)" class="btn-mythmatch-circle bg-mythpurple-800 text-white" type="button">
          <div v-html="SettingIcon"></div>
        </button>
        <button @click="gameState.setQuitOpenState(true)" class="btn-mythmatch-circle bg-red-400 text-white" type="button">
          <div v-html="DoorIcon"></div>
        </button>
      </div>

      <!-- mobile horizontal logo section (left) -->
      <div class="flex y-xs:hidden w-[20%] flex-col items-center absolute left-0 top-5">
        <img :src="`/logo/${gameState.setting.quality === 'low' ? 'MythMatch_logo_low.svg':'MythMatch_logo.svg'}`" alt="logo" class="w-32" />
      </div>

      <!-- mobile horizontal score section (left) -->
      <div class="flex y-xs:hidden w-[20%] flex-col justify-center items-center absolute left-0 h-full">
        <div class="h-3/6 flex flex-col gap-10">
          <div class="flex flex-col items-center">
            <div class="text-2xl text-mythmatch-100 font-mythmatch">Level</div>
            <div class="text-3xl text-mythmatch-100 font-semibold font-mythmatch">{{ gameState.level }}</div>
          </div>
          <div class="flex flex-col items-center">
            <div class="text-2xl text-mythmatch-100 font-mythmatch">Scores</div>
            <div class="text-3xl text-mythmatch-100 font-semibold font-mythmatch">{{ p1.scores }}</div>
            <div v-show="gameState.scoreMutiplier > 1" class="text-mythmatch-100 font-mythmatch self-end">Combo x {{ gameState.scoreMutiplier }}</div>
          </div>
        </div>
      </div>
      <!-- mobile horizontal score section (right) -->
      <div class="flex y-xs:hidden w-[20%] flex-col justify-center items-center absolute right-0 h-full">
        <div class="h-3/6 flex flex-col gap-10">
          <div class="flex flex-col text-center">
            <div class="text-2xl text-mythmatch-100 font-mythmatch">Time</div>
            <div class="text-3xl text-mythmatch-100 font-bold font-mythmatch-mono tracking-wide">{{ gameState.time }}</div>
          </div>
          <div class="flex flex-col items-center">
            <div class="text-2xl text-mythmatch-100 font-mythmatch">Your Rank</div>
            <div class="text-3xl text-mythmatch-100 font-semibold font-mythmatch">{{ scoreboard.data.findIndex((player) => player.id === scoreboard.currentPlayerScoreObjRef.id) + 1 }}</div>
          </div>
        </div>
      </div>

      <!-- mobile vertical score section -->
      <div class="hidden y-xs:flex y-xs:xs:hidden w-full mb-4 flex-col items-center">
        <div class="w-full flex flex-col">
          <div class="my-5 flex justify-evenly w-full">
            <img :src="`/logo/${gameState.setting.quality === 'low' ? 'MythMatch_logo_low.svg':'MythMatch_logo.svg'}`" alt="logo" class="w-40" />
          </div>
          <div class="flex justify-evenly items-center">
            <div class="flex flex-col items-center">
              <div class="text-2xl text-mythmatch-100 font-mythmatch">Level</div>
              <div class="text-3xl text-mythmatch-100 font-semibold font-mythmatch">{{ gameState.level }}</div>
            </div>
            <div class="flex flex-col items-center">
              <div v-show="gameState.scoreMutiplier > 1" class="absolute text-xs text-mythmatch-100 font-mythmatch -translate-y-[90%] self-end">Combo x {{ gameState.scoreMutiplier }}</div>
              <div class="text-2xl text-mythmatch-100 font-mythmatch">Scores</div>
              <div class="text-3xl text-mythmatch-100 font-semibold font-mythmatch">{{ p1.scores }}</div>
            </div>
            <div class="flex flex-col items-center">
              <div class="text-2xl text-mythmatch-100 font-mythmatch">Your Rank</div>
              <div class="text-3xl text-mythmatch-100 font-semibold font-mythmatch">{{ scoreboard.data.findIndex((player) => player.id === scoreboard.currentPlayerScoreObjRef.id) + 1 }}</div>
            </div>
            <div class="flex flex-col text-center">
              <div class="text-2xl text-mythmatch-100 font-mythmatch">Time</div>
              <div class="text-3xl text-mythmatch-100 font-bold font-mythmatch-mono tracking-wide">{{ gameState.time }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- card section -->
      <div class="w-full h-full y-xs:h-auto lg:w-9/12 grid place-items-center">
        <div
          :class="`grid-cols-${gameState.level < 4 ? gameState.level + 1 : 4} xs:grid-cols-${gameState.level < 6 ? gameState.level + 1 : 6}`"
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
                  :src="`/cards/${gameState.setting.quality}/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
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
                  :src="`/cards/${gameState.setting.quality}/${card.arts}.${setting.quality === 'high' ? 'png' : 'webp'}`"
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
                <img :src="`/logo/${gameState.setting.quality === 'low' ? 'MythMatch_logo_low.svg':'MythMatch_logo.svg'}`" alt="logo" />
              </div>
              <div class="w-full flex justify-evenly">
                <div class="text-mythmatch-100 flex flex-col items-center justify-center">
                  <div class="text-3xl font-mythmatch">Level</div>
                  <div class="text-5xl font-bold font-mythmatch">{{ gameState.level }}</div>
                </div>
                <div class="text-mythmatch-100 flex flex-col items-center justify-center">
                  <div v-show="gameState.scoreMutiplier > 1" class="absolute font-mythmatch -translate-y-[215%] self-end">Combo x {{ gameState.scoreMutiplier }}</div>
                  <div class="text-3xl font-mythmatch">Your Score</div>
                  <div class="text-5xl font-bold font-mythmatch">{{ p1.scores }}</div>
                </div>
              </div>
              <div class="text-mythmatch-100 flex flex-col items-center justify-center">
                <div class="text-3xl font-mythmatch">Time</div>
                <div class="text-5xl font-mythmatch-mono tracking-wide">{{ gameState.time }}</div>
              </div>
            </div>
            <div class="rounded-lg overflow-hidden w-10/12 h-[40%] border-mythmatch-100 border-2 bg-mythpurple-800">
              <table class="table table-sm">
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
                    v-for="(playerScoreObj, index) in scoreboard.data"
                    v-show="index < 5 || playerScoreObj === scoreboard.currentPlayerScoreObjRef"
                    :key="index"
                    :class="scoreboard.currentPlayerScoreObjRef === playerScoreObj ? 'bg-mythpurple-800' : 'bg-mythpurple-700'"
                    class="text-center border-mythpurple-600"
                  >
                    <td>{{ index + 1 }}</td>
                    <td>{{ playerScoreObj.name }}{{ scoreboard.currentPlayerScoreObjRef === playerScoreObj ? ' (You)' : '' }}</td>
                    <td>{{ playerScoreObj.score }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="flex gap-4">
              <button
                @click="gameState.setSettingOpenState(true)"
                type="button"
                class="btn"
              >
                Setting
              </button>
              <button
                @click="gameState.setQuitOpenState(true)"
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
      v-if="gameState.mode === 1 && !gameState.isPlaying && gameState.isTimerRunning"
      class="absolute top-0 left-0 z-40 w-full h-screen bg-[#000c] flex flex-col justify-center items-center"
    >
      <div class="text-6xl font-mythmatch text-mythmatch-100">{{ Math.round(gameState.time) }}</div>
    </section>
    <!-- * single player countdown section end -->
    
    <!-- * single player quit section begin -->
    <section
      v-if="router.id === 200"
      :class="gameState.isQuitOpen ? 'translate-y-[-100%] opacity-100' : 'translate-y-[0%] opacity-0'"
      class="absolute transition-opacity z-40 w-full h-screen bg-[#000c] backdrop-blur-sm flex flex-col gap-16 justify-center items-center text-center"
    >
      <div class="text-6xl y-xs:text-5xl y-xs:xs:text-8xl font-mythmatch text-mythmatch-100">You wanna exit?!</div>
      <div class="flex flex-col gap-3">
        <div class="text-xl flex items-center gap-2 text-white">
          <div>If you want restart, you can click</div>
          <button
            @click="handleRestartBtn(startSinglePlayerMode)"
            type="button"
            class="btn btn-sm btn-outline text-white btn-warning"
          >
            <div>Restart</div>
          </button>
        </div>
        <div class="text-xl text-white">but you want to really quit, right?</div>
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
          @click="gameState.setQuitOpenState(false)"
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
      :class="gameState.isGameOver && gameState.mode === 1 ? 'translate-y-[-100%] opacity-100' : 'translate-y-[0%] opacity-0'"
      class="absolute transition-opacity duration-[2.5s] z-40 w-full h-screen bg-[#000c] flex flex-col gap-16 justify-start lg:justify-center items-center text-center overflow-y-auto py-32 lg:py-0"
    >
      <div class="text-6xl xs:text-8xl font-mythmatch text-mythmatch-100">Game Over</div>
      <div class="flex flex-col items-center lg:flex-row lg:justify-center gap-24">
        <div class="flex flex-col gap-10 justify-center">
          <div class="flex justify-center">
            <div class="flex flex-col items-center gap-3 w-48 xs:w-64">
              <div class="text-2xl xs:text-3xl text-white font-mythmatch">Total Score</div>
              <div class="text-4xl xs:text-6xl font-semibold text-mythmatch-100 font-mythmatch">{{ p1.scores }}</div>
            </div>
            <div class="w-1 rounded-lg bg-mythmatch-200"></div>
            <div class="flex flex-col items-center gap-3 w-48 xs:w-64">
              <div class="text-2xl xs:text-3xl text-white font-mythmatch">Rank</div>
              <div class="text-4xl xs:text-6xl font-semibold text-mythmatch-100 font-mythmatch">{{ scoreboard.data.findIndex((player) => player.id === scoreboard.currentPlayerScoreObjRef.id) + 1 }}</div>
            </div>
          </div>
          <div>
            <div class="text-xl xs:text-2xl text-white ">You've flipped {{ p1.counter.flip }} pair(s)</div>
            <div class="text-xl xs:text-2xl text-white">You've collected {{ p1.counter.pair }} correct pair(s)</div>
            <div class="text-xl xs:text-2xl text-white">Accuracy {{ p1.accuracy }}%</div>
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
                v-for="(playerScoreObj, index) in scoreboard.data"
                :id="playerScoreObj === scoreboard.currentPlayerScoreObjRef ? 'current-player' : ''"
                :key="index"
                :class="scoreboard.currentPlayerScoreObjRef === playerScoreObj ? 'bg-mythpurple-800' : 'bg-mythpurple-700'"
                class="text-center border-t-[1px] border-mythpurple-600"
              >
                <td>{{ index + 1 }}</td>
                <td>{{ playerScoreObj.name }}{{ scoreboard.currentPlayerScoreObjRef === playerScoreObj ? ' (You)' : '' }}</td>
                <td>{{ playerScoreObj.score }}</td>
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
        gameState.playerTurn === 1
          ? 'background-image: linear-gradient(to right, #f55a 0%, #0000 50% 100%)' 
          : 'background-image: linear-gradient(to left, #f55a 0%, #0000 50% 100%)'
      )"
    >
      <!-- {{ gameState.playerTurn }} -->
      <div class="hidden sm:flex flex-col lg:flex items-center justify-center text-mythmatch-100">
        <div class="text-[1rem] y-xs:lg:text-[2rem] font-mythmatch ">Player 1 score</div>
        <div class="text-[4rem] y-xs:lg:text-[8rem] font-mythmatch font-bold drop-shadow-glow">{{ p1.scores }}</div>
      </div>
      <div class="lg:w-fit grid place-items-center">
        <div class="sm:hidden w-full mb-4 flex flex-col items-center">
          <div class="w-full flex flex-col">
            <div class="my-5 flex justify-evenly w-full">
              <img
                :src="`/logo/${gameState.setting.quality === 'low' ? 'MythMatch_logo_low.svg':'MythMatch_logo.svg'}`"
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
            :src="`/logo/${gameState.setting.quality === 'low' ? 'MythMatch_logo_low.svg':'MythMatch_logo.svg'}`"
            alt="logo"
            class="w-40" 
          />    
        </div>
        <div class="absolute top-3 right-3 flex gap-3">
          <button
            @click="gameState.setSettingOpenState(true)"
            class="btn-mythmatch-circle bg-mythpurple-800 text-white"
            type="button"
          >
            <div v-html="SettingIcon"></div>
          </button>
          <button
            @click="handleQuitBtn"
            class="btn-mythmatch-circle bg-red-400 text-white"
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
                  :src="`/cards/${gameState.setting.quality}/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
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
                  :src="`/cards/${gameState.setting.quality}/${card.arts}.${setting.quality === 'high' ? 'png' : 'webp'}`"
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
      :class="gameState.winner > 0 ? 'opacity-100 translate-y-[0%]' : 'opacity-0 translate-y-[100%]'"
      class="absolute top-0 left-0 w-full h-screen z-40 bg-[#000c] backdrop-blur-sm grid place-items-center transition-opacity duration-1000"
    >
      <div class="flex flex-col justify-center items-center gap-20">
        <div class="text-6xl text-mythmatch-100 font-mythmatch">
          Player {{ gameState.winner }} win!
        </div>
        <div class="flex justify-center">
            <div class="flex flex-col items-center gap-3 w-48 xs:w-64">
              <div class="text-2xl xs:text-3xl text-white font-mythmatch">Player 1</div>
              <div class="text-4xl xs:text-6xl font-semibold text-mythmatch-100 font-mythmatch">{{ p1.scores }}</div>
            </div>
            <div class="w-1 rounded-lg bg-mythmatch-200"></div>
            <div class="flex flex-col items-center gap-3 w-48 xs:w-64">
              <div class="text-2xl xs:text-3xl text-white font-mythmatch">Player 2</div>
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
      v-show="gameState.isSettingOpen"
      class="absolute w-full h-screen translate-y-[-100%] bg-[#0005] backdrop-blur-sm flex justify-center items-center z-30"
    >
      <div class="relative min-w-fit w-3/12 h-[15rem] flex flex-col items-center bg-mythpurple-800 border border-mythmatch-100 rounded-lg">
        <div class="text-center text-mythmatch-100 text-4xl font-mythmatch font-bold my-5">Setting</div>
        <div class="flex flex-col items-start gap-3 px-5">
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2">
              <div class="text-sm text-white w-24">Music</div>
              <input
                @mouseover="cursor.hover()"
                @mouseleave="cursor.unHover()"
                v-model="gameState.setting.bgmVolume"
                :disabled="gameState.setting.isBgmMute"
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
              @click="gameState.toggleMute('bgm')"
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
              <div class="text-sm text-white w-24">Sound FX</div>
              <input
                @mouseover="cursor.hover()"
                @mouseleave="cursor.unHover()" 
                v-model="gameState.setting.sfxVolume" 
                :disabled="gameState.setting.isSfxMute"
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
              @click="gameState.toggleMute('sfx')"
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
            <div class="text-sm text-white w-16">Quality</div>
            <label
              @mouseover="cursor.hover()"
              @mouseleave="cursor.unHover()"
              class="flex gap-1 items-center"
            >
              <input
                v-model="gameState.setting.quality"
                type="radio"
                name="quality"
                value="low"
                class="radio radio-xs radio-primary"
              />
              <span class="text-white">low</span>
            </label>
            <label
              @mouseover="cursor.hover()"
              @mouseleave="cursor.unHover()"
              class="flex gap-1 items-center"
            >
              <input
                v-model="gameState.setting.quality"
                type="radio"
                name="quality"
                value="medium"
                class="radio radio-xs radio-primary"
              >
              <span class="text-white">Medium</span>
            </label>
            <label
              @mouseover="cursor.hover()"
              @mouseleave="cursor.unHover()"
              class="flex gap-1 items-center"
            >
              <input
                v-model="gameState.setting.quality"
                type="radio"
                name="quality"
                value="high"
                class="radio radio-xs radio-primary"
              >
              <span class="text-white">High</span>
            </label>
          </div>
        </div>
        <div class="absolute top-2 right-2">
          <button
            @mouseover="cursor.hover()"
            @mouseleave="cursor.unHover()"
            @click="gameState.setSettingOpenState(false)"
            class="btn btn-sm btn-circle bg-gray-800 hover:bg-gray-700 text-white border-0">
            <div>X</div>
          </button>
        </div>
      </div>
    </section>
    <!-- * setting modal section end -->
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
  @apply input text-white text-center bg-gray-800;
}
</style>
