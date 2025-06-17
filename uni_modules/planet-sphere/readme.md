# Planet Sphere - 3D星球用户展示组件

> 一个基于Three.js的3D星球展示组件，可以在球面上展示用户头像，支持点击交互和动画效果，适用于社交应用的用户展示场景。

## 📦 插件信息

- **插件名称**：planet-sphere
- **插件版本**：1.0.0
- **插件类型**：Vue组件
- **适用框架**：uni-app
- **兼容平台**：H5、App、微信小程序

## ✨ 功能特性

- 🌍 **3D球面展示**：将用户分布在3D球面上，视觉效果震撼
- 🔄 **多种交互**：支持拖拽旋转、自动旋转、点击选择
- 🎨 **高度定制**：支持头像、首字母、纯色背景多种显示模式
- 📱 **跨平台兼容**：H5/App使用renderjs，小程序使用canvas
- ⚡ **性能优化**：纹理复用、内存管理、渲染优化
- 🎯 **事件丰富**：用户点击、方向变化等交互事件

## 🚀 快速上手

### 1. 安装插件

通过uni-app插件市场导入，或直接将 `uni_modules/planet-sphere` 目录复制到项目中。

### 2. 基础使用

```vue
<template>
  <view>
    <planet-sphere 
      :width="700" 
      :height="700" 
      :users="userList"
      @userClick="onUserClick"
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
        { user_id: '3', name: '王五' }
      ]
    }
  },
  methods: {
    onUserClick(user) {
      console.log('点击用户:', user)
    }
  }
}
</script>
```

### 3. 高级配置

```vue
<template>
  <planet-sphere 
    :width="700" 
    :height="700" 
    :users="userList"
    :autoRotate="true"
    :autoRotateSpeed="0.5"
    :rotateSpeed="1.2"
    :showAvatar="true"
    :showUserName="true"
    :avatarSize="60"
    :selectedColor="'#ff6b6b'"
    :userColors="customColors"
    @userClick="onUserClick"
    @directionChange="onDirectionChange"
  />
</template>

<script>
export default {
  data() {
    return {
      customColors: [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'
      ],
      userList: [...]
    }
  }
}
</script>
```

## 📋 API 文档

### Props 属性

#### 基础配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| width | Number | 750 | 组件宽度，单位rpx |
| height | Number | 750 | 组件高度，单位rpx |
| users | Array | [] | 用户数据数组 |

#### 旋转控制

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| rotateSpeed | Number | 1.0 | 拖拽旋转速度，范围0.1-5.0 |
| autoRotateSpeed | Number | 0.2 | 自动旋转速度，范围0-2.0 |
| autoRotate | Boolean | true | 是否启用自动旋转 |
| autoRotateDirection | Number | 1 | 自转方向，1为向右，-1为向左 |
| autoRotateMode | String | 'auto' | 自转模式：'right','left','auto' |

#### 显示控制

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| showAvatar | Boolean | false | 是否显示用户头像图片 |
| showUserName | Boolean | true | 是否显示用户名称 |
| avatarSize | Number | 60 | 头像大小，范围30-100 |
| textSize | Number | 24 | 首字母字体大小，范围12-50 |
| userNameSize | Number | 14 | 用户名字体大小，范围10-30 |

#### 颜色样式

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| userColors | Array | [...] | 用户颜色数组 |
| selectedColor | String | '#ff6b6b' | 选中用户的高亮颜色 |
| selectedBorderWidth | Number | 4 | 选中边框宽度，范围1-10 |
| userNameColor | String | '#fff' | 用户名称颜色 |
| selectedUserNameColor | String | '' | 选中用户名称颜色，空字符串使用selectedColor |

#### 相机设置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| cameraFov | Number | 85 | 相机视野角度，范围0-120 |
| cameraDistance | Number | 0 | 相机距离，0为默认值 |

### Events 事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| userClick | 用户点击事件 | user: 被点击的用户对象 |
| directionChange | 旋转方向改变事件 | direction: 新的旋转方向 |

### 用户数据格式

```typescript
interface User {
  user_id: string    // 用户唯一标识（必填）
  name: string       // 用户名称（必填）
  avatar?: string    // 用户头像路径（可选）
}
```

## 🎯 使用场景

### 社交应用
- 好友列表展示
- 群成员展示
- 关注用户展示

### 企业应用
- 团队成员展示
- 组织架构展示
- 客户列表展示

### 教育应用
- 班级学生展示
- 讲师团队展示
- 学习小组展示

## 💡 最佳实践

### 1. 性能优化

```javascript
// 控制用户数量，建议不超过100个
const userList = users.slice(0, 100)

// 使用合适的头像尺寸
const avatarSize = 60 // 推荐大小

// 合理设置旋转速度
const rotateSpeed = 1.0
const autoRotateSpeed = 0.3
```

### 2. 用户体验

```javascript
// 提供加载提示
const showLoading = ref(true)

// 错误处理
const handleUserClick = (user) => {
  if (!user) {
    uni.showToast({ title: '用户信息异常', icon: 'none' })
    return
  }
  // 处理点击逻辑
}
```

### 3. 样式定制

```javascript
// 定制化颜色方案
const brandColors = [
  '#667eea', '#764ba2', '#f093fb', '#f5576c',
  '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
]

// 主题色配置
const selectedColor = '#667eea'
const userNameColor = '#ffffff'
```

## 🔧 平台差异

### H5/App端
- 使用 `renderjs` + `Three.js`
- 支持完整的WebGL功能
- 性能较好，支持复杂交互

### 微信小程序端
- 使用 `canvas` + `Three.js小程序版`
- 功能完整，但性能稍弱
- 需要微信基础库 >= 2.9.0

### 其他小程序
- 暂不支持（技术限制）
- 可考虑使用替代方案

## ⚠️ 注意事项

1. **图片资源**
   - 小程序端建议使用网络图片
   - 本地图片需要正确配置路径
   - 注意图片大小，避免影响性能

2. **用户数量**
   - 建议控制在100个以内
   - 数量过多可能影响性能
   - 可考虑分页或虚拟滚动

3. **内存管理**
   - 组件销毁时会自动清理资源
   - 避免频繁创建销毁组件
   - 监控内存使用情况

## 🐛 常见问题

### Q: 组件无法显示？
A: 检查以下几点：
- 确认平台支持（H5/App/微信小程序）
- 检查用户数据格式是否正确
- 查看控制台是否有错误信息

### Q: 小程序端性能问题？
A: 优化建议：
- 减少用户数量
- 降低头像尺寸
- 减少自动旋转速度
- 避免频繁更新数据

### Q: 头像无法显示？
A: 检查事项：
- 图片路径是否正确
- 小程序端是否使用了本地图片
- 网络图片是否可访问
- 图片格式是否支持

### Q: 触摸事件冲突？
A: 解决方案：
- 在组件外层添加 `@touchmove.stop.prevent`
- 检查是否有其他滚动组件干扰
- 调整组件层级关系

## 📝 更新日志

详见 [changelog.md](./changelog.md)

## 📄 许可证

MIT License

## 🤝 技术支持

如有问题请提交 Issue 或联系开发者。
