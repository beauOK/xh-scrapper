var Vantage = require('vantage')

var sequelize = require('./sequelize')
var store = require('./store')

var vantage = Vantage()

vantage.on('server_connection', function (socket) {
    var { id } = socket.client
    console.info('new client', id)
    socket.on('disconnect', () => console.info('disconnected', id))
})
vantage.on('client_keypress', () => console.log('keypress'))

vantage.command('videos')
    .option('-s, --scope', 'Scope')
    .option('-i, --incomplete', 'Incomplete')
    .action(listVideos)

vantage.command('video <id>')
    .description('Get video info.')
    .action(findVideo)

vantage.command('video delete <id>')
    .description('Deletes video')
    .action(deleteVideo)

vantage.mode('sql').delimiter('sql:').init(function (args, done) {
    this.log('SQL mode. Type exit to exit.')
    done()
}).action(function (command, done) {
    console.log('SQL', command)
    return sequelize.query(command).then(rs => rs[0]).then(rs => {
        this.log(rs)
    })
})

function listVideos(args) {
    var Video = sequelize.model('Video').scope('recent')
    return Video.all({
        where: {
            completed: !args.options.incomplete
        }
    }).then(videos => {
        var ids = videos.map(v => v.get('id'))
        return this.log(ids)
    })
}
function findVideo(args) {
    var Video = sequelize.model('Video')
    return Video.findById(args.id).then(video => {
        if (!video) return this.log('no video')
        return this.log(video.get())
    })
}
function deleteVideo(args) {
    var Video = sequelize.model('Video')
    return Video.destroy({
        where: {
            id: args.id
        }
    }).then(() => {
        return this.log('deleted', args.id)
    })
}
vantage.command('state').action(function (args, done) {
    var state = store.getState()
    var str = JSON.stringify(state, null, 2)
    this.log(str)
    done()
})
vantage.command('downloader').action(function (args, done) {
    var state = store.getState()
    var timeElapsed = (new Date() - state.downloadStartedAt) / 1000
    var speed = (state.bytesDownloaded / 1000) / timeElapsed
    var progress = state.bytesDownloaded / state.video.bytes

    var eta = 1 * timeElapsed / progress

    this.log('Speed', speed, 'kB/s')
    this.log('Time', timeElapsed, 'seconds')
    this.log('ETA', eta, 'seconds')
    done()
})

vantage.listen(4001, () => {
    console.log('Vantage listening on 4001.')
})
