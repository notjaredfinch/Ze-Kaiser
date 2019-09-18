global.Discord = require('discord.js');
global.client = new Discord.Client();
const security = require('./auth.json');

const misc = require('./misc-commands/misc');
const base = require('./base-commands/base');
const starboard = require('./misc-commands/starboard');

client.on('ready', () => {
	console.log('Connected as ' + client.user.tag);
});

client.on('message', (receivedMessage) => {
	if (receivedMessage.author === client.user) {   //Make sure the bot doesn't respond to itself, otherwise weird loopage may occur
		return;
	}

	if (receivedMessage.content.startsWith('!')) {
		processCommand(receivedMessage);
	}

	if (receivedMessage.isMentioned(client.user)) {
		const why = client.emojis.get('612697675996856362');
		if (why) {
			receivedMessage.react(why);
		}
	}
});

client.on('messageReactionAdd', (messageReaction, user) => {
	if (messageReaction.message.author === client.user) {
		return;
	}
	misc.autoReact(messageReaction);
	starboard.add(messageReaction, user);
});

client.on('messageReactionRemove', (messageReaction, user) => {
	starboard.subtract(messageReaction, user);
});

client.on('raw', packet => {
	// We don't want this to run on unrelated packets
	if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
	// Grab the channel to check the message from
	const channel = client.channels.get(packet.d.channel_id);
	// There's no need to emit if the message is cached, because the event will fire anyway for that
	if (channel.messages.has(packet.d.message_id)) return;
	// Since we have confirmed the message is not cached, let's fetch it
	channel.fetchMessage(packet.d.message_id).then(message => {
		// Emojis can have identifiers of name:id format, so we have to account for that case as well
		const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
		// This gives us the reaction we need to emit the event properly, in top of the message object
		const reaction = message.reactions.get(emoji);
		// Adds the currently reacting user to the reaction's users collection.
		if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
		// Check which type of event it is before emitting
		if (packet.t === 'MESSAGE_REACTION_ADD') {
			client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
		}
		if (packet.t === 'MESSAGE_REACTION_REMOVE') {
			client.emit('messageReactionRemove', reaction, client.users.get(packet.d.user_id));
		}
	});
});

const processCommand = (receivedMessage) => {
	try {
		let fullCommand = receivedMessage.content.substr(1) // Remove the leading character
		let splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space
		let primaryCommand = splitCommand[0] // The first word directly after the exclamation is the command
		primaryCommand = primaryCommand.toLowerCase();  //make the command lower case to eliminate case sensitivity
		let args = splitCommand.slice(1) // All other words are arguments/parameters/options for the command

		switch(primaryCommand) {
			case 'cooldudes':
				misc.cooldudes(receivedMessage);
				break;
			case 'bamboozled':
				misc.bamboozled(receivedMessage);
				break;
			case 'illegal':
				misc.illegal(receivedMessage);
				break;
			case 'addrole':
				base.addRole(receivedMessage, args);
				break;
			case 'removerole':
				base.removeRole(receivedMessage, args);
				break;
			case 'addroles':
				base.addRoles(receivedMessage, args);
				break;
			case 'removeroles':
				base.removeRoles(receivedMessage, args);
				break;
			case 'info':
				base.info(receivedMessage, args);
				break;
			case 'help':
				base.help(receivedMessage);
				break;
			case 'roles':
				base.roles(receivedMessage);
				break;
			default:
				receivedMessage.channel.send('Invalid command.');
		}
	} catch (err) {
		base.sendError(receivedMessage, err);
	}
}

bot_secret_token = security.token;

client.login(bot_secret_token);
