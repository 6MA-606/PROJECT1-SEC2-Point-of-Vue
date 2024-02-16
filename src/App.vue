<script setup>
import { computed, onMounted, reactive, ref, toRef, toRefs, watch } from 'vue'
import GitHubIcon from './assets/github.svg?raw'
import BookIcon from './assets/book.svg?raw'
import ArrowLeftIcon from './assets/arrow-left.svg?raw'
import InfoIcon from './assets/info-circle.svg?raw'
import { gotoUrl } from './utils/helperFunction.js'
import Cards from '../data/cards.json'
import Game from '../classes/Game'
import Cursor from '../classes/Cursor'
import SoundController from '../classes/SoundController.js'

const router = reactive({
  id: parseInt(localStorage.getItem('router_id')) || 100,
})

const isLoading = ref(false)

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
    thumbnail: "/gamemode/singleplayer.jpg",
    gif: "https://media.giphy.com/media/CjmvTCZf2U3p09Cn0h/giphy.gif?cid=ecf05e475c1xpfvg5yn3inqfpb2ua5sn0l9jievwe1j3p4c4&ep=v1_gifs_search&rid=giphy.gif&ct=g",
    routerId: 200
  },
  {
    title: "Versus Mode (2P)",
    description: "Play with your friend",
    thumbnail: "/gamemode/multiplayer.png",
    gif: "https://media.giphy.com/media/CjmvTCZf2U3p09Cn0h/giphy.gif?cid=ecf05e475c1xpfvg5yn3inqfpb2ua5sn0l9jievwe1j3p4c4&ep=v1_gifs_search&rid=giphy.gif&ct=g",
    routerId: 201
  },
]

const cursor = reactive(new Cursor())
const soundController = new SoundController()
// const audioContext = new AudioContext()
// const gainNode = audioContext.createGain()
// gainNode.connect(audioContext.destination)

const gameState = reactive(new Game())
const { board, players, setting } = toRefs(gameState)
const { p1, p2 } = players.value

p1.accuracy = computed(() => {
  if (p1.counter.flip === 0) return 0
  return ((p1.counter.pair / p1.counter.flip) * 100).toFixed(2)
})

// onMounted(() => {
//   if (router.id === 100) {
//     board.value.getPairCard(2)
//     board.value.shuffle()
//   }
// })

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

function startSinglePlayerMode() {
  gameState.mode = 1
  gameState.level = 1
  board.value.clearCards()
  board.value.getPairCard(2)
  board.value.shuffle()
  gameState.startTimer(3)
}

const singlePlayerCardClick = (card) => {
  if (gameState.isPlaying && !card.isFlipped && p1.selectedCards.length < 2) {
    card.isFlipped = true
    p1.addCard(card)
  } else return
  
  if (p1.selectedCards.length === 2) {
    p1.addFlipCount()
    if (p1.isPaired()) {
      soundController.playSFX('/sounds/pointGain.mp3')
      p1.addPairCount()
      p1.addScores(gameState.level, setting.value.volume)
      p1.clearCards()
      if (gameState.level < 11) gameState.addTime(5)
    } else {
      setTimeout(() => {
        p1.setFlipSelectedCard(false)
        p1.clearCards()
      }, 1000)
    }
  }

  if (board.value.isAllCardFlipped()) {
    gameState.nextLevel()
  }
}

const handleQuitBtn = () => {
  routeWithTransition(100, 2000, true)
}

const handleRestartBtn = (startModeFunction) => {
  gameState.reset()
  routeWithTransition(200, 2000, false)
  setTimeout(startModeFunction, 2000)
}

function startMultiPlayerMode() {
  board.value.clearCards()
  board.value.getPairCard(12)
  // board.value.shuffle()
  if(Math.random() < 0.5) gameState.switchTurn()
}

