<template>
  <div>
    <a-drawer
      wrapClassName="cf-common-form-drawer"
      placement="right"
      :closable="false"
      :maskClosable="false"
      :visible="visible"
      width="600"
      getContainer="#cf-drawer"
      @close="onClose"
    >
      <template slot="title">
        <div style="display: flex; align-items: center; justify-content: space-between">
          <template v-if="Array.isArray(title) && title.length">
            <div><span v-if="!this.id">新增 - </span><span v-else>编辑 - </span>{{title[title.length - 1]}}</div>
          </template>
          <template v-else>
            <div><span v-if="!this.id">新增</span><span v-else>编辑</span></div>
          </template>
        </div>
      </template>
      <div>
        <CFForm ref="form" :id="id" @saved="onClose" :cfConfig="cfConfig" :inlineForm="false" :initFormValues="initFormValues"/>
      </div>
    </a-drawer>
  </div>
</template>

<script>
  import {CFConfig} from "../define/CFDefine";
  import CFForm from "./CFForm.vue";
  export default {
    name: 'CFFormWithDrawer',
    components: {CFForm},
    props: {
      id: null,
      title: Array,
      cfConfig: CFConfig,
      initFormValues: null,
    },
    data() {
      return {
        visible: false,
      }
    },
    beforeCreate() {
      if(!document.getElementById('cf-drawer')) {
        // 创建drawer容器，避免莫名bug
        let drawer = document.createElement('div');
        drawer.id = 'cf-drawer';
        document.body.appendChild(drawer)
      }
    },
    mounted() {
      this.visible = true;
      addEventListener('keyup', this.keyPressEventHandle);
      this.$nextTick(()=>{
        this.$refs.form.loadData();
      })
    },
    destroyed() {
      removeEventListener('keyup', this.keyPressEventHandle)
    },
    methods: {
      onClose() {
        this.visible = false;
        setTimeout(()=>{
          this.$router.go(-1);
        }, 600)
      },
      keyPressEventHandle(event) {
        if(event.code === 'Escape') {
          this.onClose()
        }
      }
    }
  }
</script>
<style lang="less">
  .cf-common-form-drawer {
    .ant-drawer-wrapper-body {
      display: flex;
      flex-direction: column;
    }
    .ant-drawer-body {
      flex: 1;
      overflow: auto;
    }
    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 0 20px;
      border-top: solid #ddd 1px;
      justify-content: space-between !important;
    }
    .footer-placeholder {
      height: 10px;
    }
  }
</style>
