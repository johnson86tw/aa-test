import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator'
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from '@zerodev/sdk'
import { KERNEL_V3_1 } from '@zerodev/sdk/constants'
import { http, createPublicClient, type Address, zeroAddress, encodeAbiParameters, encodePacked } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { ENTRYPOINT_ADDRESS_V07, bundlerActions } from 'permissionless'
import 'dotenv/config'
import { getScheduledTransferData, getScheduledTransfersExecutor } from '@rhinestone/module-sdk'
import { erc7579Actions } from 'permissionless/actions/erc7579'

// account: https://sepolia.etherscan.io/address/0x469874C9e35c19fbF2eaC9fbA3a1cc397023FF68

const MTK_ADDRESS = '0x2bb2F59B2F316e1Fd68616b83920A1fe15E32a81'
const recipient = '0x9e8f8C3Ad87dBE7ACFFC5f5800e7433c8dF409F2' // dev 2
const startDate = Math.floor(Date.now() / 1000) // UNIX timestamp
const executeInterval = 60 // 1 minute
const numberOfExecutions = 2

// ===============================================================================

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

	console.log('account', account.address)

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
	}).extend(erc7579Actions({ entryPoint }))

	const hook = '0x...'

	const scheduledTransfer = {
		startDate,
		repeatEvery: executeInterval,
		numberOfRepeats: numberOfExecutions,
		token: {
			token_address: MTK_ADDRESS as Address, // USDC
			decimals: 18,
		},
		amount: 1,
		recipient: recipient as Address,
	}

	const executionData = getScheduledTransferData({
		scheduledTransfer,
	})

	const module = getScheduledTransfersExecutor({
		executeInterval,
		numberOfExecutions,
		startDate,
		executionData,
		hook,
	})
	console.log('Uninstalling module...')

	const opHash = await kernelClient.uninstallModule({
		type: 'executor',
		address: '0xf1ae317941efeb1ffb103d959ef58170f1e577e0',
		context: encodePacked(
			['address', 'bytes'],
			[zeroAddress, encodeAbiParameters([{ type: 'bytes' }, { type: 'bytes' }], [module.initData || '0x', '0x'])],
		),
	})

	console.log('UserOp hash:', opHash)
	console.log('Waiting for UserOp to complete...')

	const bundlerClient = kernelClient.extend(bundlerActions(entryPoint))
	await bundlerClient.waitForUserOperationReceipt({
		hash: opHash,
		timeout: 0,
	})

	console.log('View completed UserOp here: https://jiffyscan.xyz/userOpHash/' + opHash)
}

main()
