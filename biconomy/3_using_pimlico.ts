import { createSmartAccountClient } from 'permissionless'
import { toBiconomySmartAccount } from 'permissionless/accounts'
import { createPimlicoClient } from 'permissionless/clients/pimlico'
import { createPublicClient, http } from 'viem'
import { entryPoint06Address } from 'viem/account-abstraction'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const PRIVATE_KEY = process.env.PRIVATE_KEY as string
const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY as string

if (!PRIVATE_KEY || !PIMLICO_API_KEY) {
	throw new Error('Please set your private key in a .env file')
}

const BUNDLER_RPC = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}`

const signer = privateKeyToAccount(`0x${PRIVATE_KEY}`)

console.log('signer', signer.address)

const publicClient = createPublicClient({
	transport: http('https://rpc.ankr.com/eth_sepolia'),
})

const pimlicoClient = createPimlicoClient({
	transport: http(BUNDLER_RPC),
	entryPoint: {
		address: entryPoint06Address,
		version: '0.6',
	},
})

const account = await toBiconomySmartAccount({
	client: publicClient,
	owners: [signer],
	entryPoint: {
		address: entryPoint06Address,
		version: '0.6',
	},
	index: 0n,
})

console.log('AA address', account.address)

const smartAccountClient = createSmartAccountClient({
	account,
	chain: sepolia,
	bundlerTransport: http(BUNDLER_RPC),
	paymaster: pimlicoClient,
	userOperation: {
		estimateFeesPerGas: async () => (await pimlicoClient.getUserOperationGasPrice()).fast,
	},
})

console.log('AA address', smartAccountClient.account.address)

// const txHash = await smartAccountClient.sendTransaction({
// 	to: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
// 	value: parseEther('0.1'),
// })
