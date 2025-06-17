# 🌍 Planet Sphere - 3D星球用户展示

一个基于uni-app和Three.js的3D星球用户展示项目，可以在球面上以炫酷的方式展示用户头像，支持多平台运行。

## ✨ 特性

- 🎯 **3D球面展示**：用户头像/头字母分布在3D球面上
- 🔄 **交互旋转**：支持拖拽旋转和自动旋转
- 📱 **跨平台支持**：App、H5、微信小程序全平台适配
- 🎨 **高度可定制**：丰富的配置选项和样式控制
- 🖱️ **用户交互**：点击用户头像触发交互事件
- 🌈 **多种显示模式**：支持头像图片、首字母、纯色背景
- ⚡ **性能优化**：针对不同平台优化渲染性能

## 📸 预览

![Planet Sphere Demo](static/logo.png)

## 🚀 快速开始

### 环境要求

- HBuilderX 3.1.0+
- uni-app 框架
- Node.js 12.0.0+
- 支持 Three.js 的运行环境

### 项目依赖

本项目基于 **Three.js** 构建，需要安装以下依赖：

#### H5 和 App 端依赖
```bash
# 安装 Three.js (当前项目版本)
npm install three@^0.177.0

# 或使用 yarn
yarn add three@^0.177.0

# 兼容版本范围：^0.160.0 以上
npm install three@^0.160.0
```

#### 微信小程序端
微信小程序端使用专门适配的 Three.js 版本，已内置在插件中：
- `uni_modules/planet-sphere/static/three.weapp.js`
- 无需额外安装，插件已包含

### 安装使用

1. **克隆项目**
```bash
git clone [项目地址]
cd planet-sphere
```

2. **安装依赖**
```bash
# 安装项目依赖（H5和App端需要）
npm install

# 如果没有 package.json，请手动安装 Three.js
npm install three@^0.177.0
```

3. **导入HBuilderX**
   - 打开HBuilderX
   - 文件 → 导入 → 从本地目录导入

4. **运行项目**
   - 选择运行平台（App、H5、微信小程序）
   - 点击运行按钮

### 基础使用

```vue
<template>
  <view>
    <planet-sphere 
      :width="700" 
      :height="700" 
      :users="userList"
      :autoRotate="true"
      :showAvatar="true"
      @userClick="handleUserClick"
    />
  </view>
</template>

<script>
export default {
  data() {
    return {
      userList: [
        { user_id: '1', name: '张三', avatar: '/static/avatar1.jpg' },
        { user_id: '2', name: '李四', avatar: '/static/avatar2.jpg' },
        { user_id: '3', name: '王五' }, // 无头像时显示首字母
      ]
    }
  },
  methods: {
    handleUserClick(user) {
      console.log('点击了用户:', user)
    }
  }
}
</script>
```

## 🎮 功能展示

### 交互控制
- **拖拽旋转**：手指/鼠标拖拽旋转星球
- **自动旋转**：可开启/关闭自动旋转
- **点击交互**：点击用户头像触发事件
- **方向控制**：支持左右旋转方向切换

### 配置选项
- **尺寸控制**：自定义星球和头像大小
- **速度调节**：拖拽速度和自动旋转速度
- **显示模式**：头像图片、首字母、纯色背景
- **颜色定制**：用户颜色、选中颜色、文字颜色
- **相机设置**：视角角度和距离控制

## 📝 组件参数

### Props 属性

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| width | Number | 750 | 组件宽度(rpx) |
| height | Number | 750 | 组件高度(rpx) |
| users | Array | [] | 用户数据数组 |
| rotateSpeed | Number | 1.0 | 拖拽旋转速度(0.1-5.0) |
| autoRotateSpeed | Number | 0.2 | 自动旋转速度(0-2.0) |
| autoRotate | Boolean | true | 是否启用自动旋转 |
| autoRotateDirection | Number | 1 | 自转方向(1向右,-1向左) |
| autoRotateMode | String | 'auto' | 自转模式('right','left','auto') |
| avatarSize | Number | 60 | 头像大小(30-100) |
| showAvatar | Boolean | false | 是否显示头像图片 |
| showUserName | Boolean | true | 是否显示用户名 |
| selectedColor | String | '#ff6b6b' | 选中颜色 |
| selectedBorderWidth | Number | 4 | 选中边框宽度(1-10) |
| cameraFov | Number | 85 | 相机视野角度(0-120) |
| textSize | Number | 24 | 首字母字体大小(12-50) |
| userNameSize | Number | 14 | 用户名字体大小(10-30) |
| userColors | Array | [...] | 用户颜色数组 |

