<template>
	<view class="container">
		<!-- 头部标题 -->
		<view class="header">
			<text class="title">🌍 3D星球用户展示</text>
			<text class="subtitle">Planet Sphere Demo</text>
		</view>
		
		<!-- 3D星球组件 -->
		<view class="planet-wrapper" @touchmove.stop.prevent>
			<planet-sphere 
				:width="planetConfig.width" 
				:height="planetConfig.height" 
				:users="userList"
				:rotateSpeed="planetConfig.rotateSpeed"
				:autoRotateSpeed="planetConfig.autoRotateSpeed"
				:autoRotate="planetConfig.autoRotate"
				:autoRotateDirection="planetConfig.autoRotateDirection"
				:autoRotateMode="planetConfig.autoRotateMode"
				:userColors="planetConfig.userColors"
				:avatarSize="planetConfig.avatarSize"
				:showAvatar="planetConfig.showAvatar"
				:selectedColor="planetConfig.selectedColor"
				:selectedBorderWidth="planetConfig.selectedBorderWidth"
				:cameraDistance="planetConfig.cameraDistance"
				:cameraFov="planetConfig.cameraFov"
				:userNameColor="planetConfig.userNameColor"
				:selectedUserNameColor="planetConfig.selectedUserNameColor"
				:showUserName="planetConfig.showUserName"
				:textSize="planetConfig.textSize"
				:userNameSize="planetConfig.userNameSize"
				@userClick="handleUserClick"
				@directionChange="handleDirectionChange"
			/>
		</view>
		<!-- 可滚动的内容区域 -->
		<scroll-view class="scrollable-content" scroll-y="true">
			<!-- 操作按钮区域 -->
			<view class="controls">
				<view class="btn-primary" @click="addRandomUser" @tap="addRandomUser">
					<text class="btn-text">+ 添加用户</text>
				</view>
				<view class="btn-secondary" @click="clearUsers" @tap="clearUsers">
					<text class="btn-text">清空用户</text>
				</view>
				<view class="btn-secondary" @click="resetUsers" @tap="resetUsers">
					<text class="btn-text">重置演示</text>
				</view>
			</view>
			<!-- 用户信息显示 -->
			<view class="info-panel" v-if="selectedUser">
				<text class="info-title">👤 选中用户</text>
				<view class="user-info">
					<text class="user-name">{{ selectedUser.name }}</text>
					<text class="user-id">ID: {{ selectedUser.user_id }}</text>
				</view>
			</view>
			<!-- 统计信息 -->
			<view class="stats">
				<text class="stats-text">当前用户数量: {{ userList.length }}</text>
				<text class="stats-text">支持平台: App + H5 + 微信小程序</text>
			</view>
			<!-- 配置控制区域 -->
			<view class="config-panel">
				<text class="config-title">⚙️ 配置选项</text>
				<!-- 旋转控制 -->
				<view class="config-group">
					<text class="config-label">自动旋转</text>
					<view class="config-row">
						<view class="btn-config" :class="{ active: planetConfig.autoRotate }" @click="toggleAutoRotate">
							<text class="btn-text-small">{{ planetConfig.autoRotate ? '开启' : '关闭' }}</text>
						</view>
						<view class="btn-config" @click="toggleRotateDirection">
							<text class="btn-text-small">{{ rotateDirectionText }}</text>
						</view>
					</view>
				</view>
				<!-- 显示控制 -->
				<view class="config-group">
					<text class="config-label">显示设置</text>
					<view class="config-row">
						<view class="btn-config" :class="{ active: planetConfig.showAvatar }" @click="toggleShowAvatar">
							<text class="btn-text-small">{{ planetConfig.showAvatar ? '显示头像' : '纯色背景' }}</text>
						</view>
						<view class="btn-config" :class="{ active: planetConfig.showUserName }" @click="toggleShowUserName">
							<text class="btn-text-small">{{ planetConfig.showUserName ? '显示姓名' : '隐藏姓名' }}</text>
						</view>
					</view>
				</view>
				
				<!-- 速度控制 -->
				<view class="config-group">
					<text class="config-label">速度调节</text>
					<view class="config-row">
						<view class="btn-config" @click="adjustRotateSpeed(-0.2)">
							<text class="btn-text-small">拖拽-</text>
						</view>
						<text class="config-value">{{ planetConfig.rotateSpeed.toFixed(1) }}</text>
						<view class="btn-config" @click="adjustRotateSpeed(0.2)">
							<text class="btn-text-small">拖拽+</text>
						</view>
					</view>
					<view class="config-row">
						<view class="btn-config" @click="adjustAutoRotateSpeed(-0.1)">
							<text class="btn-text-small">自转-</text>
						</view>
						<text class="config-value">{{ planetConfig.autoRotateSpeed.toFixed(1) }}</text>
						<view class="btn-config" @click="adjustAutoRotateSpeed(0.1)">
							<text class="btn-text-small">自转+</text>
						</view>
					</view>
				</view>
				
				<!-- 头像大小 -->
				<view class="config-group">
					<text class="config-label">头像大小</text>
					<view class="config-row">
						<view class="btn-config" @click="adjustAvatarSize(-10)">
							<text class="btn-text-small">缩小</text>
						</view>
						<text class="config-value">{{ planetConfig.avatarSize }}</text>
						<view class="btn-config" @click="adjustAvatarSize(10)">
							<text class="btn-text-small">放大</text>
						</view>
					</view>
				</view>
				
				<!-- 文字大小 -->
				<view class="config-group">
					<text class="config-label">文字大小</text>
					<view class="config-row">
						<view class="btn-config" @click="adjustTextSize(-2)">
							<text class="btn-text-small">首字母-</text>
						</view>
						<text class="config-value">{{ planetConfig.textSize }}</text>
						<view class="btn-config" @click="adjustTextSize(2)">
							<text class="btn-text-small">首字母+</text>
						</view>
					</view>
					<view class="config-row">
						<view class="btn-config" @click="adjustUserNameSize(-1)">
							<text class="btn-text-small">用户名-</text>
						</view>
						<text class="config-value">{{ planetConfig.userNameSize }}</text>
						<view class="btn-config" @click="adjustUserNameSize(1)">
							<text class="btn-text-small">用户名+</text>
						</view>
					</view>
				</view>
				
				<!-- 相机设置 -->
				<view class="config-group">
					<text class="config-label">相机视角</text>
					<view class="config-row">
						<view class="btn-config" @click="adjustCameraFov(-10)">
							<text class="btn-text-small">视角-</text>
						</view>
						<text class="config-value">{{ planetConfig.cameraFov }}°</text>
						<view class="btn-config" @click="adjustCameraFov(10)">
							<text class="btn-text-small">视角+</text>
						</view>
					</view>
				</view>
			</view>
			
		</scroll-view>
	</view>
