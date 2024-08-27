import { createSmartAccountClient } from '@biconomy/account'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const BICONOMY_PAYMASTER_API_KEY = process.env.BICONOMY_PAYMASTER_API_KEY as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string

if (!BICONOMY_PAYMASTER_API_KEY || !PRIVATE_KEY) {
	throw new Error('Please set your project id and private key in a .env file')
}

const BUNDLER_RPC = 'https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44'

const signer = privateKeyToAccount(`0x${PRIVATE_KEY}`)
console.log('signer', signer.address)

const client = createWalletClient({
	account: signer,
	chain: sepolia,
	transport: http(BUNDLER_RPC),
})

const account = await createSmartAccountClient({
	signer: client,
	biconomyPaymasterApiKey: BICONOMY_PAYMASTER_API_KEY,
	bundlerUrl: BUNDLER_RPC,
})

const address = await account.getAccountAddress()

console.log('AA adddress', address)
