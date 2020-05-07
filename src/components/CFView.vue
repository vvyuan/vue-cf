<template>
  <div class="cf-common-view-container">
    <div v-show="cfConfig">
      <div v-show="cfConfig && cfConfig.inlineForm">
        <a-divider v-show="cfConfig && cfConfig.pageTitle">{{cfConfig && cfConfig.pageTitle}}</a-divider>
        <div style="display: flex;margin-bottom: 16px; align-items: center;">
          <div class="buttons" style="display: flex;flex: 1;align-items: center;justify-content: flex-start;">
            <template v-for="button in (cfConfig ? cfConfig.realButtons.inlineHeaderLeft : [])">
              <a-button
                :key="button.key"
                v-if="button.conditionOfDisplay ? button.conditionOfDisplay($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : true"
                :disabled="button.conditionOfDisable ? button.conditionOfDisable($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : false"
                :type="button.type"
                @click="onCFButtonClick(button.onClick)"
                :icon="button.icon"
                :title="button.tips"
              >{{button.title}}</a-button>
            </template>
          </div>
          <div class="buttons" style="display: flex;flex: 1;align-items: center;justify-content: center;">
            <template v-for="button in (cfConfig ? cfConfig.realButtons.inlineHeaderCenter : [])">
              <a-button
                :key="button.key"
                v-if="button.conditionOfDisplay ? button.conditionOfDisplay($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : true"
                :disabled="button.conditionOfDisable ? button.conditionOfDisable($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : false"
                :type="button.type"
                @click="onCFButtonClick(button.onClick)"
                :icon="button.icon"
                :title="button.tips"
              >{{button.title}}</a-button>
            </template>
          </div>
          <div class="buttons" style="display: flex;flex: 1;align-items: center;justify-content: flex-end;">
            <template v-for="button in (cfConfig ? cfConfig.realButtons.inlineHeaderRight : [])">
              <a-button
                :key="button.key"
                v-if="button.conditionOfDisplay ? button.conditionOfDisplay($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : true"
                :disabled="button.conditionOfDisable ? button.conditionOfDisable($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : false"
                :type="button.type"
                @click="onCFButtonClick(button.onClick)"
                :icon="button.icon"
                :title="button.tips"
              >{{button.title}}</a-button>
            </template>
          </div>
        </div>
        <a-divider v-if="cfConfig && cfConfig.pageTitle" style="margin: 8px 0 20px 0;"/>
        <CFForm ref="form" :cfConfig="cfConfig" :id="formId" @saved="onFormSaved"/>
        <div style="display: flex;">
          <div class="buttons" style="display: flex;flex: 1;align-items: center;justify-content: flex-start;">
            <template v-for="button in (cfConfig ? cfConfig.realButtons.inlineFooterLeft : [])">
              <a-button
                :key="button.key"
                v-if="button.conditionOfDisplay ? button.conditionOfDisplay($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : true"
                :disabled="button.conditionOfDisable ? button.conditionOfDisable($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : false"
                :type="button.type"
                @click="onCFButtonClick(button.onClick)"
                :icon="button.icon"
                :title="button.tips"
              >{{button.title}}</a-button>
            </template>
          </div>
          <div class="buttons" style="display: flex;flex: 1;align-items: center;justify-content: center;">
            <template v-for="button in (cfConfig ? cfConfig.realButtons.inlineFooterCenter : [])">
              <a-button
                :key="button.key"
                v-if="button.conditionOfDisplay ? button.conditionOfDisplay($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : true"
                :disabled="button.conditionOfDisable ? button.conditionOfDisable($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : false"
                :type="button.type"
                @click="onCFButtonClick(button.onClick)"
                :icon="button.icon"
                :title="button.tips"
              >{{button.title}}</a-button>
            </template>
          </div>
          <div class="buttons" style="display: flex;flex: 1;align-items: center;justify-content: flex-end;">
            <template v-for="button in (cfConfig ? cfConfig.realButtons.inlineFooterRight : [])">
              <a-button
                :key="button.key"
                v-if="button.conditionOfDisplay ? button.conditionOfDisplay($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : true"
                :disabled="button.conditionOfDisable ? button.conditionOfDisable($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : false"
                :type="button.type"
                @click="onCFButtonClick(button.onClick)"
                :icon="button.icon"
                :title="button.tips"
              >{{button.title}}</a-button>
            </template>
          </div>
        </div>
        <a-divider v-if="columnsData.columns && columnsData.columns.length > 1"/>
      </div>
      <div v-if="columnsData.columns && columnsData.columns.length > 1" style="display: flex;justify-content: space-between; margin-bottom: 16px;">
        <div class="buttons">
          <template v-for="button in (cfConfig ? cfConfig.realButtons.tableHeaderLeft : [])">
            <a-button
              :key="button.key"
              v-if="button.conditionOfDisplay ? button.conditionOfDisplay($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : true"
              :disabled="button.conditionOfDisable ? button.conditionOfDisable($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : false"
              :type="button.type"
              @click="onCFButtonClick(button.onClick)"
              :icon="button.icon"
              :title="button.tips"
            >{{button.title}}</a-button>
          </template>
        </div>
        <div class="buttons">
          <template v-for="button in (cfConfig ? cfConfig.realButtons.tableHeaderRight : [])">
            <a-button
              :key="button.key"
              v-if="button.conditionOfDisplay ? button.conditionOfDisplay($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : true"
              :disabled="button.conditionOfDisable ? button.conditionOfDisable($router, cfConfig, undefined, $refs.form, selectedRecords, record || undefined) : false"
              :type="button.type"
              @click="onCFButtonClick(button.onClick)"
              :icon="button.icon"
              :title="button.tips"
            >{{button.title}}</a-button>
          </template>
          <a-button :hidden="filters.length === 0" icon="filter" @click="openFilter=!openFilter">筛选</a-button>
        </div>
      </div>
      <form v-if="columnsData.columns && columnsData.columns.length > 1" form="filterForm" ref="filterForm" :class="`filter-container ${openFilterEx ? 'active' : ''}`" action="./" @submit.stop.prevent="submitFilter">
        <div style="display: flex; padding: 4px 10px; align-items: center; justify-content: space-between; border-bottom: solid 1px #77d0ea;background: #ecfdff;">
          <div>筛选</div>
          <div>
            <a-button size="small" html-type="reset" @click="resetFilter">重置</a-button>
            <a-button style="margin-left: 8px" size="small" html-type="submit">搜索</a-button>
          </div>
        </div>
        <div class="content">
          <a-row>
            <template v-for="filter in filters">
              <a-col :xs="24" :sm="24" :md="12" :lg="8" :xl="8" :xxl="6" :key="filter.name" style="display: flex;align-items: center;padding: 16px 16px 0 16px;">
                <div style="min-width: 6em;max-width: 40%;">{{filter.title}}：</div>
                <div style="flex: 1">
                  <template v-if="filter.inForm instanceof Field.FieldWithDict">
                    <a-select
                      style="width: 100%"
                      :name="filter.name"
                      :placeholder="filter.inForm.placeholder"
                      :defaultValue="$route.query[filter.name]"
                      :options="[{value: '', label: '无'}].concat(filter.inForm.options)"
                      @change="(value)=>filterChange(filter.name, value)"
                    />
                  </template>
                  <template v-else-if="filter.inForm instanceof Field.DateFieldBase">
                    <a-date-picker
                      style="width: 100%"
                      :name="filter.name"
                      :placeholder="filter.inForm.placeholder"
                      :defaultValue="$route.query[filter.name] ? moment($route.query[filter.name], filter.inForm.format) : null"
                      @change="(moment)=>filterChange(filter.name, moment ? moment.format(filter.inForm.format) : '')"
                    />
                  </template>
                  <template v-else>
                    <a-input
                      style="width: 100%"
                      :name="filter.name"
                      :placeholder="filter.inForm.placeholder"
                      :defaultValue="$route.query[filter.name]"
                      @change="(e)=>filterChange(filter.name, e.target.value)"
                    />
                  </template>
                </div>
              </a-col>
            </template>
          </a-row>
        </div>
      </form>
      <div v-if="columnsData.columns && columnsData.columns.length > 1">
        <a-table
          :columns="columnsData.columns"
          :rowSelection="cfConfig && cfConfig.enableSelect ? {selectedRowKeys: selectedRowKeys, onChange: onSelectChange} : undefined"
          rowKey="id"
          :dataSource="list"
          :pagination="pagination"
          :loading="loading"
          :scroll="columnsData.tableScrollWidth ? { x: columnsData.tableScrollWidth } : undefined"
          @change="handleTableChange"
        >
          <template slot="operation" slot-scope="text, record">
            <div class="operation buttons">
              <template v-for="button in (cfConfig ? cfConfig.realButtons.tableRowOperations : [])">
                <a-button
                  :key="button.key"
                  v-if="button.conditionOfDisplay ? button.conditionOfDisplay($router, cfConfig, undefined, form, undefined, record) : true"
                  :disabled="button.conditionOfDisable ? button.conditionOfDisable($router, cfConfig, undefined, form, undefined, record) : false"
                  :type="button.type"
                  @click="onCFButtonClick(button.onClick, record)"
                  :icon="button.icon"
                  :title="button.tips"
                >{{button.title}}</a-button>
              </template>
            </div>
          </template>
        </a-table>
        <router-view/>
      </div>
    </div>
    <div v-show="!cfConfig">
      <h5>{{title}}</h5>
      <a-alert message="[CFView:props] cfConfig无效" type="error"/>
    </div>
  </div>
