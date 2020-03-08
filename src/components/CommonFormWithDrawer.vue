<template>
  <div>
    <a-drawer
      wrapClassName="common-form-drawer"
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
        <common-form ref="form" :id="id" @on-saved="onClose" :cfConfig="cfConfig" :inlineForm="false" :initFormValues="initFormValues"/>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts">
  import { Component, Prop, Vue } from 'vue-property-decorator'
  import {CFConfig} from "../define/CFDefine";
  import CommonForm from "@/components/CommonForm.vue";
  import {ICommonForm} from "../define/ViewDefine";
  import {DataBase} from "../define/IRequest";

  @Component({components: {CommonForm}})
  export default class CommonFormWithDrawer<T extends DataBase> extends Vue {
    // [x: string]: any;
    @Prop() id?: number | string;
    @Prop() title!: String;
    @Prop() cfConfig?: CFConfig<T>;
    @Prop() initFormValues?: {[key: string]: any};
    visible: boolean = false;

    onClose() {
      this.visible = false;
      setTimeout(()=>{
        this.$router.go(-1);
      }, 600)
    }
    keyPressEventHandle(event: { code: string; }) {
      if(event.code === 'Escape') {
        this.onClose()
      }
    }
    mounted(): void {
      this.visible = true;
      addEventListener('keyup', this.keyPressEventHandle);
      this.$nextTick(()=>{
        // @ts-ignore
        (this.$refs.form as ICommonForm).loadData();
      })
    }
    destroyed(): void {
      console.log('form-destroyed', this);
      removeEventListener('keyup', this.keyPressEventHandle)
    }
  }
</script>

<style lang="less">
  .common-form-drawer {
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
