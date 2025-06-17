<template>
  <view class="planet-container" :style="{ width: containerWidth + 'rpx', height: containerHeight + 'rpx' }">
    <view class="planet-view">
      <canvas 
        :id="domId" 
        class="planet-canvas" 
        type="webgl"
        :style="{ width: containerWidth + 'rpx', height: containerHeight + 'rpx' }"
        @touchstart="handleWxTouchStart"
        @touchmove="handleWxTouchMove"
        @touchend="handleWxTouchEnd"
      ></canvas>
    </view>
  </view>
</template>

<script>
// ==================== 条件编译：导入模块 ====================
// #ifdef MP-WEIXIN
// 微信小程序端导入本地Three.js
import THREE from '../../static/three.weapp.js'
import { toRaw } from "vue"
// #endif

// #ifndef MP-WEIXIN
// 如果不是微信小程序环境，THREE应该是undefined
const THREE = undefined
const toRaw = (obj) => obj // 简单的toRaw实现
// #endif

// 如果 THREE 导入失败，尝试从全局对象获取
if (!THREE && typeof global !== 'undefined' && global.THREE) {
  window.THREE = global.THREE
} else if (!THREE && typeof window !== 'undefined' && window.THREE) {
  window.THREE = window.THREE
}

// 最终检查
if (!THREE) {
  console.error('THREE对象导入完全失败！请检查three.weapp.js文件是否存在且正确')
  console.error('导入路径: ../../static/three.weapp.js')
  console.error('请确认文件路径和文件内容是否正确')
  console.error('当前编译环境可能不是 MP-WEIXIN，请检查条件编译')
}
// 添加 EventDispatcher 检查和修复
if (THREE && !THREE.EventDispatcher) {
  console.warn('THREE.EventDispatcher 不存在，添加基础实现')
  // 创建一个基础的 EventDispatcher 实现
  function EventDispatcher() {}
  
  EventDispatcher.prototype = {
    addEventListener: function(type, listener) {
      if (this._listeners === undefined) this._listeners = {}
      var listeners = this._listeners
      if (listeners[type] === undefined) {
        listeners[type] = []
      }
      if (listeners[type].indexOf(listener) === -1) {
        listeners[type].push(listener)
      }
    },
    
    hasEventListener: function(type, listener) {
      if (this._listeners === undefined) return false
      var listeners = this._listeners
      return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1
    },
    
    removeEventListener: function(type, listener) {
      if (this._listeners === undefined) return
      var listeners = this._listeners
      var listenerArray = listeners[type]
      if (listenerArray !== undefined) {
        var index = listenerArray.indexOf(listener)
        if (index !== -1) {
          listenerArray.splice(index, 1)
        }
      }
    },
    
    dispatchEvent: function(event) {
      if (this._listeners === undefined) return
      var listeners = this._listeners
      var listenerArray = listeners[event.type]
      if (listenerArray !== undefined) {
        event.target = this
        var array = listenerArray.slice(0)
        for (var i = 0, l = array.length; i < l; i++) {
          array[i].call(this, event)
        }
      }
    }
  }
  // 将 EventDispatcher 添加到 THREE 对象
  THREE.EventDispatcher = EventDispatcher
}