</template>

<script>
  import { objectToQueryString } from '../utils/util'
  import * as Field from '../define/FieldDefine'
  import {FieldPosition} from '../define/FieldUtil'
  import moment from 'moment';
  import CFForm from './CFForm.vue';

  export default {
    name: 'CFView',
    components: {CFForm},
    props: {
      title: Array,
      cfConfig: null,
      path: null,
    },
    data () {
      return {
        formId: undefined,
        loading: false,
        selectedRowKeys: [],
        selectedRecords: [],
        list: [],
        pagination: {pageSizeOptions: ['10', '20', '30', '40', '100'], showSizeChanger: true},
        openFilter: false,
        Field: Field,
        filterForm: this.$form.createForm(),
      }
    },
    computed: {
      openFilterEx: function() {
        let existFilterQuery = false;
        for(let queryKey in this.$route.query) {
          if(this.$route.query[queryKey]) {
            existFilterQuery = true;
            break;
          }
        }
        if(!this.checkPathIsCurView()) {
          return false
        }
        return this.openFilter || existFilterQuery
      },
      filters: function() {
        if(!this.cfConfig) { return [] }
        return this.cfConfig.fieldList.filter(field=>field.inForm && (field.inForm.position & FieldPosition.filter))
      },
      columnsData: function () {
        let containerWidth = document.body.offsetWidth - 200 - 40;
        let emToPxRatio = 14;
        if(!this.cfConfig) { return [] }
        let fieldListColumns = this.cfConfig.fieldList.filter(field => field.inTable && !!field.inTable.display).map(field => {
          let formatter = {};
          if(field.inForm && field.inForm.formatter) {
            formatter.customRender = field.inForm.formatter;
          }
          if(field.inTable.formatter) {
            formatter.customRender = field.inTable.formatter;
          }
          return {
            title: field.title,
            dataIndex: field.name,
            ...field.inTable.column,
            ...formatter
          }
        });
        let fullWidthConfig = true; // 是否所有显示的列都配置了宽度
        // 所有已配置宽度的列的总宽度
        let columnsWidthTotal = [0].concat(fieldListColumns).reduce((a, b)=>{
          fullWidthConfig = fullWidthConfig && !!b.width;
          let bWidth = b.width || 0;
          if(typeof bWidth === "string") {
            let match = bWidth.match(/^(\d+)(\w+)$/);
            if(match) {
              switch (match[2]) {
                case 'px':
                  bWidth = match[1] * 1;
                  break;
                case 'em':
                  bWidth = match[1] * emToPxRatio;
                  break;
                default:
                  // 对于不支持的类型默认认为0宽度
                  bWidth = 0;
              }
            }
          }
          // 谜之数据默认为宽度为0
          return a + (parseInt(bWidth) || 0);
        });
        let setDefaultColumnWidth = false; // 是否为各个列配置默认宽度，此时必然开启水平滑动
        if(columnsWidthTotal > containerWidth) {
          // 当表格中已配置宽度的列总宽度超过容器宽度时，开启水平滚动，并为没有配置width属性的列配置默认值
          setDefaultColumnWidth = true
        } else if(fullWidthConfig) {
          // 当表格中已配置宽度的列总宽度小于容器宽度时，并且当所有列都配置了宽度时，本判定优先级高于显示的列数判定
          setDefaultColumnWidth = false;
        } else if(fieldListColumns.length > 9) {
          // 当表格中显示的列数超过9个时，开启水平滚动，并为没有配置width属性的列配置默认值
          setDefaultColumnWidth = true;
        }
        if(setDefaultColumnWidth) {
          // 配置默认列宽度 200px
          fieldListColumns.forEach(item=>{
            if(!item.width) {
              columnsWidthTotal += 200;
              item.width = 200;
            }
          })
        }
        fieldListColumns = fieldListColumns.concat({
          title: '操作',
          dataIndex: 'operation',
          align: 'center',
          width: 60,
          fixed: setDefaultColumnWidth ? 'right' : undefined,
          scopedSlots: { customRender: 'operation' },
        });
        return {columns: fieldListColumns, tableScrollWidth: columnsWidthTotal}
      }
    },
    watch: {
      // 如果路由有变化，会再次执行该方法
      '$route': 'routeChange'
    },
    created () {
      // 组件创建完后获取数据，
      // 此时 data 已经被 observed 了
      this.reload()
    },
    mounted() {
      this.filterData = {...this.$route.query};
      // console.log('mounted', this.filterData)
      // console.log("view:mounted")
      // addEventListener('keyup', this.keyPressEventHandle);
    },
    destroyed() {
      // console.log("view:destroyed")
      // removeEventListener('keyup', this.keyPressEventHandle)
    },
    // 带有字典数据且显示在table中或可搜索的字段列表
    fieldWithDictList: [],
    // 筛选数据
    filterData: {},
    methods: {
      moment(a, b, c) { return moment(a, b, c) },
      onCFButtonClick(buttonClickFn, record) {
        buttonClickFn(this.$router, this.cfConfig, this, this.$refs.form, this.selectedRecords, record);
      },
      checkPathIsCurView() {
        // props.path在创建菜单时自动生成
        return this.$route.matched.length === 0 || this.$route.matched[this.$route.matched.length - 1].path === this.path
      },
      reload() {
        this.$nextTick(()=>{
          this.getList().then(this.resetForInlineForm);
        });
      },
      loadDict() {
        if(this.cfConfig) {
          this.fieldWithDictList = this.cfConfig.fieldList.filter(field=>field.inForm && field.inForm instanceof Field.FieldWithDict && ((field.inForm.position & FieldPosition.filter) || (field.inTable && field.inTable.display)));
          let loadDict = this.fieldWithDictList.map(field=>field.inForm.loadData());
          return Promise.all(loadDict)
        }
        return Promise.resolve()
      },
      routeChange(a, b) {
        // console.log("routeChange", this.$route);
        if(this.checkPathIsCurView()) {
          this.reload();
        }
      },
      getList (page) {
        if(this.cfConfig) {
          this.loading = true;
          return this.loadDict().then(()=>this.cfConfig.getList({page: page || 1, pageSize: this.pagination.pageSize}, this.$route.query)).then(response => {
            let list = response.list;
            const pagination = { ...this.pagination };
            pagination.total = response.total;
            pagination.pageSize = response.pageSize;
            pagination.current = response.current;
            this.pagination = pagination;
            if(this.fieldWithDictList.length) {
              // 映射字典值
              list.forEach(item=>{
                for(let field of this.fieldWithDictList) {
                  let value = item[field.name];
                  let label = null;
                  if(Array.isArray(value)) {
                    label = value.map(v=>(field.inForm.options.find(option=>option.value === v) || {}).label || value).join(',')
                  } else {
                    label = (field.inForm.options.find(option=>option.value === value) || {}).label;
                  }
                  item[field.name] = label || value;
                }
              })
            }
            this.list = list;
          }).catch(e=>{
            this.list = [];
            console.error(e.message);
          }).finally(()=>{
            this.loading = false
          })
        } else {
          return Promise.resolve();
        }
      },
      deleteRecord(record) {
        console.log(record);
        this.loading = true;
        this.cfConfig && this.cfConfig.deleteOne(record.id).then(response=>{
          this.reload();
        }).finally(()=>{
          this.loading = false
        })
      },
      handleTableChange (pagination, filters, sorter) {
        this.pagination = { ...pagination };
        if(this.list.length !== pagination.total) {
          this.getList(pagination.current);
        } else {
        }
      },
      filterChange(name, value) {
        if(!this.filterData) { this.filterData = {} }
        this.filterData[name] = value;
      },
      resetFilter() {
        this.filterData = {};
        if(Object.keys(this.$route.query).length) {
          this.$router.replace(this.$route.path)
        }
      },
      submitFilter(event) {
        const willQueryString = objectToQueryString(this.filterData);
        const curQueryString = objectToQueryString(this.$route.query);
        if(willQueryString !== curQueryString) {
          this.$router.replace('?' + willQueryString)
        }
      },
      onSelectChange(selectedRowKeys) {
        this.selectedRowKeys = selectedRowKeys;
        this.selectedRecords = this.list.filter(item=>this.selectedRowKeys.indexOf(item.id) >= 0);
        // 给所有按钮传递onSelectChange事件
        for(let button of this.cfConfig.buttonList) {
          button.onTableSelected && button.onTableSelected(this.selectedRecords);
        }
      },
      print() {
        print();
      },
      // 以下为form用方法
      loadDataForForm(id) {
        this.formId = id || undefined;
        this.$nextTick(()=>{
          this.$refs.form.loadData().then(()=>{
            // 滚动到顶部
            window.scrollTo(0, 0);
          });
        })
      },
      resetForInlineForm() {
        this.formId = undefined;

        this.$nextTick(()=> {
          this.$refs.form && this.$refs.form.loadData();
        })
      },
      onFormSaved() {
        this.resetForInlineForm();
        this.reload();
      },
    }
  }
</script>

<style lang="less">
  .cf-common-view-container {
    .operation {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .buttons {
      > * {
        margin-left: 8px;
      }
      > *:first-child {
        margin-left: 0;
      }
    }
    .filter-container {
      display: none;
      margin: 16px 0;
      border: solid #77d0ea 1px;
      border-radius: 5px;
      overflow: hidden;
      .content {
        display: block;
        padding-bottom: 16px;
      }
    }
    .filter-container.active {
      display: block;
    }
  }
</style>
