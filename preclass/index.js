import _ from 'lodash'
import { writeFile } from 'node:fs/promises'
import { Session } from 'node:inspector/promises'
import { createServer } from 'node:http'

function cpuProfiling() {
    let _session
    return {
        async start() {
            _session = new Session();
            _session.connect();
            await _session.post('Profiler.enable')
            await _session.post('Profiler.start')
            console.log('started CPU profiling...');
        },
        async stop() {
            console.log('Stopping CPU profiling...');
            await _session.post('NodeTracing.stop')

            const { profile } = await _session.post('Profiler.stop')
            const profileFile = `cpu-profile-${Date.now()}.cpuprofile`;
            await writeFile(profileFile, JSON.stringify(profile));
            console.log(`CPU profile saved as ${profileFile}`);
            _session.disconnect();
        }
    }
}

const largeDataset = Array.from({ length: 1e4 }, (_, id) => ({
    id,
    name: `User ${id}`,
    isActive: id % 2 === 0,
}));

function issueRoute() {
    const clonedData = _.cloneDeep(largeDataset);
    // const clonedData = (largeDataset);

    const activeUsers = _.filter(clonedData, { isActive: true });
    // const activeUsers = clonedData.filter((user) => user.isActive) // Native filter

    const transformedUsers = _.map(activeUsers, (user) => ({
        ...user,
        name: user.name.toUpperCase(),
    }));
    // const transformedUsers = activeUsers.map((user) => ({
    //     ...user,
    //     name: user.name.toUpperCase(), // Transform
    // }));
    return transformedUsers;
}

function noIssueRoute() {
    const transformedUsers = largeDataset
        .filter((user) => user.isActive) // Native filter
        .map((user) => ({
            ...user,
            name: user.name.toUpperCase(), // Transform
        }));
    return transformedUsers;
}

createServer(
    function routes(req, res) {
        if (req.url === '/issue') {
            const transformedUsers = issueRoute();
            res.end(JSON.stringify(transformedUsers));
            return
        }


        if (req.url === '/no-issue') {
            const transformedUsers = noIssueRoute();
            res.end(JSON.stringify(transformedUsers));
            return
        }
        res.writeHead(404);
        res.end('Not Found');
        return
    })
    .listen(3000)
    .once('listening', function onListening() {
        console.log('Server started on http://localhost:3000');
    });

const { start, stop } = cpuProfiling();
start();

const exitSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
exitSignals.forEach(signal => {
    process.once(signal, async () => {
        await stop();
        process.exit(0);
    });
});


