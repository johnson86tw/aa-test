import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator'
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from '@zerodev/sdk'
import { KERNEL_V3_1 } from '@zerodev/sdk/constants'
import { http, createPublicClient, type Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { ENTRYPOINT_ADDRESS_V07, bundlerActions } from 'permissionless'
import 'dotenv/config'
import { getScheduledTransferData, getScheduledTransfersExecutor } from '@rhinestone/module-sdk'

const PROJECT_ID = process.env.ZERODEV_PROJECT_ID as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string

if (!PROJECT_ID || !PRIVATE_KEY) {
	throw new Error('Please set your project id and private key in a .env file')
}

const BUNDLER_RPC = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID}`
const PAYMASTER_RPC = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID}`

const chain = sepolia
const entryPoint = ENTRYPOINT_ADDRESS_V07
const kernelVersion = KERNEL_V3_1

const main = async () => {
	const signer = privateKeyToAccount(`0x${PRIVATE_KEY}`)
	const publicClient = createPublicClient({
		transport: http(BUNDLER_RPC),
	})

	const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
		signer,
		entryPoint,
		kernelVersion,
	})

	// Construct a Kernel account
	const account = await createKernelAccount(publicClient, {
		plugins: {
			sudo: ecdsaValidator,
		},
		entryPoint,
		kernelVersion,
	})

	const kernelClient = createKernelAccountClient({
		account,
		chain,
		entryPoint,
		bundlerTransport: http(BUNDLER_RPC),
		middleware: {
			sponsorUserOperation: async ({ userOperation }) => {
				const zerodevPaymaster = createZeroDevPaymasterClient({
					chain,
					entryPoint,
					transport: http(PAYMASTER_RPC),
				})
				return zerodevPaymaster.sponsorUserOperation({
					userOperation,
					entryPoint,
				})
			},
		},
	})

	const scheduledTransfer = {
		startDate: 1710759572,
		repeatEvery: 60 * 60 * 24, // 1 day
		numberOfRepeats: 10,
		token: {
			token_address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Address, // USDC
			decimals: 6,
		},
		amount: 10,
		recipient: '0x96A4715280c3Dac3F3093d51aA278aA5eb60ffDE' as Address,
	}

	const executionData = getScheduledTransferData({
		scheduledTransfer,
	})

	const executeInterval = 60 * 60 * 24 // 1 day
	const numberOfExecutions = 10
	const startDate = 1710759572 // UNIX timestamp
	const hook = '0x...'

	const scheduledTransfersExecutor = getScheduledTransfersExecutor({
		executeInterval,
		numberOfExecutions,
		startDate,
		executionData,
		hook,
	})

	const opHash = await kernelClient.installModule({
		type: scheduledTransfersExecutor.type,
		address: scheduledTransfersExecutor.module,
		context: scheduledTransfersExecutor.data,
	})

	const bundlerClient = kernelClient.extend(bundlerActions(entryPoint))
	await bundlerClient.waitForUserOperationReceipt({
		hash: opHash,
		timeout: 100000,
	})
}

main()
