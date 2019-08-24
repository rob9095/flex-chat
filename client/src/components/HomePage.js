import React, { Component } from 'react'
import { Button, Divider } from 'antd'
import { Link } from 'react-router-dom';
import EditItemDrawer from './EditItemDrawer';
import Chat from '../components/Chat';

import io from 'socket.io-client';

const editDrawerConfigs = {
  editShift: {
    title: "Shift",
    inputs: [
      { id: 'name', text: 'Name', required: true, span: 24},
      { id: 'warehouse', text: 'Warehouse', type: 'select', options: [{ id: 'Irvine DLA9' }, { id: 'Los Angeles LAX1' }], span: 24, required: true },
      { id: 'startTime', text: 'Start Time', type: 'timepicker', config: { use12Hours: true, format: "h:mm a", minuteStep: 15 }, span: 24, required: true },
    ],
  },
}

class HomePage extends Component {
  _socket = io.connect('http://localhost:8080', { path: '/api/chat/listen' });
  constructor(props) {
    super(props)
    this.state = {
      user: null,
    }
  }

  componentDidMount() {

  }

  handleNewUser = ({id, ...user}) => {
    return new Promise(async (resolve, reject) => {
      try {
        await this.setState({ user: user[0] })
        console.log({user: this.state.user})
        resolve({status: 'success', hideAlert: true})
      } catch(err) {
        reject(err)
      }
    })
  }

  render() {
    return (
      <div className="full-pad contain flex align-items-center" style={{ height: '100%' }}>
        {this.state.user ? (
          <Chat user={this.state.user} />
        ) : (
          <div className="flex flex-col align-items-center" style={{maxWidth: 252, margin: '0 auto'}}>
            <EditItemDrawer
              submitText={'Start Chat'}
              {...editDrawerConfigs.editShift}
              title={'Start Chat'}
              item={{}}
              create={true}
              noDrawer
              onClose={() => console.log('closed..')}
              onSave={this.handleNewUser}
            />
            <div className="flex align-items-center justify-content-center" style={{minWidth: '90%'}}>
              <div className="flex align-items-center" style={{minWidth: '40%'}}>
                <Divider />
              </div>
              <div style={{margin: '0px 20px'}}>Or</div>
              <div className="flex align-items-center" style={{ minWidth: '40%' }}>
                <Divider />
              </div>
            </div>
            <div style={{minWidth: '100%'}}>
              <Link to="/signin">
                <Button block>Log in</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default HomePage