### Events 事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| userClick | 用户点击事件 | user: 用户对象 |
| directionChange | 旋转方向改变 | direction: 方向值 |

### 用户数据格式

```javascript
{
  user_id: '1',          // 用户ID（必填）
  name: '张三',          // 用户名（必填）
  avatar: '/path/to/avatar.jpg' // 头像路径（可选）
}
```

## 🔧 开发指南

### 项目结构

```
planet-sphere/
├── pages/
│   └── index/
│       └── index.vue          # 演示页面
├── uni_modules/
│   └── planet-sphere/         # 插件目录
│       ├── components/
│       │   └── planet-sphere/
│       │       ├── planet-sphere.vue        # 主组件
│       │       ├── planet-sphere-webandApp.vue  # H5/App版本
│       │       └── planet-sphere-mp.vue     # 小程序版本
│       ├── static/
│       │   └── three.weapp.js # Three.js微信小程序版本
│       └── package.json       # 插件配置
├── static/
│   └── logo.png              # 示例图片
└── README.md                 # 项目说明
```

### 平台适配

- **H5/App端**：使用 renderjs + Three.js 实现
- **微信小程序**：使用 Canvas + Three.js 小程序版本
- **其他小程序**：暂不支持（技术限制）

### 性能优化

1. **纹理复用**：相同头像共享纹理资源
2. **渲染优化**：根据平台选择最优渲染方案
3. **事件防抖**：避免频繁操作导致卡顿
4. **内存管理**：及时清理无用资源

## 🎨 自定义样式

### 颜色配置

```javascript
// 自定义用户颜色
const userColors = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
  '#f0932b', '#eb4d4b', '#6ab04c', '#130f40'
]

// 选中效果
const selectedColor = '#ff6b6b'
const selectedBorderWidth = 4
```

### 动画效果

```javascript
// 旋转速度控制
const rotateSpeed = 1.0        // 拖拽灵敏度
const autoRotateSpeed = 0.2    // 自动旋转速度
const autoRotate = true        // 启用自动旋转
```

## 🛠️ 高级功能

### 动态添加用户

```javascript
// 添加新用户
this.userList.push({
  user_id: 'new_user_id',
  name: '新用户',
  avatar: '/path/to/new/avatar.jpg'
})
```

### 自定义交互

```javascript
// 处理用户点击
handleUserClick(user) {
  // 显示用户信息
  this.selectedUser = user
  
  // 自定义交互逻辑
  uni.showToast({
    title: `Hello ${user.name}!`,
    icon: 'none'
  })
}
```

## 📱 平台兼容性

| 平台 | 支持情况 | 备注 |
|------|----------|------|
| H5 | ✅ 完全支持 | 需要支持WebGL的浏览器 |
| App | ✅ 完全支持 | Android/iOS原生应用 |
| 微信小程序 | ✅ 完全支持 | 需要Three.js小程序版本 |
| 支付宝小程序 | ❌ 不支持 | 技术限制 |
| 百度小程序 | ❌ 不支持 | 技术限制 |
| 字节跳动小程序 | ❌ 不支持 | 技术限制 |

## 🔍 常见问题

### Q: 小程序端无法显示3D效果？
A: 请确保微信小程序基础库版本 >= 2.9.0，并且手机支持WebGL。

### Q: 头像图片无法显示？
A: 请检查图片路径是否正确，小程序端需要使用网络图片或本地图片。

### Q: 性能优化建议？
A: 
- 控制用户数量（建议<100个）
- 使用适当的头像尺寸
- 合理设置旋转速度
- 及时清理不需要的资源

### Q: 如何自定义用户颜色？
A: 通过 `userColors` 属性传入自定义颜色数组。

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详情请参见 [LICENSE](LICENSE) 文件。

## 📞 联系我们

- 项目地址：[GitHub Repository]
- 问题反馈：[GitHub Issues]
- 技术交流：[QQ群/微信群]

## 🙏 致谢

- [Three.js](https://threejs.org/) - 3D图形库
- [uni-app](https://uniapp.dcloud.io/) - 跨平台框架
- 感谢所有贡献者的支持！

---

⭐ 如果这个项目对你有帮助，请给个星星支持一下！
