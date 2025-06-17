<template>
  <view class="planet-container" :style="{ width: containerWidth + 'rpx', height: containerHeight + 'rpx' }">
    <view class="planet-view">
      <view 
        :id="domId" 
        class="planet-canvas" 
        :prop="renderJsData"
        :change:prop="renderJs.create" 
      />
    </view>
  </view>
</template>

<script>
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
      domId: 'planet-' + Date.now(),
      containerWidth: this.width,
      containerHeight: this.height,
      selectedUser: null,
      userList: [],
      // 默认用户数据
      defaultUsers: [],
    }
  },
  // 计算属性
  computed: {
    // 监听用户数据变化
    userDataList() {
      return this.users.length > 0 ? this.users : this.defaultUsers
    },
    renderJsData() {
      // 创建一个包含所有必要数据的对象，确保任何变化都能触发重新渲染
      const data = {
        domId: this.domId,
        users: this.userDataList,
        width: this.containerWidth,
        height: this.containerHeight,
        rotateSpeed: this.rotateSpeed,
        autoRotateSpeed: this.autoRotateSpeed,
        autoRotate: this.autoRotate,
        autoRotateDirection: this.autoRotateDirection,
        autoRotateMode: this.autoRotateMode,
        userColors: this.userColors,
        avatarSize: this.avatarSize,
        showAvatar: this.showAvatar,
        selectedColor: this.selectedColor,
        selectedBorderWidth: this.selectedBorderWidth,
        cameraDistance: this.cameraDistance,
        cameraFov: this.cameraFov,
        userNameColor: this.userNameColor,
        selectedUserNameColor: this.selectedUserNameColor,
        showUserName: this.showUserName,
        // 添加用户数量和用户ID列表作为变化检测
        userCount: this.userDataList.length,
        userIds: this.userDataList.map(u => u.user_id).join(','),
        // 添加配置变化检测标识
        configKey: `${this.autoRotate}-${this.autoRotateDirection}-${this.rotateSpeed}-${this.autoRotateSpeed}-${this.autoRotateMode}`,
        // 添加一个随机数确保每次都能触发更新
        updateId: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        // 添加文字大小控制
        textSize: this.textSize,
        userNameSize: this.userNameSize
      }
      return data
    }
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
    handleUserClick(user) {
      this.selectedUser = user
      // 确保事件能够正确传递给父组件
      this.$emit('userClick', user)
      
      // 在小程序端，有时需要使用 $nextTick 确保事件传递
      this.$nextTick(() => {
      })
    },
    
    // 更新控制器配置
    updateControlsConfig() {
      // 通过更新timestamp来触发renderJs重新执行
      this.$nextTick(() => {
        this.$forceUpdate()
      })
    },
    // 更新用户精灵显示
    updateUserSprites() {
      // 通过更新timestamp来触发renderJs重新执行
      this.$nextTick(() => {
        this.$forceUpdate()
      })
    },
    // 更新相机配置
    updateCamera() {
      // 通过更新timestamp来触发renderJs重新执行
      this.$nextTick(() => {
        this.$forceUpdate()
      })
    },
    // 更新用户数据
    updateUserData() {
      // 强制触发renderJsData重新计算
      this.$nextTick(() => {
        // 强制更新组件，确保renderJsData重新计算
        this.$forceUpdate()
      })
    },
    // 添加模板点击事件处理
    handleTemplateClick() {
      // 调用 renderjs 的点击处理
      // 注意：这里我们需要手动调用 renderjs 的方法
    },
  },
  // 组件销毁时清理
  beforeDestroy() {
    // 清理工作
  }
}
</script>
<!-- #ifndef MP-WEIXIN -->
<script module="renderJs" lang="renderjs">
// 使用npm安装的Three.js
import * as THREE from 'three'
// 创建简化的OrbitControls
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