// 创建简化的OrbitControls（从 planet-sphere_a.vue 复制）
function createSimpleOrbitControls(rotateSpeed = 2.0, autoRotateSpeed = 2.0, autoRotate = false) {
  if (!THREE) return null
  
  function OrbitControls(camera, domElement, options = {}) {
    this.object = camera
    this.domElement = domElement
    this.enabled = true
    
    // 基本属性
    this.target = new THREE.Vector3()
    this.enableZoom = false  // 默认禁用缩放
    this.enablePan = false   // 默认禁用平移
    this.enableDamping = true // 启用阻尼
    this.autoRotate = options.autoRotate !== undefined ? options.autoRotate : false
    this.autoRotateSpeed = options.autoRotateSpeed || 2.0
    this.rotateSpeed = options.rotateSpeed || 2.0
    this.dampingFactor = 0.05
    
    // 角度限制 - 移除垂直角度限制，实现无限滑动
    this.minAzimuthAngle = -Infinity
    this.maxAzimuthAngle = Infinity
    this.minPolarAngle = 0.01 // 允许几乎完全垂直旋转
    this.maxPolarAngle = Math.PI - 0.01 // 允许几乎完全垂直旋转
    
    // 距离限制
    this.minDistance = 15  // 与控制器设置保持一致
    this.maxDistance = 35  // 与控制器设置保持一致
    
    // 内部状态
    this.spherical = new THREE.Spherical()
    this.sphericalDelta = new THREE.Spherical()
    this.scale = 1
    this.panOffset = new THREE.Vector3()
    this.isDragging = false // 拖拽状态标记
    this.autoRotateDirection = options.autoRotateDirection || 1 // 自动旋转方向：1为正向，-1为反向
    this.autoRotateMode = options.autoRotateMode || 'auto' // 自动旋转模式
    this.lastDragDirection = 0 // 记录最后的拖拽方向
    this.lastDragTime = 0 // 记录最后拖拽时间
    this.onDirectionChange = options.onDirectionChange // 方向改变回调
    
    // 更新函数
    this.update = function() {
      const position = this.object.position
      const offset = new THREE.Vector3()
      
      // 计算新位置
      offset.copy(position).sub(this.target)
      this.spherical.setFromVector3(offset)
      
      // 分别处理自动旋转和手动操作
      if (this.isDragging) {
        // 拖拽时只应用手动操作的delta
        this.spherical.theta += this.sphericalDelta.theta
        this.spherical.phi += this.sphericalDelta.phi
        
        // 拖拽后重置delta，避免累积
        this.sphericalDelta.set(0, 0, 0)
      } else {
        // 非拖拽时，先应用自动旋转
        let autoRotateDelta = 0
        if (this.autoRotate) {
          // 使用自动旋转方向来决定旋转方向
          // 移除负号，让方向更直观：正值向右，负值向左
          autoRotateDelta = 2 * Math.PI / 60 / 60 * this.autoRotateSpeed * this.autoRotateDirection
        }
        
        // 应用自动旋转和惯性
        this.spherical.theta += autoRotateDelta + this.sphericalDelta.theta
        this.spherical.phi += this.sphericalDelta.phi
        
        // 应用阻尼到惯性delta
        if (this.enableDamping) {
          this.sphericalDelta.theta *= (1 - this.dampingFactor)
          this.sphericalDelta.phi *= (1 - this.dampingFactor)
          
          // 如果惯性增量很小，就停止
          if (Math.abs(this.sphericalDelta.theta) < 0.001 && Math.abs(this.sphericalDelta.phi) < 0.001) {
            this.sphericalDelta.set(0, 0, 0)
          }
        } else {
          // 如果没有启用阻尼，重置惯性增量
          this.sphericalDelta.set(0, 0, 0)
        }
      }
      
      // 保持phi在合理范围内，但允许完整的0到π范围
      // 使用更宽松的限制，确保可以看到球体的顶部和底部
      this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi))
      
      // theta不限制，允许无限水平旋转
      // this.spherical.theta 可以是任意值，Three.js会自动处理
      
      // 限制距离
      this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius))
      
      this.spherical.makeSafe()
      
      offset.setFromSpherical(this.spherical)
      position.copy(this.target).add(offset)
      
      this.object.lookAt(this.target)
      
      return true
    }
    
    // 简化的事件处理
    if (domElement) {
      const scope = this
      let isDown = false
      let rotateStart = new THREE.Vector2()
      let rotateEnd = new THREE.Vector2()
      let lastMoveTime = 0
      let moveVelocity = new THREE.Vector2()
      
      function getEventPosition(event) {
        // 处理触摸事件和鼠标事件
        if (event.touches && event.touches.length > 0) {
          return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY }
        } else if (event.changedTouches && event.changedTouches.length > 0) {
          return { clientX: event.changedTouches[0].clientX, clientY: event.changedTouches[0].clientY }
        } else {
          return { clientX: event.clientX, clientY: event.clientY }
        }
      }
      
      function onPointerDown(event) {
        if (!scope.enabled) return
        // 不阻止事件冒泡，让点击事件能够正常传递
        // event.preventDefault()
        // event.stopPropagation()
        
        isDown = true
        scope.isDragging = true
        const pos = getEventPosition(event)
        rotateStart.set(pos.clientX, pos.clientY)
        lastMoveTime = Date.now()
        scope.lastDragTime = lastMoveTime
        moveVelocity.set(0, 0)
        
        // 停止当前的旋转惯性
        scope.sphericalDelta.set(0, 0, 0)
      }
      
      function onPointerMove(event) {
        if (!scope.enabled || !isDown) return
        // 只在拖拽时阻止默认行为，但不阻止事件冒泡
        event.preventDefault()
        // event.stopPropagation()
        
        const pos = getEventPosition(event)
        rotateEnd.set(pos.clientX, pos.clientY)
        
        const rotateDelta = new THREE.Vector2()
        rotateDelta.subVectors(rotateEnd, rotateStart)
        
        const element = scope.domElement
        const elementRect = element.getBoundingClientRect()
        
        // 优化旋转灵敏度，提供更流畅的体验
        const sensitivity = scope.rotateSpeed * 0.4 // 稍微提高灵敏度
        const deltaTheta = -2 * Math.PI * rotateDelta.x / elementRect.width * sensitivity
        const deltaPhi = -2 * Math.PI * rotateDelta.y / elementRect.height * sensitivity
        
        // 直接设置sphericalDelta，而不是累积
        scope.sphericalDelta.theta = deltaTheta
        scope.sphericalDelta.phi = deltaPhi
        
        // 记录拖拽方向（基于水平移动和实际的theta变化）
        if (Math.abs(rotateDelta.x) > 1) { // 降低阈值，更敏感地检测方向
          // deltaTheta的符号直接反映了旋转方向
          scope.lastDragDirection = deltaTheta > 0 ? 1 : -1
          scope.lastDragTime = Date.now()
        }
        
        // 计算移动速度用于惯性（使用像素/毫秒）
        const currentTime = Date.now()
        const timeDelta = Math.max(1, currentTime - lastMoveTime) // 避免除零
        
        // 更新速度（使用平滑处理）
        const newVelocityX = rotateDelta.x / timeDelta
        const newVelocityY = rotateDelta.y / timeDelta
        
        // 平滑速度变化，避免突变
        moveVelocity.x = moveVelocity.x * 0.6 + newVelocityX * 0.4 // 提高响应性
        moveVelocity.y = moveVelocity.y * 0.6 + newVelocityY * 0.4
        
        lastMoveTime = currentTime
        rotateStart.copy(rotateEnd)
      }
      
      function onPointerUp(event) {
        if (!scope.enabled) return
        // 不阻止事件冒泡，让点击事件能够正常传递
        // event.preventDefault()
        // event.stopPropagation()
        
        isDown = false
        
        // 清除拖拽累积的delta，避免与自动旋转叠加
        scope.sphericalDelta.set(0, 0, 0)
        
        // 添加惯性效果（如果有足够的速度）
        if (scope.enableDamping && (Math.abs(moveVelocity.x) > 0.3 || Math.abs(moveVelocity.y) > 0.3)) {
          const element = scope.domElement
          const elementRect = element.getBoundingClientRect()
          
          // 根据最后的移动速度设置惯性旋转
          const inertiaSensitivity = scope.rotateSpeed * 0.08 // 提高惯性效果
          const inertiaTheta = -2 * Math.PI * moveVelocity.x / elementRect.width * inertiaSensitivity
          const inertiaPhi = -2 * Math.PI * moveVelocity.y / elementRect.height * inertiaSensitivity
          
          // 设置惯性delta
          scope.sphericalDelta.theta = inertiaTheta
          scope.sphericalDelta.phi = inertiaPhi
        }
        
        // 如果是自动模式且有明显的拖拽方向，自动调整旋转方向
        if (scope.autoRotateMode === 'auto' && Math.abs(scope.lastDragDirection) > 0) {
          const timeSinceLastDrag = Date.now() - scope.lastDragTime
          // 只有在最近拖拽过（3秒内）且方向明确的情况下才自动调整
          if (timeSinceLastDrag < 3000) {
            const newDirection = scope.lastDragDirection > 0 ? 1 : -1
            if (newDirection !== scope.autoRotateDirection) {
              scope.autoRotateDirection = newDirection
              // 通知外部组件方向已改变
              if (scope.onDirectionChange) {
                scope.onDirectionChange(newDirection)
              }
            }
          }
        }
        
        // 延迟重置拖拽状态，让惯性效果开始
        setTimeout(() => {
          scope.isDragging = false
        }, 50) // 缩短延迟时间，提高响应性
      }
      
      // 添加鼠标事件
      domElement.addEventListener('mousedown', onPointerDown, { passive: false })
      domElement.addEventListener('mousemove', onPointerMove, { passive: false })
      domElement.addEventListener('mouseup', onPointerUp, { passive: false })
      
      // 添加触摸事件
      domElement.addEventListener('touchstart', onPointerDown, { passive: false })
      domElement.addEventListener('touchmove', onPointerMove, { passive: false })
      domElement.addEventListener('touchend', onPointerUp, { passive: false })
      domElement.addEventListener('touchcancel', onPointerUp, { passive: false })
    }
  }
  
  return OrbitControls
}

