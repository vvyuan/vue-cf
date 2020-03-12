<template>
  <div class="cf-common-form-container">
    <component v-if="cfConfig && cfConfig.formPrintTemplate" v-bind:is="cfConfig.formPrintTemplate"/>
    <div>
      <a-form ref="form" :form="form" @submit="save">
        <a-row class="content common-form-content">
          <template v-for="(field, index) in fieldList">
            <a-col
              v-if="field.inForm.position & FieldPosition.form"
              :key="index"
              :xs="_inlineForm ? 24 : 24"
              :sm="_inlineForm ? 24 : 24"
              :md="_inlineForm ? 12 : 24"
              :lg="_inlineForm ? 12 : 24"
              :xl="_inlineForm ? 8 : 24"
              :xxl="_inlineForm ? 6 : 24">
              <a-form-item
                class="form-item"
                :disabled="readonly"
                :label-col="{span: 5}"
                :wrapper-col="{span: 19}"
                :label="field.title">
                <!-- TextField -->
                <template v-if="field.inForm instanceof FieldDefine.TextField">
                  <a-input
                    class="input"
                    :disabled="readonly"
                    :placeholder="field.inForm.placeholder"
                    @change="(e)=>field.inForm.onChange(e)"
                    v-decorator="[field.name, {rules: field.inForm.rules || []}]"
                  />
                </template>
                <!-- ReadonlyField -->
                <template v-if="field.inForm instanceof FieldDefine.ReadonlyField || field.inForm instanceof FieldDefine.ReadonlyFieldWithDict">
                  <a-input
                    class="input"
                    :disabled="true"
                    v-decorator="[field.name]"
                  />
                </template>
                <!-- PasswordField -->
                <template v-if="field.inForm instanceof FieldDefine.PasswordField">
                  <a-input-password
                    class="input"
                    :disabled="readonly"
                    :placeholder="field.inForm.placeholder"
                    v-decorator="[field.name, {rules: field.inForm.rules || []}]"
                  />
                </template>
                <!-- TextareaField -->
                <template v-if="field.inForm instanceof FieldDefine.TextareaField">
                  <a-textarea
                    class="input"
                    :disabled="readonly"
                    :rows="field.inForm.rows"
                    @change="(e)=>field.inForm.onChange(e)"
                    :placeholder="field.inForm.placeholder"
                    v-decorator="[field.name, {rules: field.inForm.rules || []}]"
                  />
                </template>
                <!-- NumberField -->
                <template v-else-if="field.inForm instanceof FieldDefine.NumberField">
                  <a-input-number
                    class="input"
                    :disabled="readonly"
                    :step="field.inForm.step"
                    :max="field.inForm.max"
                    :min="field.inForm.min"
                    :formatter="field.inForm.formatter"
                    :parser="field.inForm.parser"
                    @change="(e)=>field.inForm.onChange(e)"
                    :placeholder="field.inForm.placeholder"
                    v-decorator="[field.name, {rules: field.inForm.rules || []}]"
                  />
                </template>
                <!-- SingleSelectField -->
                <template v-else-if="field.inForm instanceof FieldDefine.SingleSelectField">
                  <a-select
                    class="input"
                    :disabled="readonly"
                    showSearch
                    optionFilterProp="children"
                    :filterOption="filterOption()"
                    :getPopupContainer="getPopupContainer"
                    :placeholder="field.inForm.placeholder"
                    @change="(e)=>field.inForm.onChange(e)"
                    v-decorator="[field.name, {rules: field.inForm.rules || []}]"
                    :options="field.inForm.options"
                  />
                </template>
                <!-- MultipleSelectField -->
                <template v-else-if="field.inForm instanceof FieldDefine.MultipleSelectField">
                  <a-select
                    class="input"
                    :disabled="readonly"
                    mode="multiple"
                    showSearch
                    optionFilterProp="children"
                    :filterOption="filterOption()"
                    :getPopupContainer="getPopupContainer"
                    :placeholder="field.inForm.placeholder"
                    @change="(e)=>field.inForm.onChange(e)"
                    v-decorator="[field.name, {rules: field.inForm.rules || []}]"
                    :options="field.inForm.options"
                  />
                </template>
                <!-- TagField -->
                <template v-else-if="field.inForm instanceof FieldDefine.TagField">
                  <a-select
                    class="input"
                    :disabled="readonly"
                    mode="tags"
                    showSearch
                    optionFilterProp="children"
                    :filterOption="filterOption()"
                    :getPopupContainer="getPopupContainer"
                    :placeholder="field.inForm.placeholder"
                    @change="(e)=>field.inForm.onChange(e)"
                    v-decorator="[field.name, {rules: field.inForm.rules || []}]"
                    :options="field.inForm.options"
                  />
                </template>
                <!-- CascaderField -->
                <template v-else-if="field.inForm instanceof FieldDefine.CascaderField">
                  <a-cascader
                    class="input"
                    :disabled="readonly"
                    :showSearch="field.inForm.needLoadData ? false : {filter: cascaderFilterOption()}"
                    :loadData="field.inForm.needLoadData ? field.inForm.loadData.bind(field.inForm) : undefined"
                    :changeOnSelect="field.inForm.needLoadData"
                    :getPopupContainer="getPopupContainer"
                    :placeholder="field.inForm.placeholder"
                    @change="(e)=>field.inForm.onChange(e)"
                    v-decorator="[field.name, {rules: field.inForm.rules || []}]"
                    :options="field.inForm.options"
                  />
                </template>
                <!-- RadioField -->
                <template v-else-if="field.inForm instanceof FieldDefine.RadioField">
                  <a-radio-group
                    class="input"
                    :disabled="readonly"
                    :placeholder="field.inForm.placeholder"
                    @change="(e)=>field.inForm.onChange(e)"
                    v-decorator="[field.name, {rules: field.inForm.rules || []}]"
                    :options="field.inForm.options"
                  />
                </template>
                <!-- CheckboxField -->
                <template v-else-if="field.inForm instanceof FieldDefine.CheckboxField">
                  <a-checkbox-group
                    class="input"
                    :disabled="readonly"
                    :placeholder="field.inForm.placeholder"
                    @change="(e)=>field.inForm.onChange(e)"
                    v-decorator="[field.name, {rules: field.inForm.rules || []}]"
                    :options="field.inForm.options"
                  />
                </template>
                <!-- DateTimeField -->
                <template v-else-if="field.inForm instanceof FieldDefine.DateTimeField">
                  <a-date-picker
                    class="input"
                    :disabled="readonly"
                    showTime
                    :getPopupContainer="getPopupContainer"
                    :placeholder="field.inForm.placeholder"
                    @change="(e)=>field.inForm.onChange(e)"
                    v-decorator="[field.name, {rules: field.inForm.rules || []}]"
                  />
                </template>
                <!-- DateField -->
                <template v-else-if="field.inForm instanceof FieldDefine.DateField">
                  <a-date-picker
                    class="input"
                    :disabled="readonly"
                    :getPopupContainer="getPopupContainer"
                    :placeholder="field.inForm.placeholder"
                    @change="(e)=>field.inForm.onChange(e)"
                    v-decorator="[field.name, {rules: field.inForm.rules || []}]"
                  />
                </template>
                <!-- TimeField -->
                <template v-else-if="field.inForm instanceof FieldDefine.TimeField">
                  <a-time-picker
                    class="input"
                    :disabled="readonly"
                    :getPopupContainer="getPopupContainer"
                    :placeholder="field.inForm.placeholder"
                    @change="(e)=>field.inForm.onChange(e)"
                    v-decorator="[field.name, {rules: field.inForm.rules || []}]"
                  />
                </template>
              </a-form-item>
            </a-col>
          </template>
        </a-row>
        <template v-if="!_inlineForm">
          <div class="footer-placeholder"></div>
          <div class="footer">
            <div class="left-buttons">
              <template v-for="button in (cfConfig ? cfConfig.realButtons.drawerFooterLeft : [])">
                <a-button
                  :key="button.key"
                  v-if="button.conditionOfDisplay ? button.conditionOfDisplay($router, cfConfig, undefined, form, undefined, undefined) : true"
                  :disabled="button.conditionOfDisable ? button.conditionOfDisable($router, cfConfig, undefined, form, undefined, undefined) : false"
                  :type="button.type"
                  @click="onCFButtonClick(button.onClick)"
                  :icon="button.icon"
                  :title="button.tips"
                >{{button.title}}</a-button>
              </template>
            </div>
            <div class="right-buttons">
              <template v-for="button in (cfConfig ? cfConfig.realButtons.drawerFooterRight : [])">
                <a-button
                  :key="button.key"
                  v-if="button.conditionOfDisplay ? button.conditionOfDisplay($router, cfConfig, undefined, form, undefined, undefined) : true"
                  :disabled="button.conditionOfDisable ? button.conditionOfDisable($router, cfConfig, undefined, form, undefined, undefined) : false"
                  :type="button.type"
                  @click="onCFButtonClick(button.onClick)"
                  :icon="button.icon"
                  :title="button.tips"
                >{{button.title}}</a-button>
              </template>
            </div>
          </div>
        </template>
      </a-form>
    </div>
  </div>
