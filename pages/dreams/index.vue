<template>
  <view class="night-sky">
    <view class="masthead">
      <view class="emblem"><view class="emblem-ring" /></view>
      <text class="title">梦想星球</text>
    </view>

    <view class="stage">
      <dream-planet :ids="ids" :active="visible && !selected" @pick="openStory" />
    </view>

    <view class="caption">
      <view class="count-line"><view class="live-dot" /><text>星球上有 <text class="count">{{ ids.length }}</text> 个梦想</text></view>
      <!-- #ifdef H5 -->
      <text class="hint">拖动旋转 · 滚轮或双指缩放 · 点昵称读故事</text>
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <text class="hint">拖动旋转 · 双指缩放 · 点昵称读故事</text>
      <!-- #endif -->
    </view>

    <view v-if="selected" class="veil" @tap="closeStory">
      <view class="story-card" @tap.stop role="dialog" aria-modal="true" :aria-label="selected.title">
        <view class="story-top">
          <text class="signature">✦　{{ selected.id }} 的梦想</text>
          <button class="close" aria-label="关闭故事" @tap="closeStory">×</button>
        </view>
        <text class="story-title">{{ selected.title }}</text>
        <text class="story-body">{{ selected.story }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import DreamPlanet from '../../components/dream-planet/dream-planet.vue'
import { stories } from './stories.js'

export default {
  components: { DreamPlanet },
  data() { return { ids: stories.map(item=>item.id), selected:null, visible:true } },
  onShow() { this.visible=true },
  onHide() { this.visible=false },
  onBackPress() {
    if(this.selected) { this.closeStory(); return true }
    return false
  },
  // #ifdef H5
  mounted() { window.addEventListener('keydown',this.keydown) },
  beforeUnmount() { window.removeEventListener('keydown',this.keydown) },
  // #endif
  methods: {
    openStory(id) { this.selected=stories.find(item=>item.id===id) || null },
    closeStory() { this.selected=null },
    keydown(event) { if(event.key==='Escape') this.closeStory() }
  }
}
</script>

<style scoped>
.night-sky {
  position: fixed; inset: 0; overflow: hidden; display: flex; flex-direction: column;
  align-items: center; color: #373253; font-family: "PingFang SC","Microsoft YaHei",sans-serif;
  background: radial-gradient(ellipse at 5% 26%,#c8f6f7 0%,transparent 55%),
    radial-gradient(ellipse at 97% 38%,#eedff9 0%,transparent 58%),
    radial-gradient(ellipse at 40% 99%,#f2fffb 0%,transparent 68%),#f2f0fc;
}
.masthead { position: absolute; top: calc(26px + env(safe-area-inset-top)); left: 6%; display: flex; align-items: center; gap: 13px; z-index: 1; }
.title { font-family: "Songti SC","STSong","SimSun",serif; font-size: 23px; font-weight: 600; letter-spacing: .13em; }
.emblem { width: 19px; height: 19px; border: 1.6px solid #51446c; border-radius: 50%; position: relative; transform: rotate(-24deg); }
.emblem-ring { position: absolute; width: 30px; height: 7px; border: 1.4px solid #51446c; border-radius: 50%; left: -7px; top: 5px; }
.stage { width: 100%; max-width: 850px; position: absolute; top: 10%; bottom: 13%; }
.caption { position: absolute; bottom: calc(5% + env(safe-area-inset-bottom)); display:flex; flex-direction:column; align-items:center; gap:11px; }
.count-line { display:flex; align-items:center; gap:10px; font-size:15px; letter-spacing:.06em; }
.count { font-family: Georgia,serif; font-size:23px; font-style:italic; }
.live-dot { width:7px; height:7px; border-radius:50%; background:#68aeac; box-shadow:0 0 0 4px rgba(116,187,179,.17); }
.hint { color:#625e75; font-size:12px; letter-spacing:.04em; }
.veil { position:absolute; inset:0; z-index:5; display:flex; align-items:center; justify-content:center; padding:24px; background:rgba(61,46,94,.22); }
.story-card { width:100%; max-width:360px; max-height:75%; overflow:auto; box-sizing:border-box; padding:25px 28px 33px; border-radius:24px; border:1px solid white; background:linear-gradient(135deg,#f4fffd,#fff8ff 85%); box-shadow:0 24px 75px rgba(77,53,114,.19); }
.story-top { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.signature { font-size:13px; color:#75638b; }
.close { padding:0; margin:0; width:36px; height:36px; line-height:32px; text-align:center; font-size:25px; color:#665b76; background:#eeebf4; border:0; border-radius:50%; }
.close::after { border:0; }
.story-title { display:block; margin:21px 0 16px; font-family:"Songti SC","STSong","SimSun",serif; font-size:26px; font-weight:600; }
.story-body { display:block; font-size:15px; line-height:1.95; color:#595368; }
@media (max-height:480px) {
  .masthead { top:12px; } .stage { top:1%; bottom:12%; } .caption { bottom:8px; gap:2px; }
}
</style>