export default {
  data() {
    return {
      renderWidth: 375,
      renderHeight: 375,
      selectedUserId: null // 当前选中的用户ID
    }
  },
  
  // 在 created 钩子中初始化非响应式的 Three.js 对象
  created() {
    // 将 Three.js 对象存储为非响应式属性
    this.threeObjects = {
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      group: null,
      sphere: null,
      raycaster: null,
      mouse: null
    }
  },
  
  mounted() {
    this.initPlanetSize()
  },
  
  updated(newProp, oldProp, ownerVm, vm) {
    if (newProp && oldProp) {
      this.create(newProp, oldProp, ownerVm, vm)
    }
  },
  
  methods: {
    // 初始化星球尺寸
    initPlanetSize() {
      let dom = document.getElementById('planet-' + Date.now())
      if (dom) {
        let rect = dom.getBoundingClientRect()
        this.renderWidth = rect.width || 375
        this.renderHeight = rect.height || 375
      }
    },
    
    // 点击检测
    handleClick(e) {
      if (!this.threeObjects.camera || !this.threeObjects.scene || !this.threeObjects.renderer) {
        return
      }
      const { clientX, clientY } = e.changedTouches ? e.changedTouches[0] : e
      const { left, top, width, height } = this.threeObjects.renderer.domElement.getBoundingClientRect()
      const x = ((clientX - left) / width) * 2 - 1
      const y = -((clientY - top) / height) * 2 + 1
      // 射线检测
      this.threeObjects.mouse.set(x, y)
      this.threeObjects.raycaster.setFromCamera(this.threeObjects.mouse, this.threeObjects.camera)
      
      if (!this.threeObjects.group) {
        return
      }
      const intersects = this.threeObjects.raycaster.intersectObjects(this.threeObjects.group.children)
      if (intersects.length > 0) {
        const clickedUser = intersects[0].object.userData
        // 更新选中状态
        const previousSelectedId = this.selectedUserId
        this.selectedUserId = clickedUser.user_id
        // 如果选中的用户发生变化，需要重新渲染相关的头像
        if (previousSelectedId !== this.selectedUserId) {
          this.updateUserSprites(previousSelectedId, this.selectedUserId)
        }
        try {
          this.$ownerInstance.callMethod('handleUserClick', clickedUser)
        } catch (error) {
        }
      }
    },

    // 移除用户组
    removeGroup() {
      if (this.threeObjects.group && this.threeObjects.scene) {
        this.threeObjects.scene.remove(this.threeObjects.group)
        this.threeObjects.group = null
      }
    },
    
    // 初始化场景
    async create(newProp, oldProp, ownerVm, vm) {
      if (!newProp) {
        return
      }
      let { domId, users, width, height, rotateSpeed, autoRotateSpeed, autoRotate, autoRotateDirection, autoRotateMode, userColors, avatarSize, showAvatar, selectedColor, selectedBorderWidth, cameraDistance, cameraFov, userNameColor, selectedUserNameColor, showUserName, textSize, userNameSize } = newProp
      
      // 检查是否是配置更新而不是初始化
      const isConfigUpdate = oldProp && this.threeObjects && this.threeObjects.scene
      
      // 将配置参数存储到实例中，供其他方法使用
      const newConfigOptions = {
        userColors: userColors || this.userColors,
        avatarSize: avatarSize || 60,
        showAvatar: showAvatar !== undefined ? showAvatar : true,
        selectedColor: selectedColor || '#ff6b6b',
        selectedBorderWidth: selectedBorderWidth || 4,
        cameraDistance: cameraDistance || 0,
        cameraFov: cameraFov || 0,
        userNameColor: userNameColor || '#333333',
        selectedUserNameColor: selectedUserNameColor || selectedColor || '#ff6b6b',
        showUserName: showUserName !== undefined ? showUserName : true,
        textSize: textSize || 24,
        userNameSize: userNameSize || 14
      }
      
      // 如果是配置更新，只更新相关部分
      if (isConfigUpdate) {
        await this.handleConfigUpdate(newProp, oldProp, newConfigOptions)
        return
      }
      
      this.configOptions = newConfigOptions
      
      this.$nextTick(async () => {
        try {
          // Three.js已经通过npm import导入，直接使用
          if (!THREE) {
            console.error('Three.js 导入失败')
            return
          }
          this.removeGroup()
          let scene, camera, renderer, controls
          let viewport = document.getElementById(domId)
          
          if (!viewport) {
            console.error('找不到目标DOM元素:', domId)
            return
          }
          // 场景
          scene = new THREE.Scene()
          // 设置场景背景为透明
          scene.background = null
          
          // 摄像机 - 支持通过props自定义，统一两个平台的设置
          let fov = this.configOptions.cameraFov
          if (fov === 0) {
            // 使用统一的默认值，确保球形完整显示
            fov = 85 // 使用较大的视野角度，确保在两个平台都能看到完整球形
          }
          
          camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000)
          
          let distance = this.configOptions.cameraDistance
          if (distance === 0) {
            // 使用统一的默认距离
            distance = 20 // 增加距离，确保球形完整显示
          }
          
          camera.position.set(0, 0, distance)
          camera.lookAt(new THREE.Vector3(0, 0, 0))
          
          // 渲染器 - 优先使用WebGLRenderer
          let rendererOptions = {
            antialias: true,
            alpha: true
          }
          
          try {
            // 尝试创建WebGL渲染器
            renderer = new THREE.WebGLRenderer(rendererOptions)
            renderer.shadowMap.enabled = true
            // 检查是否支持PCF软阴影
            if (THREE.PCFSoftShadowMap) {
              renderer.shadowMap.type = THREE.PCFSoftShadowMap
            }
          } catch (error) {
            console.warn('WebGL渲染器创建失败，使用简化渲染器:', error)
            // WebGL不可用，使用简化的渲染器
            renderer = this.createSimpleRenderer()
          }
          
          // 设置渲染器背景为透明
          if (renderer.setClearColor) {
            renderer.setClearColor(0x000000, 0)
          }
          renderer.setSize(width, height)
          
          // 针对不同平台设置像素比
          let pixelRatio = 1
          // #ifdef H5
          pixelRatio = Math.min(window.devicePixelRatio, 2) // H5端限制最大像素比为2
          // #endif
          // #ifdef APP-PLUS
          pixelRatio = window.devicePixelRatio || 1 // App端使用设备像素比
          // #endif
          // #ifdef MP
          pixelRatio = 1 // 小程序端固定为1
          // #endif
          
          renderer.setPixelRatio(pixelRatio)
          viewport.innerHTML = '';
          viewport.appendChild(renderer.domElement)
          
          // 轨道控制器 - 使用自定义的OrbitControls
          controls = new OrbitControls(camera, renderer.domElement, {
            rotateSpeed: rotateSpeed,
            autoRotateSpeed: autoRotateSpeed,
            autoRotate: autoRotate,
            autoRotateDirection: autoRotateDirection,
            autoRotateMode: autoRotateMode || 'auto',
            onDirectionChange: (newDirection) => {
              // 当自动模式下方向改变时，更新父组件
              try {
                if (autoRotateMode === 'auto') {
                  // 使用 $ownerInstance 调用父组件方法
                  if (vm && vm.$ownerInstance) {
                    vm.$ownerInstance.callMethod('handleDirectionChange', newDirection)
                  }
                }
              } catch (error) {
                console.warn('方向改变回调错误:', error)
              }
            }
          })
          controls.target = new THREE.Vector3(0, 0, 0)
          controls.enableZoom = false
          controls.enablePan = false
          controls.autoRotate = autoRotate
          controls.autoRotateSpeed = autoRotateSpeed
          controls.rotateSpeed = rotateSpeed
          
          // 限制相机距离，防止拖动时相机飞得太远或太近
          controls.minDistance = 15  // 最小距离增加，确保不会太近看不到全貌
          controls.maxDistance = 35  // 最大距离稍微增加
          
          // 移除垂直旋转角度限制，实现无限滑动
          controls.minPolarAngle = 0.01  // 几乎可以到达顶部
          controls.maxPolarAngle = Math.PI - 0.01  // 几乎可以到达底部
          
          // 水平旋转不限制
          controls.minAzimuthAngle = -Infinity
          controls.maxAzimuthAngle = Infinity
          
          // 启用阻尼，让拖动更平滑
          controls.enableDamping = true
          controls.dampingFactor = 0.05
          
          // 确保相机始终看向中心
          controls.target.set(0, 0, 0)
          
          // 环境光
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
          scene.add(ambientLight)
          
          // 方向光
          const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
          directionalLight.position.set(1, 1, 1)
          scene.add(directionalLight)
          
          // 射线检测器
          const raycaster = new THREE.Raycaster()
          const mouse = new THREE.Vector2()
          
          // 存储到非响应式对象中
          this.threeObjects = {
            scene,
            camera,
            renderer,
            controls,
            group: null,
            sphere: null,
            raycaster,
            mouse
          }
          // 直接为 canvas 添加点击事件监听器
          renderer.domElement.addEventListener('click', (e) => {
            this.handleClick(e)
          }, false)
          // 创建用户精灵
          await this.createUserSprites(users)
          // 开始动画循环
          this.animate()
          
        } catch (error) {
          console.error('Three.js 初始化失败:', error)
        }
      })
    },
    
    // 处理配置更新
    async handleConfigUpdate(newProp, oldProp, newConfigOptions) {
      // 更新配置选项
      this.configOptions = newConfigOptions
      
      // 检查控制器相关配置是否变化
      const controlsChanged = (
        newProp.rotateSpeed !== oldProp.rotateSpeed ||
        newProp.autoRotateSpeed !== oldProp.autoRotateSpeed ||
        newProp.autoRotate !== oldProp.autoRotate ||
        newProp.autoRotateDirection !== oldProp.autoRotateDirection ||
        newProp.autoRotateMode !== oldProp.autoRotateMode
      )
      
      // 检查相机相关配置是否变化
      const cameraChanged = (
        newProp.cameraFov !== oldProp.cameraFov ||
        newProp.cameraDistance !== oldProp.cameraDistance
      )
      
      // 检查用户显示相关配置是否变化
      const userDisplayChanged = (
        newProp.avatarSize !== oldProp.avatarSize ||
        newProp.showAvatar !== oldProp.showAvatar ||
        newProp.showUserName !== oldProp.showUserName ||
        newProp.selectedColor !== oldProp.selectedColor ||
        newProp.selectedBorderWidth !== oldProp.selectedBorderWidth ||
        newProp.userNameColor !== oldProp.userNameColor ||
        newProp.selectedUserNameColor !== oldProp.selectedUserNameColor ||
        newProp.textSize !== oldProp.textSize ||
        newProp.userNameSize !== oldProp.userNameSize
      )
      
      // 检查用户数据是否变化
      const userDataChanged = (
        newProp.userCount !== oldProp.userCount ||
        newProp.userIds !== oldProp.userIds ||
        JSON.stringify(newProp.users) !== JSON.stringify(oldProp.users)
      )
      // 更新控制器配置
      if (controlsChanged && this.threeObjects.controls) {
        this.threeObjects.controls.rotateSpeed = newProp.rotateSpeed
        this.threeObjects.controls.autoRotateSpeed = newProp.autoRotateSpeed
        this.threeObjects.controls.autoRotate = newProp.autoRotate
        this.threeObjects.controls.autoRotateDirection = newProp.autoRotateDirection
        this.threeObjects.controls.autoRotateMode = newProp.autoRotateMode || 'auto'
      }
      
      // 更新相机配置
      if (cameraChanged && this.threeObjects.camera) {
        
        // 更新视野角度
        if (newProp.cameraFov !== oldProp.cameraFov) {
          let fov = newProp.cameraFov
          if (fov === 0) {
            fov = 85 // 使用统一的默认值
          }
          this.threeObjects.camera.fov = fov
          this.threeObjects.camera.updateProjectionMatrix()
        }
        
        // 更新相机距离
        if (newProp.cameraDistance !== oldProp.cameraDistance) {
          let distance = newProp.cameraDistance
          if (distance === 0) {
            distance = 20 // 使用统一的默认距离
          }
          
          // 保持相机方向，只改变距离
          const direction = this.threeObjects.camera.position.clone().normalize()
          this.threeObjects.camera.position.copy(direction.multiplyScalar(distance))
        }
      }
      
      // 更新用户精灵显示
      if (userDisplayChanged && this.threeObjects.group) {
        await this.updateAllUserSprites(newProp.users)
      }
      
      // 处理用户数据变化
      if (userDataChanged) {
        // 移除旧的用户组
        this.removeGroup()
        // 重新创建用户精灵
        await this.createUserSprites(newProp.users)
      }
    },
    
    // 更新所有用户精灵
    async updateAllUserSprites(users) {
      if (!this.threeObjects.group || !users) return
      
      // 遍历所有用户精灵，重新生成头像
      for (let i = 0; i < this.threeObjects.group.children.length && i < users.length; i++) {
        const sprite = this.threeObjects.group.children[i]
        const user = users[i]
        
        if (sprite && user) {
          const isSelected = this.selectedUserId === user.user_id
          // 固定canvas尺寸，不再依赖头像大小（文字大小独立控制）
          const canvasWidth = 130  // 固定canvas宽度
          const canvasHeight = 150 // 固定canvas高度
          
          let avatarCanvas
          
          // 根据配置决定使用哪种头像
          if (this.configOptions.showAvatar && user.avatar) {
            try {
              const img = await this.loadImage(user.avatar)
              avatarCanvas = await this.makeAvatarCanvasWithImage(user, img, canvasWidth, canvasHeight, isSelected)
            } catch (error) {
              avatarCanvas = await this.makeDefaultAvatarCanvas(user, canvasWidth, canvasHeight, isSelected)
            }
          } else {
            avatarCanvas = await this.makeDefaultAvatarCanvas(user, canvasWidth, canvasHeight, isSelected)
          }
          
          if (avatarCanvas) {
            const texture = new THREE.CanvasTexture(avatarCanvas)
            texture.generateMipmaps = false
            texture.minFilter = THREE.LinearFilter
            texture.magFilter = THREE.LinearFilter
            
            // 更新材质贴图
            if (sprite.material.map) {
              sprite.material.map.dispose() // 释放旧纹理
            }
            sprite.material.map = texture
            sprite.material.needsUpdate = true
            
            // 固定精灵缩放，不再根据头像大小调整（文字大小独立控制）
            const scaleX = 2.0 // 固定水平缩放
            const scaleY = 2.2 // 固定垂直缩放
            sprite.scale.set(scaleX, scaleY, 1)
          }
        }
      }
      

    },
    
    // 创建用户精灵
    async createUserSprites(users) {
      if (!this.threeObjects.scene || !users || users.length === 0) {
        return
      }
      const group = new THREE.Group()
      const sphereRadius = 10 // 增大球体半径，让用户分布更合理
      
      // 先创建所有用户的默认头像，立即显示球形
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        const position = this.fibonacci_sphere(i, users.length, sphereRadius)
        
        const isSelected = this.selectedUserId === user.user_id
        // 固定canvas尺寸，不再依赖头像大小（文字大小独立控制）
        const canvasWidth = 130  // 固定canvas宽度
        const canvasHeight = 150 // 固定canvas高度
        
        // 先创建默认头像
        const avatarCanvas = await this.makeDefaultAvatarCanvas(user, canvasWidth, canvasHeight, isSelected)
        
        if (avatarCanvas) {
          const texture = new THREE.CanvasTexture(avatarCanvas)
          texture.generateMipmaps = false
          texture.minFilter = THREE.LinearFilter
          texture.magFilter = THREE.LinearFilter
          
          const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1
          })
          
          const sprite = new THREE.Sprite(material)
          sprite.position.set(position.x, position.y, position.z)
          
          // 固定精灵缩放，不再根据头像大小调整（文字大小独立控制）
          const scaleX = 2.0 // 固定水平缩放
          const scaleY = 2.2 // 固定垂直缩放
          sprite.scale.set(scaleX, scaleY, 1)
          sprite.userData = user
          
          group.add(sprite)
        }
      }
      
      this.threeObjects.group = group
      this.threeObjects.scene.add(group)
      // 异步加载真实头像（如果启用了showAvatar）
      if (this.configOptions.showAvatar) {
        this.loadAvatarsAsync(users)
      }
    },
    
    // 异步加载头像
    async loadAvatarsAsync(users) {
      if (!this.threeObjects.group) return
      
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        
        // 只有当用户有头像时才异步加载
        if (user.avatar) {
          // 使用setTimeout让每个头像加载不阻塞UI
                     setTimeout(async () => {
             try {
               // 使用用户数据中的头像路径
               const img = await this.loadImage(user.avatar)
              
              // 找到对应的sprite
              const sprite = this.threeObjects.group.children[i]
              if (sprite && sprite.userData.user_id === user.user_id) {
                const isSelected = this.selectedUserId === user.user_id
                // 固定canvas尺寸，不再依赖头像大小（文字大小独立控制）
                const canvasWidth = 130  // 固定canvas宽度
                const canvasHeight = 150 // 固定canvas高度
                
                                // 创建带图片的头像
                const avatarCanvas = await this.makeAvatarCanvasWithImage(user, img, canvasWidth, canvasHeight, isSelected)
                
                if (avatarCanvas) {
                  const texture = new THREE.CanvasTexture(avatarCanvas)
                  texture.generateMipmaps = false
                  texture.minFilter = THREE.LinearFilter
                  texture.magFilter = THREE.LinearFilter
                  
                  // 更新材质贴图
                  sprite.material.map.dispose() // 释放旧纹理
                  sprite.material.map = texture
                  sprite.material.needsUpdate = true
                }
              }
            } catch (error) {
              // 异步加载头像失败，忽略错误
            }
          }, i * 100) // 每个头像延迟100ms加载，避免同时加载太多
        }
      }
    },
    
    // 斐波那契球面分布算法
    fibonacci_sphere(i, n, radius) {
      const golden_angle = Math.PI * (3.0 - Math.sqrt(5.0))
      const theta = golden_angle * i
      const y = 1 - (i / (n - 1)) * 2
      const radiusAtY = Math.sqrt(1 - y * y)
      const x = Math.cos(theta) * radiusAtY
      const z = Math.sin(theta) * radiusAtY
      
      return {
        x: x * radius,
        y: y * radius,
        z: z * radius
      }
    },
    
    // 创建默认头像画布（颜色背景）
    async makeDefaultAvatarCanvas(user, width, height, isSelected = false) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      
      // 获取用户颜色
      const userColors = this.configOptions.userColors
      const colorIndex = Math.abs(this.hashCode(user.user_id || user.name)) % userColors.length
      const bgColor = userColors[colorIndex]
      
      // 计算头像区域，让头像在canvas中合理位置（固定布局）
      const avatarSize = this.configOptions.avatarSize
      const avatarX = width / 2 - avatarSize / 2
      const avatarY = Math.max(10, (width - avatarSize) / 2 - 10) // 在固定canvas中居中偏上
      
      // 绘制头像背景圆形
      ctx.beginPath()
      ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, 2 * Math.PI)
      ctx.fillStyle = bgColor
      ctx.fill()
      
      // 如果是选中状态，绘制颜色边框
      if (isSelected) {
        const borderWidth = this.configOptions.selectedBorderWidth
        const selectedColor = this.configOptions.selectedColor
        
        ctx.beginPath()
        ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2 + borderWidth, 0, 2 * Math.PI)
        ctx.strokeStyle = selectedColor
        ctx.lineWidth = borderWidth * 2
        ctx.stroke()
      }
      
      // 只有在showAvatar为true时才绘制用户名首字母
      if (this.configOptions.showAvatar) {
        const firstChar = (user.name || '?').charAt(0).toUpperCase()
        ctx.fillStyle = '#ffffff'
        const fontSize = this.configOptions.textSize || 24
        ctx.font = `bold ${fontSize}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(firstChar, width / 2, avatarY + avatarSize / 2)
      }
      
      // 绘制用户名（如果启用）
      if (this.configOptions.showUserName) {
        const displayName = user.name || '未知用户'
        ctx.fillStyle = isSelected ? this.configOptions.selectedUserNameColor : this.configOptions.userNameColor
        const nameSize = this.configOptions.userNameSize || 14
        ctx.font = `${nameSize}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        
        // 处理长文本
        const maxWidth = width - 20
        if (ctx.measureText(displayName).width > maxWidth) {
          const truncated = displayName.length > 8 ? displayName.substring(0, 8) + '...' : displayName
          ctx.fillText(truncated, width / 2, avatarY + avatarSize + 12)
        } else {
          ctx.fillText(displayName, width / 2, avatarY + avatarSize + 12)
        }
      }
      
      return canvas
    },
    
    // 创建带图片的头像画布
    async makeAvatarCanvasWithImage(user, img, width, height, isSelected = false) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      
      // 计算头像区域，让头像在canvas中合理位置（固定布局）
      const avatarSize = this.configOptions.avatarSize
      const avatarX = width / 2 - avatarSize / 2
      const avatarY = Math.max(10, (width - avatarSize) / 2 - 10) // 在固定canvas中居中偏上
      
      // 绘制圆形头像
      ctx.save()
      ctx.beginPath()
      ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, 2 * Math.PI)
      ctx.clip()
      
      // 计算图片绘制尺寸（保持长宽比）
      const imgAspect = img.width / img.height
      let drawWidth, drawHeight, drawX, drawY
      
      if (imgAspect > 1) {
        drawHeight = avatarSize
        drawWidth = avatarSize * imgAspect
        drawX = width / 2 - drawWidth / 2
        drawY = avatarY
      } else {
        drawWidth = avatarSize
        drawHeight = avatarSize / imgAspect
        drawX = avatarX
        drawY = avatarY + avatarSize / 2 - drawHeight / 2
      }
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
      ctx.restore()
      
      // 如果是选中状态，绘制颜色边框
      if (isSelected) {
        const borderWidth = this.configOptions.selectedBorderWidth
        const selectedColor = this.configOptions.selectedColor
        
        ctx.beginPath()
        ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2 + borderWidth, 0, 2 * Math.PI)
        ctx.strokeStyle = selectedColor
        ctx.lineWidth = borderWidth * 2
        ctx.stroke()
      }
      
      // 绘制用户名（如果启用）
      if (this.configOptions.showUserName) {
        const displayName = user.name || '未知用户'
        ctx.fillStyle = isSelected ? this.configOptions.selectedUserNameColor : this.configOptions.userNameColor
        const nameSize = this.configOptions.userNameSize || 14
        ctx.font = `${nameSize}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        
        // 处理长文本
        const maxWidth = width - 20
        if (ctx.measureText(displayName).width > maxWidth) {
          const truncated = displayName.length > 8 ? displayName.substring(0, 8) + '...' : displayName
          ctx.fillText(truncated, width / 2, avatarY + avatarSize + 12)
        } else {
          ctx.fillText(displayName, width / 2, avatarY + avatarSize + 12)
        }
      }
      
      return canvas
    },
    
    // 字符串哈希函数
    hashCode(str) {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 转换为32位整数
      }
      return hash
    },
    
    // 加载图片
    loadImage(src) {
      return new Promise((resolve, reject) => {
        if (src && src.startsWith('/static/')) {
                  // #ifdef APP-PLUS
        reject(new Error('App端不支持本地静态图片'))
        return
        // #endif
          
          // #ifdef H5
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => resolve(img)
          img.onerror = (error) => reject(error)
          img.src = src
          return
          // #endif
        }
    
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = (error) => reject(error)
        img.src = src
      })
    },
    
    // 更新用户精灵显示状态
    async updateUserSprites(previousSelectedId, currentSelectedId) {
      if (!this.threeObjects.group) return
      
      // 遍历所有用户精灵，更新需要改变状态的
      for (let i = 0; i < this.threeObjects.group.children.length; i++) {
        const sprite = this.threeObjects.group.children[i]
        const user = sprite.userData
        
        // 检查是否需要更新这个精灵
        const needsUpdate = (
          (previousSelectedId && user.user_id === previousSelectedId) || // 之前选中的需要变回颜色背景
          (currentSelectedId && user.user_id === currentSelectedId)      // 当前选中的需要显示真实头像
        )
        
        if (needsUpdate) {
          const isSelected = user.user_id === currentSelectedId
          // 固定canvas尺寸，不再依赖头像大小（文字大小独立控制）
          const canvasWidth = 130  // 固定canvas宽度
          const canvasHeight = 150 // 固定canvas高度
          let avatarCanvas
          
          if (this.configOptions.showAvatar && user.avatar) {
            // 如果启用头像显示且用户有头像，则加载用户头像
            try {
              const img = await this.loadImage(user.avatar)
              avatarCanvas = await this.makeAvatarCanvasWithImage(user, img, canvasWidth, canvasHeight, isSelected)
            } catch (error) {
              // 加载头像失败，使用默认头像
              avatarCanvas = await this.makeDefaultAvatarCanvas(user, canvasWidth, canvasHeight, isSelected)
            }
          } else {
            // 其他情况都使用颜色背景
            avatarCanvas = await this.makeDefaultAvatarCanvas(user, canvasWidth, canvasHeight, isSelected)
          }
          
          if (avatarCanvas) {
            const texture = new THREE.CanvasTexture(avatarCanvas)
            texture.generateMipmaps = false
            texture.minFilter = THREE.LinearFilter
            texture.magFilter = THREE.LinearFilter
            
            // 更新材质贴图
            sprite.material.map.dispose() // 释放旧纹理
            sprite.material.map = texture
            sprite.material.needsUpdate = true
          }
        }
      }
    },
    
    // 创建简化渲染器
    createSimpleRenderer() {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      return {
        domElement: canvas,
        setSize: function(width, height) {
          canvas.width = width
          canvas.height = height
          canvas.style.width = width + 'px'
          canvas.style.height = height + 'px'
        },
        setPixelRatio: function(ratio) {
          // 简化实现，忽略像素比
        },
        setClearColor: function(color, alpha) {
          // 简化实现
        },
        render: function(scene, camera) {
          // 清空画布
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          // 简化的2D渲染逻辑
          if (scene && scene.children) {
            ctx.fillStyle = '#f0f0f0'
            ctx.font = '16px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('3D渲染器不可用', canvas.width / 2, canvas.height / 2 - 20)
            ctx.fillText('正在使用简化模式', canvas.width / 2, canvas.height / 2 + 20)
            
            // 如果有用户组，显示用户数量
            const group = scene.children.find(child => child.children && child.children.length > 0)
            if (group) {
              ctx.fillText(`用户数量: ${group.children.length}`, canvas.width / 2, canvas.height / 2 + 60)
            }
          }
        }
      }
    },
    
    // 动画循环
    animate() {
      if (!this.threeObjects.renderer || !this.threeObjects.scene || !this.threeObjects.camera) {
        // 动画循环中缺少必要对象
        console.warn('Three.js对象未初始化完成')
        return
      }
      
      try {
        // 更新控制器
        if (this.threeObjects.controls && typeof this.threeObjects.controls.update === 'function') {
          this.threeObjects.controls.update()
        }
        
        // 检查相机位置是否异常
        const camera = this.threeObjects.camera
        const cameraPos = camera.position
        const distance = cameraPos.distanceTo(new THREE.Vector3(0, 0, 0))
        
        // 如果相机距离异常，重置相机位置
        if (distance < 5 || distance > 50 || isNaN(distance)) {
          // 相机位置异常，重置相机
          camera.position.set(0, 0, 20)
          camera.lookAt(new THREE.Vector3(0, 0, 0))
        }
        
        // 让用户标签始终面向相机
        if (this.threeObjects.group && this.threeObjects.camera) {
          this.threeObjects.group.children.forEach(sprite => {
            if (sprite && sprite.lookAt) {
              sprite.lookAt(this.threeObjects.camera.position)
            }
          })
        }
        
        // 渲染场景
        this.threeObjects.renderer.render(this.threeObjects.scene, this.threeObjects.camera)
        
      } catch (error) {
        console.error('动画循环出错:', error)
        // 动画循环出错，尝试重置相机位置
        if (this.threeObjects.camera) {
          this.threeObjects.camera.position.set(0, 0, 20)
          this.threeObjects.camera.lookAt(new THREE.Vector3(0, 0, 0))
        }
      }
      
      // 继续动画循环
      requestAnimationFrame(() => this.animate())
    }
  }
}
</script>
<!-- #endif -->

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