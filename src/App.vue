<script setup>
import { reactive, ref } from "vue"
import GitHubIcon from "./assets/github.svg?raw"
import BookIcon from "./assets/book.svg?raw"
import ArrowLeftIcon from "./assets/arrow-left.svg?raw"
import InfoIcon from "./assets/info-circle.svg?raw"

const landingPageCardFlipState = reactive([false, false, false, false])
const router = reactive({
  id: parseInt(localStorage.getItem('router_id')) || 100
})

// Start Page ID:100
// Selecmode page ID:101
function setRouterId(id) {
  router.id = id
  localStorage.setItem("router_id", id)
}

/**
 * This function is used to navigate to url.
 * @param {string} url - The url to navigate to.
 * @param {boolean} newTap - Whether to open the url in a new tab.
 */
function gotoUrl(url, newTap) {
  // This is temporary function to navigate to url.
  // We should implement other method sometime.
  window.open(url, newTap ? "_blank" : "_self")
}

const modes = [
  { title: "mode1", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.", thumbnail: "https://gdb.voanews.com/EEA0B145-95D4-4532-9C69-D0FCD1833D53_w408_r0_s.jpg" },
  { title: "mode2", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.", thumbnail: "https://gdb.voanews.com/EEA0B145-95D4-4532-9C69-D0FCD1833D53_w408_r0_s.jpg" },
  { title: "mode3", description: "Lorem ipsum dolor sit amet consectetur adipisicing elit.", thumbnail: "https://gdb.voanews.com/EEA0B145-95D4-4532-9C69-D0FCD1833D53_w408_r0_s.jpg" }
]
</script>

<template>

  <!-- * LandingPage start --------------------------------------------------------- -->
  <div
    v-if="router.id === 100"
    id="landing-page"
    class="h-svh flex flex-col justify-center items-center gap-16 sm:gap-32"
  >
    <div id="game-title" class="flex gap-2 sm:gap-6">
      <div class="-rotate-12 text-[0.5rem] sm:text-[1rem]">
        <div class="absolute bg-white w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex justify-center items-center rounded-lg border-2 origin-bottom -rotate-45">
          <div class="text-black text-md">Front</div>
        </div>
        <div class="bg-black w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex justify-center items-center rounded-lg border-2">
            <div class="text-white text-md">Back</div>
        </div>  
      </div>
      <div class="text-3xl sm:text-6xl lg:text-8xl font-bold tracking-wider">Game Title</div>
      <div class="rotate-12 text-[0.5rem] sm:text-[1rem]">
        <div class="absolute bg-black w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex justify-center items-center rounded-lg border-2 origin-bottom rotate-45">
          <div class="text-white text-md">Back</div>
        </div>  
        <div class="bg-white w-[4em] h-[5.6em] lg:w-[5em] lg:h-[7em] flex justify-center items-center rounded-lg border-2">
          <div class="text-black text-md">Front</div>
        </div>
      </div>
    </div>
    <div id="landing-4-card" class="hidden sm:flex gap-8">
      <div
        v-for="(cardFlipState, index) of landingPageCardFlipState"
        :key="index"
        class="w-[8rem] h-[11.2rem] lg:w-[10rem] lg:h-[14rem] bg-transparent perspective-1000"
        @click="landingPageCardFlipState[index] = !landingPageCardFlipState[index]"
      >
          <div :class="cardFlipState ? 'flip' : ''" class="transition-transform duration-500 transform-style-3d">
              <div class="absolute bg-black w-[8rem] h-[11.2rem] lg:w-[10rem] lg:h-[14rem] flex justify-center items-center rounded-lg border-2">
                  <div class="text-white text-2xl">Back</div>
              </div>
              <div class="flip absolute bg-white w-[8rem] h-[11.2rem] lg:w-[10rem] lg:h-[14rem] flex justify-center items-center rounded-lg border-2">
                  <div class="text-black text-2xl">Front</div>
              </div>
          </div>
      </div>
    </div>
    <div id="landing-1-card" class="flex sm:hidden">
      <div
        class="w-[10rem] h-[14rem] bg-transparent perspective-1000"
        @click="landingPageCardFlipState[0] = !landingPageCardFlipState[0]"
      >
          <div :class="landingPageCardFlipState[0] ? 'flip' : ''" class="transition-transform duration-500 transform-style-3d">
              <div class="absolute bg-black w-[10rem] h-[14rem] flex justify-center items-center rounded-lg border-2">
                  <div class="text-white text-2xl">Back</div>
              </div>
              <div class="flip absolute bg-white w-[10rem] h-[14rem] flex justify-center items-center rounded-lg border-2">
                  <div class="text-black text-2xl">Front</div>
              </div>
          </div>
      </div>
    </div>
    <button id="play-btn" type="button" class="btn btn-lg btn-success w-52 text-2xl text-white font-bold" @click="setRouterId(101)">Play</button>
    <div id="corner-btn-group" class="absolute flex xs:flex-col gap-2 right-4 bottom-4">
      <div class="tooltip hover:tooltip-open tooltip-left tooltip-info" data-tip="How to play?">
        <button type="button" class="btn btn-circle btn-neutral btn-lg">
          <div v-html="BookIcon" class="scale-[1.75]"></div>
        </button>
      </div>
      <div class="tooltip hover:tooltip-open tooltip-left tooltip-info" data-tip="This project on GitHub">
        <button @click="gotoUrl('https://github.com/6MA-606/PROJECT1-SEC2-Point-of-Vue/', true)" type="button" class="btn btn-circle btn-neutral btn-lg">
          <div v-html="GitHubIcon" class="scale-[2]"></div>
        </button>
      </div>
    </div>
  </div>
  <!-- * LandingPage end --------------------------------------------------------- -->

  <!-- * Mode select screen start --------------------------------------------------------- -->
  <div v-if="router.id === 101" class="grid place-items-center select-none">
    <button @click="router.id = 100" type="button" class="btn btn-warning absolute left-4 top-4">
      <div v-html="ArrowLeftIcon"></div>
      <div>Back</div>
    </button>
    <div class="flex justify-center gap-20 mt-64">
      <div
        v-for="(mode, index) in modes"
        :key="index"
        class="w-1/4 flex flex-col justify-center items-center"
      >
        <div class="overflow-hidden w-52 h-52 rounded-lg relative">
          <div v-html="InfoIcon" class="absolute top-2 right-2 scale-150"></div>
          <img
            :src="mode.thumbnail"
            alt="Monkey Picture"
          />
        </div>
        <div class="text-center">{{ mode.title }}</div>
        <div class="text-center">{{ mode.description }}</div>
      </div>
    </div>
  </div>
  <!-- * Mode select screen end --------------------------------------------------------- -->
</template>

<style scoped>
.flip {
  /* perspective: 1000px; */
  transform: rotateY(180deg);
  backface-visibility: hidden;
}

.transform-style-3d {
  transform-style: preserve-3d;
}

.perspective-1000 {
  perspective: 1000px;
}
</style>
