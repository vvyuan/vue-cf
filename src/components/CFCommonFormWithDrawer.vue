<template>
  <div>
    <a-drawer
      wrapClassName="cf-common-form-drawer"
      placement="right"
      :closable="false"
      :maskClosable="false"
      :visible="visible"
      width="600"
      getContainer="#drawer"
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
        <CFCommonForm ref="form" :id="id" @on-saved="onClose" :cfConfig="cfConfig" :inlineForm="false" :initFormValues="initFormValues"/>
      </div>
    </a-drawer>
  </div>
</template>

<script>
  import {CFConfig} from "../define/CFDefine";
  import CFCommonForm from "./CFCommonForm.vue";
  export default {
    name: 'CFCommonFormWithDrawer',
    components: {CFCommonForm},
    props: {
      id: null,
      title: String,
      cfConfig: CFConfig,
      initFormValues: null,
    },
    data() {
      return {
        visible: false,
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
      console.log('form-destroyed', this);
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
      justify-content: space-between;
    }
    .footer-placeholder {
      height: 10px;
    }
  }
</style>
