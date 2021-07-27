<!--
 * @Author: 陈诚
 * @Date: 2021-07-27 11:10:52
 * @LastEditTime: 2021-07-27 11:42:53
 * @LastEditors: 陈诚
 * @Description: 
-->
<template>
  <div>{{ title }}</div>
</template>

<script>
import { ref } from "vue";
export default {
  setup() {
    const title = ref("hello kvite");
    setInterval(() => {
      title.value = title.value.split("").reverse().join("");
    }, 1000);
    return {
      title,
    };
  },
};
</script>
