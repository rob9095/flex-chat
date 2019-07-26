import React from 'react';
import { apiCall } from '../../services/api';
import { addError } from './errors';
import { addNotification, removeNotification } from './notifications';
import { Icon } from 'antd';

export function queryModelData({model, query, sortBy, sortDirection, activePage, rowsPerPage, populateArray}){
  return dispatch => {
		return new Promise((resolve,reject) => {
			return apiCall('post', `/api/models/query`, {model, query, sortBy, sortDirection, activePage, rowsPerPage, populateArray})
			.then((res) => {
				resolve(res);
			})
			.catch(err => {
				dispatch(addNotification({
					nType: 'notification',
					id: 'fetch-error',
					icon: <Icon type="close-circle" style={{ color: 'red' }} />,
					message: err && err.message || 'Something went wrong',
					onClose: () => dispatch(removeNotification({ id: 'fetch-error', }))
				}))
				dispatch(addError(err.message));
				reject(err.message);
			})
		});
	}
}

export function deleteModelDocuments({model, data, currentUser}){
  return dispatch => {
		return new Promise((resolve,reject) => {
			return apiCall('post', '/api/models/delete', {model, data,})
			.then((res) => {
				resolve(res);
			})
			.catch(err => {
				dispatch(addError(err.message));
				reject(err.message);
			})
		});
	}
}

export function getAllModelDocuments(config){
	// in config { model, documentRef, groupBy, regex, limit }
  return new Promise((resolve,reject) => {
		return apiCall('post', '/api/models/get-all', {...config})
		.then((res) => {
			resolve(res);
		})
		.catch(err => {
			reject(err.message);
		})
	});
}

export function upsertModelDocuments({model, data, filterRefs,refUpdates,refModel}){
	return new Promise((resolve,reject) => {
		return apiCall('post', '/api/models/upsert', { model, data, filterRefs, refUpdates, refModel})
		.then((res) => {
			resolve(res);
		})
		.catch(err => {
			reject(err.message);
		})
	});
}