const multiplayerCardsClick = (card) => {
  const currentPlayer = players.value[`p${gameState.playerTurn}`]
  if (!card.isFlipped && currentPlayer.selectedCards.length < 2) {
    card.isFlipped = true
    currentPlayer.addCard(card)
  } else return

  if (currentPlayer.selectedCards.length === 2) {
    if (currentPlayer.isPaired()) {
      currentPlayer.addScores(1)
      currentPlayer.clearCards()
    } else {
      setTimeout(() => {
        currentPlayer.setFlipSelectedCard(false)
        currentPlayer.clearCards()
        gameState.switchTurn()
      }, 1000)
    }
  }
  if(board.value.isAllCardFlipped()){
    if(p1.scores !== p2.scores){
      if(p1.scores > p2.scores){
        gameState.winner = 1
      } else {
        gameState.winner = 2
      }
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
      gameState.startTimer(30)
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
    } else if (newLevel === 9) {
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
    soundController.setBGMVolume(newValue / 100)
    console.log("Sound volume is ", newValue / 100);
  }
)

watch(
  () => gameState.setting.sfxVolume,
  (newValue)=>{
    soundController.setSFXVolume(newValue / 100)
    console.log("Sound volume is ", newValue / 100);
  }
)

//handle mute function
watch(
  ()=> gameState.setting.isBgmMute,
  (newValue)=>{
    console.log('isBgmMute executed')
    soundController.setMute('bgm', newValue, gameState.setting.bgmVolume)
  }
)

watch(
  ()=> gameState.setting.isSfxMute,
  (newValue)=>{
    console.log('isSfxMute executed')
    soundController.setMute('sfx', newValue, gameState.setting.sfxVolume)
  }
)

watch(
  gameState,
  ({ mode, board, players: { p1, p2 }, level, time, playerTurn }) => {
    const debugString = `
      mode: ${mode}
      board: ${board.cards.map((c) => c.name)}
      level: ${level}
      time: ${time}
      playerTurn: ${playerTurn}
      players: {
        p1: {
          selectedCards: ${p1.selectedCards.map(
            (c, index) => `${c.name}(${index})`
          )}
          scores: ${p1.scores}
          counter: {
            flip: ${p1.counter.flip}
            pair: ${p1.counter.pair}
          }
        }
        p2: {
          selectedCards: ${p2.selectedCards.map(
            (c, index) => `${c.name}(${index})`
          )}
          scores: ${p2.scores}
          counter: {
            flip: ${p2.counter.flip}
            pair: ${p2.counter.pair}
          }
        }
      }
    `
    // console.log(debugString)
  },
  { deep: true }
)
</script>

<template>
  <div
    @mousemove="cursor.handleMouseMove($event)"
    @mouseleave="cursor.reset()"
    @mousedown="cursor.mouseDown()"
    @mouseup="cursor.mouseUp()"
    class="relative overflow-hidden h-screen transition-all duration-500"
  >
    <div
      :style="`transform: translate(${cursor.x}, ${cursor.y})`"
      class="hidden lg:block absolute pointer-events-none z-[100]">
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
    <!-- * Loading screen start --------------------------------------------------------- -->
    <div
      :class="isLoading ? 'translate-y-[0%]' : 'translate-y-[100%]'"
      class="absolute grid place-items-center transition-transform duration-1000 w-full h-screen bg-purple-950 z-50"
    >
      <div
        class="absolute w-[8rem] h-[11.2rem] lg:w-[10rem] lg:h-[14rem] bg-transparent transition-all duration-500 perspective-1000 filter hover:drop-shadow-glow active:scale-95"
      >
        <div
          class="animate-con-flip transition-transform w-full h-full duration-500 transform-style-3d relative"
        >
          <div
            class="back-load-card absolute bg-black w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-4 border-mythmatch-100"
          >
            <img
              :src="`/cards/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
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
              :src="Cards[loadingCardId].arts"
              :alt="Cards[loadingCardId].name"
              class="rounded-lg w-10/12"
            />
            <div
              class="rotate-180 font-bold font-mythmatch text-xl text-mythmatch-100"
            >
              {{ Cards[loadingCardId].name }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- * Loading screen end --------------------------------------------------------- -->
    <!-- * LandingPage start --------------------------------------------------------- -->
    <div
      v-if="router.id === 100"
      id="landing-page"
      class="h-svh flex flex-col justify-center items-center gap-16 sm:gap-20"
    >
      <div id="game-title" class="flex gap-2 sm:gap-6">
        <div class="hidden sm:block -rotate-12 text-[0.5rem] sm:text-[1rem]">
          <div
            :style="`background-image: linear-gradient(135deg, ${Cards[1].color.primary} 0% 10%, #303 10% 90% , ${Cards[1].color.secondary} 90% 100%)`"
            class="absolute w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex flex-col justify-center items-center rounded-lg border-2 border-mythmatch-100 origin-bottom -rotate-45"
          >
            <div class="font-bold font-mythmatch text-xs text-mythmatch-100">
              {{ Cards[1].name }}
            </div>
            <img
              :src="Cards[1].arts"
              :alt="Cards[1].name"
              class="rounded-lg w-10/12"
            />
            <div
              class="rotate-180 font-bold font-mythmatch text-xs text-mythmatch-100"
            >
              {{ Cards[1].name }}
            </div>
          </div>
          <div
            class="bg-black w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex justify-center items-center rounded-lg border-2 border-mythmatch-100 overflow-hidden"
          >
            <img
              src="/cards/backcard.webp"
              alt="backcard"
              class="w-full h-full"
            />
          </div>
        </div>
        <div>
          <img
            src="./assets/MythMatch_logo.svg"
            alt="MythMatch_logo"
            class="w-[22rem] lg:w-[30rem] filter drop-shadow-glow animate-[pulse_2.5s_infinite_6000ms]"
          />
        </div>
        <div class="hidden sm:block rotate-12 text-[0.5rem] sm:text-[1rem]">
          <div
            class="absolute bg-black w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex justify-center items-center rounded-lg border-2 border-mythmatch-100 overflow-hidden origin-bottom rotate-45 z-10"
          >
            <img
              src="/cards/backcard.webp"
              alt="backcard"
              class="w-full h-full"
            />
          </div>
          <div
            :style="`background-image: linear-gradient(135deg, ${Cards[0].color.primary} 0% 10%, #303 10% 90% , ${Cards[0].color.secondary} 90% 100%)`"
            class="w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex flex-col justify-center items-center rounded-lg border-2 border-mythmatch-100"
          >
            <div class="font-bold font-mythmatch text-xs text-mythmatch-100">
              {{ Cards[0].name }}
            </div>
            <img
              :src="Cards[0].arts"
              :alt="Cards[0].name"
              class="rounded-lg w-10/12"
            />
            <div
              class="rotate-180 font-bold font-mythmatch text-xs text-mythmatch-100"
            >
              {{ Cards[0].name }}
            </div>
          </div>
        </div>
      </div>
      <div id="landing-4-card" class="gap-8 flex flex-wrap">
        <div
          v-for="(card, index) of board.cards"
          @mouseover="cursor.hover()"
          @mouseleave="cursor.unHover()"
          :key="index"
          :class="
            index > 0
              ? 'hidden sm:block w-[8rem] h-[11.2rem]'
              : 'w-[10rem] h-[14rem] sm:w-[8rem] sm:h-[11.2rem]'
          "
          class="lg:w-[10rem] lg:h-[14rem] bg-transparent transition-all duration-500 perspective-1000 filter hover:drop-shadow-glow active:scale-95"
          @click="card.isFlipped = !card.isFlipped"
        >
          <div
            :class="card.isFlipped ? 'flip' : ''"
            class="transition-transform w-full h-full duration-500 transform-style-3d relative"
          >
            <div
              class="absolute bg-black w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-4 border-mythmatch-100"
            >
              <img
                :src="`/cards/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
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
              <img :src="card.arts" :alt="card.name" class="rounded-lg w-10/12" />
              <div
                class="rotate-180 font-bold font-mythmatch text-xl text-mythmatch-100"
              >
                {{ card.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-5">
        <button
          id="play-btn"
          type="button"
          class="btn-mythmatch"
          alt="home-play-btn"
          @click="routeWithTransition(101, 2000, true)"
        >
          Play
        </button>
        <button @click="gameState.setSettingOpenState(true)" class="btn" type="button">Setting</button>
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
            @click="
              gotoUrl(
                'https://github.com/6MA-606/PROJECT1-SEC2-Point-of-Vue/',
                true
              )
            "
            type="button"
            class="btn btn-circle btn-neutral btn-lg"
          >
            <div v-html="GitHubIcon" class="scale-[2]"></div>
          </button>
        </div>
      </div>
    </div>
    <!-- * LandingPage end --------------------------------------------------------- -->
    <!-- * Mode select screen start --------------------------------------------------------- -->
    <div
      v-if="router.id === 101"
      @click="handleBgClick"
      class="grid place-items-center select-none"
    >
      <button
        @click="setRouterId(100)"
        type="button"
        class="btn btn-warning absolute left-4 top-4"
      >
        <div v-html="ArrowLeftIcon"></div>
        <div>Back</div>
      </button>
      <div
        id="mode-select"
        class="w-full h-screen overflow-auto flex flex-col lg:flex-row lg:justify-center py-36 lg:py-0 items-center gap-20"
      >
        <div
          v-for="(mode, index) in modes"
          :key="index"
          :class="
            gameState.mode === index + 1 && gameState.mode !== 0
              ? 'border-4 border-green-500 z-10 lg:scale-110'
              : ''
          "
          @click="gameState.mode = index + 1"
          class="relative w-[20rem] lg:w-[22rem] px-5 py-10 flex flex-col justify-center items-center gap-4 bg-base-200 border rounded-lg transition-all hover:shadow-lg hover:shadow-[#fff5] cursor-pointer"
        >
          <div v-html="InfoIcon" class="absolute top-4 right-4 scale-150"></div>
          <div class="w-[13em] h-[13em]">
            <img
              :src="
                gameState.mode === index + 1 && gameState.mode !== 0
                  ? mode.gif
                  : mode.thumbnail
              "
              :alt="mode.title"
              class="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div class="flex flex-col gap-2">
            <div class="text-center text-[1.25em] font-bold">
              {{ mode.title }}
            </div>
            <div class="text-center text-[0.875em]">{{ mode.description }}</div>
          </div>
          <button
            v-if="gameState.mode === index + 1"
            type="button"
            @click="routeWithTransition(mode.routerId, 2000, false)"
            class="btn btn-success px-10 text-[1em] text-white font-semibold"
            alt="play-endlessMode-button"
          >
            Play
          </button>
        </div>
      </div>
    </div>
    <!-- * Mode select screen end --------------------------------------------------------- -->
    <!-- * Single player mode start --------------------------------------------------------- -->
    
    <div
      v-if="router.id === 200"
      :style="`background-image: url(/bg/bg${gameState.level >= 9 ? '2' : ''}.svg)`"
      class="h-screen flex flex-col lg:flex-row lg:justify-center items-center"
    >
      <div class="lg:hidden w-full mb-4 flex flex-col items-center">
        <div class="w-full flex flex-col">
          <div class="my-5 flex justify-evenly w-full">
            <img src="./assets/MythMatch_logo.svg" alt="logo" class="w-40" />
            <div class="flex flex-col items-center">
              <div class="text-2xl">Level</div>
              <div class="text-3xl font-semibold">{{ gameState.level }}</div>
            </div>
            <div class="flex flex-col items-center">
              <div class="text-2xl">Scores</div>
              <div class="text-3xl font-semibold">{{ p1.scores }}</div>
            </div>
          </div>
          <div class="flex justify-evenly items-center">
            <div class="flex flex-col text-center">
              <div class="text-2xl">Time</div>
              <div class="text-3xl font-bold font-mono">{{ gameState.time }}</div>
            </div>
            <div class="flex gap-3">
              <button @click="gameState.setSettingOpenState(true)" class="btn" type="button">Setting</button>
              <button @click="gameState.setQuitOpenState(true)" class="btn btn-error" type="button">Quit</button>
            </div>
          </div>
        </div>
      </div>
      <div class="w-full lg:w-9/12 grid place-items-center">
        <div
          :class="`grid-cols-${gameState.level < 4 ? gameState.level + 1 : 4} xs:grid-cols-${gameState.level < 6 ? gameState.level + 1 : 6}`"
          class="w-fit grid grid-flow-row gap-1 xs:gap-2"
        >
          <div
            v-for="(card, index) of board.cards"
            @mouseover="cursor.hover()"
            @mouseleave="cursor.unHover()"
            :key="index"
            class="cursor-pointer w-[5.5rem] h-[5.5rem] lg:w-[7rem] lg:h-[9.8rem] xl:w-[8rem] xl:h-[11.2rem] bg-transparent transition-all duration-500 perspective-1000 filter hover:drop-shadow-glow active:scale-95"
            @click="singlePlayerCardClick(card)"
          >
            <div
              :class="card.isFlipped ? 'flip' : ''"
              class="transition-transform w-full h-full duration-500 transform-style-3d relative"
            >
              <div
                class="absolute bg-black w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-2 lg:border-4 border-mythmatch-100"
              >
                <img
                  :src="`/cards/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
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
                  :src="card.arts"
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
          <div
            class="absolute inset-4 bg-[#0003] rounded-lg border-2 border-mythmatch-100 backdrop-blur-md flex flex-col items-center"
          >
            <div class="w-10/12">
              <img src="./assets/MythMatch_logo.svg" alt="logo" />
            </div>
            <div class="w-full flex justify-evenly">
              <div
                class="text-mythmatch-100 flex flex-col items-center justify-center"
              >
                <div class="text-3xl">Level</div>
                <div class="text-5xl font-bold">{{ gameState.level }}</div>
              </div>
              <div
                class="text-mythmatch-100 flex flex-col items-center justify-center"
              >
                <div class="text-3xl">Your Score</div>
                <div class="text-5xl font-bold">{{ p1.scores }}</div>
              </div>
            </div>
            <div class="text-mythmatch-100 flex flex-col items-center justify-center">
              <div class="text-3xl">Time</div>
              <div class="text-5xl font-semibold font-mono">{{ gameState.time }}</div>
            </div>
            <button @click="gameState.setSettingOpenState(true)" class="btn" type="button">Setting</button>
            <button @click="gameState.setQuitOpenState(true)" class="btn btn-error" type="button">Quit</button>
          </div>
        </div>
      </div>
      <!-- lg: left info section end -->
    </div>
    <!-- * Single player mode end --------------------------------------------------------- -->

    <!-- * Single player countdown start --------------------------------------------------------- -->
    <div
      v-if="gameState.mode === 1 && !gameState.isPlaying && gameState.isTimerRunning"
      class="absolute top-0 left-0 z-40 w-full h-screen bg-[#000c] flex flex-col justify-center items-center"
    >
      <div class="text-6xl font-mythmatch text-mythmatch-100">{{ Math.round(gameState.time) }}</div>
    </div>
    <!-- * Single player countdown start --------------------------------------------------------- -->
    
    <!-- * Single player quit start --------------------------------------------------------- -->
    <div
      v-if="router.id === 200"
      :class="gameState.isQuitOpen ? 'translate-y-[-100%] opacity-100' : 'translate-y-[0%] opacity-0'" class="absolute transition-opacity z-40 w-full h-screen bg-[#000c] flex flex-col gap-16 justify-center items-center text-center">
      <div class="text-3xl xs:text-8xl font-mythmatch text-mythmatch-100">You wanna exit?!</div>
      <div class="flex flex-col gap-3">
        <div class="text-xl flex items-center gap-2"><div>If you want restart, you can click</div>
          <button @click="handleRestartBtn(startSinglePlayerMode)" type="button" class="btn btn-sm btn-outline">
            <div>Restart</div>
          </button>
        </div>
        <div class="text-xl">but you want to really quit, right?</div>
      </div>
      <div class="flex gap-8">
        <button @click="handleQuitBtn" type="button" class="btn btn-lg">
          <div>Yes</div>
        </button>
        <button @click="gameState.setQuitOpenState(false)" type="button" class="btn btn-lg btn-warning">
          <div>No</div>
        </button>
      </div>
    </div>
    <!-- * Single player quit end --------------------------------------------------------- -->
    <!-- * Single player game over start --------------------------------------------------------- -->
    <div
      v-if="router.id === 200"
      :class="gameState.isGameOver && gameState.mode === 1 ? 'translate-y-[-100%] opacity-100' : 'translate-y-[0%] opacity-0'" class="absolute transition-opacity duration-[2.5s] z-40 w-full h-screen bg-[#000c] flex flex-col gap-16 justify-center items-center text-center"
    >
      <div class="text-6xl xs:text-8xl font-mythmatch text-mythmatch-100">Game Over</div>
        <div class="flex flex-col items-center">
          <div class="text-3xl">Score</div>
          <div class="text-6xl font-semibold text-mythmatch-100">{{ p1.scores }}</div>
        </div>
        <div>
          <div class="text-2xl">You've flipped {{ p1.counter.flip }} times</div>
          <div class="text-2xl">You've collected {{ p1.counter.pair }} pairs</div>
          <div class="text-2xl">Accuracy {{ p1.accuracy }}%</div>
        </div>
        <button @click="handleQuitBtn" type="button" class="btn btn-warning">
          <div v-html="ArrowLeftIcon"></div>
          <div>Quit</div>
        </button>
      </div>
    <!-- * Single player game over end --------------------------------------------------------- -->
    
    <!-- * Multi player mode start --------------------------------------------------------- -->
    <div v-if="router.id === 201" class="h-screen flex items-center justify-center gap-24" 
    :style="gameState.playerTurn === 1 ? 'background-image: linear-gradient(to right, #f55a 0%, #0000 50% 100%)' 
    : 'background-image: linear-gradient(to left, #f55a 0%, #0000 50% 100%)'">

      <button
        @click="setRouterId(100)"
        type="button"
        class="btn btn-warning absolute left-4 top-4"
      >
        <div v-html="ArrowLeftIcon"></div>
        <div>Quit</div>
      </button>
      <!-- {{ gameState.playerTurn }} -->
      <div 
        class="text-mythmatch-100 flex flex-col items-center justify-center "
      >
        <div class="text-3xl ">Player 1 score</div>
        <div class="text-5xl ">{{ p1.scores }}</div>
      </div>


      <div class="lg:w-fit grid place-items-center">
        <div
          class="w-fit grid grid-cols-6 grid-flow-row gap-3 "
        >
          <div
            v-for="(card, index) of board.cards"
            :key="index"
            class="lg:w-[7rem] lg:h-[9.8rem] bg-transparent transition-all duration-500 perspective-1000 filter hover:drop-shadow-glow active:scale-95"
            @click="multiplayerCardsClick(card)"
          >
            <div
              :class="card.isFlipped ? 'flip' : ''"
              class="transition-transform w-full h-full duration-500 transform-style-3d relative"
            >
              <div
                class="absolute bg-black w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-4 border-mythmatch-100"
              >
                <img
                  :src="`/cards/backcard.${setting.quality === 'high' ? 'png' : 'webp'}`"
                  alt="backcard"
                  class="w-full lg:h-full"
                />
              </div>
              <div
                :style="`background-image: linear-gradient(135deg, ${card.color.primary} 0% 10%, #303 10% 90% , ${card.color.secondary} 90% 100%)`"
                class="flip transition-all absolute w-full h-full flex flex-col gap-1 justify-center items-center rounded-lg border-4 border-mythmatch-100"
              >
                <div class="font-bold font-mythmatch text-xl text-mythmatch-100">
                  {{ card.name }}
                </div>
                <img
                  :src="card.arts"
                  :alt="card.name"
                  class="rounded-lg w-10/12"
                />
                <div
                  class="rotate-180 font-bold font-mythmatch text-xl text-mythmatch-100"
                >
                  {{ card.name }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>  
      <div 
        class="text-mythmatch-100 flex flex-col items-center justify-center "
      >
        <div class="text-3xl ">Player 2 score</div>
        <div class="text-5xl font-bold ">{{ p2.scores }}</div>
      </div>
    </div>
    <!-- * Multi player mode end --------------------------------------------------------- -->

    <!-- * Multiplayer winner modal start --------------------------------------------------------- -->
    <div v-if="router.id === 201 && gameState.winner > 0" class="absolute top-0 left-0 w-full h-screen z-40 bg-[#000c] grid place-items-center">
      <div class="flex flex-col justify-center items-center gap-5">
        <div class="text-2xl">
          Player {{ gameState.winner }} is winner.
        </div>
        <button @click="handleQuitBtn" type="button" class="btn btn-lg btn-warning">Quit</button>
      </div>
    </div>
    <!-- * Multiplayer winner modal end --------------------------------------------------------- -->

    <!-- setting modal start -------------------------------------------------------------->
    <div v-show="gameState.isSettingOpen" class="absolute w-full h-screen translate-y-[-100%] bg-[#0005]  flex justify-center items-center z-30">
      <div class="relative h-[15rem] flex flex-col bg-base-100 border-2 border-mythmatch-100 rounded-lg">
        <div class="text-center text-4xl font-mythmatch font-bold my-5">Setting</div>
        <div class="flex flex-col items-start gap-3 px-5">
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2">
              <div class="text-lg">Music</div>
              <input type="range" class="range range-sm disabled:opacity-70 disabled:cursor-not-allowed" min="0" max="100" step="10" v-model="gameState.setting.bgmVolume" :disabled="gameState.setting.isBgmMute">
            </label>
            <button @click="gameState.toggleMute('bgm')" :class="setting.isBgmMute ? 'bg-red-400' : 'bg-base-200'" class="w-6 h-6 grid place-items-center rounded-lg">
              <img v-if="setting.isBgmMute" src="/setting/sound_off.svg" alt="muted">
              <img v-else src="/setting/sound_on.svg" alt="volume">
            </button>
          </div>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2">
              <div class="text-lg">Effect</div>
              <input type="range" class="range range-sm disabled:opacity-70 disabled:cursor-not-allowed" min="0" max="100" step="10" v-model="gameState.setting.sfxVolume" :disabled="gameState.setting.isSfxMute">
            </label>
            <button @click="gameState.toggleMute('sfx')" :class="setting.isSfxMute ? 'bg-red-400' : 'bg-base-200'" class="w-6 h-6 grid place-items-center rounded-lg">
              <img v-if="setting.isSfxMute" src="/setting/sound_off.svg" alt="muted">
              <img v-else src="/setting/sound_on.svg" alt="volume">
            </button>
          </div>
          <div class="flex gap-3 justify-center">
            <div>Quality</div>
            <label class="flex gap-1 items-center">
              <input v-model="setting.quality" type="radio" name="quality" value="low" class="radio radio-xs">
              <span>low</span>
            </label>
            <label class="flex gap-1 items-center">
              <input v-model="setting.quality" type="radio" name="quality" value="high" class="radio radio-xs">
              <span>High</span>
            </label>
          </div>
        </div>
        <div class="absolute top-2 right-2">
          <button @click="gameState.setSettingOpenState(false)" class="btn btn-circle btn-neutral btn-sm">
            <div>X</div>
          </button>
        </div>
      </div>
    </div>
    <!-- setting modal end --------------------------------------------------------------------->
  </div>
</template>

<style scoped>
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
</style>
