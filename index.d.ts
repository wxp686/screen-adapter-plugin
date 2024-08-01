// px函数注解，可转换为rem，或在第二个入参传入true，获得动态number类型的px
type PX = (px: number, real: boolean) => string | undefined;

// Vue.use时传入的options
interface InstallOptions {
  rootValue: number;
}

export interface ScreenAdapterInstance {
  rootFontSize: number; // 根元素上动态的font-size

  init(): void; // Vue.use时会自动调用，初始化适配策略

  destroy(): void; // 销毁适配策略

  getScale(): number; // 获得v-scale被放大缩小的倍数

  addListener(callback: Function): void; // 添加屏幕变化时的监听函数

  removeListener(callback: Function): void; // 移除屏幕变化时的监听函数

  px: PX;
}

export interface PluginOptions {
  rootValue: number;
}

declare interface ScreenAdapter {
  constructor(Vue: any, PluginOptions?: PluginOptions): ScreenAdapterInstance;
}

declare global {
  interface Window {
    screenAdapter: ScreenAdapterInstance;
  }
}
