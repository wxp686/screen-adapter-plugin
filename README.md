## 屏幕适配插件
> 适用框架：Vue2/Vue3
> 适用设备：pc端/移动端
> 适配策略：动态rem+动态scale
> 方案效果：可让页面在不同屏幕下、放大缩小时保持页面不变形


**效果示例**
                       
   >**当屏幕变化时：**        
![请添加图片描述](https://i-blog.csdnimg.cn/direct/f24f43eed92747448fb96506b075de5b.gif#pic_center)

> **当放大缩小时：**
![请添加图片描述](https://i-blog.csdnimg.cn/direct/592d28967dc342bc9ae6d32f564ffcad.gif)

**安装方法**
```
npm i screen-adapter
```

**适配写法(推荐)：**
- 写class样式时，使用px单位，class内的px单位编译后会转成rem；内联样式需要用px函数`px(12)`转为rem，px函数已经挂载在Vue的this上。
- 若想让class样式不被转为rem，可使用`.norem-`开头的class名称，其大括号范围内所有样式不会被转为rem，或使用大写的`PX`单位(**需要按文档配置postcss.plugin**)
- rem只随视口的宽度动态调节，若想让元素高度随视口高度变化，可使用`vh、%`或其他单位
- 内部无法转为rem的插件，例如echarts、relation-graph等，可在元素上绑定`v-scale`。

  **`v-scale`适合内部没有rem单位的元素**，通过transform的scale属性让该元素宽高随视口的宽度自适应。
  
  它还可以传入一个监听函数，第一个参数为绑定该指令的元素dom，第二个参数为该元素被放大的倍数，其在视口变化时会自动执行
  ```
  // 使用方法一，例如echarts元素
  <div ref="echartsRef" style="width: 500px;height: 400px;" v-scale></div>
  
  // 使用方法二，传入监听函数
  <div ref="echartsRef" style="width: 500px;height: 400px;" v-scale=="handlerAdaptScale"></div>
  
  methods: {
    handlerAdaptScale(el, scale) {
      // do sth...
    },
  }
  ```



**typescript注解：**
```
// px函数注解，可转换为rem，或在第二个入参传入true，获得动态number类型的px
type PX = (px: number, real: boolean) => string | number

// Vue.use时传入的options
interface InstallOptions {
	rootValue: number
}

// 插件提供的方法
interface ScreenAdapter {
	rootFontSize: number // 根元素上动态的font-size

	init(): void         // Vue.use时会自动调用，初始化适配策略

	destroy(): void      // 销毁适配策略

	getScale(): number      // 获得v-scale被放大缩小的倍数

	addListener(callback: Function): void    // 添加屏幕变化时的监听函数

	removeListener(callback: Function): void // 移除屏幕变化时的监听函数

	px: PX
}


```

**项目配置**

```
// index.html (防止h5端用户手动放大缩小)
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=no;" />


// package.json 安装postcss-plugin-px2rem
"devDependencies": {
  "postcss-plugin-px2rem": "^0.8.1",    
}

// 配置px2rem
 // postcss.config.js 写法
 module.exports = {
    plugins: {
    'postcss-plugin-px2rem': {
      rootValue: 192, // 设计稿宽度 / 10
      propList: ["*"],
      unitPrecision: 5,
      selectorBlackList: [/.norem-.*/], // 开头为.norem-的class的大括号范围内所有样式不会被转为rem
      ignoreIdentifier: false,
      replace: true,
      mediaQuery: false,
    },
  },
 }
 // 或者vite.config.js 写法
 export default defineConfig({
    css: {
      postcss: {
       plugins: [
        px2rem({
          rootValue: 192, // 设计稿宽度 / 10
          propList: ["*"],
          unitPrecision: 5,
          selectorBlackList: [/.norem-.*/], // 开头为.norem-的class的大括号范围内所有样式不会被转为rem
          ignoreIdentifier: false,
          replace: true,
          mediaQuery: false,
        }),
      ]
    }
  },
 })
  
  
// main.js
import screenAdapter from 'screen-adapter'

Vue.use(screenAdapter, {rootValue: 192}) // 挂载screenAdapter类,传入跟px2rem插件一致的rootValue


// 调用方式
window.screenAdapter
this.screenAdapter
this.px(_,?_)

// 自定义指令使用方式
v-scale
v-scale="handlerAdaptScale"
```


**常见问题**
1. 放大缩小过程中，有个别元素变形？
    - 写内联样式时，未使用px函数包裹，另外有些组件例如el-table-column的宽度只支持传入px单位的数值，不支持传入rem，可使用px函数`px(12, true)`，将第二个参数设置为true，此时会根据屏幕大小传入动态的px数值
    - 设置父元素`line-height：0`或者`font-size:0`
    - 内部无法转化为rem的组件，例如Echarts，可使用`v-scale`指令
2. 文字边缘模糊？
    - 可以增加css `text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; font-smooth: always;`或者`font-weight: bold;`但效果有限
3. Echarts图表样式边缘模糊？
    - 使用[svg渲染器](https://echarts.apache.org/handbook/zh/best-practices/canvas-vs-svg/) `echarts.init(this.$refs.chart, null, { renderer: "svg" })`
4. 使用`v-scale`时会有留白或溢出？
    - `v-scale`根据视口的**宽度**缩放元素。如果父元素使用的`vh、%`这种视口单位，当视口的宽高比小于元素的宽高比，父级元素就会有留白；当父级元素大于元素的宽高比，元素就会有溢出。
        1. 这些情况可把v-scale提升到上面父级
        2. 内部样式使用不会被转为rem的写法

      适配完让整个页面的底部留白或溢出产生滚动条，这是正常的。
      
      **如果确实不想存在留白或滚动，想要高度也自适应的页面，可以为元素绑定key值，视口变化时让其重新渲染：**
      ```javascript
      <template>
          <div v-scale :key="scaleKey"></div>
      </template>
      
      import { debounce } from "lodash";
      export default {
          data() {
            return {
               scaleKey: 1,
            }
          },
          created() {
            // 视口变化时让元素重新绑定v-scale
            this.screenAdapter.addListener(this.debounceRefreshHeightScale);
          },
          beforeDestroy() {
            this.screenAdapter.removeListener(this.debounceRefreshHeightScale);
          },
          methods: {
            debounceRefreshHeightScale: debounce(function () {
              this.scaleKey++;
            }, 500),
          }
      }
      ```
      **此方法比较耗费性能，请谨慎使用！**
5. 使用v-scale的元素宽高显示有问题？
    - 如果使用v-scale的元素的宽高使用的百分比，图表就有可能在屏幕变化时因为渲染时机问题获得错误的宽高，此时可以使用真px值`<Echarts width="400px" height="300px"/>`让其**固定宽高**，或用`v-if`绑定接口的数据来源`<Echarts v-if="data.length > 0"/>`让其**滞后渲染**

6. VScode强制将大写PX转为小写px
    - 在VScode中使用`Vue-official`插件，并将其选为默认格式化配置，就不会格式化PX了

7. 为什么设计时不让元素随视口高度缩放？
    - 现在所有视图设计的基本特点就是内容过多时产生垂直滚动条，并且用户天生有向下滚动的直觉，另外浏览器也并未提供可以一直准确有效的拿到视口高度的方法，如果想随视口高度适应，可自行使用`vh、%`或其他写法满足需要。