</template>

<script>
  import {CFConfig} from "../define/CFDefine";
  import * as FieldDefine from '../define/FieldDefine';
  import {FieldPosition} from '../define/FieldUtil';
  import { filterOption, cascaderFilterOption } from '../utils/util';

  export default {
    name: 'CFForm',
    props: {
      id: null,
      cfConfig: CFConfig,
      initFormValues: null,
      inlineForm: undefined,
    },
    data() {
      return {
        form: this.$form.createForm(this),
        filterOption: filterOption,
        FieldDefine: FieldDefine,
        FieldPosition: FieldPosition,
        cascaderFilterOption: cascaderFilterOption,
        readonly: false,
        visible: false,
      }
    },
    computed: {
      _inlineForm() {
        if(typeof this.inlineForm === 'undefined' && this.cfConfig) {
          return this.cfConfig.inlineForm
        }
        return !!this.inlineForm
      },
      fieldList() {
        return (this.cfConfig && this.cfConfig.fieldList) ? this.cfConfig.fieldList.filter(field=>!!field.inForm) : []
      }
    },
    methods: {
      onCFButtonClick(buttonClickFn) {
        buttonClickFn(this.$router, this.cfConfig, undefined, this);
      },
      save(e, otherData) {
        e && e.preventDefault();
        return new Promise(resolve => {
          this.form.validateFields((err, rawValues) => {
            if (!err) {
              let translatedValues = {};
              for(let field of this.cfConfig.fieldList) {
                if(field.inForm) {
                  translatedValues[field.name] = field.inForm.translateResult(rawValues[field.name])
                }
              }
              console.log('Received values of form: ', rawValues, translatedValues);
              let hide = this.$message.loading('正在保存，请稍候...', 0);
              let handle = this.id ? this.cfConfig.updateOne({id: this.id, ...translatedValues, ...otherData}) : this.cfConfig.createOne({...translatedValues, ...otherData});
              resolve(handle.then(this.onSaved).catch(e=>{ this.$message.error(e.message || e) }).finally(hide))
            }
          });
        })
      },
      onSaved() {
        this.$emit('saved')
      },
      cancel() {
        this.onSaved();
      },
      loadData() {
        // 加载字段所需数据
        let loadDictList = this.cfConfig ? this.cfConfig.fieldList
            .filter(item=>item.inForm instanceof FieldDefine.FieldWithDict)
            .map((item)=>item.inForm.loadData())
          : [];
        let loadFormData = this.id && this.cfConfig ? [this.cfConfig.getOne(this.id)] : [];
        let hide = this.$message.loading('数据加载中...', 0);
        return Promise.all(loadFormData.concat(loadDictList)).then(resList=>{
          if(this.id) {
            let response = resList[0];
            let values = {id: null};
            for(let field of this.cfConfig.fieldList) {
              values[field.name] = response[field.name]
            }
            if(!this.cfConfig.fieldList.find(field=>field.name === 'id' && field.inForm)) {
              delete values.id;
            }
            for(let field of this.cfConfig.fieldList) {
              if(field.inForm) {
                values[field.name] = field.inForm.translateInput(values[field.name]);
              }
            }
            this.form.setFieldsValue(values);
          } else {
            this.form.resetFields()
          }
          if(this.initFormValues) {
            this.form.setFieldsValue(this.initFormValues);
          }
        }).catch(e=>{
          this.$message.error(e.message || '发生未知错误')
        }).finally(hide)
      },
      getPopupContainer(triggerNode) {
        return this.$refs.form.$el
      }
    },
  }
</script>

<style lang="less">
  .cf-common-form-container {
    .form-item {
      .input {
        width: 100% !important;
      }
    }
    .footer {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 50px;
      background: white;
      z-index: 1;

      .left-buttons > *,  .right-buttons > *  {
        margin-left: 8px;
      }
      .left-buttons > *:first-child,  .right-buttons > *:first-child {
        margin-left: 0;
      }
    }
    .footer-placeholder {
      height: 0;
    }
  }

</style>
