import React, { Component } from 'react';
import { Alert, Drawer, Form, Button, Col, Row, Input, Select, DatePicker, TimePicker } from 'antd';
import AutoCompleteInput from './AutoCompleteInput';
const moment = require('moment');

const Option = Select.Option;
const FormItem = Form.Item;

class DrawerForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      visible: true,
      alertText: '',
      alertType: '',
      showAlert: false,
     }
  }

  toggle = () => {
    this.setState({
      visible: !this.state.visible,
    });
    this.props.onClose();
  };

  handleAlert = (alertText, alertType) => {
    this.setState({
      showAlert: true,
      alertText,
      alertType,
    })
  }

  hideAlert = () => {
    this.setState({
      showAlert: false,
    })
  }

  handleDateChange = (date, dateString) => {
    console.log(date, dateString);
    this.setState({
      date: dateString,
    })
  }

  handleSelect = (value, select) => {
    this.setState({
      selects: {
        ...this.state.selects,
        [select.props.id]: value
      },
    })
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.hideAlert();
    this.props.form.validateFields((err, inputs) => {
      console.log('Received values of form: ', inputs);
      for (let input of this.props.inputs) {
        if (input.required === true) {
          if (inputs[input.id] === undefined || inputs[input.id] === '' || inputs[input.id] === null) {
            this.handleAlert(`${input.text} cannot be blank`, 'error')
            return
          }
        }
      }
      //need to loop this.props.inputs and update nestedKeys with correct key
      for (let input of this.props.inputs) {
        console.log(inputs[input.id + input.nestedKey])
        if (inputs[input.id + input.nestedKey] !== undefined) {
          inputs[input.id] = inputs[input.id+input.nestedKey]
          //delete inputs[input.id + input.nestedKey]
        }
      }
      // fitler out any empty entries or values that are the same
      const values = Object.entries(inputs).filter(val=>val[1] !== undefined && inputs[val[0]] !== this.props.item[val[0]]).filter(val=>{
        if (moment(val[1]).isValid()){
          //compare if the dates are the same day
          if (!moment(val[1]).isSame(this.props.item[val[0]], 'day')) {
            return val
          }
        } else {
          return val
        }
      })
      console.log(values)
      if (values.length === 0) {
        this.handleAlert('No Updates Found','warning');
        return
      }
      console.log(this.props.item)
      let update = {
        id: this.props.item._id,
        ...this.props.item.poRef && {poRef: this.props.item.poRef},
        ...values.find(val=>val[0] === 'quantity') && {oldQty: this.props.item.quantity},
        ...this.state.selects,
      }
      //add any required keys for update
      if (Array.isArray(this.props.reqUpdateKeys)) {
        for (let key of this.props.reqUpdateKeys) {
          update = {
            ...update,
            [key]: this.props.item[key]
          }
        }
      }
      //add/overwrite any updated values into the update
      for (let val of values) {
        update = {
          ...update,
          [val[0]]: val[0] === 'createdOn' ? new Date(val[1]).toLocaleString() : val[1],
        }
      }
      console.log(update)
      this.props.onSave(this.props.create ? [inputs] : [update],this.props.item._id)
      .then(res=>{
        !res.hideAlert && this.handleAlert('Changes Saved','success')
      })
      .catch(err=>{
        console.log(err)
        this.handleAlert(err.message,'error')
        //reset form values
        setTimeout(()=>{
          !this.props.create && this.props.form.resetFields()
        },250)
      })
    });
  }

  handleAutoUpdate = (clicked, id, input) => {
    console.log({clicked})
    if (Array.isArray(input.linkedFields)) {
      //only update if feild is empty
      for (let {formRef, dataRef, type, render } of input.linkedFields) {
        let value = type === 'date' ? moment(new Date(clicked.data[dataRef])) : render ? render(clicked.data) : clicked.data[dataRef]
        this.props.form.getFieldValue(formRef) ? this.props.form.setFieldsValue({ [formRef]: value }) : null
      }
    }
    this.props.form.setFieldsValue({ [id]: Array.isArray(clicked.id) ? clicked.id.map(c =>c.id) : clicked.data[input.nestedKey || input.id] })
  }

  handlerCascaderUpdate = (value, options, i) => {
    return new Promise((resolve,reject) => {
      let parentValue = options[i.reverseData ? 1 : 0] ? options[i.reverseData ? 1 : 0].id : null;
      let childValue = options[i.reverseData ? 0 : 1] ? options[i.reverseData ? 0 : 1].id : null;
      let update = {
        [i.parent.defaultKey]: parentValue,
        [i.child.defaultKey]: childValue
      }
      console.log({ update, i, parentValue, childValue }, this.props.form.getFieldsValue())
      this.props.form.setFieldsValue(update)
      resolve('success')
    })
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    let { item, inputs, } = this.props
    let formInputs = inputs.map(i=>{
      let initialValue = i.nestedKey && item[i.id] ? item[i.id][i.nestedKey] : item[i.id]
      let id = i.nestedKey ? i.id+i.nestedKey : i.id
      i = this.props.create && i.createInputConfig ? i = { ...i, ...i.createInputConfig } : i
      i.noEdit = this.props.create ? i.noEdit = false : i.noEdit
      if (i.type === 'textarea') {
        return (
          <Col xs={i.span*3} sm={i.span} key={id}>
            <FormItem label={`${i.text}`}>
              {getFieldDecorator(id, { initialValue }, {
                 rules: [{
                   required: i.required,
                 }],
               })(
                  <Input.TextArea
                   rows={i.textRows}
                   placeholder={i.text}
                   disabled={i.noEdit}
                  />
               )}
            </FormItem>
          </Col>
        )
      } else if (i.type === 'autoComplete') {
        return (
          <Col xs={i.span * 3} sm={i.span} key={id}>
            <FormItem label={`${i.text}`}>
              {getFieldDecorator(id, { initialValue }, {
                rules: [{
                  required: i.required,
                }],
              })(
                <AutoCompleteInput
                  domRef={`${item._id || 'create'}-${i.id}edit-auto-select`}
                  queryModel={i.queryModel}
                  searchKey={i.nestedKey}
                  placeholder={i.text}
                  mode={i.autoCompleteMode}
                  onUpdate={(clicked) => this.handleAutoUpdate(clicked, id, i)}
                  skipSelectedCallback={true}
                  selected={Array.isArray(item[i.id]) ? item[i.id] : []}
                  showAddOption={i.showAddOption}
            >
                  <Input style={{ display: "none" }} />
                </AutoCompleteInput>
              )}
            </FormItem>
          </Col>
        )
      } else if (i.type === 'date') {
        return (
          <Col xs={i.span*3} sm={i.span} key={id}>
            <FormItem label={`${i.text}`}>
              {getFieldDecorator(id, { initialValue: !this.props.create ? moment(new Date(initialValue)) : moment() }, {
                 rules: [{
                   required: i.required,
                 }],
               })(
                 <DatePicker style={{minWidth: 252}} locale={{dateFormat: "M-D-YY"}} disabledDate={(current) => current > moment().endOf('day')} onChange={this.handleDateChange} className={i.className} disabled={i.noEdit} />
               )}
            </FormItem>
          </Col>
        )
      } else if (i.type === 'select') {
        let foundOption = initialValue !== undefined ? i.options.find(({id}) => id === initialValue) || {} : i.options[0]
        console.log({item, options: i.options, initialValue})
        //let foundOption = {}
        return (
          <Col xs={i.span*3} sm={i.span} key={id}>
            <FormItem label={`${i.text}`}>
              {getFieldDecorator(id, { initialValue: foundOption.text || foundOption.id }, {
                 rules: [{
                   required: i.required,
                 }],
               })(
                 <Select key={`${id}Select`} onChange={this.handleSelect} disabled={i.noEdit}>
                   {i.options.map(val => (
                     <Option id={`${id}Select`} key={val.id} value={val.id}>{val.text || val.id}</Option>
                   ))}
                 </Select>
               )}
            </FormItem>
          </Col>
        )
      } else if (i.type === 'timepicker') {
        return (
          <Col xs={i.span * 3} sm={i.span} key={id}>
            <FormItem label={`${i.text}`}>
              {getFieldDecorator(id, { initialValue: !this.props.create ? moment(new Date(initialValue)) : moment() }, {
                rules: [{
                  required: i.required,
                }],
              })(
                <TimePicker style={{ minWidth: 252 }} {...i.config ? {...i.config} : {}} />
              )}
            </FormItem>
          </Col>
        )
      } else {
        return (
          <Col xs={i.span*3} sm={i.span} key={id}>
            <FormItem label={`${i.text}`}>
              {getFieldDecorator(id, { initialValue: i.render ? i.render(item,'edit') : initialValue }, {
                 rules: [{
                   required: i.required,
                 }],
               })(
                  <Input
                   type={i.type}
                   placeholder={i.text}
                   disabled={i.noEdit}
                  />
               )}
            </FormItem>
          </Col>
        )
      }
    })
    let content = (
      <div>
        <div>
          {this.state.showAlert && (
            <Alert style={{ margin: '-10px 0px 10px 0px' }} closable afterClose={this.hideAlert} message={this.state.alertText} type={this.state.alertType} showIcon />
          )}
          <Form onKeyDown={(e) => e.key === 'Enter' && this.handleSubmit(e)} layout="vertical" onSubmit={this.handleSubmit}>
            <Row gutter={6}>{formInputs}</Row>
          </Form>
        </div>
        {this.props.noDrawer ? 
          <Button block htmlType="submit" onClick={this.handleSubmit} type="primary">{this.props.submitText||'Save'}</Button>
        :
          <div className="drawer-footer">
            <Button
              style={{
                marginRight: 8,
              }}
              onClick={this.toggle}
              className="no-bg no-border"
            >
              Cancel
            </Button>
            <Button htmlType="submit" onClick={this.handleSubmit} type="primary">Save</Button>
          </div>
        }
      </div>
    )
    return (
        this.props.noDrawer ? 
          content
          :
          <Drawer
            className="stkd-drawer"
            title={this.props.title}
            width={document.documentElement.clientWidth < 300 ? '100%' : 300}
            placement="right"
            onClose={this.toggle}
            visible={this.state.visible}
            style={{
              height: 'calc(100% - 55px)',
              overflow: 'auto',
              paddingBottom: 53,
            }}
          >
            {content}
          </Drawer>
        
    );
  }
}

const EditItemDrawer = Form.create()(DrawerForm);
export default EditItemDrawer;
