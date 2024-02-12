<script setup>
import { onMounted, reactive, ref, toRefs, watch } from 'vue'
import GitHubIcon from './assets/github.svg?raw'
import BookIcon from './assets/book.svg?raw'
import ArrowLeftIcon from './assets/arrow-left.svg?raw'
import InfoIcon from './assets/info-circle.svg?raw'
import { gotoUrl } from './utils/helperFunction.js'
import Cards from '../data/cards.json'
import Game from '../classes/Game'

const router = reactive({
  id: parseInt(localStorage.getItem('router_id')) || 100,
})

const isLoading = ref(false)

// Start Page ID:100
// Selecmode page ID:101
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

// const gameState = reactive({
//   mode: 0, // 0: No selected, 1: Endless Mode (1P), 2: Versus Mode (2P)
//   board: new Board(),
//   time: '00:00:30.00',
//   player: {
//     p1: new Player(),
//     p2: new Player()
//   }
// })

const gameState = reactive(new Game())

const { board, players } = toRefs(gameState)
const { p1, p2 } = players.value

onMounted(() => {
  if (router.id === 100) {
    board.value.getPairCard(2)
    board.value.shuffle()
  }
})

// function reset() {
//   gameState.mode = 0
//   gameState.time = 30
//   p1.reset()
//   p2.reset()
//   board.value.clearCards()
// }

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
  gameState.level = 1
  board.value.clearCards()
  board.value.getPairCard(2)
  board.value.shuffle()
  // setTimeout(() => {
  //   gameState.bgm = 'bgmPhase2'
  // }, 1000)
  gameState.startTimer(30)
}

const singlePlayerCardClick = (card) => {
  if (!card.isFliped && p1.selectedCards.length < 2) {
    card.isFliped = true
    p1.addFlipCount()
    p1.addCard(card)
  } else return

  if (p1.selectedCards.length === 2) {
    if (p1.isPaired()) {
      p1.addPairCount()
      p1.addScores(1)
      p1.clearCards()
      gameState.addTime(5)
    } else {
      setTimeout(() => {
        p1.selectedCards.forEach((card) => {
          card.isFliped = false
        })
        p1.clearCards()
      }, 1000)
    }
  }

  if (board.value.isAllCardFlipped()) {
    gameState.nextLevel()
  }
}

const handleQuitBtn = () => {
  if (window.confirm('Quit?') === true) {
    routeWithTransition(100, 2000, true)
    gameState.reset()
  }
}

