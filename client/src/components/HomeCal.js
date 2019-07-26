import React, { Component } from 'react';
import { Calendar, Badge } from 'antd';
import EditItemDrawer from './EditItemDrawer';
import { connect } from "react-redux";
import moment from 'moment';
import { upsertModelDocuments, queryModelData } from '../store/actions/models';

const editDrawerConfigs = {
  editShift: {
    title: "Shift",
    inputs: [
      { id: 'status', text: 'Status', type: 'select', options: [{ id: 'Scheduled' }, { id: 'Worked' }, { id: 'Off' }], span: 24, required: true},
      { id: 'startTime', text: 'Start Time', type: 'timepicker', config: { use12Hours: true, format: "h:mm a", minuteStep: 15 }, span: 24, required: true},
      { id: 'endTime', text: 'End Time', type: 'timepicker', config: { use12Hours: true, format: "h:mm a", minuteStep: 15 }, span: 24, required: true},
      { id: 'warehouse', text: 'Warehouse', type: 'select', options: [{ id: 'Irvine DLA9' }, { id: 'Los Angeles LAX1' }], span: 24, required: true},
    ],
  },
}

class HomeCal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: moment(new Date()),
      drawerItem: {},
      loading: true,
      data: [],
      query: [],
    }
  }

  fetchModelData = async () => {
    let filters = this.props.filters || []
    let query = [...this.state.query, ...filters]
    this.setState({loading: true})
    await this.props.queryModelData({model: 'Shift', query, activePage: 1, rowsPerPage: 500, populateArray: [{path: 'user'}]})
    .then(({data = [], activePage, totalPages, rowsPerPage, skip})=> {
      this.setState({
        skip,
        data,
        activePage,
        totalPages,
        rowsPerPage,
      })
    })
    .catch(err=>{
      console.log({err})
    })
    this.setState({loading: false})
  }

  componentDidMount() {
    this.fetchModelData()
  }

  handleDrawerSave = (data, id) => {
    return new Promise(async (resolve,reject) => {
      await upsertModelDocuments({ model: 'Shift', data: data.map(doc=>({...doc, user: this.props.currentUser.user.id})), filterRefs: ['user','startTime','endTime','warehouse','status']})
      .then(res => {
        resolve(res)
        this.fetchModelData()
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  onSelect = value => {
    console.log({value})
    this.setState({
      drawerItem: true,
    })
    //this.setState({ value, selectedValue: value });
  };

  onPanelChange = value => {
    console.log({value})
    this.setState({ value });
  };

  handleShiftClick = (shift,e) => {
    e.stopPropagation()
    console.log({shift})
    this.setState({drawerItem: shift})
  }

  dateCellRender = (date) => {
    let { data } = this.state
    //find users for date
    let shifts = data
      .filter(shift => moment(shift.date).isSame(moment(date), 'day'))
      .map(shift => ({...shift,...shift.user._id == this.props.currentUser.user.id && {isCurrentUser: true}}))
    return shifts.length ? shifts.map(s => {
      return(
        <div onClick={(e)=>this.handleShiftClick(s,e)} key={s._id} className="flex flex-col" style={{ fontSize: 11, border: '1px solid', borderRadius: 3, padding: 3, marginBottom: 5}}>
          <div>{moment(s.startTime).format('h:mm a') + " - " + moment(s.endTime).format('h:mm a')}</div>
          <div>{s.status + " - " + s.warehouse}</div>
          <div>{shifts.length > 1 ? `${shifts.length} drivers` : `${shifts.length} driver`}</div>
          {/* <Badge status={s.status === 'Worked' ? 'green' : 'blue'} text={s.status} />
          <Badge status={'gold'} text={s.warehouse} />
          <Badge status={'purple'} text={shifts.length > 1 ? `${shifts.length} drivers` : `${shifts.length} driver`} /> */}
        </div>
      )
    })
    :
    moment(date).isBefore(moment(new Date()), 'day') ? 'X' : 'no shifts'
  }

  render() {
    const { value, selectedValue, drawerItem } = this.state;
    return(
      <div>
        <Calendar
          onSelect={this.onSelect}
          onPanelChange={this.onPanelChange}
          value={value}
          dateCellRender={this.dateCellRender}
        />
        {(drawerItem === true || drawerItem._id) && (
          <EditItemDrawer
            {...editDrawerConfigs.editShift}
            title={drawerItem === true ? 'Add Shift' : 'Edit Shift'}
            item={drawerItem === true ? {} : drawerItem}
            create={drawerItem._id ? false : true}
            onClose={()=>this.setState({drawerItem: false})}
            onSave={this.handleDrawerSave}
          />
        )}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    currentUser: state.currentUser,
    errors: state.errors
  };
}

export default connect(mapStateToProps, { queryModelData })(HomeCal);
