<script setup>
import { reactive } from 'vue';

const landingPageCardFlipState = reactive([false, false, false, false])
let router= reactive({
  titlePage:true,
  selectModePage:false,
  

})
let setRouterSelectMode = () =>{
  router.titlePage = !router.titlePage
  router.selectModePage = !router.selectModePage

}

/**
 * This function is used to navigate to url.
 * @param {string} url - The url to navigate to.
 * @param {boolean} newTap - Whether to open the url in a new tab.
 */
function gotoUrl(url, newTap) {
    // This is temporary function to navigate to url.
    // We should implement other method sometime.
    window.open(url, newTap ? '_blank' : '_self')
}

</script>
 
<template>
  <!-- * LandingPage start --------------------------------------------------------- -->
  <div id="landing-page" class="h-svh flex flex-col justify-center items-center gap-16 sm:gap-32" v-if="router.titlePage">
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
    <button id="play-btn" type="button" class="btn btn-lg btn-success w-52 text-2xl text-white font-bold" @click = "setRouterSelectMode">Play</button>
    <div id="corner-btn-group" class="absolute flex xs:flex-col gap-2 right-4 bottom-4">
      <div class="tooltip hover:tooltip-open tooltip-left tooltip-info" data-tip="How to play?">
        <button type="button" class="btn btn-circle btn-neutral btn-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>
          </svg>
        </button>
      </div>
      <div class="tooltip hover:tooltip-open tooltip-left tooltip-info" data-tip="This project on GitHub">
        <button @click="gotoUrl('https://github.com/6MA-606/PROJECT1-SEC2-Point-of-Vue/', true)" type="button" class="btn btn-circle btn-neutral btn-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
  <!-- * LandingPage end --------------------------------------------------------- -->

  <!-- * Mode select screen start --------------------------------------------------------- -->
  <div >
    <h1>Mode Select Page !!!</h1>
    <!-- TODO: Mode select screen -->
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