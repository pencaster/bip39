var arkjs = require("arkjs");
var cmdArgs = require("command-line-args");
var dict = require("./bip39");

var passphrase = "";
var address = "";
const argDefs = [
    { name: "passphrase", alias: "p", type: String },
    { name: "address", alias: "a", type: String }
];
const options = cmdArgs(argDefs);


if(!options.passphrase || !options.address)
{
	console.log("Please enter your passphrase");
	process.exit(1);
}
else
{
	passphrase = options.passphrase;
	address = options.address;
}

console.log(`Passphrase entered: ${passphrase}`);
console.log("Searching...");
dict.forEach((word, idx) => {
	var pass = passphrase + " " + word;
	var addr = ark.crypto.getAddress(ark.crypto.getKeys(pass).publicKey);
	console.log(`${idx} / ${dict.length}`);
	if(addr == address)
	{
		console.log(`Missing word found: ${word}`);
		process.exit(1);
	}
});