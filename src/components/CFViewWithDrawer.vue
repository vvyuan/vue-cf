<template>
  <div>
    <a-drawer
      placement="right"
      :closable="true"
      :destroyOnClose="true"
      :maskClosable="true"
      :visible="visible"
      width="700"
      getContainer="#drawer"
      @close="close"
    >
      <template slot="title">
        <template v-if="Array.isArray(title) && title.length">
          <div>{{title[title.length - 1]}}</div>
        </template>
      </template>
      <CFView :cfConfig="cfConfig" :path="path" :title="title"/>
    </a-drawer>
  </div>
</template>

<script>

  export default {
    name: 'CFViewWithDrawer',
    components: {},
    props: {
      code: null,
      cfConfig: null,
      title: null,
      path: null,
    },
    data() {
      return {
        name: '',
        visible: false,
      }
    },
    created() {
    },
    mounted() {
      this.visible = true;
      addEventListener('keyup', this.keyPressEventHandle);
    },
    destroyed() {
      removeEventListener('keyup', this.keyPressEventHandle)
    },
    methods: {
      close() {
        this.visible = false;
        setTimeout(()=>{
          this.$router.go(-1)
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