// 初始化OrbitControls
const OrbitControls = createSimpleOrbitControls()

// ==================== 组件定义 ====================
export default {
  name: 'PlanetSphere',
  // 定义组件属性
  props: {
    width: {
      type: Number,
      default: 750
    },
    height: {
      type: Number,
      default: 750
    },
    users: {
      type: Array,
      default: () => []
    },
    // 拖动旋转速度 (0.1-5.0，默认1.0)
    rotateSpeed: {
      type: Number,
      default: 1.0,
      validator: (value) => value >= 0.1 && value <= 5.0
    },
    // 自动旋转速度 (0-2.0，默认0.2)
    autoRotateSpeed: {
      type: Number,
      default: 0.2,
      validator: (value) => value >= 0 && value <= 2.0
    },
    // 是否启用自动旋转
    autoRotate: {
      type: Boolean,
      default: true
    },
    // 自转方向 (1: 向右, -1: 向左)
    autoRotateDirection: {
      type: Number,
      default: 1,
      validator: (value) => value === 1 || value === -1
    },
    // 自转模式 ('right': 向右, 'left': 向左, 'auto': 自动跟随拖拽)
    autoRotateMode: {
      type: String,
      default: 'auto',
      validator: (value) => ['right', 'left', 'auto'].includes(value)
    },
    // 用户颜色数组
    userColors: {
      type: Array,
      default: () => [
        '#cfb5ba', '#7b969b', '#7e6c77', '#9d8a8e', '#add2d6',
        '#a7ced3', '#e2c4c2', '#60588d', '#718f98', '#f1941f',
        '#98bbc1', '#a78c95', '#7e6f78', '#ac949b', '#a48a93',
        '#6a8285', '#eccecc', '#6c8185', '#97bac0', '#6a858c',
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b',
        '#eb4d4b', '#6ab04c', '#130f40', '#546de5', '#e15f41',
        '#c44569', '#f8b500', '#778beb', '#f53b57', '#3c40c6',
        '#05c46b', '#ffc048', '#ff3838', '#2ed573', '#1e90ff',
        '#ff7675', '#74b9ff', '#a29bfe', '#fd79a8', '#fdcb6e',
        '#6c5ce7', '#e17055', '#00b894', '#00cec9', '#55a3ff',
        '#fd79a8', '#fdcb6e', '#e84393', '#a29bfe', '#6c5ce7',
        '#74b9ff', '#0984e3', '#00b894', '#00cec9', '#e17055'
      ]
    },
    // 头像大小 (30-100，默认60)
    avatarSize: {
      type: Number,
      default: 60,
      validator: (value) => value >= 30 && value <= 100
    },
    // 是否显示用户头像（true: 显示avatar图片和首字母，false: 只显示纯背景颜色）
    showAvatar: {
      type: Boolean,
      default: false
    },
    // 选中颜色
    selectedColor: {
      type: String,
      default: '#ff6b6b'
    },
    // 选中边框宽度
    selectedBorderWidth: {
      type: Number,
      default: 4,
      validator: (value) => value >= 1 && value <= 10
    },
    // 相机距离
    cameraDistance: {
      type: Number,
      default: 0, // 0表示使用默认值
      validator: (value) => value >= 0 && value <= 50
    },
    // 相机视野角度
    cameraFov: {
      type: Number,
      default: 85, // 统一使用85度视野角
      validator: (value) => value >= 0 && value <= 120
    },
    // 用户名称颜色
    userNameColor: {
      type: String,
      default: '#fff'
    },
    // 选中用户名称颜色
    selectedUserNameColor: {
      type: String,
      default: '' // 空字符串表示使用selectedColor
    },
    // 是否显示用户名称
    showUserName: {
      type: Boolean,
      default: true
    },
    // 头像中首字母的字体大小 (12-50，默认24)
    textSize: {
      type: Number,
      default: 24,
      validator: (value) => value >= 12 && value <= 50
    },
    // 用户名称的字体大小 (10-30，默认14)
    userNameSize: {
      type: Number,
      default: 14,
      validator: (value) => value >= 10 && value <= 30
    }
  },
  // 定义事件
  emits: ['userClick', 'directionChange'],
  // 响应式数据
  data() {
    return {
      // ==================== 公共数据 ====================
      domId: 'planet-' + Date.now(),
      containerWidth: this.width,
      containerHeight: this.height,
      selectedUser: null,
      userList: [],
      // 默认用户数据
      defaultUsers: [],
      // ==================== 微信小程序端专用数据 ====================
      // 小程序端的Three.js对象
      threeObjects: null,
      canvas: null,
      controls: null,
      // 重试计数
      retryCount: 0,
      // 触摸相关状态
      touchStartTime: 0,
      touchStartPos: null,
      touchMoved: false,
      isDragging: false,
      touchMoveThreshold: 5, // 移动超过5像素认为开始移动，15像素认为是拖拽
      // 更新定时器，用于防抖和避免重影
      updateTimer: null
    }
  },
  // 计算属性
  computed: {
    // ==================== 公共计算属性 ====================
    // 监听用户数据变化
    userDataList() {
      return this.users.length > 0 ? this.users : this.defaultUsers
    },
  },

  // 监听属性变化
  watch: {
    width: {
      handler(newVal) {
        this.containerWidth = newVal
      },
      immediate: true
    },
    height: {
      handler(newVal) {
        this.containerHeight = newVal
      },
      immediate: true
    },
    // 监听所有配置属性的变化，实现实时更新
    rotateSpeed: {
      handler(newVal) {
        this.updateControlsConfig()
      }
    },
    autoRotateSpeed: {
      handler(newVal) {
        this.updateControlsConfig()
      }
    },
    autoRotate: {
      handler(newVal) {
        this.updateControlsConfig()
      }
    },
    autoRotateDirection: {
      handler(newVal) {
        this.updateControlsConfig()
      }
    },
    autoRotateMode: {
      handler(newVal) {
        this.updateControlsConfig()
      }
    },
    showAvatar: {
      handler(newVal) {
        this.updateUserSprites()
      }
    },
    showUserName: {
      handler(newVal) {
        this.updateUserSprites()
      }
    },
    avatarSize: {
      handler(newVal) {
        this.updateUserSprites()
      }
    },
    selectedColor: {
      handler(newVal) {
        this.updateUserSprites()
      }
    },
    selectedBorderWidth: {
      handler(newVal) {
        this.updateUserSprites()
      }
    },
    userNameColor: {
      handler(newVal) {
        this.updateUserSprites()
      }
    },
    selectedUserNameColor: {
      handler(newVal) {
        this.updateUserSprites()
      }
    },
    cameraFov: {
      handler(newVal) {
        this.updateCamera()
      }
    },
    cameraDistance: {
      handler(newVal) {
        this.updateCamera()
      }
    },
    // 监听用户数据变化
    users: {
      handler(newVal, oldVal) {
        this.updateUserData()
      },
      deep: true
    },
    // 监听文字大小变化
    textSize: {
      handler(newVal) {
        this.updateUserSprites()
      }
    },
    userNameSize: {
      handler(newVal) {
        this.updateUserSprites()
      }
    }
  },
  // 方法
  methods: {
    // 处理用户点击事件
    handleUserClick(user) {
      this.selectedUser = user
      // 确保事件能够正确传递给父组件
      this.$emit('userClick', user)
      // 在小程序端，有时需要使用 $nextTick 确保事件传递
      this.$nextTick(() => {})
    },
    
    // 处理方向改变事件
    handleDirectionChange(newDirection) {
      // 更新内部状态
      this.autoRotateDirection = newDirection
      // 发送方向改变事件给父组件
      this.$emit('directionChange', newDirection)
    },
    
    // 更新控制器配置（所有平台通用）
    updateControlsConfig() {
      // 小程序端直接更新控制器配置
      if (this.controls) {
        this.controls.autoRotate = this.autoRotate
        this.controls.rotateSpeed = this.rotateSpeed
        
        // 处理自动旋转速度和方向
        let finalAutoRotateSpeed = this.autoRotateSpeed
        if (this.autoRotateDirection === -1) {
          finalAutoRotateSpeed = -Math.abs(this.autoRotateSpeed)
        } else {
          finalAutoRotateSpeed = Math.abs(this.autoRotateSpeed)
        }
        this.controls.autoRotateSpeed = finalAutoRotateSpeed
        
        // 更新控制器的方向属性（如果支持）
        if (this.controls.autoRotateDirection !== undefined) {
          this.controls.autoRotateDirection = this.autoRotateDirection
        }
        
        // 更新控制器的模式属性（如果支持）
        if (this.controls.autoRotateMode !== undefined) {
          this.controls.autoRotateMode = this.autoRotateMode
        }
      }
    },
    
    // 更新用户精灵显示（所有平台通用）
    updateUserSprites() {
      // 小程序端重新创建用户精灵以应用新配置
      if (this.threeObjects && this.threeObjects.scene) {
        // 添加防抖机制，避免频繁更新导致重影
        if (this.updateTimer) {
          clearTimeout(this.updateTimer)
        }
        
        this.updateTimer = setTimeout(() => {
          // 更新前检查资源使用情况
          this.debugTextureUsage()
          // 强制重新创建所有精灵，避免重影问题
          this.forceRecreateUserSprites().then(() => {
            // 更新后检查资源使用情况
            this.debugTextureUsage()
          })
        }, 0) // 无延迟，立即执行
      }
    },
    
    // 更新相机配置
    updateCamera() {
      // 小程序端直接更新相机
      if (this.threeObjects && this.threeObjects.camera) {
        const fov = this.cameraFov || 85
        const distance = this.cameraDistance || 20
        // 更新视野角度
        this.threeObjects.camera.fov = fov
        this.threeObjects.camera.updateProjectionMatrix()
        
        // 更新相机位置
        this.threeObjects.camera.position.set(0, 0, distance)
        this.threeObjects.camera.lookAt(new THREE.Vector3(0, 0, 0))
        
        // 同时更新控制器的距离限制
        if (this.controls) {
          this.controls.minDistance = Math.max(5, distance - 15)
          this.controls.maxDistance = distance + 15
        }
      }
    },
    
    // 更新用户数据（所有平台通用）
    updateUserData() {
      // 小程序端重新创建用户精灵
      if (this.threeObjects && this.threeObjects.scene) {
        this.createUserSprites()
      }
    },
    // 小程序端初始化canvas
    async initMiniProgramCanvas() {
      try {
        if (!THREE) {
          console.error('Three.js未正确导入，无法初始化3D场景')
          return
        }
        
        // 检查必要的 THREE 类是否存在
        const requiredClasses = ['Scene', 'PerspectiveCamera', 'WebGLRenderer', 'Vector3', 'Group', 'Sprite', 'SpriteMaterial']
        const missingClasses = requiredClasses.filter(className => !THREE[className])
        if (missingClasses.length > 0) {
          console.error('THREE对象缺少必要的类:', missingClasses)
          console.error('可用的THREE属性:', Object.keys(THREE))
          return
        }
        if (!THREE.global) {
          console.error('THREE.global 不存在，无法在小程序环境中使用')
          return
        }
        if (!THREE.global.registerCanvas) {
          console.error('THREE.global.registerCanvas 不存在，无法注册canvas')
          return
        }
        // 无延迟，立即继续
        await new Promise(resolve => setTimeout(resolve, 0))
        const query = uni.createSelectorQuery().in(this)
        query.select(`#${this.domId}`)
          .node()
          .exec((res) => {
            if (res && res[0] && res[0].node) {
              const canvasNode = res[0].node
              const canvasId = canvasNode._canvasId
              // 使用THREE.global.registerCanvas注册canvas
              this.canvas = THREE.global.registerCanvas(canvasId, canvasNode)
              // 无延迟，立即初始化
              setTimeout(() => {
                this.initThreeScene()
              }, 0)
            } else {
              // 重试机制，最多重试3次
              if (!this.retryCount) this.retryCount = 0
              this.retryCount++
              if (this.retryCount < 3) {
                setTimeout(() => {
                  this.initMiniProgramCanvas()
                }, 0) // 无延迟重试
              } else {
                console.error('Canvas初始化失败，已达到最大重试次数')
                // 尝试创建一个简单的fallback
                this.createFallbackCanvas()
              }
            }
          })
      } catch (error) {
        console.error('小程序canvas初始化失败:', error)
      }
    },
    
    // 创建fallback canvas（当正常初始化失败时）
    createFallbackCanvas() {
      try {
        // 显示错误提示给用户
        uni.showToast({
          title: '3D功能暂不可用',
          icon: 'none',
          duration: 2000
        })
        
      } catch (error) {
        console.error('Fallback处理失败:', error)
      }
    },
    

    
    // 小程序端初始化Three.js场景
    async initThreeScene() {
      if (!THREE) {
        console.error('Three.js库未加载')
        return
      }
      if (!THREE.Scene) {
        console.error('THREE.Scene不存在，可用的属性:', Object.keys(THREE))
        return
      }
      
      if (!this.canvas) {
        console.error('Canvas未准备好')
        console.error('canvas对象详情:', {
          canvas: this.canvas,
          type: typeof this.canvas,
          constructor: this.canvas ? this.canvas.constructor.name : 'undefined'
        })
        return
      }
      
      try {
        // 创建场景
        const scene = new THREE.Scene()
        // 创建相机
        const fov = this.cameraFov || 85
        const aspect = this.containerWidth / this.containerHeight || 1
        const camera = new THREE.PerspectiveCamera(fov, aspect, 1, 10000)  // 参考mp-planet.vue的近远平面设置
        
        const distance = this.cameraDistance || 20  // 恢复合理的相机距离
        camera.position.set(0, 0, distance)
        camera.lookAt(new THREE.Vector3(0, 0, 0))
        // 创建渲染器（完全参考mp-planet.vue的方式）
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true
        })
        
        toRaw(renderer).shadowMap.enabled = false
        
        // 直接使用canvas的尺寸，就像mp-planet.vue一样
        toRaw(renderer).setSize(toRaw(this.canvas).width, toRaw(this.canvas).height)
        toRaw(renderer).setPixelRatio(uni.getSystemInfoSync().pixelRatio || 1)
        // 添加光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        toRaw(scene).add(ambientLight)
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(1, 1, 1)
        toRaw(scene).add(directionalLight)
        // 存储Three.js对象
        this.threeObjects = {
          scene,
          camera,
          renderer,
          group: null
        }
        // 初始化控制器
        this.initControls()
        
        // 创建用户精灵
        await this.createUserSprites()
        
        // 开始动画循环
        this.startAnimation()
      } catch (error) {
        console.error('Three.js场景初始化失败:', error)
        console.error('错误详情:', error.message)
        console.error('错误堆栈:', error.stack)
      }
    },
    
    // 强制重新创建用户精灵（解决重影问题）
    async forceRecreateUserSprites() {
      if (!this.threeObjects || !this.threeObjects.scene) return
      
      const users = this.userDataList
      if (!users || users.length === 0) return
      // 完全清理旧的用户组并释放所有资源
      this.completelyCleanUserGroup()
      
      // 无延迟，立即继续
      await new Promise(resolve => setTimeout(resolve, 0))
      
      // 重新创建用户精灵
      await this.createUserSprites()
    },
    
    // 完全清理用户组（避免重影）
    completelyCleanUserGroup() {
      if (!this.threeObjects || !this.threeObjects.group) return
      try {
        // 遍历所有精灵，彻底清理资源
        const sprites = [...toRaw(this.threeObjects.group).children] // 创建副本避免引用问题
        
        sprites.forEach((sprite, index) => {
          if (sprite.material) {
            // 清理纹理
            if (sprite.material.map) {
              sprite.material.map.dispose()
              sprite.material.map = null
            }
            // 清理材质
            sprite.material.dispose()
            sprite.material = null
          }
          
          // 清理几何体（如果有）
          if (sprite.geometry) {
            sprite.geometry.dispose()
            sprite.geometry = null
          }
          
          // 清空用户数据
          sprite.userData = null
        })
        
        // 清空组的子对象
        while (toRaw(this.threeObjects.group).children.length > 0) {
          const child = toRaw(this.threeObjects.group).children[0]
          toRaw(this.threeObjects.group).remove(child)
        }
        
        // 从场景中移除组
        toRaw(this.threeObjects.scene).remove(this.threeObjects.group)
        
        // 清空组的引用
        this.threeObjects.group = null
      } catch (error) {
        console.error('清理用户精灵组时出错:', error)
      }
    },
    
    // 小程序端创建用户精灵
    async createUserSprites() {
      if (!this.threeObjects || !this.threeObjects.scene) return
      
      const users = this.userDataList
      if (!users || users.length === 0) return
      
      // 移除旧的用户组并清理资源
      if (this.threeObjects.group) {
        // 遍历所有旧精灵，清理纹理资源
        toRaw(this.threeObjects.group).children.forEach(sprite => {
          if (sprite.material) {
            // 清理纹理
            if (sprite.material.map) {
              sprite.material.map.dispose()
            }
            // 清理材质
            sprite.material.dispose()
          }
          // 清理几何体（如果有）
          if (sprite.geometry) {
            sprite.geometry.dispose()
          }
        })
        
        // 从场景中移除组
        toRaw(this.threeObjects.scene).remove(this.threeObjects.group)
        
        // 清空组的引用
        this.threeObjects.group = null
      }
      
      // 创建新的用户组
      const group = new THREE.Group()
      
      // 球体半径
      const radius = 10
      
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        
        // 计算球面位置
        const phi = Math.acos(-1 + (2 * i) / users.length)
        const theta = Math.sqrt(users.length * Math.PI) * phi
        
        const x = radius * Math.cos(theta) * Math.sin(phi)
        const y = radius * Math.sin(theta) * Math.sin(phi)
        const z = radius * Math.cos(phi)
        
        // 创建用户精灵
        const sprite = await this.createUserSprite(user, i)
        if (sprite) {
          sprite.position.set(x, y, z)
          sprite.userData = user
          toRaw(group).add(sprite)
        }
      }
      
      this.threeObjects.group = group
      toRaw(this.threeObjects.scene).add(toRaw(group))
    },
    
    // 小程序端创建单个用户精灵
    async createUserSprite(user, index) {
      try {
        // 使用当前配置的头像大小
        const avatarSize = this.avatarSize || 60
        const baseSize = Math.max(avatarSize + 40, 140) // 增加基础尺寸，确保足够空间
        // 确保canvas是正方形，避免椭圆形变形
        const canvasSize = baseSize + (this.showUserName ? 30 : 10) // 保持正方形
        // 创建离屏canvas绘制头像 - 使用正方形canvas
        const canvas = uni.createOffscreenCanvas({ 
          type: '2d', 
          width: canvasSize, 
          height: canvasSize 
        })
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          console.warn('无法获取2D上下文，使用简单精灵')
          return this.createSimpleSprite(user, index)
        }
        // 强制清空画布，避免重影问题
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // 强制重置canvas状态，确保没有缓存问题
        ctx.save()
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1.0
        
        // 用透明色填充整个canvas，确保完全清空
        ctx.fillStyle = 'rgba(0,0,0,0)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // 再次清空，确保彻底清除缓存
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // 重置所有绘图状态，避免缓存干扰
        ctx.resetTransform()
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1.0
        ctx.lineWidth = 1
        ctx.lineCap = 'butt'
        ctx.lineJoin = 'miter'
        ctx.miterLimit = 10
        
        // 获取用户颜色
        const colorIndex = index % this.userColors.length
        const bgColor = this.userColors[colorIndex]
        
        // 检查是否为选中用户
        const isSelected = this.selectedUser && this.selectedUser.user_id === user.user_id
        
        // 计算圆形头像的中心位置 - 确保在正方形canvas中居中
        const centerX = canvasSize / 2
        const centerY = canvasSize / 2 - (this.showUserName ? 15 : 5) // 如果显示用户名，圆形稍微向上偏移
        const radius = avatarSize / 2 - 2
        
        // 绘制选中边框（如果选中）
        if (isSelected) {
          const borderWidth = this.selectedBorderWidth || 4
          ctx.fillStyle = this.selectedColor || '#ff6b6b'
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius + borderWidth, 0, 2 * Math.PI)
          ctx.fill()
        }
        
        // 绘制背景圆形
        ctx.fillStyle = bgColor
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
        ctx.fill()
        
        // 只有在showAvatar为true时才绘制首字母或头像
        if (this.showAvatar) {
          // 绘制首字母
          if (user.name) {
            const firstLetter = user.name.charAt(0).toUpperCase()
            ctx.fillStyle = '#ffffff'
            ctx.font = `${this.textSize || 24}px Arial`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(firstLetter, centerX, centerY)
          }
        }
        
        // 绘制用户名（如果启用）
        if (this.showUserName && user.name) {
          const nameColor = isSelected ? 
            (this.selectedUserNameColor || this.selectedColor || '#ff6b6b') : 
            (this.userNameColor || '#fff')
          
          ctx.fillStyle = nameColor
          ctx.font = `${this.userNameSize || 14}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          
          // 处理长文本
          let displayName = user.name
          const maxWidth = canvasSize - 20
          if (ctx.measureText(displayName).width > maxWidth) {
            displayName = displayName.length > 8 ? displayName.substring(0, 8) + '...' : displayName
          }
          
          // 用户名显示在圆形下方
          const nameY = centerY + radius + 8
          ctx.fillText(displayName, centerX, nameY)
        }
        
        // 恢复canvas状态
        ctx.restore()
        // 转换为DataTexture（参考mp-planet.vue的方法）
        const texture = this.convertCanvasToDataTexture(canvas, ctx)
        
        if (!texture) {
          console.error('纹理创建失败')
          return this.createSimpleSprite(user, index)
        }
        // 为纹理添加唯一标识，避免缓存问题
        try {
          texture.uuid = this.generateUUID()
        } catch (uuidError) {
          texture.uuid = 'texture_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        }
        
        // 强制设置纹理参数，避免重影
        texture.needsUpdate = true
        texture.generateMipmaps = false
        texture.flipY = false // 避免翻转问题
        texture.premultiplyAlpha = false // 避免透明度混合问题
        
        // 添加时间戳标记，确保纹理唯一性
        texture.userData = {
          createTime: Date.now(),
          userId: user.user_id,
          avatarSize: this.avatarSize,
          textSize: this.textSize
        }
        
        // 创建精灵材质
        const material = new THREE.SpriteMaterial({ 
          map: texture,
          transparent: true
        })
        // 创建精灵
        const sprite = new THREE.Sprite(material)
        // 根据头像大小调整精灵缩放 - 修复椭圆形问题，保持X和Y轴相同缩放比例
        const scaleMultiplier = avatarSize / 60 // 基于默认60px计算缩放比例
        const finalScale = 2.0 * scaleMultiplier // 使用统一的缩放比例，确保圆形不变形
        sprite.scale.set(finalScale, finalScale, 1) // X和Y轴使用相同缩放，保持圆形
        sprite.userData = user
        return sprite
        
      } catch (error) {
        console.error('创建用户精灵失败:', error)
        return this.createSimpleSprite(user, index)
      }
    },
    
    // 转换canvas为DataTexture
    convertCanvasToDataTexture(canvas, ctx) {
      try {
        // 安全地获取canvas尺寸
        const canvasWidth = canvas.width || 130
        const canvasHeight = canvas.height || 150
        
        const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
        const pixels = []
        
        // getImageData会有上下翻转的情况，需要重新排列
        for (let i = 0; i < canvasHeight; i++) {
          pixels.unshift(...Array.prototype.slice.call(imgData.data, i * canvasWidth * 4, (i + 1) * canvasWidth * 4))
        }
        
        for (let i = 0; i < pixels.length; i++) {
          imgData.data[i] = pixels[i]
        }
        
        const pixelArray = new Uint8Array(imgData.data.buffer)
        const texture = new THREE.DataTexture(pixelArray, canvasWidth, canvasHeight)
        
        // 设置纹理参数，确保正确渲染
        texture.needsUpdate = true
        texture.generateMipmaps = false
        
        // 安全地设置纹理过滤器
        if (THREE.LinearFilter) {
          texture.minFilter = THREE.LinearFilter
          texture.magFilter = THREE.LinearFilter
        }
        
        // 安全地设置纹理包装模式
        if (THREE.ClampToEdgeWrapping) {
          texture.wrapS = THREE.ClampToEdgeWrapping
          texture.wrapT = THREE.ClampToEdgeWrapping
        }
        
        return texture
      } catch (error) {
        console.error('DataTexture创建失败:', error)
        return null
      }
    },
    
    // 创建简单精灵（备用方案）
    createSimpleSprite(user, index) {
      try {
        // 获取用户颜色
        const colorIndex = index % this.userColors.length
        const bgColor = this.userColors[colorIndex]
        // 检查是否为选中用户
        const isSelected = this.selectedUser && this.selectedUser.user_id === user.user_id
        const finalColor = isSelected ? (this.selectedColor || '#ff6b6b') : bgColor
        
        // 使用基础材质
        const material = new THREE.SpriteMaterial({ 
          color: finalColor,
          transparent: true
        })
        
        const sprite = new THREE.Sprite(material)
        
        // 根据头像大小调整精灵缩放 - 保持圆形
        const avatarSize = this.avatarSize || 60
        const scaleMultiplier = avatarSize / 60 // 基于默认60px计算缩放比例
        const finalScale = 2.0 * scaleMultiplier // 使用统一的缩放比例，确保圆形不变形
        sprite.scale.set(finalScale, finalScale, 1) // X和Y轴使用相同缩放，保持圆形
        sprite.userData = user
        return sprite
      } catch (error) {
        console.error('创建简单精灵也失败:', error)
        return null
      }
    },
    
    // 初始化控制器（使用简化版 OrbitControls）
    initControls() {
      if (!this.threeObjects || !this.threeObjects.camera || !this.threeObjects.renderer) return
      
      // 使用简化版的 OrbitControls
      const CustomOrbitControls = createSimpleOrbitControls()
      if (!CustomOrbitControls) {
        console.error('无法创建 OrbitControls')
        return
      }
      
      // 处理自动旋转速度和方向
      let finalAutoRotateSpeed = this.autoRotateSpeed
      if (this.autoRotateDirection === -1) {
        finalAutoRotateSpeed = -Math.abs(this.autoRotateSpeed)
      } else {
        finalAutoRotateSpeed = Math.abs(this.autoRotateSpeed)
      }
      
      // 创建控制器实例，传递配置选项
      this.controls = new CustomOrbitControls(
        toRaw(this.threeObjects.camera), 
        toRaw(this.threeObjects.renderer).domElement,
        {
          autoRotate: this.autoRotate,
          autoRotateSpeed: finalAutoRotateSpeed,
          rotateSpeed: this.rotateSpeed,
          autoRotateDirection: this.autoRotateDirection,
          autoRotateMode: this.autoRotateMode,
          onDirectionChange: (newDirection) => {
            // 当自动模式下方向改变时，通知父组件
            try {
              if (this.autoRotateMode === 'auto') {
                this.$emit('directionChange', newDirection)
              }
            } catch (error) {
              console.warn('方向改变回调错误:', error)
            }
          }
        }
      )
      
      // 设置基本配置
      this.controls.enableZoom = false
      this.controls.enablePan = false
      
      // 限制相机距离
      const cameraDistance = this.cameraDistance || 20
      this.controls.minDistance = Math.max(5, cameraDistance - 15)
      this.controls.maxDistance = cameraDistance + 15
    },
    
    // 小程序端动画循环（参考mp-planet.vue）
    startAnimation() {
      const animate = () => {
        if (!this.threeObjects) return
        
        const { scene, camera, renderer, group } = this.threeObjects
        
        // 更新控制器
        if (this.controls) {
          toRaw(this.controls).update()
        }
        
        // 暂时移除精灵面向相机的逻辑，测试点击检测
        // 参考mp-planet.vue，它没有让精灵面向相机
        if (group && camera) {
          toRaw(group).children.forEach(sprite => {
            // 确保精灵始终可见和可点击
            sprite.visible = true
          })
        }
        
        // 渲染
        toRaw(renderer).render(toRaw(scene), toRaw(camera))
        
        // 使用canvas的requestAnimationFrame（参考mp-planet.vue）
        toRaw(this.canvas).requestAnimationFrame(animate)
      }
      
      animate()
    },
    // 微信小程序端触摸事件处理
    handleWxTouchStart(e) {
      e.preventDefault()
      
      // 记录触摸开始状态
      this.touchStartTime = Date.now()
      this.touchStartPos = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
      this.touchMoved = false
      this.isDragging = false
      // 传递给Three.js处理
      if (THREE.global && THREE.global.touchEventHandlerFactory) {
        THREE.global.touchEventHandlerFactory('canvas', 'touchstart')(e)
      }
    },
    
    handleWxTouchMove(e) {
      e.preventDefault()
      
      // 检测是否为拖拽
      if (this.touchStartPos) {
        const currentPos = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        }
        
        const deltaX = Math.abs(currentPos.x - this.touchStartPos.x)
        const deltaY = Math.abs(currentPos.y - this.touchStartPos.y)
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        
        // 降低拖拽阈值，更容易识别为拖拽
        if (distance > 5) {
          this.touchMoved = true
          if (distance > 15) {
            this.isDragging = true
          }
        }
      }
      
      // 传递给Three.js处理
      if (THREE.global && THREE.global.touchEventHandlerFactory) {
        THREE.global.touchEventHandlerFactory('canvas', 'touchmove')(e)
      }
    },
    
    handleWxTouchEnd(e) {
      e.preventDefault()
      
      const touchDuration = Date.now() - this.touchStartTime
      
      // 修改点击检测条件：只要不是明显的拖拽就进行点击检测
      const shouldTriggerClick = !this.isDragging && touchDuration < 500
      
      if (shouldTriggerClick) {
        // 立即进行点击检测，不延迟
        this.onDocumentMouseDown(e)
      }
      
      // 重置触摸状态
      this.touchStartTime = 0
      this.touchStartPos = null
      this.touchMoved = false
      this.isDragging = false
      
      // 传递给Three.js处理
      if (THREE.global && THREE.global.touchEventHandlerFactory) {
        THREE.global.touchEventHandlerFactory('canvas', 'touchend')(e)
      }
    },
    
    // 微信小程序端点击检测
    onDocumentMouseDown(event) {
      if (!this.threeObjects || !this.threeObjects.scene || !this.threeObjects.camera || !this.threeObjects.renderer) {
        return
      }
      
      // 计算鼠标点击位置
      event.preventDefault()
      const touch = event.touches[0] || event.changedTouches[0]
      const { clientX, clientY } = touch
      
      // 获取canvas的边界信息
      let canvasRect = null
      
      try {
        // 尝试通过选择器获取canvas的实际位置和尺寸
        const query = uni.createSelectorQuery().in(this)
        query.select(`#${this.domId}`)
          .boundingClientRect()
          .exec((res) => {
            if (res && res[0]) {
              canvasRect = res[0]
              this.performRaycast(clientX, clientY, canvasRect)
            } else {
              // 如果获取失败，使用备用方法
              this.performRaycastFallback(clientX, clientY)
            }
          })
      } catch (error) {
        console.error('获取canvas位置失败，使用备用方法:', error)
        this.performRaycastFallback(clientX, clientY)
      }
    },
    
    // 执行射线投射检测（主要方法）
    performRaycast(clientX, clientY, canvasRect) {
      if (!this.threeObjects || !this.threeObjects.group) {
        return
      }
      
      // 计算标准化设备坐标
      const mouse = new THREE.Vector2()
      mouse.x = ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1
      mouse.y = -((clientY - canvasRect.top) / canvasRect.height) * 2 + 1
      // 创建射线投射器
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, toRaw(this.threeObjects.camera))
      
      // 检测与用户精灵的交集
      const intersects = raycaster.intersectObjects(toRaw(this.threeObjects.group).children, true)
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object
        const user = clickedObject.userData
        if (user) {
          this.handleUserClick(user)
        }
      }
    },
    
    // 备用的点击检测方法（距离计算）
    performRaycastFallback(clientX, clientY) {
      if (!this.threeObjects || !this.threeObjects.group || !this.threeObjects.group.children.length) {
        return
      }
      
      // 使用系统信息获取屏幕信息
      const systemInfo = uni.getSystemInfoSync()
      const screenWidth = systemInfo.windowWidth
      const screenHeight = systemInfo.windowHeight
      
      // 计算canvas在屏幕上的位置（简化估算）
      const canvasWidth = this.containerWidth * systemInfo.windowWidth / 750  // rpx转px
      const canvasHeight = this.containerHeight * systemInfo.windowHeight / 750
      let closestSprite = null
      let minDistance = Infinity
      const clickThreshold = 80 // 增加点击阈值，提高容错性
      
      // 遍历所有精灵，找到最接近点击位置的
      toRaw(this.threeObjects.group).children.forEach((sprite, index) => {
        // 将3D位置投影到2D屏幕坐标
        const vector = sprite.position.clone()
        vector.project(toRaw(this.threeObjects.camera))
        
        // 转换为屏幕坐标
        const screenX = (vector.x * 0.5 + 0.5) * canvasWidth
        const screenY = (vector.y * -0.5 + 0.5) * canvasHeight
        
        // 计算点击位置与精灵屏幕位置的距离
        const distance = Math.sqrt(
          Math.pow(clientX - screenX, 2) + 
          Math.pow(clientY - screenY, 2)
        )
        
     
        
        // 如果距离小于阈值，认为是点击了这个精灵
        if (distance < clickThreshold && distance < minDistance) {
          minDistance = distance
          closestSprite = sprite
        }
      })
      
      if (closestSprite) {
        this.handleUserClick(closestSprite.userData)
      }
    },
    
    // 微信小程序端canvas初始化方法（完整版）
    async initMiniProgramCanvas() {
      try {
        if (!THREE) {
          console.error('Three.js未正确导入，无法初始化3D场景')
          return
        }
        
        // 无延迟，立即继续
        await new Promise(resolve => setTimeout(resolve, 0))
        
        const query = uni.createSelectorQuery().in(this)
        query.select(`#${this.domId}`)
          .node()
          .exec((res) => {
            if (res && res[0] && res[0].node) {
              const canvasNode = res[0].node
              const canvasId = canvasNode._canvasId
              
              // 使用THREE.global.registerCanvas注册canvas
              if (THREE.global && THREE.global.registerCanvas) {
                this.canvas = THREE.global.registerCanvas(canvasId, canvasNode)
                // 无延迟，立即初始化
                setTimeout(() => {
                  this.initThreeScene()
                }, 0)
              } else {
                console.error('THREE.global.registerCanvas 不可用')
                return
              }
            } else {
              console.error('无法获取canvas节点，重试中...', {
                queryResult: res,
                domId: this.domId,
                containerSize: { width: this.containerWidth, height: this.containerHeight }
              })
              
              // 重试机制，最多重试3次
              if (!this.retryCount) this.retryCount = 0
              this.retryCount++
              
              if (this.retryCount < 3) {
                setTimeout(() => {
                  this.initMiniProgramCanvas()
                }, 0) // 无延迟重试
              } else {
                console.error('Canvas初始化失败，已达到最大重试次数')
              }
            }
          })
      } catch (error) {
        console.error('小程序canvas初始化失败:', error)
      }
    },
    
    // 调试方法：检查纹理资源使用情况
    debugTextureUsage() {
      if (!this.threeObjects || !this.threeObjects.group) {
        return
      }
      
      let textureCount = 0
      let materialCount = 0
      
      toRaw(this.threeObjects.group).children.forEach((sprite, index) => {
        if (sprite.material) {
          materialCount++
          if (sprite.material.map) {
            textureCount++
          }
        }
      })
    },
    
    // 自定义UUID生成函数（兼容小程序环境）
    generateUUID() {
      // 简单的UUID生成算法
      let d = new Date().getTime()
      if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now() // 使用高精度时间戳
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16)
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
      })
    }
  },
  
  // 小程序端生命周期
  mounted() {
    if (!THREE) {
      console.error('组件mounted时THREE仍然不存在，无法继续初始化')
      console.error('可能的解决方案:')
      console.error('1. 检查 ../../static/three.weapp.js 文件是否存在')
      console.error('2. 检查文件内容是否正确导出THREE对象')
      console.error('3. 检查小程序是否支持该版本的Three.js')
      return
    }
    
    // 无延迟，立即初始化
    this.$nextTick(() => {
      setTimeout(() => {
        this.initMiniProgramCanvas()
      }, 0) // 无延迟，立即初始化
    })
  },
  // 组件销毁时清理
  beforeDestroy() {
    // 清理更新定时器
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
      this.updateTimer = null
    }
    
    // 清理工作
    if (this.threeObjects) {
      // 清理用户精灵组
      if (this.threeObjects.group) {
        toRaw(this.threeObjects.group).children.forEach(sprite => {
          if (sprite.material) {
            // 清理纹理
            if (sprite.material.map) {
              sprite.material.map.dispose()
            }
            // 清理材质
            sprite.material.dispose()
          }
          // 清理几何体（如果有）
          if (sprite.geometry) {
            sprite.geometry.dispose()
          }
        })
        
        if (this.threeObjects.scene) {
          toRaw(this.threeObjects.scene).remove(this.threeObjects.group)
        }
      }
      
      // 清理控制器
      if (this.controls) {
        this.controls = null
      }
      
      // 清理渲染器
      if (this.threeObjects.renderer) {
        toRaw(this.threeObjects.renderer).dispose()
      }
      
      // 清理场景
      if (this.threeObjects.scene) {
        // 清理场景中的所有对象
        while(toRaw(this.threeObjects.scene).children.length > 0) {
          const child = toRaw(this.threeObjects.scene).children[0]
          toRaw(this.threeObjects.scene).remove(child)
          
          // 如果是光源或其他对象，也进行清理
          if (child.dispose) {
            child.dispose()
          }
        }
      }
      
      // 清空Three.js对象引用
      this.threeObjects = null
    }
  }
}
</script>


<style scoped>
.planet-container {
  position: relative;
  overflow: hidden;
  background-color: transparent;
}

.planet-view {
  width: 100%;
  height: 100%;
}

.planet-canvas {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.user-info-modal {
  backdrop-filter: blur(10rpx);
}

.user-card {
  max-width: 600rpx;
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10rpx);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 32rpx;
  padding: 20rpx 40rpx;
  text-align: center;
  box-shadow: 0 8rpx 16rpx rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f5f5f5;
  border-radius: 32rpx;
  padding: 20rpx 40rpx;
  text-align: center;
  color: #666;
  border: 2rpx solid #e0e0e0;
}
</style>