var { createStore, combineReducers } = require('redux')

var store = createStore(reducer, {})

module.exports = store

function reducer(state = {}, action) {
    var { type, payload } = action
    switch (type) {
        case 'SET':
            return Object.assign({}, state, payload)
        case 'START_DOWNLOADING_VIDEO':
            return Object.assign({}, state, {
                downloading: payload,
                downloadStartedAt: new Date()
            })
        case 'DOWNLOAD_COMPLETED': {
            var videos_downloaded = state.videos_downloaded || 0
            return Object.assign({}, state, {
                downloading: null,
                video: null,
                bytesDownloaded: 0,
                videos_downloaded: videos_downloaded + 1
            })
        }
        case 'BYTES_DOWNLOADED':
            var current = state.bytesDownloaded || 0
            return Object.assign({}, state, {
                bytesDownloaded: current + payload
            })
        case 'SET_CURRENT_DOWNLOAD_PROGRESS':
            return Object.assign({}, state, {
                bytesDownloaded: payload
            })
        default:
            return state
    }
}

module.exports.set = payload => {
    return {
        type: 'SET',
        payload
    }
}
module.exports.startVideoDownload = (url) => {
    return {
        type: 'START_DOWNLOADING_VIDEO',
        payload: url
    }
}

module.exports.setCurrentDownloadProgress = (p) => {
    return {
        type: 'SET_CURRENT_DOWNLOAD_PROGRESS',
        payload: p
    }
}
module.exports.bytesDownloaded = bytes => {
    return {
        type: 'BYTES_DOWNLOADED',
        payload: bytes
    }
}
module.exports.downloadCompleted = () => {
    return {
        type: 'DOWNLOAD_COMPLETED'
    }
}
