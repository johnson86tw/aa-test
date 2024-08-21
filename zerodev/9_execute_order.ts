import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from '@zerodev/sdk'
import { KERNEL_V3_1 } from '@zerodev/sdk/constants'
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator'
import { http, createPublicClient, zeroAddress, encodeFunctionData, erc20Abi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { ENTRYPOINT_ADDRESS_V07, bundlerActions } from 'permissionless'
import 'dotenv/config'
import { getExecuteScheduledTransferAction } from '@rhinestone/module-sdk'

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

	const accountAddress = kernelClient.account.address
	console.log('My account:', accountAddress)

	const action = getExecuteScheduledTransferAction({
		jobId: 1,
	})

	const userOpHash = await kernelClient.sendUserOperation({
		userOperation: {
			callData: await kernelClient.account.encodeCallData({
				to: action.target,
				value: action.value as bigint,
				data: action.callData,
			}),
		},
	})

	console.log('UserOp hash:', userOpHash)
	console.log('Waiting for UserOp to complete...')

	const bundlerClient = kernelClient.extend(bundlerActions(entryPoint))
	await bundlerClient.waitForUserOperationReceipt({
		hash: userOpHash,
		timeout: 0,
	})

	console.log('View completed UserOp here: https://jiffyscan.xyz/userOpHash/' + userOpHash)
}

main()
