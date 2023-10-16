import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import fs from 'fs';
import Canvas from 'canvas';
import path from 'path';
import { ChatInputCommandInteraction } from 'discord.js';

interface Player {
	id: string;
	name: string;
	wordOfTheDay: string;
	timeChanged: number;
	if_finished: boolean;
	words: string[];
	guesses: string[];
	score: number;
	total_games: number;
}

const players: Player[] = require('../data/wordle.json').players;
const words: string[] = require('../data/words.json').words;

const get_write_path = (relative_path: string) => path.join(__dirname, relative_path);

@ApplyOptions<Command.Options>({
	description: 'Play a wordle game!'
})
export class WordleCommand extends Command {
	private guesses: string[] | undefined;

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((subcommand) => subcommand.setName('play').setDescription('Picks a new word if not selected, starts a new game.'))
				.addSubcommand((subcommand) =>
					subcommand
						.setName('guess')
						.setDescription('Guess a word.')
						.addStringOption((option) => option.setName('word').setDescription('The word to guess.').setRequired(true))
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const userID = interaction.user.id;
		// check if userID exists in players value

		let player: Player | undefined = undefined;

		for (let i = 0; i < players.length; i++) {
			if (players[i].id === userID) {
				player = players[i];
			}
		}

		if (player === undefined) {
			// New user - add user to players
			const word = words[Math.floor(Math.random() * words.length)];

			/**
			 * @type {Player}
			 */
			const NewPlayer: Player = {
				id: userID,
				name: interaction.user.username,
				wordOfTheDay: word,
				timeChanged: Date.now(),
				if_finished: false,
				words: [word],
				guesses: [],
				score: 0,
				total_games: 0
			};
			// add userID: NewPlayer to players
			player = NewPlayer;
			players.push(player);
			fs.writeFileSync(get_write_path('../data/wordle.json'), JSON.stringify({ players }, null, 4));
		} else {
			// user exists
			console.log('user exists');
			const timeDiff = Math.abs(new Date().valueOf() - new Date(player.timeChanged).valueOf());
			// If day has changed, select new word and reset game state
			if (timeDiff > 86400000 || player.wordOfTheDay === '' || player.wordOfTheDay === undefined) {
				console.log('Picking a new word');
				player.wordOfTheDay = words[Math.floor(Math.random() * words.length)];
				player.timeChanged = Date.now();
				player.if_finished = false;
				player.words.push(player.wordOfTheDay);
				player.guesses = [];
			}
			fs.writeFileSync(get_write_path('../data/wordle.json'), JSON.stringify({ players }, null, 4));
		}

		const selectedWord = player.wordOfTheDay;
		// if timeChanged is more than a day ago, pick a new word
		console.log('Selected Word: ' + selectedWord);
		if (!interaction.channel) return;

		if (interaction.options.data.length === 0) {
			await interaction.channel.send('Invalid Usage!\nUsage: `/wordle play`');
			return;
		} else if (interaction.options.getSubcommand() === 'play') {
			this.guesses = player.guesses;
			// Start a new game
			console.log('Selected word (play): ' + selectedWord);
			// console.log(interaction);
			this.LoadGame(interaction, player, player.guesses, player.wordOfTheDay);
		} else if (interaction.options.getSubcommand() === 'guess') {
			// Guess a word
			// console.log("Guess: " + interaction.options.getString("word"));
			if (interaction.options.getString('word') === undefined) {
				await interaction.channel.send('Invalid Usage!\nUsage: `/wordle guess <word>`');
				throw new Error('Invalid Usage');
			} else {
				if (this.guesses === undefined) {
					this.guesses = player.guesses;
				}

				const guess = interaction.options.getString('word', true).toLowerCase();
				if (guess.length !== 5) {
					await interaction.channel.send('Invalid Usage! Use a 5 lettered word \nUsage: `/wordle guess <word>`');
					throw new Error('Invalid Usage');
				} else {
					if (!player.if_finished) {
						console.log('Guess: ' + guess);
						console.log('guesses: ' + this.guesses);
						this.guesses.push(guess);
						// update guesses in players
						player.guesses = this.guesses;
						const editedPlayers = players;
						fs.writeFileSync(get_write_path('../data/wordle.json'), JSON.stringify({ players: editedPlayers }, null, 4));
					}
					// update guesses in file
					// console.log("gueess: " + this.guesses);
					// console.log("player.guesses: " + player.guesses);
					this.LoadGame(interaction, player, this.guesses, player.wordOfTheDay);
				}
			}
		}
	}

	private setWin(player: Player) {
		if (!player) return;
		player.if_finished = true;
		player.total_games++;
		player.score++;
		const editedPlayers = players;
		fs.writeFileSync(get_write_path('../data/wordle.json'), JSON.stringify({ players: editedPlayers }, null, 4));
	}

