<template>
  <!-- #ifdef MP-WEIXIN -->
  <!-- 微信小程序端使用专用组件 -->
  <planet-sphere-mp
    v-bind="$attrs"
    @userClick="handleUserClick"
    ref="mpComponent"
  />
  <!-- #endif -->
  <!-- #ifndef MP-WEIXIN -->
  <!-- H5和App端使用专用组件 -->
  <planet-sphere-web-and-app
    v-bind="$attrs"
    @userClick="handleUserClick"
    ref="webComponent"
  />
  <!-- #endif -->
</template>
<script>
// #ifdef MP-WEIXIN
// 微信小程序端导入专用组件
import PlanetSphereMp from './planet-sphere-mp.vue'
// #endif

// #ifndef MP-WEIXIN
// H5和App端导入专用组件
import PlanetSphereWebAndApp from './planet-sphere-webandApp.vue'
// #endif

export default {
  name: 'PlanetSphere',
  // 组件注册
  components: {
    // #ifdef MP-WEIXIN
    PlanetSphereMp,
    // #endif
    // #ifndef MP-WEIXIN
    PlanetSphereWebAndApp
    // #endif
  },
  // 继承属性，让父组件的props自动传递给子组件
  inheritAttrs: false,
  // 定义emits，确保事件正确传递
  emits: ['userClick'],
  // 方法
  methods: {
    // 处理用户点击事件并转发给父组件
    handleUserClick(user) {
      this.$emit('userClick', user)
    },
    
    // 获取当前平台的组件实例
    getCurrentComponent() {
      // #ifdef MP-WEIXIN
      return this.$refs.mpComponent
      // #endif
      // #ifndef MP-WEIXIN
      return this.$refs.webComponent
      // #endif
    },
    
    // 调试方法：查看触摸状态（仅小程序端）
    debugTouchState() {
      const component = this.getCurrentComponent()
      if (component && component.debugTouchState) {
        return component.debugTouchState()
      } else {
        console.warn('当前平台不支持触摸状态调试')
      }
    },
    
    // 调试方法：查看纹理资源使用情况（仅小程序端）
    debugTextureUsage() {
      const component = this.getCurrentComponent()
      if (component && component.debugTextureUsage) {
        return component.debugTextureUsage()
      } else {
        console.warn('当前平台不支持纹理资源调试')
      }
    },
    
    // 更新控制器配置
    updateControlsConfig() {
      const component = this.getCurrentComponent()
      if (component && component.updateControlsConfig) {
        return component.updateControlsConfig()
      }
    },
    
    // 更新用户精灵显示
    updateUserSprites() {
      const component = this.getCurrentComponent()
      if (component && component.updateUserSprites) {
        return component.updateUserSprites()
      }
    },
    
    // 更新相机配置
    updateCamera() {
      const component = this.getCurrentComponent()
      if (component && component.updateCamera) {
        return component.updateCamera()
      }
    },
    
    // 更新用户数据
    updateUserData() {
      const component = this.getCurrentComponent()
      if (component && component.updateUserData) {
        return component.updateUserData()
      }
    }
  },
  // 代理生命周期到子组件（如果需要）
  mounted() {}
  
}
</script>