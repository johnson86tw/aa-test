import { createSmartAccountClient, ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import { signerToEcdsaKernelSmartAccount } from 'permissionless/accounts'
import { createPimlicoBundlerClient, createPimlicoPaymasterClient } from 'permissionless/clients/pimlico'
import { createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import 'dotenv/config'
import { getCreateScheduledTransferAction, getExecuteScheduledTransferAction } from '@rhinestone/module-sdk'

const PRIVATE_KEY = process.env.PRIVATE_KEY as string
const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY as string

if (!PRIVATE_KEY || !PIMLICO_API_KEY) {
	throw new Error('Please set your private key in a .env file')
}

const publicClient = createPublicClient({
	transport: http('https://rpc.ankr.com/eth_sepolia'),
})

const kernelAccount = await signerToEcdsaKernelSmartAccount(publicClient, {
	entryPoint: ENTRYPOINT_ADDRESS_V07,
	signer: privateKeyToAccount(`0x${PRIVATE_KEY}`),
	address: '0x469874C9e35c19fbF2eaC9fbA3a1cc397023FF68',
})

const paymasterClient = createPimlicoPaymasterClient({
	entryPoint: ENTRYPOINT_ADDRESS_V07,
	transport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}`),
})

const bundlerClient = createPimlicoBundlerClient({
	entryPoint: ENTRYPOINT_ADDRESS_V07,
	transport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}`),
})

const client = createSmartAccountClient({
	entryPoint: ENTRYPOINT_ADDRESS_V07,
	account: kernelAccount,
	chain: sepolia,
	bundlerTransport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}`),
	middleware: {
		sponsorUserOperation: paymasterClient.sponsorUserOperation, // optional
		gasPrice: async () => (await bundlerClient.getUserOperationGasPrice()).fast, // if using pimlico bundler
	},
})

async function main() {
	const accountAddress = client.account.address
	console.log('My account:', accountAddress)

	const MTK_ADDRESS = '0x2bb2F59B2F316e1Fd68616b83920A1fe15E32a81'
	const recipient = '0xd78B5013757Ea4A7841811eF770711e6248dC282' // dev
	const startDate = Math.floor(Date.now() / 1000) + 60 // UNIX timestamp
	const executeInterval = 60 // 1 minute
	const numberOfExecutions = 2

	const scheduledTransferAction = getCreateScheduledTransferAction({
		scheduledTransfer: {
			token: {
				token_address: MTK_ADDRESS,
				decimals: 18,
			},
			amount: 1,
			recipient,
			startDate,
			repeatEvery: executeInterval,
			numberOfRepeats: numberOfExecutions,
		},
	})

	console.log('calldata', scheduledTransferAction.callData)

	const userOpHash = await client.sendUserOperation({
		userOperation: {
			callData: scheduledTransferAction.callData,
		},
	})

	console.log('UserOp hash:', userOpHash)
	console.log('Waiting for UserOp to complete...')

	const receipt = await bundlerClient.waitForUserOperationReceipt({
		hash: userOpHash,
		timeout: 0,
	})

	console.log('View completed UserOp here: https://jiffyscan.xyz/userOpHash/' + userOpHash)
	console.log(receipt)
}

main()
