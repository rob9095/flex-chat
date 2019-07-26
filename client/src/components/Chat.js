import React, { Component } from 'react'
import { Input, Form, Button, Skeleton, List } from 'antd'
import InfiniteList from './InfiniteList';
import moment from 'moment';

import io from 'socket.io-client';

class Chat extends Component {
  _socket = io.connect('http://localhost:8080', { path: '/api/chat/listen' });
  constructor(props) {
    super(props)
    this.state = {
      message: '',
      lastMessage: {},
    }
  }

  componentDidMount() {
    this._socket.on('messageSaved', ({lastMessage}) => {
      console.log({lastMessage})
      this.setState({lastMessage})
    })
    this._socket.on('userTyping', ({ user, message }) => {
      console.log({ user, message })
      this.setState({
        userTyping: {
          user,
          message
        }
      })
    })
    this._socket.on('userStopTyping', () => {
      this.setState({
        userTyping: null
      })
    })
  }

  handleMessageSend = () => {
    let { message } = this.state
    if (!message) {
      alert('No message!')
      return
    }
    this.setState({
      submitLoading: true
    })
    this._socket.emit("newMessage", {message, user: this.props.currentUser.user})
    setTimeout(()=>{
      this.setState({message: '', submitLoading: false})
    },250) 
  }

  handleTypeStop = (message) => {
    //wait 1 second, compare the recent message to the message in state, stop typing if they are the same
    setTimeout(()=>{
      if (message === this.state.message) {
        this._socket.emit("stopTyping", {})  
      }
    },1000)
  }

  handleInputChange = (e) => {
    console.log({target: e.which})
    let message = e.target.value
    this.setState({ message, })
    if (message.length) {
      this._socket.emit("typing", {message, id: this.props.currentUser.user.id})
      this.handleTypeStop(message)
    }
  }

  handleEnterPress = (e) => {
    e.preventDefault()
    this.handleMessageSend()
  }

  render() {
    return(
      <div className="full-pad contain" style={{height: '100%'}}>
        <InfiniteList
          lastItem={this.state.lastMessage}
          //height={200}
          id="chat-log"
          sortColumn="createdAt"
          sortDir="ascending"
          queryModel="ChatMessage"
          populateArray={[{ path: 'user' }]}
          noMoreText={'All Messages Loaded'}
          renderItem={(item) =>
            <List.Item
              key={item._id}
              id={item._id}
            >
              <List.Item.Meta
                description={
                  <div className="flex space-between">
                    <span>{item.message}</span>
                  {moment(item.createdAt).fromNow()}
                  </div>
                }
              />
            </List.Item>
          }
        />
        <div>
          {this.state.userTyping && (
            this.state.userTyping.user.email + ' typing'
          )}
        </div>
        <div>
          <Form.Item>
            <Input.TextArea onPressEnter={this.handleEnterPress} placeholder={'Your Message'} onChange={this.handleInputChange} value={this.state.message} />
          </Form.Item>
          <Form.Item style={{textAlign: 'right'}}>
            <Button htmlType="submit" loading={this.state.submitLoading} onClick={this.handleMessageSend} type="primary">
              Send
            </Button>
          </Form.Item>
        </div>
      </div>
    )
  }
}

export default Chat