watch(
  () => router.id,
  (newRouterId) => {
    console.log(newRouterId)
    switch (newRouterId) {
      case 100:
        board.value.getPairCard(2)
        board.value.shuffle()
        break
      case 200:
        console.log('singleplayer mode start')
        startSinglePlayerMode()
        break
      case 201:
        console.log('multiplayer mode start')
        break
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

let bgm = null
watch(
  () => gameState.bgm,
  (newBgm) => {
    console.log(newBgm)
    if (bgm) bgm.pause()
    bgm = new Audio(`/sounds/${newBgm}.mp3`)
    bgm.loop = true
    bgm.play()
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
        p1: {
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
    console.log(debugString)
  },
  { deep: true }
)
</script>

<template>
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
            src="/cards/backcard.webp"
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
    class="h-svh flex flex-col justify-center items-center gap-16 sm:gap-32"
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
            alt="bcakcard"
            class="w-full h-full"
          />
        </div>
      </div>
      <div>
        <img
          src="./assets/MythMatch_logo.svg"
          alt="MythMatch_logo"
          class="w-[22rem] lg:w-[30rem] filter drop-shadow-glow"
        />
      </div>
      <div class="hidden sm:block rotate-12 text-[0.5rem] sm:text-[1rem]">
        <div
          class="absolute bg-black w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex justify-center items-center rounded-lg border-2 border-mythmatch-100 overflow-hidden origin-bottom rotate-45 z-10"
        >
          <img
            src="/cards/backcard.webp"
            alt="bcakcard"
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
        :key="index"
        :class="
          index > 0
            ? 'hidden sm:block w-[8rem] h-[11.2rem]'
            : 'w-[10rem] h-[14rem] sm:w-[8rem] sm:h-[11.2rem]'
        "
        class="lg:w-[10rem] lg:h-[14rem] bg-transparent transition-all duration-500 perspective-1000 filter hover:drop-shadow-glow active:scale-95"
        @click="card.isFliped = !card.isFliped"
      >
        <div
          :class="card.isFliped ? 'flip' : ''"
          class="transition-transform w-full h-full duration-500 transform-style-3d relative"
        >
          <div
            class="absolute bg-black w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-4 border-mythmatch-100"
          >
            <img
              src="/cards/backcard.webp"
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
    <button
      id="play-btn"
      type="button"
      class="btn-mythmatch"
      alt="home-play-btn"
      @click="routeWithTransition(101, 2000, true)"
    >
      Play
    </button>
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
          alt="play-endlesMode-button"
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
    <!-- <button @click="handleQuitBtn" type="button" class="btn btn-warning absolute left-4 top-4">
      <div v-html="ArrowLeftIcon"></div>
      <div>Quit</div>
    </button> -->
    <!-- <div>{{ p1.scores }}</div> -->

    <div class="lg:hidden w-full mb-5 flex flex-col items-center">
      <div class="w-8/12 my-3"><img src="./assets/MythMatch_logo.svg" alt="logo" /></div>
      <div class="w-full flex justify-around">
        <div class="flex flex-col text-center">
          <div class="text-3xl">Time</div>
          <div class="text-5xl font-semibold">{{ gameState.time }}</div>
        </div>
        <div class="flex flex-col text-center">
          <div class="text-3xl">Scores</div>
          <div class="text-5xl font-semibold">{{ p1.scores }}</div>
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
          :key="index"
          class="cursor-pointer w-[5.5rem] h-[5.5rem] lg:w-[7rem] lg:h-[9.8rem] xl:w-[8rem] xl:h-[11.2rem] bg-transparent transition-all duration-500 perspective-1000 filter hover:drop-shadow-glow active:scale-95"
          @click="singlePlayerCardClick(card)"
        >
          <div
            :class="card.isFliped ? 'flip' : ''"
            class="transition-transform w-full h-full duration-500 transform-style-3d relative"
          >
            <div
              class="absolute bg-black w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-2 lg:border-4 border-mythmatch-100"
            >
              <img
                src="/cards/backcard.webp"
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
          <div
            class="text-mythmatch-100 flex flex-col items-center justify-center h-2/6"
          >
            <div class="text-3xl">Time</div>
            <div class="text-5xl font-semibold">{{ gameState.time }}</div>
          </div>
          <div
            class="text-mythmatch-100 flex flex-col items-center justify-center h-1/6"
          >
            <div class="text-3xl">Level</div>
            <div class="text-5xl font-bold">{{ gameState.level }}</div>
          </div>
          <div
            class="text-mythmatch-100 flex flex-col items-center justify-center h-1/6"
          >
            <div class="text-3xl">Your Score</div>
            <div class="text-5xl font-bold">{{ p1.scores }}</div>
          </div>
        </div>
      </div>
    </div>
    <!-- lg: left info section end -->
  </div>
  <!-- * Single player mode end --------------------------------------------------------- -->

  <!-- * Single player gameover start --------------------------------------------------------- -->

  <div :class="gameState.isGameOverred ? 'translate-y-[-100%] opacity-100' : 'translate-y-[0%] opacity-0'" class="absolute transition-opacity duration-[2.5s] z-40 w-full h-screen bg-[#000a] flex flex-col gap-16 justify-center items-center text-center">
    <div class="text-6xl">Game Over</div>
      <div>
        <div class="text-2xl">You've flipped {{ p1.counter.flip }} times</div>
        <div class="text-2xl">You've collected {{ p1.counter.pair }} pairs</div>
      </div>
  </div>

  <!-- * Single player gameover end --------------------------------------------------------- -->

  <!-- * Multi player mode start --------------------------------------------------------- -->
  <div v-if="router.id === 201">
    <button
      @click="setRouterId(100)"
      type="button"
      class="btn btn-warning absolute left-4 top-4"
    >
      <div v-html="ArrowLeftIcon"></div>
      <div>Quit</div>
    </button>
  </div>
  <!-- * Multi player mode end --------------------------------------------------------- -->
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
