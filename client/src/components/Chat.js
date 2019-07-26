import React, { Component } from 'react'
import {Button, Skeleton, List } from 'antd'
import InfiniteList from './InfiniteList';

class Chat extends Component {
  constructor(props) {
    super(props)
    this.state = {
      
    }
  }
  render() {
    return(
      <div>
        <InfiniteList
          height={'100%'}
          id="chat-log"
          sortColumn="createdOn"
          sortDir="descending"
          queryModel="Chat"
          populateArray={[{ path: 'user' }]}
          noMoreText={'All Messages Loaded'}
          renderItem={(item, itemLoading) =>
            <List.Item
              key={item._id}
              style={{
                borderBottom: '0px',
                background: '#fff',
                ...itemLoading ? { padding: 10, height: 47, paddingTop: 25 } : { padding: 0 },
                margin: '10px 0px',
              }}
            >
              <Skeleton paragraph={{ rows: 1, width: '100%' }} title={false} loading={itemLoading} active>
                <List.Item.Meta
                  description={item.message}
                />
              </Skeleton>
            </List.Item>
          }
        />
      </div>
    )
  }
}

export default Chat