</template>
<script>
	export default {
		data() {
			return {
				selectedUser: null,
				// 防抖定时器，避免频繁调整导致重影
				adjustTimer: null,
				// 星球组件配置
				planetConfig: {
					// 基础尺寸
					width: 700,
					height: 700,
					
					// 旋转控制
					rotateSpeed: 0.8,           // 拖动旋转速度 (0.1-5.0)
					autoRotateSpeed: 0.4,       // 自动旋转速度 (0-2.0)
					autoRotate: true,           // 是否启用自动旋转
					autoRotateDirection: 1,     // 自转方向 (1: 向右, -1: 向左)
					autoRotateMode: 'auto',     // 自转模式 ('right': 向右, 'left': 向左, 'auto': 自动跟随拖拽)
					
					// 头像设置
					avatarSize: 60,             // 头像大小 (30-100)
					showAvatar: true,           // 是否显示用户头像
					showUserName: true,         // 是否显示用户名称
					
					// 颜色配置
					selectedColor: '#ff6b6b',   // 选中颜色
					selectedBorderWidth: 4,     // 选中边框宽度 (1-10)
					userNameColor: '#fff',      // 用户名称颜色
					selectedUserNameColor: '',  // 选中用户名称颜色（空字符串表示使用selectedColor）
					
					// 相机设置
					cameraDistance: 0,          // 相机距离 (0表示使用默认值)
					// #ifdef MP-WEIXIN
					cameraFov: 70,              // 相机视野角度 (0-120)，统一使用85度确保球形完整显示
					// #endif
					// #ifndef MP-WEIXIN
					cameraFov: 100,              // 相机视野角度 (0-120)，统一使用85度确保球形完整显示
					// #endif
					// 文字大小设置
					textSize: 24,               // 头像中首字母的字体大小 (12-50)
					userNameSize: 25,           // 用户名的字体大小 (10-30)
					
					// 用户颜色数组
					userColors: [
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
				userList: [
					// 中文用户
					{ user_id: '1', name: '张三', avatar: '/static/logo.png' },
					{ user_id: '2', name: '李四', avatar: '/static/logo.png' },
					{ user_id: '3', name: '王五' },
					{ user_id: '4', name: '赵六', avatar: '/static/logo.png' },
					{ user_id: '5', name: '孙七' },
					{ user_id: '6', name: '周八', avatar: '/static/logo.png' },
					{ user_id: '7', name: '吴九' },
					{ user_id: '8', name: '郑十', avatar: '/static/logo.png' },
					{ user_id: '9', name: '陈一', avatar: '/static/logo.png' },
					{ user_id: '10', name: '林二' },
					{ user_id: '11', name: '黄三', avatar: '/static/logo.png' },
					{ user_id: '12', name: '刘四' },
					{ user_id: '13', name: '杨五', avatar: '/static/logo.png' },
					{ user_id: '14', name: '何六' },
					{ user_id: '15', name: '许七', avatar: '/static/logo.png' },
					{ user_id: '16', name: '邓八' },
					{ user_id: '17', name: '冯九', avatar: '/static/logo.png' },
					{ user_id: '18', name: '曾十' },
					
					// 英文用户
					{ user_id: '19', name: 'Alice', avatar: '/static/logo.png' },
					{ user_id: '20', name: 'Bob' },
					{ user_id: '21', name: 'Carol', avatar: '/static/logo.png' },
					{ user_id: '22', name: 'David' },
					{ user_id: '23', name: 'Emma', avatar: '/static/logo.png' },
					{ user_id: '24', name: 'Frank' },
					{ user_id: '25', name: 'Grace', avatar: '/static/logo.png' },
					{ user_id: '26', name: 'Henry' },
					{ user_id: '27', name: 'Ivy', avatar: '/static/logo.png' },
					{ user_id: '28', name: 'Jack' },
					{ user_id: '29', name: 'Kate', avatar: '/static/logo.png' },
					{ user_id: '30', name: 'Leo' },
					{ user_id: '31', name: 'Mia', avatar: '/static/logo.png' },
					{ user_id: '32', name: 'Noah' },
					{ user_id: '33', name: 'Olivia', avatar: '/static/logo.png' },
					{ user_id: '34', name: 'Peter' },
					{ user_id: '35', name: 'Quinn', avatar: '/static/logo.png' },
					{ user_id: '36', name: 'Ruby' },
					
					// 更多中文用户
					{ user_id: '37', name: '小明', avatar: '/static/logo.png' },
					{ user_id: '38', name: '小红' },
					{ user_id: '39', name: '小刚', avatar: '/static/logo.png' },
					{ user_id: '40', name: '小丽' },
					{ user_id: '41', name: '小华', avatar: '/static/logo.png' },
					{ user_id: '42', name: '小强' },
					{ user_id: '43', name: '小美', avatar: '/static/logo.png' },
					{ user_id: '44', name: '小军' },
					{ user_id: '45', name: '小燕', avatar: '/static/logo.png' },
					{ user_id: '46', name: '小伟' },
					{ user_id: '47', name: '小芳', avatar: '/static/logo.png' },
					{ user_id: '48', name: '小东' },
					{ user_id: '49', name: '小雪', avatar: '/static/logo.png' },
					{ user_id: '50', name: '小龙' }
				]
			}
		},
		computed: {
			// 旋转方向显示文本
			rotateDirectionText() {
				if (this.planetConfig.autoRotateMode === 'auto') {
					return '自动'
				} else if (this.planetConfig.autoRotateDirection === 1) {
					return '向右'
				} else {
					return '向左'
				}
			}
		},
		onLoad() {
			// 首页加载，初始化用户数据
		},
		
		onReady() {
			// 禁止页面滚动
			this.disablePageScroll()
		},
		
		onUnload() {
			// 清理防抖定时器
			if (this.adjustTimer) {
				clearTimeout(this.adjustTimer)
				this.adjustTimer = null
			}
			
			// 恢复页面滚动
			this.enablePageScroll()
		},
		methods: {
			// 禁用页面滚动
			disablePageScroll() {
				// #ifdef H5
				document.body.style.overflow = 'hidden'
				document.documentElement.style.overflow = 'hidden'
				// 暂时移除全局触摸事件监听，避免干扰按钮点击
				// document.addEventListener('touchmove', this.preventDefaultTouch, { passive: false })
				// #endif
			},
			
			// 启用页面滚动
			enablePageScroll() {
				// #ifdef H5
				document.body.style.overflow = ''
				document.documentElement.style.overflow = ''
				
				// 移除事件监听
				// document.removeEventListener('touchmove', this.preventDefaultTouch)
				// #endif
			},
			
			// 阻止默认触摸事件
			preventDefaultTouch(e) {
				// 只阻止页面级别的滚动，不影响组件内部的交互
				const target = e.target
				const planetWrapper = document.querySelector('.planet-wrapper')
				const scrollableContent = document.querySelector('.scrollable-content')
				
				// 如果触摸事件来自星球组件区域，完全不干预
				if (planetWrapper && planetWrapper.contains(target)) {
					return
				}
				
				// 如果触摸事件来自可滚动内容区域，也不干预
				if (scrollableContent && scrollableContent.contains(target)) {
					return
				}
				
				// 只阻止页面背景区域的滚动
				e.preventDefault()
			},
			
			// 处理用户点击事件
			handleUserClick(user) {
				// 用户点击事件处理
				this.selectedUser = user
				uni.showToast({
					title: `Hello ${user.name}!`,
					icon: 'none',
					duration: 2000
				})
			},
			
			// 添加随机用户
			addRandomUser() {
				// 添加随机用户方法被调用
				const names = ['小明', '小红', '小刚', '小丽', '小华', '小强', '小美', '小军', '小燕', '小伟']
				const randomName = names[Math.floor(Math.random() * names.length)]
				const newUserId = String(Date.now())
				const hasAvatar = Math.random() > 0.5 // 50% 概率有头像
				
				const newUser = {
					user_id: newUserId,
					name: randomName + '_' + newUserId.slice(-3)
				}
				
				if (hasAvatar) {
					newUser.avatar = '/static/logo.png'
				}
				
				this.userList.push(newUser)
				// 新用户已添加到列表
				
				uni.showToast({
					title: `添加用户: ${newUser.name}`,
					icon: 'success'
				})
			},
			
			// 清空所有用户
			clearUsers() {
				// 清空用户方法被调用
				uni.showModal({
					title: '确认操作',
					content: '确定要清空所有用户吗？',
					success: (res) => {
						if (res.confirm) {
							this.userList = []
							this.selectedUser = null
							// 用户列表已清空
							uni.showToast({
								title: '已清空用户',
								icon: 'success'
							})
						}
					}
				})
			},
			
			// 重置为演示数据
			resetUsers() {
				// 重置用户数据方法被调用
				this.userList = [
					{
						user_id: '1',
						name: '张三',
						avatar: '/static/logo.png'
					},
					{
						user_id: '2',
						name: '李四',
						avatar: '/static/logo.png'
					},
					{
						user_id: '3',
						name: '王五'
					},
					{
						user_id: '4',
						name: '赵六',
						avatar: '/static/logo.png'
					},
					{
						user_id: '5',
						name: '孙七'
					},
					{
						user_id: '6',
						name: '周八',
						avatar: '/static/logo.png'
					},
					{
						user_id: '7',
						name: '吴九'
					},
					{
						user_id: '8',
						name: '郑十',
						avatar: '/static/logo.png'
					},
					{
						user_id: '9',
						name: 'Alice',
						avatar: '/static/logo.png'
					},
					{
						user_id: '10',
						name: 'Bob'
					},
					{
						user_id: '11',
						name: 'Carol',
						avatar: '/static/logo.png'
					},
					{
						user_id: '12',
						name: 'David'
					}
				]
				this.selectedUser = null
				
				uni.showToast({
					title: '已重置演示数据',
					icon: 'success'
				})
			},
			
			// === 配置控制方法 ===
			
			// 切换自动旋转
			toggleAutoRotate() {
				// 切换自动旋转状态
				this.planetConfig.autoRotate = !this.planetConfig.autoRotate
				
				uni.showToast({
					title: `自动旋转已${this.planetConfig.autoRotate ? '开启' : '关闭'}`,
					icon: 'none',
					duration: 1500
				})
			},
			
			// 切换旋转方向
			toggleRotateDirection() {
				if (this.planetConfig.autoRotateMode === 'auto') {
					this.planetConfig.autoRotateMode = 'right'
					this.planetConfig.autoRotateDirection = 1
				} else if (this.planetConfig.autoRotateMode === 'right') {
					this.planetConfig.autoRotateMode = 'left'
					this.planetConfig.autoRotateDirection = -1
				} else {
					this.planetConfig.autoRotateMode = 'auto'
					this.planetConfig.autoRotateDirection = 1 // 默认向右，但会根据拖拽动态调整
				}
				
				// 强制更新视图
				this.$nextTick(() => {
					this.$forceUpdate()
				})
				
				uni.showToast({
					title: `旋转模式: ${this.rotateDirectionText}`,
					icon: 'none',
					duration: 1500
				})
			},
			
			// 切换显示头像
			toggleShowAvatar() {
				// 切换显示头像状态
				this.planetConfig.showAvatar = !this.planetConfig.showAvatar
				uni.showToast({
					title: `${this.planetConfig.showAvatar ? '显示头像' : '纯色背景'}`,
					icon: 'none',
					duration: 1500
				})
			},
			
			// 切换显示用户名
			toggleShowUserName() {
				this.planetConfig.showUserName = !this.planetConfig.showUserName
				uni.showToast({
					title: `用户名${this.planetConfig.showUserName ? '显示' : '隐藏'}`,
					icon: 'none',
					duration: 1500
				})
			},
			
			// 调整拖拽旋转速度
			adjustRotateSpeed(delta) {
				// 调整拖拽旋转速度
				const newSpeed = Math.max(0.1, Math.min(5.0, this.planetConfig.rotateSpeed + delta))
				if (newSpeed !== this.planetConfig.rotateSpeed) {
					// 旋转速度已调整
					this.planetConfig.rotateSpeed = newSpeed
					uni.showToast({
						title: `拖拽速度: ${newSpeed.toFixed(1)}`,
						icon: 'none',
						duration: 1000
					})
				}
			},
			
			// 调整自动旋转速度
			adjustAutoRotateSpeed(delta) {
				const newSpeed = Math.max(0, Math.min(2.0, this.planetConfig.autoRotateSpeed + delta))
				if (newSpeed !== this.planetConfig.autoRotateSpeed) {
					this.planetConfig.autoRotateSpeed = newSpeed
					uni.showToast({
						title: `自转速度: ${newSpeed.toFixed(1)}`,
						icon: 'none',
						duration: 1000
					})
				}
			},
			
			// 调整头像大小（添加防抖）
			adjustAvatarSize(delta) {
				const newSize = Math.max(30, Math.min(100, this.planetConfig.avatarSize + delta))
				if (newSize !== this.planetConfig.avatarSize) {
					this.planetConfig.avatarSize = newSize
					
					// 添加防抖机制，避免频繁调整导致重影
					if (this.adjustTimer) {
						clearTimeout(this.adjustTimer)
					}
					
					this.adjustTimer = setTimeout(() => {
						uni.showToast({
							title: `头像大小: ${newSize}`,
							icon: 'none',
							duration: 1000
						})
					}, 300) // 300ms防抖延迟
				}
			},
			
			// 调整文字大小（添加防抖）
			adjustTextSize(delta) {
				const newSize = Math.max(12, Math.min(50, this.planetConfig.textSize + delta))
				if (newSize !== this.planetConfig.textSize) {
					this.planetConfig.textSize = newSize
					
					// 添加防抖机制，避免频繁调整导致重影
					if (this.adjustTimer) {
						clearTimeout(this.adjustTimer)
					}
					
					this.adjustTimer = setTimeout(() => {
						uni.showToast({
							title: `文字大小: ${newSize}`,
							icon: 'none',
							duration: 1000
						})
					}, 300) // 300ms防抖延迟
				}
			},
			
			// 调整用户名大小（添加防抖）
			adjustUserNameSize(delta) {
				const newSize = Math.max(10, Math.min(30, this.planetConfig.userNameSize + delta))
				if (newSize !== this.planetConfig.userNameSize) {
					this.planetConfig.userNameSize = newSize
					
					// 添加防抖机制，避免频繁调整导致重影
					if (this.adjustTimer) {
						clearTimeout(this.adjustTimer)
					}
					
					this.adjustTimer = setTimeout(() => {
						uni.showToast({
							title: `用户名大小: ${newSize}`,
							icon: 'none',
							duration: 1000
						})
					}, 300) // 300ms防抖延迟
				}
			},
			
			// 处理旋转方向自动改变事件
			handleDirectionChange(newDirection) {
				if (this.planetConfig.autoRotateMode === 'auto') {
					this.planetConfig.autoRotateDirection = newDirection
					
					uni.showToast({
						title: `自动切换为: ${newDirection === 1 ? '向右' : '向左'}旋转`,
						icon: 'none',
						duration: 2000
					})
				}
			},
			
			// 调整相机视野角度
			adjustCameraFov(delta) {
				const newFov = Math.max(60, Math.min(120, this.planetConfig.cameraFov + delta))
				if (newFov !== this.planetConfig.cameraFov) {
					this.planetConfig.cameraFov = newFov
					uni.showToast({
						title: `视野角度: ${newFov}°`,
						icon: 'none',
						duration: 1000
					})
				}
			}
		}
	}
</script>

<style scoped>
	.container {
		height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 40rpx 30rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow: hidden;
		-webkit-overflow-scrolling: touch;
	}
	
	.scrollable-content {
		flex: 1;
		width: 100%;
		max-height: 500rpx;
		touch-action: auto;
	}
	
	.header {
		text-align: center;
		margin-bottom: 40rpx;
	}
	
	.title {
		font-size: 48rpx;
		font-weight: bold;
		color: #ffffff;
		margin-bottom: 10rpx;
		text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.3);
	}
	
	.subtitle {
		font-size: 24rpx;
		color: #e0e6ff;
		opacity: 0.8;
	}
	
	.planet-wrapper {
		margin: 40rpx 0;
		border-radius: 20rpx;
		overflow: hidden;
		box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.3);
		background: rgba(255,255,255,0.1);
		backdrop-filter: blur(10rpx);
		border: 1rpx solid rgba(255,255,255,0.2);
		touch-action: none;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
	}
	
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
		justify-content: center;
		margin: 30rpx 0;
	}
	
	.btn-primary {
		background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
		border: none;
		border-radius: 50rpx;
		padding: 0;
		min-width: 180rpx;
		height: 80rpx;
		box-shadow: 0 8rpx 20rpx rgba(255, 107, 107, 0.4);
		transform: translateY(0);
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.btn-primary:active {
		transform: translateY(4rpx);
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.4);
	}
	
	.btn-secondary {
		background: rgba(255,255,255,0.2);
		border: 1rpx solid rgba(255,255,255,0.3);
		border-radius: 50rpx;
		padding: 0;
		min-width: 160rpx;
		height: 80rpx;
		backdrop-filter: blur(10rpx);
		transform: translateY(0);
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.btn-secondary:active {
		transform: translateY(2rpx);
		background: rgba(255,255,255,0.3);
	}
	
	.btn-text {
		color: #ffffff;
		font-size: 28rpx;
		font-weight: 500;
	}
	
	.info-panel {
		background: rgba(255,255,255,0.15);
		backdrop-filter: blur(15rpx);
		border-radius: 20rpx;
		padding: 30rpx;
		margin: 20rpx 0;
		border: 1rpx solid rgba(255,255,255,0.2);
		box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.1);
		min-width: 300rpx;
	}
	
	.info-title {
		font-size: 28rpx;
		color: #ffffff;
		font-weight: 600;
		margin-bottom: 15rpx;
		text-align: center;
	}
	
	.user-info {
		text-align: center;
	}
	
	.user-name {
		font-size: 32rpx;
		color: #ffffff;
		font-weight: bold;
		margin-bottom: 8rpx;
	}
	
	.user-id {
		font-size: 24rpx;
		color: #e0e6ff;
		opacity: 0.8;
	}
	
	.stats {
		margin-top: 30rpx;
		text-align: center;
		opacity: 0.7;
	}
	
	.stats-text {
		font-size: 24rpx;
		color: #ffffff;
		margin: 0 20rpx;
	}
	
	/* 配置面板样式 */
	.config-panel {
		background: rgba(255,255,255,0.1);
		backdrop-filter: blur(15rpx);
		border-radius: 20rpx;
		padding: 30rpx;
		margin: 20rpx 0;
		border: 1rpx solid rgba(255,255,255,0.2);
		box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.1);
	}
	
	.config-title {
		font-size: 28rpx;
		color: #ffffff;
		font-weight: 600;
		margin-bottom: 20rpx;
		text-align: center;
	}
	
	.config-group {
		margin-bottom: 25rpx;
	}
	
	.config-label {
		font-size: 24rpx;
		color: #e0e6ff;
		margin-bottom: 10rpx;
		display: block;
	}
	
	.config-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 15rpx;
		margin-bottom: 10rpx;
	}
	
	.btn-config {
		background: rgba(255,255,255,0.15);
		border: 1rpx solid rgba(255,255,255,0.3);
		border-radius: 30rpx;
		padding: 0;
		min-width: 100rpx;
		height: 60rpx;
		backdrop-filter: blur(10rpx);
		transform: translateY(0);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.btn-config.active {
		background: rgba(255, 107, 107, 0.3);
		border-color: rgba(255, 107, 107, 0.5);
	}
	
	.btn-config:active {
		transform: translateY(2rpx);
		background: rgba(255,255,255,0.25);
	}
	
	.btn-text-small {
		color: #ffffff;
		font-size: 22rpx;
		font-weight: 400;
	}
	
	.config-value {
		font-size: 24rpx;
		color: #ffffff;
		font-weight: 600;
		min-width: 80rpx;
		text-align: center;
		background: rgba(255,255,255,0.1);
		border-radius: 20rpx;
		padding: 8rpx 16rpx;
	}
	
	/* 响应式设计 */
	@media screen and (max-width: 750rpx) {
		.container {
			padding: 30rpx 20rpx;
		}
		
		.title {
			font-size: 40rpx;
		}
		
		.controls {
			flex-direction: column;
			align-items: center;
		}
		
		.btn-primary,
		.btn-secondary {
			min-width: 240rpx;
		}
	}
</style>
