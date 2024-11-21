import _ from 'lodash'
import { createServer } from 'node:http'


const largeDataset = Array.from({ length: 1e4 }, (_, id) => ({
    id,
    name: `User ${id}`,
    isActive: id % 2 === 0,
}));

function issueRoute() {
    const clonedData = _.cloneDeep(largeDataset);

    const activeUsers = _.filter(clonedData, { isActive: true });

    const transformedUsers = _.map(activeUsers, (user) => ({
        ...user,
        name: user.name.toUpperCase(),
    }));
    return transformedUsers;
}

function noIssueRoute() {
    const transformedUsers = largeDataset
        .filter((user) => user.isActive)
        .map((user) => ({
            ...user,
            name: user.name.toUpperCase(),
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
