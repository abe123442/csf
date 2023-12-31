import {
	EmbedBuilder,
	CommandInteraction,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
	InteractionReplyOptions,
	ComponentType,
	InteractionResponse,
	InteractionCollector,
	ButtonInteraction
} from 'discord.js';

export class DiscordScroll {
	protected _active = false;
	protected _used = false;
	protected _message: InteractionResponse | null = null;
	protected _collector: InteractionCollector<ButtonInteraction> | null = null;

	protected _buttons = {
		left: new ButtonBuilder().setCustomId('scrollLeft').setEmoji('⬅️').setStyle(ButtonStyle.Secondary),
		right: new ButtonBuilder().setCustomId('scrollRight').setEmoji('➡️').setStyle(ButtonStyle.Secondary),
		delete: new ButtonBuilder().setCustomId('scrollDelete').setEmoji('🚮').setStyle(ButtonStyle.Danger)
	};

	protected _embed: EmbedBuilder | null = null;
	protected _pagenum = 0;
	protected _pages: EmbedBuilder[] = [];

	/**
	 * Constructor for the Scroller
	 */
	constructor(pages: EmbedBuilder[]) {
		this.pages = pages;
		this._embed = this.currentPage;
	}

	/**
	 * The pages of the Scroller.
	 */
	get pages() {
		return this._pages;
	}

	/**
	 * @param value The array of Embeds
	 */
	set pages(value: EmbedBuilder[]) {
		// type check the array
		if (!(value instanceof Array)) {
			throw new TypeError('DiscordScroll.pages expected an array.');
		} else if (value.length == 0) {
			throw new TypeError('DiscordScroll.pages expected at least one element in the array.');
		} else if (!value.every((e) => e instanceof EmbedBuilder)) {
			throw new TypeError('DiscordScroll.pages expected an array of EmbedBuilders.');
		}

		this._pages = value;
	}

	/**
	 * The current shown Embed.
	 */
	get embed() {
		return this._embed;
	}

	/**
	 * The current page.
	 */
	get currentPage() {
		return this.pages[this._pagenum];
	}

	/**
	 * The message id of the scroller
	 */
	get messageID() {
		return this._message?.id;
	}

	/**
	 * Sends the Scroller
	 * @param interaction The CommandInteraction
	 * @returns {Promise<Message>}
	 */
	async send(interaction: CommandInteraction): Promise<InteractionResponse> {
		// error checking
		if (this._used) {
			throw new Error('This Scroller has already been sent.');
		} else if (!(interaction instanceof CommandInteraction)) {
			throw new TypeError('DiscordScroll.send expected a CommandInteraction for first parameter.');
		}

		// send the reply
		const replyOptions: InteractionReplyOptions = {
			embeds: [this.embed!],
			components: [this._getButtonRow],
			fetchReply: true
		};

		const replyMessage = await interaction.reply(replyOptions);
		this._active = true;
		this._used = true;
		this._message = replyMessage;

		this._setupCollector(replyMessage);
		return replyMessage;
	}

	/**
	 * Disables the scroller, as if it has ended.
	 */
	disable() {
		this._collector?.stop();
	}

	/**
	 * Gets the Button Row, updating the button status if needed.
	 */
	get _getButtonRow() {
		if (this._pagenum === 0) {
			this._buttons.left.setDisabled(true);
		} else {
			this._buttons.left.setDisabled(false);
		}

		if (this._pagenum === this._pages.length - 1) {
			this._buttons.right.setDisabled(true);
		} else {
			this._buttons.right.setDisabled(false);
		}

		return new ActionRowBuilder<ButtonBuilder>().addComponents(this._buttons.left, this._buttons.right, this._buttons.delete);
	}

	/**
	 * Sets up the Button Collector
	 * @param {InteractionResponse} message The message to attach it to.
	 */
	async _setupCollector(message: InteractionResponse) {
		const buttonCollector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 120000,
			idle: 30000,
			max: 1000
		});

		this._collector = buttonCollector;

		buttonCollector.on('collect', (buttonInt) => {
			this._scroll(buttonInt);
		});

		buttonCollector.on('end', () => {
			this._deactivate();
		});
	}

	/**
	 * Scrolls the scroller.
	 */
	async _scroll(buttonInt: ButtonInteraction) {
		if (buttonInt.customId === 'scrollLeft' && this._pagenum > 0) {
			this._pagenum -= 1;
			await this._update(buttonInt);
		} else if (buttonInt.customId === 'scrollRight' && this._pagenum < this.pages.length - 1) {
			this._pagenum += 1;
			await this._update(buttonInt);
		} else if (buttonInt.customId === 'scrollDelete') {
			this._active = false;
			await this._message?.delete();
		}
	}

	/**
	 * Updates the scroller.
	 * @param buttonInt The Button Interaction.
	 * @protected
	 */
	async _update(buttonInt: ButtonInteraction) {
		this._embed = this.currentPage;
		await buttonInt.update({
			embeds: [this.embed!],
			components: [this._getButtonRow]
		});
	}

	/**
	 * Deactivates the scroller.
	 * @protected
	 */
	async _deactivate() {
		if (this._message != null && this._active) {
			this._active = false;
			await this._message.edit({ components: [] });
		}
	}
}

module.exports = {
	DiscordScroll
};
