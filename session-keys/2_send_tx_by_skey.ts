import 'dotenv/config'
import { createKernelAccountClient, createZeroDevPaymasterClient } from '@zerodev/sdk'
import { KERNEL_V3_1 } from '@zerodev/sdk/constants'
import { http, createPublicClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { ENTRYPOINT_ADDRESS_V07, bundlerActions } from 'permissionless'
import { toECDSASigner } from '@zerodev/permissions/signers'
import { deserializePermissionAccount } from '@zerodev/permissions'
import approvalJson from './approval.json'

const PROJECT_ID = process.env.ZERODEV_PROJECT_ID as string
const PRIVATE_KEY = process.env.PRIVATE_KEY as string
const SESSION_PRIVATE_KEY = process.env.SESSION_PRIVATE_KEY as string

if (!PROJECT_ID || !PRIVATE_KEY || !SESSION_PRIVATE_KEY) {
	throw new Error('Please set your project id and private key in a .env file')
}

const BUNDLER_RPC = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID}`
const PAYMASTER_RPC = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID}`

const chain = sepolia
const entryPoint = ENTRYPOINT_ADDRESS_V07

const publicClient = createPublicClient({
	transport: http(BUNDLER_RPC),
})

const approval = approvalJson.approval

const main = async () => {
	const sessionKeySigner = toECDSASigner({
		signer: privateKeyToAccount(`0x${SESSION_PRIVATE_KEY}`),
	})

	console.log('sessionKeySigner', sessionKeySigner.account.address)

	const sessionKeyAccount = await deserializePermissionAccount(
		publicClient,
		entryPoint,
		KERNEL_V3_1,
		approval,
		sessionKeySigner,
	)

	console.log('sessionKeyAccount', sessionKeyAccount.address)

	const kernelPaymaster = createZeroDevPaymasterClient({
		entryPoint,
		chain,
		transport: http(PAYMASTER_RPC),
	})
	const kernelClient = createKernelAccountClient({
		entryPoint,
		account: sessionKeyAccount,
		chain,
		bundlerTransport: http(BUNDLER_RPC),
		middleware: {
			sponsorUserOperation: kernelPaymaster.sponsorUserOperation,
		},
	})

	const userOpHash = await kernelClient.sendUserOperation({
		userOperation: {
			callData: await sessionKeyAccount.encodeCallData({
				to: '0xd78B5013757Ea4A7841811eF770711e6248dC282',
				value: BigInt(0.01 * 1e18),
				data: '0x',
			}),
		},
	})

	console.log('userOp hash:', userOpHash)

	const bundlerClient = kernelClient.extend(bundlerActions(entryPoint))
	const _receipt = await bundlerClient.waitForUserOperationReceipt({
		hash: userOpHash,
		timeout: 0,
	})
	console.log({ txHash: _receipt.receipt.transactionHash })
}

main()
