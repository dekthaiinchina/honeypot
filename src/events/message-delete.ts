import { GatewayDispatchEvents } from "discord-api-types/v10";
import type { EventHandler } from "./events";
import { setSubscribedChannelCache } from "../utils/cache";

const handler: EventHandler<GatewayDispatchEvents.MessageDelete> = {
    event: GatewayDispatchEvents.MessageDelete,
    handler: async ({ data: message, api, applicationId, redis, db }) => {
        if (!message.guild_id) return;
        try {
            await db.unsetHoneypotMsg(message.guild_id, message.id);

            // same thing as in message-create, if we have a proxy ws and the deleted message is not in the honeypot channel,
            // we should still cache that this is not the right channel so we dont get unnessary spam
            if (process.env.HAS_PROXY_WS && redis && message.guild_id) {
                const config = await db.getConfig(message.guild_id);
                if (!config || !config.action || config.honeypot_channel_id === message.channel_id) return;
                setSubscribedChannelCache(message.guild_id, [config.honeypot_channel_id || "none"], redis);
            }

        } catch (err) {
            console.error(`Error with MessageDelete handler: ${err}`);
        }
    }
};

export default handler;
