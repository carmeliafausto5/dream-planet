<template>
  <!-- #ifdef MP-WEIXIN -->
  <canvas id="dreamSky" type="2d" class="sky" disable-scroll
    @touchstart="touchStart" @touchmove.stop.prevent="touchMove"
    @touchend="touchEnd" @touchcancel="touchCancel" />
  <!-- #endif -->
  <!-- #ifndef MP-WEIXIN -->
  <view class="sky" :model="model" :change:model="sky.sync" />
  <!-- #endif -->
</template>

<script>
// #ifdef MP-WEIXIN
import { createScene } from './scene.js'
// #endif

export default {
  props: {
    ids: { type: Array, required: true },
    active: { type: Boolean, default: true }
  },
  emits: ['pick'],
  computed: {
    model() { return { ids: this.ids, active: this.active } }
  },
  methods: {
    pick(id) { this.$emit('pick', id) },
    // #ifdef MP-WEIXIN
    points(touches) {
      return Array.from(touches || [], p => ({
        x: p.x ?? p.clientX - this._bounds.left,
        y: p.y ?? p.clientY - this._bounds.top
      }))
    },
    touchStart(e) { this._scene?.begin(this.points(e.touches)) },
    touchMove(e) { this._scene?.move(this.points(e.touches)) },
    touchEnd(e) { this._scene?.end(this.points(e.touches), this.points(e.changedTouches)[0]) },
    touchCancel() { this._scene?.end([], null, true) },
    measure() {
      uni.createSelectorQuery().in(this).select('#dreamSky').fields({node:true,size:true,rect:true}).exec(result=>{
        const bounds=result[0]
        if(this._disposed || !bounds?.node || !bounds.width) return
        this._bounds=bounds
        const canvas=bounds.node
        if(!this._scene) {
          this._canvas=canvas
          this._scene=createScene(canvas,id=>this.pick(id))
          this._scene.setIds(this.ids)
        }
        this._scene.resize(bounds.width,bounds.height,uni.getSystemInfoSync().pixelRatio)
        this.schedule()
      })
    },
    schedule() {
      if(!this.active || !this._scene || this._frame!=null) return
      this._frame=this._canvas.requestAnimationFrame(()=>{
        this._frame=null
        if(!this.active || this._disposed) return
        const now=Date.now()
        if(!this._lastDraw || now-this._lastDraw>=32) {
          this._scene.draw(now)
          this._lastDraw=now
        }
        this.schedule()
      })
    }
    // #endif
  },
  // #ifdef MP-WEIXIN
  watch: {
    ids(value) { this._scene?.setIds(value) },
    active(value) { if(value) this.schedule() }
  },
  mounted() {
    this.$nextTick(this.measure)
    uni.onWindowResize(this.measure)
  },
  beforeUnmount() {
    this._disposed=true
    if(this._frame!=null) this._canvas.cancelAnimationFrame(this._frame)
    uni.offWindowResize(this.measure)
    this._scene=null
  }
  // #endif
}
</script>

<!-- #ifndef MP-WEIXIN -->
<script module="sky" lang="renderjs">
import { createScene } from './scene.js'

export default {
  mounted() { this.$nextTick(()=>this.setup()) },
  beforeUnmount() { this.teardown() },
  methods: {
    sync(value) {
      if(!value) return
      this._model=value
      if(this._scene) {
        this._scene.setIds(value.ids)
        this.schedule()
      }
    },
    setup() {
      const host=this.$el
      if(!host || this._canvas) return
      const canvas=document.createElement('canvas')
      canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none;cursor:grab'
      host.appendChild(canvas)
      this._canvas=canvas
      const scene=createScene(canvas,id=>this.$ownerInstance.callMethod('pick',id))
      this._scene=scene
      scene.setIds(this._model?.ids || [])
      const resize=()=>{
        const bounds=host.getBoundingClientRect()
        if(bounds.width && bounds.height) scene.resize(bounds.width,bounds.height,window.devicePixelRatio)
      }
      const pointers=new Map()
      const point=e=>{
        const box=canvas.getBoundingClientRect()
        return {x:e.clientX-box.left,y:e.clientY-box.top}
      }
      const finish=(e,cancelled)=>{
        if(!pointers.has(e.pointerId)) return
        pointers.delete(e.pointerId)
        scene.end([...pointers.values()],point(e),cancelled)
        if(!pointers.size) canvas.style.cursor='grab'
      }
      canvas.onpointerdown=e=>{
        if(e.button!==0) return
        canvas.setPointerCapture(e.pointerId)
        pointers.set(e.pointerId,point(e))
        scene.begin([...pointers.values()])
        canvas.style.cursor='grabbing'
      }
      canvas.onpointermove=e=>{
        if(!pointers.has(e.pointerId)) return
        pointers.set(e.pointerId,point(e))
        scene.move([...pointers.values()])
      }
      canvas.onpointerup=e=>finish(e,false)
      canvas.onpointercancel=e=>finish(e,true)
      canvas.onlostpointercapture=e=>finish(e,true)
      canvas.addEventListener('wheel',e=>{
        e.preventDefault()
        scene.wheel(e.deltaY*(e.deltaMode===1 ? 16 : 1))
      },{passive:false})
      this._resize=resize
      window.addEventListener('resize',resize)
      if(typeof ResizeObserver!=='undefined') {
        this._observer=new ResizeObserver(resize)
        this._observer.observe(host)
      }
      resize()
      this.schedule()
    },
    schedule() {
      if(!this._scene || this._model?.active===false || this._frame!=null) return
      this._frame=requestAnimationFrame(time=>{
        this._frame=null
        if(!this._scene || this._model?.active===false) return
        if(!this._lastDraw || time-this._lastDraw>=32) {
          this._scene.draw(time)
          this._lastDraw=time
        }
        this.schedule()
      })
    },
    teardown() {
      if(this._frame!=null) cancelAnimationFrame(this._frame)
      this._observer?.disconnect()
      if(this._resize) window.removeEventListener('resize',this._resize)
      this._scene=null
      this._canvas?.remove()
    }
  }
}
</script>
<!-- #endif -->

<style scoped>
.sky { display: block; width: 100%; height: 100%; touch-action: none; }
</style>
