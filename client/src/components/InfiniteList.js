import React, { Component } from 'react';
import { List, message, Avatar, Spin, Skeleton } from 'antd';
import { connect } from 'react-redux';
import { queryModelData } from '../store/actions/models';
import { addNotification, removeNotification } from '../store/actions/notifications';

import InfiniteScroll from 'react-infinite-scroller';

class InfiniteListExample extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: [],
      loading: false,
      loadingRows: [],
      hasMore: true,
      rowsPerPage: 10,
      activePage: 1,
      totalPages: 0,
      skip: 0,
      column: this.props.sortColumn || this.props.itemTitle || 'sku',
      direction: this.props.sortDir || 'ascending',
      query: [],
      populateArray: [],
      pagination: {
        position: 'bottom',
        current: 1,
        total: 0,
        defaultPageSize: 10,
        pageSize: 10,
        hideOnSinglePage: true,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ['10', '50', '100', '250', '500'],
        size: 'small',
        onChange: (requestedPage, requestedRowsPerPage) => {
          this.handleDataFetch({ requestedPage, requestedRowsPerPage })
        },
        onShowSizeChange: (requestedPage, requestedRowsPerPage) => {
          this.handleDataFetch({ requestedPage, requestedRowsPerPage })
        },
      },
    }
  }

  async componentDidMount() {
    await this.handleDataFetch()
    if (this.props.isReverse) {
      let list = document.getElementById('infite-list')
      if (list) {
        list.scrollTop = list.scrollHeight;
      }
    }
  }

  async componentDidUpdate(prevProps) {
    if (!Object.is(prevProps.lastItem, this.props.lastItem)) {
      console.log('last item changed!')
      await this.setState({
        data: [...this.state.data, this.props.lastItem],
      })
      this.props.fetchOnChange && this.handleDataFetch({requestedPage: 1})
      //find the new message and scroll to it
      let m = document.getElementById('infite-list')
      if (m) {
        m.scrollTop = m.scrollHeight;
      }
    }
  }

  handleDataFetch = async (config) => {
    let { requestedPage, requestedRowsPerPage, rowIds } = config || {}
    let rowId = Array.isArray(rowIds) ? rowIds[0] : null
    let skeletons = [1,2,3,4,5].map(n=>({_id: n+'skel', docType:'skeleton'}))
    await this.setState({
      ...rowId ? { loadingRows: [...rowIds] } : { loading: true },
      data: [...this.state.data, ...skeletons]
    })
    requestedPage = requestedPage || this.state.activePage;
    requestedRowsPerPage = requestedRowsPerPage || this.state.rowsPerPage;
    let populateArray = this.props.populateArray.map(pC => {
      const foundPc = this.state.populateArray.find(p => p.path === pC.path)
      if (foundPc) {
        return ({
          ...pC,
          ...foundPc
        })
      } else {
        return ({ ...pC })
      }
    })
    let query = this.props.filters ? [...this.state.query, ...this.props.filters] : this.state.query
    await this.props.queryModelData({
      model: this.props.queryModel,
      query,
      sortBy: this.state.column,
      sortDirection: this.state.direction,
      activePage: requestedPage, 
      rowsPerPage: requestedRowsPerPage,
      populateArray
    })
      .then(({ data, activePage, totalPages, rowsPerPage, skip }) => {
        const hasMore = data.length > 0 ? true : false
        data = this.props.isReverse ? data.reverse() : data
        //data = activePage === 1 ? data : [...this.state.data.filter(d=>d.docType !== 'skeleton')]
        data = this.props.isReverse ? [...data,...this.state.data] : [...this.state.data, ...data]
        data = data.reduce((acc, cv) => acc.map(doc => doc._id).indexOf(cv._id) !== -1 ? [...acc] : [...acc, cv], []).filter(d => d.docType !== 'skeleton')

        this.setState({
          skip,
          data,
          activePage,
          totalPages,
          rowsPerPage,
          hasMore,
          pagination: {
            ...this.state.pagination,
            current: activePage,
            total: rowsPerPage * totalPages,
            pageSize: rowsPerPage,
          },
        })
      })
      .catch(err => {
        message.error('Error getting data');
        console.log(err)
      })
    this.setState({
      ...rowId ? { loadingRows: [] } : { loading: false }
    })
  }

  handleInfiniteOnLoad = async () => {
    console.log('handle inf load hit')
    await this.setState({
      loading: true,
      activePage: this.state.activePage + 1,
    });
    await this.handleDataFetch()
    if (!this.state.hasMore) {
      console.log('no more messages!')
      // this.props.id && message.config({
      //   getContainer: () => document.getElementById(this.props.id),
      // });
      // message.warning(this.props.noMoreText || 'All records loaded',8000);
      this.props.addNotification({
        nType: 'notification',
        id: 'scan-log-no-more',
        message: this.props.noMoreText || 'All records loaded',
        onClose: () => this.props.removeNotification({ id: 'scan-log-no-more', })
      })
      this.setState({
        loading: false,
      });
      return;
    }
  }

  render() {
    return (
      <div>
        {'Chat Items:' + this.state.data.length}
        <div id={'infite-list'} className="contain" style={{ height: this.props.height || 300, }}>
          <InfiniteScroll
            initialLoad={false}
            pageStart={0}
            loadMore={this.handleInfiniteOnLoad}
            hasMore={!this.state.loading && this.state.hasMore}
            useWindow={false}
            isReverse={true}
            threshold={1}
          >
            <List
              size="small"
              dataSource={this.state.data}
              renderItem={item =>
                this.props.renderItem ?
                  this.props.renderItem(item, this.state.loading)
                  :
                  <List.Item key={item._id}>
                    <Skeleton paragraph={{ rows: 1, width: '100%' }} title={false} loading={this.state.loading} active>
                      <List.Item.Meta
                        style={{ alignItems: 'center' }}
                        avatar={<Avatar>{this.props.currentUser.user.email[0]}</Avatar>}
                        title={this.props.itemTitle.split('.').reduce((p, c) => p && p[c] || null, item)}
                        description={this.props.itemDescription.split('.').reduce((p, c) => p && p[c] || null, item)}
                      />
                      <div>
                        {this.props.itemContent.split('.').reduce((p, c) => p && p[c] || null, item)}
                      </div>
                    </Skeleton>
                  </List.Item>
              }
            >
              {/* {this.state.loading && this.state.hasMore && (
                <div className="flex justify-content-center align-items-center" style={{width: '100%', height: '100%'}}>
                  <Spin />
                </div>
              )} */}
            </List>
          </InfiniteScroll>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentUser: state.currentUser,
    errors: state.errors,
  };
}

export default connect(mapStateToProps, { queryModelData, addNotification, removeNotification })(InfiniteListExample);
