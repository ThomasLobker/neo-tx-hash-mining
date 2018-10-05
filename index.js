const neon = require('@cityofzion/neon-js');

const debug = true;

const random = function () {
	const date = new Date();
	const random = neon.u.sha256(neon.u.str2hexstring(date.toISOString() + Math.random()));
	return random;
}

const mineTransactionHash = async function (account, transaction, mask, length, count) {
	const tx = new neon.tx.Transaction(transaction).addAttribute(32, '6913a4d3f4e0ffb3aad8e9f919e73b6098f4aa22').addRemark(random()).sign(account.privateKey);
	const serialized = neon.tx.serializeTransaction(tx);
	const hash = neon.tx.getTransactionHash(tx);
	const bits = parseInt(neon.u.reverseHex(hash.substr(0, length)), 16).toString(2);

	// Show the progress of searching through random transaction hashes
	if (debug) {
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`${hash} (${bits}) (${count})`);
	}

	// The last bits of the reversed hash should be equal to the zeroes in the difficulty mask
	return (bits.endsWith(mask) || bits == 0) ? tx : false
}

const createTransaction = async function (difficulty) {
	const mask = (Math.pow(2, difficulty)).toString(2).substr(1);
	const hex = (Math.pow(2, difficulty) - 1).toString(16);
	const length = (hex.length % 2) ? `0${hex}`.length : `${hex}`.length

	console.log(`Mining hash for transaction with difficulty [${difficulty}] mask [${mask}] hex [${hex}] length [${length}]`);

	const account = new neon.wallet.Account('93f734cc7cd911b7eca6439943cb7a03f34b6c41801ee07355d531ea6c39164a');

	const invoke = neon.sc.createScript({
		scriptHash: '6913a4d3f4e0ffb3aad8e9f919e73b6098f4aa22',
		operation: 'neo-tx-hash-mining',
		args: [
			'6913a4d3f4e0ffb3aad8e9f919e73b6098f4aa22'
		]
	});

	const transaction = {
		type: 209,
		version: 1,
		script: invoke,
		gas: 0
	};

	let tx = false, count = 0;

	while (!tx) {
		tx = await mineTransactionHash(account, transaction, mask, length, count);
		count++;
	};

	const hash = neon.tx.getTransactionHash(tx);

	console.log();
}

const init = async function () {
	console.time('neo-tx-hash-mining');
	// Create a transaction and mine for a hash with difficulty level 8
	await createTransaction(8);
	console.timeEnd('neo-tx-hash-mining');
}

init();