	private setLoss(player: Player) {
		if (!player) return;
		player.if_finished = true;
		player.total_games++;
		const editedPlayers = players;
		fs.writeFileSync(get_write_path('../data/wordle.json'), JSON.stringify({ players: editedPlayers }, null, 4));
	}

	private eachLetterCount(answer: string) {
		const letters = answer.split('');
		let letterCount: Record<string, number> = {};

		letters.forEach((letter) => {
			if (letterCount[letter]) {
				letterCount[letter]++;
			} else {
				letterCount[letter] = 1;
			}
		});
		return letterCount;
	}

	private getAnswer(answer: string, guess: string) {
		const max_match = this.eachLetterCount(answer);
		let match: Record<string, number> = {};

		const colors: number[] = Array(5).fill(0);
		if (guess === undefined) {
			return colors;
		}

		// Yellow = correct letter at different spot
		for (let i = 0; i < answer.length; i++) {
			if (answer.includes(guess.charAt(i))) {
				const char = guess.charAt(i);
				if (match[char]) {
					match[char]++;
				} else {
					match[char] = 1;
				}
				colors[i] = 3;
			}
		}
		// Green = correct letter
		for (let i = 0; i < answer.length; i++) {
			if (guess.charAt(i) === answer.charAt(i)) {
				colors[i] = 2;
			}
		}
		// console.log(max_match);
		// console.log(match);
		// console.log(colors);
		for (let i = answer.length - 1; i >= 0; i--) {
			// console.log("i: " + i);
			if (colors[i] === 0) {
				colors[i] = 1;
			}
			if (colors[i] === 3) {
				const diff = match[guess.charAt(i)] - max_match[guess.charAt(i)];
				// console.log("diff for " + guess.charAt(i) + ": " + diff);
				if (diff > 0) {
					colors[i] = 1;
					match[guess.charAt(i)]--;
				}
			}
		}
		return colors;
	}

	private async LoadGame(msg: ChatInputCommandInteraction, player: Player, guesses: string[], answer: string) {
		if (!player || !msg.channel) return;
		// make a blank canvas
		const canvas = Canvas.createCanvas(330, 397);
		const context = canvas.getContext('2d');

		const background = await Canvas.loadImage(get_write_path('../data/wordle_images/blank_box.png'));
		context.drawImage(background, 0, 0, canvas.width, canvas.height);

		context.font = '42px Clear Sans, Helvetica Neue, Arial, sans-serif';
		context.textAlign = 'center';
		context.fillStyle = '#d7dadc';

		const absentSquare = await Canvas.loadImage(get_write_path('../data/wordle_images/empty_box.png'));
		const emptySquare = await Canvas.loadImage(get_write_path('../data/wordle_images/grey_box.png'));
		const greenSquare = await Canvas.loadImage(get_write_path('../data/wordle_images/green_box.png'));
		const yellowSquare = await Canvas.loadImage(get_write_path('../data/wordle_images/yellow_box.png'));
		const square_arr = [absentSquare, emptySquare, greenSquare, yellowSquare];
		let square = emptySquare;

		const squareSize = 62;
		let rowOffset = 0;
		let buffer = 0;

		for (let j = 0; j < 6; j++) {
			const imageNums = this.getAnswer(answer, guesses[j]);
			for (let i = 0; i < 5; i++) {
				// eslint-disable-next-line no-undef
				const imageNumber = imageNums[i];
				square = square_arr[imageNumber];

				context.drawImage(square, i * squareSize + buffer, rowOffset, squareSize, squareSize);
				if (guesses[j] != undefined) {
					context.fillText(guesses[j].charAt(i), squareSize / 2 + buffer + squareSize * i, rowOffset + 42);
				}
				buffer += 5;
			}
			buffer = 0;
			rowOffset += squareSize + 5;
		}
		// return the canvas
		// console.log(msg);
		// if last guess is correct, send message
		const lastGuess = guesses[guesses.length - 1];
		if (player.if_finished) {
			msg.channel.send(`${player.name} has already finished the game! Come back tomorrow for a new word!`);
		} else {
			if (lastGuess === answer) {
				msg.channel.send(`${player.name} you won! Come back tomorrow for a new word!`);
				this.setWin(player);
			}
			if (!player.if_finished && guesses.length === 6) {
				// 6 guesses have been made, setLose
				msg.channel.send(`${player.name} you lost!:frowning2: Try again tomorrow `);
				this.setLoss(player);
			}
		}
		msg.reply({
			files: [{ attachment: canvas.toBuffer(), name: 'wordle.png' }]
		});
		// msg.message.author.send({ files: [{ attachment: canvas.toBuffer(), name: "wordle.png" }] });
	}
}
