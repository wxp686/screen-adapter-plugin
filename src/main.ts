import { isVue2, isVue3, nextTick } from "vue-demi";
import type { ScreenAdapterInstance, PluginOptions } from "../index.d.ts";
export default class ScreenAdapter implements ScreenAdapterInstance {
  private originRootFontSize;

  private Vue: any = {};

  rootFontSize = 0;

  private externalCallbacks: Function[] = [];

  private adaptOptions: { el: any; value: any }[] = [];

  private nextTick = null;

  constructor(Vue: any, option: PluginOptions) {
    if (!option.rootValue) throw Error("使用ScreenAdapter时请传入rootValue");
    this.originRootFontSize = option.rootValue;
    this.nextTick = Vue.nextTick || nextTick;
    isVue2 || isVue3 ? this.configVue(Vue) : null;
    this.init();
  }

  private configVue = (Vue) => {
    this.Vue = Vue;
    let _this;
    _this = this;
    // vue2 写法
    if (isVue2) {
      this.Vue.mixin({
        data: function () {
          return {
            screenAdapter: _this,
          };
        },
        methods: {
          px: this.px,
        },
      });
      // 适用于元素内部像素单位无法转为rem的情况，例如图表，这时采用放大缩小策略
      this.Vue.directive("scale", {
        inserted: function (...args) {
          let [el, bind] = args;
          el.style.flexShrink = 0;
          el.style.flexGrow = 0;
          _this.nextTick(() => {
            _this.wrapDiv(el);
            el.originOffsetWidth = el.offsetWidth / _this.getScale();
            el.originOffsetHeight = el.offsetHeight / _this.getScale();
            el.style.transformOrigin = "left top";
            el.style.width = el.originOffsetWidth + "px";
            el.style.height = el.originOffsetHeight + "px";
            _this.handlerScale({ el, value: bind.value });
            _this.updateAdaptOptions(...args);
          });
        },
        update: function (...args) {
          _this.updateAdaptOptions(...args);
        },
        unbind: function (el) {
          let index = _this.adaptOptions.findIndex((obj) => obj.el === el);
          index > -1 && _this.adaptOptions.splice(index, 1);
        },
      });
    } else {
      // Vue3
      this.Vue.mixin({
        data: function () {
          return {
            screenAdapter: _this,
          };
        },
        methods: {
          px: this.px,
        },
      });

      // 适用于元素内部像素单位无法转为rem的情况，例如图表，这时采用放大缩小策略
      this.Vue.directive("scale", {
        created: function (...args) {
          let [el, bind] = args;
          el.style.flexShrink = 0;
          el.style.flexGrow = 0;
          _this.nextTick(() => {
            _this.wrapDiv(el);
            el.originOffsetWidth = el.offsetWidth / _this.getScale();
            el.originOffsetHeight = el.offsetHeight / _this.getScale();
            el.style.transformOrigin = "left top";
            el.style.width = el.originOffsetWidth + "px";
            el.style.height = el.originOffsetHeight + "px";
            _this.handlerScale({ el, value: bind.value });
            _this.updateAdaptOptions(...args);
          });
        },
        updated: function (...args) {
          _this.updateAdaptOptions(...args);
        },
        unmounted: function (el) {
          let index = _this.adaptOptions.findIndex((obj) => obj.el === el);
          index > -1 && _this.adaptOptions.splice(index, 1);
        },
      });
    }
  };

  private wrapDiv = (el) => {
    let parent = document.createElement("div");
    parent.style.width = this.px(el.offsetWidth);
    parent.style.height = this.px(el.offsetHeight);
    parent.style.overflow = "hidden";
    el.parentNode.replaceChild(parent, el);
    parent.appendChild(el);
  };

  init = () => {
    this.nextTick(() => {
      this.handlerNormalMode();
      window.addEventListener("resize", this.handlerNormalMode);
      window.addEventListener("pageshow", this.onPageShowHandlerNormalMode);
    });
  };

  private updateAdaptOptions = (el, bind) => {
    let index = this.adaptOptions.findIndex((obj) => obj.el === el);
    let obj = {
      el,
      value: bind.value,
    };
    if (index > -1) {
      this.adaptOptions[index] = obj;
    } else {
      this.adaptOptions.push(obj);
    }
  };

  getScale = () => {
    return window.document.body.offsetWidth / (this.originRootFontSize * 10);
  };

  private handlerScale = ({ el, value }) => {
    let scale = this.getScale();
    el.style.transform = `scale(${scale}) translateZ(0)`;

    this.nextTick(() => {
      value?.(el, scale);
    });
  };

  private setRootRemUnit = () => {
    this.rootFontSize = window.innerWidth / 10;
    document.documentElement.style.fontSize = this.rootFontSize + "px";
  };

  private setBodyFontSize = () => {
    document.body.style.fontSize = this.px(12) as string;
    document.body.style.lineHeight = "1";
  };

  addListener(callback) {
    let isHas = this.externalCallbacks.includes(callback);
    !isHas && this.externalCallbacks.push(callback);
  }

  removeListener(callback) {
    let index = this.externalCallbacks.indexOf(callback);
    index > -1 && this.externalCallbacks.splice(index, 1);
  }

  private handlerNormalMode = () => {
    this.setRootRemUnit();
    this.setBodyFontSize();
    this.externalCallbacks?.forEach((callback) => callback?.());
    this.adaptOptions?.forEach(this.handlerScale);
  };

  private onPageShowHandlerNormalMode = (e) => {
    if (e.persisted) {
      this.handlerNormalMode();
    }
  };

  px = (val, real = false) => {
    if (!val) return;
    return real
      ? ((this.rootFontSize * val) / this.originRootFontSize).toFixed(2)
      : (val / this.originRootFontSize).toFixed(2) + "rem";
  };

  private resetFontSize = () => {
    this.rootFontSize = 0;
    document.body.style.fontSize = "";
    document.body.style.lineHeight = "";
    document.documentElement.style.fontSize = "";
  };

  destroy() {
    this.resetFontSize();
    this.externalCallbacks = [];
    this.adaptOptions = [];
    window.removeEventListener("resize", this.handlerNormalMode);
    window.removeEventListener("pageshow", this.onPageShowHandlerNormalMode);
  }
}
