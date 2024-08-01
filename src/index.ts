import ScreenAdapter from "./main";
import { isVue2, isVue3 } from "vue-demi";

export default isVue2 || isVue3
  ? {
      install(Vue, options) {
        new ScreenAdapter(Vue, options);
      },
    }
  : ScreenAdapter;
