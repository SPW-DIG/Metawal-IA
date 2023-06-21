import {RedisQueue} from "./queue";

jest.setTimeout(300000);

test('Listen once', async () => {

    const queue = new RedisQueue();
    await queue.redis.connect();

    await queue.createConsumerGroup();

    const event = {
        "type": "test"
    }

    await queue.publish(event)


    const receivedEvent = await queue.listenOnce();

    receivedEvent
})
