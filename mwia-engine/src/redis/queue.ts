/*


class RedisQueue:
"""
Client to the local redis queue exposed in the cage.
"""

def __init__(
  self,
  host=default_settings.redis_host,
  port=default_settings.redis_port,
  consumer_name="consummer-0",
):
self.consumer_group = "consummers"
self.consumer_name = consumer_name
self.redis = redis.Redis(host, port, db=0)

def create_consummer_group(self) -> None:
  """
Create the consummer group if it does not exist
"""
try:
self.redis.xgroup_create("events", self.consumer_group, mkstream=True)
except redis.exceptions.ResponseError as error:
if str(error).startswith("BUSYGROUP"):
pass
else:
raise error

def destroy_consummer_group(self) -> None:
  """
Remove the consummer group if it exists
"""
self.redis.xgroup_destroy("events", self.consumer_group)

def publish(self, data: dict, create_consumer_group=False) -> str:
  """
publish an event to the redis queue

Args:
  data (dict): event data to publish
create_consumer_group (bool, optional): create the consummer group if it does not exist. Defaults to True.

  Returns:
str: message id
"""

if create_consumer_group:
self.create_consummer_group()

msg_id = self.redis.xadd(
  "events",
  {
    "msg_data": json.dumps(
      data | {"msg_dt": datetime.datetime.utcnow().isoformat()}
    ),
  },
  maxlen=1000,
  approximate=True,
)
return msg_id

def listen_once(self, timeout=120):
"""
Listen to the redis queue until one message is obtained, or timeout is reached
  :param timeout: timeout delay in seconds
:return: the received message, or None
"""
logging.debug("Waiting for message...")
messages = self.redis.xreadgroup(
  "consummers",
  self.consumer_name,
  {"events": ">"},
  noack=True,
  count=1,
  block=timeout * 1000,
)
if messages:
message = [
  json.loads(msg_data.get(b"msg_data", "{}"))
| {"msg_id": msg_id.decode()}
for msg_id, msg_data in messages[0][1]
  ][0]
msg_id = message["msg_id"]
logging.debug(f"Received message {msg_id}...")
return message
return None

def listen(self, processor, timeout=60):
"""
Listen to the redis queue until the timeout is reached, and process every incoming message in that interval
with the provided processor function
  :param processor: the function to process incoming messages
  :param timeout: timeout in seconds
:return:
"""
while True:
evt = self.listen_once(timeout)
if evt:
processor(evt)


 */

import { commandOptions, createClient, RedisClientType } from 'redis';

const CONSUMER_GROUP_NAME = 'consumers';

export class RedisQueue {
    private consumerGroup: string;
    private consumerName: string;
    private _redis: RedisClientType;

    constructor(consumerGroup: string = CONSUMER_GROUP_NAME, consumerName: string = 'consumer-0') {
        this.consumerGroup = consumerGroup;
        this.consumerName = consumerName;

        this._redis = createClient();

        this._redis.on('error', err => console.log('Redis Client Error', err));
    }

    async createConsumerGroup() {
        try {
            await this._redis.xGroupCreate('events', this.consumerGroup, '0', { MKSTREAM: true });
        } catch (err) {
            if (err.toString().indexOf('BUSYGROUP') >= 0) return;
            else throw err;
        }
    }

    async destroyConsumerGroup() {
        await this._redis.xGroupDestroy('events', this.consumerGroup);
    }

    async listenOnce(timeout: number = 120000): Promise<{
        id: string;
        message: Record<string, string>;
    } | undefined> {
        const messages = await this._redis.xReadGroup(
            commandOptions({ isolated: true }),
            this.consumerGroup,
            this.consumerName,
            { key: 'events', id: '>' },
            { BLOCK: timeout, COUNT: 1, NOACK: true }
        );
        if (messages) {
            return messages[0].messages[0];
        } else return undefined;
    }




    /*
        def publish(self, data: dict, create_consumer_group=False) -> str:
        """
        publish an event to the redis queue

        Args:
            data (dict): event data to publish
            create_consumer_group (bool, optional): create the consummer group if it does not exist. Defaults to True.

        Returns:
            str: message id
        """

        if create_consumer_group:
            self.create_consummer_group()

        msg_id = self.redis.xadd(
            "events",
            {
                "msg_data": json.dumps(
                    data | {"msg_dt": datetime.datetime.utcnow().isoformat()}
                ),
            },
            maxlen=1000,
            approximate=True,
        )
        return msg_id
     */


    async publish(data: any, createGroup: boolean = false) {
        if (createGroup)
            this.createConsumerGroup();

        return this._redis.xAdd("events", "*", data)
    }

    get redis(): RedisClientType {
        return this._redis;
    }
}
