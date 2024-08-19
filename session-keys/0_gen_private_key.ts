import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

function main() {
	const sessionPrivateKey = generatePrivateKey()
	console.log('sessionPrivateKey', sessionPrivateKey)

	const account = privateKeyToAccount(sessionPrivateKey)

	console.log('account', account.address)
}

main()
