import { http, createPublicClient, createWalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

import 'dotenv/config'
import { getExecuteScheduledTransferAction } from '@rhinestone/module-sdk'

const PRIVATE_KEY = process.env.PRIVATE_KEY as string

if (!PRIVATE_KEY) {
	throw new Error('Please set your project id and private key in a .env file')
}

const account = privateKeyToAccount(`0x${PRIVATE_KEY}`)

const client = createWalletClient({
	chain: sepolia,
	account,
	transport: http(),
})

const publicClient = createPublicClient({
	chain: sepolia,
	transport: http(),
})

const action = getExecuteScheduledTransferAction({
	jobId: 1,
})

console.log('Actoin:', action)

const txHash = await client.sendTransaction({
	to: action.target,
	value: action.value as bigint,
	data: action.callData,
})

const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

console.log(receipt)
